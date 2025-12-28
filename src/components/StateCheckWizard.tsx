import { ArrowRight, Camera, Loader2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { analyzeStateFromImage } from '../services/geminiVisionService';
import { getBaseline } from '../services/stateCheckService';
import { getEntries as getJournalEntries } from '../services/storageService';
import { FacialAnalysis, FacialBaseline, HealthEntry } from '../types';
import StateCheckCamera from './StateCheckCamera';
import StateCheckResults from './StateCheckResults';

const StateCheckWizard: React.FC = () => {
  const [step, setStep] = useState<'INTRO' | 'CAMERA' | 'ANALYZING' | 'RESULTS'>('INTRO');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FacialAnalysis | null>(null);
  const [recentEntry, setRecentEntry] = useState<HealthEntry | null>(null);
  const [baseline, setBaseline] = useState<FacialBaseline | null>(null);
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup object URL when imageSrc changes or component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Load recent entry and baseline
  useEffect(() => {
    const loadContext = async () => {
      // 1. Get Journal Entry
      const entries = getJournalEntries();
      if (entries.length > 0) {
        const sorted = [...entries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const latest = sorted[0];
        const now = new Date();
        const entryTime = new Date(latest.timestamp);
        const diffHours = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) setRecentEntry(latest);
      }

      // 2. Get Baseline
      try {
        const b = await getBaseline();
        setBaseline(b);
      } catch (e) {
        console.error("No baseline found");
      }
    };
    loadContext();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCapture = async (src: string) => {
    setImageSrc(src);
    setStep('ANALYZING');
    setProgress(0);
    setCurrentStage('');
    setEstimatedTime(30);
    
    const base64 = src.split(',')[1];
    
    // Create abort controller for this analysis
    abortControllerRef.current = new AbortController();
    
    try {
      const result = await analyzeStateFromImage(base64, {
        timeout: 30000,
        onProgress: (stage, progressValue) => {
          setCurrentStage(stage);
          setProgress(progressValue);
          setEstimatedTime(Math.max(0, Math.round((100 - progressValue) * 0.3)));
        },
        signal: abortControllerRef.current.signal
      });
      
      setAnalysis(result);
      setStep('RESULTS');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // User cancelled
        alert('Analysis cancelled');
      } else if (e instanceof Error && e.message.includes('timeout')) {
        alert('Analysis timed out. Please try again.');
      } else {
        console.error('Analysis failed:', e);
        alert('Analysis failed. Please try again.');
      }
      setStep('INTRO');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const reset = () => {
    // Revoke old image URL before resetting
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
    setStep('INTRO');
    setImageSrc(null);
    setAnalysis(null);
    setProgress(0);
    setCurrentStage('');
  };

  if (step === 'CAMERA') {
    return <StateCheckCamera onCapture={handleCapture} onCancel={() => setStep('INTRO')} />;
  }

  if (step === 'RESULTS' && analysis && imageSrc) {
    return (
      <StateCheckResults 
        analysis={analysis} 
        imageSrc={imageSrc} 
        recentEntry={recentEntry} 
        baseline={baseline}
        onClose={reset} 
      />
    );
  }

  if (step === 'ANALYZING') {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
          </div>
        </div>
        
        {/* Progress Stages */}
        <div className="text-center space-y-3 max-w-md">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Analyzing Bio-Signals...
          </h3>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Current Stage */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {currentStage}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estimated time: {estimatedTime}s remaining
            </p>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={cancelAnalysis}
          className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn py-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 space-y-8 text-center">
        
        <div className="space-y-2">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Camera size={28} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Bio-Mirror Check</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Objectively analyze your physical signs of stress and masking. Your body often signals burnout before your mind acknowledges it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-left bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300"><strong>Jaw Tension</strong> (Stress/Masking)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300"><strong>Eye Fatigue</strong> (Cognitive Load)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300"><strong>Micro-Expressions</strong> (Authenticity)</span>
          </div>
        </div>

        {!recentEntry && (
          <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
            <strong>Tip:</strong> Log a journal entry first to compare how you <em>feel</em> vs. how you <em>look</em>.
          </div>
        )}

        <button 
          onClick={() => setStep('CAMERA')}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          Open Bio-Mirror <ArrowRight size={18} />
        </button>

        <p className="text-[10px] text-slate-400">
          Analysis happens locally. Images are never stored without permission.
        </p>
      </div>
    </div>
  );
};

export default StateCheckWizard;