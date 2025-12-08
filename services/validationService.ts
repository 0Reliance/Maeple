/**
 * MAEPLE Data Validation Service
 * 
 * Runtime validation for data loaded from localStorage and IndexedDB.
 * Prevents corrupted data from crashing the app and provides defaults.
 */

import { 
  HealthEntry, 
  CapacityProfile, 
  NeuroMetrics, 
  UserSettings,
  StateCheck,
  FacialAnalysis,
  WearableDataPoint,
  Medication,
  Symptom,
} from '../types';
import { StandardizedDailyMetric } from './wearables/types';

// ============================================
// VALIDATION HELPERS
// ============================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function validateMedication(value: unknown): Medication | null {
  if (!isObject(value)) return null;
  if (!isString(value.name) || !value.name) return null;
  return {
    name: value.name,
    dosage: isString(value.dosage) ? value.dosage : '',
    unit: isString(value.unit) ? value.unit : '',
  };
}

function validateMedications(arr: unknown[]): Medication[] {
  return arr.map(item => validateMedication(item)).filter((m): m is Medication => m !== null);
}

function validateSymptom(value: unknown): Symptom | null {
  if (!isObject(value)) return null;
  if (!isString(value.name) || !value.name) return null;
  return {
    name: value.name,
    severity: isNumber(value.severity) ? clamp(value.severity, 1, 10) : 5,
  };
}

function validateSymptoms(arr: unknown[]): Symptom[] {
  return arr.map(item => validateSymptom(item)).filter((s): s is Symptom => s !== null);
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_CAPACITY_PROFILE: CapacityProfile = {
  focus: 5,
  social: 5,
  structure: 5,
  emotional: 5,
  physical: 5,
  sensory: 5,
  executive: 5,
};

const DEFAULT_NEURO_METRICS: NeuroMetrics = {
  spoonLevel: 5,
  sensoryLoad: 5,
  contextSwitches: 0,
  maskingScore: 5,
  capacity: { ...DEFAULT_CAPACITY_PROFILE },
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  avgCycleLength: 28,
};

const DEFAULT_FACIAL_ANALYSIS: FacialAnalysis = {
  primaryEmotion: 'neutral',
  confidence: 0,
  eyeFatigue: 0,
  jawTension: 0,
  maskingScore: 0,
  signs: [],
};

// ============================================
// VALIDATORS
// ============================================

/**
 * Validate and sanitize a CapacityProfile
 */
export function validateCapacityProfile(data: unknown): CapacityProfile {
  if (!isObject(data)) {
    return { ...DEFAULT_CAPACITY_PROFILE };
  }

  return {
    focus: isNumber(data.focus) ? clamp(data.focus, 1, 10) : DEFAULT_CAPACITY_PROFILE.focus,
    social: isNumber(data.social) ? clamp(data.social, 1, 10) : DEFAULT_CAPACITY_PROFILE.social,
    structure: isNumber(data.structure) ? clamp(data.structure, 1, 10) : DEFAULT_CAPACITY_PROFILE.structure,
    emotional: isNumber(data.emotional) ? clamp(data.emotional, 1, 10) : DEFAULT_CAPACITY_PROFILE.emotional,
    physical: isNumber(data.physical) ? clamp(data.physical, 1, 10) : DEFAULT_CAPACITY_PROFILE.physical,
    sensory: isNumber(data.sensory) ? clamp(data.sensory, 1, 10) : DEFAULT_CAPACITY_PROFILE.sensory,
    executive: isNumber(data.executive) ? clamp(data.executive, 1, 10) : DEFAULT_CAPACITY_PROFILE.executive,
  };
}

/**
 * Validate and sanitize NeuroMetrics
 */
export function validateNeuroMetrics(data: unknown): NeuroMetrics {
  if (!isObject(data)) {
    return { ...DEFAULT_NEURO_METRICS };
  }

  return {
    spoonLevel: isNumber(data.spoonLevel) ? clamp(data.spoonLevel, 1, 10) : DEFAULT_NEURO_METRICS.spoonLevel,
    sensoryLoad: isNumber(data.sensoryLoad) ? clamp(data.sensoryLoad, 1, 10) : DEFAULT_NEURO_METRICS.sensoryLoad,
    contextSwitches: isNumber(data.contextSwitches) ? Math.max(0, data.contextSwitches) : 0,
    cycleDay: isNumber(data.cycleDay) ? clamp(data.cycleDay, 1, 45) : undefined,
    maskingScore: isNumber(data.maskingScore) ? clamp(data.maskingScore, 1, 10) : undefined,
    capacity: validateCapacityProfile(data.capacity),
  };
}

/**
 * Validate and sanitize a HealthEntry
 */
export function validateHealthEntry(data: unknown): HealthEntry | null {
  if (!isObject(data)) {
    return null;
  }

  // Required fields
  if (!isString(data.id) || !isString(data.timestamp)) {
    return null;
  }

  // Validate timestamp is a valid date
  const timestamp = new Date(data.timestamp);
  if (isNaN(timestamp.getTime())) {
    return null;
  }

  return {
    id: data.id,
    timestamp: data.timestamp,
    rawText: isString(data.rawText) ? data.rawText : '',
    mood: isNumber(data.mood) ? clamp(data.mood, 1, 10) : 5,
    moodLabel: isString(data.moodLabel) ? data.moodLabel : 'Unknown',
    medications: isArray(data.medications) ? validateMedications(data.medications) : [],
    symptoms: isArray(data.symptoms) ? validateSymptoms(data.symptoms) : [],
    tags: isArray(data.tags) ? data.tags.filter(isString) : [],
    activityTypes: isArray(data.activityTypes) ? data.activityTypes.filter(isString) : [],
    strengths: isArray(data.strengths) ? data.strengths.filter(isString) : [],
    neuroMetrics: validateNeuroMetrics(data.neuroMetrics),
    notes: isString(data.notes) ? data.notes : '',
    aiStrategies: isArray(data.aiStrategies) ? data.aiStrategies as HealthEntry['aiStrategies'] : undefined,
    aiReasoning: isString(data.aiReasoning) ? data.aiReasoning : undefined,
  };
}

/**
 * Validate an array of HealthEntries, filtering out invalid ones
 */
export function validateHealthEntries(data: unknown): HealthEntry[] {
  if (!isArray(data)) {
    return [];
  }

  return data
    .map(entry => validateHealthEntry(entry))
    .filter((entry): entry is HealthEntry => entry !== null);
}

/**
 * Validate UserSettings
 */
export function validateUserSettings(data: unknown): UserSettings {
  if (!isObject(data)) {
    return { ...DEFAULT_USER_SETTINGS };
  }

  return {
    avgCycleLength: isNumber(data.avgCycleLength) ? clamp(data.avgCycleLength, 20, 45) : DEFAULT_USER_SETTINGS.avgCycleLength,
    cycleStartDate: isString(data.cycleStartDate) ? data.cycleStartDate : undefined,
    safetyContact: isString(data.safetyContact) ? data.safetyContact : undefined,
  };
}

/**
 * Validate FacialAnalysis
 */
export function validateFacialAnalysis(data: unknown): FacialAnalysis {
  if (!isObject(data)) {
    return { ...DEFAULT_FACIAL_ANALYSIS };
  }

  return {
    primaryEmotion: isString(data.primaryEmotion) ? data.primaryEmotion : DEFAULT_FACIAL_ANALYSIS.primaryEmotion,
    confidence: isNumber(data.confidence) ? clamp(data.confidence, 0, 1) : DEFAULT_FACIAL_ANALYSIS.confidence,
    eyeFatigue: isNumber(data.eyeFatigue) ? clamp(data.eyeFatigue, 0, 1) : DEFAULT_FACIAL_ANALYSIS.eyeFatigue,
    jawTension: isNumber(data.jawTension) ? clamp(data.jawTension, 0, 1) : DEFAULT_FACIAL_ANALYSIS.jawTension,
    maskingScore: isNumber(data.maskingScore) ? clamp(data.maskingScore, 0, 1) : DEFAULT_FACIAL_ANALYSIS.maskingScore,
    signs: isArray(data.signs) ? data.signs.filter(isString) : [],
  };
}

/**
 * Validate StateCheck
 */
export function validateStateCheck(data: unknown): StateCheck | null {
  if (!isObject(data)) {
    return null;
  }

  if (!isString(data.id) || !isString(data.timestamp)) {
    return null;
  }

  return {
    id: data.id,
    timestamp: data.timestamp,
    imageBase64: isString(data.imageBase64) ? data.imageBase64 : undefined,
    analysis: validateFacialAnalysis(data.analysis),
    userNote: isString(data.userNote) ? data.userNote : undefined,
  };
}

/**
 * Validate WearableDataPoint
 */
export function validateWearableDataPoint(data: unknown): WearableDataPoint | null {
  if (!isObject(data)) {
    return null;
  }

  if (!isString(data.id) || !isString(data.date) || !isString(data.provider)) {
    return null;
  }

  const defaultMetrics: StandardizedDailyMetric = {
    date: data.date,
    source: data.provider as WearableDataPoint['provider'],
    sleep: undefined,
    biometrics: undefined,
    activity: undefined,
  };

  return {
    id: data.id,
    date: data.date,
    provider: data.provider as WearableDataPoint['provider'],
    syncedAt: isString(data.syncedAt) ? data.syncedAt : new Date().toISOString(),
    metrics: isObject(data.metrics) ? validateStandardizedMetrics(data.metrics, data.date, data.provider as WearableDataPoint['provider']) : defaultMetrics,
    rawSourceData: data.rawSourceData,
  };
}

/**
 * Validate StandardizedDailyMetric structure
 */
function validateStandardizedMetrics(metrics: Record<string, unknown>, date: string, source: WearableDataPoint['provider']): StandardizedDailyMetric {
  return {
    date: isString(metrics.date) ? metrics.date : date,
    source: isString(metrics.source) ? metrics.source as WearableDataPoint['provider'] : source,
    sleep: isObject(metrics.sleep) ? metrics.sleep as StandardizedDailyMetric['sleep'] : undefined,
    biometrics: isObject(metrics.biometrics) ? metrics.biometrics as StandardizedDailyMetric['biometrics'] : undefined,
    activity: isObject(metrics.activity) ? metrics.activity as StandardizedDailyMetric['activity'] : undefined,
  };
}

/**
 * Validate an array of WearableDataPoints
 */
export function validateWearableData(data: unknown): WearableDataPoint[] {
  if (!isArray(data)) {
    return [];
  }

  return data
    .map(point => validateWearableDataPoint(point))
    .filter((point): point is WearableDataPoint => point !== null);
}

// ============================================
// SAFE PARSE FUNCTIONS
// ============================================

/**
 * Safely parse JSON with validation
 */
export function safeParseJSON<T>(
  json: string | null,
  validator: (data: unknown) => T,
  defaultValue: T
): T {
  if (!json) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(json);
    return validator(parsed);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return defaultValue;
  }
}

/**
 * Safely parse entries from localStorage
 */
export function safeLoadEntries(key: string): HealthEntry[] {
  const json = localStorage.getItem(key);
  return safeParseJSON(json, validateHealthEntries, []);
}

/**
 * Safely parse settings from localStorage
 */
export function safeLoadSettings(key: string): UserSettings {
  const json = localStorage.getItem(key);
  return safeParseJSON(json, validateUserSettings, { ...DEFAULT_USER_SETTINGS });
}

// Export defaults for use elsewhere
export { 
  DEFAULT_CAPACITY_PROFILE, 
  DEFAULT_NEURO_METRICS, 
  DEFAULT_USER_SETTINGS,
  DEFAULT_FACIAL_ANALYSIS,
};
