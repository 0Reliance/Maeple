
import { HealthEntry, UserSettings } from "../types";

const STORAGE_KEY = "pozimind_entries";
const SETTINGS_KEY = "pozimind_user_settings";

export const getEntries = (): HealthEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveEntry = (entry: HealthEntry) => {
  const entries = getEntries();
  const updated = [entry, ...entries];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteEntry = (id: string) => {
  const entries = getEntries();
  const updated = entries.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const getUserSettings = (): UserSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { avgCycleLength: 28 };
};

export const saveUserSettings = (settings: UserSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return settings;
};