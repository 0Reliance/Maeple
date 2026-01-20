/**
 * Circuit Breaker Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState, CircuitBreakerOpenError, createCircuitBreaker, withCircuitBreaker } from '../../src/patterns/CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let stateChangeCallback: vi.Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    stateChangeCallback = vi.fn();
    
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeout: 1000,
      timeout: 60000,
      onStateChange: stateChangeCallback,
    });
  });

  describe('Initialization', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should have correct initial counts', () => {
      expect(circuitBreaker.getFailureCount()).toBe(0);
      expect(circuitBreaker.getSuccessCount()).toBe(0);
    });
  });

  describe('CLOSED State', () => {
    it('should execute function and record success', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getSuccessCount()).toBe(0); // Not tracked in CLOSED
    });

    it('should record failures but stay CLOSED under threshold', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      for (let i = 0; i < 4; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(4);
    });

    it('should transition to OPEN after failure threshold', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(mockFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(stateChangeCallback).toHaveBeenCalledWith(CircuitState.OPEN);
    });
  });

  describe('OPEN State', () => {
    it('should throw CircuitBreakerOpenError when OPEN', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const failingFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Should throw CircuitBreakerOpenError
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(
        CircuitBreakerOpenError
      );
      
      // Should not call the function (5 calls were from the setup loop)
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should allow execution after reset timeout', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      const successFn = vi.fn().mockResolvedValue('success');
      
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Advance time past reset timeout
      vi.advanceTimersByTime(1000);
      
      // Should transition to HALF_OPEN and allow execution
      const result = await circuitBreaker.execute(successFn);
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });
  });

  describe('HALF_OPEN State', () => {
    it('should transition to CLOSED after successful calls', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      const successFn = vi.fn().mockResolvedValue('success');
      
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      // Advance time past reset timeout
      vi.advanceTimersByTime(1000);
      
      // First execution triggers transition to HALF_OPEN
      await circuitBreaker.execute(successFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Second successful call
      await circuitBreaker.execute(successFn);
      
      // Should transition to CLOSED
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(stateChangeCallback).toHaveBeenCalledWith(CircuitState.CLOSED);
    });

    it('should return to OPEN after failure in HALF_OPEN', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      const successFn = vi.fn().mockResolvedValue('success');
      
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      // Advance time past reset timeout
      vi.advanceTimersByTime(1000);
      
      // First execution triggers transition to HALF_OPEN
      await circuitBreaker.execute(successFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Fail once
      try {
        await circuitBreaker.execute(failFn);
      } catch (e) {
        // Expected to fail
      }
      
      // Should return to OPEN (failureCount is now >= threshold)
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('State Change Callback', () => {
    it('should call onStateChange callback', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        await circuitBreaker.execute(failFn).catch(() => {});
      }
      
      expect(stateChangeCallback).toHaveBeenCalledTimes(1);
      expect(stateChangeCallback).toHaveBeenCalledWith(CircuitState.OPEN);
    });
  });

  describe('Reset', () => {
    it('should reset circuit to CLOSED', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      // Force OPEN state
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (e) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.getFailureCount()).toBe(5);
      
      // Reset
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
      expect(circuitBreaker.getSuccessCount()).toBe(0);
    });
  });

  describe('Stats', () => {
    it('should track failure and success counts', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      
      // 2 failures
      try {
        await circuitBreaker.execute(failFn);
      } catch (e) {}
      try {
        await circuitBreaker.execute(failFn);
      } catch (e) {}
      
      expect(circuitBreaker.getFailureCount()).toBe(2);
      expect(circuitBreaker.getSuccessCount()).toBe(0);
    });
  });

  describe('Factory Function', () => {
    it('should create circuit breaker with default config', () => {
      const breaker = createCircuitBreaker();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should merge config with defaults', async () => {
      const breaker = createCircuitBreaker({
        failureThreshold: 10,
      });
      
      // Should not throw with 5 failures
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 5; i++) {
        await breaker.execute(failFn).catch(() => {});
      }
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getFailureCount()).toBe(5);
    });
  });

  describe('Decorator', () => {
    it('should wrap function with circuit breaker', async () => {
      
      let callCount = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('fail'));
        }
        return Promise.resolve('success');
      });
      
      const wrappedFn = withCircuitBreaker(mockFn, {
        failureThreshold: 2,
        successThreshold: 1,
        resetTimeout: 1000,
      });
      
      // 2 failures should open circuit
      await expect(wrappedFn()).rejects.toThrow('fail');
      await expect(wrappedFn()).rejects.toThrow('fail');
      
      // 3rd call should be rejected by circuit breaker
      await expect(wrappedFn()).rejects.toThrow('Circuit breaker is OPEN');
    });
  });
});