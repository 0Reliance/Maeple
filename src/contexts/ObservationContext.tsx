/**
 * ObservationContext
 * 
 * Unified data flow for all observations (visual, audio, text).
 * Provides centralized state management for observations across the application.
 * Allows components to:
 * - Dispatch new observations (bio-mirror results, voice transcriptions, text notes)
 * - Subscribe to observation updates
 * - Query observations by type and time range
 * - Auto-correlate observations with journal entries
 * 
 * PERSISTENCE: Observations are persisted to localStorage and automatically
 * loaded on startup. Old observations (>24h) are cleaned up on load.
 */

import React, { createContext, useCallback, useEffect, useReducer } from 'react';
import { ObjectiveObservation, FacialAnalysis, Observation as BaseObservation } from '../types';

const STORAGE_KEY = 'maeple_observations';
const MAX_AGE_HOURS = 24; // Auto-cleanup observations older than this

export type ObservationType = 'visual' | 'audio' | 'text';
export type ObservationSource = 'bio-mirror' | 'voice' | 'text-input';

export interface StoredObservation extends ObjectiveObservation {
  id: string;
  storedAt: Date;
  correlatedEntryId?: string; // Links to journal entry timestamp
}

export interface ObservationContextType {
  observations: StoredObservation[];
  add: (obs: Omit<StoredObservation, 'id' | 'storedAt'>) => void;
  remove: (id: string) => void;
  update: (id: string, obs: Partial<StoredObservation>) => void;
  getByType: (type: ObservationType, timeRangeHours?: number) => StoredObservation[];
  getBySource: (source: ObservationSource) => StoredObservation[];
  getRecent: (count?: number) => StoredObservation[];
  clear: () => void;
  correlate: (observationId: string, entryId: string) => void;
}

interface ObservationAction {
  type: 'ADD' | 'REMOVE' | 'UPDATE' | 'CLEAR' | 'CORRELATE' | 'LOAD';
  payload: any;
}

/**
 * Load observations from localStorage, filtering out old ones
 */
const loadPersistedObservations = (): StoredObservation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored) as StoredObservation[];
    const cutoff = Date.now() - (MAX_AGE_HOURS * 60 * 60 * 1000);
    
    // Filter out old observations and rehydrate dates
    return parsed
      .map(obs => ({
        ...obs,
        storedAt: new Date(obs.storedAt),
      }))
      .filter(obs => obs.storedAt.getTime() > cutoff);
  } catch (e) {
    console.warn('[ObservationContext] Failed to load persisted observations:', e);
    return [];
  }
};

/**
 * Save observations to localStorage
 */
const persistObservations = (observations: StoredObservation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  } catch (e) {
    console.warn('[ObservationContext] Failed to persist observations:', e);
  }
};

const createInitialState = (): StoredObservation[] => loadPersistedObservations();

const observationReducer = (state: StoredObservation[], action: ObservationAction): StoredObservation[] => {
  let newState: StoredObservation[];
  
  switch (action.type) {
    case 'LOAD': {
      return action.payload;
    }
    case 'ADD': {
      const newObs: StoredObservation = {
        ...action.payload,
        id: action.payload.id || `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        storedAt: action.payload.storedAt || new Date(),
      };
      newState = [newObs, ...state];
      persistObservations(newState);
      return newState;
    }
    case 'REMOVE': {
      newState = state.filter(obs => obs.id !== action.payload);
      persistObservations(newState);
      return newState;
    }
    case 'UPDATE': {
      newState = state.map(obs =>
        obs.id === action.payload.id ? { ...obs, ...action.payload.updates } : obs
      );
      persistObservations(newState);
      return newState;
    }
    case 'CORRELATE': {
      const { observationId, entryId } = action.payload;
      newState = state.map(obs =>
        obs.id === observationId ? { ...obs, correlatedEntryId: entryId } : obs
      );
      persistObservations(newState);
      return newState;
    }
    case 'CLEAR': {
      persistObservations([]);
      return [];
    }
    default: {
      return state;
    }
  }
};

export const ObservationContext = createContext<ObservationContextType | undefined>(undefined);

interface ObservationProviderProps {
  children: React.ReactNode;
}

export const ObservationProvider: React.FC<ObservationProviderProps> = ({ children }) => {
  const [observations, dispatch] = useReducer(observationReducer, createInitialState());

  const add = useCallback(
    (obs: Omit<StoredObservation, 'id' | 'storedAt'>) => {
      dispatch({
        type: 'ADD',
        payload: obs,
      });
    },
    []
  );

  const remove = useCallback((id: string) => {
    dispatch({
      type: 'REMOVE',
      payload: id,
    });
  }, []);

  const update = useCallback((id: string, obs: Partial<StoredObservation>) => {
    dispatch({
      type: 'UPDATE',
      payload: { id, updates: obs },
    });
  }, []);

  const getByType = useCallback(
    (type: ObservationType, timeRangeHours = 24): StoredObservation[] => {
      const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
      return observations.filter(
        obs => obs.type === type && obs.storedAt > cutoffTime
      );
    },
    [observations]
  );

  const getBySource = useCallback(
    (source: ObservationSource): StoredObservation[] => {
      return observations.filter(obs => obs.source === source);
    },
    [observations]
  );

  const getRecent = useCallback(
    (count = 10): StoredObservation[] => {
      return observations.slice(0, count);
    },
    [observations]
  );

  const clear = useCallback(() => {
    dispatch({
      type: 'CLEAR',
      payload: null,
    });
  }, []);

  const correlate = useCallback((observationId: string, entryId: string) => {
    dispatch({
      type: 'CORRELATE',
      payload: { observationId, entryId },
    });
  }, []);

  const value: ObservationContextType = {
    observations,
    add,
    remove,
    update,
    getByType,
    getBySource,
    getRecent,
    clear,
    correlate,
  };

  return (
    <ObservationContext.Provider value={value}>
      {children}
    </ObservationContext.Provider>
  );
};

/**
 * Hook to use observations context
 */
export const useObservations = (): ObservationContextType => {
  const context = React.useContext(ObservationContext);
  if (!context) {
    throw new Error('useObservations must be used within ObservationProvider');
  }
  return context;
};

/**
 * Helper function to convert FacialAnalysis from Bio-Mirror to ObjectiveObservation
 */
export const faceAnalysisToObservation = (
  analysis: FacialAnalysis
): Omit<StoredObservation, 'id' | 'storedAt'> => {
  // Map FacialAnalysis observations to standard Observation format
  const observations: BaseObservation[] = analysis.observations.map(obs => {
    // Map facial analysis categories to standard observation categories
    let category: 'tension' | 'fatigue' | 'lighting' | 'noise' | 'speech-pace' | 'tone' = 'tension';
    
    switch (obs.category) {
      case 'tension':
        category = 'tension';
        break;
      case 'fatigue':
        category = 'fatigue';
        break;
      case 'lighting':
        category = 'lighting';
        break;
      case 'environmental':
        // Environmental clues map to lighting or tension depending on context
        category = obs.value.includes('light') ? 'lighting' : 'tension';
        break;
    }

    return {
      category,
      value: obs.value,
      severity: analysis.lightingSeverity || 'moderate',
      evidence: obs.evidence,
    };
  });

  return {
    type: 'visual',
    source: 'bio-mirror',
    observations,
    confidence: analysis.confidence || 0,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Helper function to create a text observation from journal/voice
 */
export const createTextObservation = (
  text: string,
  source: Extract<ObservationSource, 'voice' | 'text-input'> = 'text-input',
  confidence = 1.0
): Omit<StoredObservation, 'id' | 'storedAt'> => {
  // Create a basic observation entry for text
  const observations: BaseObservation[] = [
    {
      category: 'tension', // Default category for text
      value: text,
      severity: 'moderate',
      evidence: 'User provided text',
    }
  ];

  return {
    type: 'text',
    source,
    observations,
    confidence,
    timestamp: new Date().toISOString(),
  };
};
