
import React, { useState, useEffect } from 'react';
import { wearableManager } from '../services/wearables/manager';
import { ProviderType } from '../services/wearables/types';
import { Activity, Check, Loader2, RefreshCw, Smartphone, Calendar, Save, Camera, ScanFace, HeartHandshake, Phone, Bot } from 'lucide-react';
import { WearableDataPoint, UserSettings } from '../types';
import { getUserSettings, saveUserSettings } from '../services/storageService';
import BioCalibration from './BioCalibration';
import AIProviderSettings from './AIProviderSettings';

interface Props {
  onDataSynced: (data: WearableDataPoint[]) => void;
}

const Settings: React.FC<Props> = ({ onDataSynced }) => {
  const [configs, setConfigs] = useState(wearableManager.getAllConfigs());
  const [loading, setLoading] = useState<string | null>(null);
  
  // Biological Context State
  const [cycleStart, setCycleStart] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [safetyContact, setSafetyContact] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Calibration State
  const [showCalibration, setShowCalibration] = useState(false);

  useEffect(() => {
    const settings = getUserSettings();
    if (settings.cycleStartDate) setCycleStart(settings.cycleStartDate);
    if (settings.avgCycleLength) setCycleLength(settings.avgCycleLength);
    if (settings.safetyContact) setSafetyContact(settings.safetyContact);
  }, []);

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
      alert("Failed to connect " + provider);
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
      alert("Sync complete!");
    } catch (e) {
      alert("Sync failed");
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

  const saveBioContext = () => {
    saveUserSettings({
        cycleStartDate: cycleStart,
        avgCycleLength: cycleLength,
        safetyContact: safetyContact
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const ProviderCard = ({ id, name, icon: Icon }: { id: ProviderType, name: string, icon: React.ComponentType }) => {
    const config = configs[id];
    const isConnected = !!config?.isConnected;
    const isLoading = loading === id;

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-400'}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{name}</h3>
            {isConnected ? (
               <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium mt-1">
                 <Check size={12} />
                 <span>Connected</span>
                 {config.lastSyncedAt && (
                    <span className="text-slate-400 font-normal">
                        • Last sync: {new Date(config.lastSyncedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                 )}
               </div>
            ) : (
               <p className="text-xs text-slate-400 mt-1">Sync sleep & biometric data</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
            {isConnected ? (
                <>
                    <button 
                        onClick={() => handleSync(id)}
                        disabled={isLoading}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Sync Now"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={() => handleDisconnect(id)}
                        className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                        Disconnect
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => handleConnect(id)}
                    disabled={isLoading}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                    {isLoading && <Loader2 size={16} className="animate-spin" />}
                    Connect
                </button>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Settings & Integrations</h2>
        <p className="text-slate-300">
            Customize your biological context and connect external devices to build a complete digital phenotype.
        </p>
      </div>

      {/* AI Provider Configuration */}
      <section className="space-y-4">
        <AIProviderSettings />
      </section>

      {/* Safety Plan Configuration */}
      <section className="space-y-4">
         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <HeartHandshake className="text-rose-500" size={20} />
            Safety & Support Protocol
        </h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-sm text-slate-500">
                If MAEPLE detects critical burnout or high dissociation (via Bio-Mirror), who should we suggest you call?
            </p>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Contact Number</label>
                <div className="flex gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                        <Phone size={20} />
                    </div>
                    <input 
                        type="tel" 
                        value={safetyContact}
                        onChange={(e) => setSafetyContact(e.target.value)}
                        placeholder="e.g. Partner, Therapist, or Best Friend"
                        className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                    />
                </div>
            </div>
             <div className="flex justify-end">
                <button 
                    onClick={saveBioContext}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                        settingsSaved 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    }`}
                >
                    {settingsSaved ? <Check size={18} /> : <Save size={18} />}
                    {settingsSaved ? 'Saved' : 'Save Safety Plan'}
                </button>
            </div>
        </div>
      </section>

      {/* Bio-Mirror Calibration */}
      <section className="space-y-4">
         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ScanFace className="text-indigo-500" size={20} />
            Bio-Mirror Calibration
        </h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="max-w-md">
                <h4 className="font-bold text-slate-800">Neutral Baseline</h4>
                <p className="text-sm text-slate-500 mt-1">
                    Teach Mae what your "Resting Face" looks like. This improves accuracy by filtering out natural features (like heavy eyelids) from fatigue scores.
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

      {/* Biological Context Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-rose-500" size={20} />
            Biological Context
        </h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <p className="text-sm text-slate-500">
                Tracking your hormonal cycle allows HealthFlow to predict energy dips (Luteal Phase) and correlate them with neurodivergent symptoms.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Last Cycle Start Date</label>
                    <input 
                        type="date" 
                        value={cycleStart}
                        onChange={(e) => setCycleStart(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Average Length (Days)</label>
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
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    }`}
                >
                    {settingsSaved ? <Check size={18} /> : <Save size={18} />}
                    {settingsSaved ? 'Saved' : 'Save Context'}
                </button>
            </div>
        </div>
      </section>

      {/* Wearables Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
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
