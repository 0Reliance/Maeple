import { RefreshCw, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { estimateFileSize } from '../utils/imageCompression';
import { errorLogger } from '@services/errorLogger';
import { imageWorkerManager, ImageWorkerManager } from '@services/imageWorkerManager';

interface Props {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const StateCheckCamera: React.FC<Props> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageSize, setImageSize] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [currentResolution, setCurrentResolution] = useState<'HD' | 'SD' | 'Low'>('HD');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const mountedRef = useRef(true);
  const imageDataRef = useRef<ImageData | null>(null);
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
      
      // Cleanup ImageData to prevent memory leaks
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
    // Stop existing camera first
    stopCamera();
    
    // Check if component is still mounted
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
      
      // Check if component is still mounted
      if (!mountedRef.current) {
        // Cleanup stream if component unmounted during async operation
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
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }

          const handleReady = () => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              video.removeEventListener('loadedmetadata', handleReady);
              setIsVideoReady(true);
              console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
              resolve();
            }
          };

          video.addEventListener('loadedmetadata', handleReady);
          
          // Check if already ready
          if (video.readyState >= 2) {
            video.removeEventListener('loadedmetadata', handleReady);
            setIsVideoReady(true);
            console.log(`Video already ready: ${video.videoWidth}x${video.videoHeight}`);
            resolve();
          }
          
          // Timeout after 5 seconds
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', handleReady);
            reject(new Error('Video ready timeout'));
          }, 5000);
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsInitializing(false);
      
      // Check if component is still mounted
      if (!mountedRef.current) return;
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError("Camera permission denied. Please enable camera access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found. Please ensure your device has a working camera.");
        } else if (err.name === 'NotReadableError') {
          if (resolutionIndex < RESOLUTION_OPTIONS.length - 1) {
            console.warn(`Camera not readable at ${RESOLUTION_OPTIONS[resolutionIndex].label}, trying ${RESOLUTION_OPTIONS[resolutionIndex + 1].label}`);
            await startCamera(resolutionIndex + 1);
            return;
          }
          setError("Camera is already in use or not accessible. Try closing other applications or restarting your camera.");
        } else if (err.name === 'OverconstrainedError') {
          if (resolutionIndex < RESOLUTION_OPTIONS.length - 1) {
            console.warn(`Camera resolution ${RESOLUTION_OPTIONS[resolutionIndex].label} failed, trying ${RESOLUTION_OPTIONS[resolutionIndex + 1].label}`);
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
    const triggerHaptic = () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    };
    triggerHaptic();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Capture image with proper validation
  const capture = useCallback(async () => {
    // Check if component is still mounted
    if (!mountedRef.current) return;
    
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Validate video is ready
      if (!isVideoReady || video.readyState < 2) {
        console.error('Video not ready for capture');
        setError('Camera not ready. Please wait a moment and try again.');
        return;
      }
      
      // Validate video dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('Invalid video dimensions:', video.videoWidth, video.videoHeight);
        setError('Unable to capture image. Camera dimensions are invalid.');
        return;
      }
      
      setIsCapturing(true);
      
      const triggerHaptic = () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      };
      triggerHaptic();
      
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Mirror the image for front camera
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const originalImage = canvas.toDataURL('image/png');
          const originalSize = estimateFileSize(originalImage);
          
          console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`);
          
          // Check if component is still mounted before compression
          if (!mountedRef.current) {
            console.warn('Component unmounted during compression');
            return;
          }
          
          // Use Web Worker for compression (off main thread)
          let compressedImage: string;
          
          try {
            // First resize the image using worker
            const img = await loadImage(originalImage);
            
            // Convert to ImageData using static method
            const imageData = await ImageWorkerManager.imageToImageData(img);
            
            // Store reference for cleanup
            imageDataRef.current = imageData;
            
            // Resize to 512x512 max
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
            
            // Compress the resized image
            const compressResult = await imageWorkerManager.compressImage(
              resizedResult.imageData!,
              0.85,
              'image/webp'
            );
            
            // Convert blob to data URL
            compressedImage = await blobToDataURL(compressResult.blob!);
            
            // Clean up
            if (compressResult.blob) {
              URL.revokeObjectURL(URL.createObjectURL(compressResult.blob));
            }
            
            // Clear ImageData reference to free memory
            if (imageDataRef.current) {
              imageDataRef.current = null;
            }
          } catch (workerError) {
            // Fallback to main thread compression if worker fails
            errorLogger.warning('Worker compression failed, falling back to main thread', { error: workerError });
            
            const { compressImage: mainThreadCompress } = await import('../utils/imageCompression');
            compressedImage = await mainThreadCompress(originalImage, {
              maxWidth: 512,
              maxHeight: 512,
              quality: 0.85,
              format: 'image/webp'
            });
          }
          
          // Check if component is still mounted after compression
          if (!mountedRef.current) {
            console.warn('Component unmounted after compression');
            // Revoke object URL to free memory
            if (originalImage.startsWith('blob:')) {
              URL.revokeObjectURL(originalImage);
            }
            // Clear ImageData reference
            if (imageDataRef.current) {
              imageDataRef.current = null;
            }
            return;
          }
          
          const compressedSize = estimateFileSize(compressedImage);
          const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);
          
          console.log(`Compressed image size: ${(compressedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
          setImageSize(`${(compressedSize / 1024).toFixed(1)} KB`);
          
          // Only call callback if component is still mounted
          if (mountedRef.current) {
            onCapture(compressedImage);
            stopCamera();
          }
        }
      } catch (err) {
        console.error('Capture error:', err);
        if (mountedRef.current) {
          setError('Failed to capture image. Please try again.');
        }
      } finally {
        if (mountedRef.current) {
          setIsCapturing(false);
        }
      }
    }
  }, [isVideoReady, facingMode, onCapture, stopCamera]);

  // Get face guide size based on orientation
  const getFaceGuideSize = useCallback(() => {
    if (typeof window !== 'undefined') {
      const isPortrait = window.innerHeight > window.innerWidth;
      return isPortrait ? 'w-48 h-64' : 'w-64 h-80';
    }
    return 'w-64 h-80';
  }, []);

  // Initialize camera on mount and when facing mode changes
  useEffect((): (() => void) => {
    mountedRef.current = true;
    startCamera(0);
    
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [facingMode]); // Only re-run when facing mode changes

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center p-6">
          <p className="mb-4 text-red-400">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={retryCamera}
              disabled={retryCount >= MAX_RETRIES}
              className="px-6 py-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Retry {retryCount > 0 && `(${retryCount}/${MAX_RETRIES})`}
            </button>
            <button 
              onClick={onCancel} 
              className="px-6 py-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
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
          <div className="relative flex-1 bg-black overflow-hidden">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className={`${getFaceGuideSize()} border-2 border-white/30 rounded-[3rem] mb-12 relative transition-all duration-300 ${!isVideoReady ? 'opacity-50' : ''}`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-md">
                  Face Here
                </div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-3xl"></div>
              </div>
              
              <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl text-white text-center max-w-xs">
                <p className="font-medium text-lg">Relax your face</p>
                <p className="text-white/70 text-sm">Let your jaw drop slightly. Look straight ahead.</p>
                {!isVideoReady && (
                  <p className="text-yellow-400 text-xs mt-2">Waiting for camera...</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-3 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md transition-colors z-20"
            >
              <X size={24} />
            </button>

            {isCapturing && imageSize && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 text-white text-xs rounded-full backdrop-blur-md z-20 animate-pulse">
                Image: {imageSize}
              </div>
            )}
          </div>

          <div className="bg-slate-900 px-6 py-8 pb-12 flex flex-col items-center gap-6 rounded-t-3xl -mt-6 relative z-10">
            <div className="w-12 h-1 bg-slate-700 rounded-full mb-2"></div>
            
            <div className="flex items-center justify-between w-full max-w-xs px-4">
              <button 
                onClick={toggleCamera}
                disabled={isInitializing || !isVideoReady}
                className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 active:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Switch camera"
              >
                <RefreshCw size={20} />
              </button>

              <button 
                onClick={capture}
                disabled={isCapturing || !isVideoReady}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`w-16 h-16 bg-white rounded-full transition-transform duration-100 ${
                  isCapturing ? 'scale-90 animate-pulse' : 'group-active:scale-90'
                }`}></div>
              </button>

              <div className="w-12"></div>
            </div>
            
            <p className="text-slate-500 text-xs">
              Photos are compressed locally for faster analysis and never stored without permission.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default StateCheckCamera;