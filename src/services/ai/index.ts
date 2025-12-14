/**
 * AI Services - Main Index
 * 
 * Unified export for all AI-related services
 */

// Types
export * from './types';
import { AITextRequest } from './types';

// Router
export { aiRouter } from './router';

// Settings
export { aiSettingsService } from './settingsService';

import { aiSettingsService } from './settingsService';
import { aiRouter } from './router';

// Initialize AI services - call this at app startup
export async function initializeAI(): Promise<void> {
  await aiSettingsService.initialize();
  aiRouter.initialize(aiSettingsService.getSettings());
}

// Convenience functions
export function isAIAvailable(): boolean {
  return aiRouter.isAIAvailable();
}

export function canGenerateText(): boolean {
  return aiRouter.hasCapability('text');
}

export function canAnalyzeImages(): boolean {
  return aiRouter.hasCapability('vision');
}

export function canGenerateImages(): boolean {
  return aiRouter.hasCapability('image_gen');
}

export function canSearch(): boolean {
  return aiRouter.hasCapability('search');
}

export function canUseAudio(): boolean {
  return aiRouter.hasCapability('audio');
}

// Audio streaming convenience function
export async function streamAudio(request: AITextRequest): Promise<AsyncGenerator<string, void, unknown>> {
  const stream = await aiRouter.streamAudio(request);
  if (!stream) {
    throw new Error('No audio-capable provider available');
  }
  return stream;
}
