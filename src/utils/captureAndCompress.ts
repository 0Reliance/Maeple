/**
 * Shared image capture compression pipeline.
 * Extracted from BiofeedbackCameraModal and StateCheckCamera
 * to eliminate code duplication.
 */
import { errorLogger } from "@services/errorLogger";
import { imageWorkerManager, ImageWorkerManager } from "@services/imageWorkerManager";

import { estimateFileSize } from "./imageCompression";

/** Load an image element from a data URL */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
};

/** Convert a Blob to a data URL */
const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
};

export interface CompressionResult {
  compressedImage: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercent: number;
}

/**
 * Compress a raw camera image to a smaller format suitable for AI analysis.
 * Uses web worker pipeline with main-thread fallback.
 *
 * @param rawImage - base64 data URL from canvas capture
 * @param maxDimension - maximum width/height in pixels (default 512)
 * @param quality - JPEG/WebP quality 0-1 (default 0.85)
 * @param format - output MIME type (default "image/webp")
 */
export async function compressCapturedImage(
  rawImage: string,
  {
    maxDimension = 512,
    quality = 0.85,
    format = "image/webp" as const,
  }: {
    maxDimension?: number;
    quality?: number;
    format?: "image/webp" | "image/jpeg" | "image/png";
  } = {}
): Promise<CompressionResult> {
  const originalSize = estimateFileSize(rawImage);
  const originalSizeKB = originalSize / 1024;
  let compressedImage: string;

  try {
    const img = await loadImage(rawImage);
    const imageData = await ImageWorkerManager.imageToImageData(img);

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
      quality,
      format === "image/png" ? "image/webp" : format
    );

    compressedImage = await blobToDataURL(compressResult.blob!);
  } catch (workerError) {
    errorLogger.warning("Worker compression failed, falling back to main thread", {
      error: workerError,
    });

    const { compressImage: mainThreadCompress } = await import("./imageCompression");
    compressedImage = await mainThreadCompress(rawImage, {
      maxWidth: maxDimension,
      maxHeight: maxDimension,
      quality,
      format,
    });
  }

  const compressedSize = estimateFileSize(compressedImage);
  const compressedSizeKB = compressedSize / 1024;
  const reductionPercent = Math.round((1 - compressedSize / originalSize) * 100);

  console.log(
    `[Compress] ${originalSizeKB.toFixed(1)} KB → ${compressedSizeKB.toFixed(1)} KB (${reductionPercent}% reduction)`
  );

  return { compressedImage, originalSizeKB, compressedSizeKB, reductionPercent };
}
