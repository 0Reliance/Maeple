/**
 * Runtime Data Validation
 * 
 * Provides validation and sanitization functions for AI service responses
 * and other external data sources. Ensures arrays exist and have proper defaults.
 */

import type { 
  FacialAnalysis, 
  GentleInquiry as GentleInquiryType,
  HealthEntry,
  Observation
} from '../types';

// Define AudioAnalysisResult inline since it's not exported from types.ts
interface AudioAnalysisResult {
  observations?: Observation[];
  confidence?: number;
  duration?: number;
  transcript?: string;
}

/**
 * Validate and sanitize AudioAnalysisResult
 * Ensures observations array exists and is properly typed
 * 
 * @example
 * const result = validateAudioAnalysis(aiResponse);
 * // result.observations is always an array, even if aiResponse had undefined
 */
export function validateAudioAnalysis(data: unknown): AudioAnalysisResult {
  const result = data as Partial<AudioAnalysisResult>;
  
  return {
    duration: result.duration ?? 0,
    confidence: result.confidence ?? 0,
    transcript: result.transcript ?? '',
    observations: Array.isArray(result.observations) ? result.observations : [],
  };
}

/**
 * Validate and sanitize FacialAnalysis
 * Ensures observations, environmentalClues, and actionUnits arrays exist
 * 
 * @example
 * const result = validateFacialAnalysis(aiResponse);
 * // result.observations is always an array
 * // result.environmentalClues is always an array
 * // result.actionUnits is always an array
 */
export function validateFacialAnalysis(data: unknown): FacialAnalysis {
  const result = data as Partial<FacialAnalysis>;
  
  return {
    confidence: result.confidence ?? 0,
    actionUnits: Array.isArray(result.actionUnits) ? result.actionUnits : [],
    observations: Array.isArray(result.observations) ? result.observations : [],
    lighting: result.lighting ?? 'unknown',
    lightingSeverity: result.lightingSeverity ?? 'moderate',
    environmentalClues: Array.isArray(result.environmentalClues) 
      ? result.environmentalClues 
      : [],
    // Include other optional fields with defaults
    jawTension: result.jawTension,
    eyeFatigue: result.eyeFatigue,
    primaryEmotion: result.primaryEmotion,
    signs: Array.isArray(result.signs) ? result.signs : [],
    facsInterpretation: result.facsInterpretation,
  };
}

/**
 * Validate and sanitize GentleInquiry
 * Ensures basedOn array exists and required fields are present
 * Returns null if critical fields are missing
 * 
 * @example
 * const inquiry = validateGentleInquiry(aiResponse);
 * // inquiry is either valid GentleInquiry or null
 * // if valid, inquiry.basedOn is always an array
 */
export function validateGentleInquiry(data: unknown): GentleInquiryType | null {
  const result = data as Partial<GentleInquiryType>;
  
  // If missing critical fields, return null
  if (!result.id || !result.question) {
    return null;
  }
  
  return {
    id: result.id,
    basedOn: Array.isArray(result.basedOn) ? result.basedOn : [],
    question: result.question ?? '',
    tone: result.tone ?? 'curious',
    skipAllowed: result.skipAllowed ?? true,
    priority: result.priority ?? 'medium',
  };
}

/**
 * Validate and sanitize HealthEntry
 * Ensures medications, symptoms, and other array fields exist
 * 
 * @example
 * const entry = validateHealthEntry(rawEntry);
 * // entry.medications is always an array
 * // entry.symptoms is always an array
 * // entry.activityTypes is always an array
 */
export function validateHealthEntry(entry: HealthEntry): HealthEntry {
  return {
    ...entry,
    medications: Array.isArray(entry.medications) ? entry.medications : [],
    symptoms: Array.isArray(entry.symptoms) ? entry.symptoms : [],
    activityTypes: Array.isArray(entry.activityTypes) ? entry.activityTypes : [],
    strengths: Array.isArray(entry.strengths) ? entry.strengths : [],
    tags: Array.isArray(entry.tags) ? entry.tags : [],
  };
}

/**
 * Validate and sanitize ObjectiveObservation[]
 * Ensures the observations array exists and each observation has required fields
 * 
 * @example
 * const observations = validateObjectiveObservations(aiData);
 * // Always returns an array, empty if invalid
 */
export function validateObjectiveObservations(
  data: unknown
): Array<{ category: string; value: string; severity: string; evidence?: string }> {
  if (!Array.isArray(data)) return [];
  
  return data.filter(obs => {
    return (
      obs &&
      typeof obs === 'object' &&
      'category' in obs &&
      'value' in obs &&
      'severity' in obs
    );
  }) as Array<{ category: string; value: string; severity: string; evidence?: string }>;
}

/**
 * Validate that a value is an array of objects with a specific required field
 * Generic utility for type-safe array validation
 * 
 * @example
 * const tags = validateObjectArray(data, 'name');
 * // Returns array of objects that have a 'name' property
 */
export function validateObjectArray<T extends Record<string, unknown>>(
  data: unknown,
  requiredField: keyof T
): T[] {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => {
    return (
      item &&
      typeof item === 'object' &&
      requiredField in item
    );
  }) as T[];
}