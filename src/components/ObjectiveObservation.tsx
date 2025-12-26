import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import React from 'react';
import { ObjectiveObservation as ObjectiveObservationType } from '../types';

interface Props {
  observation: ObjectiveObservationType;
  onContinue: () => void;
  onSkip?: () => void;
}

/**
 * ObjectiveObservation
 * 
 * Displays objective observations Mae detected from user input.
 * Shows evidence and confidence scores.
 * Always provides skip button - user is in control.
 */
const ObjectiveObservation: React.FC<Props> = ({
  observation,
  onContinue,
  onSkip,
}) => {
  const getSeverityColor = (severity: 'low' | 'moderate' | 'high') => {
    switch (severity) {
      case 'low':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400';
      case 'moderate':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400';
      case 'high':
        return 'text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-400';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'bio-mirror':
        return '📸';
      case 'voice':
        return '🎤';
      case 'text-input':
        return '✏️';
      default:
        return '📊';
    }
  };

  const confidencePercent = Math.round(observation.confidence * 100);

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
          <Info size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            Quick Analysis
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {getSourceIcon(observation.source)} {' '}Analysis from {observation.source.replace('-', ' ')}
          </p>
        </div>
        {/* Confidence Badge */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Confidence
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            confidencePercent >= 80 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
              : confidencePercent >= 60
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {confidencePercent}%
          </div>
        </div>
      </div>

      {/* Observations List */}
      <div className="space-y-3">
        {observation.observations.map((obs, index) => (
          <div
            key={`${obs.category}-${index}`}
            className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            {/* Severity Indicator */}
            <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityColor(obs.severity)}`}>
              {obs.severity}
            </div>

            {/* Observation Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {obs.category.charAt(0).toUpperCase() + obs.category.slice(1).replace('-', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {obs.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                {obs.evidence}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="flex items-start gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
        <AlertCircle size={16} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
          This is just what I observed from your {observation.source.replace('-', ' ')}. 
          You know how you're feeling better than I do.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Skip observation
          </button>
        )}
        <button
          onClick={onContinue}
          className="flex-1 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors shadow-lg hover:shadow-xl"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ObjectiveObservation;
