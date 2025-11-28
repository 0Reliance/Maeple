
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ParsedResponse } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured health parsing
const healthEntrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    moodScore: { type: Type.NUMBER, description: "Rating from 1 (terrible) to 5 (excellent)" },
    moodLabel: { type: Type.STRING, description: "One word adjective describing the mood" },
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING },
          unit: { type: Type.STRING }
        }
      }
    },
    symptoms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          severity: { type: Type.NUMBER, description: "1-10 scale" }
        }
      }
    },
    neuroMetrics: {
      type: Type.OBJECT,
      properties: {
        spoonLevel: { type: Type.NUMBER, description: "Estimated Energy Capacity (1-10) based on text tone" },
        sensoryLoad: { type: Type.NUMBER, description: "1-10 scale of environmental intensity (noise, crowds)" },
        contextSwitches: { type: Type.NUMBER, description: "Estimated number of role/task switches mentioned" },
        maskingScore: { type: Type.NUMBER, description: "1-10 estimate of effort spent 'performing' neurotypicality" }
      },
      required: ["spoonLevel", "sensoryLoad", "contextSwitches", "maskingScore"]
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of character strengths displayed (e.g., Curiosity, Zest, Flow, Persistence, Empathy)"
    },
    summary: { type: Type.STRING, description: "Brief neutral summary of the entry" }
  },
  required: ["moodScore", "moodLabel", "neuroMetrics", "strengths", "summary"]
};

/**
 * Parses natural language health journals into structured JSON.
 * Uses Gemini 2.5 Flash for neurodiversity-affirming analysis.
 */
export const parseJournalEntry = async (text: string, manualSpoons?: number): Promise<ParsedResponse> => {
  try {
    const prompt = `
      You are a neurodiversity-affirming health analyst. Analyze this journal entry: "${text}".
      
      Your goal is to look beyond symptoms and identify:
      1. Capacity (Spoons): How much energy does the user have? (1=Empty, 10=Full). ${manualSpoons ? `User manually reported: ${manualSpoons}/10.` : ''}
      2. Sensory Load: Were they in loud, bright, or crowded places?
      3. Strengths: Did they show Curiosity, Flow, Zest, Kindness, or Persistence?
      4. Masking: Did they mention having to 'act normal' or hide their feelings?
      
      Return JSON adhering to the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: healthEntrySchema,
        systemInstruction: "You are an expert in neurodivergent burnout patterns. Prioritize identifying 'Flow States' and 'Sensory Overload'.",
      },
    });

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    return JSON.parse(textResponse) as ParsedResponse;
  } catch (error) {
    console.error("Parsing error:", error);
    throw error;
  }
};

/**
 * Performs a grounded search for health information.
 * Uses Gemini 2.5 Flash with Google Search tool.
 */
export const searchHealthInfo = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

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

// Export the AI instance for Live API usage in components
export const getAIClient = () => ai;
