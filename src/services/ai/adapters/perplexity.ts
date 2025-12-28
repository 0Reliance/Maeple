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
 * Perplexity AI Adapter
 * Provides AI search with real-time web grounding
 * Supports text and search capabilities
 */
export class PerplexityAdapter extends BaseAIAdapter {
  private baseUrl: string;

  constructor(config: AdapterConfig) {
    super("perplexity", config);
    this.baseUrl = config.baseUrl || "https://api.perplexity.ai";
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWithRetry(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1
          })
        }
      );
      return true;
    } catch (error) {
      console.error("Perplexity health check failed:", error);
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
            "Authorization": `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online", // Default online model
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
        model: data.model || "llama-3.1-sonar-small-128k-online",
        provider: "perplexity"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    // Perplexity doesn't support vision capabilities
    throw new AIError("Perplexity does not support vision analysis. Please use a different provider.", "perplexity");
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    // Perplexity doesn't support image generation
    throw new AIError("Perplexity does not support image generation. Please use a different provider.", "perplexity");
  }

  async search(request: AISearchRequest): Promise<AISearchResponse> {
    try {
      const messages = [
        {
          role: "user",
          content: request.query
        }
      ];

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages,
            temperature: 0.2, // Lower temperature for more factual responses
            max_tokens: 2048,
            search_recency_filter: "week", // Get recent information
            top_p: 0.9,
            frequency_penalty: 1
          })
        }
      );

      const data = await response.json();
      
      // Extract citations from Perplexity response (array of URLs)
      const sources = data.citations?.map((url: string, index: number) => ({
        title: `Source ${index + 1}`,
        url: url
      })) || [];

      return {
        content: data.choices[0]?.message?.content || "",
        sources,
        provider: "perplexity"
      };
    } catch (error) {
      this.trackError();
      throw this.handleError(error);
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  async *stream(request: AITextRequest): AsyncGenerator<string, void, unknown> {
    this.trackRequest();
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
            "Authorization": `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            stream: true
          })
        }
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIError("No response body available for streaming", "perplexity");
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
      return new AIError("Invalid Perplexity API key", "perplexity");
    }
    if (_error?.message?.includes('429')) {
      return new AIError("Perplexity rate limit exceeded", "perplexity");
    }
    if (_error?.message?.includes('402')) {
      return new AIError("Perplexity credit insufficient", "perplexity");
    }
    const msg = _error?.message || "Unknown Perplexity error";
    return new AIError(`Perplexity error: ${msg}`, "perplexity");
  }
}