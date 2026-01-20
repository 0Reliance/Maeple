import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaAdapter } from '../../../../src/services/ai/adapters/ollama';
import { AITextRequest, AIVisionRequest } from '../../../../src/services/ai/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OllamaAdapter', () => {
  let adapter: OllamaAdapter;
  const config = { apiKey: 'test-key', maxRetries: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    adapter = new OllamaAdapter(config);
    // Reset stats
    localStorage.clear();
  });

  it('should initialize with correct config', () => {
    expect(adapter).toBeInstanceOf(OllamaAdapter);
  });

  it('should handle chat requests', async () => {
    const mockResponse = {
      message: { content: 'Test response' },
      model: 'llama3.2'
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
    expect(response.provider).toBe('ollama');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"messages":')
      })
    );
  });

  it('should handle vision requests', async () => {
    const mockResponse = {
      message: { content: 'Image analysis' },
      model: 'llama3.2-vision'
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
    expect(response.provider).toBe('ollama');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"images":')
      })
    );
  });

  it('should track usage stats', async () => {
    const mockResponse = {
      message: { content: 'Response' },
      model: 'llama3.2'
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
