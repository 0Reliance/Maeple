
import { StateCheck, FacialBaseline, FacialAnalysis } from '../types';
import { encryptData, decryptData } from './encryptionService';

const DB_NAME = 'maeple_db';
const STORE_NAME = 'state_checks';
const BASELINE_STORE_NAME = 'facial_baseline';
const DB_VERSION = 2; // Incremented for new store

// Default/fallback analysis when decryption fails
const defaultAnalysis: FacialAnalysis = {
  primaryEmotion: 'unknown',
  confidence: 0,
  eyeFatigue: 0,
  jawTension: 0,
  maskingScore: 0,
  signs: [],
};

// Type guard to check if decrypted data is a valid FacialAnalysis
const isFacialAnalysis = (data: unknown): data is FacialAnalysis => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'primaryEmotion' in data &&
    'confidence' in data
  );
};

// Open DB Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BASELINE_STORE_NAME)) {
        db.createObjectStore(BASELINE_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveStateCheck = async (
  data: Partial<StateCheck>,
  imageBlob?: Blob
): Promise<string> => {
  const db = await openDB();
  
  // Generate ID if not provided
  const id = data.id || `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Encrypt the analysis data before storage
  const { cipher, iv } = await encryptData(data.analysis);
  
  const record = {
    ...data,
    id, // Ensure ID is always present
    analysisCipher: cipher, // Store encrypted analysis
    iv: iv,
    imageBlob: imageBlob || null, // Store raw image blob
    timestamp: data.timestamp || new Date().toISOString()
  };
  
  // Remove raw analysis from storage object to be safe
  delete (record as any).analysis;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(id); // Return guaranteed ID
    request.onerror = () => reject(request.error);
  });
};

export const getStateCheck = async (id: string): Promise<StateCheck | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = async () => {
      const record = request.result;
      if (!record) {
        resolve(null);
        return;
      }

      // Decrypt
      const decrypted = await decryptData(record.analysisCipher, record.iv);
      const analysis = isFacialAnalysis(decrypted) ? decrypted : defaultAnalysis;
      
      resolve({
        id: record.id,
        timestamp: record.timestamp,
        analysis: analysis,
        userNote: record.userNote
        // imageBase64 would need to be loaded separately or converted if needed immediately
      });
    };
    request.onerror = () => reject(request.error);
  });
};

export const getRecentStateChecks = async (limit: number = 7): Promise<StateCheck[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll(); 

    request.onsuccess = async () => {
      const records = request.result || [];
      // Sort by date desc
      const sorted = records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);

      // Decrypt all
      const results: StateCheck[] = [];
      for (const rec of sorted) {
          try {
              const decrypted = await decryptData(rec.analysisCipher, rec.iv);
              const analysis = isFacialAnalysis(decrypted) ? decrypted : defaultAnalysis;
              results.push({
                  id: rec.id,
                  timestamp: rec.timestamp,
                  analysis: analysis,
                  userNote: rec.userNote
              });
          } catch (e) {
              console.error("Failed to decrypt record", rec.id);
          }
      }
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
};

// --- BASELINE METHODS ---

export const saveBaseline = async (baseline: FacialBaseline): Promise<void> => {
    const db = await openDB();
    // We only keep one baseline for now, mapped to ID 'USER_BASELINE'
    const record = { ...baseline, id: 'USER_BASELINE' };
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BASELINE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(BASELINE_STORE_NAME);
        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getBaseline = async (): Promise<FacialBaseline | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BASELINE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(BASELINE_STORE_NAME);
        const request = store.get('USER_BASELINE');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};
