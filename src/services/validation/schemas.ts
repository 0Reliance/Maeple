/**
 * Data Validation Schemas
 * 
 * Provides runtime validation for all data types using Zod
 * Ensures data integrity and prevents corrupt data from entering the system
 */

import { z } from 'zod';

// ============================================
// Health Entry Validation
// ============================================

/**
 * Medication Schema
 */
export const MedicationSchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().max(100),
  unit: z.string().max(50),
});

/**
 * Symptom Schema
 */
export const SymptomSchema = z.object({
  name: z.string().min(1).max(200),
  severity: z.number().min(1).max(10),
});

/**
 * Capacity Profile Schema
 */
export const CapacityProfileSchema = z.object({
  focus: z.number().min(1).max(10),
  social: z.number().min(1).max(10),
  structure: z.number().min(1).max(10),
  emotional: z.number().min(1).max(10),
  physical: z.number().min(1).max(10),
  sensory: z.number().min(1).max(10),
  executive: z.number().min(1).max(10),
});

/**
 * Neuro Metrics Schema
 */
export const NeuroMetricsSchema = z.object({
  spoonLevel: z.number().min(0).max(10),
  sensoryLoad: z.number().min(0).max(10),
  contextSwitches: z.number().min(0),
  cycleDay: z.number().min(1).max(28).optional(),
  maskingScore: z.number().min(1).max(10).optional(),
  capacity: CapacityProfileSchema,
});

/**
 * Observation Schema (for objective observations)
 */
export const ObservationSchema = z.object({
  category: z.enum(['lighting', 'noise', 'tension', 'fatigue', 'speech-pace', 'tone']),
  value: z.string().min(1).max(500),
  severity: z.enum(['low', 'moderate', 'high']),
  evidence: z.string().min(1).max(500),
});

/**
 * Objective Observation Schema
 */
export const ObjectiveObservationSchema = z.object({
  type: z.enum(['visual', 'audio', 'text']),
  source: z.enum(['bio-mirror', 'voice', 'text-input']),
  observations: z.array(ObservationSchema),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
});

/**
 * Strategy Recommendation Schema
 */
export const StrategyRecommendationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  action: z.string().min(1).max(500),
  type: z.enum(['REST', 'FOCUS', 'SOCIAL', 'SENSORY', 'EXECUTIVE']),
  icon: z.string().optional(),
  relevanceScore: z.number().min(0).max(1),
});

/**
 * Health Entry Schema
 * 
 * Validates all health entry data before saving
 */
export const HealthEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  rawText: z.string().min(1).max(10000),
  mood: z.number().min(1).max(5),
  moodLabel: z.string().min(1).max(100),
  medications: z.array(MedicationSchema),
  symptoms: z.array(SymptomSchema),
  tags: z.array(z.string().max(50)),
  activityTypes: z.array(z.string().max(50)),
  strengths: z.array(z.string().max(100)),
  neuroMetrics: NeuroMetricsSchema,
  notes: z.string().max(5000),
  aiStrategies: z.array(StrategyRecommendationSchema).optional(),
  aiReasoning: z.string().max(5000).optional(),
  updatedAt: z.string().datetime().optional(),
  objectiveObservations: z.array(ObjectiveObservationSchema).optional(),
});

// ============================================
// Facial Analysis Validation
// ============================================

/**
 * Facial Analysis Observation Schema
 */
export const FacialAnalysisObservationSchema = z.object({
  category: z.enum(['tension', 'fatigue', 'lighting', 'environmental']),
  value: z.string().min(1).max(500),
  evidence: z.string().min(1).max(500),
});

/**
 * Facial Analysis Schema
 */
export const FacialAnalysisSchema = z.object({
  confidence: z.number().min(0).max(1),
  observations: z.array(FacialAnalysisObservationSchema),
  lighting: z.string().min(1).max(100),
  lightingSeverity: z.enum(['low', 'moderate', 'high']),
  environmentalClues: z.array(z.string().max(200)),
  // Optional fields for backward compatibility
  maskingScore: z.number().min(1).max(10).optional(),
  jawTension: z.number().min(1).max(10).optional(),
  eyeFatigue: z.number().min(1).max(10).optional(),
  primaryEmotion: z.string().max(100).optional(),
  signs: z.array(z.object({
    description: z.string().max(500),
    confidence: z.number().min(0).max(1)
  })).optional(),
});

// ============================================
// State Check Validation
// ============================================

/**
 * Facial Baseline Schema
 */
export const FacialBaselineSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  neutralTension: z.number().min(1).max(10),
  neutralFatigue: z.number().min(1).max(10),
  neutralMasking: z.number().min(1).max(10),
});

/**
 * State Check Schema
 */
export const StateCheckSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  imageBase64: z.string().max(5000000).optional(), // ~3.3MB max image
  analysis: FacialAnalysisSchema,
  userNote: z.string().max(2000).optional(),
});

// ============================================
// Audio Analysis Validation
// ============================================

/**
 * Vocal Characteristics Schema
 */
export const VocalCharacteristicsSchema = z.object({
  pitchVariation: z.enum(['flat', 'normal', 'varied']),
  volume: z.enum(['low', 'normal', 'high']),
  clarity: z.enum(['mumbled', 'normal', 'clear']),
});

/**
 * Audio Analysis Result Schema
 */
export const AudioAnalysisResultSchema = z.object({
  observations: z.array(ObservationSchema),
  transcript: z.string().max(10000),
  confidence: z.number().min(0).max(1),
  duration: z.number().min(0),
});

// ============================================
// User Settings Validation
// ============================================

/**
 * User Settings Schema
 */
export const UserSettingsSchema = z.object({
  cycleStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  avgCycleLength: z.number().min(21).max(35).optional(),
  safetyContact: z.string().max(200).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// ============================================
// Export Types
// ============================================

export type Medication = z.infer<typeof MedicationSchema>;
export type Symptom = z.infer<typeof SymptomSchema>;
export type CapacityProfile = z.infer<typeof CapacityProfileSchema>;
export type NeuroMetrics = z.infer<typeof NeuroMetricsSchema>;
export type Observation = z.infer<typeof ObservationSchema>;
export type ObjectiveObservation = z.infer<typeof ObjectiveObservationSchema>;
export type StrategyRecommendation = z.infer<typeof StrategyRecommendationSchema>;
export type HealthEntry = z.infer<typeof HealthEntrySchema>;
export type FacialAnalysis = z.infer<typeof FacialAnalysisSchema>;
export type FacialBaseline = z.infer<typeof FacialBaselineSchema>;
export type StateCheck = z.infer<typeof StateCheckSchema>;
export type VocalCharacteristics = z.infer<typeof VocalCharacteristicsSchema>;
export type AudioAnalysisResult = z.infer<typeof AudioAnalysisResultSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;