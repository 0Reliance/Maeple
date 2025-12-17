import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Zap,
  Brain,
  Users,
  LayoutList,
  Heart,
  Dumbbell,
  Ear,
  ChevronDown,
  ChevronUp,
  Compass,
  X,
  Loader2,
} from "lucide-react";
import { parseJournalEntry } from "../services/geminiService";
import {
  HealthEntry,
  ParsedResponse,
  CapacityProfile,
  StrategyRecommendation,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import RecordVoiceButton from "./RecordVoiceButton";
import AILoadingState from "./AILoadingState";

interface Props {
  onEntryAdded: (entry: HealthEntry) => void;
}

const JournalEntry: React.FC<Props> = ({ onEntryAdded }) => {
  const [text, setText] = useState("");
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
    executive: 5,
  });

  // Phase 3: Immediate Strategy Feedback
  const [lastStrategies, setLastStrategies] = useState<
    StrategyRecommendation[]
  >([]);
  const [lastReasoning, setLastReasoning] = useState<string | null>(null);

  const handleTranscript = (transcript: string) => {
    setText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${transcript}` : transcript;
    });
  };

  const updateCapacity = (key: keyof CapacityProfile, val: number) => {
    setCapacity((prev) => ({ ...prev, [key]: val }));
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
        medications: parsed.medications.map((m) => ({
          name: m.name,
          dosage: m.amount,
          unit: m.unit,
        })),
        symptoms: parsed.symptoms.map((s) => ({
          name: s.name,
          severity: s.severity,
        })),
        tags: [],
        activityTypes: parsed.activityTypes || [],
        strengths: parsed.strengths || [],
        neuroMetrics: {
          spoonLevel: calculateAverageSpoons(),
          sensoryLoad: parsed.neuroMetrics.sensoryLoad,
          contextSwitches: parsed.neuroMetrics.contextSwitches,
          maskingScore: parsed.neuroMetrics.maskingScore,
          capacity: capacity, // Store the full profile
        },
        notes: parsed.summary,
        aiStrategies: parsed.strategies,
        aiReasoning: parsed.analysisReasoning,
      };

      // Use AI Generated strategies
      setLastStrategies(parsed.strategies || []);
      setLastReasoning(parsed.analysisReasoning || null);

      onEntryAdded(newEntry);
      setText("");
      // Reset to defaults
      setCapacity({
        focus: 7,
        social: 5,
        structure: 4,
        emotional: 6,
        physical: 5,
        sensory: 6,
        executive: 5,
      });
    } catch (e) {
      console.error("Failed to process entry", e);
      alert("Failed to analyze entry. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const colorStyles: Record<string, { bg: string, text: string, gradient: string, accent: string }> = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-400 to-blue-500', accent: 'accent-blue-500' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-400 to-pink-500', accent: 'accent-pink-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-400 to-purple-500', accent: 'accent-purple-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-400 to-cyan-500', accent: 'accent-cyan-500' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-400 to-indigo-500', accent: 'accent-indigo-500' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-600 dark:text-rose-400', gradient: 'from-rose-400 to-rose-500', accent: 'accent-rose-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-orange-500', accent: 'accent-orange-500' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-400', gradient: 'from-yellow-400 to-yellow-500', accent: 'accent-yellow-500' },
  };

  const CapacitySlider = ({ label, icon: Icon, value, field, color }: any) => {
    const styles = colorStyles[color] || colorStyles.blue;
    return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${styles.bg} ${styles.text}`}>
            <Icon size={14} />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">{value}/10</span>
      </div>
      <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer group">
        <div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${styles.gradient} rounded-full transition-all duration-300`}
          style={{ width: `${value * 10}%` }}
        ></div>
        {/* Invisible range input for interaction */}
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => updateCapacity(field, parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Hover effect highlight */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6">
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
            <h3 className="text-xl font-bold">Mae's Strategy Deck</h3>
          </div>

          {lastReasoning && (
            <p className="text-teal-100/80 text-sm mb-4 italic border-l-2 border-teal-400/50 pl-3">
              "I detected this pattern: {lastReasoning}"
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {lastStrategies.map((strat) => (
              <div
                key={strat.id}
                className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm"
              >
                <span className="font-bold text-sm text-white block mb-1">
                  {strat.title}
                </span>
                <p className="text-sm text-teal-50 opacity-90 leading-snug">
                  {strat.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-20 flex items-center justify-center rounded-[2rem]">
            <AILoadingState
              message="Analyzing your entry..."
              steps={[
                "Parsing context...",
                "Checking capacity...",
                "Generating strategies...",
              ]}
            />
          </div>
        )}

        {/* Capacity Check-in Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Daily Capacity Check-in</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Set your baseline before journaling.</p>
             </div>
             <button 
               onClick={() => setShowCapacity(!showCapacity)}
               className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
             >
                {showCapacity ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
             </button>
          </div>

          {showCapacity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 animate-fadeIn">
              <CapacitySlider
                label="Deep Focus"
                icon={Brain}
                value={capacity.focus}
                field="focus"
                color="blue"
              />
              <CapacitySlider
                label="Emotional Processing"
                icon={Heart}
                value={capacity.emotional}
                field="emotional"
                color="pink"
              />
              <CapacitySlider
                label="Social Battery"
                icon={Users}
                value={capacity.social}
                field="social"
                color="purple"
              />
              <CapacitySlider
                label="Executive / Decisions"
                icon={Zap}
                value={capacity.executive}
                field="executive"
                color="cyan"
              />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500 -z-10"></div>
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 focus-within:border-transparent focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What's happening?"
              className="w-full py-4 pl-6 pr-16 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 text-lg"
            />
            
            <div className="absolute right-2 flex items-center gap-1">
               <div className="scale-90">
                  <RecordVoiceButton
                    onTranscript={handleTranscript}
                    isDisabled={isProcessing}
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Action Bar (Hidden if empty to simplify, or minimal) */}
        {text && (
            <div className="mt-4 flex justify-end animate-fadeIn">
                <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <span>Capture Context</span>
                    <Send size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default JournalEntry;
