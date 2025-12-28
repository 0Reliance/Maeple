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
 * Z.ai AI Adapter
 * Provides conversational AI capabilities
 * Supports text capabilities only
 */
export class ZaiAdapter extends BaseAIAdapter {
  private baseUrl: string;

  constructor(config: AdapterConfig) {
    super("zai", config);
    this.baseUrl = config.baseUrl || "https://api.z.ai";
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWithRetry(
        `${this.baseUrl}/v1/models`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`
          }
        }
      );
      return true;
    } catch (error) {
      console.error("Z.ai health check failed:", error);
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
        `${this.baseUrl}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: "zai-large", // Default Z.ai model
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            ...(request.responseFormat === "json" && { 
              response_format: { type: "json_object" } 
            })
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || "",
        model: data.model || "zai-large",
        provider: "zai"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    // Z.ai doesn't support vision capabilities
    throw new AIError("Z.ai does not support vision analysis. Please use a different provider.", "zai");
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    // Z.ai doesn't support image generation
    throw new AIError("Z.ai does not support image generation. Please use a different provider.", "zai");
  }

  async search(request: AISearchRequest): Promise<AISearchResponse> {
    // Z.ai doesn't have native search capabilities
    throw new AIError("Z.ai does not support search. Please use a different provider.", "zai");
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
        `${this.baseUrl}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: "zai-large",
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            stream: true
          })
        }
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIError("No response body available for streaming", "zai");
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

  private handleError(_error: any): Error {
    // If it's already an AIError, it was likely thrown by fetchWithRetry which already tracked it
    if (_error instanceof AIError) {
      return _error;
    }

    this.trackError();

    if (_error?.message?.includes('401') || _error?.message?.includes('403')) {
      return new AIError("Invalid Z.ai API key", "zai");
    }
    if (_error?.message?.includes('429')) {
      return new AIError("Z.ai rate limit exceeded", "zai");
    }
    if (_error?.message?.includes('402')) {
      return new AIError("Z.ai credit insufficient", "zai");
    }
    const msg = _error?.message || "Unknown Z.ai error";
    return new AIError(`Z.ai error: ${msg}`, "zai");
  }
}