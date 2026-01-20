/**
 * Unit Tests for Error Logger Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorLogger } from '../../src/services/errorLogger';

describe('ErrorLogger', () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    localStorage.clear();
    logger = new ErrorLogger({ consoleEnabled: false });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('logging methods', () => {
    it('should log error with message', () => {
      logger.error('Test error');
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].level).toBe('error');
    });

    it('should log error with details', () => {
      const details = { userId: '123', action: 'test' };
      logger.error('Test error', details);
      const logs = logger.getLogs();
      expect(logs[0].details).toEqual(details);
    });

    it('should log warning with correct level', () => {
      logger.warning('Test warning');
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('warning');
    });

    it('should log info with correct level', () => {
      logger.info('Test info');
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('info');
    });

    it('should generate unique session IDs', () => {
      logger.error('Error 1');
      const logs1 = logger.getLogs();
      const sessionId1 = logs1[0].sessionId;
      
      const newLogger = new ErrorLogger({ consoleEnabled: false });
      newLogger.error('Error 2');
      const logs2 = newLogger.getLogs();
      const sessionId2 = logs2[0].sessionId;
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should include timestamp', () => {
      logger.error('Test error');
      const logs = logger.getLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(typeof logs[0].timestamp).toBe('number');
    });
  });

  describe('getStats', () => {
    it('should return empty stats for no logs', () => {
      const stats = logger.getStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.totalWarnings).toBe(0);
      expect(stats.totalInfo).toBe(0);
    });

    it('should count errors correctly', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      const stats = logger.getStats();
      expect(stats.totalErrors).toBe(2);
    });

    it('should count warnings correctly', () => {
      logger.warning('Warning 1');
      logger.warning('Warning 2');
      logger.warning('Warning 3');
      const stats = logger.getStats();
      expect(stats.totalWarnings).toBe(3);
    });

    it('should count info messages correctly', () => {
      logger.info('Info 1');
      const stats = logger.getStats();
      expect(stats.totalInfo).toBe(1);
    });

    it('should count all log levels correctly', () => {
      logger.error('Error');
      logger.warning('Warning');
      logger.info('Info');
      const stats = logger.getStats();
      expect(stats.totalLogs).toBe(3);
      expect(stats.totalErrors).toBe(1);
      expect(stats.totalWarnings).toBe(1);
      expect(stats.totalInfo).toBe(1);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON string', () => {
      logger.error('Test error');
      const exported = logger.exportLogs();
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export all logs', () => {
      logger.error('Error 1');
      logger.warning('Warning 1');
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    it('should not store more than 100 logs', () => {
      for (let i = 0; i < 105; i++) {
        logger.error(`Error ${i}`);
      }
      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should keep most recent logs', () => {
      for (let i = 0; i < 105; i++) {
        logger.error(`Error ${i}`);
      }
      const logs = logger.getLogs();
      expect(logs[0].message).toBe('Error 5');
      expect(logs[logs.length - 1].message).toBe('Error 104');
    });
  });
});
