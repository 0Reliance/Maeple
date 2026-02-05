/**
 * Tests for dataValidation utility functions
 * These tests ensure that AI responses are properly validated and sanitized
 */

import { describe, it, expect } from 'vitest';
import {
  validateAudioAnalysis,
  validateFacialAnalysis,
  validateGentleInquiry,
  validateHealthEntry,
  validateObjectiveObservations,
  validateObjectArray
} from '../../src/utils/dataValidation';
import { AudioAnalysisResult, FacialAnalysis, GentleInquiry as GentleInquiryType } from '../../src/types';

describe('dataValidation', () => {
  describe('validateAudioAnalysis', () => {
    it('should validate valid audio analysis', () => {
      const valid: AudioAnalysisResult = {
        observations: [
          { category: 'noise', value: 'high', severity: 'high', evidence: 'background noise' }
        ],
        confidence: 0.95
      };
      
      const result = validateAudioAnalysis(valid);
      expect(result).not.toBeNull();
      expect(result?.observations).toHaveLength(1);
      expect(result?.confidence).toBe(0.95);
    });

    it('should handle undefined observations', () => {
      const invalid: any = { confidence: 0.95 };
      
      const result = validateAudioAnalysis(invalid);
      expect(result).not.toBeNull();
      expect(result?.observations).toEqual([]);
    });

    it('should handle null observations', () => {
      const invalid: any = { observations: null, confidence: 0.95 };
      
      const result = validateAudioAnalysis(invalid);
      expect(result).not.toBeNull();
      expect(result?.observations).toEqual([]);
    });

    it('should handle non-array observations', () => {
      const invalid: any = { observations: 'invalid', confidence: 0.95 };
      
      const result = validateAudioAnalysis(invalid);
      expect(result).not.toBeNull();
      expect(result?.observations).toEqual([]);
    });

    it('should sanitize malformed observation objects', () => {
      const malformed: any = {
        observations: [
          { category: 'noise' },
          null,
          { category: 'tone', value: 'high' }
        ],
        confidence: 0.95
      };
      
      const result = validateAudioAnalysis(malformed);
      expect(result).not.toBeNull();
      expect(result?.observations).toHaveLength(3);
    });
  });

  describe('validateFacialAnalysis', () => {
    it('should validate valid facial analysis', () => {
      const valid: FacialAnalysis = {
        lighting: 'natural',
        lightingSeverity: 'low',
        observations: [],
        environmentalClues: [],
        confidence: 0.9,
        primaryEmotion: 'neutral',
        jawTension: 0.2,
        eyeFatigue: 0.3,
        signs: [],
        actionUnits: [],
        facsInterpretation: {
          duchennSmile: false,
          socialSmile: false,
          maskingIndicators: [],
          fatigueIndicators: [],
          tensionIndicators: []
        }
      };
      
      const result = validateFacialAnalysis(valid);
      expect(result).not.toBeNull();
      expect(result?.lighting).toBe('natural');
      expect(result?.observations).toEqual([]);
    });

    it('should handle missing observations', () => {
      const invalid: any = {
        lighting: 'fluorescent',
        lightingSeverity: 'high',
        confidence: 0.85
      };
      
      const result = validateFacialAnalysis(invalid);
      expect(result).not.toBeNull();
      expect(result?.observations).toEqual([]);
      expect(result?.environmentalClues).toEqual([]);
    });

    it('should handle null arrays', () => {
      const invalid: any = {
        lighting: 'low',
        lightingSeverity: 'moderate',
        observations: null,
        environmentalClues: null,
        confidence: 0.8
      };
      
      const result = validateFacialAnalysis(invalid);
      expect(result).not.toBeNull();
      expect(result?.observations).toEqual([]);
      expect(result?.environmentalClues).toEqual([]);
    });
  });

  describe('validateGentleInquiry', () => {
    it('should validate valid gentle inquiry', () => {
      const valid: GentleInquiryType = {
        id: 'inquiry-1',
        basedOn: ['observation1', 'observation2'],
        question: 'How are you feeling?',
        tone: 'curious',
        skipAllowed: true,
        priority: 'medium'
      };
      
      const result = validateGentleInquiry(valid);
      expect(result).not.toBeNull();
      expect(result?.basedOn).toHaveLength(2);
    });

    it('should handle undefined basedOn', () => {
      const invalid: any = {
        id: 'inquiry-2',
        question: 'What\'s on your mind?',
        tone: 'supportive'
      };
      
      const result = validateGentleInquiry(invalid);
      expect(result).not.toBeNull();
      expect(result?.basedOn).toEqual([]);
    });

    it('should handle null basedOn', () => {
      const invalid: any = {
        id: 'inquiry-3',
        basedOn: null,
        question: 'How can I help?',
        tone: 'informational'
      };
      
      const result = validateGentleInquiry(invalid);
      expect(result).not.toBeNull();
      expect(result?.basedOn).toEqual([]);
    });
  });

  describe('validateHealthEntry', () => {
    it('should validate valid health entry', () => {
      const valid = {
        medications: [{ name: 'Aspirin', dosage: '100mg', unit: 'tablet' }],
        symptoms: [{ name: 'Headache', severity: 5 }]
      };
      
      const result = validateHealthEntry(valid);
      expect(result.medications).toHaveLength(1);
      expect(result.symptoms).toHaveLength(1);
    });

    it('should handle undefined arrays', () => {
      const invalid: any = {
        medications: undefined,
        symptoms: undefined
      };
      
      const result = validateHealthEntry(invalid);
      expect(result.medications).toEqual([]);
      expect(result.symptoms).toEqual([]);
    });

    it('should handle null arrays', () => {
      const invalid: any = {
        medications: null,
        symptoms: null
      };
      
      const result = validateHealthEntry(invalid);
      expect(result.medications).toEqual([]);
      expect(result.symptoms).toEqual([]);
    });
  });

  describe('validateObjectiveObservations', () => {
    it('should validate valid objective observations', () => {
      const valid = [
        { category: 'lighting', value: 'bright', severity: 'high', evidence: 'windows' },
        { category: 'noise', value: 'moderate', severity: 'moderate', evidence: 'traffic' }
      ];
      
      const result = validateObjectiveObservations(valid);
      expect(result).toHaveLength(2);
    });

    it('should handle undefined observations', () => {
      const result = validateObjectiveObservations(undefined as any);
      expect(result).toEqual([]);
    });

    it('should handle null observations', () => {
      const result = validateObjectiveObservations(null as any);
      expect(result).toEqual([]);
    });

    it('should handle non-array input', () => {
      const result = validateObjectiveObservations('invalid' as any);
      expect(result).toEqual([]);
    });
  });

  describe('validateObjectArray', () => {
    it('should validate array with required field', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      
      const result = validateObjectArray(items, 'id');
      expect(result).toHaveLength(2);
    });

    it('should filter out items missing required field', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2' }, // Has 'id' field
        { name: 'Item 3' } // Missing 'id' field
      ];
      
      const result = validateObjectArray(items, 'id');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Item 1');
    });

    it('should handle undefined array', () => {
      const result = validateObjectArray(undefined as any, 'id');
      expect(result).toEqual([]);
    });

    it('should handle null array', () => {
      const result = validateObjectArray(null as any, 'id');
      expect(result).toEqual([]);
    });

    it('should handle non-array input', () => {
      const result = validateObjectArray('invalid' as any, 'id');
      expect(result).toEqual([]);
    });
  });
});