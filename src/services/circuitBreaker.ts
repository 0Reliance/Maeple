/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by temporarily disabling failing services
 */

export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failure threshold exceeded
  HALF_OPEN = 'half-open'  // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening circuit
  successThreshold: number;      // Successes before closing circuit
  timeout: number;              // ms to wait before half-open
  monitoringPeriod: number;      // ms for failure counting
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly nextAttemptTime: Date) {
    super('Circuit breaker is open. Service temporarily unavailable.');
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private failureTimestamps: number[] = [];

  constructor(
    private fn: () => Promise<T>,
    private config: CircuitBreakerConfig
  ) {
    this.cleanupOldFailures();
    setInterval(() => this.cleanupOldFailures(), this.config.monitoringPeriod);
  }

  /**
   * Execute the protected function with circuit breaker
   */
  async execute(): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerOpenError(new Date(this.nextAttemptTime));
      }
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await this.fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.failures = 0;
    this.failureTimestamps = [];

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();
    this.failureTimestamps.push(Date.now());

    if (this.failures >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
      this.nextAttemptTime = Date.now() + this.config.timeout;
    }
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      
      console.log(`[CircuitBreaker] State transition: ${oldState} -> ${newState}`);
      
      if (this.config.onStateChange) {
        this.config.onStateChange(newState);
      }
    }
  }

  /**
   * Clean up old failure timestamps outside monitoring period
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureTimestamps = this.failureTimestamps.filter(
      timestamp => timestamp > cutoff
    );
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
    nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Manually reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
    this.nextAttemptTime = 0;
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Create a circuit breaker with default configuration
 */
export function createCircuitBreaker<T>(
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker<T> {
  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 60000, // 1 minute
  };

  return new CircuitBreaker(fn, { ...defaultConfig, ...config });
}