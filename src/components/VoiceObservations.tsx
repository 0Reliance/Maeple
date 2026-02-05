import { CheckCircle2, Clock, Gauge, Mic, Volume2 } from 'lucide-react';
import React from 'react';
import { AudioAnalysisResult } from '../services/audioAnalysisService';
import { Observation } from '../types';

interface Props {
  analysis: AudioAnalysisResult;
  onContinue: () => void;
  onSkip?: () => void;
}

/**
 * VoiceObservations
 * 
 * Displays objective observations from voice recording.
 * Shows what Mae detected in the audio:
 * - Background noise level
 * - Speech pace (words per minute)
 * - Vocal characteristics (pitch, volume, clarity)
 * 
 * Key principles:
 * - Objective data only (no emotion labels)
 * - Always optional with prominent skip button
 * - User knows their experience best
 */
const VoiceObservations: React.FC<Props> = ({
  analysis,
  onContinue,
  onSkip,
}) => {
  const getObservationIcon = (category: Observation['category']) => {
    switch (category) {
      case 'noise':
        return <Volume2 size={18} className="text-indigo-500" />;
      case 'speech-pace':
        return <Clock size={18} className="text-indigo-500" />;
      case 'tone':
        return <Mic size={18} className="text-indigo-500" />;
      default:
        return <Gauge size={18} className="text-indigo-500" />;
    }
  };

  const getSeverityColor = (severity: Observation['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400';
      case 'moderate':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400';
      case 'high':
        return 'text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-400';
    }
  };

  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
          <Mic size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            Voice Analysis
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {analysis.duration.toFixed(1)} seconds recorded
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
        {(analysis.observations || []).map((obs: Observation, index: number) => (
          <div
            key={`${obs.category}-${index}`}
            className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"
          >
            {/* Category Icon */}
            <div className="p-2 bg-white dark:bg-slate-700 rounded-full flex-shrink-0">
              {getObservationIcon(obs.category)}
            </div>

            {/* Observation Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getCategoryLabel(obs.category)}
                  </span>
                </div>
                {/* Severity Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityColor(obs.severity)}`}>
                  {obs.severity}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {obs.value}
              </p>

              <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />
                <span>{obs.evidence}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transcript (if available) */}
      {analysis.transcript && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={14} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Transcript
            </p>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 italic">
            "{analysis.transcript}"
          </p>
        </div>
      )}

      {/* Footer Note */}
      <div className="flex items-start gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
          This is what I detected in your voice recording. You know your experience 
          better than I do, so feel free to skip if this doesn't match how you're feeling.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Skip observations
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

/**
 * Get human-readable label for observation category
 */
const getCategoryLabel = (category: Observation['category']): string => {
  switch (category) {
    case 'noise':
      return 'Background Noise';
    case 'speech-pace':
      return 'Speech Pace';
    case 'tone':
      return 'Voice Characteristics';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  }
};

export default VoiceObservations;
