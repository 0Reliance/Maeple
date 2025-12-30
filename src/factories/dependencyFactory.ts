import { AppDependencies } from '../contexts/DependencyContext';
import {
  getVisionServiceAdapter,
  getAIServiceAdapter,
  getAuthServiceAdapter,
  getAudioServiceAdapter,
  getStorageServiceAdapter,
  getCacheServiceAdapter,
  getErrorLoggerAdapter,
  getAnalyticsServiceAdapter
} from '../adapters/serviceAdapters';

/**
 * Dependency Factory
 * 
 * Creates and manages application dependencies
 * Singleton pattern ensures single instance of each service
 */

export function createDependencies(): AppDependencies {
  return {
    visionService: getVisionServiceAdapter(),
    aiService: getAIServiceAdapter(),
    authService: getAuthServiceAdapter(),
    audioService: getAudioServiceAdapter(),
    storageService: getStorageServiceAdapter(),
    cacheService: getCacheServiceAdapter(),
    errorLogger: getErrorLoggerAdapter(),
    analyticsService: getAnalyticsServiceAdapter(),
  };
}

// Singleton instance
let dependenciesInstance: AppDependencies | null = null;

export function getDependencies(): AppDependencies {
  if (!dependenciesInstance) {
    dependenciesInstance = createDependencies();
  }
  return dependenciesInstance;
}

/**
 * Reset dependencies (for testing only)
 */
export function resetDependencies(): void {
  dependenciesInstance = null;
}