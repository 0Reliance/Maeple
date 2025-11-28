
import { StandardizedDailyMetric, ProviderType } from './services/wearables/types';

export enum View {
  JOURNAL = 'JOURNAL',
  DASHBOARD = 'DASHBOARD',
  LIVE_COACH = 'LIVE_COACH',
  SEARCH = 'SEARCH',
  VISION = 'VISION',
  SETTINGS = 'SETTINGS',
  GUIDE = 'GUIDE',
  TERMS = 'TERMS'
}

export interface UserSettings {
  cycleStartDate?: string; // YYYY-MM-DD
  avgCycleLength?: number; // Default 28
}

export interface Medication {
  name: string;
  dosage: string;
  unit: string;
}

export interface Symptom {
  name: string;
  severity: number; // 1-10
}

export interface SleepData {
  duration: number; // hours
  quality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
}

export interface NeuroMetrics {
  spoonLevel: number; // 1-10 (Energy Capacity)
  sensoryLoad: number; // 1-10 (Environmental intensity)
  contextSwitches: number; // Estimated count of role/task switches
  cycleDay?: number; // Menstrual/Hormonal cycle day
  maskingScore?: number; // 1-10 (Perceived effort to fit in)
}

export interface HealthEntry {
  id: string;
  timestamp: string; // ISO string
  rawText: string;
  mood: number; // 1-5
  moodLabel: string;
  medications: Medication[];
  symptoms: Symptom[];
  tags: string[]; // Generic tags
  strengths: string[]; // Character strengths (Curiosity, Zest, etc.)
  neuroMetrics: NeuroMetrics;
  sleep?: SleepData; 
  notes: string;
}

export interface WearableDataPoint {
  id: string;
  date: string; // YYYY-MM-DD
  provider: ProviderType;
  syncedAt: string; // ISO
  metrics: StandardizedDailyMetric;
  rawSourceData?: any; // For debugging
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

export interface ParsedResponse {
  moodScore: number;
  moodLabel: string;
  medications: { name: string; amount: string; unit: string }[];
  symptoms: { name: string; severity: number }[];
  neuroMetrics: {
    spoonLevel: number;
    sensoryLoad: number;
    contextSwitches: number;
    maskingScore: number;
  };
  strengths: string[];
  summary: string;
}