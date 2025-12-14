import React from 'react';
import { useSyncStore } from '../stores';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const SyncIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { status, pendingChanges, error } = useSyncStore();

  const getIcon = () => {
    if (status === 'syncing') {
      return <RefreshCw className="animate-spin text-blue-500" size={18} />;
    }
    if (status === 'error') {
      return <AlertCircle className="text-red-500" size={18} />;
    }
    if (status === 'offline') {
      return <CloudOff className="text-slate-400" size={18} />;
    }
    if (pendingChanges > 0) {
      return <Cloud className="text-amber-500" size={18} />;
    }
    return <CheckCircle className="text-teal-500" size={18} />;
  };

  const getTitle = () => {
    if (status === 'syncing') return 'Syncing...';
    if (status === 'error') return error || 'Sync Error';
    if (status === 'offline') return 'Offline';
    if (pendingChanges > 0) return `${pendingChanges} changes pending`;
    return 'All data synced';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} title={getTitle()}>
      {getIcon()}
      <span className="text-xs font-medium text-slate-500 hidden sm:inline">
        {status === 'syncing' ? 'Syncing...' : status === 'error' ? 'Error' : ''}
      </span>
    </div>
  );
};

export default SyncIndicator;
