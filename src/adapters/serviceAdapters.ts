import {
  AIService,
  AnalyticsService,
  AudioService,
  AuthService,
  CacheService,
  ErrorLoggerService,
  StorageService,
  VisionService,
} from "../contexts/DependencyContext";

import { CircuitState, createCircuitBreaker } from "../patterns/CircuitBreaker";
import { signInWithEmail, signOut } from "../services/authService";
import { cacheService } from "../services/cacheService";
import { errorLogger } from "../services/errorLogger";

/**
 * Service Adapters
 *
 * Wraps existing services to match DI interfaces
 * Enables gradual migration to proper DI
 */

// Vision Service Adapter with Circuit Breaker
export class VisionServiceAdapter implements VisionService {
  private stateChangeListeners: Set<(state: CircuitState) => void> = new Set();

  private circuitBreaker = createCircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    resetTimeout: 60000,
    onStateChange: state => {
      console.debug("[VisionService] Circuit state:", state);
      // Notify all subscribers
      this.stateChangeListeners.forEach(listener => listener(state));
    },
  });

  async analyzeFromImage(
    imageData: string,
    options?: { onProgress?: (stage: string, progress: number) => void; signal?: AbortSignal }
  ): Promise<any> {
    console.log("[VisionServiceAdapter] analyzeFromImage called");
    console.log("[VisionServiceAdapter] Image data length:", imageData.length);
    console.log("[VisionServiceAdapter] Options:", options);
    
    return this.circuitBreaker.execute(async () => {
      console.log("[VisionServiceAdapter] Circuit breaker passed, importing vision service");
      const geminiVisionService = await import("../services/geminiVisionService");
      console.log("[VisionServiceAdapter] Vision service imported, calling analyzeStateFromImage");
      
      const result = await geminiVisionService.analyzeStateFromImage(imageData, options);
      console.log("[VisionServiceAdapter] Analysis result:", result);
      console.log("[VisionServiceAdapter] Result confidence:", result?.confidence);
      console.log("[VisionServiceAdapter] Action Units count:", result?.actionUnits?.length);
      
      return result;
    });
  }

  async generateImage(prompt: string, base64Image?: string): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      const geminiVisionService = await import("../services/geminiVisionService");
      return geminiVisionService.generateOrEditImage(prompt, base64Image);
    });
  }

  getState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  onStateChange(callback: (state: CircuitState) => void): () => void {
    this.stateChangeListeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }
}

// AI Service Adapter with Circuit Breaker
export class AIServiceAdapter implements AIService {
  private stateChangeListeners: Set<(state: CircuitState) => void> = new Set();

  private circuitBreaker = createCircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    resetTimeout: 60000,
    onStateChange: state => {
      console.debug("[AIService] Circuit state:", state);
      // Notify all subscribers
      this.stateChangeListeners.forEach(listener => listener(state));
    },
  });

  async analyze(prompt: string, options?: any): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      const { aiRouter } = await import("../services/ai/router");
      // AI Router uses 'chat' method for text analysis
      return aiRouter.chat({
        messages: [{ role: "user", content: prompt }],
        ...options,
      });
    });
  }

  async generateResponse(prompt: string, options?: any): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      const { aiRouter } = await import("../services/ai/router");
      // Use chat method for generating responses
      return aiRouter.chat({
        messages: [{ role: "user", content: prompt }],
        ...options,
      });
    });
  }

  async analyzeAudio(audioData: string, mimeType: string, prompt?: string): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      const { aiRouter } = await import("../services/ai/router");
      // Route to audio analysis via aiRouter
      return aiRouter.analyzeAudio({
        audioData,
        mimeType,
        prompt: prompt || "Analyze this audio journal entry",
      });
    });
  }

  getState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  onStateChange(callback: (state: CircuitState) => void): () => void {
    this.stateChangeListeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }
}

// Audio Service Adapter with Batching
export class AudioServiceAdapter implements AudioService {
  private batcher: any = null;
  private audioServicePromise: Promise<any> | null = null;

  private async getService() {
    if (!this.audioServicePromise) {
      this.audioServicePromise = import("../services/audioAnalysisService");
    }
    return (await this.audioServicePromise).analyzeAudio;
  }

  async analyzeAudio(audioData: Blob | string): Promise<any> {
    const analyzeAudio = await this.getService();
    return analyzeAudio(audioData);
  }

  async analyzeMultiple(audioData: (Blob | string)[]): Promise<any[]> {
    // Batch processing - analyze all in parallel
    const analyzeAudio = await this.getService();
    return Promise.all(audioData.map(data => analyzeAudio(data)));
  }
}

// Auth Service Adapter
export class AuthServiceAdapter implements AuthService {
  async login(email: string, password: string): Promise<any> {
    return signInWithEmail(email, password);
  }

  async logout(): Promise<void> {
    const result = await signOut();
    if (result.error) {
      throw result.error;
    }
  }
}

// Storage Service Adapter (using localStorage directly)
export class StorageServiceAdapter implements StorageService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

// Cache Service Adapter
export class CacheServiceAdapter implements CacheService {
  async get<T>(key: string): Promise<T | null> {
    return cacheService.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl !== undefined) {
      return cacheService.set(key, value, { ttl });
    }
    return cacheService.set(key, value);
  }

  async delete(key: string): Promise<void> {
    return cacheService.delete(key);
  }

  async clear(): Promise<void> {
    return cacheService.clear();
  }
}

// Error Logger Adapter
export class ErrorLoggerAdapter implements ErrorLoggerService {
  error(message: string, details?: any): void {
    errorLogger.error(message, details);
  }

  warning(message: string, details?: any): void {
    errorLogger.warning(message, details);
  }

  info(message: string, details?: any): void {
    errorLogger.info(message, details);
  }

  getStats(): any {
    return errorLogger.getStats();
  }
}

// Analytics Service Adapter (stub - no real analytics service)
export class AnalyticsServiceAdapter implements AnalyticsService {
  trackEvent(name: string, properties?: any): void {
    // Stub - analytics tracking not implemented
    console.debug("[Analytics] Event:", name, properties);
  }

  trackPageView(page: string): void {
    // Stub - page view tracking not implemented
    console.debug("[Analytics] Page view:", page);
  }

  trackError(error: Error, context?: any): void {
    // Stub - error tracking not implemented
    console.debug("[Analytics] Error:", error, context);
  }
}

// Singleton instances
let visionServiceInstance: VisionServiceAdapter | null = null;
let aiServiceInstance: AIServiceAdapter | null = null;
let authServiceInstance: AuthServiceAdapter | null = null;
let audioServiceInstance: AudioServiceAdapter | null = null;
let storageServiceInstance: StorageServiceAdapter | null = null;
let cacheServiceInstance: CacheServiceAdapter | null = null;
let errorLoggerInstance: ErrorLoggerAdapter | null = null;
let analyticsServiceInstance: AnalyticsServiceAdapter | null = null;

// Getters
export function getVisionServiceAdapter(): VisionServiceAdapter {
  if (!visionServiceInstance) {
    visionServiceInstance = new VisionServiceAdapter();
  }
  return visionServiceInstance;
}

export function getAIServiceAdapter(): AIServiceAdapter {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIServiceAdapter();
  }
  return aiServiceInstance;
}

export function getAuthServiceAdapter(): AuthServiceAdapter {
  if (!authServiceInstance) {
    authServiceInstance = new AuthServiceAdapter();
  }
  return authServiceInstance;
}

export function getAudioServiceAdapter(): AudioServiceAdapter {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioServiceAdapter();
  }
  return audioServiceInstance;
}

export function getStorageServiceAdapter(): StorageServiceAdapter {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageServiceAdapter();
  }
  return storageServiceInstance;
}

export function getCacheServiceAdapter(): CacheServiceAdapter {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheServiceAdapter();
  }
  return cacheServiceInstance;
}

export function getErrorLoggerAdapter(): ErrorLoggerAdapter {
  if (!errorLoggerInstance) {
    errorLoggerInstance = new ErrorLoggerAdapter();
  }
  return errorLoggerInstance;
}

export function getAnalyticsServiceAdapter(): AnalyticsServiceAdapter {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsServiceAdapter();
  }
  return analyticsServiceInstance;
}