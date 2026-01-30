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
  console.log("[AI] ===== INITIALIZE AI SERVICES START =====");
  
  console.log("[AI] Step 1: Initialize settings service...");
  await aiSettingsService.initialize();
  
  const settings = aiSettingsService.getSettings();
  console.log("[AI] Step 2: Get settings from service:", {
    providerCount: settings.providers.length,
    hasGemini: settings.providers.some(p => p.providerId === 'gemini'),
    geminiEnabled: settings.providers.find(p => p.providerId === 'gemini')?.enabled,
    geminiHasKey: settings.providers.find(p => p.providerId === 'gemini')?.apiKey ? true : false
  });
  
  console.log("[AI] Step 3: Initialize router with settings...");
  aiRouter.initialize(settings);
  
  // Verify router is available
  console.log("[AI] Step 4: Verify router availability...");
  const isAvailable = aiRouter.isAIAvailable();
  console.log(`[AI]  Router available:`, isAvailable);
  
  if (!isAvailable) {
    console.error("[AI]  CRITICAL: Router initialized but NOT available!");
    console.error("[AI] This will cause all AI features to fail with empty results");
    console.error("[AI] Check console above for detailed router state");
  }
  
  // Check capabilities
  console.log("[AI] Step 5: Check capabilities...");
  console.log("[AI] Has text capability:", canGenerateText());
  console.log("[AI] Has vision capability:", canAnalyzeImages());
  console.log("[AI] Has image generation:", canGenerateImages());
  console.log("[AI] Has search capability:", canSearch());
  console.log("[AI] Has audio capability:", canUseAudio());
  
  console.log("[AI] ===== INITIALIZE AI SERVICES END =====");
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
