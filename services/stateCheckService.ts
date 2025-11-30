
import { StateCheck } from '../types';
import { encryptData, decryptData } from './encryptionService';

const DB_NAME = 'pozimind_db';
const STORE_NAME = 'state_checks';
const DB_VERSION = 1;

// Open DB Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
  
  // Convert blob to ArrayBuffer for storage if needed, or store Blob directly
  // IndexedDB handles Blobs natively in modern browsers
  
  // Encrypt the analysis data before storage
  const { cipher, iv } = await encryptData(data.analysis);
  
  const record = {
    ...data,
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

    request.onsuccess = () => resolve(data.id as string);
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
      const analysis = await decryptData(record.analysisCipher, record.iv);
      
      // Convert Blob to Base64 URL for display if needed
      let imageBase64 = undefined;
      if (record.imageBlob) {
         // In a real app, we'd likely use URL.createObjectURL(record.imageBlob)
         // For simplicity and compatibility with our types, we might leave it or convert
      }

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
