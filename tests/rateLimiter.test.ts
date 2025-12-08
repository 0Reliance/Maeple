/**
 * Rate Limiter Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  rateLimitedCall, 
  apiRateLimiter,
  APIRateLimiter
} from '../services/rateLimiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    // Use real timers for these tests since rate limiter has complex async behavior
    apiRateLimiter.resetStats();
  });

  describe('rateLimitedCall', () => {
    it('should execute a function immediately when queue is empty', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await rateLimitedCall(mockFn);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should return the result from the function', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
      
      const result = await rateLimitedCall(mockFn);
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should reject when function throws an error', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(rateLimitedCall(mockFn)).rejects.toThrow('Test error');
    });

    it('should pass through generic types correctly', async () => {
      const mockFn = vi.fn().mockResolvedValue(42);
      
      const result: number = await rateLimitedCall<number>(mockFn);
      
      expect(result).toBe(42);
    });
  });

  describe('APIRateLimiter', () => {
    it('should track usage stats after execution', async () => {
      const limiter = new APIRateLimiter();
      const mockFn = vi.fn().mockResolvedValue('done');
      
      await limiter.execute(mockFn);
      
      const stats = limiter.getStats();
      expect(stats.totalRequests).toBeGreaterThanOrEqual(1);
    });

    it('should report queue length', () => {
      const stats = apiRateLimiter.getStats();
      expect(stats).toHaveProperty('queueLength');
      expect(typeof stats.queueLength).toBe('number');
    });

    it('should have minuteRemaining in stats', () => {
      const limiter = new APIRateLimiter();
      limiter.resetStats();
      const stats = limiter.getStats();
      expect(stats).toHaveProperty('minuteRemaining');
      expect(stats.minuteRemaining).toBeGreaterThan(0);
    });

    it('should have dayRemaining in stats', () => {
      const limiter = new APIRateLimiter();
      limiter.resetStats();
      const stats = limiter.getStats();
      expect(stats).toHaveProperty('dayRemaining');
      expect(stats.dayRemaining).toBeGreaterThan(0);
    });

    it('should reset stats correctly', () => {
      const limiter = new APIRateLimiter();
      limiter.resetStats();
      const stats = limiter.getStats();
      expect(stats.minuteCount).toBe(0);
      expect(stats.dayCount).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('canMakeRequest', () => {
    it('should allow requests when under limit', () => {
      const limiter = new APIRateLimiter();
      limiter.resetStats();
      
      const check = limiter.canMakeRequest();
      expect(check.allowed).toBe(true);
    });

    it('should include reason when not allowed', () => {
      const limiter = new APIRateLimiter({ requestsPerMinute: 0 });
      
      const check = limiter.canMakeRequest();
      expect(check.allowed).toBe(false);
      expect(check.reason).toBeDefined();
    });
  });
});
