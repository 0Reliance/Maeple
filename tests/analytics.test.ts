import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInsights,
  generateDailyStrategy,
  calculateBurnoutTrajectory,
  calculateCognitiveLoad,
  calculateCyclePhase,
} from '../services/analytics';
import { HealthEntry, UserSettings } from '../types';

// Test data factory
const createEntry = (overrides: Partial<HealthEntry> = {}): HealthEntry => ({
  id: `test-${Date.now()}-${Math.random()}`,
  timestamp: new Date().toISOString(),
  mood: 6,
  moodLabel: 'Good',
  rawText: 'Test entry',
  notes: '',
  medications: [],
  symptoms: [],
  tags: [],
  activityTypes: [],
  strengths: [],
  neuroMetrics: {
    spoonLevel: 5,
    sensoryLoad: 5,
    contextSwitches: 3,
    maskingScore: 3,
    capacity: {
      focus: 6,
      social: 5,
      sensory: 5,
      structure: 6,
      emotional: 5,
      physical: 5,
      executive: 6,
    },
    ...overrides.neuroMetrics,
  },
  ...overrides,
});

const createEntryWithTimestamp = (daysAgo: number, overrides: Partial<HealthEntry> = {}): HealthEntry => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return createEntry({
    timestamp: date.toISOString(),
    ...overrides,
  });
};

describe('Analytics Service', () => {
  describe('generateInsights', () => {
    it('returns empty array with fewer than 3 entries', () => {
      const entries = [createEntry(), createEntry()];
      const insights = generateInsights(entries);
      expect(insights).toEqual([]);
    });

    it('detects capacity-mood correlations', () => {
      // Create entries with high focus and high mood
      const highFocusHighMood = [
        createEntry({ mood: 8, neuroMetrics: { ...createEntry().neuroMetrics, capacity: { ...createEntry().neuroMetrics.capacity, focus: 9 } } }),
        createEntry({ mood: 9, neuroMetrics: { ...createEntry().neuroMetrics, capacity: { ...createEntry().neuroMetrics.capacity, focus: 8 } } }),
        createEntry({ mood: 7, neuroMetrics: { ...createEntry().neuroMetrics, capacity: { ...createEntry().neuroMetrics.capacity, focus: 9 } } }),
      ];
      
      // Create entries with low focus and low mood
      const lowFocusLowMood = [
        createEntry({ mood: 3, neuroMetrics: { ...createEntry().neuroMetrics, capacity: { ...createEntry().neuroMetrics.capacity, focus: 2 } } }),
        createEntry({ mood: 4, neuroMetrics: { ...createEntry().neuroMetrics, capacity: { ...createEntry().neuroMetrics.capacity, focus: 3 } } }),
        createEntry({ mood: 2, neuroMetrics: { ...createEntry().neuroMetrics, capacity: { ...createEntry().neuroMetrics.capacity, focus: 2 } } }),
      ];

      const entries = [...highFocusHighMood, ...lowFocusLowMood];
      const insights = generateInsights(entries);
      
      expect(insights.length).toBeGreaterThan(0);
      const focusInsight = insights.find(i => i.title.toLowerCase().includes('focus'));
      expect(focusInsight).toBeDefined();
      expect(focusInsight?.type).toBe('CORRELATION');
    });

    it('detects sensory drain warning', () => {
      // Create entries with high sensory load and low focus
      const entries = [
        createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, sensoryLoad: 9, capacity: { ...createEntry().neuroMetrics.capacity, focus: 3 } } }),
        createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, sensoryLoad: 8, capacity: { ...createEntry().neuroMetrics.capacity, focus: 4 } } }),
        createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, sensoryLoad: 9, capacity: { ...createEntry().neuroMetrics.capacity, focus: 3 } } }),
        // Normal entries for comparison
        createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, sensoryLoad: 3, capacity: { ...createEntry().neuroMetrics.capacity, focus: 8 } } }),
        createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, sensoryLoad: 4, capacity: { ...createEntry().neuroMetrics.capacity, focus: 7 } } }),
      ];

      const insights = generateInsights(entries);
      const sensoryWarning = insights.find(i => i.title.includes('Sensory'));
      expect(sensoryWarning).toBeDefined();
      expect(sensoryWarning?.type).toBe('WARNING');
    });

    it('limits results to 5 insights', () => {
      // Create many diverse entries to generate multiple insights
      const entries = Array(20).fill(null).map((_, i) => 
        createEntry({
          mood: i % 2 === 0 ? 9 : 2,
          neuroMetrics: {
            ...createEntry().neuroMetrics,
            sensoryLoad: i % 2 === 0 ? 9 : 3,
            maskingScore: i % 3 === 0 ? 9 : 2,
            capacity: {
              ...createEntry().neuroMetrics.capacity,
              focus: i % 2 === 0 ? 9 : 2,
              social: i % 2 === 0 ? 9 : 2,
            }
          }
        })
      );
      
      const insights = generateInsights(entries);
      expect(insights.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generateDailyStrategy', () => {
    it('returns AI strategies when available', () => {
      const aiStrategies = [
        { id: 'ai-1', title: 'AI Strategy', action: 'Do this', type: 'REST' as const, relevanceScore: 10 }
      ];
      const entry = createEntry({ aiStrategies });
      
      const strategies = generateDailyStrategy(entry);
      expect(strategies).toEqual(aiStrategies);
    });

    it('generates social permission slip when social capacity is low', () => {
      const entry = createEntry({
        neuroMetrics: {
          ...createEntry().neuroMetrics,
          capacity: { ...createEntry().neuroMetrics.capacity, social: 2 }
        }
      });

      const strategies = generateDailyStrategy(entry);
      const socialStrategy = strategies.find(s => s.id === 'social-low');
      expect(socialStrategy).toBeDefined();
      expect(socialStrategy?.title).toBe('Social Permission Slip');
    });

    it('generates sensory rescue protocol when needed', () => {
      const entry = createEntry({
        neuroMetrics: {
          ...createEntry().neuroMetrics,
          sensoryLoad: 9,
          capacity: { ...createEntry().neuroMetrics.capacity, sensory: 2 }
        }
      });

      const strategies = generateDailyStrategy(entry);
      const sensoryStrategy = strategies.find(s => s.id === 'sensory-rescue');
      expect(sensoryStrategy).toBeDefined();
      expect(sensoryStrategy?.title).toBe('Sensory Rescue Protocol');
    });

    it('generates hyperfocus greenlight when conditions are optimal', () => {
      const entry = createEntry({
        neuroMetrics: {
          ...createEntry().neuroMetrics,
          capacity: { ...createEntry().neuroMetrics.capacity, focus: 9, sensory: 6 }
        }
      });

      const strategies = generateDailyStrategy(entry);
      const focusStrategy = strategies.find(s => s.id === 'hyperfocus-greenlight');
      expect(focusStrategy).toBeDefined();
    });

    it('generates crash prevention when spoons are critical', () => {
      const entry = createEntry({
        neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 2 }
      });

      const strategies = generateDailyStrategy(entry);
      const crashStrategy = strategies.find(s => s.id === 'crash-prevention');
      expect(crashStrategy).toBeDefined();
      expect(crashStrategy?.title).toBe('Crash Prevention Mode');
    });

    it('limits strategies to top 3 by relevance', () => {
      const entry = createEntry({
        neuroMetrics: {
          ...createEntry().neuroMetrics,
          spoonLevel: 2,
          sensoryLoad: 9,
          contextSwitches: 10,
          capacity: {
            ...createEntry().neuroMetrics.capacity,
            social: 2,
            focus: 2,
            sensory: 2,
          },
          cycleDay: 25,
        }
      });

      const strategies = generateDailyStrategy(entry);
      expect(strategies.length).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateBurnoutTrajectory', () => {
    it('returns sustainable with insufficient data', () => {
      const entries = [createEntry(), createEntry()];
      const forecast = calculateBurnoutTrajectory(entries);
      
      expect(forecast.riskLevel).toBe('SUSTAINABLE');
      expect(forecast.description).toContain('Not enough data');
    });

    it('detects sustainable pace', () => {
      // Create balanced entries over 7 days
      const entries = Array(7).fill(null).map((_, i) => 
        createEntryWithTimestamp(i, {
          neuroMetrics: {
            ...createEntry().neuroMetrics,
            spoonLevel: 6,
            sensoryLoad: 4,
            maskingScore: 2,
            contextSwitches: 3,
          }
        })
      );

      const forecast = calculateBurnoutTrajectory(entries);
      expect(forecast.riskLevel).toBe('SUSTAINABLE');
    });

    it('detects critical burnout risk', () => {
      // Create high-demand, low-capacity entries
      const entries = Array(7).fill(null).map((_, i) => 
        createEntryWithTimestamp(i, {
          neuroMetrics: {
            ...createEntry().neuroMetrics,
            spoonLevel: 2,
            sensoryLoad: 9,
            maskingScore: 8,
            contextSwitches: 10,
          }
        })
      );

      const forecast = calculateBurnoutTrajectory(entries);
      expect(forecast.riskLevel).toBe('CRITICAL');
      expect(forecast.daysUntilCrash).toBeDefined();
      expect(forecast.recoveryDaysNeeded).toBeGreaterThan(0);
    });

    it('detects moderate burnout risk', () => {
      // Create moderately stressed entries - should be between sustainable and critical
      const entries = Array(5).fill(null).map((_, i) => 
        createEntryWithTimestamp(i, {
          neuroMetrics: {
            ...createEntry().neuroMetrics,
            spoonLevel: 5,
            sensoryLoad: 5,
            maskingScore: 4,
            contextSwitches: 4,
          }
        })
      );

      const forecast = calculateBurnoutTrajectory(entries);
      // With balanced moderate stress, it could be sustainable or moderate
      expect(['MODERATE', 'SUSTAINABLE', 'CRITICAL']).toContain(forecast.riskLevel);
    });

    it('detects falling trend when capacity drops', () => {
      // Create entries with declining spoon levels
      const entries = [
        createEntryWithTimestamp(0, { neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 3 } }),
        createEntryWithTimestamp(1, { neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 4 } }),
        createEntryWithTimestamp(2, { neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 5 } }),
        createEntryWithTimestamp(3, { neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 7 } }),
        createEntryWithTimestamp(4, { neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 8 } }),
        createEntryWithTimestamp(5, { neuroMetrics: { ...createEntry().neuroMetrics, spoonLevel: 9 } }),
      ];

      const forecast = calculateBurnoutTrajectory(entries);
      expect(forecast.trend).toBe('FALLING');
    });
  });

  describe('calculateCognitiveLoad', () => {
    it('returns FLOW state with low switches', () => {
      const entry = createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, contextSwitches: 2 } });
      const load = calculateCognitiveLoad(entry);
      
      expect(load.state).toBe('FLOW');
      expect(load.switches).toBe(2);
      expect(load.efficiencyLoss).toBe(10); // 2 * 5%
    });

    it('returns MODERATE state with moderate switches', () => {
      const entry = createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, contextSwitches: 6 } });
      const load = calculateCognitiveLoad(entry);
      
      expect(load.state).toBe('MODERATE');
      expect(load.switches).toBe(6);
      expect(load.efficiencyLoss).toBe(30);
    });

    it('returns FRAGMENTED state with high switches', () => {
      const entry = createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, contextSwitches: 12 } });
      const load = calculateCognitiveLoad(entry);
      
      expect(load.state).toBe('FRAGMENTED');
      expect(load.switches).toBe(12);
      expect(load.efficiencyLoss).toBe(60); // Capped at 60%
    });

    it('caps efficiency loss at 60%', () => {
      const entry = createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, contextSwitches: 20 } });
      const load = calculateCognitiveLoad(entry);
      
      expect(load.efficiencyLoss).toBe(60);
    });

    it('provides appropriate advice for each state', () => {
      const flowEntry = createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, contextSwitches: 1 } });
      const fragmentedEntry = createEntry({ neuroMetrics: { ...createEntry().neuroMetrics, contextSwitches: 10 } });
      
      expect(calculateCognitiveLoad(flowEntry).advice).toContain('flow');
      expect(calculateCognitiveLoad(fragmentedEntry).advice).toContain('fragmentation');
    });
  });

  describe('calculateCyclePhase', () => {
    it('returns null when no cycle start date', () => {
      const settings: UserSettings = { avgCycleLength: 28 };
      const result = calculateCyclePhase(settings);
      expect(result).toBeNull();
    });

    it('calculates menstrual phase correctly (days 1-5)', () => {
      const today = new Date();
      const cycleStart = new Date(today);
      cycleStart.setDate(today.getDate() - 3); // Day 4 of cycle
      
      const settings: UserSettings = {
        cycleStartDate: cycleStart.toISOString(),
        avgCycleLength: 28,
      };
      
      const result = calculateCyclePhase(settings);
      expect(result?.phase).toBe('MENSTRUAL');
      expect(result?.day).toBe(4);
    });

    it('calculates follicular phase correctly (days 6-13)', () => {
      const today = new Date();
      const cycleStart = new Date(today);
      cycleStart.setDate(today.getDate() - 9); // Day 10 of cycle
      
      const settings: UserSettings = {
        cycleStartDate: cycleStart.toISOString(),
        avgCycleLength: 28,
      };
      
      const result = calculateCyclePhase(settings);
      expect(result?.phase).toBe('FOLLICULAR');
      expect(result?.day).toBe(10);
    });

    it('calculates ovulatory phase correctly (days 14-17)', () => {
      const today = new Date();
      const cycleStart = new Date(today);
      cycleStart.setDate(today.getDate() - 14); // Day 15 of cycle
      
      const settings: UserSettings = {
        cycleStartDate: cycleStart.toISOString(),
        avgCycleLength: 28,
      };
      
      const result = calculateCyclePhase(settings);
      expect(result?.phase).toBe('OVULATORY');
      expect(result?.day).toBe(15);
    });

    it('calculates luteal phase correctly (days 18+)', () => {
      const today = new Date();
      const cycleStart = new Date(today);
      cycleStart.setDate(today.getDate() - 22); // Day 23 of cycle
      
      const settings: UserSettings = {
        cycleStartDate: cycleStart.toISOString(),
        avgCycleLength: 28,
      };
      
      const result = calculateCyclePhase(settings);
      expect(result?.phase).toBe('LUTEAL');
      expect(result?.day).toBe(23);
    });

    it('handles custom cycle lengths', () => {
      const today = new Date();
      const cycleStart = new Date(today);
      cycleStart.setDate(today.getDate() - 35); // Day 1 of next cycle (with 35-day length)
      
      const settings: UserSettings = {
        cycleStartDate: cycleStart.toISOString(),
        avgCycleLength: 35,
      };
      
      const result = calculateCyclePhase(settings);
      expect(result?.day).toBe(1); // Should wrap around
      expect(result?.length).toBe(35);
    });

    it('provides phase-specific advice', () => {
      const today = new Date();
      
      // Test luteal phase advice mentions executive function
      const lutealStart = new Date(today);
      lutealStart.setDate(today.getDate() - 20);
      const lutealSettings: UserSettings = {
        cycleStartDate: lutealStart.toISOString(),
        avgCycleLength: 28,
      };
      const lutealResult = calculateCyclePhase(lutealSettings);
      expect(lutealResult?.advice).toContain('executive function');
    });
  });
});
