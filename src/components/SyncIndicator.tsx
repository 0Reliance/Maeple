import { AlertCircle, CheckCircle, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import React from 'react';
import { useSyncStore } from '../stores';

const SyncIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { status, pendingChanges, error } = useSyncStore();

  const getIcon = () => {
    if (status === 'syncing') {
      return <RefreshCw className="animate-spin text-primary" size={18} />;
    }
    if (status === 'error') {
      return <AlertCircle className="text-accent-alert" size={18} />;
    }
    if (status === 'offline') {
      return <CloudOff className="text-text-tertiary" size={18} />;
    }
    if (pendingChanges > 0) {
      return <Cloud className="text-accent-attention" size={18} />;
    }
    return <CheckCircle className="text-accent-positive" size={18} />;
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
      <span className="text-xs font-medium text-text-secondary hidden sm:inline">
        {status === 'syncing' ? 'Syncing...' : status === 'error' ? 'Error' : ''}
      </span>
    </div>
  );
};

export default SyncIndicator;
