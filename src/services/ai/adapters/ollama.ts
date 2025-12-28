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
 * Ollama AI Adapter
 * Provides access to local AI models through Ollama
 * Supports text and vision capabilities with local processing
 */
export class OllamaAdapter extends BaseAIAdapter {
  private baseUrl: string;

  constructor(config: AdapterConfig) {
    super("ollama", config);
    this.baseUrl = config.baseUrl || "http://localhost:11434";
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWithRetry(
        `${this.baseUrl}/api/tags`,
        {
          method: "GET"
        }
      );
      return true;
    } catch (error) {
      console.error("Ollama health check failed:", error);
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
        `${this.baseUrl}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3.2", // Default local model
            messages,
            stream: false,
            options: {
              temperature: request.temperature ?? 0.7,
              num_predict: request.maxTokens ?? 2048
            }
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.message?.content || "",
        model: data.model || "llama3.2",
        provider: "ollama"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3.2-vision", // Vision-capable model
            messages: [
              {
                role: "user",
                content: request.prompt,
                images: [request.imageData]
              }
            ],
            stream: false,
            options: {
              temperature: 0.7
            }
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.message?.content || "",
        provider: "ollama",
        model: data.model || "llama3.2-vision"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    // Ollama doesn't support image generation
    throw new AIError("Ollama does not support image generation. Please use a different provider.", "ollama");
  }

  async search(request: AISearchRequest): Promise<AISearchResponse> {
    // Ollama doesn't have native search capabilities
    throw new AIError("Ollama does not support search. Please use a different provider.", "ollama");
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
        `${this.baseUrl}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3.2",
            messages,
            stream: true,
            options: {
              temperature: request.temperature ?? 0.7,
              num_predict: request.maxTokens ?? 2048
            }
          })
        }
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIError("No response body available for streaming", "ollama");
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
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                yield parsed.message.content;
              }
              if (parsed.done) return;
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

    if (_error?.message?.includes('ECONNREFUSED') || _error?.message?.includes('fetch')) {
      return new AIError("Ollama server not running. Please start Ollama locally.", "ollama");
    }
    if (_error?.message?.includes('404')) {
      return new AIError("Model not found in Ollama. Please pull the model first.", "ollama");
    }
    if (_error?.message?.includes('400')) {
      return new AIError("Invalid request to Ollama API", "ollama");
    }
    const msg = _error?.message || "Unknown Ollama error";
    return new AIError(`Ollama error: ${msg}`, "ollama");
  }
}