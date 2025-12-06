import { GoogleGenAI } from "@google/genai";
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

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
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

  async *stream(request: AITextRequest): AsyncGenerator<string, void, unknown> {
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
  }

  private handleError(error: any): Error {
    const msg = error?.message || "Unknown Gemini error";
    return new AIError(`Gemini error: ${msg}`, "gemini");
  }
}
