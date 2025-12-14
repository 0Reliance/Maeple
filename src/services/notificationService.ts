/**
 * MAEPLE Notification Service
 * 
 * Provides gentle reminders for journaling and self-check-ins.
 * Respects user preferences and browser notification permissions.
 */

export interface NotificationSettings {
  enabled: boolean;
  journalReminder: {
    enabled: boolean;
    time: string; // HH:MM format
    days: number[]; // 0-6, Sunday-Saturday
  };
  stateCheckReminder: {
    enabled: boolean;
    frequency: 'twice_daily' | 'once_daily' | 'every_other_day';
  };
  gentleNudges: boolean; // Low-pressure encouragement
}

const NOTIFICATION_SETTINGS_KEY = 'maeple_notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = 'maeple_scheduled_notifications';

// Default settings - gentle by default
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  journalReminder: {
    enabled: true,
    time: '20:00', // 8 PM - evening reflection
    days: [0, 1, 2, 3, 4, 5, 6], // Every day
  },
  stateCheckReminder: {
    enabled: false,
    frequency: 'once_daily',
  },
  gentleNudges: true,
};

// Gentle, non-judgmental notification messages
const JOURNAL_MESSAGES = [
  { title: '🌸 Evening Check-in', body: 'How are you feeling? No pressure—just a moment to notice.' },
  { title: '📝 Pattern Moment', body: 'Mae is here if you want to jot down today\'s patterns.' },
  { title: '💭 Reflection Time', body: 'A few words about your day can reveal a lot over time.' },
  { title: '🌙 Winding Down', body: 'Before bed, would you like to capture how today felt?' },
  { title: '✨ Gentle Reminder', body: 'Your patterns are worth noticing. No judgment, just awareness.' },
];

const STATE_CHECK_MESSAGES = [
  { title: '🪞 Bio-Mirror Ready', body: 'Quick check-in with your reflection? It takes 30 seconds.' },
  { title: '👀 See Yourself', body: 'Sometimes we don\'t notice how we\'re carrying stress. Mae can help.' },
  { title: '🔍 Pattern Check', body: 'A quick Bio-Mirror scan can reveal what you might not feel yet.' },
];

const GENTLE_NUDGE_MESSAGES = [
  { title: '💚 Just Checking In', body: 'It\'s been a few days. No pressure—Mae is here when you\'re ready.' },
  { title: '🌱 Still Here', body: 'Patterns don\'t need daily tracking. Come back whenever feels right.' },
  { title: '🤗 No Streaks Here', body: 'MAEPLE doesn\'t do streaks. Your pace is the right pace.' },
];

/**
 * Check if browser supports notifications
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Get notification settings from storage
 */
export const getNotificationSettings = (): NotificationSettings => {
  const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

/**
 * Save notification settings
 */
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  
  // Reschedule notifications based on new settings
  if (settings.enabled) {
    scheduleNotifications(settings);
  } else {
    clearScheduledNotifications();
  }
};

/**
 * Show a notification immediately
 */
export const showNotification = async (
  title: string,
  body: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try to use service worker for better reliability
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: 'maeple-notification',
      requireInteraction: false,
      silent: false,
      ...options,
    });
    return true;
  } catch (e) {
    // Fallback to regular notification
    try {
      new Notification(title, { body, icon: '/icons/icon.svg', ...options });
      return true;
    } catch {
      console.error('Failed to show notification:', e);
      return false;
    }
  }
};

/**
 * Show a random journal reminder
 */
export const showJournalReminder = async (): Promise<boolean> => {
  const message = JOURNAL_MESSAGES[Math.floor(Math.random() * JOURNAL_MESSAGES.length)];
  return showNotification(message.title, message.body, {
    tag: 'maeple-journal-reminder',
    data: { action: 'open-journal' },
  });
};

/**
 * Show a random state check reminder
 */
export const showStateCheckReminder = async (): Promise<boolean> => {
  const message = STATE_CHECK_MESSAGES[Math.floor(Math.random() * STATE_CHECK_MESSAGES.length)];
  return showNotification(message.title, message.body, {
    tag: 'maeple-statecheck-reminder',
    data: { action: 'open-statecheck' },
  });
};

/**
 * Show a gentle nudge after inactivity
 */
export const showGentleNudge = async (): Promise<boolean> => {
  const settings = getNotificationSettings();
  if (!settings.gentleNudges) return false;
  
  const message = GENTLE_NUDGE_MESSAGES[Math.floor(Math.random() * GENTLE_NUDGE_MESSAGES.length)];
  return showNotification(message.title, message.body, {
    tag: 'maeple-gentle-nudge',
  });
};

/**
 * Schedule notifications based on settings
 * Note: For a production app, this would use the Push API with a backend.
 * For this local-first MVP, we use a combination of setTimeout and checking on app load.
 */
export const scheduleNotifications = (settings: NotificationSettings): void => {
  // Clear any existing scheduled notifications
  clearScheduledNotifications();
  
  if (!settings.enabled || Notification.permission !== 'granted') {
    return;
  }

  const scheduledIds: number[] = [];

  // Schedule journal reminder
  if (settings.journalReminder.enabled) {
    const timerId = scheduleDaily(
      settings.journalReminder.time,
      settings.journalReminder.days,
      () => showJournalReminder()
    );
    if (timerId) scheduledIds.push(timerId);
  }

  // Store scheduled notification IDs for cleanup
  localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduledIds));
};

/**
 * Clear all scheduled notifications
 */
export const clearScheduledNotifications = (): void => {
  const storedIds = localStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
  if (storedIds) {
    try {
      const ids = JSON.parse(storedIds) as number[];
      ids.forEach(id => clearTimeout(id));
    } catch {
      // Ignore parse errors
    }
  }
  localStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
};

/**
 * Schedule a daily notification at a specific time
 */
const scheduleDaily = (
  time: string,
  days: number[],
  callback: () => void
): number | null => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  
  scheduled.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  // Check if the scheduled day is in the allowed days
  while (!days.includes(scheduled.getDay())) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  const delay = scheduled.getTime() - now.getTime();
  
  // Only schedule if within 24 hours (will reschedule on next app load)
  if (delay > 24 * 60 * 60 * 1000) {
    return null;
  }
  
  return window.setTimeout(() => {
    callback();
    // Reschedule for next occurrence
    const settings = getNotificationSettings();
    if (settings.enabled) {
      scheduleNotifications(settings);
    }
  }, delay);
};

/**
 * Check if user has been inactive and maybe show a gentle nudge
 */
export const checkInactivityNudge = (): void => {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.gentleNudges) return;
  
  const lastEntryKey = 'maeple_last_entry_timestamp';
  const lastNudgeKey = 'maeple_last_nudge_timestamp';
  
  const lastEntry = localStorage.getItem(lastEntryKey);
  const lastNudge = localStorage.getItem(lastNudgeKey);
  
  if (!lastEntry) return;
  
  const daysSinceEntry = (Date.now() - parseInt(lastEntry)) / (1000 * 60 * 60 * 24);
  const daysSinceNudge = lastNudge 
    ? (Date.now() - parseInt(lastNudge)) / (1000 * 60 * 60 * 24)
    : Infinity;
  
  // Show nudge if inactive for 3+ days and haven't nudged in 2+ days
  if (daysSinceEntry >= 3 && daysSinceNudge >= 2) {
    showGentleNudge();
    localStorage.setItem(lastNudgeKey, Date.now().toString());
  }
};

/**
 * Initialize notification service on app load
 */
export const initNotificationService = (): void => {
  const settings = getNotificationSettings();
  
  if (settings.enabled && Notification.permission === 'granted') {
    scheduleNotifications(settings);
    checkInactivityNudge();
  }
};
