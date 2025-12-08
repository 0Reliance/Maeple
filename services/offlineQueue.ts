/**
 * MAEPLE Offline Queue Service
 * 
 * Queues failed API requests when offline and retries them when online.
 * Uses IndexedDB for persistence across sessions.
 */

import { errorLogger } from './errorLogger';

interface QueuedRequest {
  id: string;
  type: 'journal' | 'stateCheck' | 'sync' | 'generic';
  payload: unknown;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  handler: string; // Name of the handler function to call
}

interface OfflineQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number; // ms
  persistToDB: boolean;
}

const DB_NAME = 'maeple_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'requests';

const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 100,
  maxRetries: 5,
  retryDelay: 5000,
  persistToDB: true,
};

// Handler registry - functions that know how to process each request type
const handlers: Map<string, (payload: unknown) => Promise<void>> = new Map();

/**
 * Register a handler for processing queued requests
 */
export function registerOfflineHandler(
  name: string, 
  handler: (payload: unknown) => Promise<void>
): void {
  handlers.set(name, handler);
}

class OfflineQueue {
  private config: OfflineQueueConfig;
  private queue: QueuedRequest[] = [];
  private db: IDBDatabase | null = null;
  private processing = false;
  private isOnline = navigator.onLine;

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupEventListeners();
    this.initDB();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[OfflineQueue] Back online, processing queue...');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[OfflineQueue] Went offline, requests will be queued');
    });
  }

  private async initDB(): Promise<void> {
    if (!this.config.persistToDB) return;

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to open IndexedDB');
        errorLogger.error('OfflineQueue: Failed to open IndexedDB');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.loadFromDB();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    } catch (error) {
      console.error('[OfflineQueue] IndexedDB init error:', error);
    }
  }

  private async loadFromDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          this.queue = request.result || [];
          console.log(`[OfflineQueue] Loaded ${this.queue.length} requests from DB`);
          if (this.queue.length > 0 && this.isOnline) {
            this.processQueue();
          }
          resolve();
        };

        request.onerror = () => {
          console.error('[OfflineQueue] Failed to load from DB');
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private async saveToDB(item: QueuedRequest): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async removeFromDB(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add a request to the offline queue
   */
  async enqueue(
    type: QueuedRequest['type'],
    handler: string,
    payload: unknown
  ): Promise<string> {
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove oldest request to make room
      const oldest = this.queue.shift();
      if (oldest) {
        await this.removeFromDB(oldest.id);
        console.warn('[OfflineQueue] Queue full, removed oldest request');
      }
    }

    const item: QueuedRequest = {
      id: `oq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      handler,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.queue.push(item);
    await this.saveToDB(item);

    console.log(`[OfflineQueue] Enqueued ${type} request: ${item.id}`);

    // Try to process immediately if online
    if (this.isOnline && !this.processing) {
      this.processQueue();
    }

    return item.id;
  }

  /**
   * Process the queue when online
   */
  async processQueue(): Promise<void> {
    if (this.processing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue[0];

      try {
        const handler = handlers.get(item.handler);
        if (!handler) {
          console.error(`[OfflineQueue] No handler registered for: ${item.handler}`);
          this.queue.shift();
          await this.removeFromDB(item.id);
          continue;
        }

        await handler(item.payload);
        
        // Success - remove from queue
        this.queue.shift();
        await this.removeFromDB(item.id);
        console.log(`[OfflineQueue] Successfully processed: ${item.id}`);
      } catch (error) {
        item.retryCount++;

        if (item.retryCount >= item.maxRetries) {
          // Max retries exceeded, remove from queue
          this.queue.shift();
          await this.removeFromDB(item.id);
          console.error(`[OfflineQueue] Max retries exceeded for ${item.id}, discarding`);
          errorLogger.error('OfflineQueue: Max retries exceeded', {
            requestId: item.id,
            type: item.type,
            error: error instanceof Error ? error.message : String(error),
          });
        } else {
          // Update retry count in DB
          await this.saveToDB(item);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    this.processing = false;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    length: number;
    isOnline: boolean;
    isProcessing: boolean;
    items: Array<{ id: string; type: string; createdAt: string; retryCount: number }>;
  } {
    return {
      length: this.queue.length,
      isOnline: this.isOnline,
      isProcessing: this.processing,
      items: this.queue.map(item => ({
        id: item.id,
        type: item.type,
        createdAt: item.createdAt,
        retryCount: item.retryCount,
      })),
    };
  }

  /**
   * Clear the entire queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (error) {
          reject(error);
        }
      });
    }
  }

  /**
   * Remove a specific item from the queue
   */
  async remove(id: string): Promise<boolean> {
    const index = this.queue.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    await this.removeFromDB(id);
    return true;
  }

  /**
   * Check if we're currently online
   */
  checkOnline(): boolean {
    return this.isOnline;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Wrapper to execute a function with offline fallback
 * If the function fails due to network issues, queue it for later
 */
export async function withOfflineSupport<T>(
  fn: () => Promise<T>,
  options: {
    type: QueuedRequest['type'];
    handler: string;
    payload: unknown;
    shouldQueue?: (error: unknown) => boolean;
  }
): Promise<T | { queued: true; id: string }> {
  try {
    return await fn();
  } catch (error) {
    // Check if this is a network error that should be queued
    const shouldQueue = options.shouldQueue ?? isNetworkError;
    
    if (shouldQueue(error)) {
      const id = await offlineQueue.enqueue(
        options.type,
        options.handler,
        options.payload
      );
      return { queued: true, id };
    }
    
    throw error;
  }
}

/**
 * Check if an error is a network error
 */
function isNetworkError(error: unknown): boolean {
  if (!navigator.onLine) return true;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('connection') ||
      message.includes('offline')
    );
  }
  
  return false;
}

// Export types
export type { QueuedRequest, OfflineQueueConfig };
