
import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Battery, BatteryCharging, BatteryWarning, Zap } from 'lucide-react';
import { parseJournalEntry } from '../services/geminiService';
import { HealthEntry, ParsedResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import RecordVoiceButton from './RecordVoiceButton';

interface Props {
  onEntryAdded: (entry: HealthEntry) => void;
}

const JournalEntry: React.FC<Props> = ({ onEntryAdded }) => {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [spoonLevel, setSpoonLevel] = useState(5); // 1-10 Manual Capacity

  const handleTranscript = (transcript: string) => {
    setText(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${transcript}` : transcript;
    });
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);

    try {
      // Pass manual spoon level to AI for context
      const parsed: ParsedResponse = await parseJournalEntry(text, spoonLevel);
      
      const newEntry: HealthEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        rawText: text,
        mood: parsed.moodScore,
        moodLabel: parsed.moodLabel,
        medications: parsed.medications.map(m => ({ name: m.name, dosage: m.amount, unit: m.unit })),
        symptoms: parsed.symptoms.map(s => ({ name: s.name, severity: s.severity })),
        tags: [], 
        strengths: parsed.strengths || [],
        neuroMetrics: {
            // Prefer manual slider if set, otherwise AI inference, or average?
            // Let's trust the AI's final judgment as it considers the manual input prompt
            spoonLevel: parsed.neuroMetrics.spoonLevel,
            sensoryLoad: parsed.neuroMetrics.sensoryLoad,
            contextSwitches: parsed.neuroMetrics.contextSwitches,
            maskingScore: parsed.neuroMetrics.maskingScore
        },
        notes: parsed.summary
      };

      onEntryAdded(newEntry);
      setText('');
      setSpoonLevel(5); // Reset
    } catch (e) {
      console.error("Failed to process entry", e);
      alert("Failed to analyze entry. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getSpoonColor = (level: number) => {
    if (level >= 8) return 'text-emerald-500';
    if (level >= 4) return 'text-yellow-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-white p-5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
        
        {/* Spoon/Capacity Slider */}
        <div className="mb-4 px-1">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap size={12} className={getSpoonColor(spoonLevel)} />
                    Current Capacity (Spoons)
                </label>
                <span className={`text-sm font-bold ${getSpoonColor(spoonLevel)}`}>
                    {spoonLevel}/10
                </span>
            </div>
            <div className="flex items-center gap-3">
                <BatteryWarning size={16} className="text-rose-400" />
                <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={spoonLevel}
                    onChange={(e) => setSpoonLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <BatteryCharging size={16} className="text-emerald-400" />
            </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's your current context? (e.g., 'Hyperfocused on coding but the noise is draining me...')"
            className="w-full p-4 pb-16 bg-slate-50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all h-40 text-slate-700 placeholder:text-slate-400 text-lg leading-relaxed"
          />
          
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium mr-2 hidden sm:inline-block">
                Tap mic to speak
            </span>
            <RecordVoiceButton onTranscript={handleTranscript} isDisabled={isProcessing} />
          </div>
        </div>
        
        <div className="mt-5 flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
            <Sparkles size={14} />
            <span className="text-xs font-bold uppercase tracking-wide">Pozi AI Analysis</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text || isProcessing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${
              !text || isProcessing
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg shadow-teal-200'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Parsing Patterns...</span>
              </>
            ) : (
              <>
                <span>Capture</span>
                <Send size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalEntry;