/**
 * AI Router Service
 * 
 * Simple routing of AI requests with graceful degradation.
 * Enhanced with structured error logging for better visibility.
 */

import { errorLogger } from '../errorLogger';
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
  AIAudioAnalysisRequest,
  AIAudioAnalysisResponse,
  AILiveConfig,
  AILiveSession,
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
  private ready = false;  // NEW flag to track when initialization is complete
  private adapters: Map<AIProviderType, BaseAIAdapter> = new Map();

  initialize(settings: AISettings): void {
    console.log("[AIRouter] ===== INITIALIZE START =====");
    console.log("[AIRouter] Input settings:", {
      providerCount: settings.providers.length,
      offlineMode: settings.offlineMode
    });

    this.settings = settings;
    this.adapters.clear();

    console.log("[AIRouter] Settings assigned, providers:", settings.providers.map(p => ({
      id: p.providerId,
      enabled: p.enabled,
      hasKey: !!p.apiKey,
      keyLength: p.apiKey ? p.apiKey.length : 0,
      keyPrefix: p.apiKey ? p.apiKey.substring(0, 4) + '...' : 'none'
    })));

    // Instantiate adapters for enabled providers with API keys
    let adaptersCreated = 0;
    for (const provider of settings.providers) {
      if (!provider.enabled || !provider.apiKey) {
        console.warn(`[AIRouter] Skipping ${provider.providerId}: enabled=${provider.enabled}, hasKey=${!!provider.apiKey}`);
        continue;
      }

      try {
        console.log(`[AIRouter] Initializing adapter for ${provider.providerId}`);
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
            console.warn(`[AIRouter] Provider ${provider.providerId} not yet implemented.`);
            break;
        }
        console.log(`[AIRouter]  Successfully initialized ${provider.providerId} adapter`);
        adaptersCreated++;
      } catch (error) {
        console.error(`[AIRouter]  Failed to initialize provider ${provider.providerId}:`, error);
      }
    }

    console.log(`[AIRouter] Initialization complete: ${this.adapters.size}/${adaptersCreated} adapters ready`);
    console.log(`[AIRouter] Available providers:`, Array.from(this.adapters.keys()));
    this.initialized = true;
    this.ready = true;  // Set ready flag at end of initialization
    
    // Log availability immediately after initialization
    const available = this.isAIAvailable();
    console.log(`[AIRouter] isAIAvailable() immediately after init:`, available);
    console.log(`[AIRouter] ===== INITIALIZE END =====`);
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  async checkHealth(): Promise<Record<AIProviderType, boolean>> {
    const results: Partial<Record<AIProviderType, boolean>> = {};
    
    const checks = Array.from(this.adapters.entries()).map(async ([id, adapter]) => {
      const isHealthy = await adapter.healthCheck();
      results[id] = isHealthy;
    });

    await Promise.all(checks);
    return results as Record<AIProviderType, boolean>;
  }

  getProviderStats(): Record<AIProviderType, any> {
    const stats: Partial<Record<AIProviderType, any>> = {};
    for (const [id, adapter] of this.adapters.entries()) {
      stats[id] = adapter.getStats();
    }
    return stats as Record<AIProviderType, any>;
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
    const hasSettings = !!this.settings;
    const isInit = this.initialized;
    const isReady = this.ready;  // Check ready flag
    const hasProviders = this.settings?.providers.length ?? 0 > 0;
    const hasEnabled = this.settings?.providers.some(p => p.enabled) ?? false;
    const hasKeys = this.settings?.providers.some(p => p.enabled && p.apiKey) ?? false;
    const result = isInit && isReady && hasKeys;  // Include ready in check

    console.log("[AIRouter] isAIAvailable() check:", {
      hasSettings,
      initialized: isInit,
      ready: isReady,  // Log ready state
      providerCount: this.settings?.providers.length ?? 0,
      hasProviders,
      hasEnabledProviders: hasEnabled,
      hasProvidersWithKeys: hasKeys,
      result
    });

    return result;
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

  /** Audio Analysis routing */
  async analyzeAudio(request: AIAudioAnalysisRequest): Promise<AIAudioAnalysisResponse | null> {
    // Currently only Gemini supports this directly via the adapter method we added
    // We can use 'audio' capability or 'vision' (multimodal) capability check
    // For now, we'll check for the specific method existence
    return this.routeWithFallback('audio', async (adapter) => {
      if ('analyzeAudio' in adapter) {
        return (adapter as any).analyzeAudio(request);
      }
      throw new Error('Adapter does not support analyzeAudio');
    });
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

  async connectLive(config: AILiveConfig): Promise<AILiveSession> {
    const adapters = this.getAdaptersForCapability('audio');
    for (const adapter of adapters) {
      if (adapter.connectLive) {
        try {
          return await adapter.connectLive(config);
        } catch (error) {
          console.warn(`Failed to connect live with ${adapter.constructor.name}:`, error);
          continue;
        }
      }
    }
    throw new Error('No available AI provider supports live audio.');
  }

  resetProviderStats(providerId: AIProviderType): void {
    const adapter = this.adapters.get(providerId);
    adapter?.resetStats();
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
    
    if (adapters.length === 0) {
      errorLogger.warning(`No adapters available for capability: ${capability}`, {
        capability,
        availableProviders: this.settings?.providers.map(p => ({
          id: p.providerId,
          enabled: p.enabled,
          hasKey: !!p.apiKey
        }))
      });
      return null;
    }

    let lastError: unknown = null;
    for (const adapter of adapters) {
      try {
        return await fn(adapter);
      } catch (error) {
        lastError = error;
        const errorDetails = {
          adapter: adapter.constructor.name,
          capability,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : String(error)
        };
        console.warn(`Adapter ${adapter.constructor.name} failed for ${capability}:`, error);
        errorLogger.warning(`AI adapter failure`, errorDetails);
        continue;
      }
    }

    if (lastError) {
      const finalErrorDetails = {
        capability,
        allAdaptersFailed: true,
        adapterCount: adapters.length,
        error: lastError instanceof Error ? {
          name: lastError.name,
          message: lastError.message
        } : String(lastError)
      };
      console.error(`All providers failed for capability ${capability}`, lastError);
      errorLogger.error(`All AI providers failed for capability ${capability}`, finalErrorDetails);
    }
    
    return null;
  }
}

// Singleton pattern - only initialize on first call
let routerInstance: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter();
  }
  return routerInstance;
}

// Direct export - initialize immediately to avoid circular dependency issues
export const aiRouter = getAIRouter();