import { BaseAIAdapter, AdapterConfig } from "./base";
import {
  AITextRequest,
  AITextResponse,
  AIVisionRequest,
  AIVisionResponse,
  AIImageRequest,
  AIImageResponse,
  AISearchRequest,
  AISearchResponse,
  AIError,
} from "../types";

/**
 * OpenRouter AI Adapter
 * Provides access to 100+ AI models through a unified API
 * Supports text and vision capabilities
 */
export class OpenRouterAdapter extends BaseAIAdapter {
  private baseUrl: string;

  constructor(config: AdapterConfig) {
    super("openrouter", config);
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWithRetry(
        `${this.baseUrl}/auth/key`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`
          }
        }
      );
      return true;
    } catch (error) {
      console.error("OpenRouter health check failed:", error);
      return false;
    }
  }

  async chat(request: AITextRequest): Promise<AITextResponse> {
    try {
      const messages = request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`,
            "HTTP-Referer": "https://maeple.app",
            "X-Title": "MAEPLE"
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet", // Default high-quality model
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || "",
        model: data.model || "anthropic/claude-3.5-sonnet",
        provider: "openrouter"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    try {
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: request.prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${request.mimeType};base64,${request.imageData}`
              }
            }
          ]
        }
      ];

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`,
            "HTTP-Referer": "https://maeple.app",
            "X-Title": "MAEPLE"
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            messages,
            temperature: 0.7,
            max_tokens: 2048
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || "",
        provider: "openrouter",
        model: data.model || "anthropic/claude-3.5-sonnet"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    // OpenRouter doesn't have native image generation
    // This would need to be routed to a different provider
    throw new AIError("OpenRouter does not support image generation. Please use a different provider.", "openrouter");
  }

  async search(request: AISearchRequest): Promise<AISearchResponse> {
    // OpenRouter doesn't have native search capabilities
    // This would need to be routed to a different provider
    throw new AIError("OpenRouter does not support search. Please use a different provider.", "openrouter");
  }

  supportsStreaming(): boolean {
    return true;
  }

  async *stream(request: AITextRequest): AsyncGenerator<string, void, unknown> {
    try {
      const messages = request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`,
            "HTTP-Referer": "https://maeple.app",
            "X-Title": "MAEPLE"
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            stream: true
          })
        }
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIError("No response body available for streaming", "openrouter");
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) yield content;
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    // If it's already an AIError, it was likely thrown by fetchWithRetry which already tracked it
    if (error instanceof AIError) {
      return error;
    }

    this.trackError();

    if (error?.message?.includes('401') || error?.message?.includes('403')) {
      return new AIError("Invalid OpenRouter API key", "openrouter");
    }
    if (error?.message?.includes('429')) {
      return new AIError("OpenRouter rate limit exceeded", "openrouter");
    }
    if (error?.message?.includes('402')) {
      return new AIError("OpenRouter credit insufficient", "openrouter");
    }
    const msg = error?.message || "Unknown OpenRouter error";
    return new AIError(`OpenRouter error: ${msg}`, "openrouter");
  }
}
