import React, { useState, useEffect } from "react";
import { userFeedback } from "@services/userFeedbackService";
import { wearableManager } from "../services/wearables/manager";
import { ProviderType } from "../services/wearables/types";
import {
  Activity,
  Check,
  Loader2,
  RefreshCw,
  Smartphone,
  Calendar,
  Save,
  Camera,
  ScanFace,
  HeartHandshake,
  Phone,
  Bot,
  Download,
  Upload,
  Trash2,
  HardDrive,
  AlertTriangle,
  Bell,
  Cloud,
  LucideIcon,
  FileJson,
  Archive,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
} from "lucide-react";
import { WearableDataPoint, UserSettings } from "../types";
import { useAppStore } from "../stores";
import { usePWAInstall } from "../hooks/usePWAInstall";
import {
  exportAllData,
  downloadExport,
  clearAllData,
  importData,
  readFileAsText,
  ImportResult,
} from "../services/exportService";
import {
  getEntries,
  saveEntry,
  deleteEntry,
  getUserSettings,
  saveUserSettings,
} from "../services/storageService";
import BioCalibration from "./BioCalibration";
import AIProviderSettings from "./AIProviderSettings";
import AIProviderStats from "./AIProviderStats";
import NotificationSettingsPanel from "./NotificationSettings";
import CloudSyncSettings from "./CloudSyncSettings";

interface Props {
  onDataSynced: (data: WearableDataPoint[]) => void;
}

const Settings: React.FC<Props> = ({ onDataSynced }) => {
  const { userSettings, updateSettings } = useAppStore();
  const [configs, setConfigs] = useState(wearableManager.getAllConfigs());
  const [loading, setLoading] = useState<string | null>(null);

  // Biological Context State
  const [cycleStart, setCycleStart] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [safetyContact, setSafetyContact] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Calibration State
  const [showCalibration, setShowCalibration] = useState(false);

  // PWA Installation
  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getUserSettings();
      if (settings.cycleStartDate) setCycleStart(settings.cycleStartDate);
      if (settings.avgCycleLength) setCycleLength(settings.avgCycleLength);
      if (settings.safetyContact) setSafetyContact(settings.safetyContact);
    };
    loadSettings();
  }, [updateSettings]);

  const handleConnect = async (provider: ProviderType) => {
    setLoading(provider);
    try {
      await wearableManager.connectProvider(provider);
      // Immediately sync after connect
      const data = await wearableManager.syncRecentData(provider, 30); // Backfill 30 days
      onDataSynced(data);
      setConfigs(wearableManager.getAllConfigs());
    } catch (e) {
      console.error(e);
      userFeedback.processingFailed(`connect to ${provider}`, () => handleConnect(provider));
    } finally {
      setLoading(null);
    }
  };

  const handleSync = async (provider: ProviderType) => {
    setLoading(provider);
    try {
      const data = await wearableManager.syncRecentData(provider, 7); // Sync last week
      onDataSynced(data);
      setConfigs(wearableManager.getAllConfigs()); // Update timestamp
      userFeedback.success({
        title: 'Sync Complete',
        message: `${provider} synced successfully.`
      });
    } catch (e) {
      userFeedback.processingFailed(`sync ${provider}`, () => handleSync(provider));
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (provider: ProviderType) => {
    if (confirm("Are you sure? This will stop syncing new data.")) {
      await wearableManager.disconnectProvider(provider);
      setConfigs(wearableManager.getAllConfigs());
    }
  };

  const saveBioContext = async () => {
    await saveUserSettings({
      cycleStartDate: cycleStart,
      avgCycleLength: cycleLength,
      safetyContact: safetyContact,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const ProviderCard = ({
    id,
    name,
    icon: Icon,
  }: {
    id: ProviderType;
    name: string;
    icon: LucideIcon;
  }) => {
    const config = configs[id];
    const isConnected = !!config?.isConnected;
    const isLoading = loading === id;

    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isConnected
                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }`}
          >
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {name}
            </h3>
            {isConnected ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                <Check size={12} />
                <span>Connected</span>
                {config.lastSyncedAt && (
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    • Last sync:{" "}
                    {new Date(config.lastSyncedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Sync sleep & biometric data
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={() => handleSync(id)}
                disabled={isLoading}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title="Sync Now"
              >
                <RefreshCw
                  size={20}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={() => handleDisconnect(id)}
                className="px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => handleConnect(id)}
              disabled={isLoading}
              className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg shadow-slate-200 dark:shadow-slate-900/50 flex items-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  const DataManagementSection = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExportJSON = async () => {
      setIsExporting(true);
      try {
        await downloadExport(false);
        userFeedback.saveSuccess('JSON export');
      } catch (error) {
        console.error("Export failed:", error);
        userFeedback.exportFailed(error as Error, () => handleExportJSON());
      } finally {
        setIsExporting(false);
      }
    };

    const handleExportZIP = async () => {
      setIsExporting(true);
      try {
        await downloadExport(true);
        userFeedback.saveSuccess('ZIP backup');
      } catch (error) {
        console.error("Export failed:", error);
        userFeedback.exportFailed(error as Error, () => handleExportZIP());
      } finally {
        setIsExporting(false);
      }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportResult(null);

      try {
        const content = await readFileAsText(file);
        const result = await importData(content, {
          mergeEntries: true,
          overwriteSettings: false,
        });
        setImportResult(result);

        if (result.success) {
          // Give the user a moment to see the result, then reload
          setTimeout(() => {
            window.location.reload();
          }, 2500);
        }
      } catch (error) {
        console.error("Import failed:", error);
        setImportResult({
          success: false,
          imported: { entries: 0, stateChecks: 0, settings: false },
          errors: ["Failed to read file. Please try again."],
        });
      } finally {
        setIsImporting(false);
        // Reset file input
        event.target.value = "";
      }
    };

    const handleDeleteAll = async () => {
      setIsDeleting(true);
      try {
        await clearAllData();
        setShowDeleteConfirm(false);
        // Reload page to reset app state
        window.location.reload();
      } catch (error) {
        console.error("Delete failed:", error);
        userFeedback.processingFailed('delete data', () => handleDeleteAll());
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <HardDrive className="text-emerald-500" size={20} />
          Data Management
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your data belongs to you. Export your journal entries and state
            checks for backup or transfer to another device.
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your data belongs to you. Export your journal entries and state
            checks for backup or transfer to another device.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleExportJSON}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileJson size={18} />
              )}
              Export JSON (Text Only)
            </button>

            <button
              onClick={handleExportZIP}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Archive size={18} />
              )}
              Export Full Backup (ZIP)
            </button>

            <label
              className={`flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer sm:col-span-2 ${
                isImporting ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {isImporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              Import Backup (JSON)
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>

          {/* Import Result Feedback */}
          {importResult && (
            <div
              className={`p-4 rounded-xl ${
                importResult.success
                  ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              }`}
            >
              {importResult.success ? (
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Check size={18} />
                    Import successful!
                  </p>
                  <p className="text-sm mt-1">
                    Imported {importResult.imported.entries} journal{" "}
                    {importResult.imported.entries === 1 ? "entry" : "entries"}.
                    {importResult.imported.settings && " Settings restored."}
                  </p>
                  {importResult.errors.length > 0 && (
                    <p className="text-xs mt-2 text-amber-700">
                      {importResult.errors.join(" ")}
                    </p>
                  )}
                  <p className="text-xs mt-2">Reloading page...</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Import failed
                  </p>
                  <ul className="text-sm mt-1 list-disc list-inside">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-100">
                  Danger Zone
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Permanently delete all your data from this browser
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-medium transition-colors"
              >
                <Trash2 size={18} />
                Delete All
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fadeIn">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-bold">Delete All Data?</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  This will permanently delete all your journal entries, state
                  checks, settings, and calibration data. This action cannot be
                  undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    Yes, Delete Everything
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-white">Settings & Integrations</h2>
        <p className="text-sm md:text-base text-slate-300 mt-2">
          Customize your biological context and connect external devices to
          build a complete digital phenotype.
        </p>
      </div>

      {/* Appearance Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Monitor className="text-purple-500" size={20} />
          Appearance
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={async () => await updateSettings({ theme: "light" })}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                userSettings.theme === "light"
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                  : "border-slate-100 hover:border-slate-200 text-slate-600 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
            >
              <Sun size={24} />
              <span className="font-medium">Light</span>
            </button>
            <button
              onClick={async () => await updateSettings({ theme: "dark" })}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                userSettings.theme === "dark"
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                  : "border-slate-100 hover:border-slate-200 text-slate-600 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
            >
              <Moon size={24} />
              <span className="font-medium">Dark</span>
            </button>
            <button
              onClick={async () => await updateSettings({ theme: "system" })}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                userSettings.theme === "system"
                  ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                  : "border-slate-100 hover:border-slate-200 text-slate-600 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
            >
              <Monitor size={24} />
              <span className="font-medium">System</span>
            </button>
          </div>
        </div>
      </section>

      {/* PWA Installation */}
      {isInstallable && (
        <section className="space-y-4 animate-fadeIn">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Download className="text-emerald-500" size={20} />
            Install MAEPLE
          </h3>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Install MAEPLE as a native app on your device for quick access, offline functionality, and a faster experience.
            </p>
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50"
            >
              <Download size={20} />
              Install App
            </button>
          </div>
        </section>
      )}

      {/* AI Provider Configuration */}
      <section className="space-y-4">
        <AIProviderSettings />
        <AIProviderStats />
      </section>

      {/* Cloud Sync */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Cloud className="text-teal-500" size={20} />
          Cloud Sync
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <CloudSyncSettings />
        </div>
      </section>

      {/* Notification Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Bell className="text-indigo-500" size={20} />
          Reminders & Notifications
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <NotificationSettingsPanel />
        </div>
      </section>

      {/* Safety Plan Configuration */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <HeartHandshake className="text-rose-500" size={20} />
          Safety & Support Protocol
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If MAEPLE detects critical burnout or high dissociation (via
            Bio-Mirror), who should we suggest you call?
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
              Support Contact Number
            </label>
            <div className="flex gap-2">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                value={safetyContact}
                onChange={(e) => setSafetyContact(e.target.value)}
                placeholder="e.g. Partner, Therapist, or Best Friend"
                autoComplete="tel"
                className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveBioContext}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                settingsSaved
                  ? "bg-green-100 text-green-700"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100"
              }`}
            >
              {settingsSaved ? <Check size={18} /> : <Save size={18} />}
              {settingsSaved ? "Saved" : "Save Safety Plan"}
            </button>
          </div>
        </div>
      </section>

      {/* Bio-Mirror Calibration */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ScanFace className="text-indigo-500" size={20} />
          Bio-Mirror Calibration
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="max-w-md">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">
              Neutral Baseline
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Teach Mae what your "Resting Face" looks like. This improves
              accuracy by filtering out natural features (like heavy eyelids)
              from fatigue scores.
            </p>
          </div>
          <button
            onClick={() => setShowCalibration(true)}
            className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
          >
            Calibrate
          </button>
        </div>
      </section>

      {/* Data Management Section */}
      <DataManagementSection />

      {/* Biological Context Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="text-rose-500" size={20} />
          Biological Context
        </h3>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tracking your hormonal cycle allows HealthFlow to predict energy
            dips (Luteal Phase) and correlate them with neurodivergent symptoms.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Last Cycle Start Date
              </label>
              <input
                type="date"
                value={cycleStart}
                onChange={(e) => setCycleStart(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Average Length (Days)
              </label>
              <input
                type="number"
                value={cycleLength}
                onChange={(e) => setCycleLength(parseInt(e.target.value))}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveBioContext}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                settingsSaved
                  ? "bg-green-100 text-green-700"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100"
              }`}
            >
              {settingsSaved ? <Check size={18} /> : <Save size={18} />}
              {settingsSaved ? "Saved" : "Save Context"}
            </button>
          </div>
        </div>
      </section>

      {/* Wearables Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="text-teal-500" size={20} />
          Device Integrations
        </h3>
        <div className="space-y-4">
          <ProviderCard id="OURA" name="Oura Ring" icon={Activity} />
          <div className="opacity-50 pointer-events-none relative">
            <div className="absolute inset-0 bg-white/50 z-10 rounded-2xl"></div>
            <ProviderCard id="GOOGLE_FIT" name="Google Fit" icon={Smartphone} />
          </div>
        </div>
      </section>

      <div className="text-center text-xs text-slate-400 mt-8 pb-8">
        Phase 2 Beta • Data stored locally in browser
      </div>

      {/* Modal for Calibration */}
      {showCalibration && (
        <BioCalibration
          onComplete={() => setShowCalibration(false)}
          onCancel={() => setShowCalibration(false)}
        />
      )}
    </div>
  );
};

export default Settings;