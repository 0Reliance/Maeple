/**
 * Error Logging Service
 * Centralized error tracking and reporting
 */

export interface ErrorLog {
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  context?: string;
  details?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
      details,
    });

    if (import.meta.env.DEV) {
      console.warn(`[ErrorLogger] ${message}`, details);
    }
  }

  /**
   * Log info
   */
  info(message: string, details?: Record<string, unknown>): void {
    this.log({
      message,
      level: 'info',
      timestamp: new Date().toISOString(),
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
    total: number;
    errors: number;
    warnings: number;
    info: number;
    byContext: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      errors: 0,
      warnings: 0,
      info: 0,
      byContext: {} as Record<string, number>,
    };

    this.logs.forEach((log) => {
      // Count by level
      if (log.level === 'error') stats.errors++;
      else if (log.level === 'warning') stats.warnings++;
      else stats.info++;

      // Count by context
      const context = log.context || 'Unknown';
      stats.byContext[context] = (stats.byContext[context] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Load persisted logs on initialization
errorLogger.loadPersistedLogs();