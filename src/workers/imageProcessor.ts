/**
 * Image Processor Web Worker
 * 
 * Offloads CPU-intensive image processing operations to a separate thread
 * to prevent main thread blocking during BioFeedback captures.
 * 
 * Operations:
 * - Image resizing
 * - Edge detection (Sobel operator)
 * - Image compression
 * - Canvas operations
 */

import { v4 as uuidv4 } from 'uuid';

// Types for worker messages
interface ProcessImageRequest {
  id: string;
  type: 'resize' | 'edgeDetection' | 'compress';
  imageData: ImageData;
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/webp';
  };
}

interface ProcessImageResponse {
  id: string;
  type: 'resize' | 'edgeDetection' | 'compress';
  result: {
    imageData?: ImageData;
    blob?: Blob;
    width: number;
    height: number;
    processingTime: number;
  };
  error?: string;
}

interface ErrorResponse {
  id: string;
  error: string;
}

/**
 * Resizes image data to target dimensions
 */
function resizeImage(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(targetWidth, targetHeight);
  
  // Simple scaling algorithm (nearest neighbor for speed)
  const scaleX = width / targetWidth;
  const scaleY = height / targetHeight;
  
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const sourceX = Math.floor(x * scaleX);
      const sourceY = Math.floor(y * scaleY);
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;
      
      result.data[targetIndex] = data[sourceIndex];           // R
      result.data[targetIndex + 1] = data[sourceIndex + 1];   // G
      result.data[targetIndex + 2] = data[sourceIndex + 2];   // B
      result.data[targetIndex + 3] = data[sourceIndex + 3];   // A
    }
  }
  
  return result;
}

/**
 * Applies Sobel edge detection to image data
 */
function applyEdgeDetection(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const result = new ImageData(width, height);
  const grayscale: number[] = new Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < width * height; i++) {
    const index = i * 4;
    // Standard grayscale: 0.299*R + 0.587*G + 0.114*B
    grayscale[i] = Math.round(
      data[index] * 0.299 +
      data[index + 1] * 0.587 +
      data[index + 2] * 0.114
    );
  }
  
  // Apply Sobel operator
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // Apply convolution
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayscale[(y + ky) * width + (x + kx)];
          gx += pixel * sobelX[ky + 1][kx + 1];
          gy += pixel * sobelY[ky + 1][kx + 1];
        }
      }
      
      // Calculate magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const clamped = Math.min(255, Math.max(0, magnitude));
      
      const index = (y * width + x) * 4;
      result.data[index] = clamped;           // R
      result.data[index + 1] = clamped;       // G
      result.data[index + 2] = clamped;       // B
      result.data[index + 3] = 255;           // A
    }
  }
  
  return result;
}

/**
 * Compresses image data to a blob
 */
async function compressImage(
  imageData: ImageData,
  quality: number = 0.7,
  format: 'image/jpeg' | 'image/webp' = 'image/webp'
): Promise<Blob> {
  // Create canvas in worker
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create 2D context in worker');
  }
  
  // Draw image data to canvas
  ctx.putImageData(imageData, 0, 0);
  
  // Convert to blob
  const blob = await canvas.convertToBlob({
    type: format,
    quality: quality,
  });
  
  return blob;
}

/**
 * Main worker message handler
 */
self.onmessage = async (event: MessageEvent<ProcessImageRequest>) => {
  const { id, type, imageData, options = {} } = event.data;
  const startTime = performance.now();
  
  try {
    let result: ImageData | Blob;
    let resultWidth = imageData.width;
    let resultHeight = imageData.height;
    
    switch (type) {
      case 'resize':
        if (!options.width || !options.height) {
          throw new Error('Resize requires width and height options');
        }
        result = resizeImage(imageData, options.width, options.height);
        resultWidth = options.width;
        resultHeight = options.height;
        break;
        
      case 'edgeDetection':
        result = applyEdgeDetection(imageData);
        break;
        
      case 'compress':
        const blob = await compressImage(
          imageData,
          options.quality,
          options.format
        );
        const response: ProcessImageResponse = {
          id,
          type,
          result: {
            blob,
            width: imageData.width,
            height: imageData.height,
            processingTime: performance.now() - startTime,
          },
        };
        self.postMessage(response);
        return;
        
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
    
    const processingTime = performance.now() - startTime;
    
    // Send response with ImageData
    const response: ProcessImageResponse = {
      id,
      type,
      result: {
        imageData: result as ImageData,
        width: resultWidth,
        height: resultHeight,
        processingTime,
      },
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const errorResponse: ErrorResponse = {
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(errorResponse);
  }
};

/**
 * Worker health check
 */
export function healthCheck(): boolean {
  return true;
}

// Export default Worker class for Vite's ?worker import syntax
export default class ImageProcessorWorker {
  constructor() {
    // Worker initialization is handled by Vite
  }
}
