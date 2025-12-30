/**
 * Unit Tests for Error Logger Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorLogger } from '../../src/services/errorLogger';

describe('errorLogger', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('logging methods', () => {
    it('should log error with message', () => {
      errorLogger.error('Test error');
      const logs = errorLogger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].level).toBe('error');
    });

    it('should log error with details', () => {
      const details = { userId: '123', action: 'test' };
      errorLogger.error('Test error', details);
      const logs = errorLogger.getLogs();
      
      expect(logs[0].details).toEqual(details);
    });

    it('should log warning with correct level', () => {
      errorLogger.warning('Test warning');
      const logs = errorLogger.getLogs();
      
      expect(logs[0].level).toBe('warning');
    });

    it('should log info with correct level', () => {
      errorLogger.info('Test info');
      const logs = errorLogger.getLogs();
      
      expect(logs[0].level).toBe('info');
    });

    it('should generate unique session IDs', () => {
      errorLogger.error('Error 1');
      const logs1 = errorLogger.getLogs();
      const sessionId1 = logs1[0].sessionId;
      
      // Clear and log new error
      localStorage.clear();
      errorLogger.error('Error 2');
      const logs2 = errorLogger.getLogs();
      const sessionId2 = logs2[0].sessionId;
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should include timestamp', () => {
      errorLogger.error('Test error');
      const logs = errorLogger.getLogs();
      
      expect(logs[0].timestamp).toBeDefined();
      expect(typeof logs[0].timestamp).toBe('number');
    });
  });

  describe('getStats', () => {
    it('should return empty stats for no logs', () => {
      const stats = errorLogger.getStats();
      
      expect(stats.totalErrors).toBe(0);
      expect(stats.totalWarnings).toBe(0);
      expect(stats.totalInfo).toBe(0);
      expect(stats.sessionId).toBeDefined();
    });

    it('should count errors correctly', () => {
      errorLogger.error('Error 1');
      errorLogger.error('Error 2');
      const stats = errorLogger.getStats();
      
      expect(stats.totalErrors).toBe(2);
    });

    it('should count warnings correctly', () => {
      errorLogger.warning('Warning 1');
      errorLogger.warning('Warning 2');
      errorLogger.warning('Warning 3');
      const stats = errorLogger.getStats();
      
      expect(stats.totalWarnings).toBe(3);
    });

    it('should count info messages correctly', () => {
      errorLogger.info('Info 1');
      const stats = errorLogger.getStats();
      
      expect(stats.totalInfo).toBe(1);
    });

    it('should count all log levels correctly', () => {
      errorLogger.error('Error');
      errorLogger.warning('Warning');
      errorLogger.info('Info');
      const stats = errorLogger.getStats();
      
      expect(stats.totalLogs).toBe(3);
      expect(stats.totalErrors).toBe(1);
      expect(stats.totalWarnings).toBe(1);
      expect(stats.totalInfo).toBe(1);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON string', () => {
      errorLogger.error('Test error');
      const exported = errorLogger.exportLogs();
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export all logs', () => {
      errorLogger.error('Error 1');
      errorLogger.warning('Warning 1');
      const exported = errorLogger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    it('should not store more than 100 logs', () => {
      // Log 105 errors
      for (let i = 0; i < 105; i++) {
        errorLogger.error(`Error ${i}`);
      }
      
      const logs = errorLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should keep most recent logs', () => {
      // Log 105 errors
      for (let i = 0; i < 105; i++) {
        errorLogger.error(`Error ${i}`);
      }
      
      const logs = errorLogger.getLogs();
      expect(logs[0].message).toBe('Error 4'); // Should start from 5th oldest
      expect(logs[logs.length - 1].message).toBe('Error 104');
    });
  });
});