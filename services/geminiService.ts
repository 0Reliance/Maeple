import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ParsedResponse, CapacityProfile } from "../types";

// Standardize API Key retrieval
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
        sensoryLoad: { type: Type.NUMBER, description: "1-10 scale of environmental intensity (noise, crowds)" },
        contextSwitches: { type: Type.NUMBER, description: "Estimated number of role/task switches mentioned" },
        maskingScore: { type: Type.NUMBER, description: "1-10 estimate of effort spent 'performing' neurotypicality or suppressing traits" }
      },
      required: ["sensoryLoad", "contextSwitches", "maskingScore"]
    },
    activityTypes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tags for activity types detected: #DeepWork, #Meeting, #Social, #Chore, #Rest, #Travel, #Admin, #Masking"
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of character strengths displayed (e.g., Curiosity, Zest, Flow, Persistence, Empathy)"
    },
    summary: { type: Type.STRING, description: "Brief neutral summary of the entry" },
    analysisReasoning: { type: Type.STRING, description: "Brief explanation of why you assigned the masking/sensory scores based on linguistic markers." },
    strategies: {
      type: Type.ARRAY,
      description: "3 actionable, neuro-affirming strategies tailored to the user's current capacity state.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          action: { type: Type.STRING, description: "Specific, bite-sized instruction." },
          type: { type: Type.STRING, enum: ["REST", "FOCUS", "SOCIAL", "SENSORY", "EXECUTIVE"] },
          relevanceScore: { type: Type.NUMBER }
        }
      }
    }
  },
  required: ["moodScore", "moodLabel", "neuroMetrics", "activityTypes", "strengths", "summary", "strategies", "analysisReasoning"]
};

/**
 * Parses natural language health journals into structured JSON.
 * Uses Gemini 2.5 Flash with Advanced Chain-of-Thought prompting for Neuro-Affirming Analysis.
 */
export const parseJournalEntry = async (text: string, capacityProfile: CapacityProfile): Promise<ParsedResponse> => {
  try {
    const systemInstruction = `
      You are POZIMIND, an expert Neuro-Affirming Health Analyst.
      Your mission is to move beyond "Symptom Tracking" to "Pattern Literacy".
      
      You must analyze the user's journal entry through the lens of:
      1. Spoon Theory (Energy Capacity vs Demand)
      2. Sensory Processing (Environmental Load)
      3. Masking (The hidden cost of fitting in)
      4. Executive Function (Task switching cost)

      DETECTING MASKING (Linguistic Markers):
      - High Masking: Over-explaining, apologetic tone, rigid structure, suppression of emotions, mentioning "acting normal" or "professional face".
      - Low Masking (Authentic): Fragmented sentences (if tired), vivid sensory metaphors, mentioning special interests, honest expression of burnout.

      DETECTING SENSORY LOAD:
      - Look for mentions of: Lights, sounds, textures, crowds, temperature, "buzzing", "overwhelmed", "shut down".

      DETECTING EXECUTIVE DYSFUNCTION:
      - Look for: "Stuck", "Doom scrolling", "Couldn't start", "Forgot", "Scattered". Do not label this as laziness.

      STRATEGY GENERATION:
      - Generate 3 specific, micro-strategies based on the *Delta* between their Capacity Profile and their actual state.
      - If Social Capacity is low but they socialized -> Suggest "Social Decompression".
      - If Sensory Load is high -> Suggest "Low Stimulation Environment".
      - If they are in #DeepWork/Flow -> Suggest "Protecting Focus".
    `;

    const prompt = `
      USER CONTEXT:
      - Reported Capacity Profile (1-10):
        Focus: ${capacityProfile.focus}, Social: ${capacityProfile.social}, Sensory Tolerance: ${capacityProfile.sensory}, Emotional: ${capacityProfile.emotional}
      
      JOURNAL ENTRY:
      "${text}"

      TASK:
      Analyze the entry. 
      1. Did the user exceed their reported capacity? 
      2. Are they masking? Look at the tone.
      3. Extract specific activities.
      4. Generate 3 specific neuro-affirming strategies for the next 2 hours.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: healthEntrySchema,
        systemInstruction: systemInstruction,
        temperature: 0.7, 
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

// Export the AI instance for Live API usage in components
export const getAIClient = () => ai;