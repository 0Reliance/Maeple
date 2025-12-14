/**
 * MAEPLE Error Logging Service
 * 
 * Centralized error tracking that can be extended to external services.
 * Supports: Console, localStorage buffer, and external endpoints.
 */

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
  userAgent: string;
  url: string;
}

interface ErrorLogConfig {
  enabled: boolean;
  consoleEnabled: boolean;
  bufferSize: number;
  externalEndpoint?: string;
  onError?: (error: ErrorLogEntry) => void;
}

const STORAGE_KEY = 'maeple_error_log';

const DEFAULT_CONFIG: ErrorLogConfig = {
  enabled: true,
  consoleEnabled: true,
  bufferSize: 50,
  externalEndpoint: undefined,
  onError: undefined,
};

class ErrorLogger {
  private config: ErrorLogConfig;
  private buffer: ErrorLogEntry[] = [];

  constructor(config: Partial<ErrorLogConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadBuffer();
    this.setupGlobalHandlers();
  }

  private loadBuffer(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.buffer = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load error buffer:', e);
      this.buffer = [];
    }
  }

  private saveBuffer(): void {
    try {
      // Keep only last N entries
      const trimmed = this.buffer.slice(-this.config.bufferSize);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      this.buffer = trimmed;
    } catch (e) {
      console.warn('Failed to save error buffer:', e);
    }
  }

  private setupGlobalHandlers(): void {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: String(event.reason),
        stack: event.reason?.stack,
      });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });
  }

  private createEntry(
    level: ErrorLogEntry['level'],
    message: string,
    context?: Record<string, unknown>
  ): ErrorLogEntry {
    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      stack: context?.stack as string | undefined,
      componentStack: context?.componentStack as string | undefined,
      context: context ? { ...context } : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private async sendToExternal(entry: ErrorLogEntry): Promise<void> {
    if (!this.config.externalEndpoint) return;

    try {
      await fetch(this.config.externalEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (e) {
      // Don't recursively log fetch errors
      console.warn('Failed to send error to external endpoint:', e);
    }
  }

  private log(
    level: ErrorLogEntry['level'],
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.config.enabled) return;

    const entry = this.createEntry(level, message, context);

    // Console output
    if (this.config.consoleEnabled) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
      consoleMethod(`[MAEPLE ${level.toUpperCase()}]`, message, context || '');
    }

    // Add to buffer
    this.buffer.push(entry);
    this.saveBuffer();

    // External logging
    if (this.config.externalEndpoint) {
      this.sendToExternal(entry);
    }

    // Custom handler
    if (this.config.onError) {
      this.config.onError(entry);
    }
  }

  /**
   * Log an error
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Log an Error object
   */
  logError(error: Error, context?: Record<string, unknown>): void {
    this.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    });
  }

  /**
   * Log a React Error Boundary catch
   */
  logBoundaryError(error: Error, errorInfo: { componentStack?: string }): void {
    this.error('React Error Boundary Caught', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  /**
   * Get recent errors for display/debugging
   */
  getRecentErrors(count = 10): ErrorLogEntry[] {
    return this.buffer.slice(-count);
  }

  /**
   * Clear the error buffer
   */
  clearBuffer(): void {
    this.buffer = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get error statistics
   */
  getStats(): { total: number; errors: number; warnings: number; lastError?: string } {
    const errors = this.buffer.filter(e => e.level === 'error').length;
    const warnings = this.buffer.filter(e => e.level === 'warn').length;
    const lastEntry = this.buffer[this.buffer.length - 1];

    return {
      total: this.buffer.length,
      errors,
      warnings,
      lastError: lastEntry?.timestamp,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorLogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.buffer, null, 2);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions
export const logError = (message: string, context?: Record<string, unknown>) => 
  errorLogger.error(message, context);

export const logWarn = (message: string, context?: Record<string, unknown>) => 
  errorLogger.warn(message, context);

export const logInfo = (message: string, context?: Record<string, unknown>) => 
  errorLogger.info(message, context);

export const logBoundaryError = (error: Error, errorInfo: { componentStack?: string }) =>
  errorLogger.logBoundaryError(error, errorInfo);

// Export class for custom instances
export { ErrorLogger };
export type { ErrorLogEntry, ErrorLogConfig };
