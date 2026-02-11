import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Cpu, Camera } from 'lucide-react';
import { errorLogger } from '@services/errorLogger';

/** Generate a stable error ID from the error message (deterministic across re-renders) */
function stableErrorId(error: Error): string {
  const msg = error.message || 'unknown';
  let h = 0;
  for (let i = 0; i < msg.length; i++) {
    h = ((h << 5) - h + msg.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-500/20 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        </div>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          We encountered an unexpected error. Don't worry, your data is safe.
          You can try again or return to the home page.
        </p>

        {error.message && (
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
            <p className="text-slate-400 text-sm font-mono">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={retry}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          Error ID: {stableErrorId(error)}
        </p>
      </div>
    </div>
  );
};

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log error to error tracking service
    errorLogger.error('React Error Boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'Unknown',
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return (
        <Fallback error={this.state.error!} retry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}

/**
 * Vision-specific error boundary for camera operations
 */
export class VisionErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    // Additional vision-specific error handling
    errorLogger.error('Vision Component Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: 'Vision/Camera',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * BioFeedback-specific error boundary
 */
export class BioFeedbackErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    errorLogger.error('BioFeedback Component Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: 'BioFeedback',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Worker-specific error boundary
 * Handles errors from web workers
 */
interface WorkerErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const WorkerErrorFallback: React.FC<WorkerErrorFallbackProps> = ({ error, retry }) => {
  const isWorkerError = error.message.toLowerCase().includes('worker');
  const isCameraError = error.message.toLowerCase().includes('camera') || 
                        error.message.toLowerCase().includes('media');

  const handleFallback = () => {
    // Reload page to clear worker state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${isWorkerError ? 'bg-orange-500/20' : isCameraError ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
            {isWorkerError ? (
              <Cpu className="w-8 h-8 text-orange-400" />
            ) : isCameraError ? (
              <Camera className="w-8 h-8 text-blue-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isWorkerError ? 'Processing Error' : isCameraError ? 'Camera Error' : 'Something went wrong'}
          </h2>
        </div>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          {isWorkerError 
            ? 'The image processor encountered an issue. This has been logged and we\'ll try using an alternative method.'
            : isCameraError
            ? 'We\'re having trouble with the camera. Please check permissions or try again.'
            : 'We encountered an unexpected error. Your data is safe and we\'ll help you recover.'}
        </p>

        {error.message && (
          <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
            <p className="text-slate-400 text-sm font-mono">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={retry}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            {isWorkerError ? 'Retry with Alternative Method' : 'Try Again'}
          </button>
          
          <button
            onClick={handleFallback}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          Error ID: {stableErrorId(error)}
        </p>
      </div>
    </div>
  );
};

export class WorkerErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    // Worker-specific error logging
    errorLogger.error('Web Worker Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: 'WebWorker',
      timestamp: new Date().toISOString(),
      errorType: 'worker_error',
    });

    // Attempt to recover worker state
    try {
      // Import imageWorkerManager and attempt cleanup
      import('@services/imageWorkerManager').then(({ imageWorkerManager }) => {
        imageWorkerManager.cleanup();
        console.log('[WorkerErrorBoundary] Worker cleaned up for recovery');
      }).catch(e => {
        console.warn('[WorkerErrorBoundary] Failed to cleanup worker:', e);
      });
    } catch (e) {
      console.warn('[WorkerErrorBoundary] Worker recovery failed:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <WorkerErrorFallback 
          error={this.state.error!} 
          retry={this.handleRetry} 
        />
      );
    }

    return this.props.children;
  }
}