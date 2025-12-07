
import { StandardizedDailyMetric, ProviderType } from './services/wearables/types';

export enum View {
  JOURNAL = 'JOURNAL',
  DASHBOARD = 'DASHBOARD',
  LIVE_COACH = 'LIVE_COACH',
  SEARCH = 'SEARCH',
  VISION = 'VISION',
  BIO_MIRROR = 'BIO_MIRROR',
  SETTINGS = 'SETTINGS',
  GUIDE = 'GUIDE',
  TERMS = 'TERMS',
  ROADMAP = 'ROADMAP',
  CLINICAL = 'CLINICAL'
}

export interface UserSettings {
  cycleStartDate?: string; // YYYY-MM-DD
  avgCycleLength?: number; // Default 28
  safetyContact?: string; // Phone number or Name for crisis support
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

export interface CapacityProfile {
  focus: number;      // Deep work / Hyperfocus
  social: number;     // Interaction bandwidth
  structure: number;  // Meetings / Admin tolerance
  emotional: number;  // Caregiving / Processing
  physical: number;   // Movement energy
  sensory: number;    // Noise / Light tolerance
  executive: number;  // Decision making
  [key: string]: number; // Index signature for dynamic access
}

export interface NeuroMetrics {
  spoonLevel: number; // Legacy aggregate (calculated average of profile)
  sensoryLoad: number; // 1-10 (Environmental intensity)
  contextSwitches: number; // Estimated count of role/task switches
  cycleDay?: number; // Menstrual/Hormonal cycle day
  maskingScore?: number; // 1-10 (Perceived effort to fit in)
  capacity: CapacityProfile; // Phase 1: Multi-dimensional capacity
}

export interface StrategyRecommendation {
  id: string;
  title: string;
  action: string;
  type: 'REST' | 'FOCUS' | 'SOCIAL' | 'SENSORY' | 'EXECUTIVE';
  icon?: string;
  relevanceScore: number;
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
  activityTypes: string[]; // Phase 1: #DeepWork, #Meeting, #Social, etc.
  strengths: string[]; // Character strengths (Curiosity, Zest, etc.)
  neuroMetrics: NeuroMetrics;
  sleep?: SleepData; 
  notes: string;
  aiStrategies?: StrategyRecommendation[]; // Phase 3 AI Generated Strategies
  aiReasoning?: string; // Why the AI flagged what it did
}

export interface WearableDataPoint {
  id: string;
  date: string; // YYYY-MM-DD
  provider: ProviderType;
  syncedAt: string; // ISO
  metrics: StandardizedDailyMetric;
  rawSourceData?: unknown; // For debugging
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
    sensoryLoad: number;
    contextSwitches: number;
    maskingScore: number;
  };
  activityTypes: string[];
  strengths: string[];
  summary: string;
  strategies: StrategyRecommendation[]; // New: AI generated strategies
  analysisReasoning: string; // New: Explanation of the analysis
}

export interface BurnoutForecast {
  riskLevel: 'SUSTAINABLE' | 'MODERATE' | 'CRITICAL';
  score: number; // 0-100, where >80 is critical
  daysUntilCrash: number | null; // Prediction
  recoveryDaysNeeded: number;
  accumulatedDeficit: number; // Raw load score
  trend: 'RISING' | 'FALLING' | 'STABLE';
  description: string;
}

export interface CyclePhaseContext {
  phase: 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';
  day: number;
  length: number;
  cognitiveImpact: string; // e.g. "High Focus", "Brain Fog Risk"
  energyPrediction: string;
  advice: string;
}

// State Check / Bio-Mirror Types
export interface FacialAnalysis {
  primaryEmotion: string;
  confidence: number;
  eyeFatigue: number; // 0-1
  jawTension: number; // 0-1
  maskingScore: number; // 0-1 (calculated from asymmetry/tension)
  signs: string[]; // e.g. ["droopy eyelids", "tight lips"]
}

// New: Baseline Calibration for Bio-Mirror
export interface FacialBaseline {
  id: string;
  timestamp: string;
  neutralTension: number; // Resting jaw tension
  neutralFatigue: number; // Resting eye openness
  neutralMasking: number; // Resting asymmetry
}

export interface StateCheck {
  id: string;
  timestamp: string;
  imageBase64?: string; // Optional (if saved)
  analysis: FacialAnalysis;
  userNote?: string;
}
