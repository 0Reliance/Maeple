
import React from 'react';
import { Zap, Brain, Volume2, EyeOff, BookHeart, Activity, Calendar, Compass, Camera } from 'lucide-react';

const Guide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-12">
      
      {/* Hero Section: The Vision */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-white/10">
            <Compass size={12} className="text-teal-400" />
            Welcome to the Poziverse
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Stop Tracking Deficits.<br />
            <span className="text-teal-400">Unlock Your Mind's Patterns.</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-2xl leading-relaxed">
            Standard health apps ask "What is wrong with you?" MAEPLE asks "What is your context?" 
            We believe that your mind is not a problem to be fixed, but a dynamic system 
            that thrives with the right inputs.
          </p>
        </div>
      </section>

      {/* The Dictionary: Explaining the Metrics */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-teal-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">The MAEPLE Metrics</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mb-8">
          We use neuro-affirming concepts to capture the reality of your day.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Bandwidth (Capacity)</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your <strong>Available Capacity</strong>. 
              Unlike "tiredness" (which sleep fixes), low bandwidth means you need deep recovery.
              <br/><br/>
              <em>Track this to predict crashes before they happen.</em>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg">
                <Volume2 size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Load & Interference</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Load</strong> is the weight on your system (noise, deadlines). 
              <strong>Interference</strong> is when stress in one area (Sensory) disrupts another (Emotion).
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
                <EyeOff size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Noise Generators</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Hidden costs like <strong>Masking</strong> (suppressing traits) or Perfectionism. 
              These drain your battery silently in the background.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Biological Context</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              We highlight phases (like the Luteal Phase) where executive dysfunction naturally rises, 
              so you can embrace strategy instead of shame.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Walkthrough */}
      <section className="space-y-6 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Getting Started</h2>
        </div>

        <div className="space-y-8">
            <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl shrink-0">1</div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                        Set Your Baseline <Zap size={16} className="text-emerald-500" />
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                        Before journaling, set your <strong>Capacity Slider</strong>. 
                        A mood of "Okay" with 1 Spoon is very different from "Okay" with 10 Spoons.
                    </p>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl shrink-0">2</div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                        Speak Freely <BookHeart size={16} className="text-teal-500" />
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                         Talk about your day naturally.
                        <em> "I focused for 3 hours (Flow) but the office was loud (Sensory)..."</em>
                        <br/>
                        Our AI analyzes this to tag <strong>#FlowState</strong> and <strong>#SensoryOverload</strong> automatically.
                    </p>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl shrink-0">3</div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                        Use the Bio-Mirror <Camera size={16} className="text-indigo-500" />
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                        When you can't describe how you feel, use the <strong>Bio-Mirror (State Check)</strong>. 
                        It objectively analyzes your face for jaw tension and eye fatigue to validate your burnout.
                    </p>
                </div>
            </div>
            
             <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl shrink-0">4</div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                        Identify the Gap <Activity size={16} className="text-indigo-500" />
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                        In the Dashboard, look for the gap between <strong>Capacity (Green)</strong> and <strong>Demand (Orange)</strong>.
                        If Demand exceeds Capacity for {'>'}3 days, prioritize recovery.
                    </p>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};

export default Guide;
