
import React, { useEffect, useState } from 'react';
import { StateCheck } from '../types';
import { getRecentStateChecks } from '../services/stateCheckService';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { VenetianMask, Activity, Loader2 } from 'lucide-react';

const StateTrendChart: React.FC = () => {
  const [data, setData] = useState<StateCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const checks = await getRecentStateChecks(10);
        // Reverse for chart (oldest to newest)
        setData(checks.reverse());
      } catch (e) {
        console.error("Failed to load trends", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" /></div>;
  
  if (data.length < 2) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bio-Signal Trends</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">Tracking the hidden cost of performance.</p>
          </div>
        </div>
        <div className="h-48 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Activity className="text-slate-300 dark:text-slate-600 mb-3" size={24} />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Not enough data points yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Complete at least 2 Bio-Checks to see trends.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: new Date(d.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
    masking: (d.analysis.maskingScore * 10).toFixed(1),
    tension: (Math.max(d.analysis.jawTension, d.analysis.eyeFatigue) * 10).toFixed(1),
    label: d.analysis.primaryEmotion
  }));

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Bio-Signal Trends</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Tracking the hidden cost of performance.</p>
        </div>
        <div className="flex gap-3 text-xs font-bold">
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <VenetianMask size={14} /> Masking
            </div>
            <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                <Activity size={14} /> Physical Tension
            </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
           <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis domain={[0, 10]} hide />
              <Tooltip 
                 contentStyle={{ 
                     borderRadius: '12px', 
                     border: 'none', 
                     boxShadow: '0 4px 15px -1px rgb(0 0 0 / 0.1)',
                     backgroundColor: 'var(--tooltip-bg, #fff)',
                     color: 'var(--tooltip-text, #1e293b)'
                 }}
                 labelStyle={{ fontWeight: 'bold', color: 'var(--tooltip-text, #1e293b)' }}
              />
              
              <Bar 
                dataKey="tension" 
                name="Physical Tension" 
                fill="#fdba74" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
              
              <Line 
                type="monotone" 
                dataKey="masking" 
                name="Masking Score" 
                stroke="#9333ea" 
                strokeWidth={3} 
                dot={{r: 4, strokeWidth: 2}}
              />
           </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-xs text-slate-500 dark:text-slate-400 text-center">
          <strong>Pattern Watch:</strong> Does your physical tension (Orange) spike after days of high masking (Purple)?
      </div>
    </div>
  );
};

export default StateTrendChart;
