/**
 * Unit Tests for Circuit Breaker Pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  CircuitBreaker, 
  CircuitState, 
  CircuitBreakerOpenError,
  createCircuitBreaker 
} from '../../src/services/circuitBreaker';

describe('CircuitBreaker', () => {
  let mockFn: ReturnType<typeof vi.fn>;
  let circuitBreaker: CircuitBreaker<string>;

  beforeEach(() => {
    mockFn = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.isClosed()).toBe(true);
      expect(circuitBreaker.isOpen()).toBe(false);
      expect(circuitBreaker.isHalfOpen()).toBe(false);
    });

    it('should have zero failures and successes initially', () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });

  describe('successful execution', () => {
    it('should execute function successfully when CLOSED', async () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      const result = await circuitBreaker.execute();

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should increment success counter', async () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      await circuitBreaker.execute();
      await circuitBreaker.execute();

      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(2);
    });

    it('should reset failures on success', async () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Fail first
      mockFn.mockRejectedValueOnce(new Error('failure'));
      try {
        await circuitBreaker.execute();
      } catch (e) {
        // Expected
      }

      // Then succeed
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute();

      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
    });
  });

  describe('failure handling', () => {
    it('should throw error when function fails', async () => {
      mockFn.mockRejectedValue(new Error('test error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      await expect(circuitBreaker.execute()).rejects.toThrow('test error');
    });

    it('should increment failure counter', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(2);
    });

    it('should open circuit after threshold failures', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should reset successes on failure', async () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Succeed first
      await circuitBreaker.execute();

      // Then fail
      mockFn.mockRejectedValue(new Error('error'));
      try {
        await circuitBreaker.execute();
      } catch (e) {
        // Expected
      }

      const stats = circuitBreaker.getStats();
      expect(stats.successes).toBe(0);
    });
  });

  describe('OPEN state behavior', () => {
    it('should throw CircuitBreakerOpenError when OPEN', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      // Try to execute while OPEN
      await expect(circuitBreaker.execute()).rejects.toThrow(CircuitBreakerOpenError);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      // Fast forward past timeout
      vi.advanceTimersByTime(1001);

      // Should be in HALF_OPEN now
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(circuitBreaker.isHalfOpen()).toBe(true);
    });

    it('should allow execution after timeout', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      // Fast forward past timeout
      vi.advanceTimersByTime(1001);

      // Now should allow execution
      mockFn.mockResolvedValue('success');
      const result = await circuitBreaker.execute();

      expect(result).toBe('success');
    });
  });

  describe('HALF_OPEN state behavior', () => {
    it('should close circuit after success threshold', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      // Fast forward to HALF_OPEN
      vi.advanceTimersByTime(1001);

      // Succeed twice (threshold)
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute();
      await circuitBreaker.execute();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should re-open if fails in HALF_OPEN', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      // Fast forward to HALF_OPEN
      vi.advanceTimersByTime(1001);

      // Fail once
      try {
        await circuitBreaker.execute();
      } catch (e) {
        // Expected
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('state change callbacks', () => {
    it('should call onStateChange when state changes', () => {
      const stateChanges: CircuitState[] = [];
      mockFn.mockResolvedValue('success');
      
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000,
        onStateChange: (state) => {
          stateChanges.push(state);
        }
      });

      // Fail to open circuit
      mockFn.mockRejectedValue(new Error('error'));
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      expect(stateChanges).toContain(CircuitState.OPEN);
    });
  });

  describe('reset', () => {
    it('should reset to CLOSED state', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute();
        } catch (e) {
          // Expected
        }
      }

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.isClosed()).toBe(true);
    });

    it('should reset counters', async () => {
      mockFn.mockRejectedValue(new Error('error'));
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      // Fail and succeed
      mockFn.mockRejectedValueOnce(new Error('error'));
      try {
        await circuitBreaker.execute();
      } catch (e) {
        // Expected
      }

      mockFn.mockResolvedValueOnce('success');
      await circuitBreaker.execute();

      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return current statistics', async () => {
      mockFn.mockResolvedValue('success');
      circuitBreaker = new CircuitBreaker(mockFn, {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 60000
      });

      await circuitBreaker.execute();

      const stats = circuitBreaker.getStats();
      expect(stats).toMatchObject({
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 1,
      });
      expect(stats.lastFailureTime).toBeDefined();
      expect(stats.nextAttemptTime).toBeDefined();
    });
  });
});

describe('createCircuitBreaker', () => {
  it('should create circuit breaker with default config', () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const breaker = createCircuitBreaker(mockFn);

    expect(breaker).toBeInstanceOf(CircuitBreaker);
    expect(breaker.isClosed()).toBe(true);
  });

  it('should merge provided config with defaults', () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const breaker = createCircuitBreaker(mockFn, {
      failureThreshold: 10
    });

    const stats = breaker.getStats();
    // Default successThreshold should still apply
    expect(breaker.isClosed()).toBe(true);
  });
});