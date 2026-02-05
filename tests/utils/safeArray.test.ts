/**
 * Tests for safeArray utility functions
 * These tests ensure that array operations are safe from undefined/null values
 */

import { describe, it, expect } from 'vitest';
import {
  safeMap,
  safeLength,
  safeReduce,
  ensureArray,
  isNonEmptyArray,
  safeSlice,
  safeGetAt
} from '../../src/utils/safeArray';

describe('safeArray', () => {
  describe('safeMap', () => {
    it('should map over valid arrays', () => {
      const result = safeMap([1, 2, 3], x => x * 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should return empty array for undefined', () => {
      const result = safeMap(undefined as any, x => x * 2);
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = safeMap(null as any, x => x * 2);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array values', () => {
      const result = safeMap('string' as any, x => x);
      expect(result).toEqual([]);
    });
  });

  describe('safeLength', () => {
    it('should return length of valid arrays', () => {
      expect(safeLength([1, 2, 3])).toBe(3);
    });

    it('should return 0 for undefined', () => {
      expect(safeLength(undefined as any)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(safeLength(null as any)).toBe(0);
    });

    it('should return 0 for non-array values', () => {
      expect(safeLength('string' as any)).toBe(0);
    });
  });

  describe('safeReduce', () => {
    it('should reduce valid arrays', () => {
      const result = safeReduce([1, 2, 3], (acc, x) => acc + x, 0);
      expect(result).toBe(6);
    });

    it('should return default value for undefined', () => {
      const result = safeReduce(undefined as any, (acc, x) => acc + x, 0);
      expect(result).toBe(0);
    });

    it('should return default value for null', () => {
      const result = safeReduce(null as any, (acc, x) => acc + x, 10);
      expect(result).toBe(10);
    });

    it('should return default value for non-array values', () => {
      const result = safeReduce('string' as any, (acc, x) => acc, 'default');
      expect(result).toBe('default');
    });
  });

  describe('ensureArray', () => {
    it('should return array if already array', () => {
      const arr = [1, 2, 3];
      const result = ensureArray(arr);
      expect(result).toBe(arr);
    });

    it('should return empty array for undefined', () => {
      const result = ensureArray(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = ensureArray(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array values', () => {
      const result = ensureArray('string');
      expect(result).toEqual([]);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should return true for non-empty arrays', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNonEmptyArray(undefined)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNonEmptyArray(null)).toBe(false);
    });

    it('should return false for non-array values', () => {
      expect(isNonEmptyArray('string')).toBe(false);
    });
  });

  describe('safeSlice', () => {
    it('should slice valid arrays', () => {
      const result = safeSlice([1, 2, 3, 4, 5], 1, 3);
      expect(result).toEqual([2, 3]);
    });

    it('should return empty array for undefined', () => {
      const result = safeSlice(undefined as any, 0, 2);
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = safeSlice(null as any, 0, 2);
      expect(result).toEqual([]);
    });
  });

  describe('safeGetAt', () => {
    it('should get element at valid index', () => {
      const result = safeGetAt(['a', 'b', 'c'], 1);
      expect(result).toBe('b');
    });

    it('should return undefined for out of bounds', () => {
      const result = safeGetAt(['a', 'b', 'c'], 10);
      expect(result).toBeUndefined();
    });

    it('should return undefined for negative index', () => {
      const result = safeGetAt(['a', 'b', 'c'], -1);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined array', () => {
      const result = safeGetAt(undefined as any, 0);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null array', () => {
      const result = safeGetAt(null as any, 0);
      expect(result).toBeUndefined();
    });
  });
});