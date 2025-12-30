/**
 * Debounce and Throttle Utilities
 * Prevents excessive function calls and API requests
 */

/**
 * Debounce function execution
 * Delays function execution until after a specified delay has elapsed
 * since the last time the function was invoked
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  immediate = false
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // If immediate mode and enough time has passed
    if (immediate && timeoutId === null && timeSinceLastCall >= delay) {
      func(...args);
      lastCallTime = now;
      return;
    }

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
      lastCallTime = Date.now();
    }, delay);
  }) as T;
}

/**
 * Throttle function execution
 * Limits function execution to at most once every specified delay
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecutionTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTime;

    if (timeoutId === null && timeSinceLastExecution >= delay) {
      // Execute immediately if enough time has passed
      func(...args);
      lastExecutionTime = now;
    } else if (timeoutId === null) {
      // Schedule next execution
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecutionTime = Date.now();
        timeoutId = null;
      }, delay - timeSinceLastExecution);
    }
  }) as T;
}

/**
 * Debounce Promise-based function (for API calls)
 * Returns a promise that resolves with the latest result
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestPromise: Promise<unknown> | null = null;

  return ((...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      // Clear previous timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Store the latest promise
      const currentPromise = func(...args);
      latestPromise = currentPromise;

      // Set new timeout
      timeoutId = setTimeout(async () => {
        try {
          const result = await currentPromise;
          
          // Only resolve if this is the latest promise
          if (latestPromise === currentPromise) {
            resolve(result);
          }
        } catch (error) {
          if (latestPromise === currentPromise) {
            reject(error);
          }
        }
        timeoutId = null;
      }, delay);
    });
  }) as T;
}

/**
 * Create a memoized version of a function
 * Caches results based on arguments
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, unknown>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Create a memoized version of an async function with TTL
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  options: {
    ttl?: number; // Time to live in milliseconds
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const cache = new Map<string, { result: unknown; expiresAt: number }>();
  const { ttl = 5 * 60 * 1000 } = options;

  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : JSON.stringify(args);

    const now = Date.now();
    const cached = cache.get(key);

    // Return cached result if fresh
    if (cached && now <= cached.expiresAt) {
      return cached.result;
    }

    // Execute function and cache result
    const result = await func(...args);
    cache.set(key, { result, expiresAt: now + ttl });

    return result;
  }) as T;
}

/**
 * Batch multiple function calls into a single execution
 * Useful for batch API requests
 */
export function batch<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  shouldMerge: (newArgs: Parameters<T>, existingArgs: Parameters<T>) => boolean
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let batchedArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    // Merge arguments if possible
    if (batchedArgs && shouldMerge(args, batchedArgs)) {
      batchedArgs = [...args, ...batchedArgs] as Parameters<T>;
    } else {
      batchedArgs = args;
    }

    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      if (batchedArgs) {
        func(...batchedArgs);
        batchedArgs = null;
      }
      timeoutId = null;
    }, delay);
  }) as T;
}

/**
 * Rate limiter - Limits function execution to a maximum number of calls per time window
 */
export function rateLimit<T extends (...args: unknown[]) => unknown>(
  func: T,
  maxCalls: number,
  windowMs: number
): T {
  const calls: number[] = [];

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    // Remove old calls outside the window
    const windowStart = now - windowMs;
    while (calls.length > 0 && calls[0] < windowStart) {
      calls.shift();
    }

    // Check if limit reached
    if (calls.length >= maxCalls) {
      const oldestCall = calls[0];
      const waitTime = oldestCall + windowMs - now;
      
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    // Record call and execute function
    calls.push(now);
    return func(...args);
  }) as T;
}

/**
 * Create a debounced ref for React components
 * Useful for input fields that trigger searches
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): T {
  return debounce(func, delay);
}

/**
 * Create a throttled ref for React components
 * Useful for scroll or resize handlers
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): T {
  return throttle(func, delay);
}

export default debounce;