
import React from 'react';
import { HealthEntry } from '../types';
import { Pill, Volume2, Star, EyeOff, Brain, Users, Zap, LayoutList, Clock } from 'lucide-react';

interface TimelineEntryProps {
  entry: HealthEntry;
  variant?: 'list' | 'card';
}

/**
 * TimelineEntry
 * 
 * Renders a single health journal entry with neuro-affirming visualizations.
 * Shows Capacity Fingerprint, Activity Types, and Strengths.
 */
const TimelineEntry: React.FC<TimelineEntryProps> = ({ entry, variant = 'list' }) => {
  const dateObj = new Date(entry.timestamp);
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // Safety check for older entries
  const spoons = entry.neuroMetrics?.spoonLevel ?? 5;
  const sensory = entry.neuroMetrics?.sensoryLoad ?? 0;
  const masking = entry.neuroMetrics?.maskingScore ?? 0;
  const strengths = entry.strengths || [];
  const activityTypes = entry.activityTypes || [];
  const capacity = entry.neuroMetrics?.capacity;

  const CapacityDot = ({ val, color }: {val:number, color:string}) => (
      <div className="flex flex-col items-center gap-0.5">
          <div className={`w-1.5 h-6 bg-slate-100 dark:bg-slate-700 rounded-full relative overflow-hidden`}>
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-${color}-400 rounded-full`} 
                style={{height: `${val*10}%`}}
              ></div>
          </div>
      </div>
  );

  // Card Variant (Grid View)
  if (variant === 'card') {
    const getTheme = (score: number) => {
        if (score >= 8) return { bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800', icon: 'text-sky-500', bar: 'bg-sky-400' };
        if (score >= 5) return { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800', icon: 'text-indigo-500', bar: 'bg-indigo-400' };
        return { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-100 dark:border-pink-800', icon: 'text-pink-500', bar: 'bg-pink-400' };
    };

    const theme = getTheme(spoons);

    return (
        <div className={`group relative p-5 rounded-3xl border ${theme.bg} ${theme.border} hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${theme.icon}`}>
                        <Zap size={14} fill="currentColor" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{spoons}/10</span>
                </div>
                <span className="text-xs font-medium text-slate-400">{timeStr}</span>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                {entry.rawText}
            </p>

            <div className="flex items-center gap-2 mt-auto">
                <div className="h-1.5 flex-1 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${theme.bar}`} style={{ width: `${spoons * 10}%` }}></div>
                </div>
                {activityTypes.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {activityTypes[0].replace('#', '')}
                    </span>
                )}
            </div>
        </div>
    );
  }

  // List Variant (Default)
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-200">
      {/* Entry Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Capacity Fingerprint (Mini) */}
          {capacity ? (
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700" title="Capacity Fingerprint">
                 <CapacityDot val={capacity.focus} color="indigo" />
                 <CapacityDot val={capacity.social} color="pink" />
                 <CapacityDot val={capacity.sensory} color="orange" />
                 <CapacityDot val={capacity.executive} color="yellow" />
                 <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1">{spoons}/10</span>
              </div>
          ) : (
             <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-800">
                 <Zap size={12} fill="currentColor" />
                 <span>{spoons}/10</span>
             </div>
          )}

          {/* Activity Tags */}
          {activityTypes.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md uppercase tracking-wide">
                  {tag.replace('#', '')}
              </span>
          ))}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
          <span className="hidden group-hover:inline-block transition-opacity">{dayStr}</span>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
            <Clock size={12} />
            <span>{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-4">
        <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap">
          {entry.rawText}
        </p>
      </div>

      {/* Neuro-Affirming Metrics Footer */}
      <div className="space-y-3 pt-3 border-t border-slate-50 dark:border-slate-800">
        
        {/* Row 1: Strengths */}
        {strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {strengths.map((str, idx) => (
                    <div key={`str-${idx}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs font-bold border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                        <Star size={12} className="text-purple-500 dark:text-purple-400" />
                        <span>{str}</span>
                    </div>
                ))}
            </div>
        )}

        {/* Row 2: Context & Load */}
        <div className="flex flex-wrap gap-2">
            {/* Sensory Load Warning */}
            {sensory > 5 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium border border-orange-100" title="High Sensory Load">
                    <Volume2 size={12} />
                    <span>Sensory Load: {sensory}/10</span>
                </div>
            )}
            
            {/* Masking Alert */}
            {masking > 5 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200" title="High Masking Effort">
                    <EyeOff size={12} />
                    <span>Masking: {masking}/10</span>
                </div>
            )}

            {/* Meds */}
            {entry.medications.map((med, idx) => (
                <div key={`med-${idx}`} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium border border-blue-100">
                    <Pill size={12} />
                    <span>{med.name}</span>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default TimelineEntry;
