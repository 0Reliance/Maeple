import { BaseAIAdapter, AdapterConfig } from './base';
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
} from '../types';

/**
 * OpenAI Adapter
 * Uses Chat Completions API for text/vision and Images API for image generation.
 * Streaming not implemented in this adapter.
 */
export class OpenAIAdapter extends BaseAIAdapter {
  private apiBase: string;
  private modelText = 'gpt-4o-mini'; // efficient default
  private modelVision = 'gpt-4o';
  private modelImage = 'gpt-image-1';

  constructor(config: AdapterConfig) {
    super('openai', config);
    this.apiBase = config.baseUrl || 'https://api.openai.com/v1';
  }

  supportsStreaming(): boolean {
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchWithRetry(`${this.apiBase}/models`, {
        method: 'GET',
        headers: this.authHeaders(),
      });
      return true;
    } catch (error) {
      console.error("OpenAI health check failed:", error);
      return false;
    }
  }

  async *stream(request: AITextRequest): AsyncGenerator<string, void, unknown> {
    try {
      const body: any = {
        model: this.modelText,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? 0.7,
        stream: true,
      };

      if (request.maxTokens) {
        body.max_tokens = request.maxTokens;
      }

      const response = await this.fetchWithRetry(`${this.apiBase}/chat/completions`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIError("No response body available for streaming", "openai");
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
              const content = parsed.choices?.[0]?.delta?.content;
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

  async chat(request: AITextRequest): Promise<AITextResponse> {
    const body: any = {
      model: this.modelText,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? 0.7,
    };

    if (request.maxTokens) {
      body.max_tokens = request.maxTokens;
    }

    const res = await this.fetchWithRetry(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '';

    return {
      content,
      model: json.model || this.modelText,
      provider: 'openai',
    };
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: request.prompt },
          { type: 'image_url', image_url: { url: `data:${request.mimeType};base64,${request.imageData}` } },
        ],
      },
    ];

    const body: any = {
      model: this.modelVision,
      messages,
      temperature: 0.2,
    };

    const res = await this.fetchWithRetry(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || '';

    return {
      content,
      provider: 'openai',
      model: json.model || this.modelVision,
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    const body: any = {
      model: this.modelImage,
      prompt: request.prompt,
      size: request.size || '1024x1024',
      n: 1,
    };

    if (request.inputImage) {
      // OpenAI image edit requires different endpoint; not implemented here.
    }

    const res = await this.fetchWithRetry(`${this.apiBase}/images/generations`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();
    const imageUrl = json.data?.[0]?.url as string | undefined;
    if (!imageUrl) {
      throw new AIError('OpenAI image generation returned no URL', 'openai');
    }

    return {
      imageUrl,
      provider: 'openai',
      model: this.modelImage,
    };
  }

  async search(_request: AISearchRequest): Promise<AISearchResponse> {
    // OpenAI does not provide native web search; return not supported
    throw new AIError('Search not supported for OpenAI', 'openai');
  }

  private authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  private handleError(error: any): Error {
    // If it's already an AIError, it was likely thrown by fetchWithRetry which already tracked it
    if (error instanceof AIError) {
      return error;
    }

    this.trackError();

    if (error?.message?.includes('401') || error?.message?.includes('403')) {
      return new AIError("Invalid OpenAI API key", "openai");
    }
    if (error?.message?.includes('429')) {
      return new AIError("OpenAI rate limit exceeded", "openai");
    }
    if (error?.message?.includes('402')) {
      return new AIError("OpenAI credit insufficient", "openai");
    }
    const msg = error?.message || "Unknown OpenAI error";
    return new AIError(`OpenAI error: ${msg}`, "openai");
  }
}
