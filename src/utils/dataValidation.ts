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
 * Handles nested response structures from AI router
 * 
 * @example
 * const result = validateFacialAnalysis(aiResponse);
 * // result.observations is always an array
 * // result.environmentalClues is always an array
 * // result.actionUnits is always an array
 */
export function validateFacialAnalysis(data: unknown): FacialAnalysis {
  const rawData = data as any;
  let result = rawData;

  // Handle nested response structures from AI router
  // The AI might wrap data in different ways:
  // - { facs_analysis: { ... } }
  // - { face_analysis: { ... } }  - NEW from Gemini
  // - { analysis: { ... } }
  // - { actionUnits: [...], confidence: ... }
  // - { analysis: { facs_analysis: { ... } }
  
  if (rawData?.face_analysis && typeof rawData.face_analysis === 'object') {
    console.log('[validateFacialAnalysis] Found face_analysis wrapper, transforming structure');
    const faceAnalysis = rawData.face_analysis;
    
    // Transform aus_detected object into actionUnits array
    // Structure: aus_detected: {AU1: "Absent", AU4: "Absent", AU6: "B", ...}
    // Need to transform: actionUnits: [{auCode: "AU1", name: "...", intensity: "..."}, ...]
    const ausDetected = faceAnalysis.aus_detected || {};
    const actionUnits = Object.entries(ausDetected)
      .filter(([_, status]) => status !== 'Absent' && status !== 'absent')
      .map(([auCode, status]) => ({
        auCode,
        name: getAUName(auCode),
        intensity: getIntensityFromStatus(status as string),
        intensityNumeric: getIntensityNumeric(status as string),
        confidence: status === 'E' || status === 'D' ? 0.9 : status === 'C' ? 0.75 : 0.5,
      }));
    
    // Transform environmental_elements string array
    const environmentalElements = Array.isArray(faceAnalysis.additional_observations?.environmental_elements)
      ? faceAnalysis.additional_observations.environmental_elements
      : [];
    
    // Transform interpretation object
    const interpretation = faceAnalysis.interpretation || {};
    const facsInterpretation = {
      duchennSmile: interpretation.Duchenne_Smile?.toLowerCase().includes('present') || false,
      socialSmile: interpretation.Social_Posed_Smile?.toLowerCase().includes('present') || false,
      maskingIndicators: interpretation.Masking_Indicators ? [interpretation.Masking_Indicators] : [],
      fatigueIndicators: interpretation.Fatigue_Cluster ? [interpretation.Fatigue_Cluster] : [],
      tensionIndicators: interpretation.Tension_Cluster ? [interpretation.Tension_Cluster] : [],
    };
    
    // Extract numeric scores
    const jawTension = parseFloat(String(faceAnalysis.jawTension || 0));
    const eyeFatigue = parseFloat(String(faceAnalysis.eyeFatigue || 0));
    
    // Get lighting conditions
    const lighting = typeof faceAnalysis.lighting_conditions === 'string' 
      ? extractLightingType(faceAnalysis.lighting_conditions)
      : 'unknown';
    
    return {
      confidence: 0.8, // Default confidence for transformed data
      actionUnits,
      observations: [],
      lighting,
      lightingSeverity: 'moderate',
      environmentalClues: environmentalElements,
      jawTension,
      eyeFatigue,
      facsInterpretation,
    };
  }
  
  if (rawData?.facs_analysis && typeof rawData.facs_analysis === 'object') {
    console.log('[validateFacialAnalysis] Unwrapping facs_analysis wrapper');
    result = rawData.facs_analysis;
  } else if (rawData?.analysis && typeof rawData.analysis === 'object') {
    console.log('[validateFacialAnalysis] Unwrapping analysis wrapper');
    result = rawData.analysis;
    
    // Handle double-nested: analysis.facs_analysis
    if (result.facs_analysis && typeof result.facs_analysis === 'object') {
      console.log('[validateFacialAnalysis] Unwrapping double-nested facs_analysis');
      result = result.facs_analysis;
    }
  }

  // Extract and validate each field with safe defaults
  const partial = result as Partial<FacialAnalysis>;
  
  return {
    confidence: partial.confidence ?? 0,
    actionUnits: Array.isArray(partial.actionUnits) ? partial.actionUnits : [],
    observations: Array.isArray(partial.observations) ? partial.observations : [],
    lighting: partial.lighting ?? 'unknown',
    lightingSeverity: partial.lightingSeverity ?? 'moderate',
    environmentalClues: Array.isArray(partial.environmentalClues) 
      ? partial.environmentalClues 
      : [],
    // Include other optional fields with defaults
    jawTension: partial.jawTension,
    eyeFatigue: partial.eyeFatigue,
    primaryEmotion: partial.primaryEmotion,
    signs: Array.isArray(partial.signs) ? partial.signs : [],
    facsInterpretation: partial.facsInterpretation,
  };
}

/**
 * Helper: Get AU name from code
 */
function getAUName(auCode: string): string {
  const names: Record<string, string> = {
    'AU1': 'Inner Brow Raiser',
    'AU4': 'Brow Lowerer',
    'AU6': 'Cheek Raiser',
    'AU7': 'Lid Tightener',
    'AU12': 'Lip Corner Puller',
    'AU14': 'Dimpler',
    'AU15': 'Lip Corner Depressor',
    'AU17': 'Chin Raiser',
    'AU24': 'Lip Pressor',
    'AU43': 'Eyes Closed',
  };
  return names[auCode] || auCode;
}

/**
 * Helper: Get intensity from status string
 * Handles: "A", "B", "C", "D", "E", "Absent", "Absent (AU6 B + ...)"
 */
function getIntensityFromStatus(status: string): 'A' | 'B' | 'C' | 'D' | 'E' {
  // Extract intensity code if it's present in the string
  const match = status.match(/\b([A-E])\b/);
  if (match) {
    return match[1] as 'A' | 'B' | 'C' | 'D' | 'E';
  }
  // Default to B for detected but not specified
  return 'B';
}

/**
 * Helper: Get numeric intensity
 */
function getIntensityNumeric(status: string): number {
  const intensity = getIntensityFromStatus(status);
  const numericMap: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
  return numericMap[intensity] || 2;
}

/**
 * Helper: Extract lighting type from description
 */
function extractLightingType(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('bright') || desc.includes('well-lit')) return 'bright';
  if (desc.includes('low light') || desc.includes('dim')) return 'low light';
  if (desc.includes('fluorescent')) return 'bright fluorescent';
  if (desc.includes('natural')) return 'soft natural';
  return 'unknown';
}

/**
 * Validate and sanitize GentleInquiry
 * Ensures basedOn array exists and required fields are present
 * Returns null if critical fields are missing or if basedOn is empty
 * 
 * @example
 * const inquiry = validateGentleInquiry(aiResponse);
 * // inquiry is either valid GentleInquiry or null
 * // if valid, inquiry.basedOn is always a non-empty array
 */
export function validateGentleInquiry(data: unknown): GentleInquiryType | null {
  const result = data as Partial<GentleInquiryType>;
  
  // If missing critical fields, return null
  if (!result.id || !result.question) {
    return null;
  }
  
  // If basedOn is empty, return null (no observations to base question on)
  const basedOn = Array.isArray(result.basedOn) ? result.basedOn : [];
  if (basedOn.length === 0) {
    return null;
  }
  
  return {
    id: result.id,
    basedOn,
    question: result.question ?? '',
    tone: result.tone ?? 'curious',
    skipAllowed: result.skipAllowed ?? true,
    priority: result.priority ?? 'medium',
  };
}

/**
 * Validate gentle inquiry has required observations
 * Type guard that returns true if inquiry should be shown to user
 * Provides comprehensive validation for all inquiry fields
 * 
 * @example
 * if (isValidGentleInquiry(parsed.gentleInquiry)) {
 *   setGentleInquiry(parsed.gentleInquiry);
 *   setShowInquiry(true);
 * } else {
 *   await onEntryAdded(newEntry);
 * }
 * 
 * @returns true if inquiry is valid and should be shown to user
 */
export function isValidGentleInquiry(
  inquiry: GentleInquiryType | null | undefined
): inquiry is GentleInquiryType {
  if (!inquiry) return false;
  
  // Must have basedOn array with content
  if (!inquiry.basedOn || !Array.isArray(inquiry.basedOn)) {
    return false;
  }
  
  // Must have at least 1 observation
  if (inquiry.basedOn.length === 0) {
    return false;
  }
  
  // All observations must be non-empty strings
  const hasValidObservations = inquiry.basedOn.some(obs => 
    typeof obs === 'string' && obs.trim().length > 0
  );
  
  if (!hasValidObservations) {
    return false;
  }
  
  // Must have a question
  if (!inquiry.question || typeof inquiry.question !== 'string' || inquiry.question.trim().length === 0) {
    return false;
  }
  
  // Must have an ID
  if (!inquiry.id || typeof inquiry.id !== 'string' || inquiry.id.trim().length === 0) {
    return false;
  }
  
  // Must have valid tone
  if (!inquiry.tone || !['curious', 'supportive', 'informational'].includes(inquiry.tone)) {
    return false;
  }
  
  // Must have valid priority
  if (!inquiry.priority || !['low', 'medium', 'high'].includes(inquiry.priority)) {
    return false;
  }
  
  return true;
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