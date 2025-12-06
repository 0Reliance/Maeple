/**
 * AI Router Service
 * 
 * Simple routing of AI requests with graceful degradation.
 */

import {
  AIProviderType,
  AICapability,
  AISettings,
  AITextRequest,
  AITextResponse,
  AIVisionRequest,
  AIVisionResponse,
  AIImageRequest,
  AIImageResponse,
  AISearchRequest,
  AISearchResponse,
  AI_PROVIDERS,
} from './types';
import { BaseAIAdapter } from './adapters/base';
import { GeminiAdapter } from './adapters/gemini';
import { OpenAIAdapter } from './adapters/openai';
import { OpenRouterAdapter } from './adapters/openrouter';
import { PerplexityAdapter } from './adapters/perplexity';
import { AnthropicAdapter } from './adapters/anthropic';
import { OllamaAdapter } from './adapters/ollama';
import { ZaiAdapter } from './adapters/zai';

class AIRouter {
  private settings: AISettings | null = null;
  private initialized = false;
  private adapters: Map<AIProviderType, BaseAIAdapter> = new Map();

  initialize(settings: AISettings): void {
    this.settings = settings;
    this.adapters.clear();

    // Instantiate adapters for enabled providers with API keys
    for (const provider of settings.providers) {
      if (!provider.enabled || !provider.apiKey) continue;

      try {
        switch (provider.providerId) {
          case 'gemini':
            this.adapters.set(
              provider.providerId,
              new GeminiAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          case 'openai':
            this.adapters.set(
              provider.providerId,
              new OpenAIAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          case 'openrouter':
            this.adapters.set(
              provider.providerId,
              new OpenRouterAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          case 'perplexity':
            this.adapters.set(
              provider.providerId,
              new PerplexityAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          case 'anthropic':
            this.adapters.set(
              provider.providerId,
              new AnthropicAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          case 'ollama':
            this.adapters.set(
              provider.providerId,
              new OllamaAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          case 'zai':
            this.adapters.set(
              provider.providerId,
              new ZaiAdapter({ apiKey: provider.apiKey, baseUrl: provider.baseUrl })
            );
            break;
          default:
            console.warn(`Provider ${provider.providerId} not yet implemented.`);
            break;
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${provider.providerId}:`, error);
      }
    }
    this.initialized = true;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  hasCapability(capability: AICapability): boolean {
    if (!this.settings) return false;
    return this.settings.providers.some(p => {
      if (!p.enabled) return false;
      const info = AI_PROVIDERS[p.providerId];
      return info?.capabilities.includes(capability);
    });
  }

  getProviderForCapability(capability: AICapability): AIProviderType | null {
    if (!this.settings) return null;
    
    for (const provider of this.settings.providers) {
      if (!provider.enabled) continue;
      const info = AI_PROVIDERS[provider.providerId];
      if (info?.capabilities.includes(capability)) {
        return provider.providerId;
      }
    }
    return null;
  }

  isAIAvailable(): boolean {
    return this.initialized && (this.settings?.providers.some(p => p.enabled && p.apiKey) ?? false);
  }

  updateSettings(settings: AISettings): void {
    this.settings = settings;
    this.initialize(settings);
  }

  /**
   * Chat/text completion routing with simple first-match strategy.
   */
  async chat(request: AITextRequest): Promise<AITextResponse | null> {
    return this.routeWithFallback('text', (adapter) => adapter.chat(request));
  }

  /** Vision analysis routing */
  async vision(request: AIVisionRequest): Promise<AIVisionResponse | null> {
    return this.routeWithFallback('vision', (adapter) => adapter.vision(request));
  }

  /** Image generation routing */
  async generateImage(request: AIImageRequest): Promise<AIImageResponse | null> {
    return this.routeWithFallback('image_gen', (adapter) => adapter.generateImage(request));
  }

  /** Search routing */
  async search(request: AISearchRequest): Promise<AISearchResponse | null> {
    return this.routeWithFallback('search', (adapter) => adapter.search(request));
  }

  /** Audio routing */
  async streamAudio(request: AITextRequest): Promise<AsyncGenerator<string, void, unknown> | null> {
    const adapters = this.getAdaptersForCapability('audio').filter(a => a.supportsStreaming());
    for (const adapter of adapters) {
      try {
        const stream = adapter.stream?.(request);
        if (stream) return stream;
      } catch (err) {
        console.warn(`Audio stream failed for ${adapter.constructor.name}:`, err);
        continue;
      }
    }
    return null;
  }

  resetProviderHealth(providerId: AIProviderType): void {
    const adapter = this.adapters.get(providerId);
    adapter?.resetHealth();
  }

  private getAdaptersForCapability(capability: AICapability): BaseAIAdapter[] {
    if (!this.settings) return [];

    const list: BaseAIAdapter[] = [];
    for (const provider of this.settings.providers) {
      if (!provider.enabled || !provider.apiKey) continue;
      const info = AI_PROVIDERS[provider.providerId];
      if (!info?.capabilities.includes(capability)) continue;
      const adapter = this.adapters.get(provider.providerId);
      if (adapter) list.push(adapter);
    }
    return list;
  }

  private async routeWithFallback<T>(capability: AICapability, fn: (adapter: BaseAIAdapter) => Promise<T>): Promise<T | null> {
    const adapters = this.getAdaptersForCapability(capability);
    if (adapters.length === 0) return null;

    let lastError: unknown = null;
    for (const adapter of adapters) {
      try {
        return await fn(adapter);
      } catch (error) {
        lastError = error;
        console.warn(`Adapter ${adapter.constructor.name} failed for ${capability}:`, error);
        continue;
      }
    }

    if (lastError) {
      console.error(`All providers failed for capability ${capability}`, lastError);
    }
    return null;
  }
}

export const aiRouter = new AIRouter();
