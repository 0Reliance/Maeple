
import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import StateCheckCamera from './StateCheckCamera';
import StateCheckResults from './StateCheckResults';
import { analyzeStateFromImage } from '../services/geminiVisionService';
import { getBaseline } from '../services/stateCheckService'; 
import { getEntries as getJournalEntries } from '../services/storageService'; 
import { FacialAnalysis, HealthEntry, FacialBaseline } from '../types';

const StateCheckWizard: React.FC = () => {
  const [step, setStep] = useState<'INTRO' | 'CAMERA' | 'ANALYZING' | 'RESULTS'>('INTRO');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FacialAnalysis | null>(null);
  const [recentEntry, setRecentEntry] = useState<HealthEntry | null>(null);
  const [baseline, setBaseline] = useState<FacialBaseline | null>(null);

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

  const handleCapture = async (src: string) => {
    setImageSrc(src);
    setStep('ANALYZING');
    
    const base64 = src.split(',')[1];
    
    try {
      const result = await analyzeStateFromImage(base64);
      setAnalysis(result);
      setStep('RESULTS');
    } catch (e) {
      alert("Analysis failed. Please try again.");
      setStep('INTRO');
    }
  };

  const reset = () => {
    setStep('INTRO');
    setImageSrc(null);
    setAnalysis(null);
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
              <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analyzing Bio-Signals...</h3>
                  <p className="text-slate-500 dark:text-slate-400">Checking jaw tension, eye fatigue, and micro-expressions.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fadeIn py-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200 dark:shadow-none">
            <Camera size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bio-Mirror</h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
           Use AI Vision to detect what your body is saying but your mind might be missing.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              What we analyze:
          </h3>
          <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">1</div>
                  <span><strong>Jaw Tension:</strong> A primary sign of stress/masking.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">2</div>
                  <span><strong>Eye Fatigue:</strong> Drooping or "glassy" appearance.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">3</div>
                  <span><strong>Micro-Expressions:</strong> Authenticity vs Performance.</span>
              </li>
          </ul>

          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 text-center">
              Your image is analyzed in real-time and <strong>not saved</strong> to any cloud server unless you choose to export it.
          </div>

          {!recentEntry && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
              <div className="mt-0.5 text-amber-500 dark:text-amber-400">
                <Sparkles size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Pro Tip</p>
                <p className="text-xs text-amber-600 dark:text-amber-500/80">
                  For the best "Masking" detection, log a Journal Entry first so we can compare how you <em>feel</em> vs. how you <em>look</em>.
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={() => setStep('CAMERA')}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 text-lg"
          >
            Start Check <ArrowRight size={20} />
          </button>
      </div>
    </div>
  );
};

export default StateCheckWizard;
