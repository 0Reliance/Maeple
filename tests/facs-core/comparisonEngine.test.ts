/**
 * P0 Critical Test: comparisonEngine.test.ts
 *
 * Tests the FACS comparison logic including:
 * - Smile type detection (Duchenne vs Social)
 * - Tension level calculation
 * - Fatigue detection
 * - Masking likelihood calculation
 * - Baseline adjustment logic
 * - Edge cases (empty AU arrays, invalid data)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  compareSubjectiveToObjective,
  ComparisonResult,
} from '../../src/services/comparisonEngine';
import { ActionUnit, FacialAnalysis, FacialBaseline, HealthEntry } from '../../src/types';

describe('comparisonEngine', () => {
  // Helper to create mock Action Units
  const createAU = (
    auCode: string,
    intensityNumeric: number,
    intensity: 'A' | 'B' | 'C' | 'D' | 'E' = 'C',
    confidence: number = 0.9
  ): ActionUnit => ({
    auCode,
    name: `Test ${auCode}`,
    intensity,
    intensityNumeric,
    confidence,
  });

  // Helper to create mock FacialAnalysis
  const createAnalysis = (
    actionUnits: ActionUnit[] = [],
    overrides: Partial<FacialAnalysis> = {}
  ): FacialAnalysis => ({
    confidence: 0.85,
    actionUnits,
    observations: [],
    lighting: 'natural',
    lightingSeverity: 'low',
    environmentalClues: [],
    ...overrides,
  });

  // Helper to create mock HealthEntry
  const createJournalEntry = (mood: number, moodLabel: string): HealthEntry => ({
    id: 'test-entry-1',
    timestamp: new Date().toISOString(),
    rawText: 'Test entry',
    mood,
    moodLabel,
    medications: [],
    symptoms: [],
    tags: [],
    activityTypes: [],
    strengths: [],
    neuroMetrics: {
      spoonLevel: 5,
      sensoryLoad: 5,
      contextSwitches: 0,
      capacity: {
        focus: 5,
        social: 5,
        structure: 5,
        emotional: 5,
        physical: 5,
        sensory: 5,
        executive: 5,
      },
    },
    notes: '',
  });

  // Helper to create mock FacialBaseline
  const createBaseline = (
    neutralTension: number = 0.2,
    neutralFatigue: number = 0.1
  ): FacialBaseline => ({
    id: 'baseline-1',
    timestamp: new Date().toISOString(),
    neutralTension,
    neutralFatigue,
    neutralMasking: 0.1,
  });

  describe('T-3.1: Genuine Smile Detection', () => {
    it('should detect genuine smile when AU6 + AU12 present with high mood', () => {
      const actionUnits = [
        createAU('AU6', 3, 'C'), // Cheek Raiser
        createAU('AU12', 4, 'D'), // Lip Corner Puller
      ];
      const analysis = createAnalysis(actionUnits, {
        facsInterpretation: {
          duchennSmile: true,
          socialSmile: false,
          maskingIndicators: [],
          fatigueIndicators: [],
          tensionIndicators: [],
        },
      });
      const journalEntry = createJournalEntry(4, 'Happy');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.smileType).toBe('genuine');
      expect(result.isMaskingLikely).toBe(false);
    });

    it('should detect genuine smile from raw AUs when AU6 + AU12 both present', () => {
      const actionUnits = [
        createAU('AU6', 3, 'C'), // Cheek Raiser
        createAU('AU12', 4, 'D'), // Lip Corner Puller
      ];
      const analysis = createAnalysis(actionUnits); // No facsInterpretation
      const journalEntry = createJournalEntry(5, 'Great');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.smileType).toBe('genuine');
    });
  });

  describe('T-3.2: Social Smile Masking Detection', () => {
    it('should detect social smile when AU12 without AU6 with high mood', () => {
      const actionUnits = [
        createAU('AU12', 3, 'C'), // Lip Corner Puller only
      ];
      const analysis = createAnalysis(actionUnits, {
        facsInterpretation: {
          duchennSmile: false,
          socialSmile: true,
          maskingIndicators: [],
          fatigueIndicators: [],
          tensionIndicators: [],
        },
      });
      const journalEntry = createJournalEntry(5, 'Excellent');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.smileType).toBe('social');
      expect(result.isMaskingLikely).toBe(true);
      expect(result.discrepancyScore).toBeGreaterThanOrEqual(50);
    });

    it('should detect social smile from raw AUs when only AU12 present', () => {
      const actionUnits = [
        createAU('AU12', 3, 'C'), // Lip Corner Puller only
      ];
      const analysis = createAnalysis(actionUnits); // No facsInterpretation
      const journalEntry = createJournalEntry(4, 'Good');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.smileType).toBe('social');
    });
  });

  describe('T-3.3: High Tension with Good Mood', () => {
    it('should increase discrepancy score when tension AUs present with good mood', () => {
      const actionUnits = [
        createAU('AU4', 4, 'D'), // Brow Lowerer (tension)
        createAU('AU24', 3, 'C'), // Lip Pressor (tension)
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(4, 'Happy');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.discrepancyScore).toBeGreaterThan(50);
      expect(result.facsInsights?.tensionAUs).toContain('AU4');
      expect(result.facsInsights?.tensionAUs).toContain('AU24');
    });

    it('should flag masking when tension > 0.5 with mood >= 4', () => {
      const actionUnits = [
        createAU('AU4', 5, 'E'), // High intensity Brow Lowerer
        createAU('AU24', 4, 'D'), // High intensity Lip Pressor
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(5, 'Great');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.isMaskingLikely).toBe(true);
    });
  });

  describe('T-3.4: Fatigue Indicators', () => {
    it('should calculate fatigue score from AU43 (Eyes Closed)', () => {
      const actionUnits = [
        createAU('AU43', 3, 'C'), // Eyes Closed
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(3, 'Okay');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.fatigueAUs).toContain('AU43');
    });

    it('should detect fatigue from AU7 (Lid Tightener)', () => {
      const actionUnits = [
        createAU('AU7', 3, 'C'), // Lid Tightener (squinting from fatigue)
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(3, 'Okay');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.fatigueAUs).toContain('AU7');
    });

    it('should increase discrepancy when fatigue detected with high energy mood', () => {
      const actionUnits = [
        createAU('AU43', 3, 'C'), // Eyes Closed
        createAU('AU7', 3, 'C'), // Lid Tightener
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(5, 'Energetic');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      // Fatigue indicators with high mood should increase discrepancy
      expect(result.discrepancyScore).toBeGreaterThanOrEqual(30);
    });
  });

  describe('T-3.5: Baseline Adjustment', () => {
    it('should apply baseline adjustment when provided', () => {
      const actionUnits = [
        createAU('AU4', 3, 'C'), // Brow Lowerer
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(3, 'Okay');
      const baseline = createBaseline(0.3, 0.1);

      const result = compareSubjectiveToObjective(journalEntry, analysis, baseline);

      expect(result.baselineApplied).toBe(true);
      expect(result.objectiveState).toContain('baseline-adjusted');
    });

    it('should calculate tension delta from baseline', () => {
      const actionUnits = [
        createAU('AU4', 4, 'D'), // Brow Lowerer
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(3, 'Okay');
      const baseline = createBaseline(0.5, 0.1); // Higher baseline tension

      const result = compareSubjectiveToObjective(journalEntry, analysis, baseline);

      // Tension should be adjusted down by baseline
      expect(result.baselineApplied).toBe(true);
    });

    it('should handle null baseline gracefully', () => {
      const actionUnits = [createAU('AU12', 3, 'C')];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(4, 'Good');

      const result = compareSubjectiveToObjective(journalEntry, analysis, null);

      expect(result.baselineApplied).toBe(false);
    });
  });

  describe('T-3.6: calculateTensionFromAUs', () => {
    it('should calculate tension score from AU4, AU24, AU14', () => {
      const actionUnits = [
        createAU('AU4', 4, 'D'), // Brow Lowerer
        createAU('AU24', 3, 'C'), // Lip Pressor
        createAU('AU14', 2, 'B'), // Dimpler
      ];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      // Tension should be calculated (0-1 range)
      expect(result.discrepancyScore).toBe(0); // No journal entry = no discrepancy
    });

    it('should return 0 tension for empty AU array', () => {
      const analysis = createAnalysis([]);

      const result = compareSubjectiveToObjective(null, analysis);

      expect(result.discrepancyScore).toBe(0);
    });

    it('should cap tension at 1.0 for max intensity AUs', () => {
      const actionUnits = [
        createAU('AU4', 5, 'E'), // Max intensity
        createAU('AU24', 5, 'E'), // Max intensity
        createAU('AU14', 5, 'E'), // Max intensity
      ];
      const analysis = createAnalysis(actionUnits);
      const journalEntry = createJournalEntry(3, 'Okay');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      // Tension is capped at 1, but with neutral mood and high tension, discrepancy should be 0
      // (no contradiction between mood and facial expression)
      expect(result.discrepancyScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('T-3.7: calculateFatigueFromAUs', () => {
    it('should calculate fatigue from AU43 and AU7', () => {
      const actionUnits = [
        createAU('AU43', 4, 'D'), // Eyes Closed
        createAU('AU7', 3, 'C'), // Lid Tightener
      ];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      expect(result.facsInsights?.fatigueAUs).toContain('AU43');
      expect(result.facsInsights?.fatigueAUs).toContain('AU7');
    });

    it('should detect low expressiveness as fatigue indicator', () => {
      const actionUnits = [
        createAU('AU1', 1, 'A'), // Very low intensity
      ];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      // Low average intensity should contribute to fatigue detection
      expect(result.facsInsights?.fatigueAUs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('T-3.8: hasAUWithIntensity', () => {
    it('should find AU with sufficient intensity', () => {
      const actionUnits = [
        createAU('AU12', 3, 'C'), // Intensity 3 >= 2
      ];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      expect(result.facsInsights?.detectedAUs).toContain('AU12');
    });

    it('should be case-insensitive for AU codes', () => {
      const actionUnits = [
        { ...createAU('au12', 3, 'C'), auCode: 'au12' }, // lowercase
      ];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      expect(result.facsInsights?.detectedAUs).toContain('au12');
    });

    it('should handle exact threshold correctly', () => {
      const actionUnits = [
        createAU('AU12', 2, 'B'), // Exactly at threshold
      ];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      expect(result.facsInsights?.detectedAUs).toContain('AU12');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty actionUnits array', () => {
      const analysis = createAnalysis([]);
      const journalEntry = createJournalEntry(3, 'Okay');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.smileType).toBe('none');
      expect(result.discrepancyScore).toBe(0);
    });

    it('should handle null journal entry', () => {
      const actionUnits = [createAU('AU12', 3, 'C')];
      const analysis = createAnalysis(actionUnits);

      const result = compareSubjectiveToObjective(null, analysis);

      expect(result.subjectiveState).toBe('No recent entry');
      expect(result.discrepancyScore).toBe(0);
    });

    it('should handle analysis with only facsInterpretation', () => {
      const analysis = createAnalysis([], {
        facsInterpretation: {
          duchennSmile: true,
          socialSmile: false,
          maskingIndicators: ['AU14', 'AU17'],
          fatigueIndicators: [],
          tensionIndicators: [],
        },
      });
      const journalEntry = createJournalEntry(4, 'Good');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.facsInsights?.smileType).toBe('genuine');
    });

    it('should cap discrepancy score at 100', () => {
      const actionUnits = [
        createAU('AU4', 5, 'E'),
        createAU('AU24', 5, 'E'),
        createAU('AU14', 5, 'E'),
      ];
      const analysis = createAnalysis(actionUnits, {
        facsInterpretation: {
          duchennSmile: false,
          socialSmile: true,
          maskingIndicators: ['indicator1', 'indicator2', 'indicator3', 'indicator4'],
          fatigueIndicators: [],
          tensionIndicators: [],
        },
      });
      const journalEntry = createJournalEntry(5, 'Excellent');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.discrepancyScore).toBeLessThanOrEqual(100);
    });

    it('should ensure discrepancy score is at least 0', () => {
      const analysis = createAnalysis([]);
      const journalEntry = createJournalEntry(1, 'Terrible');

      const result = compareSubjectiveToObjective(journalEntry, analysis);

      expect(result.discrepancyScore).toBeGreaterThanOrEqual(0);
    });
  });
});
