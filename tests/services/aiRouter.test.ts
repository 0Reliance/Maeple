import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiRouter } from '../../src/services/ai/router';
import { AISettings } from '../../src/services/ai/types';

// Mock adapters
vi.mock('../../src/services/ai/adapters/gemini', () => {
  return {
    GeminiAdapter: class {
      constructor() {}
      healthCheck = vi.fn().mockResolvedValue(true);
      getStats = vi.fn().mockReturnValue({ providerId: 'gemini' });
    }
  }
});

vi.mock('../../src/services/ai/adapters/openai', () => {
  return {
    OpenAIAdapter: class {
      constructor() {}
      healthCheck = vi.fn().mockResolvedValue(false);
      getStats = vi.fn().mockReturnValue({ providerId: 'openai' });
    }
  }
});

describe('AIRouter', () => {
  const mockSettings: AISettings = {
    providers: [
      { providerId: 'gemini', enabled: true, apiKey: 'test-key' },
      { providerId: 'openai', enabled: true, apiKey: 'test-key' },
    ]
  };

  beforeEach(() => {
    aiRouter.initialize(mockSettings);
  });

  it('should initialize adapters', () => {
    expect(aiRouter.isInitialized).toBe(true);
  });

  it('should check health of all providers', async () => {
    const health = await aiRouter.checkHealth();
    expect(health).toEqual({
      gemini: true,
      openai: false,
    });
  });

  it('should get stats from all providers', () => {
    const stats = aiRouter.getProviderStats();
    expect(stats).toEqual({
      gemini: { providerId: 'gemini' },
      openai: { providerId: 'openai' },
    });
  });
});
