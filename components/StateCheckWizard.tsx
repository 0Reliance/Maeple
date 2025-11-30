
import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import StateCheckCamera from './StateCheckCamera';
import StateCheckResults from './StateCheckResults';
import { analyzeStateFromImage } from '../services/geminiVisionService';
import { getEntries } from '../services/storageService';
import { FacialAnalysis, HealthEntry } from '../types';

const StateCheckWizard: React.FC = () => {
  const [step, setStep] = useState<'INTRO' | 'CAMERA' | 'ANALYZING' | 'RESULTS'>('INTRO');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FacialAnalysis | null>(null);
  const [recentEntry, setRecentEntry] = useState<HealthEntry | null>(null);

  // Load recent entry on mount for comparison context
  useEffect(() => {
      const entries = getEntries();
      if (entries.length > 0) {
          // Sort desc
          const sorted = [...entries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          // Only use if within last 24 hours
          const latest = sorted[0];
          const now = new Date();
          const entryTime = new Date(latest.timestamp);
          const diffHours = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
          
          if (diffHours < 24) {
              setRecentEntry(latest);
          }
      }
  }, []);

  const handleCapture = async (src: string) => {
    setImageSrc(src);
    setStep('ANALYZING');
    
    // Remove data:image/png;base64, prefix
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
    return <StateCheckResults analysis={analysis} imageSrc={imageSrc} recentEntry={recentEntry} onClose={reset} />;
  }

  if (step === 'ANALYZING') {
      return (
          <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-indigo-600" size={40} />
                  </div>
              </div>
              <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Analyzing Bio-Signals...</h3>
                  <p className="text-slate-500">Checking jaw tension, eye fatigue, and micro-expressions.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fadeIn py-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
            <Camera size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Bio-Mirror</h2>
        <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
           Use AI Vision to detect what your body is saying but your mind might be missing.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              What we analyze:
          </h3>
          <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">1</div>
                  <span><strong>Jaw Tension:</strong> A primary sign of stress/masking.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">2</div>
                  <span><strong>Eye Fatigue:</strong> Drooping or "glassy" appearance.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">3</div>
                  <span><strong>Micro-Expressions:</strong> Authenticity vs Performance.</span>
              </li>
          </ul>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 text-center">
              Your image is analyzed in real-time and <strong>not saved</strong> to any cloud server unless you choose to export it.
          </div>

          <button 
            onClick={() => setStep('CAMERA')}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-lg"
          >
            Start Check <ArrowRight size={20} />
          </button>
      </div>
    </div>
  );
};

export default StateCheckWizard;
