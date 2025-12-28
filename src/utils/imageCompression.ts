/**
 * Image Compression Utility
 * Reduces image size for faster AI analysis and storage
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compress an image to a data URL
 * @param source - Source image (HTMLCanvasElement, HTMLImageElement, or data URL)
 * @param options - Compression options
 * @returns Promise<string> - Compressed image as data URL
 */
export const compressImage = async (
  source: HTMLCanvasElement | HTMLImageElement | string,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  // Load source if it's a data URL
  let img: HTMLImageElement | null = null;
  let originalSize = 0;
  
  if (typeof source === 'string') {
    originalSize = estimateFileSize(source);
    img = await loadImage(source);
  } else if (source instanceof HTMLCanvasElement) {
    // If it's already a canvas, check if resizing is needed
    const ctx = source.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for image compression');
    }
    
    const needsResize = source.width > maxWidth || source.height > maxHeight;
    
    if (!needsResize) {
      // Canvas is already small enough, just change format/quality
      return source.toDataURL(format, quality);
    }
    
    // Need to resize - fall through to canvas handling below
  } else {
    img = source;
  }

  // Validate image dimensions
  if (img && (img.width === 0 || img.height === 0)) {
    throw new Error('Invalid image: dimensions are zero');
  }

  // Calculate new dimensions while maintaining aspect ratio
  const imgWidth = img ? img.width : 0;
  const imgHeight = img ? img.height : 0;
  const { width, height } = calculateDimensions(
    imgWidth,
    imgHeight,
    maxWidth,
    maxHeight
  );

  // Validate calculated dimensions
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid calculated dimensions: ${width}x${height}`);
  }

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context for image compression');
  }

  // Use better quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  try {
    if (img) {
      ctx.drawImage(img, 0, 0, width, height);
    } else if (source instanceof HTMLCanvasElement) {
      // Draw from canvas to new canvas
      ctx.drawImage(source, 0, 0, width, height);
    }
  } catch (e) {
    throw new Error(`Failed to draw image to canvas: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Compress and return as data URL
  let compressed: string;
  try {
    compressed = canvas.toDataURL(format, quality);
  } catch (e) {
    throw new Error(`Image compression failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  // Validate result
  if (!compressed || !compressed.startsWith('data:')) {
    throw new Error('Image compression failed: invalid data URL produced');
  }
  
  // Log size comparison (optional validation)
  if (originalSize > 0) {
    const compressedSize = estimateFileSize(compressed);
    if (compressedSize > originalSize) {
      console.warn(`Compression increased size: ${(originalSize / 1024).toFixed(2)} KB -> ${(compressedSize / 1024).toFixed(2)} KB`);
    } else {
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);
      console.log(`Compression: ${(originalSize / 1024).toFixed(2)} KB -> ${(compressedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
    }
  }
  
  return compressed;
};

/**
 * Load an image from a data URL
 */
const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Calculate dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  currentWidth: number,
  currentHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = currentWidth;
  let height = currentHeight;

  // Calculate ratios
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  // Only resize if image is larger than target
  if (ratio < 1) {
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

/**
 * Estimate file size from data URL (in bytes)
 */
export const estimateFileSize = (dataUrl: string): number => {
  // Remove the data URL prefix to get just the base64 string
  const base64 = dataUrl.split(',')[1];
  // Base64 is ~33% larger than binary
  return Math.round(base64.length * 0.75);
};

/**
 * Check if image is already compressed enough
 */
export const needsCompression = (dataUrl: string, maxSizeKB: number = 500): boolean => {
  const sizeBytes = estimateFileSize(dataUrl);
  return sizeBytes > maxSizeKB * 1024;
};