/**
 * Error Logging Service
 * Centralized error tracking and reporting
 */

export interface ErrorLog {
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: number;
  context?: string;
  details?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

export class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private sessionId: string;

  constructor(config?: { consoleEnabled?: boolean; maxLogs?: number; bufferSize?: number }) {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    if (config) {
      this.updateConfig(config);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        error: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
      event.preventDefault();
    });

    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        error: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });
  }

  /**
   * Log an error
   */
  error(message: string, details?: Record<string, unknown>): void {
    this.log({
      message,
      level: 'error',
      timestamp: Date.now(),
      details,
    });

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error(`[ErrorLogger] ${message}`, details);
    }
  }

  /**
   * Log a warning
   */
  warning(message: string, details?: Record<string, unknown>): void {
    this.log({
      message,
      level: 'warning',
      timestamp: Date.now(),
      details,
    });

    if (import.meta.env.DEV) {
      console.warn(`[ErrorLogger] ${message}`, details);
    }
  }

  // Alias for warning
  warn(message: string, details?: Record<string, unknown>): void {
    this.warning(message, details);
  }

  /**
   * Log an Error object
   */
  logError(error: Error, details?: Record<string, unknown>): void {
    this.error(error.message, {
      ...details,
      name: error.name,
      stack: error.stack,
    });
  }

  /**
   * Log a React Error Boundary error
   */
  logBoundaryError(error: Error, componentStack: string): void {
    this.error(`React Boundary Error: ${error.message}`, {
      stack: error.stack,
      componentStack,
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.clearLogs();
  }

  /**
   * Update configuration
   */
  updateConfig(config: { enabled?: boolean; maxLogs?: number; bufferSize?: number; consoleEnabled?: boolean }): void {
    if (config.maxLogs) {
      this.maxLogs = config.maxLogs;
    }
    if (config.bufferSize) {
      this.maxLogs = config.bufferSize;
    }
    // Other config options can be added here
  }

  /**
   * Log info
   */
  info(message: string, details?: Record<string, unknown>): void {
    this.log({
      message,
      level: 'info',
      timestamp: Date.now(),
      details,
    });

    if (import.meta.env.DEV) {
      console.info(`[ErrorLogger] ${message}`, details);
    }
  }

  /**
   * Add log to internal storage
   */
  private log(logEntry: Omit<ErrorLog, 'userId' | 'sessionId'>): void {
    const entry: ErrorLog = {
      ...logEntry,
      userId: this.getUserId(),
      sessionId: this.sessionId,
    };

    this.logs.push(entry);

    // Keep only maxLogs most recent entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Persist to localStorage for crash recovery
    this.persistLogs();
  }

  /**
   * Get user ID from localStorage
   */
  private getUserId(): string | undefined {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs(): void {
    try {
      const recentLogs = this.logs.slice(-20); // Keep last 20 logs
      localStorage.setItem('errorLogs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to persist error logs:', error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get error logs only
   */
  getErrorLogs(): ErrorLog[] {
    return this.logs.filter((log) => log.level === 'error');
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('errorLogs');
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Load persisted logs from localStorage
   */
  loadPersistedLogs(): void {
    try {
      const persisted = localStorage.getItem('errorLogs');
      if (persisted) {
        const logs: ErrorLog[] = JSON.parse(persisted);
        this.logs = logs;
      }
    } catch (error) {
      console.warn('Failed to load persisted error logs:', error);
    }
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalLogs: number;
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
    byContext: Record<string, number>;
  } {
    const stats = {
      totalLogs: this.logs.length,
      totalErrors: 0,
      totalWarnings: 0,
      totalInfo: 0,
      byContext: {} as Record<string, number>,
    };

    this.logs.forEach((log) => {
      // Count by level
      if (log.level === 'error') stats.totalErrors++;
      else if (log.level === 'warning') stats.totalWarnings++;
      else stats.totalInfo++;

      // Count by context
      const context = log.context || 'Unknown';
      stats.byContext[context] = (stats.byContext[context] || 0) + 1;
    });

    return stats;
  }
}

// Singleton pattern - only initialize on first actual method call via Proxy
let loggerInstance: ErrorLogger | null = null;

export function getErrorLogger(): ErrorLogger {
  if (!loggerInstance) {
    loggerInstance = new ErrorLogger();
    loggerInstance.loadPersistedLogs();
  }
  return loggerInstance;
}

// Backward compatible export - defers initialization
export const errorLogger: ErrorLogger = new Proxy({} as ErrorLogger, {
  get(target, prop) {
    if (!loggerInstance) {
      loggerInstance = new ErrorLogger();
      loggerInstance.loadPersistedLogs();
    }
    return loggerInstance[prop as keyof ErrorLogger];
  }
});

// Convenience functions for direct usage
export const logError = (message: string, details?: Record<string, unknown>) => errorLogger.error(message, details);
export const logWarn = (message: string, details?: Record<string, unknown>) => errorLogger.warn(message, details);
export const logInfo = (message: string, details?: Record<string, unknown>) => errorLogger.info(message, details);
export const getErrorLogs = () => errorLogger.getRecentErrors();
