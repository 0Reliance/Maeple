/**
 * MAEPLE API Rate Limiter
 * 
 * Prevents hitting Gemini API rate limits:
 * - Free tier: 60 requests per minute, 1500 requests per day
 * - Implements queue-based rate limiting with configurable delays
 * - Tracks daily usage for quota management
 */

interface QueueItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  priority: number;
}

interface RateLimiterConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  minDelayMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

interface UsageStats {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
  totalRequests: number;
  totalErrors: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  requestsPerMinute: 55, // Leave buffer below 60 limit
  requestsPerDay: 1400, // Leave buffer below 1500 limit
  minDelayMs: 100, // Minimum delay between requests
  maxRetries: 3,
  retryDelayMs: 2000,
};

const STORAGE_KEY = 'maeple_rate_limiter_stats';

class APIRateLimiter {
  private config: RateLimiterConfig;
  private queue: QueueItem<unknown>[] = [];
  private processing = false;
  private stats: UsageStats;
  private lastRequestTime = 0;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.loadStats();
  }

  private loadStats(): UsageStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const stats = JSON.parse(stored) as UsageStats;
        // Reset if periods have expired
        const now = Date.now();
        if (now > stats.minuteResetAt) {
          stats.minuteCount = 0;
          stats.minuteResetAt = now + 60000;
        }
        if (now > stats.dayResetAt) {
          stats.dayCount = 0;
          stats.dayResetAt = now + 86400000;
        }
        return stats;
      }
    } catch (e) {
      console.warn('Failed to load rate limiter stats:', e);
    }
    
    const now = Date.now();
    return {
      minuteCount: 0,
      minuteResetAt: now + 60000,
      dayCount: 0,
      dayResetAt: now + 86400000,
      totalRequests: 0,
      totalErrors: 0,
    };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Failed to save rate limiter stats:', e);
    }
  }

  private resetPeriodIfNeeded(): void {
    const now = Date.now();
    if (now > this.stats.minuteResetAt) {
      this.stats.minuteCount = 0;
      this.stats.minuteResetAt = now + 60000;
    }
    if (now > this.stats.dayResetAt) {
      this.stats.dayCount = 0;
      this.stats.dayResetAt = now + 86400000;
    }
  }

  /**
   * Check if we can make a request within rate limits
   */
  canMakeRequest(): { allowed: boolean; waitMs?: number; reason?: string } {
    this.resetPeriodIfNeeded();

    if (this.stats.dayCount >= this.config.requestsPerDay) {
      const waitMs = this.stats.dayResetAt - Date.now();
      return {
        allowed: false,
        waitMs,
        reason: `Daily limit reached (${this.config.requestsPerDay}). Resets in ${Math.ceil(waitMs / 60000)} minutes.`,
      };
    }

    if (this.stats.minuteCount >= this.config.requestsPerMinute) {
      const waitMs = this.stats.minuteResetAt - Date.now();
      return {
        allowed: false,
        waitMs,
        reason: `Minute limit reached (${this.config.requestsPerMinute}). Wait ${Math.ceil(waitMs / 1000)} seconds.`,
      };
    }

    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.minDelayMs) {
      return {
        allowed: false,
        waitMs: this.config.minDelayMs - timeSinceLastRequest,
        reason: 'Minimum delay not met',
      };
    }

    return { allowed: true };
  }

  /**
   * Add a request to the queue with optional priority (higher = sooner)
   */
  async enqueue<T>(fn: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const item: QueueItem<T> = { fn, resolve, reject, priority };
      
      // Insert based on priority (higher priority first)
      const insertIndex = this.queue.findIndex(q => q.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(item as QueueItem<unknown>);
      } else {
        this.queue.splice(insertIndex, 0, item as QueueItem<unknown>);
      }
      
      this.processQueue();
    });
  }

  /**
   * Execute immediately if allowed, otherwise queue
   */
  async execute<T>(fn: () => Promise<T>, priority = 0): Promise<T> {
    const check = this.canMakeRequest();
    if (check.allowed && this.queue.length === 0) {
      return this.executeWithRetry(fn);
    }
    return this.enqueue(fn, priority);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const check = this.canMakeRequest();
      
      if (!check.allowed && check.waitMs) {
        await this.sleep(Math.min(check.waitMs, 5000)); // Cap wait at 5s to check again
        continue;
      }

      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await this.executeWithRetry(item.fn);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    this.resetPeriodIfNeeded();
    this.stats.minuteCount++;
    this.stats.dayCount++;
    this.stats.totalRequests++;
    this.lastRequestTime = Date.now();
    this.saveStats();

    try {
      return await fn();
    } catch (error) {
      this.stats.totalErrors++;
      this.saveStats();

      // Check if it's a rate limit error (429)
      const isRateLimitError = 
        error instanceof Error && 
        (error.message.includes('429') || 
         error.message.toLowerCase().includes('rate limit') ||
         error.message.toLowerCase().includes('quota'));

      if (isRateLimitError && attempt < this.config.maxRetries) {
        const delay = this.config.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`);
        await this.sleep(delay);
        return this.executeWithRetry(fn, attempt + 1);
      }

      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current usage statistics
   */
  getStats(): UsageStats & { 
    minuteRemaining: number; 
    dayRemaining: number;
    queueLength: number;
  } {
    this.resetPeriodIfNeeded();
    return {
      ...this.stats,
      minuteRemaining: this.config.requestsPerMinute - this.stats.minuteCount,
      dayRemaining: this.config.requestsPerDay - this.stats.dayCount,
      queueLength: this.queue.length,
    };
  }

  /**
   * Reset all statistics (useful for testing or manual reset)
   */
  resetStats(): void {
    const now = Date.now();
    this.stats = {
      minuteCount: 0,
      minuteResetAt: now + 60000,
      dayCount: 0,
      dayResetAt: now + 86400000,
      totalRequests: 0,
      totalErrors: 0,
    };
    this.saveStats();
  }

  /**
   * Clear the queue (useful for cleanup)
   */
  clearQueue(): void {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      item?.reject(new Error('Queue cleared'));
    }
  }
}

// Singleton instance for the app
export const apiRateLimiter = new APIRateLimiter();

// Convenience wrapper for AI calls
export async function rateLimitedCall<T>(
  fn: () => Promise<T>,
  options: { priority?: number; skipQueue?: boolean } = {}
): Promise<T> {
  if (options.skipQueue) {
    const check = apiRateLimiter.canMakeRequest();
    if (!check.allowed) {
      throw new Error(check.reason || 'Rate limit exceeded');
    }
  }
  return apiRateLimiter.execute(fn, options.priority ?? 0);
}

// Export the class for custom instances
export { APIRateLimiter };
export type { RateLimiterConfig, UsageStats };
