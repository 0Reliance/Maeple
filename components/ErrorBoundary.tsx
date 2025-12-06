import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React errors and provides a graceful fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isApiKeyError = this.state.error?.message?.includes('API Key');
      
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isApiKeyError ? 'API Key Required' : 'Something went wrong'}
                </h1>
                <p className="text-slate-600 mt-1">
                  {isApiKeyError 
                    ? 'MAEPLE needs your Google Gemini API key to function.'
                    : 'An unexpected error occurred in the application.'}
                </p>
              </div>
            </div>

            {isApiKeyError ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-blue-900">Quick Setup:</h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Get your free API key from: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google AI Studio</a></li>
                  <li>Create a <code className="bg-blue-100 px-2 py-1 rounded">.env</code> file in the project root</li>
                  <li>Add: <code className="bg-blue-100 px-2 py-1 rounded">VITE_GEMINI_API_KEY=your_key_here</code></li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-slate-800">Error Details:</h3>
                <pre className="text-sm text-red-600 overflow-auto max-h-40">
                  {this.state.error?.toString()}
                </pre>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="text-xs text-slate-600 mt-2">
                    <summary className="cursor-pointer font-medium">Stack Trace</summary>
                    <pre className="mt-2 overflow-auto max-h-60 bg-slate-100 p-3 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                <Home size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-medium hover:bg-slate-300 transition-colors"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-sm text-slate-500">
              <p>Need help? Check the <code className="bg-slate-100 px-2 py-1 rounded">README.md</code> for setup instructions.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
