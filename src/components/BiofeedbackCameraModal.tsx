import { RefreshCw, X, Camera as CameraIcon, CheckCircle2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { estimateFileSize } from '../utils/imageCompression';
import { errorLogger } from '@services/errorLogger';
import { imageWorkerManager, ImageWorkerManager } from '@services/imageWorkerManager';

interface Props {
  isOpen: boolean;
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const BiofeedbackCameraModal: React.FC<Props> = ({ isOpen, onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageSize, setImageSize] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [currentResolution, setCurrentResolution] = useState<'HD' | 'SD' | 'Low'>('HD');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCaptureSuccess, setShowCaptureSuccess] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const mountedRef = useRef(true);
  const imageDataRef = useRef<ImageData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const MAX_RETRIES = 3;

  // Helper function to load image from data URL
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  };
  
  // Helper function to convert blob to data URL
  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  };
  
  // Cleanup worker on unmount and release memory
  useEffect(() => {
    return () => {
      imageWorkerManager.cleanup();
      if (imageDataRef.current) {
        imageDataRef.current = null;
      }
    };
  }, []);

  const RESOLUTION_OPTIONS = [
    { label: 'HD', ideal: 1280 },
    { label: 'SD', ideal: 720 },
    { label: 'Low', ideal: 480 },
  ] as const;

  // Stop camera and clean up resources
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      setStream(null);
      setIsVideoReady(false);
    }
  }, [stream]);

  // Start camera with proper cleanup
  const startCamera = useCallback(async (resolutionIndex: number = 0) => {
    stopCamera();
    
    if (!mountedRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      const resolution = RESOLUTION_OPTIONS[Math.min(resolutionIndex, RESOLUTION_OPTIONS.length - 1)];
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: resolution.ideal },
          height: { ideal: Math.round(resolution.ideal * 9/16) }
        },
        audio: false
      };
      
      console.log(`Starting camera at ${resolution.label} resolution...`);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!mountedRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      setStream(mediaStream);
      setRetryCount(0);
      setCurrentResolution(resolution.label);
      setError(null);
      setIsInitializing(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }

          const handleReady = () => {
            if (video.readyState >= 2) {
              video.removeEventListener('loadedmetadata', handleReady);
              setIsVideoReady(true);
              console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
              resolve();
            }
          };

          video.addEventListener('loadedmetadata', handleReady);
          
          if (video.readyState >= 2) {
            video.removeEventListener('loadedmetadata', handleReady);
            setIsVideoReady(true);
            console.log(`Video already ready: ${video.videoWidth}x${video.videoHeight}`);
            resolve();
          }
          
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleReady);
            reject(new Error('Video ready timeout'));
          }, 5000);
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsInitializing(false);
      
      if (!mountedRef.current) return;
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError("Camera permission denied. Please enable camera access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found. Please ensure your device has a working camera.");
        } else if (err.name === 'NotReadableError') {
          if (resolutionIndex < RESOLUTION_OPTIONS.length - 1) {
            await startCamera(resolutionIndex + 1);
            return;
          }
          setError("Camera is already in use or not accessible. Try closing other applications or restarting your camera.");
        } else if (err.name === 'OverconstrainedError') {
          if (resolutionIndex < RESOLUTION_OPTIONS.length - 1) {
            await startCamera(resolutionIndex + 1);
            return;
          }
          setError("Camera does not support requested resolution.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Unable to access camera. Please try again.");
      }
    }
  }, [facingMode, stopCamera]);

  // Retry camera with incremented count
  const retryCamera = useCallback(async () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    
    if (retryCount < MAX_RETRIES) {
      await startCamera(0);
    } else {
      setError("Maximum retry attempts reached. Please refresh page.");
    }
  }, [retryCount, startCamera]);

  // Toggle camera facing mode
  const toggleCamera = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Capture image with proper validation
  const capture = useCallback(async () => {
    if (!mountedRef.current) return;
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!isVideoReady || video.readyState < 2) {
        console.error('Video not ready for capture');
        setError('Camera not ready. Please wait a moment and try again.');
        return;
      }
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Invalid video dimensions:', video.videoWidth, video.videoHeight);
        setError('Unable to capture image. Camera dimensions are invalid.');
        return;
      }
      
      setIsCapturing(true);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Show flash effect
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 100);
      
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const originalImage = canvas.toDataURL('image/png');
          const originalSize = estimateFileSize(originalImage);
          
          console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`);
          
          if (!mountedRef.current) {
            console.warn('Component unmounted during compression');
            return;
          }
          
          let compressedImage: string;
          
          try {
            const img = await loadImage(originalImage);
            const imageData = await ImageWorkerManager.imageToImageData(img);
            imageDataRef.current = imageData;
            
            const maxDimension = 512;
            let targetWidth = imageData.width;
            let targetHeight = imageData.height;
            
            if (targetWidth > maxDimension || targetHeight > maxDimension) {
              const ratio = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
              targetWidth = Math.floor(targetWidth * ratio);
              targetHeight = Math.floor(targetHeight * ratio);
            }
            
            const resizedResult = await imageWorkerManager.resizeImage(
              imageData,
              targetWidth,
              targetHeight
            );
            
            const compressResult = await imageWorkerManager.compressImage(
              resizedResult.imageData!,
              0.85,
              'image/webp'
            );
            
            compressedImage = await blobToDataURL(compressResult.blob!);
            
            if (compressResult.blob) {
              URL.revokeObjectURL(URL.createObjectURL(compressResult.blob));
            }
            
            if (imageDataRef.current) {
              imageDataRef.current = null;
            }
          } catch (workerError) {
            errorLogger.warning('Worker compression failed, falling back to main thread', { error: workerError });
            
            const { compressImage: mainThreadCompress } = await import('../utils/imageCompression');
            compressedImage = await mainThreadCompress(originalImage, {
              maxWidth: 512,
              maxHeight: 512,
              quality: 0.85,
              format: 'image/webp'
            });
          }
          
          if (!mountedRef.current) {
            console.warn('Component unmounted after compression');
            if (originalImage.startsWith('blob:')) {
              URL.revokeObjectURL(originalImage);
            }
            if (imageDataRef.current) {
              imageDataRef.current = null;
            }
            return;
          }
          
          const compressedSize = estimateFileSize(compressedImage);
          const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);
          
          console.log(`Compressed image size: ${(compressedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
          setImageSize(`${(compressedSize / 1024).toFixed(1)} KB`);
          
          // Show success feedback
          setShowCaptureSuccess(true);
          
          // Small delay before proceeding
          setTimeout(() => {
            if (mountedRef.current) {
              onCapture(compressedImage);
              stopCamera();
            }
          }, 800);
        }
      } catch (err) {
        console.error('Capture error:', err);
        if (mountedRef.current) {
          setError('Failed to capture image. Please try again.');
          setIsCapturing(false);
        }
      }
    }
  }, [isVideoReady, facingMode, onCapture, stopCamera]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      mountedRef.current = true;
      startCamera(0);
    }
    
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [isOpen]); // Only run when isOpen changes

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (isOpen) {
      startCamera(0);
    }
  }, [facingMode]); // Re-run when facing mode changes

  if (!isOpen) return null;

  // Render as portal to avoid being constrained by parent containers
  return createPortal(
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
    >
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <X size={32} className="text-red-400" />
          </div>
          <p className="mb-6 text-red-400 text-lg">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={retryCamera}
              disabled={retryCount >= MAX_RETRIES}
              className="px-8 py-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white"
            >
              Retry {retryCount > 0 && `(${retryCount}/${MAX_RETRIES})`}
            </button>
            <button 
              onClick={onCancel} 
              className="px-8 py-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors font-medium text-white"
            >
              Close
            </button>
          </div>
          {currentResolution && currentResolution !== 'HD' && (
            <p className="mt-4 text-sm text-slate-400">
              Using {currentResolution} resolution
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Video Container - Full Screen */}
          <div className="relative flex-1 bg-black overflow-hidden">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white text-sm">Initializing camera...</p>
                </div>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-contain ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Face Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-80 border-3 border-white/40 rounded-[3rem] mb-12 relative transition-all duration-300">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white/70 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white/70 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white/70 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white/70 rounded-br-3xl"></div>
                
                {/* Label */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-white/90 text-sm px-4 py-2 rounded-full backdrop-blur-md whitespace-nowrap">
                  Position face in frame
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl text-white text-center max-w-sm border border-white/10">
                <p className="font-semibold text-lg mb-1">Relax your face</p>
                <p className="text-white/70 text-sm">Let your jaw drop slightly. Look directly at the camera.</p>
                {!isVideoReady && (
                  <p className="text-yellow-400 text-xs mt-3 animate-pulse">Waiting for camera to initialize...</p>
                )}
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-md transition-all z-30 border border-white/10"
              aria-label="Close camera"
            >
              <X size={24} />
            </button>

            {/* Flash Effect */}
            {showFlash && (
              <div className="absolute inset-0 bg-white z-50 animate-pulse"></div>
            )}

            {/* Image Size Indicator */}
            {isCapturing && imageSize && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 text-white text-xs rounded-full backdrop-blur-md z-30 border border-white/10 animate-pulse">
                Capturing: {imageSize}
              </div>
            )}

            {/* Success Animation */}
            {showCaptureSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 animate-fadeIn">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 size={48} className="text-white" />
                  </div>
                  <p className="text-white text-xl font-semibold">Image captured!</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls - Bottom Bar */}
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent px-6 py-8 pb-12 flex flex-col items-center gap-6 relative z-30">
            {/* Capture Button */}
            <div className="flex items-center justify-center gap-8 w-full max-w-sm">
              {/* Camera Switch Button */}
              <button 
                onClick={toggleCamera}
                disabled={isInitializing || !isVideoReady || isCapturing}
                className="p-4 rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 active:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 backdrop-blur-md"
                title="Switch camera"
                aria-label="Switch camera"
              >
                <RefreshCw size={20} />
              </button>

              {/* Main Capture Button */}
              <button 
                onClick={capture}
                disabled={isInitializing || !isVideoReady || isCapturing}
                className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center relative group transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
                aria-label="Take photo"
              >
                <div className={`w-20 h-20 bg-white rounded-full transition-all duration-200 ${
                  isCapturing ? 'scale-75' : 'group-hover:scale-105'
                } shadow-lg`}></div>
              </button>

              {/* Spacer for balance */}
              <div className="w-12"></div>
            </div>
            
            {/* Info Text */}
            <p className="text-slate-400 text-xs text-center px-4">
              Photos are compressed locally for faster analysis and never stored without permission.
            </p>
          </div>
        </>
      )}
    </div>,
    document.body
  );
};

export default BiofeedbackCameraModal;