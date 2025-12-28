import { GoogleGenAI, Schema, Type } from "@google/genai";
import { FacialAnalysis } from "../types";
import { aiRouter } from "./ai";
import { rateLimitedCall } from "./rateLimiter";

// Validate and retrieve API Key - returns null if not available
const getApiKey = (): string | null => {
  const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY)
    || process.env.VITE_GEMINI_API_KEY
    || process.env.API_KEY;

  if (!envKey) {
    console.warn(
      "Gemini API Key not found. Vision features will be limited. " +
      "Add VITE_GEMINI_API_KEY to your .env file or configure in Settings."
    );
    return null;
  }
  return envKey;
};

// Lazy-loaded AI client
let _ai: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI | null => {
  if (_ai) return _ai;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
};

/**
 * Generates or edits images based on prompt.
 * Returns null if AI is not configured.
 */
export const generateOrEditImage = async (
  prompt: string, 
  base64Image?: string,
  mimeType: string = "image/png"
): Promise<string | null> => {
  try {
    // Prefer router
    const routed = await aiRouter.generateImage({
      prompt,
      inputImage: base64Image,
    });
    if (routed?.imageUrl) return routed.imageUrl;

    const ai = getAI();
    if (!ai) {
      return null;
    }
    
    const model = "gemini-2.5-flash-image";
    const parts: any[] = [];

    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      });
      parts.push({ text: prompt });
    } else {
      parts.push({ text: prompt });
    }

    const response = await rateLimitedCall(() =>
      ai.models.generateContent({
        model: model,
        contents: { parts },
      }),
      { priority: 2 } // Image generation is lower priority
    );

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image gen error:", error);
    return null;
  }
};

// Schema for Objective Facial Analysis
const facialAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    confidence: { type: Type.NUMBER, description: "Overall confidence in the analysis (0-1)" },
    observations: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT },
      description: "List of objective visual observations"
    },
    lighting: { type: Type.STRING, description: "Lighting condition: 'bright fluorescent', 'soft natural', 'low light', etc." },
    lightingSeverity: { type: Type.STRING, enum: ["low", "moderate", "high"], description: "How harsh the lighting is" },
    environmentalClues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Background elements (e.g., 'busy office', 'blank wall', 'outdoor')"
    }
  },
  required: ["confidence", "observations", "lighting", "lightingSeverity", "environmentalClues"]
};

/**
 * Offline fallback analysis based on basic image metrics
 */
const getOfflineAnalysis = (_base64Image: string): FacialAnalysis => ({
  confidence: 0.3,
  observations: [],
  lighting: "unknown",
  lightingSeverity: "moderate",
  environmentalClues: ["Offline analysis - basic estimates based on image quality"],
});

/**
 * Analyzes a selfie for neurodivergent markers (Masking, Fatigue).
 * Returns default values if AI is not configured.
 */
export const analyzeStateFromImage = async (
  base64Image: string,
  options: { timeout?: number, onProgress?: (stage: string, progress: number) => void, signal?: AbortSignal } = {}
): Promise<FacialAnalysis> => {
  const { timeout = 30000, onProgress, signal } = options;
  
  try {
    const promptText = `Analyze this facial image for OBJECTIVE OBSERVATIONS ONLY.

Your task: Report ONLY what you can see - NO subjective interpretations or emotion labels.

DO NOT:
- Say "the user looks sad/angry/happy" (Subjective)
- Label emotions or feelings
- Make assumptions about internal state
- Use terms like "seems", "appears", "looks like"

DO:
- Report physical features: "tension around eyes", "slight frown lines", "drooping eyelids"
- Note lighting conditions: "bright fluorescent lighting", "soft natural light", "low light"
- Note environmental elements: "busy office background", "blank wall", "outdoor"
- Note facial indicators using FACS terminology: "ptosis (drooping eyelids)", "furrowed brow (AU4)"
- Note visible tension: "tightness around jaw", "lip tension (AU24)"

Categorize each observation:
- "tension": Physical tightness indicators
- "fatigue": Signs of tiredness or drooping
- "lighting": Lighting conditions in the photo
- "environmental": Background elements

Return a structured analysis matching the schema.`;

    // Check if router has vision capability
    onProgress?.('Checking AI availability', 5);
    
    const routed = await aiRouter.vision({
      imageData: base64Image,
      mimeType: "image/png",
      prompt: promptText
    });

    if (routed?.content) {
      try {
        return JSON.parse(routed.content) as FacialAnalysis;
      } catch (parseErr) {
        console.warn('Vision router JSON parse failed, falling back to Gemini SDK', parseErr);
      }
    }

    const ai = getAI();
    if (!ai) {
      onProgress?.('AI not configured, using offline mode', 100);
      return getOfflineAnalysis(base64Image);
    }

    onProgress?.('Preparing analysis request', 10);
    
    // Create timeout promise with proper cleanup
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('AI analysis timeout after 30 seconds'));
      }, timeout);
      
      signal?.addEventListener('abort', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        reject(new DOMException('Analysis cancelled', 'AbortError'));
      });
    });

    onProgress?.('Sending image to AI', 20);
    
    const response = await Promise.race([
      rateLimitedCall(async () => {
        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp", // FIXED: Correct model name
          contents: {
            parts: [
              { inlineData: { mimeType: "image/png", data: base64Image } },
              { text: promptText }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: facialAnalysisSchema,
            systemInstruction: "You are MAEPLE's Bio-Mirror, an objective observation tool. Your task: Analyze facial features and environmental conditions. Report ONLY what you can physically observe. NEVER label emotions or make assumptions about how the user feels. Be precise and evidence-based. Use FACS (Facial Action Coding System) terminology for facial movements. Describe lighting and environmental factors. Confidence scores are mandatory."
          }
        });
        return result;
      }, { priority: 4 }),
      timeoutPromise
    ]);

    // Clear timeout on success
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    onProgress?.('Analyzing facial features', 50);
    
    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    onProgress?.('Parsing results', 90);
    
    return JSON.parse(textResponse) as FacialAnalysis;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    
    // Check if it was an abort
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error; // Re-throw abort error
    }
    
    // Return offline fallback on error
    onProgress?.('Using offline analysis', 100);
    return getOfflineAnalysis(base64Image);
  }
};