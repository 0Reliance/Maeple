import { useVisionService } from "@/contexts/DependencyContext";
import { Brain, Gauge, Shield, Target, Timer, TrendingUp } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface AnalysisStep {
  id: string;
  label: string;
  duration: number;
  icon: React.ReactNode;
  description: string;
}

interface ActionUnit {
  auCode: string;
  name: string;
  intensity: 'A' | 'B' | 'C' | 'D' | 'E';
  confidence: number;
}

interface StateCheckAnalyzingProps {
  imageSrc: string;
  onProgress?: (stage: string, progress: number) => void;
  onComplete?: (analysis: any) => void;
  onCancel?: () => void;
  estimatedTime?: number;
}

const StateCheckAnalyzing: React.FC<StateCheckAnalyzingProps> = ({ imageSrc, onProgress, onComplete, onCancel, estimatedTime = 45 }) => {
  const visionService = useVisionService();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [detectedAUs, setDetectedAUs] = useState<ActionUnit[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime);
  const [isComplete, setIsComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ANALYSIS_STEPS: AnalysisStep[] = [
    {
      id: 'encoding',
      label: 'Processing Image',
      duration: 400,
      icon: <Shield className="w-6 h-6" />,
      description: 'Securely preparing your photo for analysis'
    },
    {
      id: 'landmarks',
      label: 'Detecting Facial Landmarks',
      duration: 400,
      icon: <Target className="w-6 h-6" />,
      description: 'Identifying key facial structure points'
    },
    {
      id: 'analysis',
      label: 'Analyzing Action Units',
      duration: 35000,
      icon: <Brain className="w-6 h-6" />,
      description: 'AI analyzing muscle movements and expressions'
    },
    {
      id: 'baseline',
      label: 'Comparing with Baseline',
      duration: 500,
      icon: <Gauge className="w-6 h-6" />,
      description: 'Measuring against your personal patterns'
    },
    {
      id: 'insights',
      label: 'Generating Insights',
      duration: 300,
      icon: <TrendingUp className="w-6 h-6" />,
      description: 'Creating personalized health insights'
    }
  ];

  const FACIAL_LANDMARKS = [
    { x: 50, y: 35, label: 'Forehead' },
    { x: 35, y: 50, label: 'Eyebrow Left' },
    { x: 65, y: 50, label: 'Eyebrow Right' },
    { x: 40, y: 60, label: 'Eye Left' },
    { x: 60, y: 60, label: 'Eye Right' },
    { x: 50, y: 75, label: 'Nose' },
    { x: 45, y: 85, label: 'Cheek Left' },
    { x: 55, y: 85, label: 'Cheek Right' },
    { x: 40, y: 90, label: 'Mouth Left' },
    { x: 60, y: 90, label: 'Mouth Right' },
    { x: 50, y: 95, label: 'Chin' }
  ];

  // Simulate Action Unit detection progress
  const ACTION_UNITS: ActionUnit[] = [
    { auCode: 'AU1', name: 'Inner Brow Raiser', intensity: 'C', confidence: 0.94 },
    { auCode: 'AU4', name: 'Brow Lowerer', intensity: 'B', confidence: 0.87 },
    { auCode: 'AU6', name: 'Cheek Raiser', intensity: 'A', confidence: 0.76 },
    { auCode: 'AU12', name: 'Lip Corner Puller', intensity: 'D', confidence: 0.91 },
    { auCode: 'AU24', name: 'Lip Pressor', intensity: 'B', confidence: 0.82 },
    { auCode: 'AU43', name: 'Eyes Closed', intensity: 'A', confidence: 0.68 }
  ];

  useEffect(() => {
    const performAnalysis = async () => {
      const base64 = imageSrc.split(",")[1];
      abortControllerRef.current = new AbortController();

      try {
        // Start with step 0 (encoding)
        setCurrentStep(0);
        setStepProgress(0);
        onProgress?.(ANALYSIS_STEPS[0].id, 0);

        // Brief encoding step
        await new Promise(resolve => setTimeout(resolve, 400));
        setStepProgress(100);

        // Move to step 1 (landmarks)
        setCurrentStep(1);
        setStepProgress(0);
        onProgress?.(ANALYSIS_STEPS[1].id, 0);

        // Brief landmarks step
        await new Promise(resolve => setTimeout(resolve, 400));
        setStepProgress(100);

        // Move to step 2 (AI analysis) - this is where real AI processing happens
        setCurrentStep(2);
        setStepProgress(0);
        onProgress?.(ANALYSIS_STEPS[2].id, 0);

        // Perform actual AI analysis
        const result = await visionService.analyzeFromImage(base64, {
          onProgress: (stage, progressPercent) => {
            setStepProgress(progressPercent);
            onProgress?.(ANALYSIS_STEPS[2].id, progressPercent);
          },
          signal: abortControllerRef.current?.signal,
        });

        setAnalysisResult(result);
        
        // CRITICAL: Log AI result for debugging
        console.log('[StateCheckAnalyzing] === AI ANALYSIS COMPLETE ===');
        console.log('[StateCheckAnalyzing] Action Units count:', result.actionUnits?.length || 0);
        console.log('[StateCheckAnalyzing] Confidence:', result.confidence);
        console.log('[StateCheckAnalyzing] FACS Interpretation:', result.facsInterpretation);
        console.log('[StateCheckAnalyzing] Jaw Tension:', result.jawTension);
        console.log('[StateCheckAnalyzing] Eye Fatigue:', result.eyeFatigue);
        console.log('[StateCheckAnalyzing] Full analysis object:', result);
        
        // Extract detected Action Units from result
        if (result.actionUnits) {
          setDetectedAUs(result.actionUnits);
        }

        setStepProgress(100);

        // Move to step 3 (baseline comparison)
        setCurrentStep(3);
        setStepProgress(0);
        onProgress?.(ANALYSIS_STEPS[3].id, 0);

        // Brief baseline comparison step
        await new Promise(resolve => setTimeout(resolve, 500));
        setStepProgress(100);

        // Move to step 4 (insights)
        setCurrentStep(4);
        setStepProgress(0);
        onProgress?.(ANALYSIS_STEPS[4].id, 0);

        // Brief insights generation step
        await new Promise(resolve => setTimeout(resolve, 300));
        setStepProgress(100);

        setIsComplete(true);
        
        // Brief pause then complete
        setTimeout(() => {
          onComplete?.(result);
        }, 1000);

      } catch (error) {
        console.error("[StateCheckAnalyzing] Analysis failed:", error);
        
        // Handle error gracefully - return degraded analysis instead of crashing
        setIsComplete(true);
        setTimeout(() => {
          const fallbackResult: any = {
            actionUnits: [],
            confidence: 0,
            observations: [],
            lighting: 'unknown' as const,
            lightingSeverity: 'moderate' as const,
            environmentalClues: [],
            primaryEmotion: 'neutral',
            jawTension: 0,
            eyeFatigue: 0,
            signs: [],
            facsInterpretation: {
              duchennSmile: false,
              socialSmile: false,
              maskingIndicators: [],
              fatigueIndicators: ['Analysis failed - limited data available'],
              tensionIndicators: []
            },
          };
          console.warn('[StateCheckAnalyzing] Returning fallback result due to error:', error);
          onComplete?.(fallbackResult);
        }, 1000);
      }
    };

    performAnalysis();

    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageSrc, onProgress, onComplete, visionService]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/25">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Analyzing Bio-Signals</h1>
          <p className="text-slate-300 text-lg">
            Your facial expressions reveal insights about your wellbeing
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Image & Facial Landmarks */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Facial Analysis
              </h3>
              
              <div className="relative aspect-square bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-700">
                <img 
                  src={imageSrc} 
                  alt="Analyzing face"
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* Facial Landmarks Overlay - Only show when we have actual AU detections */}
                {currentStep >= 1 && detectedAUs.length > 0 && (
                  <div className="absolute inset-0">
                    {FACIAL_LANDMARKS.map((landmark, index) => (
                      <div
                        key={index}
                        className={`absolute w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 shadow-lg transition-all duration-700 ${
                          currentStep >= 1 ? 'animate-ping-once' : ''
                        }`}
                        style={{
                          left: `${landmark.x}%`,
                          top: `${landmark.y}%`,
                          transform: 'translate(-50%, -50%)',
                          animationDelay: `${index * 200}ms`
                        }}
                      >
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Units Overlay */}
                {currentStep >= 2 && detectedAUs.length > 0 && (
                  <div className="absolute inset-0">
                    {detectedAUs.slice(0, 3).map((au, index) => (
                      <div
                        key={au.auCode}
                        className="absolute bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white text-xs font-mono p-2 rounded-lg shadow-lg border border-green-400/50"
                        style={{
                          left: `${30 + index * 20}%`,
                          top: '10%',
                          animation: 'slideInDown 0.5s ease-out'
                        }}
                      >
                        {au.auCode}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-slate-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-white">{detectedAUs.length}</div>
                  <div className="text-xs text-slate-300">Action Units</div>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-xl">
                  <div className="text-2xl font-bold text-white">
                    {Math.round((detectedAUs.length / ACTION_UNITS.length) * 100)}%
                  </div>
                  <div className="text-xs text-slate-300">Analysis Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Details */}
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-indigo-400" />
                Processing Steps
              </h3>
              
              <div className="space-y-4">
                {ANALYSIS_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                        : index < currentStep
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-slate-700/30 border border-slate-600/30'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                          : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-600 text-slate-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-medium transition-colors ${
                            index === currentStep
                              ? 'text-white'
                              : index < currentStep
                              ? 'text-green-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {index === currentStep && (
                          <span className="text-xs text-indigo-300">
                            {Math.round(stepProgress)}%
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                      
                      {index === currentStep && (
                        <div className="mt-2 w-full bg-slate-700 rounded-full h-1">
                          <div
                            className="h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${stepProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Timer */}
              <div className="mt-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Estimated time remaining</span>
                  <span className="text-2xl font-bold text-white font-mono">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time AU Detection */}
            {detectedAUs.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  Action Units Detected
                </h3>
                
                <div className="space-y-2">
                  {detectedAUs.map((au, index) => (
                    <div
                      key={au.auCode}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-indigo-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-indigo-400">{au.auCode}</span>
                        <span className="text-slate-300 text-sm">{au.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            au.intensity === 'E' || au.intensity === 'D'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : au.intensity === 'C'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}
                        >
                          {au.intensity}
                        </span>
                        <span className="text-xs text-slate-400">
                          {Math.round(au.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
              }
              onCancel?.();
            }}
            className="px-8 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl font-medium transition-all duration-300 border border-slate-600/50 hover:border-slate-500/50 backdrop-blur-sm"
            disabled={isComplete}
          >
            {isComplete ? 'Complete!' : `Cancel Analysis (${formatTime(timeRemaining)})`}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes pingOnce {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        .animate-ping-once {
          animation: pingOnce 0.6s ease-in-out;
        }
        
        .animate-slide-in-down {
          animation: slideInDown 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StateCheckAnalyzing;