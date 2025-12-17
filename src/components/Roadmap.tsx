
import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Zap, Brain, Activity, Clock } from 'lucide-react';

const Roadmap: React.FC = () => {
  const phases = [
    {
      id: 1,
      title: "Multi-Dimensional Capacity",
      desc: "Moving beyond 'Spoons' to 7-point capacity grid (Focus, Social, Sensory, etc). Activity tagging.",
      status: 'DONE',
      time: "Week 1-2"
    },
    {
      id: 2,
      title: "Correlation Engine",
      desc: "Connecting the dots: 'High Sensory Load = Low Focus Capacity'. Pattern detection logic.",
      status: 'DONE',
      time: "Week 3-4"
    },
    {
      id: 3,
      title: "Smart Recommendations",
      desc: "Context-aware interventions. 'Your social capacity is low -> Cancel dinner'.",
      status: 'DONE',
      time: "Week 5-6"
    },
    {
      id: 4,
      title: "Burnout Trajectory",
      desc: "Predictive modeling. 'Crash predicted in 2 days based on current load'.",
      status: 'DONE',
      time: "Week 7"
    },
    {
      id: 5,
      title: "Context Switch Costing",
      desc: "Quantifying the executive function cost of role switching.",
      status: 'DONE',
      time: "Week 8"
    },
    {
      id: 6,
      title: "Passive Context Layer",
      desc: "Wearable integration for sleep/HRV correlation with capacity.",
      status: 'DONE',
      time: "Week 9"
    },
    {
      id: 7,
      title: "Hormonal Sync 2.0",
      desc: "Deep integration of cycle phases with executive function expectations.",
      status: 'DONE',
      time: "Week 10"
    },
    {
      id: 8,
      title: "Masking Detection",
      desc: "Tone analysis to detect 'Professional Mask' vs 'Authentic Self'.",
      status: 'DONE',
      time: "Week 11"
    },
    {
      id: 9,
      title: "Visual Therapy AI",
      desc: "Context-aware generative art prompts based on your neuro-metrics.",
      status: 'DONE',
      time: "Week 12"
    },
    {
      id: 10,
      title: "Clinical Phenotyping",
      desc: "Exportable PDF reports for psychiatrists/therapists.",
      status: 'DONE',
      time: "Week 13+"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <header className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-10 rounded-3xl shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
         <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">The MAEPLE Epic</h1>
            <p className="text-emerald-100 text-lg max-w-2xl">
                Our 10-Phase roadmap to transform mental health tracking from 
                <strong> Reactive Symptom Logging</strong> to <strong> Predictive Capacity Modeling</strong>.
            </p>
         </div>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-8">
        <div className="space-y-8">
            {phases.map((phase, index) => (
                <div key={phase.id} className="relative pl-8 md:pl-0">
                    {/* Connector Line */}
                    {index !== phases.length - 1 && (
                        <div className="absolute left-[11px] md:left-1/2 top-10 bottom-[-32px] w-0.5 bg-slate-100 dark:bg-slate-700 md:-translate-x-1/2"></div>
                    )}

                    <div className="md:flex items-center justify-between gap-8 group">
                        
                        {/* Time & Status (Left) */}
                        <div className="hidden md:block w-1/2 text-right pr-8">
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 block mb-1">{phase.time}</span>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                                ${phase.status === 'DONE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                                  phase.status === 'NEXT' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                            `}>
                                {phase.status}
                            </div>
                        </div>

                        {/* Center Icon */}
                        <div className={`absolute left-0 md:static w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-white dark:bg-slate-800
                            ${phase.status === 'DONE' ? 'border-emerald-500 text-emerald-500' : 
                              phase.status === 'NEXT' ? 'border-indigo-500 text-indigo-500' : 'border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600'}
                        `}>
                            {phase.status === 'DONE' ? <CheckCircle2 size={14} /> : 
                             phase.status === 'NEXT' ? <Zap size={14} fill="currentColor" /> : <Circle size={10} />}
                        </div>

                        {/* Content (Right) */}
                        <div className="md:w-1/2 md:pl-8">
                            <h3 className={`text-lg font-bold mb-1 ${phase.status === 'PLANNED' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                {phase.id}. {phase.title}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                {phase.desc}
                            </p>
                            
                            {/* Mobile only status */}
                            <div className="md:hidden mt-2 flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{phase.time}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                    ${phase.status === 'DONE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                                      phase.status === 'NEXT' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                                `}>{phase.status}</span>
                            </div>
                        </div>

                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
