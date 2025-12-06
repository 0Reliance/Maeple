import {
  AIProviderType,
  AITextRequest,
  AITextResponse,
  AIVisionRequest,
  AIVisionResponse,
  AIImageRequest,
  AIImageResponse,
  AISearchRequest,
  AISearchResponse,
  AIError,
  AIAuthenticationError,
  AIRateLimitError,
} from '../types';

export interface AdapterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Abstract base adapter providing retry, timeout, and health metrics.
 */
export abstract class BaseAIAdapter {
  protected providerId: AIProviderType;
  protected config: AdapterConfig;
  protected requestCount = 0;
  protected errorCount = 0;
  protected lastRequestTime = 0;

  constructor(providerId: AIProviderType, config: AdapterConfig) {
    this.providerId = providerId;
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };
  }

  // Methods each concrete adapter must implement
  abstract chat(request: AITextRequest): Promise<AITextResponse>;
  abstract vision(request: AIVisionRequest): Promise<AIVisionResponse>;
  abstract generateImage(request: AIImageRequest): Promise<AIImageResponse>;
  abstract search(request: AISearchRequest): Promise<AISearchResponse>;
  abstract supportsStreaming(): boolean;
  abstract stream?(request: AITextRequest): AsyncGenerator<string, void, unknown>;

  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = this.config.maxRetries || 3
  ): Promise<Response> {
    try {
      this.requestCount += 1;
      this.lastRequestTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        throw new AIAuthenticationError(this.providerId);
      }
      if (response.status === 429) {
        if (retries > 0) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
          await this.delay(retryAfter * 1000);
          return this.fetchWithRetry(url, options, retries - 1);
        }
        throw new AIRateLimitError(this.providerId);
      }
      if (!response.ok && retries > 0) {
        await this.delay(Math.pow(2, (this.config.maxRetries || 3) - retries) * 1000);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new AIError(`HTTP ${response.status}: ${errorText}`, this.providerId);
      }

      return response;
    } catch (error) {
      this.errorCount += 1;
      if (error instanceof AIError) throw error;
      if (retries > 0) {
        await this.delay(Math.pow(2, (this.config.maxRetries || 3) - retries) * 1000);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new AIError(`Request failed: ${message}`, this.providerId);
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getHealth() {
    return {
      provider: this.providerId,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      lastRequestTime: this.lastRequestTime,
    };
  }

  resetHealth(): void {
    this.requestCount = 0;
    this.errorCount = 0;
  }
}
