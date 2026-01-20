import { GoogleGenAI, Modality } from "@google/genai";
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
  AIAudioAnalysisRequest,
  AIAudioAnalysisResponse,
  AILiveConfig,
  AILiveSession,
  AIError,
} from "../types";

/**
 * Gemini AI Adapter
 * Wraps Gemini SDK for text, vision, image generation, and search.
 */
export class GeminiAdapter extends BaseAIAdapter {
  private client: GoogleGenAI;

  constructor(config: AdapterConfig) {
    super("gemini", config);
    // GoogleGenAI does not support overriding baseUrl in typings; only apiKey is used here.
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async chat(request: AITextRequest): Promise<AITextResponse> {
    this.trackRequest();
    try {
      const systemMessages = request.messages.filter((m) => m.role === "system");
      const systemInstruction = systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join("\n")
        : request.systemPrompt || "";

      const conversationMessages = request.messages.filter((m) => m.role !== "system");
      const prompt = conversationMessages.map((m) => m.content).join("\n\n");

      const config: any = {
        systemInstruction,
        temperature: request.temperature ?? 0.7,
      };

      if (request.responseFormat === "json") {
        config.responseMimeType = "application/json";
      }

      if (request.maxTokens) {
        config.maxOutputTokens = request.maxTokens;
      }

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config,
      });

      return {
        content: response.text || "",
        model: "gemini-2.5-flash",
        provider: "gemini",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async vision(request: AIVisionRequest): Promise<AIVisionResponse> {
    this.trackRequest();
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: request.mimeType, data: request.imageData } },
            { text: request.prompt },
          ],
        },
      });

      return {
        content: response.text || "",
        provider: "gemini",
        model: "gemini-2.5-flash",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async analyzeAudio(request: AIAudioAnalysisRequest): Promise<AIAudioAnalysisResponse> {
    this.trackRequest();
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: request.mimeType, data: request.audioData } },
            { text: request.prompt },
          ],
        },
      });

      return {
        content: response.text || "",
        provider: "gemini",
        model: "gemini-2.5-flash",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    this.trackRequest();
    try {
      const parts: any[] = [];

      if (request.inputImage) {
        parts.push({
          inlineData: {
            data: request.inputImage,
            mimeType: "image/png",
          },
        });
      }

      parts.push({ text: request.prompt });

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return {
            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            provider: "gemini",
            model: "gemini-2.5-flash-image",
          };
        }
      }

      throw new Error("No image in response");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async search(request: AISearchRequest): Promise<AISearchResponse> {
    this.trackRequest();
    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: request.query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const sources =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || "Source",
          url: chunk.web?.uri || "",
        })) || [];

      return {
        content: response.text || "",
        sources,
        provider: "gemini",
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Lightweight check using countTokens
      await this.client.models.countTokens({
        model: "gemini-2.5-flash",
        contents: "ping",
      });
      return true;
    } catch (error) {
      console.error("Gemini health check failed:", error);
      return false;
    }
  }

  async connectLive(config: AILiveConfig): Promise<AILiveSession> {
    this.trackRequest();
    try {
      const session = await this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          systemInstruction: config.systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice || 'Kore' } }
          }
        },
        callbacks: {
          onopen: config.callbacks.onOpen,
          onclose: config.callbacks.onClose,
          onmessage: (msg: any) => {
            // Handle Audio
            if (msg.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              const base64 = msg.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              config.callbacks.onAudioData?.(bytes);
            }
            
            // Handle Text (Transcript)
            if (msg.serverContent?.modelTurn?.parts) {
                for (const part of msg.serverContent.modelTurn.parts) {
                    if (part.text) {
                        config.callbacks.onTextData?.(part.text);
                    }
                }
            }
          },
          onerror: (e: any) => {
            const error = new Error(e.message || 'Unknown Gemini Live error');
            config.callbacks.onError?.(error);
          }
        }
      });

      return {
        sendAudio: async (base64Data: string) => {
          await session.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Data
            }
          });
        },
        disconnect: async () => {
          // No explicit disconnect in current SDK binding
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *stream(request: AITextRequest): AsyncGenerator<string, void, unknown> {
    this.trackRequest();
    try {
      const systemMessages = request.messages.filter((m) => m.role === "system");
      const systemInstruction = systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join("\n")
        : request.systemPrompt || "";

      const conversationMessages = request.messages.filter((m) => m.role !== "system");
      const prompt = conversationMessages.map((m) => m.content).join("\n\n");

      const stream = await this.client.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: request.temperature ?? 0.7,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    this.trackError();
    const msg = error?.message || "Unknown Gemini error";
    return new AIError(`Gemini error: ${msg}`, "gemini");
  }
}
