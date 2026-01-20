import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterAdapter } from '../../../../src/services/ai/adapters/openrouter';
import { AITextRequest, AIVisionRequest } from '../../../../src/services/ai/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenRouterAdapter', () => {
  let adapter: OpenRouterAdapter;
  const config = { apiKey: 'test-key', maxRetries: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    adapter = new OpenRouterAdapter(config);
    // Reset stats
    localStorage.clear();
  });

  it('should initialize with correct config', () => {
    expect(adapter).toBeInstanceOf(OpenRouterAdapter);
  });

  it('should handle chat requests', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }],
      model: 'anthropic/claude-3.5-sonnet'
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
    expect(response.provider).toBe('openrouter');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
          'HTTP-Referer': 'https://maeple.app'
        })
      })
    );
  });

  it('should handle vision requests', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Image analysis' } }],
      model: 'anthropic/claude-3.5-sonnet'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const request: AIVisionRequest = {
      imageData: 'base64data',
      mimeType: 'image/jpeg',
      prompt: 'Analyze this'
    };

    const response = await adapter.vision(request);

    expect(response.content).toBe('Image analysis');
    expect(response.provider).toBe('openrouter');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"type":"image_url"')
      })
    );
  });

  it('should track usage stats', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Response' } }],
      model: 'anthropic/claude-3.5-sonnet'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    await adapter.chat({ messages: [{ role: 'user', content: 'test' }] });
    await adapter.vision({ imageData: 'data', mimeType: 'image/png', prompt: 'test' });

    const stats = adapter.getStats();
    expect(stats.requestCount).toBe(2);
    expect(stats.errorCount).toBe(0);
  });

  it('should handle errors and track them', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(adapter.chat({ messages: [] })).rejects.toThrow();

    const stats = adapter.getStats();
    expect(stats.errorCount).toBe(1);
  });
});
