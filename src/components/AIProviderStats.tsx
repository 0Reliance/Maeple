import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { aiRouter } from '../services/ai/router';
import { AIProviderType, AI_PROVIDERS } from '../services/ai/types';

interface ProviderStats {
  providerId: AIProviderType;
  requestCount: number;
  errorCount: number;
  lastRequestTime: number;
}

const AIProviderStats: React.FC = () => {
  const [stats, setStats] = useState<Record<string, ProviderStats>>({});
  const [health, setHealth] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentStats = aiRouter.getProviderStats();
      setStats(currentStats);
      
      const healthStatus = await aiRouter.checkHealth();
      setHealth(healthStatus);
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = (providerId: string) => {
    if (confirm('Reset usage statistics for this provider?')) {
      aiRouter.resetProviderStats(providerId as AIProviderType);
      loadData();
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const activeProviders = Object.keys(stats);

  if (activeProviders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="text-indigo-500" size={20} />
          AI Provider Health & Usage
        </h3>
        <button 
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
          title="Refresh Stats"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeProviders.map((id) => {
          const providerStats = stats[id];
          const isHealthy = health[id];
          const info = AI_PROVIDERS[id as AIProviderType];
          const errorRate = providerStats.requestCount > 0 
            ? ((providerStats.errorCount / providerStats.requestCount) * 100).toFixed(1) 
            : '0.0';

          return (
            <div key={id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-700">{info?.name || id}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isHealthy ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Operational
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={10} /> Issues Detected
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleReset(id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  title="Reset Stats"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Requests</span>
                  <span className="font-mono font-medium text-slate-700">{providerStats.requestCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Error Rate</span>
                  <span className={`font-mono font-medium ${Number(errorRate) > 5 ? 'text-red-500' : 'text-slate-700'}`}>
                    {errorRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <span className="text-xs text-slate-400">Last Active</span>
                  <span className="text-xs text-slate-500">{formatTime(providerStats.lastRequestTime)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIProviderStats;
