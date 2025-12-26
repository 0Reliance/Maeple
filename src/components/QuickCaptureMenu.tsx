import { ArrowRight, Camera, MessageSquare, Mic } from 'lucide-react';
import React from 'react';

interface Props {
  onMethodSelect: (method: 'bio-mirror' | 'voice' | 'text') => void;
  disabled?: boolean;
}

/**
 * QuickCaptureMenu
 * 
 * TAP-TAP-TAP input selection for journal entry capture.
 * Three equally valid options - no hierarchy between methods.
 * User chooses what feels right in the moment.
 */
const QuickCaptureMenu: React.FC<Props> = ({ onMethodSelect, disabled = false }) => {
  const captureMethods = [
    {
      id: 'bio-mirror' as const,
      icon: Camera,
      label: 'Bio-Mirror',
      description: 'Photo analysis',
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'voice' as const,
      icon: Mic,
      label: 'Voice',
      description: 'Audio capture',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'text' as const,
      icon: MessageSquare,
      label: 'Text',
      description: 'Type input',
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-6 py-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Capture Your State
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Choose what feels right for you right now
        </p>
      </div>

      {/* TAP-TAP-TAP Options */}
      <div className="flex items-center justify-center gap-4 w-full max-w-md px-4">
        {captureMethods.map((method) => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              onClick={() => !disabled && onMethodSelect(method.id)}
              disabled={disabled}
              className={`
                flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl
                bg-gradient-to-br ${method.color}
                text-white shadow-lg
                transform transition-all duration-300
                hover:scale-105 hover:shadow-xl
                active:scale-95 focus:outline-none focus:ring-4
                focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={`Use ${method.label} ${method.description}`}
            >
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Icon size={32} />
              </div>
              <div className="text-center space-y-1">
                <span className="font-bold text-lg">{method.label}</span>
                <span className="text-xs opacity-90">{method.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Quick path:</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Tap method → Quick capture → Done (15 seconds)
        </span>
      </div>

      {/* Arrow Indicator (for flow visualization) */}
      <div className="pt-4 animate-bounce">
        <ArrowRight size={24} className="text-slate-400" />
      </div>
    </div>
  );
};

export default QuickCaptureMenu;
