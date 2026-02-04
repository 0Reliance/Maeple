import { FacialAnalysis, FacialBaseline, StateCheck } from "../types";
import { decryptData, encryptData } from "./encryptionService";
import { errorLogger } from "./errorLogger";
import { validateFacialAnalysis } from "./validationService";

const MAX_RETRIES = 3;
const RETRY_DELAY = 100;

const DB_NAME = "maeple_db";
const STORE_NAME = "state_checks";
const BASELINE_STORE_NAME = "facial_baseline";
const DB_VERSION = 2;

const looksLikeFacialAnalysisPayload = (data: unknown): boolean => {
  if (data === null || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.confidence === "number" &&
    (Array.isArray(d.observations) || Array.isArray(d.actionUnits))
  );
};

const coerceFacialAnalysis = (
  data: unknown,
  context: { stateCheckId: string; source: string }
): FacialAnalysis => {
  const likelyValid = looksLikeFacialAnalysisPayload(data);
  const validated = validateFacialAnalysis(data);

  if (!likelyValid) {
    errorLogger.warning("StateCheck analysis failed runtime validation; using sanitized defaults", {
      stateCheckId: context.stateCheckId,
      source: context.source,
    });
  }

  return validated;
};

async function withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      errorLogger.warning(`${operationName} failed, attempt ${attempt}/${MAX_RETRIES}`, {
        error: lastError.message,
        willRetry: attempt < MAX_RETRIES,
      });

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt - 1)));
      }
    }
  }

  errorLogger.error(`${operationName} failed after ${MAX_RETRIES} attempts`, {
    error: lastError?.message,
  });
  throw lastError;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(BASELINE_STORE_NAME)) {
        db.createObjectStore(BASELINE_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const saveStateCheck = async (
  data: Partial<StateCheck>,
  imageBlob?: Blob
): Promise<string> => {
  return withRetry(async () => {
    console.log('[saveStateCheck] === SAVE OPERATION START ===');
    console.log('[saveStateCheck] Input data:', {
      id: data.id,
      hasAnalysis: !!data.analysis,
      actionUnitsCount: data.analysis?.actionUnits?.length || 0,
      hasBlob: !!imageBlob,
      blobSize: imageBlob?.size || 0
    });
    
    const db = await openDB();
    const id = data.id || `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[saveStateCheck] Coercing facial analysis...');
    const analysisToEncrypt = coerceFacialAnalysis(data.analysis, {
      stateCheckId: id,
      source: "saveStateCheck",
    });
    
    console.log('[saveStateCheck] Coerced analysis:', {
      actionUnitsCount: analysisToEncrypt.actionUnits?.length || 0,
      confidence: analysisToEncrypt.confidence,
      hasFacsInterpretation: !!analysisToEncrypt.facsInterpretation,
      jawTension: analysisToEncrypt.jawTension,
      eyeFatigue: analysisToEncrypt.eyeFatigue
    });
    
    console.log('[saveStateCheck] Encrypting analysis...');
    const { cipher, iv } = await encryptData(analysisToEncrypt);
    console.log('[saveStateCheck] Encryption complete, cipher length:', cipher.length);

    const record = {
      ...data,
      id,
      analysisCipher: cipher,
      iv: iv,
      imageBlob: imageBlob || null,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    delete (record as any).analysis;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }, "saveStateCheck");
};

export const getStateCheck = async (id: string): Promise<StateCheck | null> => {
  return withRetry(async () => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = async () => {
        const record = request.result;
        if (!record) {
          resolve(null);
          return;
        }

        const decrypted = await decryptData(record.analysisCipher, record.iv);
        const analysis = coerceFacialAnalysis(decrypted, {
          stateCheckId: record.id,
          source: "getStateCheck",
        });

        resolve({
          id: record.id,
          timestamp: record.timestamp,
          analysis: analysis,
          userNote: record.userNote,
        });
      };
      request.onerror = () => reject(request.error);
    });
  }, "getStateCheck");
};

export const getRecentStateChecks = async (limit: number = 7): Promise<StateCheck[]> => {
  return withRetry(async () => {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const records = request.result || [];
        const sorted = records
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        const results: StateCheck[] = [];
        for (const rec of sorted) {
          try {
            const decrypted = await decryptData(rec.analysisCipher, rec.iv);
            const analysis = coerceFacialAnalysis(decrypted, {
              stateCheckId: rec.id,
              source: "getRecentStateChecks",
            });
            results.push({
              id: rec.id,
              timestamp: rec.timestamp,
              analysis: analysis,
              userNote: rec.userNote,
            });
          } catch (e) {
            errorLogger.warning("Failed to decrypt state check record", {
              stateCheckId: rec.id,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }, "getRecentStateChecks");
};

export const saveBaseline = async (baseline: FacialBaseline): Promise<void> => {
  return withRetry(async () => {
    const db = await openDB();
    const record = { ...baseline, id: "USER_BASELINE" };

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([BASELINE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(BASELINE_STORE_NAME);
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }, "saveBaseline");
};

export const getBaseline = async (): Promise<FacialBaseline | null> => {
  return withRetry(async () => {
    const db = await openDB();

    return new Promise<FacialBaseline | null>((resolve, reject) => {
      const transaction = db.transaction([BASELINE_STORE_NAME], "readonly");
      const store = transaction.objectStore(BASELINE_STORE_NAME);
      const request = store.get("USER_BASELINE");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }, "getBaseline");
};
