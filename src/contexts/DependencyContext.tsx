import { createContext, FC, ReactNode, useContext } from "react";
import { CircuitState } from "../patterns/CircuitBreaker";

/**
 * Dependency Injection Context
 *
 * Provides all application dependencies through context
 * Enables testability by allowing mock implementations
 * Clear dependency graph for better architecture
 */

// Service Interfaces
export interface VisionServiceOptions {
  onProgress?: (stage: string, progress: number) => void;
  signal?: AbortSignal;
}

export interface VisionService {
  analyzeFromImage(imageData: string, options?: VisionServiceOptions): Promise<any>;
  generateImage(prompt: string, base64Image?: string): Promise<any>;
  getState(): CircuitState;
  onStateChange(callback: (state: CircuitState) => void): () => void;
}

export interface AIService {
  analyze(prompt: string, options?: any): Promise<any>;
  generateResponse(prompt: string, options?: any): Promise<any>;
  analyzeAudio(audioData: string, mimeType: string, prompt?: string): Promise<any>;
  getState(): CircuitState;
  onStateChange(callback: (state: CircuitState) => void): () => void;
}

export interface AuthService {
  login(email: string, password: string): Promise<any>;
  logout(): Promise<void>;
}

export interface AudioService {
  analyzeAudio(audioData: Blob | string): Promise<any>;
  analyzeMultiple(audioData: (Blob | string)[]): Promise<any[]>;
}

export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ErrorLoggerService {
  error(message: string, details?: any): void;
  warning(message: string, details?: any): void;
  info(message: string, details?: any): void;
  getStats(): any;
}

export interface AnalyticsService {
  trackEvent(name: string, properties?: any): void;
  trackPageView(page: string): void;
  trackError(error: Error, context?: any): void;
}

// Dependencies interface
export interface AppDependencies {
  visionService: VisionService;
  aiService: AIService;
  authService: AuthService;
  audioService: AudioService;
  storageService: StorageService;
  cacheService: CacheService;
  errorLogger: ErrorLoggerService;
  analyticsService: AnalyticsService;
}

// Context definition
const DependencyContext = createContext<AppDependencies | null>(null);

// Provider component
interface DependencyProviderProps {
  dependencies: AppDependencies;
  children: ReactNode;
}

export const DependencyProvider: FC<DependencyProviderProps> = ({ dependencies, children }) => {
  return <DependencyContext.Provider value={dependencies}>{children}</DependencyContext.Provider>;
};

// Hook to use dependencies
export function useDependencies(): AppDependencies {
  const dependencies = useContext(DependencyContext);

  if (!dependencies) {
    throw new Error(
      "useDependencies must be used within a DependencyProvider. " +
        "Make sure your app is wrapped with <DependencyProvider>."
    );
  }

  return dependencies;
}

// Convenience hooks for individual services
export function useVisionService(): VisionService {
  const { visionService } = useDependencies();
  return visionService;
}

export function useAIService(): AIService {
  const { aiService } = useDependencies();
  return aiService;
}

export function useAuthService(): AuthService {
  const { authService } = useDependencies();
  return authService;
}

export function useAudioService(): AudioService {
  const { audioService } = useDependencies();
  return audioService;
}

export function useStorageService(): StorageService {
  const { storageService } = useDependencies();
  return storageService;
}

export function useCacheService(): CacheService {
  const { cacheService } = useDependencies();
  return cacheService;
}

export function useErrorLogger(): ErrorLoggerService {
  const { errorLogger } = useDependencies();
  return errorLogger;
}

export function useAnalyticsService(): AnalyticsService {
  const { analyticsService } = useDependencies();
  return analyticsService;
}
