/**
 * Request Batching with Exponential Backoff
 * 
 * Batches similar requests to reduce network calls
 * Implements exponential backoff for retries
 * Reduces server load and improves reliability
 */

export interface BatchOptions<T> {
  batchSize?: number;
  batchDelay?: number; // ms to wait for more items
  maxRetries?: number;
  baseDelay?: number; // Initial delay for backoff (ms)
  maxDelay?: number; // Maximum delay for backoff (ms)
}

export interface BatchRequest<T> {
  id: string;
  data: T;
  timestamp: number;
  retries?: number;
}

export class RequestBatcher<T> {
  private batch: Map<string, BatchRequest<T>> = new Map();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private processBatch: (items: BatchRequest<T>[]) => Promise<void>,
    private options: BatchOptions<T> = {}
  ) {
    this.options = {
      batchSize: 10,
      batchDelay: 1000,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      ...options,
    };
  }

  /**
   * Add an item to the batch
   */
  async add(id: string, data: T): Promise<void> {
    // Remove existing if present (deduplication)
    this.batch.delete(id);

    this.batch.set(id, {
      id,
      data,
      timestamp: Date.now(),
      retries: 0,
    });

    // Check if we should process immediately
    if (this.batch.size >= this.options.batchSize!) {
      this.processBatchWithRetry();
      return;
    }

    // Schedule batch processing
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatchWithRetry();
    }, this.options.batchDelay);
  }

  /**
   * Process batch with exponential backoff retry
   */
  private async processBatchWithRetry(): Promise<void> {
    const items = Array.from(this.batch.values());
    this.batch.clear();
    this.batchTimer = null;

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= (this.options.maxRetries || 0)) {
      try {
        await this.processBatch(items);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        retryCount++;

        if (retryCount <= (this.options.maxRetries || 0)) {
          const delay = this.calculateBackoffDelay(retryCount);
          console.debug(
            `[RequestBatcher] Retry ${retryCount}/${this.options.maxRetries} after ${delay}ms`
          );
          await this.sleep(delay);

          // Increment retry count for all items
          items.forEach(item => {
            item.retries = (item.retries || 0) + 1;
          });
        }
      }
    }

    // All retries failed - requeue items
    console.error('[RequestBatcher] All retries failed, requeuing items');
    items.forEach(item => {
      this.batch.set(item.id, item);
    });
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = this.options.baseDelay || 1000;
    const maxDelay = this.options.maxDelay || 30000;

    // Exponential backoff: delay = baseDelay * (2 ^ (retryCount - 1))
    const delay = baseDelay * Math.pow(2, retryCount - 1);

    // Add jitter (randomness) to avoid thundering herd
    const jitter = Math.random() * baseDelay;

    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Force immediate batch processing
   */
  flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    return this.processBatchWithRetry();
  }

  /**
   * Get batch size
   */
  size(): number {
    return this.batch.size;
  }

  /**
   * Clear batch without processing
   */
  clear(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.batch.clear();
  }

  /**
   * Get all items in batch
   */
  getItems(): BatchRequest<T>[] {
    return Array.from(this.batch.values());
  }
}

/**
 * Factory for creating batchers
 */
export function createRequestBatcher<T>(
  processFn: (items: BatchRequest<T>[]) => Promise<void>,
  options?: BatchOptions<T>
): RequestBatcher<T> {
  return new RequestBatcher(processFn, options);
}

/**
 * Retry decorator with exponential backoff
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Omit<BatchOptions<any>, 'batchSize' | 'batchDelay'> = {}
): T {
  return (async (...args: any[]) => {
    let retryCount = 0;
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const maxDelay = options.maxDelay || 30000;
    let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        retryCount++;

        if (retryCount <= maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(2, retryCount - 1) + Math.random() * baseDelay,
            maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }) as T;
}