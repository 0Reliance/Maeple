
import { Activity, AlertTriangle, EyeOff, Info, PhoneCall, Save, Scale, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { compareSubjectiveToObjective } from '../services/comparisonEngine';
import { saveStateCheck } from '../services/stateCheckService';
import { getUserSettings } from '../services/storageService';
import { FacialAnalysis, FacialBaseline, HealthEntry } from '../types';

interface Props {
  analysis: FacialAnalysis;
  imageSrc: string;
  recentEntry: HealthEntry | null;
  baseline?: FacialBaseline | null;
  onClose: () => void;
}

const StateCheckResults: React.FC<Props> = ({ analysis, imageSrc, recentEntry, baseline, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [safetyContact, setSafetyContact] = useState<string>('');

  useEffect(() => {
     const settings = getUserSettings();
     if(settings.safetyContact) setSafetyContact(settings.safetyContact);
  }, []);

  // Run Comparison Logic with Baseline
  const comparison = compareSubjectiveToObjective(recentEntry, analysis, baseline);
  
  // Safety Interceptor Logic
  const isCritical = comparison.discrepancyScore > 80 || (recentEntry?.mood || 5) <= 1 || (analysis.maskingScore || 0) > 0.9;

  const handleSave = async () => {
      setIsSaving(true);
      try {
          // Convert base64 to Blob for storage
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          
          const id = await saveStateCheck({
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              analysis: analysis
          }, blob);
          
          setSavedId(id);
      } catch (e) {
          console.error("Failed to save", e);
          alert("Failed to save securely.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleCallSupport = () => {
      if(safetyContact) {
          window.location.href = `tel:${safetyContact}`;
      } else {
          // Default to US crisis line if not set (Example)
          window.location.href = 'tel:988';
      }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl overflow-hidden">
        
        {/* Safety Interceptor Banner */}
        {isCritical && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex items-start gap-4 animate-pulse">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
                    <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-rose-800">Support Recommended</h3>
                    <p className="text-rose-600 text-sm mb-3">
                        We detected high distress levels (Discrepancy: {comparison.discrepancyScore}%). 
                        You don't have to handle this alone.
                    </p>
                    <button 
                        onClick={handleCallSupport}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors shadow-md"
                    >
                        <PhoneCall size={16} />
                        Call {safetyContact ? 'Support Contact' : 'Crisis Line (988)'}
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
           {/* Image */}
           <div className="w-full md:w-1/3 space-y-3">
               <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner relative">
                   <img src={imageSrc} alt="Selfie" className="w-full h-full object-cover transform scale-x-[-1]" />
               </div>
               
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                   <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Masking Score</p>
                   <div className="text-2xl font-bold text-slate-800">{((analysis.maskingScore || 0) * 10).toFixed(1)}<span className="text-sm text-slate-400 font-normal">/10</span></div>
                   {comparison.baselineApplied && (
                       <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">Adjusted to Baseline</span>
                   )}
               </div>
           </div>

           {/* Stats & Comparison */}
           <div className="flex-1 space-y-6">
               <div className="flex items-start justify-between">
                   <div>
                       <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                           Bio-Feedback Analysis
                       </h2>
                       <p className="text-slate-500 text-sm">Gemini Vision 2.5</p>
                   </div>
                   {comparison.discrepancyScore > 50 && (
                       <div className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200 flex items-center gap-1">
                           <Scale size={12} /> Discrepancy Detected
                       </div>
                   )}
               </div>

               {/* Comparison Card (The "Bio-Mirror") */}
               {recentEntry ? (
                    <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Scale size={64} />
                        </div>
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <Scale size={16} /> Reality Check
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3 relative z-10">
                            <div>
                                <p className="text-xs text-indigo-400 font-bold uppercase mb-1">You Reported</p>
                                <p className="font-bold text-indigo-900 text-lg leading-tight">{recentEntry.moodLabel}</p>
                                <p className="text-xs text-indigo-600">Mood: {recentEntry.mood}/5</p>
                            </div>
                            <div className="border-l border-indigo-200 pl-4">
                                <p className="text-xs text-indigo-400 font-bold uppercase mb-1">Body Shows</p>
                                <p className="font-bold text-indigo-900 text-lg leading-tight">{comparison.objectiveState}</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/60 p-3 rounded-lg border border-indigo-100/50 backdrop-blur-sm">
                            <p className="text-indigo-800 text-sm font-medium leading-snug">
                                <span className="mr-2">💡</span> {comparison.insight.description}
                            </p>
                        </div>
                    </div>
               ) : (
                   <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-slate-500 text-sm italic">
                       Log a journal entry first to compare your subjective mood with this objective analysis.
                   </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase">
                            <Activity size={14} /> Jaw Tension
                        </div>
                        <div className="text-xl font-bold text-slate-700">{((analysis.jawTension || 0) * 10).toFixed(1)}</div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                           <div className={`h-1 rounded-full ${(analysis.jawTension || 0) > 0.5 ? 'bg-orange-400' : 'bg-emerald-400'}`} style={{width: `${(analysis.jawTension || 0) * 100}%`}}></div>
                        </div>
                        {comparison.baselineApplied && (
                            <div className="absolute top-2 right-2 text-indigo-400" title="Baseline Adjusted">
                                <Info size={12} />
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase">
                            <EyeOff size={14} /> Eye Fatigue
                        </div>
                        <div className="text-xl font-bold text-slate-700">{((analysis.eyeFatigue || 0) * 10).toFixed(1)}</div>
                         <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                           <div className={`h-1 rounded-full ${(analysis.eyeFatigue || 0) > 0.5 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{width: `${(analysis.eyeFatigue || 0) * 100}%`}}></div>
                        </div>
                        {comparison.baselineApplied && (
                            <div className="absolute top-2 right-2 text-indigo-400" title="Baseline Adjusted">
                                <Info size={12} />
                            </div>
                        )}
                    </div>
               </div>

               {/* Detected Signs */}
               {analysis.signs && analysis.signs.length > 0 && (
                   <div className="mt-2">
                       <p className="text-xs text-slate-400 font-bold uppercase mb-2">Detected Markers (FACS)</p>
                       <div className="flex flex-wrap gap-2">
                           {analysis.signs.map((sign, i) => (
                               <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md border border-slate-200">
                                   {sign.description}
                               </span>
                           ))}
                       </div>
                   </div>
               )}
           </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
            <button 
                onClick={onClose}
                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
            >
                Discard
            </button>
            
            {savedId ? (
                <button 
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold"
                >
                    <ShieldCheck size={20} />
                    Saved Securely
                </button>
            ) : (
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                    <Save size={20} />
                    {isSaving ? 'Encrypting & Saving...' : 'Save Analysis Securely'}
                </button>
            )}
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
            <ShieldCheck size={12} />
            Encrypted locally with AES-GCM. Not shared with cloud.
        </p>
      </div>
    </div>
  );
};

export default StateCheckResults;