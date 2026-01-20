import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZaiAdapter } from '../../../../src/services/ai/adapters/zai';
import { AITextRequest } from '../../../../src/services/ai/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ZaiAdapter', () => {
  let adapter: ZaiAdapter;
  const config = { apiKey: 'test-key', maxRetries: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    adapter = new ZaiAdapter(config);
    // Reset stats
    localStorage.clear();
  });

  it('should initialize with correct config', () => {
    expect(adapter).toBeInstanceOf(ZaiAdapter);
  });

  it('should handle chat requests', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }],
      model: 'zai-large'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const request: AITextRequest = {
      messages: [{ role: 'user', content: 'Hello' }]
    };

    const response = await adapter.chat(request);

    expect(response.content).toBe('Test response');
    expect(response.provider).toBe('zai');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    );
  });

  it('should track usage stats', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Response' } }],
      model: 'zai-large'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    await adapter.chat({ messages: [{ role: 'user', content: 'test' }] });

    const stats = adapter.getStats();
    expect(stats.requestCount).toBe(1);
    expect(stats.errorCount).toBe(0);
  });

  it('should handle errors and track them', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(adapter.chat({ messages: [] })).rejects.toThrow();

    const stats = adapter.getStats();
    expect(stats.errorCount).toBe(1);
  });
});
