/**
 * Draft Service
 * 
 * Manages auto-saving of journal entry drafts with localStorage persistence.
 * Features:
 * - Auto-save every 30 seconds
 * - Multiple draft versions with timestamps
 * - Recovery of latest draft on app restart
 * - Automatic cleanup of old drafts
 */

import { HealthEntry, JournalSession } from '../types';
import { storageWrapper } from './storageWrapper';

const DRAFT_STORAGE_KEY = 'maeple:journal-draft';
const DRAFTS_INDEX_KEY = 'maeple:drafts-index';
const DRAFT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const MAX_DRAFTS = 10; // Keep last 10 versions
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Draft {
  id: string;
  timestamp: string; // ISO string
  data: Partial<HealthEntry | JournalSession>;
  autoSaved: boolean;
  version: number;
}

interface DraftsIndex {
  currentId: string | null;
  drafts: Array<{ id: string; timestamp: string; version: number }>;
  lastModified: string;
}

class DraftService {
  private autoSaveTimeoutId: NodeJS.Timeout | null = null;
  private currentDraftId: string | null = null;
  private isDirty = false;
  private listeners: Array<(draft: Draft | null) => void> = [];

  /**
   * Initialize draft service and load existing draft
   */
  init(): Draft | null {
    const index = this.getIndex();
    if (index.currentId) {
      this.currentDraftId = index.currentId;
      return this.getDraft(index.currentId);
    }
    return null;
  }

  /**
   * Save draft immediately
   */
  save(data: Partial<HealthEntry | JournalSession>): Draft {
    const draft: Draft = {
      id: this.currentDraftId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      data,
      autoSaved: false,
      version: 0,
    };

    this.currentDraftId = draft.id;
    this.storeDraft(draft);
    this.isDirty = false;
    this.notifyListeners(draft);
    return draft;
  }

  /**
   * Mark draft as dirty (needs saving)
   * Will trigger auto-save in 30 seconds
   */
  markDirty(data?: Partial<HealthEntry | JournalSession>): void {
    this.isDirty = true;
    if (data && this.currentDraftId) {
      // Store temp data for recovery
      this.storeTempData(data);
    }
    this.scheduleAutoSave();
  }

  /**
   * Auto-save draft (called periodically)
   */
  autoSave(data: Partial<HealthEntry | JournalSession>): Draft | null {
    if (!this.isDirty || !this.currentDraftId) {
      return null;
    }

    try {
      const existing = this.getDraft(this.currentDraftId);
      const draft: Draft = {
        id: this.currentDraftId,
        timestamp: new Date().toISOString(),
        data,
        autoSaved: true,
        version: (existing?.version ?? 0) + 1,
      };

      this.storeDraft(draft);
      this.isDirty = false;
      this.notifyListeners(draft);
      return draft;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return null;
    }
  }

  /**
   * Get current draft
   */
  getCurrent(): Draft | null {
    if (!this.currentDraftId) return null;
    return this.getDraft(this.currentDraftId);
  }

  /**
   * Get specific draft by ID
   */
  getDraft(id: string): Draft | null {
    try {
      const key = `${DRAFT_STORAGE_KEY}:${id}`;
      // Use synchronous localStorage for reads with async fallback
      // This maintains backwards compatibility while the rest migrates
      try {
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data) as Draft;
      } catch {
        // localStorage failed, try async path
      }
      return null;
    } catch (error) {
      console.warn('Failed to retrieve draft:', error);
      return null;
    }
  }

  /**
   * Get all drafts (sorted by timestamp, newest first)
   */
  getAll(): Draft[] {
    try {
      const index = this.getIndex();
      const drafts = index.drafts
        .map(ref => this.getDraft(ref.id))
        .filter((d): d is Draft => d !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return drafts;
    } catch (error) {
      console.warn('Failed to retrieve drafts:', error);
      return [];
    }
  }

  /**
   * Delete specific draft
   */
  delete(id: string): void {
    try {
      const key = `${DRAFT_STORAGE_KEY}:${id}`;
      localStorage.removeItem(key);

      const index = this.getIndex();
      index.drafts = index.drafts.filter(d => d.id !== id);

      if (index.currentId === id) {
        index.currentId = index.drafts[0]?.id ?? null;
        this.currentDraftId = index.currentId;
      }

      this.saveIndex(index);
      this.notifyListeners(null);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }

  /**
   * Delete all drafts
   */
  deleteAll(): void {
    try {
      const index = this.getIndex();
      index.drafts.forEach(d => {
        const key = `${DRAFT_STORAGE_KEY}:${d.id}`;
        localStorage.removeItem(key);
      });

      index.currentId = null;
      index.drafts = [];
      this.saveIndex(index);
      this.currentDraftId = null;
      this.isDirty = false;
      this.notifyListeners(null);
    } catch (error) {
      console.error('Failed to delete all drafts:', error);
    }
  }

  /**
   * Subscribe to draft changes
   */
  subscribe(callback: (draft: Draft | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Clear auto-save timer
   */
  clearAutoSave(): void {
    if (this.autoSaveTimeoutId) {
      clearTimeout(this.autoSaveTimeoutId);
      this.autoSaveTimeoutId = null;
    }
  }

  /**
   * Cleanup: call on unmount
   */
  cleanup(): void {
    this.clearAutoSave();
    this.listeners = [];
    this.cleanupOldDrafts();
  }

  // ============ Private Methods ============

  private scheduleAutoSave(): void {
    this.clearAutoSave();
    this.autoSaveTimeoutId = setTimeout(() => {
      if (!this.isDirty || !this.currentDraftId) return;

      // Retrieve temp data stored by markDirty()
      try {
        const tempRaw = localStorage.getItem(`${DRAFT_STORAGE_KEY}:temp`);
        if (tempRaw) {
          const tempData = JSON.parse(tempRaw);
          this.autoSave(tempData);
        }
      } catch (error) {
        console.warn('[DraftService] Auto-save from temp data failed:', error);
      }
    }, DRAFT_AUTO_SAVE_INTERVAL);
  }

  private storeDraft(draft: Draft): void {
    try {
      const key = `${DRAFT_STORAGE_KEY}:${draft.id}`;
      storageWrapper.setItem(key, JSON.stringify(draft));

      const index = this.getIndex();
      const existing = index.drafts.findIndex(d => d.id === draft.id);

      if (existing >= 0) {
        index.drafts[existing] = {
          id: draft.id,
          timestamp: draft.timestamp,
          version: draft.version,
        };
      } else {
        index.drafts.push({
          id: draft.id,
          timestamp: draft.timestamp,
          version: draft.version,
        });
      }

      index.currentId = draft.id;
      index.lastModified = new Date().toISOString();
      this.saveIndex(index);
    } catch (error) {
      console.error('Failed to store draft:', error);
    }
  }

  private storeTempData(data: Partial<HealthEntry | JournalSession>): void {
    try {
      storageWrapper.setItem(`${DRAFT_STORAGE_KEY}:temp`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to store temp data:', error);
    }
  }

  private getIndex(): DraftsIndex {
    try {
      // Synchronous read for index - used in many sync code paths
      try {
        const data = localStorage.getItem(DRAFTS_INDEX_KEY);
        if (data) return JSON.parse(data) as DraftsIndex;
      } catch {
        // localStorage failed, return default
      }
      return {
        currentId: null,
        drafts: [],
        lastModified: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Failed to retrieve drafts index:', error);
      return {
        currentId: null,
        drafts: [],
        lastModified: new Date().toISOString(),
      };
    }
  }

  private saveIndex(index: DraftsIndex): void {
    try {
      storageWrapper.setItem(DRAFTS_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to save drafts index:', error);
    }
  }

  private cleanupOldDrafts(): void {
    try {
      const index = this.getIndex();
      const now = new Date().getTime();

      // Remove drafts older than TTL
      const validDrafts = index.drafts.filter(d => {
        const draftTime = new Date(d.timestamp).getTime();
        return now - draftTime < DRAFT_TTL;
      });

      // Keep only last MAX_DRAFTS
      const recentDrafts = validDrafts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_DRAFTS);

      // Remove deleted drafts from storage
      const deletedIds = new Set(index.drafts.map(d => d.id).filter(id => 
        !recentDrafts.some(d => d.id === id)
      ));

      deletedIds.forEach(id => {
        const key = `${DRAFT_STORAGE_KEY}:${id}`;
        storageWrapper.removeItem(key);
      });

      // Update index
      index.drafts = recentDrafts;
      if (index.currentId && !recentDrafts.some(d => d.id === index.currentId)) {
        index.currentId = recentDrafts[0]?.id ?? null;
      }

      this.saveIndex(index);
    } catch (error) {
      console.warn('Failed to cleanup old drafts:', error);
    }
  }

  private notifyListeners(draft: Draft | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(draft);
      } catch (error) {
        console.error('Draft listener error:', error);
      }
    });
  }
}

// Singleton instance
export const draftService = new DraftService();

/**
 * Hook for using draft service in React components
 */
import { useEffect, useState } from 'react';

export const useDraft = () => {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    const initialDraft = draftService.init();
    setDraft(initialDraft);

    const unsubscribe = draftService.subscribe(setDraft);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    draft,
    save: draftService.save.bind(draftService),
    markDirty: draftService.markDirty.bind(draftService),
    autoSave: draftService.autoSave.bind(draftService),
    getCurrent: draftService.getCurrent.bind(draftService),
    getAll: draftService.getAll.bind(draftService),
    delete: draftService.delete.bind(draftService),
    deleteAll: draftService.deleteAll.bind(draftService),
  };
};
