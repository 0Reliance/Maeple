/**
 * TypeScript Type Guards
 * 
 * Provides runtime type checking functions that narrow types
 * for better type safety and defensive programming.
 */

/**
 * Type guard to check if value is a non-empty array
 * Narrows type from unknown to T[]
 * 
 * @example
 * if (isNonEmptyArray(data)) {
 *   // data is now T[] with length > 0
 *   data[0] // safe access
 * }
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard for AudioAnalysisResult with valid observations
 * 
 * @example
 * if (hasValidObservations(data)) {
 *   // data.observations is guaranteed to be an array
 *   data.observations.map(...)
 * }
 */
export function hasValidObservations(
  data: unknown
): data is { observations: unknown[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'observations' in data &&
    Array.isArray((data as any).observations)
  );
}

/**
 * Type guard for object with specific property
 * 
 * @example
 * if (hasProperty(data, 'name')) {
 *   // data.name is guaranteed to exist
 * }
 */
export function hasProperty<T extends object, K extends keyof T>(
  obj: unknown,
  prop: K
): obj is T {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    prop in obj
  );
}

/**
 * Type guard for array of objects with specific property
 * 
 * @example
 * if (isArrayWithProperty(data, 'id')) {
 *   // data is Array<{ id: unknown }>
 *   data[0].id // safe access
 * }
 */
export function isArrayWithProperty<T, K extends keyof T>(
  value: unknown,
  prop: K
): value is T[] {
  return Array.isArray(value) && value.length > 0 && prop in value[0];
}

/**
 * Type guard for string
 * 
 * @example
 * if (isString(value)) {
 *   // value is string
 *   value.toUpperCase()
 * }
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for non-empty string
 * 
 * @example
 * if (isNonEmptyString(value)) {
 *   // value is string with length > 0
 *   value.trim()
 * }
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for number
 * 
 * @example
 * if (isNumber(value)) {
 *   // value is number
 *   value.toFixed(2)
 * }
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for object (not null, not array)
 * 
 * @example
 * if (isObject(data)) {
 *   // data is Record<string, unknown>
 *   Object.keys(data)
 * }
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for array (regardless of content)
 * 
 * @example
 * if (isArray(value)) {
 *   // value is unknown[]
 *   value.map(...)
 * }
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for undefined or null
 * 
 * @example
 * if (isNullOrUndefined(value)) {
 *   // value is null | undefined
 * }
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard for defined (not null and not undefined)
 * 
 * @example
 * if (isDefined(value)) {
 *   // value is T (excludes null | undefined)
 * }
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for API response with data property
 * 
 * @example
 * if (isApiSuccessResponse(response)) {
 *   // response.data is available
 * }
 */
export function isApiSuccessResponse<T>(
  response: unknown
): response is { data: T; success: true } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response &&
    (response as any).success === true
  );
}

/**
 * Type guard for API error response
 * 
 * @example
 * if (isApiErrorResponse(response)) {
 *   // response.error is available
 * }
 */
export function isApiErrorResponse(
  response: unknown
): response is { error: string; success: false } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'error' in response &&
    (response as any).success === false &&
    typeof (response as any).error === 'string'
  );
}

/**
 * Narrow a type by checking if it has required properties
 * 
 * @example
 * const maybeUser = { name: 'John', age: 30 };
 * if (hasProperties(maybeUser, ['name', 'age'])) {
 *   // maybeUser is typed as having name and age
 * }
 */
export function hasProperties<T extends object, K extends keyof T>(
  obj: unknown,
  props: K[]
): obj is T {
  if (!isObject(obj)) return false;
  return props.every(prop => prop in obj);
}