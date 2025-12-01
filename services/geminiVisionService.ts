import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FacialAnalysis } from "../types";

// Robustly retrieve API Key
const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates or edits images based on prompt.
 * Uses Gemini 2.5 Flash Image (Nano Banana).
 */
export const generateOrEditImage = async (
  prompt: string, 
  base64Image?: string,
  mimeType: string = "image/png"
): Promise<string> => {
  
  const model = "gemini-2.5-flash-image";
  const parts: any[] = [];

  if (base64Image) {
    // Editing mode
    parts.push({
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    });
    parts.push({ text: prompt }); // Instruction for edit
  } else {
    // Generation mode
    parts.push({ text: prompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
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
 * Analyzes a selfie for neurodivergent markers (Masking, Fatigue).
 * Uses Gemini 2.5 Flash.
 */
export const analyzeStateFromImage = async (base64Image: string): Promise<FacialAnalysis> => {
  try {
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
    throw error;
  }
};