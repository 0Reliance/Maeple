import { AlertTriangle, Camera, CheckCircle2, Eye, Lightbulb, MapPin } from 'lucide-react';
import React from 'react';
import { FacialAnalysis } from '../types';

interface Props {
  analysis: FacialAnalysis;
  onContinue: () => void;
  onSkip?: () => void;
}

/**
 * PhotoObservations
 * 
 * Displays objective observations from Bio-Mirror photo analysis.
 * Shows what Mae detected in the photo:
 * - Lighting conditions
 * - Tension indicators
 * - Fatigue indicators
 * - Environmental cues (background)
 * 
 * Key principles:
 * - Objective data only (no emotion labels like "you look sad")
 * - Always optional with prominent skip button
 * - User knows their experience best
 */
const PhotoObservations: React.FC<Props> = ({
  analysis,
  onContinue,
  onSkip,
}) => {
  const getObservationIcon = (category: 'tension' | 'fatigue' | 'lighting' | 'environmental') => {
    switch (category) {
      case 'tension':
        return <AlertTriangle size={18} className="text-amber-500" />;
      case 'fatigue':
        return <Eye size={18} className="text-purple-500" />;
      case 'lighting':
        return <Lightbulb size={18} className="text-yellow-500" />;
      case 'environmental':
        return <MapPin size={18} className="text-cyan-500" />;
    }
  };

  const getSeverityColor = (category: 'tension' | 'fatigue' | 'lighting' | 'environmental') => {
    // Lighting severity is in analysis.lightingSeverity
    // Other observations would need severity field
    switch (category) {
      case 'lighting':
        return analysis.lightingSeverity === 'high' 
          ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-400'
          : analysis.lightingSeverity === 'moderate'
          ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400'
          : 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400';
      case 'tension':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400';
      case 'fatigue':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-400';
      default:
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-400';
    }
  };

  const getLightingIcon = () => {
    if (analysis.lighting.includes('fluorescent')) {
      return <Lightbulb size={18} className="text-yellow-500" />;
    } else if (analysis.lighting.includes('natural')) {
      return <Lightbulb size={18} className="text-orange-500" />;
    } else if (analysis.lighting.includes('low')) {
      return <Lightbulb size={18} className="text-slate-500" />;
    } else {
      return <Lightbulb size={18} className="text-gray-500" />;
    }
  };

  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
          <Camera size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
            Bio-Mirror Analysis
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Objective visual observations
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

      {/* Lighting Condition */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white dark:bg-slate-700 rounded-full flex-shrink-0">
            {getLightingIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Lighting Condition
              </span>
              <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityColor('lighting')}`}>
                {analysis.lightingSeverity}
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              {analysis.lighting}
            </p>
            <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-500">
              <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />
              <span>Detected in photo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observations List */}
      {analysis.observations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Additional Observations
          </p>
          {analysis.observations.map((obs, index) => (
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getCategoryLabel(obs.category)}
                  </span>
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
      )}

      {/* Environmental Clues */}
      {analysis.environmentalClues.length > 0 && (
        <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-cyan-600 dark:text-cyan-400" />
            <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
              Environment
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.environmentalClues.map((clue, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 rounded-full text-sm"
              >
                {clue}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="flex items-start gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
          This is what I observed in your photo. Physical appearance doesn't always match 
          how you feel internally. You know your experience best, so feel free to skip 
          if these observations don't resonate with you.
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
const getCategoryLabel = (category: 'tension' | 'fatigue' | 'lighting' | 'environmental'): string => {
  switch (category) {
    case 'tension':
      return 'Tension Indicators';
    case 'fatigue':
      return 'Fatigue Indicators';
    case 'lighting':
      return 'Lighting Conditions';
    case 'environmental':
      return 'Environment';
    default:
      return category;
  }
};

export default PhotoObservations;
