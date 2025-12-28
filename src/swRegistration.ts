// Service Worker Registration for MAEPLE
// Handles offline functionality and caching with automatic updates

// Get build version from build process, fallback to timestamp
const SW_VERSION = (typeof __BUILD_VERSION__ !== 'undefined') ? __BUILD_VERSION__ : `${Date.now()}`;
const SW_URL = `/sw.js?v=${SW_VERSION}`;

export interface OfflineQueueItem {
  id: string;
  data: any;
  timestamp: number;
  type: 'journal-entry' | 'ai-setting' | 'state-check';
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;

  constructor() {
    this.init();
    this.setupOnlineListeners();
  }

  private async init() {
    if ('serviceWorker' in navigator) {
      try {
        // Unregister any old service workers to force clean slate
        const existingRegs = await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegs) {
          if (reg.active && !reg.active.scriptURL.includes(SW_VERSION)) {
            console.log('[SW] Unregistering old service worker:', reg.active.scriptURL);
            await reg.unregister();
          }
        }

        this.registration = await navigator.serviceWorker.register(SW_URL);
        
        this.registration.addEventListener('updatefound', this.onUpdateFound.bind(this));
        
        // Check for existing service worker
        if (this.registration.active) {
          console.log('[SW] Service worker already active, version:', SW_VERSION);
        }
        
        console.log('[SW] Service worker registered successfully, version:', SW_VERSION);
        
        // Force update immediately on registration
        await this.registration.update();
      } catch (error) {
        console.error('[SW] Service worker registration failed:', error);
      }
    } else {
      console.warn('[SW] Service workers not supported');
    }
  }

  private onUpdateFound() {
    const newWorker = this.registration!.installing;
    if (newWorker) {
      console.log('[SW] New service worker found');
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available, show update notification
          this.showUpdateNotification();
        }
      });
    }
  }

  private showUpdateNotification() {
    // Create a simple notification for app update
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MAEPLE Update Available', {
        body: 'A new version of MAEPLE is available. Click to update.',
        icon: '/icon-192x192.png',
        tag: 'app-update'
      }).onclick = () => {
        // Reload to activate new service worker
        window.location.reload();
      };
    } else {
      // Auto-reload if notifications not granted
      console.log('[SW] Auto-reloading for update...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  private setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[SW] App is online');
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[SW] App is offline');
    });
  }

  private async triggerBackgroundSync() {
    if (this.registration && 'sync' in this.registration) {
      try {
        await (this.registration as any).sync.register('journal-entries');
        await (this.registration as any).sync.register('ai-settings');
      } catch (error) {
        console.error('[SW] Background sync registration failed:', error);
      }
    }
  }

  // Public API
  public isAppOnline(): boolean {
    return this.isOnline;
  }

  // Force reload the page to clear any stale caches
  public forceReload() {
    // Reload with timestamp to bypass any browser caching
    window.location.href = `${window.location.origin}${window.location.pathname}?_=${Date.now()}`;
  }

  // Check for and apply updates
  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    await this.registration.update();
    
    // If there's a waiting worker, update is available
    if (this.registration.waiting) {
      console.log('[SW] Update waiting, sending skipWaiting message');
      
      // Tell the new service worker to activate immediately
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      return true;
    }
    
    return false;
  }

  public async waitForUpdate(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.registration) {
        resolve();
        return;
      }

      const checkForUpdate = () => {
        this.registration!.update().then(() => {
          setTimeout(checkForUpdate, 1000); // Check every second
        });
      };

      checkForUpdate();
    });
  }

  public async queueOfflineAction(item: OfflineQueueItem): Promise<void> {
    if (!this.isOnline) {
      return this.addToIndexedDB(item);
    }
    return Promise.resolve();
  }

  private async addToIndexedDB(item: OfflineQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('maeple-offline', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline-queue'], 'readwrite');
        const store = transaction.objectStore('offline-queue');
        
        store.add(item);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  public async getQueuedActions(): Promise<OfflineQueueItem[]> {
    return new Promise((resolve) => {
      const request = indexedDB.open('maeple-offline', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline-queue'], 'readonly');
        const store = transaction.objectStore('offline-queue');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      };
    });
  }

  public async clearQueue(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open('maeple-offline', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline-queue'], 'readwrite');
        const store = transaction.objectStore('offline-queue');
        
        store.clear();
        
        transaction.oncomplete = () => resolve();
      };
    });
  }
}

// Create singleton instance
export const swManager = new ServiceWorkerManager();

// Export for use in components
export default swManager;