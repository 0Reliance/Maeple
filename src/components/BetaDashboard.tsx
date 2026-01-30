import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import { errorLogger, ErrorLog } from '../services/errorLogger';

const BetaDashboard: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLogs(errorLogger.getLogs());
    setStats(errorLogger.getStats());
  };

  const handleExport = () => {
    const data = errorLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maeple-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const data = errorLogger.exportLogs();
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      errorLogger.clearLogs();
      refreshData();
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'info': return <Info className="text-blue-500" size={16} />;
      default: return <Info className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Terminal size={24} className="text-indigo-400" />
            Beta Dashboard
          </h2>
          <p className="text-slate-400">
            System logs and error tracking for beta testing.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refreshData}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleCopy}
            className={`p-3 rounded-xl transition-colors ${copied ? 'bg-green-600' : 'bg-slate-800 hover:bg-slate-700'}`}
            title="Copy Logs"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
          <button 
            onClick={handleExport}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            title="Export JSON"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={handleClear}
            className="p-3 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-xl transition-colors"
            title="Clear Logs"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Logs</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalLogs}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-red-500 uppercase">Errors</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalErrors}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-amber-500 uppercase">Warnings</p>
            <p className="text-2xl font-bold text-amber-600">{stats.totalWarnings}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-blue-500 uppercase">Info</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalInfo}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">System Logs</h3>
          <span className="text-xs text-slate-500">Last {logs.length} entries</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              No logs found.
            </div>
          ) : (
            [...logs].reverse().map((log, index) => (
              <div key={index} className="flex flex-col">
                <button 
                  onClick={() => setExpandedLog(expandedLog === index ? null : index)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left"
                >
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
                        {log.context || 'general'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {expandedLog === index ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </button>
                
                {expandedLog === index && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 animate-slideDown">
                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1 text-[10px] text-slate-400 uppercase font-bold">
                      <div>Session: {log.sessionId}</div>
                      <div>User: {log.userId || 'anonymous'}</div>
                      <div>Full Time: {new Date(log.timestamp).toISOString()}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
        <h4 className="font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-2">
          <Info size={18} />
          Beta Testing Instructions
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          If you encounter an error or unexpected behavior, please use the <strong>Download</strong> or <strong>Copy</strong> buttons at the top to collect your logs and share them with the development team. These logs help us identify exactly what happened without accessing your personal health data.
        </p>
      </div>
    </div>
  );
};

export default BetaDashboard;
