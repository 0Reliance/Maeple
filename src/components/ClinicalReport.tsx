
import React, { useMemo } from 'react';
import { HealthEntry, WearableDataPoint, CapacityProfile } from '../types';
import { generateInsights, calculateBurnoutTrajectory } from '../services/analytics';
import { Printer, FileText, Brain, Activity, Calendar, AlertTriangle, Zap, Volume2, EyeOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  entries: HealthEntry[];
  wearableData: WearableDataPoint[];
}

const ClinicalReport: React.FC<Props> = ({ entries, wearableData }) => {
  
  const reportDate = new Date().toLocaleDateString();
  const dateRangeStart = entries.length > 0 ? new Date(entries[entries.length - 1].timestamp).toLocaleDateString() : '-';
  const dateRangeEnd = entries.length > 0 ? new Date(entries[0].timestamp).toLocaleDateString() : '-';

  // 1. Calculate Average Profile
  const avgProfile = useMemo(() => {
    if (entries.length === 0) return null;
    const sums: Record<string, number> = { focus: 0, social: 0, structure: 0, emotional: 0, physical: 0, sensory: 0, executive: 0 };
    entries.forEach(e => {
        Object.keys(sums).forEach(k => {
            sums[k] += (e.neuroMetrics.capacity as Record<string, number>)[k] || 0;
        });
    });
    const result = Object.keys(sums).map(k => ({
        subject: k.charAt(0).toUpperCase() + k.slice(1),
        A: (sums[k] / entries.length).toFixed(1),
        fullMark: 10
    }));
    return result;
  }, [entries]);

  // 2. Risk Metrics
  const burnoutStats = useMemo(() => calculateBurnoutTrajectory(entries), [entries]);
  const avgSensory = entries.length ? (entries.reduce((a,b) => a + b.neuroMetrics.sensoryLoad, 0) / entries.length).toFixed(1) : '0.0';
  const avgMasking = entries.length ? (entries.reduce((a,b) => a + (b.neuroMetrics.maskingScore || 0), 0) / entries.length).toFixed(1) : '0.0';

  // 3. Pattern Insights
  const insights = useMemo(() => generateInsights(entries, wearableData), [entries, wearableData]);

  // 4. Longitudinal Chart Data (Last 30 days)
  const chartData = useMemo(() => {
     return [...entries]
        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-30)
        .map(e => ({
            date: new Date(e.timestamp).toLocaleDateString(undefined, {month:'numeric', day:'numeric'}),
            spoons: e.neuroMetrics.spoonLevel,
            mood: e.mood * 2 // scale to 10
        }));
  }, [entries]);

  const handlePrint = () => {
    window.print();
  };

  if (entries.length < 5) {
      return (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-700">Insufficient Data</h2>
              <p className="text-slate-500 mt-2">
                  Please log at least 5 entries to generate a meaningful Clinical Phenotype Report.
              </p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12 print:p-0 print:max-w-none">
      
      {/* Header / Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Clinical Phenotype Report</h1>
            <p className="text-slate-500">Longitudinal analysis for therapeutic context.</p>
        </div>
        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
            <Printer size={18} />
            Print to PDF
        </button>
      </div>

      {/* The Report (Printable Area) */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0">
        
        {/* Report Header */}
        <header className="border-b border-slate-100 pb-8 mb-8 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                    <span className="font-bold text-slate-900 tracking-tight text-xl">MAEPLE</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Digital Phenotype Analysis</h2>
                <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p><strong>Report Date:</strong> {reportDate}</p>
                    <p><strong>Data Range:</strong> {dateRangeStart} — {dateRangeEnd}</p>
                    <p><strong>Entries Analyzed:</strong> {entries.length}</p>
                </div>
            </div>
            <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    CONFIDENTIAL
                </span>
            </div>
        </header>

        {/* 1. Executive Summary */}
        <section className="mb-12">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-indigo-500 pl-3">Executive Summary</h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-xl">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Activity size={18} className="text-rose-500" /> Burnout Risk
                    </h4>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-2xl font-bold ${
                            burnoutStats.riskLevel === 'CRITICAL' ? 'text-rose-600' : 
                            burnoutStats.riskLevel === 'MODERATE' ? 'text-orange-600' : 'text-emerald-600'
                        }`}>{burnoutStats.riskLevel}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{burnoutStats.description}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl">
                     <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Brain size={18} className="text-indigo-500" /> Neuro-Cognitive Load
                    </h4>
                    <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Avg Sensory Load</span>
                            <span className="font-bold text-slate-700">{avgSensory}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-orange-400 h-1.5 rounded-full" style={{width: `${parseFloat(avgSensory)*10}%`}}></div>
                        </div>

                        <div className="flex justify-between text-sm mt-3">
                            <span className="text-slate-500">Avg Masking Effort</span>
                            <span className="font-bold text-slate-700">{avgMasking}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="bg-purple-400 h-1.5 rounded-full" style={{width: `${parseFloat(avgMasking)*10}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 2. Capacity Profile (Radar Chart) */}
        <section className="mb-12">
             <h3 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-teal-500 pl-3">Baseline Capacity Profile</h3>
             <div className="grid md:grid-cols-3 gap-8 items-center">
                 <div className="md:col-span-1 space-y-4">
                     <p className="text-sm text-slate-600 leading-relaxed">
                         This chart represents the patient's average reported capacity across 7 functional domains.
                     </p>
                     <ul className="space-y-2 text-sm">
                         <li className="flex items-center gap-2 text-slate-700">
                             <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                             <strong>Spikes:</strong> Areas of strength/hyperfocus
                         </li>
                         <li className="flex items-center gap-2 text-slate-700">
                             <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                             <strong>Dips:</strong> Areas requiring accommodation
                         </li>
                     </ul>
                 </div>
                 <div className="md:col-span-2 h-64 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={avgProfile || []}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar
                                name="Average Capacity"
                                dataKey="A"
                                stroke="#0d9488"
                                strokeWidth={2}
                                fill="#0d9488"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                 </div>
             </div>
        </section>

        {/* 3. Longitudinal Trends */}
        <section className="mb-12 break-inside-avoid">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-blue-500 pl-3">30-Day Stability Trend</h3>
            <div className="h-64 w-full border border-slate-100 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorSpoons" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                        <YAxis domain={[0, 10]} hide />
                        <Tooltip contentStyle={{borderRadius:'8px'}} />
                        <Area 
                            type="monotone" 
                            dataKey="spoons" 
                            name="Capacity (Spoons)" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            fill="url(#colorSpoons)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="mood" 
                            name="Mood (Scaled)" 
                            stroke="#6366f1" 
                            strokeWidth={2} 
                            fillOpacity={0} 
                            strokeDasharray="4 4"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Green = Capacity (Spoons) • Dotted Purple = Mood</p>
        </section>

        {/* 4. Detected Patterns */}
        <section className="break-inside-avoid">
             <h3 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-purple-500 pl-3">Correlational Analysis</h3>
             <div className="space-y-4">
                 {insights.length > 0 ? insights.map((insight, i) => (
                     <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="mt-1">
                             {insight.type === 'WARNING' && <AlertTriangle className="text-orange-500" size={20} />}
                             {insight.type === 'BIO-LINK' && <Activity className="text-rose-500" size={20} />}
                             {insight.type === 'CORRELATION' && <Zap className="text-indigo-500" size={20} />}
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800 text-sm">{insight.title}</h4>
                             <p className="text-sm text-slate-600">{insight.description}</p>
                         </div>
                     </div>
                 )) : (
                     <p className="text-slate-500 italic">Not enough data to detect patterns yet.</p>
                 )}
             </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
                Generated by MAEPLE (Powered by Poziverse). 
                This report tracks patient-reported outcomes and is not a diagnostic tool.
            </p>
        </footer>

      </div>
    </div>
  );
};

export default ClinicalReport;
