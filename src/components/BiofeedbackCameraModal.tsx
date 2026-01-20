import { errorLogger } from "@services/errorLogger";
import { imageWorkerManager, ImageWorkerManager } from "@services/imageWorkerManager";
import { CheckCircle2, RefreshCw, X } from "lucide-react";
import React, { memo, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCameraCapture } from "../hooks/useCameraCapture";
import { estimateFileSize } from "../utils/imageCompression";

interface Props {
  isOpen: boolean;
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const BiofeedbackCameraModal: React.FC<Props> = ({ isOpen, onCapture, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const imageDataRef = useRef<ImageData | null>(null);

  // Use the stable camera capture hook
  const {
    videoRef,
    canvasRef,
    state: cameraState,
    capture: cameraCaptureRaw,
    switchCamera,
    retry: retryCamera,
    facingMode,
  } = useCameraCapture(isOpen, {
    facingMode: "user",
    maxRetries: 3,
    resolutionPresets: [
      { label: "HD", width: 1280, height: 720 },
      { label: "SD", width: 720, height: 480 },
      { label: "Low", width: 480, height: 360 },
    ],
  });

  // Local UI states
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageSize, setImageSize] = useState<string>("");
  const [showCaptureSuccess, setShowCaptureSuccess] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Helper function to load image from data URL
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });
  };

  // Helper function to convert blob to data URL
  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.readAsDataURL(blob);
    });
  };

  // Toggle camera facing mode
  const toggleCamera = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
    switchCamera();
  }, [switchCamera]);

  // Capture image with proper validation and compression
  const capture = useCallback(async () => {
    if (!mountedRef.current || !cameraState.isReady) return;

    setIsCapturing(true);

    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    // Show flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 100);

    try {
      // Get raw image from camera hook
      const rawImage = await cameraCaptureRaw();

      if (!rawImage || !mountedRef.current) {
        setIsCapturing(false);
        return;
      }

      const originalSize = estimateFileSize(rawImage);
      console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`);

      let compressedImage: string;

      try {
        const img = await loadImage(rawImage);
        const imageData = await ImageWorkerManager.imageToImageData(img);
        imageDataRef.current = imageData;

        // Constrain to 512px max dimension
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
          "image/webp"
        );

        compressedImage = await blobToDataURL(compressResult.blob!);

        // Note: No URL cleanup needed - blob was converted directly to data URL

        if (imageDataRef.current) {
          imageDataRef.current = null;
        }
      } catch (workerError) {
        errorLogger.warning("Worker compression failed, falling back to main thread", {
          error: workerError,
        });

        const { compressImage: mainThreadCompress } = await import("../utils/imageCompression");
        compressedImage = await mainThreadCompress(rawImage, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.85,
          format: "image/webp",
        });
      }

      if (!mountedRef.current) {
        console.warn("Component unmounted after compression");
        if (rawImage.startsWith("blob:")) {
          URL.revokeObjectURL(rawImage);
        }
        if (imageDataRef.current) {
          imageDataRef.current = null;
        }
        return;
      }

      const compressedSize = estimateFileSize(compressedImage);
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);

      console.log(
        `Compressed image size: ${(compressedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`
      );
      setImageSize(`${(compressedSize / 1024).toFixed(1)} KB`);

      // Show success feedback
      setShowCaptureSuccess(true);

      // Small delay before proceeding
      setTimeout(() => {
        if (mountedRef.current) {
          onCapture(compressedImage);
        }
      }, 800);
    } catch (err) {
      console.error("Capture error:", err);
      if (mountedRef.current) {
        setIsCapturing(false);
      }
    }
  }, [cameraState.isReady, cameraCaptureRaw, onCapture]);

  // Cleanup on mount/unmount
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      imageWorkerManager.cleanup();
      if (imageDataRef.current) {
        imageDataRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Render as portal to avoid being constrained by parent containers
  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{
        // Ensure this modal captures ALL pointer events and nothing passes through
        pointerEvents: "auto",
        // CSS isolation prevents parent component re-renders from affecting this subtree
        isolation: "isolate",
        // Contain layout changes within this element
        contain: "layout style paint",
      }}
      // Only prevent mousemove propagation during active camera to avoid parent re-renders
      // Other mouse events are preserved for accessibility tools
      onMouseMove={cameraState.isReady && !isCapturing ? e => e.stopPropagation() : undefined}
    >
      {cameraState.error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <X size={32} className="text-red-400" />
          </div>
          <p className="mb-6 text-red-400 text-lg">{cameraState.error}</p>
          <div className="flex gap-3">
            <button
              onClick={retryCamera}
              className="px-8 py-3 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors font-medium text-white"
            >
              Retry
            </button>
            <button
              onClick={onCancel}
              className="px-8 py-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors font-medium text-white"
            >
              Close
            </button>
          </div>
          {cameraState.currentResolution && cameraState.currentResolution !== "HD" && (
            <p className="mt-4 text-sm text-slate-400">
              Using {cameraState.currentResolution} resolution
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Video Container - Full Screen with stable dimensions */}
          <div className="relative flex-1 bg-black overflow-hidden" style={{ minHeight: "60vh" }}>
            {cameraState.isInitializing && (
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
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                // GPU optimization to prevent re-paints from affecting video
                willChange: "auto",
                contain: "layout paint",
                isolation: "isolate",
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-80 border-3 border-white/40 rounded-[3rem] mb-12 relative">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white/70 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white/70 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white/70 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white/70 rounded-br-3xl"></div>

                {/* Label */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white/90 text-sm px-4 py-2 rounded-full whitespace-nowrap">
                  Position face in frame
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-black/80 px-8 py-4 rounded-2xl text-white text-center max-w-sm border border-white/10">
                <p className="font-semibold text-lg mb-1">Relax your face</p>
                <p className="text-white/70 text-sm">
                  Let your jaw drop slightly. Look directly at the camera.
                </p>
                {cameraState.isInitializing && (
                  <p className="text-yellow-400 text-xs mt-3 animate-pulse">
                    Waiting for camera to initialize...
                  </p>
                )}
                {!cameraState.isReady &&
                  !cameraState.isInitializing &&
                  cameraState.error === null && (
                    <p className="text-yellow-400 text-xs mt-3 animate-pulse">Camera loading...</p>
                  )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors z-30 border border-white/10"
              aria-label="Close camera"
            >
              <X size={24} />
            </button>

            {/* Flash Effect */}
            {showFlash && <div className="absolute inset-0 bg-white z-50 animate-pulse"></div>}

            {/* Image Size Indicator */}
            {isCapturing && imageSize && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 text-white text-xs rounded-full z-30 border border-white/10 animate-pulse">
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
                disabled={cameraState.isInitializing || !cameraState.isReady || isCapturing}
                className="p-4 rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 active:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
                title="Switch camera"
                aria-label="Switch camera"
              >
                <RefreshCw size={20} />
              </button>

              {/* Main Capture Button */}
              <button
                onClick={capture}
                disabled={cameraState.isInitializing || !cameraState.isReady || isCapturing}
                className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center relative group transition-opacity disabled:opacity-30 disabled:cursor-not-allowed bg-transparent"
                aria-label="Take photo"
              >
                <div
                  className={`w-20 h-20 bg-white rounded-full transition-transform duration-200 ${
                    isCapturing ? "scale-75" : "group-hover:scale-105"
                  } shadow-lg`}
                ></div>
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

// Memoize to prevent re-renders from parent mouse events/hover states
export default memo(BiofeedbackCameraModal);
