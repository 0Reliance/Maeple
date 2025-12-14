import React, { useState, useEffect } from "react";
import { Sparkles, Brain, Zap } from "lucide-react";

interface Props {
  message?: string;
  steps?: string[];
}

const AILoadingState: React.FC<Props> = ({
  message = "Mae is thinking...",
  steps = [
    "Analyzing context...",
    "Connecting patterns...",
    "Generating insights...",
  ],
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!steps.length) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [steps]);

  return (
    <div
      className="flex flex-col items-center justify-center p-8 space-y-4 animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 animate-pulse rounded-full"></div>
        <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-indigo-50 dark:border-indigo-900 flex items-center justify-center">
          <Sparkles className="text-indigo-500 animate-spin-slow" size={32} />
        </div>
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">
          {message}
        </h3>
        {steps.length > 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium animate-pulse">
            {steps[currentStep]}
          </p>
        )}
      </div>
    </div>
  );
};

export default AILoadingState;
