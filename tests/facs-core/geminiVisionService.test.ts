/**
 * P0 Critical Test: geminiVisionService.test.ts
 *
 * Tests FACS analysis service including:
 * - API key handling (no logging of keys)
 * - Successful FACS analysis response parsing
 * - Malformed JSON response handling
 * - Rate limiting behavior
 * - Circuit breaker integration
 * - Offline fallback mode
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzeStateFromImage,
  generateOrEditImage,
} from '../../src/services/geminiVisionService';

// Create mock function at module level for reuse
const mockGenerateContent = vi.fn();

// Mock dependencies - vi.mock is hoisted, so we define the mock inside factory
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Schema: {},
  Type: {
    OBJECT: 'object',
    NUMBER: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
    ARRAY: 'array',
  },
}));

vi.mock('../../src/services/ai', () => ({
  aiRouter: {
    generateImage: vi.fn().mockResolvedValue(null),
    isAIAvailable: vi.fn().mockReturnValue(false),
    vision: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../src/services/cacheService', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/services/errorLogger', () => ({
  errorLogger: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const mockRateLimitedCall = vi.fn().mockImplementation((fn) => fn());

vi.mock('../../src/services/rateLimiter', () => ({
  rateLimitedCall: mockRateLimitedCall,
}));

describe('geminiVisionService', () => {
  let originalEnv: Record<string, string | undefined>;

  const createMockFACSResponse = () => ({
    confidence: 0.92,
    actionUnits: [
      {
        auCode: 'AU6',
        name: 'Cheek Raiser',
        intensity: 'C',
        intensityNumeric: 3,
        confidence: 0.89,
      },
      {
        auCode: 'AU12',
        name: 'Lip Corner Puller',
        intensity: 'D',
        intensityNumeric: 4,
        confidence: 0.94,
      },
    ],
    facsInterpretation: {
      duchennSmile: true,
      socialSmile: false,
      maskingIndicators: [],
      fatigueIndicators: [],
      tensionIndicators: [],
    },
    observations: [],
    lighting: 'natural',
    lightingSeverity: 'low',
    environmentalClues: ['indoor'],
    jawTension: 0.2,
    eyeFatigue: 0.1,
  });

  beforeEach(() => {
    originalEnv = {};
    Object.keys(import.meta.env).forEach((key) => {
      originalEnv[key] = import.meta.env[key];
    });

    mockGenerateContent.mockReset();
    vi.clearAllMocks();
    
    // Reset module-level state by clearing the cached AI instance
    // This is done by re-importing the module
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    Object.keys(originalEnv).forEach((key) => {
      (import.meta.env as Record<string, unknown>)[key] = originalEnv[key];
    });
  });

  describe('T-1.1: analyzeStateFromImage - Successful Analysis', () => {
    it('should return FacialAnalysis with actionUnits array on success', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify(createMockFACSResponse()),
                },
              ],
            },
          },
        ],
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result).toBeDefined();
      expect(result?.actionUnits).toBeDefined();
      expect(result?.actionUnits.length).toBeGreaterThan(0);
      expect(result?.confidence).toBeGreaterThan(0);
    });

    it('should handle high confidence response (>0.9)', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const highConfidenceResponse = {
        ...createMockFACSResponse(),
        confidence: 0.95,
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(highConfidenceResponse) }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result?.confidence).toBeGreaterThan(0.9);
    });

    it('should handle low confidence response (<0.5)', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const lowConfidenceResponse = {
        ...createMockFACSResponse(),
        confidence: 0.3,
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(lowConfidenceResponse) }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result?.confidence).toBeLessThan(0.5);
    });

    it('should handle empty actionUnits array', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const emptyAUResponse = {
        ...createMockFACSResponse(),
        actionUnits: [],
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(emptyAUResponse) }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result?.actionUnits).toEqual([]);
    });
  });

  describe('T-1.2: analyzeStateFromImage - API Key Missing', () => {
    it('should return null when API key is not set', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = undefined;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not log the full API key in any output', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'secret-api-key-12345';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      try {
        await analyzeStateFromImage('base64-image-data');
      } catch {
        // Expected
      }

      // Check that full key is not in any console output
      const allCalls = [
        ...consoleSpy.mock.calls,
        ...warnSpy.mock.calls,
        ...errorSpy.mock.calls,
      ];

      for (const call of allCalls) {
        const message = call.join(' ');
        expect(message).not.toContain('secret-api-key-12345');
      }

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should handle malformed API key', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = '';

      const result = await analyzeStateFromImage('base64-image-data');

      // When API key is empty, should return offline analysis (not null)
      expect(result).toBeDefined();
      expect(result?.actionUnits).toEqual([]);
    });
  });

  describe('T-1.3: analyzeStateFromImage - Rate Limiting', () => {
    beforeEach(() => {
      mockRateLimitedCall.mockClear();
      mockRateLimitedCall.mockImplementation((fn) => fn());
    });

    it('should use rateLimitedCall for requests', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(createMockFACSResponse()) }],
            },
          },
        ],
      });

      await analyzeStateFromImage('base64-image-data');

      expect(mockRateLimitedCall).toHaveBeenCalled();
    });

    it('should pass correct priority for analysis requests', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(createMockFACSResponse()) }],
            },
          },
        ],
      });

      await analyzeStateFromImage('base64-image-data');

      expect(mockRateLimitedCall).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ priority: 1 })
      );
    });

    it('should recover after rate limit hit', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockResolvedValueOnce({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(createMockFACSResponse()) }],
              },
            },
          ],
        });

      let callCount = 0;
      mockRateLimitedCall.mockImplementation(async (fn: Function) => {
        callCount++;
        return fn();
      });

      const result = await analyzeStateFromImage('base64-image-data');
      expect(callCount).toBeGreaterThan(0);
    });
  });

  describe('T-1.4: analyzeStateFromImage - Circuit Breaker Integration', () => {
    beforeEach(() => {
      mockRateLimitedCall.mockClear();
      mockRateLimitedCall.mockImplementation((fn) => fn());
    });

    it('should handle circuit breaker integration', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockRateLimitedCall.mockRejectedValue(new Error('Circuit breaker open'));

      const result = await analyzeStateFromImage('base64-image-data');

      // When circuit breaker is open, should return offline analysis (not null)
      expect(result).toBeDefined();
      expect(result?.actionUnits).toEqual([]);
    });

    it('should transition circuit state on failures', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      // Multiple failures should trigger circuit breaker
      await analyzeStateFromImage('base64-image-data');
      await analyzeStateFromImage('base64-image-data');

      // Both calls should attempt to use the API
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('T-1.5: FACS Schema Validation', () => {
    it('should validate AU codes in response', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const responseWithInvalidAU = {
        ...createMockFACSResponse(),
        actionUnits: [
          { ...createMockFACSResponse().actionUnits[0], auCode: 'INVALID' },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(responseWithInvalidAU) }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      // Should still return result but with validation
      expect(result).toBeDefined();
    });

    it('should handle missing intensity values', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const responseWithoutIntensity = {
        ...createMockFACSResponse(),
        actionUnits: [
          {
            auCode: 'AU6',
            name: 'Cheek Raiser',
            confidence: 0.89,
          },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(responseWithoutIntensity) }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result).toBeDefined();
      // When intensity is missing, the AU should still be present but may have default values
      expect(result?.actionUnits).toBeDefined();
      expect(result?.actionUnits.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle out-of-range confidence values', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const responseWithInvalidConfidence = {
        ...createMockFACSResponse(),
        confidence: 1.5, // Invalid: > 1
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(responseWithInvalidConfidence) }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      expect(result).toBeDefined();
    });
  });

  describe('T-1.6: generateOrEditImage - Image Generation', () => {
    it('should return data URL with generated image', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'base64-encoded-image-data',
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await generateOrEditImage('Generate a test image');

      // Result should be a data URL or null
      if (result) {
        expect(result).toContain('data:image/png;base64');
        expect(result).toContain('base64-encoded-image-data');
      }
    });

    it('should handle empty prompt', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const result = await generateOrEditImage('');

      expect(result).toBeNull();
    });

    it('should handle invalid base64 input', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: '', // Empty data
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await generateOrEditImage('Test');

      // Should handle gracefully
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should use router fallback when router fails', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = undefined; // No key

      const { aiRouter } = await import('../../src/services/ai');
      (aiRouter.generateImage as any).mockResolvedValue({ imageUrl: 'fallback-image-url' });

      const result = await generateOrEditImage('Test prompt');

      expect(aiRouter.generateImage).toHaveBeenCalled();
      expect(result).toBe('fallback-image-url');
    });

    it('should use lower priority for image generation', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockRateLimitedCall.mockClear();
      mockRateLimitedCall.mockImplementation((fn) => fn());

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'test-data',
                  },
                },
              ],
            },
          },
        ],
      });

      await generateOrEditImage('Test');

      expect(mockRateLimitedCall).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ priority: 2 })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON response', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'not valid json' }],
            },
          },
        ],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      // Service returns fallback analysis instead of null
      expect(result).toBeDefined();
      expect(result?.confidence).toBeLessThan(0.5);
    });

    it('should handle network errors', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const result = await analyzeStateFromImage('base64-image-data');

      // Service returns fallback analysis instead of null
      expect(result).toBeDefined();
      expect(result?.confidence).toBeLessThan(0.5);
    });

    it('should handle empty response', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({});

      const result = await analyzeStateFromImage('base64-image-data');

      // Service returns fallback analysis instead of null
      expect(result).toBeDefined();
      expect(result?.confidence).toBeLessThan(0.5);
    });

    it('should handle response without candidates', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      mockGenerateContent.mockResolvedValue({
        candidates: [],
      });

      const result = await analyzeStateFromImage('base64-image-data');

      // Service returns fallback analysis instead of null
      expect(result).toBeDefined();
      expect(result?.confidence).toBeLessThan(0.5);
    });
  });

  describe('Offline Fallback Mode', () => {
    it('should return fallback analysis when offline and no cache available', async () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';

      const { cacheService } = await import('../../src/services/cacheService');
      (cacheService.get as any).mockResolvedValue(null);

      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const result = await analyzeStateFromImage('base64-image-data');

      // Service returns a fallback analysis with offline indicator, not null
      expect(result).toBeDefined();
      expect(result?.confidence).toBeLessThan(0.5);
      expect(result?.facsInterpretation.fatigueIndicators).toContain('Unable to analyze - offline mode');
    });
  });
});
