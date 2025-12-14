import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Calendar, Sparkles, Check, AlertCircle } from 'lucide-react';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
  showJournalReminder,
} from '../services/notificationService';

const NotificationSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setSettings(getNotificationSettings());
    setPermission(getNotificationPermission());
    setIsSupported(isNotificationSupported());
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    
    if (result === 'granted') {
      // Auto-enable notifications when permission granted
      const newSettings = { ...settings, enabled: true };
      setSettings(newSettings);
      saveNotificationSettings(newSettings);
    }
  };

  const handleToggleEnabled = () => {
    if (!settings.enabled && permission !== 'granted') {
      handleRequestPermission();
      return;
    }
    
    const newSettings = { ...settings, enabled: !settings.enabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    showSavedFeedback();
  };

  const handleTimeChange = (time: string) => {
    const newSettings = {
      ...settings,
      journalReminder: { ...settings.journalReminder, time },
    };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    showSavedFeedback();
  };

  const handleDayToggle = (day: number) => {
    const days = settings.journalReminder.days.includes(day)
      ? settings.journalReminder.days.filter(d => d !== day)
      : [...settings.journalReminder.days, day].sort();
    
    const newSettings = {
      ...settings,
      journalReminder: { ...settings.journalReminder, days },
    };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    showSavedFeedback();
  };

  const handleGentleNudgesToggle = () => {
    const newSettings = { ...settings, gentleNudges: !settings.gentleNudges };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    showSavedFeedback();
  };

  const handleTestNotification = async () => {
    const success = await showJournalReminder();
    setTestSent(success);
    setTimeout(() => setTestSent(false), 3000);
  };

  const showSavedFeedback = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isSupported) {
    return (
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle size={18} />
          <span className="text-sm">Notifications are not supported in this browser.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {permission === 'denied' && (
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-start gap-3">
            <BellOff size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Notifications Blocked</p>
              <p className="text-red-600 text-sm mt-1">
                You've blocked notifications. To enable them, click the lock icon in your browser's address bar and allow notifications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Bell size={22} className="text-indigo-500" />
          ) : (
            <BellOff size={22} className="text-slate-400" />
          )}
          <div>
            <p className="font-medium text-slate-800">Reminders</p>
            <p className="text-xs text-slate-500">Gentle check-in notifications</p>
          </div>
        </div>
        
        <button
          onClick={handleToggleEnabled}
          disabled={permission === 'denied'}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            settings.enabled ? 'bg-indigo-500' : 'bg-slate-300'
          } ${permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.enabled ? 'left-8' : 'left-1'
            }`}
          />
        </button>
      </div>

      {settings.enabled && permission === 'granted' && (
        <>
          {/* Journal Reminder Time */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Clock size={16} />
              Daily Reminder Time
            </label>
            <input
              type="time"
              value={settings.journalReminder.time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
            <p className="text-xs text-slate-500">
              We'll send a gentle reminder at this time
            </p>
          </div>

          {/* Days of Week */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Calendar size={16} />
              Reminder Days
            </label>
            <div className="flex gap-2">
              {dayNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => handleDayToggle(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    settings.journalReminder.days.includes(index)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {name.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          {/* Gentle Nudges */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-amber-500" />
              <div>
                <p className="font-medium text-slate-800">Gentle Nudges</p>
                <p className="text-xs text-slate-500">Low-pressure reminders after 3+ days of inactivity</p>
              </div>
            </div>
            
            <button
              onClick={handleGentleNudgesToggle}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.gentleNudges ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.gentleNudges ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Test Notification */}
          <div className="pt-2">
            <button
              onClick={handleTestNotification}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {testSent ? (
                <>
                  <Check size={18} className="text-green-500" />
                  Notification Sent!
                </>
              ) : (
                <>
                  <Bell size={18} />
                  Send Test Notification
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Saved Indicator */}
      {saved && (
        <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
          <Check size={16} />
          Settings saved
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPanel;
