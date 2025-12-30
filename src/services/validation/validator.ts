/**
 * Data Validator Service
 * 
 * Provides runtime validation for all data types
 * Ensures data integrity and prevents corrupt data from entering system
 */

import { z } from 'zod';
import {
  HealthEntrySchema,
  FacialAnalysisSchema,
  StateCheckSchema,
  FacialBaselineSchema,
  AudioAnalysisResultSchema,
  UserSettingsSchema,
  MedicationSchema,
  SymptomSchema,
  CapacityProfileSchema,
  NeuroMetricsSchema,
  ObservationSchema,
  ObjectiveObservationSchema,
  StrategyRecommendationSchema,
  FacialAnalysisObservationSchema,
  VocalCharacteristicsSchema,
} from './schemas';

// Import types from schemas for validation
import type {
  Medication,
  Symptom,
  CapacityProfile,
  NeuroMetrics,
  Observation,
  ObjectiveObservation,
  StrategyRecommendation,
  HealthEntry,
  FacialAnalysis,
  StateCheck,
  FacialBaseline,
  AudioAnalysisResult,
  UserSettings,
  VocalCharacteristics,
} from './schemas';

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Data Validator Class
 * 
 * Provides static methods for validating different data types
 */
export class DataValidator {
  /**
   * Validate health entry
   */
  static validateHealthEntry(data: unknown): HealthEntry {
    try {
      return HealthEntrySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('HealthEntry validation failed:', error.issues);
        throw new ValidationError(
          'Invalid health entry data',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Validate facial analysis
   */
  static validateFacialAnalysis(data: unknown): FacialAnalysis {
    try {
      return FacialAnalysisSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('FacialAnalysis validation failed:', error.issues);
        throw new ValidationError(
          'Invalid facial analysis data',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Validate state check
   */
  static validateStateCheck(data: unknown): StateCheck {
    try {
      return StateCheckSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('StateCheck validation failed:', error.issues);
        throw new ValidationError(
          'Invalid state check data',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Validate facial baseline
   */
  static validateFacialBaseline(data: unknown): FacialBaseline {
    try {
      return FacialBaselineSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('FacialBaseline validation failed:', error.issues);
        throw new ValidationError(
          'Invalid facial baseline data',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Validate audio analysis result
   */
  static validateAudioAnalysisResult(data: unknown): AudioAnalysisResult {
    try {
      return AudioAnalysisResultSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('AudioAnalysisResult validation failed:', error.issues);
        throw new ValidationError(
          'Invalid audio analysis result data',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Validate user settings
   */
  static validateUserSettings(data: unknown): UserSettings {
    try {
      return UserSettingsSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('UserSettings validation failed:', error.issues);
        throw new ValidationError(
          'Invalid user settings data',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Safely validate data without throwing
   * Returns { success: true, data: T } or { success: false, error: string }
   */
  static safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        error: 'Validation failed',
        issues: result.error.issues
      };
    }
  }

  /**
   * Format validation error for user display
   */
  static formatValidationError(error: ValidationError): string {
    const issue = error.issues[0];
    if (!issue) {
      return error.message;
    }

    const path = issue.path.length > 0 
      ? issue.path.join('.') 
      : 'Data';
    
    // Generic error formatting that works with all Zod versions
    if ('expected' in issue && 'received' in issue) {
      return `${path}: Expected ${(issue as any).expected}, received ${(issue as any).received}`;
    }
    
    if ('minimum' in issue) {
      return `${path}: Value too small (minimum: ${(issue as any).minimum})`;
    }
    
    if ('maximum' in issue) {
      return `${path}: Value too big (maximum: ${(issue as any).maximum})`;
    }
    
    if ('options' in issue) {
      return `${path}: Invalid value. Must be one of: ${(issue as any).options?.join(', ')}`;
    }
    
    // Fallback to the issue message
    return `${path}: ${issue.message}`;
  }
}

export default DataValidator;