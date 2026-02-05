/**
 * Safe Array Utility Functions
 * 
 * Provides defensive programming utilities to prevent runtime errors
 * when arrays might be undefined, null, or not arrays at all.
 */

/**
 * Safely get array length, returning 0 if undefined/null/not array
 * 
 * @example
 * safeLength(undefined) // returns 0
 * safeLength([1, 2, 3]) // returns 3
 */
export function safeLength<T>(array: T[] | undefined | null): number {
  if (!Array.isArray(array)) return 0;
  return array.length;
}

/**
 * Safely map over an array, returning empty array if undefined/null
 * 
 * @example
 * // Safe with undefined
 * safeMap(undefined, x => x * 2) // returns []
 * 
 * @example
 * // Safe with valid array
 * safeMap([1, 2, 3], x => x * 2) // returns [2, 4, 6]
 */
export function safeMap<T, U>(
  array: T[] | undefined | null,
  callback: (item: T, index: number) => U
): U[] {
  if (!Array.isArray(array)) return [];
  return array.map(callback);
}

/**
 * Safely reduce an array with a default value for invalid inputs
 * 
 * @example
 * safeReduce(undefined, (acc, item) => acc + item, 0) // returns 0
 * safeReduce([1, 2, 3], (acc, item) => acc + item, 0) // returns 6
 */
export function safeReduce<T, U>(
  array: T[] | undefined | null,
  callback: (acc: U, item: T, index: number) => U,
  initialValue: U
): U {
  if (!Array.isArray(array)) return initialValue;
  return array.reduce(callback as (acc: U, item: T, index: number) => U, initialValue);
}

/**
 * Ensure value is array, returns empty array if not
 * 
 * @example
 * ensureArray(undefined).map(x => x * 2) // safe, returns []
 * ensureArray([1, 2, 3]).map(x => x * 2) // returns [2, 4, 6]
 */
export function ensureArray<T>(value: T[] | undefined | null | T): T[] {
  if (Array.isArray(value)) return value;
  return [];
}

/**
 * Check if value is a non-empty array
 * 
 * @example
 * isNonEmptyArray(undefined) // returns false
 * isNonEmptyArray([]) // returns false
 * isNonEmptyArray([1, 2, 3]) // returns true
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safely slice an array, returning empty array if not an array
 * 
 * @example
 * safeSlice(undefined, 0, 3) // returns []
 * safeSlice([1, 2, 3, 4, 5], 0, 3) // returns [1, 2, 3]
 */
export function safeSlice<T>(array: T[] | undefined | null, start?: number, end?: number): T[] {
  if (!Array.isArray(array)) return [];
  return array.slice(start, end);
}

/**
 * Safely access array element by index, returning undefined if out of bounds or not an array
 * 
 * @example
 * safeGetAt(undefined, 0) // returns undefined
 * safeGetAt([1, 2, 3], 1) // returns 2
 * safeGetAt([1, 2, 3], 10) // returns undefined
 */
export function safeGetAt<T>(array: T[] | undefined | null, index: number): T | undefined {
  if (!Array.isArray(array)) return undefined;
  return array[index];
}