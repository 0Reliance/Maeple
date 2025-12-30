import React from 'react';
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Clock,
  Server,
  AlertCircle,
  CheckCircle,
  X,
  Wifi,
  SignalLow,
  Zap,
} from 'lucide-react';

export type ErrorType =
  | 'network'
  | 'offline'
  | 'slow'
  | 'timeout'
  | 'circuit_open'
  | 'service_unavailable'
  | 'rate_limit'
  | 'api_key'
  | 'camera'
  | 'microphone'
  | 'storage'
  | 'unknown';

export interface ErrorMessage {
  type: ErrorType;
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ErrorBannerProps {
  error: ErrorType | string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

const getErrorConfig = (type: ErrorType | string): ErrorMessage => {
  switch (type) {
    case 'offline':
      return {
        type: 'offline',
        title: 'Offline Mode',
        message: 'You appear to be offline. Your data is being saved locally.',
        suggestions: [
          'Check your internet connection',
          'Your data will sync when you come back online',
        ],
        canRetry: true,
        actionLabel: 'Check Connection',
      };

    case 'network':
      return {
        type: 'network',
        title: 'Network Error',
        message: 'We\'re having trouble connecting to the server.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'The service might be temporarily unavailable',
        ],
        canRetry: true,
        actionLabel: 'Retry',
      };

    case 'slow':
      return {
        type: 'slow',
        title: 'Slow Connection',
        message: 'Your connection is slower than usual.',
        suggestions: [
          'The request may take longer to complete',
          'Consider switching to WiFi if available',
          'Your data is being saved locally',
        ],
        canRetry: false,
      };

    case 'timeout':
      return {
        type: 'timeout',
        title: 'Request Timed Out',
        message: 'The request took too long to complete.',
        suggestions: [
          'Check your internet connection',
          'Try again in a moment',
          'The server might be experiencing high load',
        ],
        canRetry: true,
        actionLabel: 'Try Again',
      };

    case 'circuit_open':
      return {
        type: 'circuit_open',
        title: 'AI Service Temporarily Unavailable',
        message: 'The AI service is temporarily unavailable due to repeated errors.',
        suggestions: [
          'Please wait a moment before trying again',
          'The service should recover automatically',
          'Your data is saved locally',
        ],
        canRetry: false,
      };

    case 'service_unavailable':
      return {
        type: 'service_unavailable',
        title: 'Service Unavailable',
        message: 'The required service is currently unavailable.',
        suggestions: [
          'Please try again later',
          'The team has been notified',
          'Check our status page for updates',
        ],
        canRetry: true,
        actionLabel: 'Try Again',
      };

    case 'rate_limit':
      return {
        type: 'rate_limit',
        title: 'Too Many Requests',
        message: 'You\'ve made too many requests. Please wait.',
        suggestions: [
          'Please wait a moment before trying again',
          'Rate limits help ensure service availability for everyone',
          'Your data is being saved locally',
        ],
        canRetry: false,
        actionLabel: 'Wait',
      };

    case 'api_key':
      return {
        type: 'api_key',
        title: 'AI Service Not Configured',
        message: 'Please configure an AI provider to use this feature.',
        suggestions: [
          'Go to Settings to add an API key',
          'You can use Ollama for local AI (no API key needed)',
          'Some features may be limited without AI',
        ],
        canRetry: false,
        actionLabel: 'Go to Settings',
      };

    case 'camera':
      return {
        type: 'camera',
        title: 'Camera Access Error',
        message: 'We couldn\'t access your camera.',
        suggestions: [
          'Check if camera permissions are granted',
          'Make sure another app isn\'t using the camera',
          'Try refreshing the page',
        ],
        canRetry: true,
        actionLabel: 'Try Again',
      };

    case 'microphone':
      return {
        type: 'microphone',
        title: 'Microphone Access Error',
        message: 'We couldn\'t access your microphone.',
        suggestions: [
          'Check if microphone permissions are granted',
          'Make sure another app isn\'t using the microphone',
          'Try refreshing the page',
        ],
        canRetry: true,
        actionLabel: 'Try Again',
      };

    case 'storage':
      return {
        type: 'storage',
        title: 'Storage Error',
        message: 'We couldn\'t save your data to local storage.',
        suggestions: [
          'Check if you have available storage',
          'Try clearing browser cache',
          'Contact support if this persists',
        ],
        canRetry: true,
        actionLabel: 'Try Again',
      };

    default:
      return {
        type: 'unknown',
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred.',
        suggestions: [
          'Try refreshing the page',
          'If the problem persists, please contact support',
          'Your data is safe',
        ],
        canRetry: true,
        actionLabel: 'Try Again',
      };
  }
};

const getErrorIcon = (type: ErrorType | string) => {
  switch (type) {
    case 'offline':
      return WifiOff;
    case 'network':
      return Server;
    case 'slow':
      return SignalLow;
    case 'timeout':
      return Clock;
    case 'circuit_open':
    case 'rate_limit':
      return AlertTriangle;
    case 'service_unavailable':
      return Server;
    case 'api_key':
      return Zap;
    case 'camera':
      return AlertCircle;
    case 'microphone':
      return AlertCircle;
    case 'storage':
      return AlertTriangle;
    default:
      return AlertCircle;
  }
};

const getErrorColor = (type: ErrorType | string): string => {
  switch (type) {
    case 'offline':
      return 'bg-slate-500';
    case 'network':
    case 'timeout':
      return 'bg-amber-500';
    case 'slow':
      return 'bg-orange-500';
    case 'circuit_open':
    case 'rate_limit':
      return 'bg-red-500';
    case 'service_unavailable':
      return 'bg-amber-600';
    case 'api_key':
      return 'bg-blue-500';
    case 'camera':
    case 'microphone':
      return 'bg-purple-500';
    case 'storage':
      return 'bg-rose-500';
    default:
      return 'bg-slate-600';
  }
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  message,
  onRetry,
  onDismiss,
  showDismiss = true,
  className = '',
}) => {
  const errorType = error as ErrorType;
  const config = getErrorConfig(errorType);
  const Icon = getErrorIcon(errorType);
  const bgColor = getErrorColor(errorType);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl ${className}`}
      role="alert"
    >
      <div className={`p-2 rounded-lg ${bgColor} shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-900 dark:text-white">
            {config.title}
          </h4>
          {showDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
          {message || config.message}
        </p>

        {config.suggestions.length > 0 && (
          <ul className="text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
            {config.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center gap-2">
          {config.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {config.actionLabel || 'Retry'}
            </button>
          )}

          {config.actionLabel && !config.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {config.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`}>
      <WifiOff className="w-4 h-4 text-slate-500" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Offline Mode
      </span>
    </div>
  );
};

export const ConnectionStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg ${className}`}>
      <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
        Online
      </span>
    </div>
  );
};

export const SlowConnectionWarning: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg ${className}`}>
      <SignalLow className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
        Slow Connection
      </span>
    </div>
  );
};

export const CircuitOpenWarning: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg ${className}`}>
      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
      <span className="text-sm font-medium text-red-700 dark:text-red-300">
        AI Service Temporarily Unavailable
      </span>
    </div>
  );
};

export default ErrorBanner;