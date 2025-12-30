/**
 * Validation Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateCapacityProfile,
  validateNeuroMetrics,
  validateHealthEntry,
  validateHealthEntries,
  validateUserSettings,
  validateFacialAnalysis,
  validateStateCheck,
  validateWearableDataPoint,
  validateWearableData,
} from '@services/validationService';

describe('validationService', () => {
  describe('validateCapacityProfile', () => {
    it('should return default profile for null input', () => {
      const result = validateCapacityProfile(null);
      expect(result.focus).toBe(5);
      expect(result.social).toBe(5);
      expect(result.structure).toBe(5);
    });

    it('should return default profile for non-object input', () => {
      const result = validateCapacityProfile('invalid');
      expect(result.focus).toBe(5);
    });

    it('should clamp values to valid range', () => {
      const result = validateCapacityProfile({
        focus: 15, // too high
        social: -5, // too low
        structure: 7,
      });
      expect(result.focus).toBe(10); // clamped to max
      expect(result.social).toBe(1); // clamped to min
      expect(result.structure).toBe(7);
    });

    it('should preserve valid values', () => {
      const result = validateCapacityProfile({
        focus: 8,
        social: 3,
        structure: 9,
        emotional: 4,
        physical: 6,
        sensory: 7,
        executive: 5,
      });
      expect(result.focus).toBe(8);
      expect(result.social).toBe(3);
    });
  });

  describe('validateNeuroMetrics', () => {
    it('should return defaults for invalid input', () => {
      const result = validateNeuroMetrics(undefined);
      expect(result.spoonLevel).toBe(5);
      expect(result.sensoryLoad).toBe(5);
      expect(result.contextSwitches).toBe(0);
    });

    it('should validate nested capacity profile', () => {
      const result = validateNeuroMetrics({
        spoonLevel: 8,
        capacity: { focus: 7 },
      });
      expect(result.spoonLevel).toBe(8);
      expect(result.capacity.focus).toBe(7);
    });
  });

  describe('validateHealthEntry', () => {
    it('should return null for invalid input', () => {
      expect(validateHealthEntry(null)).toBeNull();
      expect(validateHealthEntry('invalid')).toBeNull();
    });

    it('should return null for missing required fields', () => {
      expect(validateHealthEntry({ id: '123' })).toBeNull(); // missing timestamp
      expect(validateHealthEntry({ timestamp: 'now' })).toBeNull(); // missing id
    });

    it('should validate a complete health entry', () => {
      const entry = {
        id: 'test-123',
        timestamp: '2024-01-15T10:00:00Z',
        rawText: 'Feeling good today',
        mood: 7,
        moodLabel: 'Happy',
        medications: [],
        symptoms: [],
        tags: ['morning'],
      };
      
      const result = validateHealthEntry(entry);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-123');
      expect(result?.mood).toBe(7);
      expect(result?.moodLabel).toBe('Happy');
    });

    it('should clamp mood to valid range', () => {
      const entry = {
        id: 'test',
        timestamp: '2024-01-15',
        mood: 15, // too high
      };
      
      const result = validateHealthEntry(entry);
      expect(result?.mood).toBe(10);
    });

    it('should validate medications array', () => {
      const entry = {
        id: 'test',
        timestamp: '2024-01-15',
        medications: [
          { name: 'Aspirin', dosage: '100mg', unit: 'pill' },
          { name: 'Invalid' }, // missing dosage/unit - should still work
          'not an object', // should be filtered out
        ],
      };
      
      const result = validateHealthEntry(entry);
      expect(result?.medications).toHaveLength(2);
      expect(result?.medications?.[0].name).toBe('Aspirin');
    });

    it('should validate symptoms array', () => {
      const entry = {
        id: 'test',
        timestamp: '2024-01-15',
        symptoms: [
          { name: 'Headache', severity: 6 },
          { name: 'Fatigue' }, // missing severity - should default to 5
          'invalid', // should be filtered
        ],
      };
      
      const result = validateHealthEntry(entry);
      expect(result?.symptoms).toHaveLength(2);
      expect(result?.symptoms?.[0].severity).toBe(6);
    });

    it('should filter string arrays correctly', () => {
      const entry = {
        id: 'test',
        timestamp: '2024-01-15',
        tags: ['valid', 123, 'also-valid', null],
      };
      
      const result = validateHealthEntry(entry);
      expect(result?.tags).toEqual(['valid', 'also-valid']);
    });
  });

  describe('validateHealthEntries', () => {
    it('should return empty array for invalid input', () => {
      expect(validateHealthEntries(null)).toEqual([]);
      expect(validateHealthEntries('string')).toEqual([]);
    });

    it('should filter out invalid entries', () => {
      const entries = [
        { id: 'valid-1', timestamp: '2024-01-15' },
        { invalid: true },
        { id: 'valid-2', timestamp: '2024-01-16' },
      ];
      
      const result = validateHealthEntries(entries);
      expect(result).toHaveLength(2);
    });
  });

  describe('validateUserSettings', () => {
    it('should return defaults for invalid input', () => {
      const result = validateUserSettings(null);
      expect(result.avgCycleLength).toBe(28);
    });

    it('should clamp cycle length', () => {
      const result = validateUserSettings({ avgCycleLength: 60 });
      expect(result.avgCycleLength).toBe(45); // max
    });

    it('should preserve valid settings', () => {
      const result = validateUserSettings({
        avgCycleLength: 30,
        cycleStartDate: '2024-01-01',
        safetyContact: 'Emergency: 911',
      });
      expect(result.avgCycleLength).toBe(30);
      expect(result.cycleStartDate).toBe('2024-01-01');
      expect(result.safetyContact).toBe('Emergency: 911');
    });
  });

  describe('validateFacialAnalysis', () => {
    it('should return defaults for invalid input', () => {
      const result = validateFacialAnalysis(undefined);
      expect(result.primaryEmotion).toBe('neutral');
      expect(result.confidence).toBe(0);
    });

    it('should preserve valid analysis', () => {
      const result = validateFacialAnalysis({
        primaryEmotion: 'happy',
        confidence: 0.85,
        eyeFatigue: 0.3,
        signs: ['smiling'],
      });
      expect(result.primaryEmotion).toBe('happy');
      expect(result.confidence).toBe(0.85);
      expect(result.signs).toContain('smiling');
    });
  });

  describe('validateStateCheck', () => {
    it('should return null for invalid input', () => {
      expect(validateStateCheck(null)).toBeNull();
      expect(validateStateCheck({ id: 'test' })).toBeNull(); // missing timestamp
    });

    it('should validate a complete state check', () => {
      const check = {
        id: 'check-123',
        timestamp: '2024-01-15T10:00:00Z',
        userNote: 'Morning check',
        analysis: {
          primaryEmotion: 'tired',
          confidence: 0.7,
        },
      };
      
      const result = validateStateCheck(check);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('check-123');
      expect(result?.userNote).toBe('Morning check');
    });
  });

  describe('validateWearableDataPoint', () => {
    it('should return null for invalid input', () => {
      expect(validateWearableDataPoint(null)).toBeNull();
      expect(validateWearableDataPoint({ id: 'test' })).toBeNull(); // missing date/provider
    });

    it('should validate a complete data point', () => {
      const dataPoint = {
        id: 'dp-123',
        date: '2024-01-15',
        provider: 'apple_health',
        syncedAt: '2024-01-15T12:00:00Z',
        metrics: {
          date: '2024-01-15',
          source: 'apple_health',
          sleep: { totalDurationSeconds: 28800 },
        },
      };
      
      const result = validateWearableDataPoint(dataPoint);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('dp-123');
      expect(result?.provider).toBe('apple_health');
    });

    it('should provide default syncedAt if missing', () => {
      const dataPoint = {
        id: 'dp-123',
        date: '2024-01-15',
        provider: 'garmin',
      };
      
      const result = validateWearableDataPoint(dataPoint);
      expect(result?.syncedAt).toBeDefined();
    });
  });

  describe('validateWearableData', () => {
    it('should return empty array for invalid input', () => {
      expect(validateWearableData(null)).toEqual([]);
      expect(validateWearableData('invalid')).toEqual([]);
    });

    it('should filter invalid entries', () => {
      const data = [
        { id: '1', date: '2024-01-15', provider: 'apple_health' },
        { invalid: true },
        { id: '2', date: '2024-01-16', provider: 'garmin' },
      ];
      
      const result = validateWearableData(data);
      expect(result).toHaveLength(2);
    });
  });
});
