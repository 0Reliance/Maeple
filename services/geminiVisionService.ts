import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FacialAnalysis } from "../types";
import { aiRouter } from "./ai";

// Validate and retrieve API Key - returns null if not available
const getApiKey = (): string | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key not found. Vision features will be limited.");
    return null;
  }
  return apiKey;
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

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
    });

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

// Schema for Facial Analysis
const facialAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    primaryEmotion: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    eyeFatigue: { type: Type.NUMBER, description: "0-1 scale, looking for drooping, redness, or lack of focus" },
    jawTension: { type: Type.NUMBER, description: "0-1 scale, looking for clenching or tightness" },
    maskingScore: { type: Type.NUMBER, description: "0-1 scale. High score implies a 'forced' expression vs authentic." },
    signs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of visual indicators (e.g. 'asymmetric smile', 'furrowed brow')"
    }
  },
  required: ["primaryEmotion", "confidence", "eyeFatigue", "jawTension", "maskingScore", "signs"]
};

/**
 * Default facial analysis when AI is not available
 */
const getDefaultFacialAnalysis = (): FacialAnalysis => ({
  primaryEmotion: "unknown",
  confidence: 0,
  eyeFatigue: 0.5,
  jawTension: 0.5,
  maskingScore: 0.5,
  signs: ["AI analysis not configured - go to Settings to enable"],
});

/**
 * Analyzes a selfie for neurodivergent markers (Masking, Fatigue).
 * Returns default values if AI is not configured.
 */
export const analyzeStateFromImage = async (base64Image: string): Promise<FacialAnalysis> => {
  try {
    const routed = await aiRouter.vision({
      imageData: base64Image,
      mimeType: "image/png",
      prompt: `Analyze this selfie for signs of neurodivergent burnout and masking.
Look for:
1. Eye Fatigue: Drooping eyelids, lack of focus, or 'glassy' look.
2. Jaw Tension: Clenched jaw, tight lips, or tension in the neck.
3. Masking: Is the smile authentic (Duchenne) or forced? Is there a disconnect between the eyes and mouth?
Return JSON matching the schema.`,
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
      return getDefaultFacialAnalysis();
    }

    const prompt = `
      Analyze this selfie for signs of neurodivergent burnout and masking.
      Look for:
      1. Eye Fatigue: Drooping eyelids, lack of focus, or 'glassy' look.
      2. Jaw Tension: Clenched jaw, tight lips, or tension in the neck.
      3. Masking: Is the smile authentic (Duchenne) or forced? Is there a disconnect between the eyes and mouth?
      
      Return a structured analysis.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: facialAnalysisSchema,
        systemInstruction: "You are a bio-feedback analyst specializing in detecting stress and masking signals.",
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    return JSON.parse(textResponse) as FacialAnalysis;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return getDefaultFacialAnalysis();
  }
};