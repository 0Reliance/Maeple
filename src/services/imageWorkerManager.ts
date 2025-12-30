/**
 * Image Worker Manager Service
 * 
 * Manages the lifecycle and communication with the image processor web worker.
 * Provides a clean, promise-based API for image processing operations.
 * 
 * Features:
 * - Worker pool management
 * - Request queuing
 * - Error handling
 * - Memory cleanup
 * - Performance tracking
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export type ProcessType = 'resize' | 'edgeDetection' | 'compress';

export interface ProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp';
}

export interface ProcessResult {
  imageData?: ImageData;
  blob?: Blob;
  width: number;
  height: number;
  processingTime: number;
}

export interface WorkerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  activeRequests: number;
}

// Request/Response types
interface WorkerRequest {
  id: string;
  type: ProcessType;
  imageData: ImageData;
  options?: ProcessOptions;
  resolve: (value: ProcessResult) => void;
  reject: (error: Error) => void;
}

interface WorkerMessage {
  id: string;
  type: ProcessType;
  result?: {
    imageData?: ImageData;
    blob?: Blob;
    width: number;
    height: number;
    processingTime: number;
  };
  error?: string;
}

class ImageWorkerManager {
  private worker: Worker | null = null;
  private requests: Map<string, WorkerRequest> = new Map();
  private isInitializing = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Stats
  private stats: WorkerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    activeRequests: 0,
  };
  
  private processingTimes: number[] = [];
  
  /**
   * Initialize the worker
   */
  private async initializeWorker(): Promise<void> {
    if (this.worker) return;
    
    if (this.isInitializing && this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.isInitializing = true;
    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        // Dynamically import worker
        const workerUrl = new URL(
          '../workers/imageProcessor.worker.ts',
          import.meta.url
        );
        
        this.worker = new Worker(workerUrl, { type: 'module' });
        
        this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          this.handleMessage(event.data);
        };
        
        this.worker.onerror = (error) => {
          console.error('[ImageWorkerManager] Worker error:', error);
          this.cleanup();
          reject(new Error('Worker initialization failed'));
        };
        
        resolve();
      } catch (error) {
        console.error('[ImageWorkerManager] Failed to initialize worker:', error);
        reject(error);
      } finally {
        this.isInitializing = false;
        this.initializationPromise = null;
      }
    });
    
    return this.initializationPromise;
  }
  
  /**
   * Handle worker messages
   */
  private handleMessage(message: WorkerMessage): void {
    const request = this.requests.get(message.id);
    
    if (!request) {
      console.warn(`[ImageWorkerManager] No request found for id: ${message.id}`);
      return;
    }
    
    this.requests.delete(message.id);
    this.stats.activeRequests--;
    
    if (message.error) {
      request.reject(new Error(message.error));
      this.stats.failedRequests++;
      return;
    }
    
    // Update stats
    this.stats.successfulRequests++;
    const processingTime = message.result?.processingTime || 0;
    this.processingTimes.push(processingTime);
    
    // Keep only last 100 processing times for average calculation
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    this.stats.averageProcessingTime =
      this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
    
    request.resolve(message.result as ProcessResult);
  }
  
  /**
   * Process image through worker
   */
  public async processImage(
    type: ProcessType,
    imageData: ImageData,
    options?: ProcessOptions
  ): Promise<ProcessResult> {
    await this.initializeWorker();
    
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    
    const id = uuidv4();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.requests.delete(id);
        this.stats.activeRequests--;
        this.stats.failedRequests++;
        reject(new Error('Worker request timeout'));
      }, 30000); // 30 second timeout
      
      this.requests.set(id, {
        id,
        type,
        imageData,
        options,
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      
      this.stats.totalRequests++;
      this.stats.activeRequests++;
      
      this.worker!.postMessage({
        id,
        type,
        imageData,
        options,
      }, [imageData.data.buffer]); // Transfer ImageData buffer for performance
    });
  }
  
  /**
   * Resize image
   */
  public async resizeImage(
    imageData: ImageData,
    width: number,
    height: number
  ): Promise<ProcessResult> {
    return this.processImage('resize', imageData, { width, height });
  }
  
  /**
   * Apply edge detection
   */
  public async detectEdges(
    imageData: ImageData
  ): Promise<ProcessResult> {
    return this.processImage('edgeDetection', imageData);
  }
  
  /**
   * Compress image
   */
  public async compressImage(
    imageData: ImageData,
    quality: number = 0.7,
    format: 'image/jpeg' | 'image/webp' = 'image/webp'
  ): Promise<ProcessResult> {
    return this.processImage('compress', imageData, { quality, format });
  }
  
  /**
   * Get worker statistics
   */
  public getStats(): WorkerStats {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      activeRequests: this.stats.activeRequests,
    };
    this.processingTimes = [];
  }
  
  /**
   * Check if worker is ready
   */
  public isReady(): boolean {
    return this.worker !== null && !this.isInitializing;
  }
  
  /**
   * Terminate worker and cleanup
   */
  public cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending requests
    this.requests.forEach((request) => {
      request.reject(new Error('Worker terminated'));
    });
    
    this.requests.clear();
  }
  
  /**
   * Convert Image to ImageData
   */
  public static async imageToImageData(
    image: HTMLImageElement
  ): Promise<ImageData> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    
    ctx.drawImage(image, 0, 0);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  /**
   * Convert ImageData to Blob
   */
  public static async imageDataToBlob(
    imageData: ImageData,
    format: 'image/jpeg' | 'image/webp' = 'image/webp',
    quality: number = 0.7
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert ImageData to Blob'));
          }
        },
        format,
        quality
      );
    });
  }
}

// Export singleton instance
export const imageWorkerManager = new ImageWorkerManager();

// Export class for testing
export { ImageWorkerManager };