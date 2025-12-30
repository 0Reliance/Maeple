/**
 * User Feedback Service
 * 
 * Provides centralized user feedback for errors, warnings, and success messages
 * Replaces silent console.error/warn with user-facing feedback
 * Supports toast notifications, alerts with recovery options, and in-place feedback
 */

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { errorLogger } from './errorLogger';

export type FeedbackType = 'error' | 'warning' | 'success' | 'info';

export interface FeedbackOptions {
  type: FeedbackType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss after ms (default: 5000)
  actionLabel?: string; // Custom action button text
  onAction?: () => void; // Action button handler
  retryAction?: () => void; // Retry button handler
  helpLink?: string; // Link to help documentation
  dismissible?: boolean; // Can user dismiss? (default: true)
}

export interface ToastData extends FeedbackOptions {
  id: string;
  timestamp: number;
}

/**
 * User Feedback Service
 * 
 * Singleton service that manages user feedback
 * Can be extended with UI components for toast notifications
 */
class UserFeedbackService {
  private listeners: Set<(toast: ToastData) => void> = new Set();
  private toasts: Map<string, ToastData> = new Map();

  /**
   * Subscribe to toast notifications
   */
  onToast(callback: (toast: ToastData) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of a new toast
   */
  private notify(toast: ToastData): void {
    this.listeners.forEach(listener => listener(toast));
  }

  /**
   * Show error message
   */
  error(options: Omit<FeedbackOptions, 'type'>): string {
    const toast: ToastData = {
      id: this.generateId(),
      type: 'error',
      timestamp: Date.now(),
      duration: 6000,
      ...options
    };

    this.toasts.set(toast.id, toast);
    this.notify(toast);

    // Log error to console and error tracking
    console.error(`[UserFeedback] ERROR: ${options.title}`, options.message);
    errorLogger.error('User Feedback Error', {
      title: options.title,
      message: options.message,
      timestamp: toast.timestamp
    });

    return toast.id;
  }

  /**
   * Show warning message
   */
  warning(options: Omit<FeedbackOptions, 'type'>): string {
    const toast: ToastData = {
      id: this.generateId(),
      type: 'warning',
      timestamp: Date.now(),
      duration: 5000,
      ...options
    };

    this.toasts.set(toast.id, toast);
    this.notify(toast);

    // Log warning to console
    console.warn(`[UserFeedback] WARNING: ${options.title}`, options.message);

    return toast.id;
  }

  /**
   * Show success message
   */
  success(options: Omit<FeedbackOptions, 'type'>): string {
    const toast: ToastData = {
      id: this.generateId(),
      type: 'success',
      timestamp: Date.now(),
      duration: 4000,
      ...options
    };

    this.toasts.set(toast.id, toast);
    this.notify(toast);

    // Log success to console
    console.log(`[UserFeedback] SUCCESS: ${options.title}`, options.message);

    return toast.id;
  }

  /**
   * Show info message
   */
  info(options: Omit<FeedbackOptions, 'type'>): string {
    const toast: ToastData = {
      id: this.generateId(),
      type: 'info',
      timestamp: Date.now(),
      duration: 4000,
      ...options
    };

    this.toasts.set(toast.id, toast);
    this.notify(toast);

    // Log info to console
    console.info(`[UserFeedback] INFO: ${options.title}`, options.message);

    return toast.id;
  }

  /**
   * Dismiss a toast
   */
  dismiss(id: string): void {
    this.toasts.delete(id);
    console.log(`[UserFeedback] Dismissed: ${id}`);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts.clear();
    console.log(`[UserFeedback] Dismissed all`);
  }

  /**
   * Get active toasts
   */
  getActiveToasts(): ToastData[] {
    return Array.from(this.toasts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generate unique ID for toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convenience method: Show camera permission error
   */
  cameraPermissionDenied(retryAction?: () => void): string {
    return this.error({
      title: 'Camera Permission Denied',
      message: 'Please enable camera access in your browser settings to use this feature.',
      actionLabel: 'Open Settings',
      onAction: () => {
        // Try to open browser settings
        window.open('chrome://settings/content/camera', '_blank');
      },
      retryAction,
      helpLink: '/guide#camera-permissions'
    });
  }

  /**
   * Convenience method: Show microphone permission error
   */
  microphonePermissionDenied(retryAction?: () => void): string {
    return this.error({
      title: 'Microphone Permission Denied',
      message: 'Please enable microphone access in your browser settings to use this feature.',
      actionLabel: 'Open Settings',
      onAction: () => {
        // Try to open browser settings
        window.open('chrome://settings/content/microphone', '_blank');
      },
      retryAction,
      helpLink: '/guide#microphone-permissions'
    });
  }

  /**
   * Convenience method: Show network error
   */
  networkError(retryAction?: () => void): string {
    return this.error({
      title: 'Network Error',
      message: 'Unable to connect to server. Please check your internet connection.',
      retryAction,
      helpLink: '/guide#troubleshooting'
    });
  }

  /**
   * Convenience method: Show export error
   */
  exportFailed(error: Error, retryAction?: () => void): string {
    return this.error({
      title: 'Export Failed',
      message: `Unable to export data: ${error.message}`,
      retryAction,
      helpLink: '/guide#export-issues'
    });
  }

  /**
   * Convenience method: Show import error
   */
  importFailed(error: Error, retryAction?: () => void): string {
    return this.error({
      title: 'Import Failed',
      message: `Unable to import data: ${error.message}`,
      retryAction,
      helpLink: '/guide#import-issues'
    });
  }

  /**
   * Convenience method: Show processing error
   */
  processingFailed(operation: string, retryAction?: () => void): string {
    return this.error({
      title: 'Processing Failed',
      message: `Unable to ${operation}. Please try again.`,
      retryAction
    });
  }

  /**
   * Convenience method: Show save success
   */
  saveSuccess(item: string): string {
    return this.success({
      title: 'Saved',
      message: `${item} saved successfully.`
    });
  }

  /**
   * Convenience method: Show delete confirmation
   */
  deleteConfirmation(item: string, onDelete: () => void): string {
    return this.warning({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${item}?`,
      actionLabel: 'Delete',
      onAction: onDelete,
      duration: 0 // Don't auto-dismiss
    });
  }
}

// Singleton instance
export const userFeedback = new UserFeedbackService();

export default userFeedback;