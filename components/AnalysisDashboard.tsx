import React from 'react';
import { HealthEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Brain, Pill, Activity } from 'lucide-react';

interface Props {
  entries: HealthEntry[];
}

const AnalysisDashboard: React.FC<Props> = ({ entries }) => {
  // Process data for charts
  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
    mood: e.mood,
    label: e.moodLabel
  }));

  // Stats
  const avgMood = entries.length ? (entries.reduce((acc, curr) => acc + curr.mood, 0) / entries.length).toFixed(1) : 0;
  const totalMeds = entries.reduce((acc, curr) => acc + curr.medications.length, 0);
  const totalSymptoms = entries.reduce((acc, curr) => acc + curr.symptoms.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Brain size={16} className="text-indigo-500" />
            <span className="text-xs font-semibold uppercase">Avg Mood</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{avgMood}<span className="text-sm text-slate-400 font-normal">/5</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Pill size={16} className="text-emerald-500" />
            <span className="text-xs font-semibold uppercase">Meds Logged</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalMeds}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Activity size={16} className="text-rose-500" />
            <span className="text-xs font-semibold uppercase">Symptoms</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalSymptoms}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Mood Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis domain={[0, 6]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#0d9488', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="mood" 
                stroke="#0d9488" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMood)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Recent Logs</h3>
        {entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4">
                <div className={`w-2 h-full rounded-full self-stretch ${entry.mood >= 4 ? 'bg-green-400' : entry.mood >= 3 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-800">{entry.moodLabel}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{entry.notes}</p>
                    <div className="flex flex-wrap gap-2">
                        {entry.medications.map((m, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
                                💊 {m.name} {m.dosage}
                            </span>
                        ))}
                        {entry.symptoms.map((s, i) => (
                            <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-100">
                                🌡️ {s.name} ({s.severity}/10)
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        ))}
        {entries.length === 0 && (
            <div className="text-center p-8 text-slate-400">No entries yet. Start by logging your day!</div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
