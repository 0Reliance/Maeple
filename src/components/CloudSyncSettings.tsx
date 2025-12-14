/**
 * MAEPLE Cloud Sync Settings
 *
 * UI for managing cloud synchronization and authentication.
 */

import React, { useState, useEffect } from "react";
import {
  getAuthState,
  onAuthStateChange,
  signOut,
  AuthState,
} from "../services/authService";
import {
  getSyncState,
  onSyncStateChange,
  fullSync,
  pushToCloud,
  pullFromCloud,
  getSyncStats,
  SyncState,
} from "../services/syncService";
import AuthModal from "./AuthModal";

const CloudSyncSettings: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(getAuthState());
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState<{
    localEntries: number;
    cloudEntries: number;
    pendingChanges: number;
    lastSyncAt: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check if Sync is configured
  const configured = true;

  useEffect(() => {
    const unsubAuth = onAuthStateChange(setAuthState);
    const unsubSync = onSyncStateChange(setSyncState);

    // Load stats
    loadStats();

    return () => {
      unsubAuth();
      unsubSync();
    };
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadStats();
    }
  }, [authState.isAuthenticated]);

  const loadStats = async () => {
    try {
      const s = await getSyncStats();
      setStats(s);
    } catch (err) {
      console.error("Failed to load sync stats:", err);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await fullSync();
      if (result.success) {
        setMessage({
          type: "success",
          text: `Synced! Pushed ${result.pushed} entries, pulled ${result.pulled} new entries.`,
        });
      } else {
        throw new Error(result.error);
      }
      await loadStats();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await pushToCloud();
      if (result.success) {
        setMessage({
          type: "success",
          text: `Pushed ${result.count} entries to cloud.`,
        });
      } else {
        throw new Error(result.error);
      }
      await loadStats();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Push failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await pullFromCloud();
      if (result.success) {
        setMessage({
          type: "success",
          text: `Pulled ${result.count} new entries from cloud.`,
        });
      } else {
        throw new Error(result.error);
      }
      await loadStats();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Pull failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Signed out successfully" });
    }
  };

  // Not configured state
  if (!configured) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          Cloud Sync
        </h3>
        <div className="p-4 rounded-lg bg-slate-700/50 text-center">
          <p className="text-slate-400 text-sm">
            Cloud sync is not configured. Running in local-only mode.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Contact your administrator to enable cloud sync.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-teal-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
        Cloud Sync
      </h3>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
              : "bg-red-500/20 text-red-300 border border-red-500/50"
          }`}
        >
          {message.text}
        </div>
      )}

      {!authState.isAuthenticated ? (
        // Not signed in
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-700/50 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 className="text-white font-medium mb-1">Enable Cloud Sync</h4>
            <p className="text-slate-400 text-sm mb-4">
              Sign in to sync your data across devices and keep backups in the
              cloud.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
            >
              Sign In / Sign Up
            </button>
          </div>

          <div className="text-xs text-slate-500 text-center space-y-1">
            <p>🔒 Your data is encrypted end-to-end</p>
            <p>📱 Access from any device</p>
            <p>☁️ Automatic cloud backups</p>
          </div>
        </div>
      ) : (
        // Signed in
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-teal-500/30 flex items-center justify-center text-teal-300 font-medium">
              {authState.user?.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {authState.user?.email}
              </p>
              <p className="text-xs text-slate-400">
                {syncState.status === "synced" && syncState.lastSyncAt
                  ? `Last synced: ${syncState.lastSyncAt.toLocaleString()}`
                  : syncState.status === "syncing"
                  ? "Syncing..."
                  : "Not synced yet"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Sync Status */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-700/30">
              <p className="text-lg font-semibold text-white">
                {stats?.localEntries || 0}
              </p>
              <p className="text-xs text-slate-400">Local</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-700/30">
              <p className="text-lg font-semibold text-white">
                {stats?.pendingChanges || 0}
              </p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-700/30">
              <p className="text-lg font-semibold text-teal-400">
                {syncState.status === "synced"
                  ? "✓"
                  : syncState.status === "syncing"
                  ? "⟳"
                  : "○"}
              </p>
              <p className="text-xs text-slate-400">{syncState.status}</p>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePull}
              disabled={loading || syncState.status === "syncing"}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span className="text-xs">Pull</span>
            </button>
            <button
              onClick={handleSync}
              disabled={loading || syncState.status === "syncing"}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-50"
            >
              {loading || syncState.status === "syncing" ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              <span className="text-xs">Sync</span>
            </button>
            <button
              onClick={handlePush}
              disabled={loading || syncState.status === "syncing"}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span className="text-xs">Push</span>
            </button>
          </div>

          {/* Sync Info */}
          <p className="text-xs text-slate-500 text-center">
            Your data is saved locally first, then synced to the cloud when
            online.
          </p>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          loadStats();
          setMessage({ type: "success", text: "Signed in successfully!" });
        }}
      />
    </div>
  );
};

export default CloudSyncSettings;
