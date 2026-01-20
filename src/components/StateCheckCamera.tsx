import { errorLogger } from "@services/errorLogger";
import { imageWorkerManager, ImageWorkerManager } from "@services/imageWorkerManager";
import { RefreshCw, X } from "lucide-react";
import React, { memo, useCallback, useRef, useState } from "react";
import { useCameraCapture } from "../hooks/useCameraCapture";
import { estimateFileSize } from "../utils/imageCompression";

interface Props {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
  autoStart?: boolean; // Optional - controls whether camera starts immediately
}

const StateCheckCamera: React.FC<Props> = ({ onCapture, onCancel, autoStart = false }) => {
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
  } = useCameraCapture(autoStart, {
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
    if (!mountedRef.current || !cameraState.isReady) {
      return;
    }

    setIsCapturing(true);

    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

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

        if (compressResult.blob) {
          URL.revokeObjectURL(URL.createObjectURL(compressResult.blob));
        }

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

      // Call callback and let hook handle cleanup
      if (mountedRef.current) {
        onCapture(compressedImage);
      }
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

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {cameraState.error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center p-6">
          <p className="mb-4 text-red-400">{cameraState.error}</p>
          <div className="flex gap-3">
            <button
              onClick={retryCamera}
              className="px-6 py-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
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
          <div className="relative flex-1 bg-black overflow-hidden">
            {cameraState.isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
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
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                willChange: "transform",
                contain: "strict",
                isolation: "isolate",
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-80 border-2 border-white/30 rounded-[3rem] mb-12 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white/80 text-xs px-3 py-1 rounded-full">
                  Face Here
                </div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-3xl"></div>
              </div>

              <div className="bg-black/60 px-6 py-3 rounded-2xl text-white text-center max-w-xs">
                <p className="font-medium text-lg">Relax your face</p>
                <p className="text-white/70 text-sm">
                  Let your jaw drop slightly. Look straight ahead.
                </p>
                {!cameraState.isReady && (
                  <p className="text-yellow-400 text-xs mt-2">Waiting for camera...</p>
                )}
              </div>
            </div>

            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors z-20"
            >
              <X size={24} />
            </button>

            {isCapturing && imageSize && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 text-white text-xs rounded-full z-20 animate-pulse">
                Image: {imageSize}
              </div>
            )}
          </div>

          <div className="bg-slate-900 px-6 py-8 pb-12 flex flex-col items-center gap-6 rounded-t-3xl -mt-6 relative z-10">
            <div className="w-12 h-1 bg-slate-700 rounded-full mb-2"></div>

            <div className="flex items-center justify-between w-full max-w-xs px-4">
              <button
                onClick={toggleCamera}
                disabled={cameraState.isInitializing || !cameraState.isReady}
                className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 active:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Switch camera"
              >
                <RefreshCw size={20} />
              </button>

              <button
                onClick={capture}
                disabled={isCapturing || !cameraState.isReady}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div
                  className={`w-16 h-16 bg-white rounded-full transition-transform duration-100 ${
                    isCapturing ? "scale-90 animate-pulse" : "group-active:scale-90"
                  }`}
                ></div>
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

// Memoize to prevent re-renders from parent mouse events/hover states
export default memo(StateCheckCamera);
