
import React, { useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, Info, ArrowRight } from 'lucide-react';
import StateCheckCamera from './StateCheckCamera';
import { analyzeStateFromImage } from '../services/geminiVisionService';
import { saveBaseline } from '../services/stateCheckService';
import { FacialBaseline } from '../types';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const BioCalibration: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'INTRO' | 'CAMERA' | 'ANALYZING' | 'SUCCESS'>('INTRO');
  
  const handleCapture = async (imageSrc: string) => {
    setStep('ANALYZING');
    try {
        const base64 = imageSrc.split(',')[1];
        // Analyze the "Neutral" face
        const analysis = await analyzeStateFromImage(base64);
        
        const baseline: FacialBaseline = {
            id: 'USER_BASELINE',
            timestamp: new Date().toISOString(),
            neutralTension: Math.max(analysis.jawTension || 0, analysis.eyeFatigue || 0), // Use worst case as baseline floor? No, use actuals.
            neutralFatigue: analysis.eyeFatigue || 0,
            neutralMasking: analysis.maskingScore || 0
        };

        await saveBaseline(baseline);
        setStep('SUCCESS');
    } catch (e) {
        alert("Failed to analyze. Please try better lighting.");
        setStep('INTRO');
    }
  };

  if (step === 'CAMERA') {
      return <StateCheckCamera onCapture={handleCapture} onCancel={() => setStep('INTRO')} />;
  }

  if (step === 'SUCCESS') {
      return (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl text-center animate-fadeIn max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Calibration Complete</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Mae now knows your "Neutral". Future Bio-Mirror checks will measure the <em>change</em> from this baseline, making them much more accurate for your unique face.
              </p>
              <button 
                onClick={onComplete}
                className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
              >
                  Done
              </button>
          </div>
      );
  }

  if (step === 'ANALYZING') {
      return (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl text-center flex flex-col items-center justify-center">
             <RefreshCw className="animate-spin text-indigo-500 dark:text-indigo-400 mb-4" size={32} />
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Learning your baseline...</h3>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-lg w-full animate-fadeIn">
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calibrate Your Bio-Mirror</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Neurodivergent faces are unique. To get accurate fatigue and masking data, Mae needs to know what your "Resting Face" looks like.
                </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-8">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-2 flex items-center gap-2">
                    <Info size={16} /> Instructions:
                </h4>
                <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-2 text-left">
                    <li>1. Relax your face completely.</li>
                    <li>2. Drop your shoulders and unclench your jaw.</li>
                    <li>3. Look straight at the camera with a neutral expression.</li>
                    <li>4. Ensure good lighting.</li>
                </ul>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={onCancel}
                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => setStep('CAMERA')}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    Start Capture <ArrowRight size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default BioCalibration;