import { useVisionService } from "@/contexts/DependencyContext";
import { CircuitState } from "@/patterns/CircuitBreaker";
import { AlertCircle, ArrowRight, Camera } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { getBaseline } from "../services/stateCheckService";
import { getEntries as getJournalEntries } from "../services/storageService";
import { FacialAnalysis, FacialBaseline, HealthEntry } from "../types";
import BiofeedbackCameraModal from "./BiofeedbackCameraModal";
import StateCheckAnalyzing from "./StateCheckAnalyzing";
import StateCheckResults from "./StateCheckResults";

const ANALYSIS_TIMEOUT_SECONDS = 45;

const StateCheckWizard: React.FC = () => {
  const [step, setStep] = useState<"INTRO" | "CAMERA" | "ANALYZING" | "RESULTS" | "ERROR">("INTRO");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FacialAnalysis | null>(null);
  const [recentEntry, setRecentEntry] = useState<HealthEntry | null>(null);
  const [baseline, setBaseline] = useState<FacialBaseline | null>(null);
  const [error, setError] = useState<string>("");
  const [circuitState, setCircuitState] = useState<CircuitState>(CircuitState.CLOSED);
  const visionService = useVisionService();

  // Subscribe to circuit breaker state changes
  useEffect(() => {
    const unsubscribe = visionService.onStateChange(setCircuitState);
    return unsubscribe;
  }, [visionService]);

  // Cleanup object URL when imageSrc changes or component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Load recent entry and baseline
  useEffect(() => {
    const loadContext = async () => {
      // 1. Get Journal Entry
      const entries = await getJournalEntries();
      if (entries.length > 0) {
        const sorted = [...entries].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
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
    // CRITICAL FIX: Batch all state updates together to prevent flickering
    // React will schedule all these updates in a single render
    setIsCameraOpen(false);
    setImageSrc(src);
    setStep("ANALYZING");
    setError("");

    // Note: The actual AI analysis is now handled by the StateCheckAnalyzing component
    // which provides real-time visual feedback to the user
  };

  const handleRetry = () => {
    setError("");
    setStep("INTRO");
  };

  const handleAnalysisComplete = useCallback(
    (analysisResult: FacialAnalysis) => {
      // Validate analysis before setting state
      if (!analysisResult) {
        console.error('[StateCheckWizard] Invalid analysis received: null/undefined');
        setError('Analysis returned invalid data');
        setStep('ERROR');
        return;
      }

      // Ensure actionUnits is at least an empty array (graceful degradation)
      if (!analysisResult.actionUnits) {
        console.warn('[StateCheckWizard] No actionUnits in result, using empty array');
        analysisResult.actionUnits = [];
      }
      
      setAnalysis(analysisResult);
      setStep("RESULTS");
    },
    [setAnalysis, setStep]
  );

  const reset = () => {
    // Revoke old image URL before resetting
    if (imageSrc && imageSrc.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }
    setStep("INTRO");
    setImageSrc(null);
    setAnalysis(null);
    setIsCameraOpen(false);
  };

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
    setStep("CAMERA");
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
    setStep("INTRO");
  };

  if (step === "RESULTS" && analysis && imageSrc) {
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

  if (step === "ERROR") {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
          <AlertCircle size={32} />
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Bio-Mirror Check Failed
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRetry}
            disabled={circuitState === CircuitState.OPEN}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Retry
          </button>
        </div>

        {circuitState === CircuitState.OPEN && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Service is temporarily unavailable. Please wait a moment before retrying.
          </p>
        )}
      </div>
    );
  }

  if (step === "ANALYZING" && imageSrc) {
    return (
      <StateCheckAnalyzing
        imageSrc={imageSrc}
        onComplete={handleAnalysisComplete}
        onCancel={() => setStep("INTRO")}
        estimatedTime={ANALYSIS_TIMEOUT_SECONDS}
      />
    );
  }

  const introContent = (
    <div className="max-w-3xl mx-auto animate-fadeIn py-6">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 space-y-6 md:space-y-8">
        <div className="flex flex-row items-start md:items-center gap-4 md:gap-6 md:text-center md:flex-col">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
            <Camera size={20} className="md:hidden" />
            <Camera size={28} className="hidden md:block" />
          </div>
          <div className="flex-1 space-y-1 md:space-y-2">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Bio-Mirror Check</h3>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Objectively analyze your physical signs of stress and masking. Your body often signals
              burnout before your mind acknowledges it.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-left bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <strong>Jaw Tension</strong> (Stress/Masking)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <strong>Eye Fatigue</strong> (Cognitive Load)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              <strong>Facial Cues</strong> (Authenticity)
            </span>
          </div>
        </div>

        {!recentEntry && (
          <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
            <strong>Tip:</strong> Log a journal entry first to compare how you <em>feel</em> vs. how
            you <em>look</em>.
          </div>
        )}

        <button
          onClick={handleOpenCamera}
          disabled={circuitState === CircuitState.OPEN}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Open Bio-Mirror <ArrowRight size={18} />
        </button>

        {circuitState === CircuitState.OPEN && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            AI service is temporarily unavailable.
          </p>
        )}

        <p className="text-[10px] text-slate-400">
          Photos are compressed on-device and sent to your configured AI provider for analysis. Images are never stored without permission.
        </p>
      </div>
    </div>
  );

  // Camera Modal - Always render but control visibility with CSS
  // This prevents flicker from mount/unmount cycles
  return (
    <>
      <div 
        className={!isCameraOpen ? "hidden" : ""} 
        aria-hidden={!isCameraOpen}
      >
        <BiofeedbackCameraModal
          isOpen={isCameraOpen}
          onCapture={handleCapture}
          onCancel={handleCloseCamera}
        />
      </div>
      {/* Show intro when camera is closed AND step is INTRO */}
      {!isCameraOpen && step === "INTRO" && introContent}
    </>
  );
};

export default StateCheckWizard;
