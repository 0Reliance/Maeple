/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by failing fast when a service is down
 * Automatically retries with exponential backoff
 * Provides visibility into service health
 */

export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening
  successThreshold: number;      // Successes before closing
  timeout: number;               // Time to wait before trying again (ms)
  resetTimeout: number;           // Time before moving to HALF_OPEN (ms)
  onStateChange?: (state: CircuitState) => void;
  onFailure?: (error: Error) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerOpenError(
          'Circuit breaker is OPEN. Please try again later.'
        );
      }
      // Try again after timeout
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.config.onFailure) {
      this.config.onFailure(error);
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;

    // Reset counters based on state
    switch (newState) {
      case CircuitState.CLOSED:
        this.failureCount = 0;
        this.successCount = 0;
        break;
      case CircuitState.OPEN:
        this.nextAttemptTime = Date.now() + this.config.resetTimeout;
        break;
      case CircuitState.HALF_OPEN:
        this.successCount = 0;
        break;
    }

    if (this.config.onStateChange) {
      this.config.onStateChange(newState);
    }

    console.debug(`[CircuitBreaker] ${oldState} → ${newState}`);
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getSuccessCount(): number {
    return this.successCount;
  }

  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

// Factory function
export function createCircuitBreaker(
  config: Partial<CircuitBreakerConfig> = {}
): CircuitBreaker {
  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000,
    resetTimeout: 60000,
  };

  return new CircuitBreaker({ ...defaultConfig, ...config });
}

// Decorator for wrapping functions
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config?: Partial<CircuitBreakerConfig>
): T {
  const breaker = createCircuitBreaker(config);
  return (async (...args: any[]) => {
    return breaker.execute(() => fn(...args));
  }) as T;
}