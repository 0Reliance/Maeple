
import React from 'react';
import { HealthEntry } from '../types';
import { Pill, Activity, Moon, Tag, Clock, Zap, Volume2, Star, EyeOff } from 'lucide-react';

interface TimelineEntryProps {
  entry: HealthEntry;
}

/**
 * TimelineEntry
 * 
 * Renders a single health journal entry with neuro-affirming visualizations.
 * Highlights Capacity (Spoons), Strengths, and Sensory Load.
 */
const TimelineEntry: React.FC<TimelineEntryProps> = ({ entry }) => {
  const dateObj = new Date(entry.timestamp);
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // Safety check for older entries without neuroMetrics
  const spoons = entry.neuroMetrics?.spoonLevel ?? 5;
  const sensory = entry.neuroMetrics?.sensoryLoad ?? 0;
  const masking = entry.neuroMetrics?.maskingScore ?? 0;
  const strengths = entry.strengths || [];

  return (
    <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
      {/* Entry Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Spoons / Capacity Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
            spoons >= 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            spoons >= 4 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
            'bg-rose-50 text-rose-700 border-rose-100'
          }`} title="Energy Capacity (Spoons)">
             <Zap size={12} fill="currentColor" />
             <span>{spoons}/10</span>
          </div>

          {/* Mood Label (Secondary now) */}
          <span className="text-slate-500 text-xs font-medium px-2 py-0.5 bg-slate-50 rounded-full">
            {entry.moodLabel}
          </span>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
          <span className="hidden group-hover:inline-block transition-opacity">{dayStr}</span>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
            <Clock size={12} />
            <span>{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-4">
        <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
          {entry.rawText}
        </p>
      </div>

      {/* Neuro-Affirming Metrics Footer */}
      <div className="space-y-3 pt-3 border-t border-slate-50">
        
        {/* Row 1: Character Strengths (The "Good Stuff") */}
        {strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {strengths.map((str, idx) => (
                    <div key={`str-${idx}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-bold border border-purple-100 hover:bg-purple-100 transition-colors">
                        <Star size={12} className="text-purple-500" />
                        <span>{str}</span>
                    </div>
                ))}
            </div>
        )}

        {/* Row 2: Context & Load (Sensory, Masking) */}
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

            {/* Meds (Legacy but important) */}
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
