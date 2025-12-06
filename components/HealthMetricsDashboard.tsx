
import React, { useMemo } from 'react';
import { HealthEntry, WearableDataPoint, StrategyRecommendation } from '../types';
import { 
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Legend, Line, ReferenceArea
} from 'recharts';
import { Brain, TrendingUp, Zap, Star, AlertTriangle, Sparkles, Lightbulb, Compass, Shield, TrendingDown, Activity, BatteryWarning, Layers, CloudRain, Sun, CloudFog, EyeOff, VenetianMask, PhoneCall } from 'lucide-react';
import { getUserSettings } from '../services/storageService';
import { generateInsights, generateDailyStrategy, calculateBurnoutTrajectory, calculateCognitiveLoad, calculateCyclePhase } from '../services/analytics';
import StateTrendChart from './StateTrendChart';

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
  
  // Generate Insights (Phase 2 & 6: Correlation Engine)
  const insights = useMemo(() => generateInsights(entries, wearableData), [entries, wearableData]);
  
  // Generate Current Strategy & Cognitive Load based on latest entry
  const { strategies, cognitiveLoad } = useMemo(() => {
    if (entries.length === 0) return { strategies: [], cognitiveLoad: null };
    const sorted = [...entries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0];
    return {
      strategies: generateDailyStrategy(latest),
      cognitiveLoad: calculateCognitiveLoad(latest)
    };
  }, [entries]);

  // Generate Burnout Forecast (Phase 4)
  const forecast = useMemo(() => calculateBurnoutTrajectory(entries), [entries]);

  // Generate Hormonal Context (Phase 7)
  const userSettings = getUserSettings();
  const hormonalContext = useMemo(() => calculateCyclePhase(userSettings), [userSettings]);

  // Calculate Masking Trends (Phase 8)
  const maskingTrend = useMemo(() => {
    if (entries.length < 2) return null;
    const sorted = [...entries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0].neuroMetrics.maskingScore || 0;
    const avg = sorted.reduce((acc, curr) => acc + (curr.neuroMetrics.maskingScore || 0), 0) / sorted.length;
    return { latest, avg, diff: latest - avg };
  }, [entries]);

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

  const cycleStart = userSettings.cycleStartDate ? new Date(userSettings.cycleStartDate) : null;
  const cycleLen = userSettings.avgCycleLength || 28;

  // 1. Generate Date Range (Last 14 days for clarity)
  const today = new Date();
  const dateMap = new Map<string, unknown>();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    
    // Calculate Cycle Day
    let cycleDay = null;
    let isLuteal = false;
    if (cycleStart) {
        const daysSinceStart = Math.floor((d.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceStart >= 0) {
            cycleDay = (daysSinceStart % cycleLen) + 1;
            // Luteal Phase approx Day 18-28
            if (cycleDay >= 18 && cycleDay <= cycleLen) {
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

  // 2. Populate Journal Data
  entries.forEach(e => {
      const dateStr = new Date(e.timestamp).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
          const curr = dateMap.get(dateStr);
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
      
      {/* Phase 3: Mae's Strategy Deck */}
      {strategies.length > 0 && (
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
             
             <div className="flex items-center gap-2 mb-4 relative z-10">
                  <Compass className="text-teal-200" size={24} />
                  <h3 className="font-bold text-xl">Mae's Strategy Deck</h3>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">For Today</span>
             </div>

             <div className="grid md:grid-cols-3 gap-4 relative z-10">
                 {strategies.map((strat) => (
                    <div key={strat.id} className="bg-white/10 border border-white/20 p-4 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            {strat.type === 'REST' && <Shield size={16} className="text-rose-200" />}
                            {strat.type === 'FOCUS' && <Zap size={16} className="text-yellow-200" />}
                            {strat.type === 'SOCIAL' && <Brain size={16} className="text-pink-200" />}
                            {strat.type === 'SENSORY' && <AlertTriangle size={16} className="text-orange-200" />}
                            <span className="font-bold text-sm text-white">{strat.title}</span>
                        </div>
                        <p className="text-sm text-teal-50 leading-snug opacity-90">{strat.action}</p>
                    </div>
                 ))}
             </div>
          </div>
      )}

      {/* Grid for Widgets */}
      <div className="grid md:grid-cols-2 gap-6">
          
          {/* Phase 4: Burnout Forecast Widget */}
          <div className={`rounded-2xl p-6 border shadow-md relative overflow-hidden ${
              forecast.riskLevel === 'CRITICAL' ? 'bg-rose-50 border-rose-200' :
              forecast.riskLevel === 'MODERATE' ? 'bg-orange-50 border-orange-200' :
              'bg-indigo-50 border-indigo-200'
          }`}>
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                          forecast.riskLevel === 'CRITICAL' ? 'bg-rose-500 text-white' :
                          forecast.riskLevel === 'MODERATE' ? 'bg-orange-500 text-white' :
                          'bg-indigo-500 text-white'
                      }`}>
                          <Activity size={24} />
                      </div>
                      <div>
                          <h3 className={`font-bold text-lg ${
                              forecast.riskLevel === 'CRITICAL' ? 'text-rose-800' :
                              forecast.riskLevel === 'MODERATE' ? 'text-orange-800' :
                              'text-indigo-800'
                          }`}>Burnout Trajectory</h3>
                          <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  forecast.riskLevel === 'CRITICAL' ? 'bg-rose-200 text-rose-800' :
                                  forecast.riskLevel === 'MODERATE' ? 'bg-orange-200 text-orange-800' :
                                  'bg-indigo-200 text-indigo-800'
                              }`}>{forecast.riskLevel}</span>
                          </div>
                      </div>
                  </div>
                  
                  {forecast.daysUntilCrash !== null && (
                      <div className="text-right">
                          <p className="text-xs font-bold uppercase text-slate-500">Projected Crash</p>
                          <p className="text-2xl font-bold text-rose-600">{forecast.daysUntilCrash} Days</p>
                      </div>
                  )}
              </div>

              <p className="text-slate-700 leading-relaxed mb-4 text-sm">{forecast.description}</p>
              
              {forecast.recoveryDaysNeeded > 0 && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white/50 p-2 rounded-lg w-fit">
                      <BatteryWarning size={14} className="text-orange-500" />
                      <span>Est. Recovery: <strong>{forecast.recoveryDaysNeeded} Days</strong></span>
                  </div>
              )}

              {/* Safety Interceptor */}
              {forecast.riskLevel === 'CRITICAL' && (
                  <div className="mt-4 pt-4 border-t border-rose-200">
                      <p className="text-xs font-bold text-rose-500 mb-2 flex items-center gap-1">
                          <AlertTriangle size={12} /> CLINICAL NOTE
                      </p>
                      <p className="text-xs text-rose-800 mb-2">
                          Sustained critical load predicts severe burnout. Consider activating your support network.
                      </p>
                      {userSettings.safetyContact && (
                          <a href={`tel:${userSettings.safetyContact}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-200 text-rose-800 rounded-lg text-xs font-bold hover:bg-rose-300 transition-colors">
                              <PhoneCall size={12} /> Call Support
                          </a>
                      )}
                  </div>
              )}
          </div>

          {/* Phase 5 & 8: Cognitive & Masking Load Widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
                
                {/* Cognitive Load */}
                {cognitiveLoad && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <Layers size={18} className="text-blue-500" />
                                <h3 className="font-bold text-slate-800">Cognitive Load</h3>
                             </div>
                             <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                cognitiveLoad.state === 'FRAGMENTED' ? 'bg-rose-100 text-rose-700' :
                                cognitiveLoad.state === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>{cognitiveLoad.state}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                            <div className={`h-1.5 rounded-full ${cognitiveLoad.efficiencyLoss > 30 ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(cognitiveLoad.efficiencyLoss, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500"><strong>{cognitiveLoad.switches}</strong> context switches ({cognitiveLoad.efficiencyLoss}% efficiency tax).</p>
                    </div>
                )}

                {/* Phase 8: Masking Burden */}
                {maskingTrend && (
                     <div className="pt-4 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <VenetianMask size={18} className="text-purple-500" />
                                <h3 className="font-bold text-slate-800">Masking Burden</h3>
                             </div>
                             {maskingTrend.latest > 6 && (
                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">High</span>
                             )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                    <div className={`h-1.5 rounded-full ${maskingTrend.latest > 6 ? 'bg-purple-500' : 'bg-slate-400'}`} style={{ width: `${maskingTrend.latest * 10}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Current Effort: <strong>{maskingTrend.latest}/10</strong>
                                </p>
                            </div>
                            {maskingTrend.diff > 1 ? (
                                <div className="text-xs font-bold text-rose-500 flex items-center">
                                    <TrendingUp size={12} className="mr-1" /> Rising
                                </div>
                            ) : maskingTrend.diff < -1 ? (
                                <div className="text-xs font-bold text-emerald-500 flex items-center">
                                    <TrendingDown size={12} className="mr-1" /> Dropping
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400">Stable</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 italic">
                            High masking correlates with faster spoon depletion.
                        </p>
                    </div>
                )}
            </div>

           {/* Phase 7: Hormonal Weather Widget */}
          {hormonalContext ? (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100 shadow-md md:col-span-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                         <div className="p-3 bg-white text-rose-500 rounded-xl shadow-sm">
                             {hormonalContext.phase === 'LUTEAL' || hormonalContext.phase === 'MENSTRUAL' ? (
                                 <CloudFog size={24} />
                             ) : (
                                 <Sun size={24} />
                             )}
                         </div>
                         <div>
                             <h3 className="font-bold text-lg text-rose-900">Hormonal Forecast</h3>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                                     {hormonalContext.phase} Phase
                                 </span>
                                 <span className="text-xs text-rose-600 font-medium">Day {hormonalContext.day}/{hormonalContext.length}</span>
                             </div>
                         </div>
                    </div>
                    
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold uppercase text-rose-400">Energy Prediction</p>
                        <p className="text-lg font-bold text-rose-700">{hormonalContext.energyPrediction}</p>
                    </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="bg-white/60 p-3 rounded-xl border border-rose-100/50">
                        <p className="text-xs font-bold uppercase text-rose-400 mb-1">Cognitive Impact</p>
                        <p className="text-rose-900 font-medium">{hormonalContext.cognitiveImpact}</p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-xl border border-rose-100/50">
                        <p className="text-xs font-bold uppercase text-rose-400 mb-1">Mae's Advice</p>
                        <p className="text-rose-900 text-sm">{hormonalContext.advice}</p>
                    </div>
                </div>
            </div>
          ) : (
             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between text-slate-400 md:col-span-2">
                 <div className="flex items-center gap-3">
                     <CloudRain size={24} />
                     <span>Hormonal forecasting disabled. Set up in Settings.</span>
                 </div>
             </div>
          )}

      </div>

      {/* State Check Trends (Phase 6 Bio-Mirror) */}
      <StateTrendChart />

      {/* Pattern Insights Section (Phase 2 & 6) */}
      {insights.length > 0 && (
          <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-800">
              <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-indigo-300" size={20} />
                  <h3 className="font-bold text-lg">AI Pattern Discovery</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                  {insights.map((insight, i) => (
                      <div key={i} className="bg-indigo-800/50 border border-indigo-700 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                              {insight.type === 'WARNING' ? (
                                  <AlertTriangle size={16} className="text-orange-400" />
                              ) : insight.type === 'BIO-LINK' ? (
                                  <Activity size={16} className="text-rose-400" />
                              ) : (
                                  <Lightbulb size={16} className="text-emerald-400" />
                              )}
                              <span className="font-bold text-sm text-indigo-100">{insight.title}</span>
                          </div>
                          <p className="text-sm text-indigo-300 leading-snug">{insight.description}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <YAxis yAxisId="left" domain={[0, 10]} hide />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
              
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
              
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
              
              <Bar 
                yAxisId="left"
                dataKey="sensory" 
                name="Sensory Load" 
                fill="#fdba74" 
                radius={[4, 4, 0, 0]} 
                barSize={12}
              />
              
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

              <Line
                yAxisId="left"
                type="monotone"
                name="Mood (scaled)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                dataKey={(data) => data.mood ? data.mood * 2 : null}
              />

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
