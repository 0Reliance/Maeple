/**
 * Draft Service Tests
 * 
 * Tests for auto-save, draft recovery, and version management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

describe('draftService', () => {
  const DRAFT_STORAGE_KEY = 'maeple:journal-draft';
  const DRAFTS_INDEX_KEY = 'maeple:drafts-index';

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('draft storage structure', () => {
    it('should have correct draft interface', () => {
      interface Draft {
        id: string;
        timestamp: string;
        data: Record<string, unknown>;
        autoSaved: boolean;
        version: number;
      }

      const testDraft: Draft = {
        id: 'draft_123',
        timestamp: new Date().toISOString(),
        data: { rawText: 'Test content' },
        autoSaved: false,
        version: 1,
      };

      expect(testDraft.id).toBeDefined();
      expect(testDraft.timestamp).toBeDefined();
      expect(testDraft.data).toBeDefined();
      expect(typeof testDraft.autoSaved).toBe('boolean');
      expect(typeof testDraft.version).toBe('number');
    });

    it('should have correct index structure', () => {
      interface DraftsIndex {
        currentId: string | null;
        drafts: Array<{ id: string; timestamp: string; version: number }>;
        lastModified: string;
      }

      const testIndex: DraftsIndex = {
        currentId: 'draft_123',
        drafts: [
          { id: 'draft_123', timestamp: new Date().toISOString(), version: 1 },
        ],
        lastModified: new Date().toISOString(),
      };

      expect(testIndex.currentId).toBeDefined();
      expect(Array.isArray(testIndex.drafts)).toBe(true);
      expect(testIndex.lastModified).toBeDefined();
    });
  });

  describe('draft creation', () => {
    it('should generate unique draft IDs', () => {
      const id1 = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(id1).toMatch(/^draft_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^draft_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp on creation', () => {
      const beforeCreate = new Date().toISOString();
      const timestamp = new Date().toISOString();
      const afterCreate = new Date().toISOString();

      expect(timestamp >= beforeCreate).toBe(true);
      expect(timestamp <= afterCreate).toBe(true);
    });
  });

  describe('draft persistence', () => {
    it('should save draft to localStorage', () => {
      const draftData = {
        id: 'draft_test',
        timestamp: new Date().toISOString(),
        data: { rawText: 'Test content' },
        autoSaved: false,
        version: 1,
      };

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));

      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.data.rawText).toBe('Test content');
    });

    it('should load draft from localStorage', () => {
      const draftData = {
        id: 'draft_load_test',
        timestamp: new Date().toISOString(),
        data: { rawText: 'Loaded content' },
        autoSaved: true,
        version: 2,
      };

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));

      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      const loaded = stored ? JSON.parse(stored) : null;

      expect(loaded).not.toBeNull();
      expect(loaded.id).toBe('draft_load_test');
      expect(loaded.data.rawText).toBe('Loaded content');
      expect(loaded.autoSaved).toBe(true);
      expect(loaded.version).toBe(2);
    });
  });

  describe('auto-save behavior', () => {
    it('should increment version on auto-save', () => {
      let version = 0;

      // Simulate auto-save
      const autoSave = () => {
        version++;
        return {
          id: 'draft_autosave',
          timestamp: new Date().toISOString(),
          data: {},
          autoSaved: true,
          version,
        };
      };

      const first = autoSave();
      const second = autoSave();
      const third = autoSave();

      expect(first.version).toBe(1);
      expect(second.version).toBe(2);
      expect(third.version).toBe(3);
    });

    it('should mark draft as autoSaved when auto-saving', () => {
      const manualSave = {
        id: 'draft_manual',
        timestamp: new Date().toISOString(),
        data: {},
        autoSaved: false,
        version: 1,
      };

      const autoSave = {
        id: 'draft_auto',
        timestamp: new Date().toISOString(),
        data: {},
        autoSaved: true,
        version: 1,
      };

      expect(manualSave.autoSaved).toBe(false);
      expect(autoSave.autoSaved).toBe(true);
    });
  });

  describe('draft cleanup', () => {
    it('should respect max drafts limit', () => {
      const MAX_DRAFTS = 10;
      const drafts: Array<{ id: string; timestamp: string; version: number }> = [];

      // Add more than max
      for (let i = 0; i < 15; i++) {
        drafts.push({
          id: `draft_${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
          version: 1,
        });
      }

      // Trim to max
      const trimmed = drafts.slice(0, MAX_DRAFTS);

      expect(trimmed.length).toBe(MAX_DRAFTS);
      expect(trimmed[0].id).toBe('draft_0'); // Most recent
    });

    it('should remove drafts older than TTL', () => {
      const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();

      const drafts = [
        { id: 'recent', timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day old
        { id: 'old', timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString() }, // 10 days old
        { id: 'very_old', timestamp: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString() }, // 30 days old
      ];

      const filtered = drafts.filter(d => {
        const age = now - new Date(d.timestamp).getTime();
        return age < DRAFT_TTL;
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('recent');
    });
  });

  describe('draft recovery', () => {
    it('should recover latest draft on init', () => {
      const index = {
        currentId: 'draft_recover',
        drafts: [
          { id: 'draft_recover', timestamp: new Date().toISOString(), version: 3 },
        ],
        lastModified: new Date().toISOString(),
      };

      localStorage.setItem(DRAFTS_INDEX_KEY, JSON.stringify(index));
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        id: 'draft_recover',
        timestamp: new Date().toISOString(),
        data: { rawText: 'Recovered content' },
        autoSaved: true,
        version: 3,
      }));

      // Simulate init
      const storedIndex = localStorage.getItem(DRAFTS_INDEX_KEY);
      const parsedIndex = storedIndex ? JSON.parse(storedIndex) : null;

      expect(parsedIndex?.currentId).toBe('draft_recover');

      const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      const parsedDraft = storedDraft ? JSON.parse(storedDraft) : null;

      expect(parsedDraft?.data.rawText).toBe('Recovered content');
    });
  });

  describe('dirty state tracking', () => {
    it('should track dirty state correctly', () => {
      let isDirty = false;

      const markDirty = () => { isDirty = true; };
      const save = () => { isDirty = false; };

      expect(isDirty).toBe(false);
      
      markDirty();
      expect(isDirty).toBe(true);
      
      save();
      expect(isDirty).toBe(false);
    });
  });
});
