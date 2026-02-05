import { ChevronRight, Lightbulb, MessageCircle, X } from 'lucide-react';
import React from 'react';
import { GentleInquiry as GentleInquiryType } from '../types';

interface Props {
  inquiry: GentleInquiryType;
  onResponse: (response: string) => void;
  onSkip: () => void;
  disabled?: boolean;
}

/**
 * GentleInquiry
 * 
 * Displays contextual follow-up questions based on objective observations.
 * Key principles:
 * - Curious, not interrogative
 * - Based on objective data only
 * - Always optional with prominent skip button
 * - Normalizes that user's self-knowledge is best
 */
const GentleInquiry: React.FC<Props> = ({
  inquiry,
  onResponse,
  onSkip,
  disabled = false,
}) => {
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'curious':
        return 'from-purple-500 to-indigo-500';
      case 'supportive':
        return 'from-pink-500 to-rose-500';
      case 'informational':
        return 'from-cyan-500 to-blue-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const quickResponses = [
    "Yes, it's affecting me",
    "No, I'm used to it",
    "Let me think about it",
  ];

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-gradient-to-br ${getToneColor(inquiry.tone)} rounded-full`}>
          <MessageCircle size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            💬 Quick Question
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Based on what I observed
          </p>
        </div>
        <button
          onClick={onSkip}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Skip this question"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* What I'm Asking About */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
        <div className="flex items-start gap-2">
          <Lightbulb size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              I noticed:
            </p>
            <ul className="space-y-1">
              {(inquiry.basedOn || []).map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                >
                  <span className="text-indigo-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* The Question */}
      <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl">
        <p className="text-lg font-medium text-slate-800 dark:text-white leading-relaxed">
          {inquiry.question}
        </p>
      </div>

      {/* Quick Responses */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Quick Response
        </p>
        <div className="space-y-2">
          {quickResponses.map((response, index) => (
            <button
              key={index}
              onClick={() => !disabled && onResponse(response)}
              disabled={disabled}
              className="w-full px-4 py-3 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {response}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Response */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Or type your own response
        </p>
        <div className="relative">
          <input
            type="text"
            placeholder="Share more if you'd like..."
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onResponse(e.currentTarget.value.trim());
              }
            }}
            className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
          <button
            onClick={() => {
              const input = document.querySelector(
                'input[type="text"]'
              ) as HTMLInputElement;
              if (input?.value.trim()) {
                onResponse(input.value.trim());
              }
            }}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={onSkip}
        disabled={disabled}
        className="w-full px-6 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Skip this question
      </button>

      {/* Footer Note */}
      <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
        <span className="text-lg flex-shrink-0">💚</span>
        <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
          It's totally okay to skip. You know your situation better than I do.
        </p>
      </div>
    </div>
  );
};

export default GentleInquiry;
