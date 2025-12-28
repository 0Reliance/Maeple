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
 * Anthropic Claude AI Adapter
 * Provides advanced reasoning capabilities
 * Supports text and vision capabilities
 */
export class AnthropicAdapter extends BaseAIAdapter {
  private baseUrl: string;

  constructor(config: AdapterConfig) {
    super("anthropic", config);
    this.baseUrl = config.baseUrl || "https://api.anthropic.com";
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Minimal request to check connectivity
      await this.fetchWithRetry(
        `${this.baseUrl}/v1/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }]
          })
        }
      );
      return true;
    } catch (error) {
      console.error("Anthropic health check failed:", error);
      return false;
    }
  }

  async chat(request: AITextRequest): Promise<AITextResponse> {
    try {
      // Convert OpenAI-style messages to Claude format
      const systemMessages = request.messages.filter(msg => msg.role === "system");
      const systemPrompt = systemMessages.length > 0
        ? systemMessages.map(msg => msg.content).join("\n")
        : request.systemPrompt || "";

      const conversationMessages = request.messages.filter(msg => msg.role !== "system");
      
      const claudeMessages = conversationMessages.map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      }));

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/v1/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022", // Latest Claude model
            max_tokens: request.maxTokens ?? 2048,
            temperature: request.temperature ?? 0.7,
            messages: claudeMessages,
            system: systemPrompt || undefined,
            ...(request.responseFormat === "json" && { 
              response_format: { type: "json_object" } 
            })
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.content?.[0]?.text || "",
        model: data.model || "claude-3-5-sonnet-20241022",
        provider: "anthropic"
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
              type: "image",
              source: {
                type: "base64",
                media_type: request.mimeType,
                data: request.imageData
              }
            }
          ]
        }
      ];

      const response = await this.fetchWithRetry(
        `${this.baseUrl}/v1/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2048,
            temperature: 0.7,
            messages
          })
        }
      );

      const data = await response.json();
      
      return {
        content: data.content?.[0]?.text || "",
        provider: "anthropic",
        model: data.model || "claude-3-5-sonnet-20241022"
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    // Claude doesn't support image generation
    throw new AIError("Claude does not support image generation. Please use a different provider.", "anthropic");
  }

  async search(request: AISearchRequest): Promise<AISearchResponse> {
    // Claude doesn't have native search capabilities
    throw new AIError("Claude does not support search. Please use a different provider.", "anthropic");
  }

  supportsStreaming(): boolean {
    return true;
  }

  async *stream(_request: AITextRequest): AsyncGenerator<string, void, unknown> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/v1/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: this.config.model || "claude-3-5-sonnet-20241022",
            max_tokens: _request.maxTokens ?? 4096,
            stream: true,
            messages: _request.messages,
            temperature: _request.temperature ?? 0.7
          })
        }
      );

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIError("No response body available for streaming", "anthropic");
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
              const content = parsed.delta?.text || parsed.message?.content;
              if (content) yield content;
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(_error: any): Error {
    // Track error rate
    this.trackError();

    if (_error instanceof AIError) {
      return _error;
    }

    if (_error?.message?.includes('401') || _error?.message?.includes('403')) {
      return new AIError("Invalid Anthropic API key", "anthropic");
    }
    if (_error?.message?.includes('429')) {
      return new AIError("Anthropic rate limit exceeded", "anthropic");
    }
    if (_error?.message?.includes('402')) {
      return new AIError("Anthropic credit insufficient", "anthropic");
    }
    if (_error?.message?.includes('400')) {
      return new AIError("Invalid request to Anthropic API", "anthropic");
    }
    const msg = _error?.message || "Unknown Anthropic error";
    return new AIError(`Anthropic error: ${msg}`, "anthropic");
  }
}