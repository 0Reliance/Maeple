import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerplexityAdapter } from '../../../../src/services/ai/adapters/perplexity';
import { AITextRequest, AISearchRequest } from '../../../../src/services/ai/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PerplexityAdapter', () => {
  let adapter: PerplexityAdapter;
  const config = { apiKey: 'test-key', maxRetries: 0 };

  beforeEach(() => {
    vi.resetAllMocks();
    adapter = new PerplexityAdapter(config);
    // Reset stats
    localStorage.clear();
  });

  it('should initialize with correct config', () => {
    expect(adapter).toBeInstanceOf(PerplexityAdapter);
  });

  it('should handle chat requests', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Test response' } }],
      model: 'llama-3.1-sonar-small-128k-online'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const request: AITextRequest = {
      messages: [{ role: 'user', content: 'Hello' }]
    };

    const response = await adapter.chat(request);

    expect(response.content).toBe('Test response');
    expect(response.provider).toBe('perplexity');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    );
  });

  it('should handle search requests and parse citations', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Search result' } }],
      citations: ['https://example.com/1', 'https://example.com/2']
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const request: AISearchRequest = {
      query: 'test query'
    };

    const response = await adapter.search(request);

    expect(response.content).toBe('Search result');
    expect(response.sources).toHaveLength(2);
    expect(response.sources?.[0].url).toBe('https://example.com/1');
    expect(response.sources?.[0].title).toBe('Source 1');
  });

  it('should track usage stats', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Response' } }]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    await adapter.chat({ messages: [{ role: 'user', content: 'Hi' }] });
    await adapter.search({ query: 'test' });

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
