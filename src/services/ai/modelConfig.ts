/**
 * MAEPLE AI Model Configuration
 * 
 * Centralized configuration for all Gemini model versions.
 * Updated per AI_MANDATE.md standards (January 2026).
 * 
 * IMPORTANT: Do NOT use deprecated models:
 * - gemini-1.5-* (deprecated)
 * - gemini-2.0-flash-exp (shutdown Feb 5, 2026)
 */

/**
 * Approved Gemini models for MAEPLE
 * Per AI_MANDATE.md: Use gemini-2.5-* models only
 */
export const GEMINI_MODELS = {
  // Primary model for text, vision, and general tasks
  flash: 'gemini-2.5-flash',
  
  // Image generation model
  imageGen: 'gemini-2.5-flash-image',
  
  // Live API / Real-time audio model
  // Per Google docs: https://ai.google.dev/gemini-api/docs/live
  liveAudio: 'gemini-2.5-flash-native-audio-preview-12-2025',
  
  // Health check model (lightweight)
  healthCheck: 'gemini-2.5-flash',
} as const;

/**
 * Model capabilities reference
 */
export const MODEL_CAPABILITIES = {
  [GEMINI_MODELS.flash]: ['text', 'vision', 'audio', 'search'],
  [GEMINI_MODELS.imageGen]: ['image_gen'],
  [GEMINI_MODELS.liveAudio]: ['audio', 'text'],
} as const;

/**
 * Deprecation dates (for logging/warnings)
 */
export const MODEL_DEPRECATION = {
  'gemini-2.0-flash-exp': new Date('2026-02-05'),
  'gemini-2.0-flash-001': new Date('2026-02-05'),
  'gemini-1.5-flash': new Date('2025-09-30'), // Already deprecated
} as const;

/**
 * Check if a model is deprecated
 */
export function isModelDeprecated(modelId: string): boolean {
  const deprecationDate = MODEL_DEPRECATION[modelId as keyof typeof MODEL_DEPRECATION];
  if (!deprecationDate) return false;
  return new Date() >= deprecationDate;
}

/**
 * Get recommended replacement for deprecated model
 */
export function getModelReplacement(deprecatedModel: string): string {
  const replacements: Record<string, string> = {
    'gemini-2.0-flash-exp': GEMINI_MODELS.flash,
    'gemini-2.0-flash-001': GEMINI_MODELS.flash,
    'gemini-1.5-flash': GEMINI_MODELS.flash,
    'gemini-2.0-flash': GEMINI_MODELS.flash,
  };
  return replacements[deprecatedModel] || GEMINI_MODELS.flash;
}
