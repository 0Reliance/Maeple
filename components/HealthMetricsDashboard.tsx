
import React from 'react';
import { HealthEntry, WearableDataPoint } from '../types';
import { 
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Legend, Line, ReferenceArea
} from 'recharts';
import { Brain, TrendingUp, Zap, Star, AlertTriangle } from 'lucide-react';
import { getUserSettings } from '../services/storageService';

interface HealthMetricsDashboardProps {
  entries: HealthEntry[];
  wearableData?: WearableDataPoint[];
}

/**
 * HealthMetricsDashboard
 * 
 * Visualization component focused on Neuro-Affirming Metrics:
 * Capacity (Spoons) vs Demand (Sensory Load) vs Biology (Cycle) vs Physiology (HRV).
 */
const HealthMetricsDashboard: React.FC<HealthMetricsDashboardProps> = ({ entries, wearableData = [] }) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="text-indigo-400" size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-700">No Data Available</h3>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
          Start logging to track your Energy Spoons, Sensory Load, and Mood patterns.
        </p>
      </div>
    );
  }

  const userSettings = getUserSettings();
  const cycleStart = userSettings.cycleStartDate ? new Date(userSettings.cycleStartDate) : null;
  const cycleLen = userSettings.avgCycleLength || 28;

  // 1. Generate Date Range (Last 14 days for clarity)
  const today = new Date();
  const dateMap = new Map<string, any>();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    
    // Calculate Cycle Day
    let cycleDay = null;
    let isLuteal = false;
    if (cycleStart) {
        const diffTime = Math.abs(d.getTime() - cycleStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        // Logic depends on if d is before or after cycleStart, assuming d is after or we project cycles
        // Simple projection:
        const daysSinceStart = Math.floor((d.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceStart >= 0) {
            cycleDay = (daysSinceStart % cycleLen) + 1;
            // Luteal Phase approx Day 22-28 (PMDD danger zone)
            if (cycleDay >= cycleLen - 7 && cycleDay <= cycleLen) {
                isLuteal = true;
            }
        }
    }

    dateMap.set(dateStr, {
        rawDate: dateStr,
        date: displayDate,
        mood: null,
        spoons: null,
        sensory: null,
        hrv: null,
        sleep: null,
        cycleDay,
        isLuteal
    });
  }

  // 2. Populate Journal Data (Average per day if multiple)
  entries.forEach(e => {
      const dateStr = new Date(e.timestamp).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
          const curr = dateMap.get(dateStr);
          // Simple overwrite or average (using overwrite for MVP simplicity)
          curr.mood = e.mood;
          curr.spoons = e.neuroMetrics?.spoonLevel || 5;
          curr.sensory = e.neuroMetrics?.sensoryLoad || 0;
      }
  });

  // 3. Populate Wearable Data
  wearableData.forEach(w => {
      if (dateMap.has(w.date)) {
          const curr = dateMap.get(w.date);
          curr.hrv = w.metrics.biometrics?.hrvMs;
          if (w.metrics.sleep?.totalDurationSeconds) {
              curr.sleep = parseFloat((w.metrics.sleep.totalDurationSeconds / 3600).toFixed(1));
          }
      }
  });

  const chartData = Array.from(dateMap.values());

  // Stats
  const validSpoons = chartData.filter(d => d.spoons !== null);
  const avgSpoons = validSpoons.length ? (validSpoons.reduce((acc, curr) => acc + curr.spoons, 0) / validSpoons.length).toFixed(1) : '-';
  
  const validMood = chartData.filter(d => d.mood !== null);
  const avgMood = validMood.length ? (validMood.reduce((acc, curr) => acc + curr.mood, 0) / validMood.length).toFixed(1) : '-';

  // Count top strengths
  const strengthMap: Record<string, number> = {};
  entries.forEach(e => e.strengths?.forEach(s => {
    strengthMap[s] = (strengthMap[s] || 0) + 1;
  }));
  const topStrength = Object.entries(strengthMap).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None yet';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Spoons / Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Avg Capacity</p>
            <h4 className="text-3xl font-bold text-slate-800 flex items-baseline gap-1">
              {avgSpoons}<span className="text-base font-normal text-slate-400">/10 Spoons</span>
            </h4>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Zap className="text-emerald-600" size={24} fill="currentColor" />
          </div>
        </div>

        {/* Mood */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Avg Mood</p>
            <h4 className="text-3xl font-bold text-slate-800 flex items-baseline gap-1">
              {avgMood}<span className="text-base font-normal text-slate-400">/5</span>
            </h4>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
            <Brain className="text-teal-600" size={24} />
          </div>
        </div>

        {/* Top Strength */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Top Strength</p>
            <h4 className="text-xl font-bold text-slate-800 truncate max-w-[150px]" title={topStrength}>
                {topStrength}
            </h4>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <Star className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Main Chart: Neuro-Context Fusion */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Neuro-Context Timeline</h3>
            <p className="text-sm text-slate-500 mt-1">
               Correlating Capacity (Spoons), Sensory Demand, and Biological Rhythms.
            </p>
          </div>
          {cycleStart && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold border border-rose-100">
                  <AlertTriangle size={14} />
                  <span>Cycle Tracking Active</span>
              </div>
          )}
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spoonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                dy={10} 
              />
              
              {/* Primary Y-Axis: 0-10 scale for Spoons/Sensory/Mood */}
              <YAxis yAxisId="left" domain={[0, 10]} hide />
              {/* Secondary Y-Axis: 20-100 for HRV */}
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
              
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              
              {/* Luteal Phase Highlight */}
              {chartData.map((entry, index) => (
                  entry.isLuteal ? (
                      <ReferenceArea 
                        key={index} 
                        yAxisId="left" 
                        x1={entry.date} 
                        x2={entry.date} 
                        fill="#fecdd3" 
                        fillOpacity={0.4} 
                        ifOverflow="extendDomain" 
                      />
                  ) : null
              ))}
              
              {/* Sensory Load Bar (Demand) */}
              <Bar 
                yAxisId="left"
                dataKey="sensory" 
                name="Sensory Load" 
                fill="#fdba74" 
                radius={[4, 4, 0, 0]} 
                barSize={12}
              />
              
              {/* Spoons Area (Capacity) */}
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="spoons" 
                name="Spoons (Capacity)" 
                stroke="#10b981" 
                strokeWidth={3} 
                fill="url(#spoonGradient)" 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />

              {/* Mood Line */}
              <Line
                yAxisId="left"
                type="monotone"
                name="Mood (scaled)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                dataKey={(data) => data.mood ? data.mood * 2 : null} // Scale 1-5 to 1-10
              />

              {/* HRV Line (Objective Stress) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="hrv"
                name="HRV (Stress)"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f43f5e' }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 justify-center bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>Green Area = Your Energy Capacity</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-300 rounded-sm"></div>
                <span>Orange Bar = Sensory Demand</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-200 rounded-sm opacity-50"></div>
                <span>Red Zone = Luteal Phase Risk</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-rose-500 rounded-full"></div>
                <span>Red Line = HRV (Low = Stress)</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMetricsDashboard;
