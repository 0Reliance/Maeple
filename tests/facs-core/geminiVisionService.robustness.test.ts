import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeStateFromImage } from '../../src/services/geminiVisionService';
import { aiRouter } from '../../src/services/ai';
import { GoogleGenAI } from '@google/genai';

// Mock dependencies
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function() {
    return {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            confidence: 0.8,
            actionUnits: [],
            facsInterpretation: {},
            observations: [],
            lighting: 'good',
            lightingSeverity: 'low',
            environmentalClues: []
          })
        }),
      },
    };
  }),
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
    isAIAvailable: vi.fn().mockReturnValue(true),
    vision: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../src/services/cacheService', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/services/rateLimiter', () => ({
  rateLimitedCall: vi.fn().mockImplementation((fn) => fn()),
}));

describe('geminiVisionService Robustness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_GEMINI_API_KEY = 'test-api-key';
  });

  it('should unwrap facs_analysis wrapper from AI response', async () => {
    const wrappedResponse = {
      facs_analysis: {
        confidence: 0.85,
        actionUnits: [{ auCode: 'AU12', name: 'Smile', intensity: 'B', intensityNumeric: 2, confidence: 0.9 }],
        facsInterpretation: { duchennSmile: false, socialSmile: true, maskingIndicators: [], fatigueIndicators: [], tensionIndicators: [] },
        observations: [],
        lighting: 'indoor',
        lightingSeverity: 'low',
        environmentalClues: []
      }
    };

    (aiRouter.vision as any).mockResolvedValueOnce({
      content: JSON.stringify(wrappedResponse)
    });

    const result = await analyzeStateFromImage('base64-data');

    expect(result.confidence).toBe(0.85);
    expect(result.actionUnits[0].auCode).toBe('AU12');
  });

  it('should handle AbortSignal and throw AbortError', async () => {
    const controller = new AbortController();
    
    (aiRouter.vision as any).mockImplementationOnce(({ signal }: { signal?: AbortSignal }) => new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => resolve({ content: '{}' }), 1000);
      
      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Aborted', 'AbortError'));
      });

      if (signal?.aborted) {
        clearTimeout(timeoutId);
        reject(new DOMException('Aborted', 'AbortError'));
      }
    }));

    const analysisPromise = analyzeStateFromImage('base64-data', { signal: controller.signal });
    controller.abort();

    await expect(analysisPromise).rejects.toThrow(/abort/i);
  });

  it('should fallback to offline analysis on parse error in both router and direct SDK', async () => {
    // 1. Router returns invalid JSON
    (aiRouter.vision as any).mockResolvedValueOnce({
      content: 'invalid json'
    });
    
    // 2. Direct SDK also returns invalid JSON
    // Override the top-level mock for this one call
    (GoogleGenAI as any).mockImplementationOnce(function() {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: 'also invalid json'
          })
        }
      };
    });

    const result = await analyzeStateFromImage('base64-data', { useCache: false });

    // Should return offline analysis with 0.3 confidence
    expect(result.confidence).toBe(0.3);
    expect(result.environmentalClues[0]).toContain('Offline analysis');
  });

  it('should fallback to direct SDK when aiRouter.isAIAvailable() is false', async () => {
    (aiRouter.isAIAvailable as any).mockReturnValue(false);
    
    const result = await analyzeStateFromImage('base64-data');
    
    expect(aiRouter.vision).not.toHaveBeenCalled();
    expect(result.confidence).toBeDefined();
  });
});
