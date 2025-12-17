import React, { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  Shield, 
  ChevronRight, 
  ChevronLeft,
  Heart,
  Eye,
  Lock,
  Zap,
  Check
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface Step {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  icon: React.ReactNode;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = () => {
    setIsExiting(true);
    // Mark onboarding as complete
    localStorage.setItem('maeple_onboarding_complete', 'true');
    // Small delay for exit animation
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Welcome to MAEPLE',
      subtitle: 'Your Mental And Emotional Pattern Literacy Engine',
      icon: <Sparkles size={32} className="text-amber-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            MAEPLE helps you understand your unique neurological patterns—not to fix you, but to help you <span className="font-semibold text-slate-800 dark:text-slate-100">work with</span> your brain, not against it.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
              <Heart size={18} className="shrink-0 mt-0.5" />
              <span>Created by and for neurodivergent minds who need a gentler approach to self-tracking.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'patterns',
      title: 'Pattern Literacy Over Surveillance',
      subtitle: 'Learn your patterns, don\'t police them',
      icon: <Brain size={32} className="text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Traditional mood trackers ask "What did you do wrong?" MAEPLE asks "What patterns are you noticing?"
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium mb-1">
                <Zap size={16} className="text-amber-500" />
                Capacity Tracking
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track your 7 capacity dimensions across social, sensory, focus, and more</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium mb-1">
                <Eye size={16} className="text-rose-500" />
                Bio-Mirror
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI analysis helps you see what you might not notice about yourself</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'mae',
      title: 'Meet Mae',
      subtitle: 'Your empathetic pattern companion',
      icon: <Heart size={32} className="text-rose-500" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🌸</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Mae</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Empathetic Pattern Guide</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Mae reads your journal entries and helps translate your experiences into actionable strategies—without judgment, without prescriptions, just pattern recognition.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            "You're not broken—you're just running different software."
          </p>
        </div>
      ),
    },
    {
      id: 'privacy',
      title: 'Privacy First',
      subtitle: 'Your data stays on your device',
      icon: <Shield size={32} className="text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            MAEPLE is <span className="font-semibold">local-first</span>. Your journal entries, capacity data, and patterns never leave your device.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Lock size={18} className="text-emerald-600" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200">Encrypted local storage</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Check size={18} className="text-emerald-600" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200">No accounts required</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Check size={18} className="text-emerald-600" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200">Export your data anytime</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'start',
      title: 'Ready to Begin?',
      subtitle: 'Start your pattern literacy journey',
      icon: <Sparkles size={32} className="text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Here's how to get the most from MAEPLE:
          </p>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold shrink-0">1</span>
              <span className="text-slate-700 dark:text-slate-200"><span className="font-medium">Journal daily</span> — Just a few sentences about how you're feeling</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold shrink-0">2</span>
              <span className="text-slate-700 dark:text-slate-200"><span className="font-medium">Use the sliders</span> — Rate your capacity across different dimensions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold shrink-0">3</span>
              <span className="text-slate-700 dark:text-slate-200"><span className="font-medium">Check your patterns</span> — Visit the Dashboard after 3+ entries</span>
            </li>
          </ol>
          <div className="pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              No pressure. No streaks. Just awareness.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-indigo-500 w-6'
                  : index < currentStep
                  ? 'bg-indigo-300'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner">
              {currentStepData.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{currentStepData.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentStepData.subtitle}</p>
            </div>
          </div>

          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {isLastStep ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Journaling
              <Sparkles size={18} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex items-center gap-1 px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
            >
              Next
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;

// Utility function to check if onboarding is complete
export const isOnboardingComplete = (): boolean => {
  return localStorage.getItem('maeple_onboarding_complete') === 'true';
};

// Utility function to reset onboarding (for testing)
export const resetOnboarding = (): void => {
  localStorage.removeItem('maeple_onboarding_complete');
};
