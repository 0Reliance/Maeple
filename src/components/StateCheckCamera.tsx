import { RefreshCw, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { compressImage, estimateFileSize } from '../utils/imageCompression';

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
  const MAX_RETRIES = 3;

  const RESOLUTION_OPTIONS = [
    { label: 'HD', ideal: 1280 },
    { label: 'SD', ideal: 720 },
    { label: 'Low', ideal: 480 },
  ] as const;

  useEffect(() => {
    startCamera(0);
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async (resolutionIndex: number = 0) => {
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
      setStream(mediaStream);
      setRetryCount(0);
      setCurrentResolution(resolution.label);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      
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
          setError("Camera is already in use or not accessible. Try closing other applications or restarting the camera.");
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
  };

  const retryCamera = async () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    
    if (retryCount < MAX_RETRIES) {
      await startCamera(0);
    } else {
      setError("Maximum retry attempts reached. Please refresh page.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const toggleCamera = () => {
    triggerHaptic();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      setIsCapturing(true);
      triggerHaptic();
      
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const originalImage = canvas.toDataURL('image/png');
          const originalSize = estimateFileSize(originalImage);
          
          console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`);
          
          const compressedImage = await compressImage(originalImage, {
            maxWidth: 512,
            maxHeight: 512,
            quality: 0.85,
            format: 'image/webp'
          });
          
          const compressedSize = estimateFileSize(compressedImage);
          const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);
          
          console.log(`Compressed image size: ${(compressedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
          setImageSize(`${(compressedSize / 1024).toFixed(1)} KB`);
          
          onCapture(compressedImage);
          stopCamera();
        }
      } catch (err) {
        console.error('Capture error:', err);
        setError('Failed to capture image. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const getFaceGuideSize = () => {
    if (typeof window !== 'undefined') {
      const isPortrait = window.innerHeight > window.innerWidth;
      return isPortrait ? 'w-48 h-64' : 'w-64 h-80';
    }
    return 'w-64 h-80';
  };

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
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className={`${getFaceGuideSize()} border-2 border-white/30 rounded-[3rem] mb-12 relative transition-all duration-300`}>
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
                className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 active:bg-slate-700 transition-colors"
                title="Switch camera"
              >
                <RefreshCw size={20} />
              </button>

              <button 
                onClick={capture}
                disabled={isCapturing}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group transition-all disabled:opacity-50"
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