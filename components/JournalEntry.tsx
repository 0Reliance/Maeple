
import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Battery, BatteryCharging, BatteryWarning, Zap, Brain, Users, LayoutList, Heart, Dumbbell, Ear, ChevronDown, ChevronUp, Compass, X } from 'lucide-react';
import { parseJournalEntry } from '../services/geminiService';
import { HealthEntry, ParsedResponse, CapacityProfile, StrategyRecommendation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import RecordVoiceButton from './RecordVoiceButton';

interface Props {
  onEntryAdded: (entry: HealthEntry) => void;
}

const JournalEntry: React.FC<Props> = ({ onEntryAdded }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Phase 1: Multi-Dimensional Capacity
  const [showCapacity, setShowCapacity] = useState(true);
  const [capacity, setCapacity] = useState<CapacityProfile>({
    focus: 7,
    social: 5,
    structure: 4,
    emotional: 6,
    physical: 5,
    sensory: 6,
    executive: 5
  });

  // Phase 3: Immediate Strategy Feedback
  const [lastStrategies, setLastStrategies] = useState<StrategyRecommendation[]>([]);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);

  const handleTranscript = (transcript: string) => {
    setText(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${transcript}` : transcript;
    });
  };

  const updateCapacity = (key: keyof CapacityProfile, val: number) => {
    setCapacity(prev => ({ ...prev, [key]: val }));
  };

  const calculateAverageSpoons = () => {
    const values = Object.values(capacity) as number[];
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setLastStrategies([]); // Reset
    setLastReasoning(null);

    try {
      const parsed: ParsedResponse = await parseJournalEntry(text, capacity);
      
      const newEntry: HealthEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        rawText: text,
        mood: parsed.moodScore,
        moodLabel: parsed.moodLabel,
        medications: parsed.medications.map(m => ({ name: m.name, dosage: m.amount, unit: m.unit })),
        symptoms: parsed.symptoms.map(s => ({ name: s.name, severity: s.severity })),
        tags: [], 
        activityTypes: parsed.activityTypes || [],
        strengths: parsed.strengths || [],
        neuroMetrics: {
            spoonLevel: calculateAverageSpoons(),
            sensoryLoad: parsed.neuroMetrics.sensoryLoad,
            contextSwitches: parsed.neuroMetrics.contextSwitches,
            maskingScore: parsed.neuroMetrics.maskingScore,
            capacity: capacity // Store the full profile
        },
        notes: parsed.summary,
        aiStrategies: parsed.strategies,
        aiReasoning: parsed.analysisReasoning
      };

      // Use AI Generated strategies
      setLastStrategies(parsed.strategies || []);
      setLastReasoning(parsed.analysisReasoning || null);

      onEntryAdded(newEntry);
      setText('');
      // Reset to defaults
      setCapacity({ focus: 7, social: 5, structure: 4, emotional: 6, physical: 5, sensory: 6, executive: 5 });
    } catch (e) {
      console.error("Failed to process entry", e);
      alert("Failed to analyze entry. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const CapacitySlider = ({ label, icon: Icon, value, field, color }: any) => (
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{label}</span>
            <span>{value}/10</span>
        </div>
        <input 
            type="range" min="1" max="10" 
            value={value}
            onChange={(e) => updateCapacity(field, parseInt(e.target.value))}
            className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-${color}-500`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Quick guidance for the capture flow */}
      <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold mb-1">How to capture:</p>
        <ul className="text-sm text-indigo-700 list-disc pl-5 space-y-1">
          <li>Slide your capacity bars to set today’s baseline.</li>
          <li>Tap the mic to speak or type a quick note.</li>
          <li>Hit <span className="font-semibold">Capture</span> to analyze and save.</li>
        </ul>
      </div>
      
      {/* Phase 3: Immediate Strategy Feedback Overlay */}
      {lastStrategies.length > 0 && (
          <div className="bg-teal-600 rounded-3xl p-6 text-white shadow-xl animate-fadeIn relative overflow-hidden">
              <button 
                onClick={() => setLastStrategies([])} 
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                  <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                  <Compass size={24} className="text-teal-200" />
                  <h3 className="text-xl font-bold">Pozi's Strategy Deck</h3>
              </div>
              
              {lastReasoning && (
                  <p className="text-teal-100/80 text-sm mb-4 italic border-l-2 border-teal-400/50 pl-3">
                      "I detected this pattern: {lastReasoning}"
                  </p>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                 {lastStrategies.map((strat) => (
                    <div key={strat.id} className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm">
                        <span className="font-bold text-sm text-white block mb-1">{strat.title}</span>
                        <p className="text-sm text-teal-50 opacity-90 leading-snug">{strat.action}</p>
                    </div>
                 ))}
             </div>
          </div>
      )}

      {/* Input Card */}
      <div className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
        
        {/* Capacity Grid Header */}
        <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <button 
                onClick={() => setShowCapacity(!showCapacity)}
                className="flex items-center justify-between w-full text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-slate-700">Daily Capacity Check-in</span>
                        <span className="text-xs text-slate-400 font-medium">
                            Set your baseline before journaling.
                        </span>
                    </div>
                </div>
                {showCapacity ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {showCapacity && (
                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 animate-fadeIn">
                    <CapacitySlider label="Deep Focus / Flow" icon={Brain} value={capacity.focus} field="focus" color="indigo" />
                    <CapacitySlider label="Social Bandwidth" icon={Users} value={capacity.social} field="social" color="pink" />
                    <CapacitySlider label="Structure & Admin" icon={LayoutList} value={capacity.structure} field="structure" color="blue" />
                    <CapacitySlider label="Emotional Processing" icon={Heart} value={capacity.emotional} field="emotional" color="rose" />
                    <CapacitySlider label="Sensory Tolerance" icon={Ear} value={capacity.sensory} field="sensory" color="orange" />
                    <CapacitySlider label="Executive / Decisions" icon={Zap} value={capacity.executive} field="executive" color="yellow" />
                </div>
            )}
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening? (e.g., 'Had 3 meetings and now my brain feels fuzzy...')"
            className="w-full p-4 pb-16 bg-white rounded-2xl resize-none focus:outline-none focus:ring-0 border-b border-transparent focus:border-teal-500/50 transition-all h-40 text-slate-700 placeholder:text-slate-300 text-lg leading-relaxed"
          />
          
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium mr-2 hidden sm:inline-block">
                Tap mic to speak or keep typing
            </span>
            <RecordVoiceButton onTranscript={handleTranscript} isDisabled={isProcessing} />
          </div>
        </div>
        
        <div className="mt-2 flex justify-between items-center px-1 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
            <Sparkles size={14} />
            <span className="text-xs font-bold uppercase tracking-wide">Pozi AI Analysis</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text || isProcessing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${
              !text || isProcessing
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg shadow-teal-200'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Parsing...</span>
              </>
            ) : (
              <>
                <span>Capture</span>
                <Send size={20} />
              </>
            )}
          </button>
          {(!text && !isProcessing) && (
            <span className="text-xs text-slate-400 ml-3">Add a quick note or voice snippet to enable Capture.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalEntry;
