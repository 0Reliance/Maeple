/**
 * Error Logger Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ErrorLogger,
  logError,
  logWarn,
  logInfo,
} from '../services/errorLogger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.addEventListener
const originalAddEventListener = window.addEventListener;

describe('ErrorLogger', () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    logger = new ErrorLogger({ 
      consoleEnabled: false, // Disable console spam during tests
    });
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const stats = logger.getStats();
      expect(stats.total).toBe(0);
    });

    it('should load existing buffer from localStorage', () => {
      const existingLogs = JSON.stringify([
        { id: 'test1', level: 'error', message: 'Test', timestamp: '2024-01-15' },
      ]);
      localStorageMock.getItem.mockReturnValue(existingLogs);
      
      const newLogger = new ErrorLogger({ consoleEnabled: false });
      expect(newLogger.getRecentErrors(10)).toHaveLength(1);
    });
  });

  describe('error()', () => {
    it('should log an error message', () => {
      logger.error('Test error');
      
      const recent = logger.getRecentErrors(1);
      expect(recent).toHaveLength(1);
      expect(recent[0].message).toBe('Test error');
      expect(recent[0].level).toBe('error');
    });

    it('should include context in the log', () => {
      logger.error('Test error', { userId: '123', action: 'save' });
      
      const recent = logger.getRecentErrors(1);
      expect(recent[0].context).toEqual({ userId: '123', action: 'save' });
    });

    it('should save to localStorage', () => {
      logger.error('Test error');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('warn()', () => {
    it('should log a warning message', () => {
      logger.warn('Test warning');
      
      const recent = logger.getRecentErrors(1);
      expect(recent[0].level).toBe('warn');
    });
  });

  describe('info()', () => {
    it('should log an info message', () => {
      logger.info('Test info');
      
      const recent = logger.getRecentErrors(1);
      expect(recent[0].level).toBe('info');
    });
  });

  describe('logError()', () => {
    it('should log an Error object with stack trace', () => {
      const error = new Error('Something went wrong');
      logger.logError(error, { extra: 'data' });
      
      const recent = logger.getRecentErrors(1);
      expect(recent[0].message).toBe('Something went wrong');
      expect(recent[0].context).toHaveProperty('stack');
      expect(recent[0].context).toHaveProperty('extra', 'data');
    });
  });

  describe('logBoundaryError()', () => {
    it('should log React boundary errors', () => {
      const error = new Error('Component error');
      logger.logBoundaryError(error, { componentStack: '<App> at <Component>' });
      
      const recent = logger.getRecentErrors(1);
      expect(recent[0].message).toBe('React Error Boundary Caught');
      expect(recent[0].context?.componentStack).toBe('<App> at <Component>');
    });
  });

  describe('getRecentErrors()', () => {
    it('should return the specified number of recent errors', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      logger.error('Error 3');
      
      const recent = logger.getRecentErrors(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].message).toBe('Error 2');
      expect(recent[1].message).toBe('Error 3');
    });
  });

  describe('getStats()', () => {
    it('should return error statistics', () => {
      logger.error('Error 1');
      logger.warn('Warning 1');
      logger.error('Error 2');
      logger.info('Info 1');
      
      const stats = logger.getStats();
      expect(stats.total).toBe(4);
      expect(stats.errors).toBe(2);
      expect(stats.warnings).toBe(1);
      expect(stats.lastError).toBeDefined();
    });
  });

  describe('clearBuffer()', () => {
    it('should clear all logged errors', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      
      logger.clearBuffer();
      
      expect(logger.getRecentErrors(10)).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('maeple_error_log');
    });
  });

  describe('exportLogs()', () => {
    it('should export logs as JSON string', () => {
      logger.error('Test error');
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe('Test error');
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration', () => {
      logger.updateConfig({ enabled: false });
      logger.error('This should not be logged');
      
      expect(logger.getRecentErrors(10)).toHaveLength(0);
    });
  });

  describe('buffer trimming', () => {
    it('should trim buffer to bufferSize when saving', () => {
      const smallLogger = new ErrorLogger({ 
        consoleEnabled: false,
        bufferSize: 3,
      });
      
      smallLogger.error('Error 1');
      smallLogger.error('Error 2');
      smallLogger.error('Error 3');
      smallLogger.error('Error 4');
      smallLogger.error('Error 5');
      
      const recent = smallLogger.getRecentErrors(10);
      expect(recent.length).toBeLessThanOrEqual(3);
    });
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('logError should call errorLogger.error', () => {
    // The singleton will be used, just verify no errors
    expect(() => logError('Test')).not.toThrow();
  });

  it('logWarn should call errorLogger.warn', () => {
    expect(() => logWarn('Test')).not.toThrow();
  });

  it('logInfo should call errorLogger.info', () => {
    expect(() => logInfo('Test')).not.toThrow();
  });
});
