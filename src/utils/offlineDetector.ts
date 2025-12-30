/**
 * Offline Mode Detector
 * Detects and tracks network connectivity status
 */

export type NetworkStatus = {
  isOnline: boolean;
  lastChangeTime: number;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
};

type NetworkListener = (status: NetworkStatus) => void;

class OfflineDetector {
  private listeners: Set<NetworkListener> = new Set();
  private status: NetworkStatus = this.getCurrentStatus();
  private offlineThreshold = 3000; // 3 seconds offline before considering offline

  constructor() {
    this.setupListeners();
    this.startMonitoring();
  }

  /**
   * Get current network status
   */
  private getCurrentStatus(): NetworkStatus {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      lastChangeTime: Date.now(),
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };
  }

  /**
   * Setup network event listeners
   */
  private setupListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.status = {
      ...this.status,
      isOnline: true,
      lastChangeTime: Date.now(),
    };
    this.notifyListeners();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    // Debounce offline detection
    setTimeout(() => {
      if (!navigator.onLine) {
        this.status = {
          ...this.status,
          isOnline: false,
          lastChangeTime: Date.now(),
        };
        this.notifyListeners();
      }
    }, this.offlineThreshold);
  };

  /**
   * Handle connection type change
   */
  private handleConnectionChange = (): void => {
    this.status = this.getCurrentStatus();
    this.notifyListeners();
  };

  /**
   * Start monitoring with polling
   */
  private startMonitoring(): void {
    // Poll every 30 seconds to detect slow network
    setInterval(() => {
      const wasOnline = this.status.isOnline;
      const isNowOnline = navigator.onLine;

      if (wasOnline !== isNowOnline) {
        this.status = {
          ...this.status,
          isOnline: isNowOnline,
          lastChangeTime: Date.now(),
        };
        this.notifyListeners();
      }
    }, 30000);
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current status
   */
  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.status.isOnline;
  }

  /**
   * Check if on slow connection
   */
  isSlowConnection(): boolean {
    const { effectiveType, rtt } = this.status;
    const slowTypes = ['slow-2g', '2g', '3g'];
    const highRtt = rtt > 200; // > 200ms round trip time
    return slowTypes.includes(effectiveType) || highRtt;
  }

  /**
   * Check if on metered connection (cellular)
   */
  isMetered(): boolean {
    const connection = (navigator as any).connection;
    return connection?.saveData || false;
  }

  /**
   * Get estimated bandwidth in Mbps
   */
  getDownlink(): number {
    return this.status.downlink;
  }

  /**
   * Get round-trip time in ms
   */
  getRTT(): number {
    return this.status.rtt;
  }

  /**
   * Get connection type (wifi, cellular, etc.)
   */
  getConnectionType(): string {
    return this.status.connectionType;
  }

  /**
   * Get time since last status change
   */
  getTimeSinceLastChange(): number {
    return Date.now() - this.status.lastChangeTime;
  }

  /**
   * Check if recently went offline (within last minute)
   */
  recentlyWentOffline(): boolean {
    return !this.status.isOnline && this.getTimeSinceLastChange() < 60000;
  }

  /**
   * Check if recently came online (within last minute)
   */
  recentlyCameOnline(): boolean {
    return this.status.isOnline && this.getTimeSinceLastChange() < 60000;
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.removeEventListener('change', this.handleConnectionChange);
    }

    this.listeners.clear();
  }
}

// Singleton instance
export const offlineDetector = new OfflineDetector();