/**
 * Toast Notification Component
 * 
 * Displays user feedback messages (errors, warnings, success, info)
 * Supports auto-dismiss, manual dismiss, and action buttons
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, RefreshCw, ExternalLink } from 'lucide-react';
import { userFeedback, ToastData } from '@services/userFeedbackService';
import { useNavigate } from 'react-router-dom';

const ToastNotification: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to toast notifications
    const unsubscribe = userFeedback.onToast((toast) => {
      setToasts(prev => {
        // Remove existing toast with same ID (update)
        const filtered = prev.filter(t => t.id !== toast.id);
        return [...filtered, toast];
      });
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Auto-dismiss toasts after duration
    const timeouts = toasts
      .filter(t => t.duration && t.duration > 0)
      .map(toast => {
        return setTimeout(() => {
          userFeedback.dismiss(toast.id);
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration!);
      });

    // Cleanup all timeouts
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [toasts]);

  const handleDismiss = (id: string) => {
    userFeedback.dismiss(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAction = (toast: ToastData) => {
    if (toast.onAction) {
      toast.onAction();
    }
    handleDismiss(toast.id);
  };

  const handleRetry = (toast: ToastData) => {
    if (toast.retryAction) {
      toast.retryAction();
    }
    handleDismiss(toast.id);
  };

  const handleHelpLink = (toast: ToastData) => {
    if (toast.helpLink) {
      navigate(toast.helpLink);
    }
    handleDismiss(toast.id);
  };

  const getIcon = (type: ToastData['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      case 'error':
      default:
        return <AlertTriangle size={20} className="text-red-500" />;
    }
  };

  const getIconBg = (type: ToastData['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'error':
      default:
        return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  const getBorderColor = (type: ToastData['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
        return 'border-blue-500';
      case 'error':
      default:
        return 'border-red-500';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto bg-white dark:bg-slate-800 
            rounded-lg shadow-lg border-l-4 ${getBorderColor(toast.type)}
            p-4 animate-slideInRight
            transition-all duration-300 ease-out
            hover:shadow-xl
          `}
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          {/* Icon and Content */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 p-2 rounded-full ${getIconBg(toast.type)}`}>
              {getIcon(toast.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                {toast.title}
              </h4>

              {/* Message */}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {toast.message}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {/* Retry Button */}
                {toast.retryAction && (
                  <button
                    onClick={() => handleRetry(toast)}
                    className="flex items-center gap-1.5 px-3 py-1.5 
                      bg-indigo-600 hover:bg-indigo-700 
                      text-white text-xs font-medium rounded-md
                      transition-colors"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                )}

                {/* Custom Action Button */}
                {toast.onAction && toast.actionLabel && (
                  <button
                    onClick={() => handleAction(toast)}
                    className="px-3 py-1.5 
                      bg-slate-600 hover:bg-slate-700 
                      text-white text-xs font-medium rounded-md
                      transition-colors"
                  >
                    {toast.actionLabel}
                  </button>
                )}

                {/* Help Link */}
                {toast.helpLink && (
                  <button
                    onClick={() => handleHelpLink(toast)}
                    className="flex items-center gap-1.5 px-3 py-1.5 
                      bg-slate-100 dark:bg-slate-700 
                      hover:bg-slate-200 dark:hover:bg-slate-600 
                      text-slate-700 dark:text-slate-300 
                      text-xs font-medium rounded-md
                      transition-colors"
                  >
                    <ExternalLink size={14} />
                    Help
                  </button>
                )}
              </div>
            </div>

            {/* Dismiss Button */}
            {toast.dismissible !== false && (
              <button
                onClick={() => handleDismiss(toast.id)}
                className="flex-shrink-0 p-1 rounded-md 
                  text-slate-400 hover:text-slate-600 
                  dark:text-slate-500 dark:hover:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-700
                  transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;