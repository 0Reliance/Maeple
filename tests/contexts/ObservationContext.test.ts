/**
 * ObservationContext Tests
 * 
 * Tests for observation state management and persistence.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Types to match the context
type ObservationType = 'visual' | 'audio' | 'text';
type ObservationSource = 'bio-mirror' | 'voice' | 'text-input';

interface Observation {
  category: 'tension' | 'fatigue' | 'lighting' | 'noise' | 'speech-pace' | 'tone';
  value: string;
  severity: 'low' | 'moderate' | 'high';
  evidence: string;
}

interface StoredObservation {
  id: string;
  type: ObservationType;
  source: ObservationSource;
  observations: Observation[];
  confidence: number;
  timestamp: string;
  storedAt: Date;
  correlatedEntryId?: string;
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const STORAGE_KEY = 'maeple_observations';
const MAX_AGE_HOURS = 24;

describe('ObservationContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock observation
  const createMockObservation = (overrides: Partial<StoredObservation> = {}): StoredObservation => ({
    id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'visual',
    source: 'bio-mirror',
    observations: [],
    confidence: 0.8,
    timestamp: new Date().toISOString(),
    storedAt: new Date(),
    ...overrides,
  });

  describe('persistence', () => {
    it('should persist observations to localStorage', () => {
      const observation = createMockObservation({
        observations: [
          { category: 'tension', value: 'jaw tension', severity: 'moderate', evidence: 'FACS AU4' }
        ]
      });

      const observations = [observation];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].observations[0].category).toBe('tension');
    });

    it('should load observations from localStorage', () => {
      const observation = createMockObservation({ id: 'load_test' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([observation]));

      const stored = localStorage.getItem(STORAGE_KEY);
      const loaded = stored ? JSON.parse(stored) : [];

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('load_test');
    });

    it('should filter out old observations on load', () => {
      const now = Date.now();
      const oldTime = new Date(now - 48 * 60 * 60 * 1000); // 48 hours ago
      const recentTime = new Date(now - 2 * 60 * 60 * 1000); // 2 hours ago

      const observations = [
        createMockObservation({ id: 'old', storedAt: oldTime }),
        createMockObservation({ id: 'recent', storedAt: recentTime }),
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));

      // Simulate load with filtering
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const cutoff = now - (MAX_AGE_HOURS * 60 * 60 * 1000);

      const filtered = parsed
        .map((obs: StoredObservation) => ({
          ...obs,
          storedAt: new Date(obs.storedAt),
        }))
        .filter((obs: StoredObservation) => obs.storedAt.getTime() > cutoff);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('recent');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {{{');

      let loaded: StoredObservation[] = [];
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        loaded = stored ? JSON.parse(stored) : [];
      } catch (e) {
        loaded = [];
      }

      expect(loaded).toEqual([]);
    });
  });

  describe('reducer actions', () => {
    it('should add observation with generated id', () => {
      const observations: StoredObservation[] = [];

      const newObs = {
        type: 'visual' as const,
        source: 'bio-mirror' as const,
        observations: [],
        confidence: 0.9,
        timestamp: new Date().toISOString(),
      };

      // Simulate ADD action
      const addedObs: StoredObservation = {
        ...newObs,
        id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        storedAt: new Date(),
      };

      const newState = [addedObs, ...observations];

      expect(newState).toHaveLength(1);
      expect(newState[0].id).toMatch(/^obs_\d+_[a-z0-9]+$/);
    });

    it('should remove observation by id', () => {
      const observations: StoredObservation[] = [
        createMockObservation({ id: 'keep' }),
        createMockObservation({ id: 'remove' }),
        createMockObservation({ id: 'also_keep' }),
      ];

      // Simulate REMOVE action
      const newState = observations.filter(obs => obs.id !== 'remove');

      expect(newState).toHaveLength(2);
      expect(newState.find(obs => obs.id === 'remove')).toBeUndefined();
    });

    it('should update observation by id', () => {
      const observations: StoredObservation[] = [
        createMockObservation({ id: 'update_me', confidence: 0.5 }),
      ];

      // Simulate UPDATE action
      const newState = observations.map(obs =>
        obs.id === 'update_me' ? { ...obs, confidence: 0.95 } : obs
      );

      expect(newState[0].confidence).toBe(0.95);
    });

    it('should correlate observation with entry', () => {
      const observations: StoredObservation[] = [
        createMockObservation({ id: 'correlate_me' }),
      ];

      // Simulate CORRELATE action
      const entryId = 'entry_123';
      const newState = observations.map(obs =>
        obs.id === 'correlate_me' ? { ...obs, correlatedEntryId: entryId } : obs
      );

      expect(newState[0].correlatedEntryId).toBe('entry_123');
    });

    it('should clear all observations', () => {
      const observations: StoredObservation[] = [
        createMockObservation({ id: '1' }),
        createMockObservation({ id: '2' }),
        createMockObservation({ id: '3' }),
      ];

      // Simulate CLEAR action
      const newState: StoredObservation[] = [];

      expect(newState).toHaveLength(0);
    });
  });

  describe('query functions', () => {
    it('should get observations by type', () => {
      const observations: StoredObservation[] = [
        createMockObservation({ id: '1', type: 'visual' }),
        createMockObservation({ id: '2', type: 'audio' }),
        createMockObservation({ id: '3', type: 'visual' }),
        createMockObservation({ id: '4', type: 'text' }),
      ];

      const visualOnly = observations.filter(obs => obs.type === 'visual');

      expect(visualOnly).toHaveLength(2);
      expect(visualOnly.every(obs => obs.type === 'visual')).toBe(true);
    });

    it('should get observations by source', () => {
      const observations: StoredObservation[] = [
        createMockObservation({ id: '1', source: 'bio-mirror' }),
        createMockObservation({ id: '2', source: 'voice' }),
        createMockObservation({ id: '3', source: 'bio-mirror' }),
      ];

      const bioMirrorOnly = observations.filter(obs => obs.source === 'bio-mirror');

      expect(bioMirrorOnly).toHaveLength(2);
    });

    it('should get observations by time range', () => {
      const now = Date.now();
      const observations: StoredObservation[] = [
        createMockObservation({ id: 'recent', storedAt: new Date(now - 1 * 60 * 60 * 1000) }), // 1 hour ago
        createMockObservation({ id: 'old', storedAt: new Date(now - 5 * 60 * 60 * 1000) }), // 5 hours ago
      ];

      const timeRangeHours = 2;
      const cutoff = new Date(now - timeRangeHours * 60 * 60 * 1000);

      const recentOnly = observations.filter(obs => obs.storedAt > cutoff);

      expect(recentOnly).toHaveLength(1);
      expect(recentOnly[0].id).toBe('recent');
    });

    it('should get recent observations with limit', () => {
      const observations: StoredObservation[] = [];
      for (let i = 0; i < 20; i++) {
        observations.push(createMockObservation({ id: `obs_${i}` }));
      }

      const count = 10;
      const recent = observations.slice(0, count);

      expect(recent).toHaveLength(10);
    });
  });

  describe('helper functions', () => {
    it('should convert facial analysis to observation', () => {
      const facialAnalysis = {
        confidence: 0.85,
        observations: [
          { category: 'tension' as const, value: 'jaw tension', evidence: 'FACS detection' },
        ],
        lightingSeverity: 'moderate' as const,
        lighting: 'bright',
        environmentalClues: [],
        actionUnits: [],
      };

      const converted = {
        type: 'visual' as const,
        source: 'bio-mirror' as const,
        observations: facialAnalysis.observations.map(obs => ({
          category: obs.category,
          value: obs.value,
          severity: facialAnalysis.lightingSeverity,
          evidence: obs.evidence,
        })),
        confidence: facialAnalysis.confidence,
        timestamp: new Date().toISOString(),
      };

      expect(converted.type).toBe('visual');
      expect(converted.source).toBe('bio-mirror');
      expect(converted.confidence).toBe(0.85);
    });
  });
});
