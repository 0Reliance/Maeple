import { GoogleGenAI, Schema, Type } from "@google/genai";
import { FacialAnalysis } from "../types";
import { aiRouter } from "./ai";
import { cacheService } from "./cacheService";
import { errorLogger } from "./errorLogger";
import { rateLimitedCall } from "./rateLimiter";
import { safeParseAIResponse } from "../utils/safeParse";

// Note: Circuit breaker is handled by VisionServiceAdapter.
// This service is a pure function - resilience is managed at the adapter layer.

// Validate and retrieve API Key - returns null if not available
const getApiKey = (): string | null => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (import.meta.env.DEV) {
    console.log("[GeminiVision] API key loaded");
  }

  if (!envKey) {
    console.warn(
      "[GeminiVision] API Key not found. Vision features will be limited. " +
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
          mimeType: mimeType,
        },
      });
      parts.push({ text: prompt });
    } else {
      parts.push({ text: prompt });
    }

    const response = await rateLimitedCall(
      () =>
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

// Enhanced FACS Schema - based on Ekman & Friesen's Facial Action Coding System
const facialAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    confidence: { type: Type.NUMBER, description: "Overall confidence in the analysis (0-1)" },

    // NEW: Structured Action Unit detection
    actionUnits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          auCode: {
            type: Type.STRING,
            description: "FACS Action Unit code (e.g., 'AU1', 'AU4', 'AU6', 'AU12', 'AU24')",
          },
          name: {
            type: Type.STRING,
            description: "Anatomical name (e.g., 'Inner Brow Raiser', 'Brow Lowerer')",
          },
          intensity: {
            type: Type.STRING,
            enum: ["A", "B", "C", "D", "E"],
            description: "FACS intensity: A=trace, B=slight, C=marked, D=severe, E=maximum",
          },
          intensityNumeric: { type: Type.NUMBER, description: "Numeric intensity 1-5" },
          confidence: { type: Type.NUMBER, description: "Detection confidence 0-1" },
        },
        required: ["auCode", "name", "intensity", "intensityNumeric", "confidence"],
      },
      description: "Detected FACS Action Units with intensity ratings",
    },

    // NEW: FACS-based interpretation
    facsInterpretation: {
      type: Type.OBJECT,
      properties: {
        duchennSmile: {
          type: Type.BOOLEAN,
          description: "True if AU6+AU12 detected (genuine smile)",
        },
        socialSmile: {
          type: Type.BOOLEAN,
          description: "True if AU12 without AU6 (posed/social smile)",
        },
        maskingIndicators: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Signs of emotional suppression",
        },
        fatigueIndicators: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Signs of tiredness",
        },
        tensionIndicators: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Signs of stress/tension",
        },
      },
      description: "Interpretation of AU combinations",
    },

    // Legacy observation fields (backward compatible)
    observations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          value: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "moderate", "high"] },
          evidence: { type: Type.STRING },
        },
      },
      description: "List of objective visual observations",
    },
    lighting: {
      type: Type.STRING,
      description: "Lighting condition: 'bright fluorescent', 'soft natural', 'low light', etc.",
    },
    lightingSeverity: {
      type: Type.STRING,
      enum: ["low", "moderate", "high"],
      description: "How harsh the lighting is",
    },
    environmentalClues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Background elements (e.g., 'busy office', 'blank wall', 'outdoor')",
    },

    // Legacy numeric fields (derived from AUs for backward compatibility)
    jawTension: { type: Type.NUMBER, description: "0-1 tension score derived from AU4, AU24" },
    eyeFatigue: { type: Type.NUMBER, description: "0-1 fatigue score derived from ptosis, AU43" },
  },
  required: [
    "confidence",
    "actionUnits",
    "observations",
    "lighting",
    "lightingSeverity",
    "environmentalClues",
  ],
};

/**
 * Makes a direct API call to Gemini SDK, bypassing the router
 * Used as a fallback when router is unavailable
 */
const makeDirectGeminiCall = async (
  base64Image: string,
  prompt: string,
  onProgress?: (stage: string, progress: number) => void,
  timeout: number = 45000,
  signal?: AbortSignal
): Promise<FacialAnalysis> => {
  console.log("[DirectGemini] Making direct API call to Gemini SDK");
  
  const ai = getAI();
  if (!ai) {
    throw new Error("Gemini AI client not initialized - no API key available");
  }

  onProgress?.("Connecting directly to Gemini API", 20);

  // Create timeout promise
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Direct API timeout after ${timeout / 1000} seconds`));
    }, timeout);

    signal?.addEventListener("abort", () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      reject(new DOMException("Direct API call cancelled by user", "AbortError"));
    });
  });

  try {
    onProgress?.("Sending image directly to API", 25);
    
    const response = await Promise.race([
      rateLimitedCall(
        async () => {
          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
              parts: [
                { inlineData: { mimeType: "image/png", data: base64Image } },
                { text: prompt },
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: facialAnalysisSchema,
              systemInstruction: `You are a certified FACS (Facial Action Coding System) expert trained in the methodology developed by Paul Ekman and Wallace Friesen.

Your role: Analyze facial images with scientific precision to detect specific Action Units (AUs) - individual muscle movements that compose facial expressions.

Critical Rules:
1. NEVER label emotions directly (no "happy", "sad", "angry")
2. ALWAYS report specific AU codes with intensity ratings (A-E scale)
3. Identify AU combinations that reveal authenticity vs. masking:
   - AU6+AU12 = Duchenne (genuine) smile
   - AU12 alone = Social/posed smile (potential masking)
   - AU4+AU24 = Tension/stress cluster
4. Note physical indicators: ptosis (eyelid droop), asymmetry, muscle tension
5. Report lighting and environmental factors that affect confidence

Your analysis helps neurodivergent users recognize when they are masking and identify fatigue/stress they may not consciously notice. Be precise, evidence-based, and compassionate in your scientific objectivity.`,
            },
          });
          return result;
        },
        { priority: 4 }
      ),
      timeoutPromise,
    ]);

    // Clear timeout on success
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    onProgress?.("Parsing direct API response", 85);

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No analysis content received from direct API call");
    }

    onProgress?.("Validating direct API data", 90);

    const { data, error } = safeParseAIResponse<FacialAnalysis>(textResponse, {
      context: 'GeminiVision:direct',
      stripMarkdown: true,
    });
    if (error) {
      throw new Error(error);
    }
    let result = data!;
    
    // Unwrap facs_analysis wrapper if present (AI sometimes wraps the response)
    if ((result as any).facs_analysis && typeof (result as any).facs_analysis === 'object') {
      console.log('[DirectGemini] Unwrapping facs_analysis wrapper');
      result = (result as any).facs_analysis;
    }
    
    console.log("[DirectGemini] Direct API call successful:", result);
    
    onProgress?.("Direct API analysis complete", 100);
    return result;
  } catch (error) {
    // Clear timeout on error
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    console.error("[DirectGemini] Direct API call failed:", error);
    throw error;
  }
};

/**
 * Offline fallback analysis based on basic image metrics
 */
const getOfflineAnalysis = (_base64Image: string): FacialAnalysis => ({
  confidence: 0.3,
  actionUnits: [], // No AU detection possible offline
  facsInterpretation: {
    duchennSmile: false,
    socialSmile: false,
    maskingIndicators: [],
    fatigueIndicators: ["Unable to analyze - offline mode"],
    tensionIndicators: [],
  },
  observations: [],
  lighting: "unknown",
  lightingSeverity: "moderate",
  environmentalClues: ["Offline analysis - AI unavailable"],
  jawTension: 0,
  eyeFatigue: 0,
});

/**
 * Analyzes a selfie for neurodivergent markers (Masking, Fatigue).
 * Returns default values if AI is not configured.
 */
export const analyzeStateFromImage = async (
  base64Image: string,
  options: {
    timeout?: number;
    onProgress?: (stage: string, progress: number) => void;
    signal?: AbortSignal;
    useCache?: boolean;
  } = {}
): Promise<FacialAnalysis> => {
  console.log("[GeminiVision] analyzeStateFromImage called");
  console.log("[GeminiVision] Options:", options);
  
  const { timeout = 30000, onProgress, signal, useCache = true } = options;

  // Create cache key from image hash (using first 100 chars for simplicity)
  const cacheKey = `vision:${base64Image.substring(0, 100)}`;

  // Define prompt text here so it's available for all code paths
  const promptText = `You are a certified expert in Facial Action Coding System (FACS) developed by Ekman and Friesen.

Analyze this facial image with scientific precision. Your task is to identify specific muscle movements, NOT emotions.

## FACS Action Unit Detection

Identify ALL active Action Units (AUs) present and rate their intensity:
- A = Trace (barely visible)
- B = Slight (small but clear)
- C = Marked (obvious)
- D = Severe (pronounced)
- E = Maximum (extreme)

Key AUs to detect:
- AU1: Inner Brow Raiser (frontalis, pars medialis) - associated with worry/sadness
- AU4: Brow Lowerer (corrugator supercilii) - concentration, anger, distress
- AU6: Cheek Raiser (orbicularis oculi, pars orbitalis) - genuine smile marker
- AU7: Lid Tightener - concentration, squinting
- AU12: Lip Corner Puller (zygomaticus major) - smile
- AU14: Dimpler - suppression, contempt
- AU15: Lip Corner Depressor - sadness
- AU17: Chin Raiser - doubt, sadness
- AU24: Lip Pressor (orbicularis oris) - tension, stress
- AU43: Eyes Closed - fatigue
- Ptosis: Drooping eyelids - fatigue indicator

## Interpretation Rules

1. **Duchenne Smile**: AU6 + AU12 together = genuine/authentic smile
2. **Social/Posed Smile**: AU12 WITHOUT AU6 = masking or social performance
3. **Tension Cluster**: AU4 + AU24 = stress/suppression
4. **Fatigue Cluster**: Ptosis + AU43 + reduced AU intensity = tiredness

## Additional Observations

- Note lighting conditions (affects analysis confidence)
- Note environmental elements visible
- Calculate jawTension (0-1) from AU4, AU24 intensity
- Calculate eyeFatigue (0-1) from ptosis, AU43 detection

Return structured JSON matching schema. Be precise and evidence-based.`;

  try {
    // Check if AI is available before proceeding
    console.log("[GeminiVision] Checking AI router availability...");
    const isAvailable = aiRouter.isAIAvailable();
    console.log("[GeminiVision] AI router available:", isAvailable);
    
    if (!isAvailable) {
      console.warn("[FACS] AI router not available, attempting direct SDK fallback");
      
      // Try direct SDK before giving up
      const ai = getAI();
      if (ai) {
        console.log("[FACS] Direct SDK available, making API call directly");
        onProgress?.("Using direct API connection", 10);
        
        try {
          const result = await makeDirectGeminiCall(base64Image, promptText, onProgress, timeout, signal);
          console.log("[FACS] Direct SDK call successful:", result);
          return result;
        } catch (directError) {
          console.error("[FACS] Direct SDK call failed:", directError);
          console.warn("[FACS] Both router and direct SDK failed, using offline fallback");
        }
      } else {
        console.error("[FACS] No API key configured, checking environment");
        console.log("[FACS] Router state:", aiRouter);
      }
      
      onProgress?.("AI not configured, using offline fallback", 5);
      const offlineResult = getOfflineAnalysis(base64Image);
      console.log("[FACS] Returning offline result:", offlineResult);
      return offlineResult;
    }

    onProgress?.("AI provider available", 8);

    // Try to get from cache first
    if (useCache) {
      const cached = await cacheService.get<FacialAnalysis>(cacheKey);
      if (cached) {
        onProgress?.("Retrieved cached analysis", 100);
        return cached;
      }
    }

    // Check if router has vision capability
    onProgress?.("Checking AI availability", 5);

    const routed = await aiRouter.vision({
      imageData: base64Image,
      mimeType: "image/png",
      prompt: promptText,
      signal,
    });

    if (routed?.content) {
      const { data, error } = safeParseAIResponse<FacialAnalysis>(routed.content, {
        context: 'GeminiVision:router',
        stripMarkdown: true,
      });
      if (error) {
        console.warn("Vision router JSON parse failed, falling back to Gemini SDK", error);
      } else if (data) {
        onProgress?.("Parsing AI response", 90);
        // Unwrap facs_analysis wrapper if present (AI sometimes wraps the response)
        let result = data;
        if ((result as any).facs_analysis && typeof (result as any).facs_analysis === 'object') {
          console.log('[GeminiVision:router] Unwrapping facs_analysis wrapper');
          result = (result as any).facs_analysis;
        }
        return result;
      }
    }

    const ai = getAI();
    if (!ai) {
      onProgress?.("AI not configured, using offline fallback", 95);
      return getOfflineAnalysis(base64Image);
    }

    onProgress?.("Preparing analysis request", 10);

    // Create timeout promise with proper cleanup (45 seconds - increased from 30)
    let timeoutId: NodeJS.Timeout | null = null;
    const analysisTimeout = Math.max(timeout, 45000); // Ensure at least 45 seconds

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`AI analysis timeout after ${analysisTimeout / 1000} seconds`));
      }, analysisTimeout);

      signal?.addEventListener("abort", () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        reject(new DOMException("Analysis cancelled by user", "AbortError"));
      });
    });

    onProgress?.("Encoding image for transmission", 15);

    let analysisStarted = false;
    const response = await Promise.race([
      rateLimitedCall(
        async () => {
          try {
            onProgress?.("Connecting to Gemini API", 20);
            const ai = getAI();
            if (!ai) {
              throw new Error("AI client not initialized - check API key configuration");
            }

            onProgress?.("Sending image to AI service", 25);
            analysisStarted = true;

            const result = await ai.models.generateContent({
              model: "gemini-2.5-flash", // Gemini 2.5 with enhanced vision + segmentation
              contents: {
                parts: [
                  { inlineData: { mimeType: "image/png", data: base64Image } },
                  { text: promptText },
                ],
              },
              config: {
                responseMimeType: "application/json",
                responseSchema: facialAnalysisSchema,
                systemInstruction: `You are a certified FACS (Facial Action Coding System) expert trained in the methodology developed by Paul Ekman and Wallace Friesen.

Your role: Analyze facial images with scientific precision to detect specific Action Units (AUs) - individual muscle movements that compose facial expressions.

Critical Rules:
1. NEVER label emotions directly (no "happy", "sad", "angry")
2. ALWAYS report specific AU codes with intensity ratings (A-E scale)
3. Identify AU combinations that reveal authenticity vs. masking:
   - AU6+AU12 = Duchenne (genuine) smile
   - AU12 alone = Social/posed smile (potential masking)
   - AU4+AU24 = Tension/stress cluster
4. Note physical indicators: ptosis (eyelid droop), asymmetry, muscle tension
5. Report lighting and environmental factors that affect confidence

Your analysis helps neurodivergent users recognize when they are masking and identify fatigue/stress they may not consciously notice. Be precise, evidence-based, and compassionate in your scientific objectivity.`,
              },
            });

            onProgress?.("Received response from AI", 75);
            return result;
          } catch (err) {
            // Provide context-aware error messages
            if (analysisStarted) {
              onProgress?.("Error during analysis processing", 80);
            } else {
              onProgress?.("Error connecting to AI service", 30);
            }
            throw err;
          }
        },
        { priority: 4 }
      ),
      timeoutPromise,
    ]);

    // Clear timeout on success
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    onProgress?.("Parsing facial analysis results", 85);

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No analysis content received from AI");
    }

    onProgress?.("Validating analysis data", 95);

    console.log("[GeminiVision] Raw AI response (first 500 chars):", textResponse.substring(0, 500));
    console.log("[GeminiVision] Full AI response length:", textResponse.length);

    const { data, error } = safeParseAIResponse<FacialAnalysis>(textResponse, {
      context: 'GeminiVision:main',
      stripMarkdown: true,
    });
    
    if (error) {
      console.error("[GeminiVision] Failed to parse AI response:", error);
      console.error("[GeminiVision] Raw response was:", textResponse);
      return getOfflineAnalysis(base64Image);
    }
    
    let result = data!;
    
    // Unwrap facs_analysis wrapper if present (AI sometimes wraps the response)
    if ((result as any).facs_analysis && typeof (result as any).facs_analysis === 'object') {
      console.log('[GeminiVision] Unwrapping facs_analysis wrapper');
      result = (result as any).facs_analysis;
    }
    
    // CRITICAL: Log what AI actually returned
    console.log("[GeminiVision] === ANALYSIS RESULT ===");
    console.log("[GeminiVision] Confidence:", result.confidence);
    console.log("[GeminiVision] Action Units count:", result.actionUnits?.length || 0);
    console.log("[GeminiVision] Action Units:", result.actionUnits);
    console.log("[GeminiVision] Lighting:", result.lighting);
    console.log("[GeminiVision] FACS Interpretation:", result.facsInterpretation);
    console.log("[GeminiVision] Observations:", result.observations);
    console.log("[GeminiVision] Jaw Tension:", result.jawTension);
    console.log("[GeminiVision] Eye Fatigue:", result.eyeFatigue);
    
    // Warn if empty results
    if (!result.actionUnits || result.actionUnits.length === 0) {
      console.warn("[GeminiVision] � WARNING: AI returned 0 Action Units!");
      console.warn("[GeminiVision] This may indicate:");
      console.warn("  1. Image quality too low after compression");
      console.warn("  2. Face not clearly visible in image");
      console.warn("  3. Lighting conditions insufficient");
      console.warn("  4. Gemini vision model unable to detect FACS markers");
      console.warn("[GeminiVision] Full response:", JSON.stringify(result, null, 2));
    }

    // Cache successful results with confidence threshold
    if (useCache && result.confidence && result.confidence > 0.5) {
      await cacheService.set(cacheKey, result, { ttl: 86400000 }); // 24 hours
    }

    onProgress?.("Analysis complete", 100);
    return result;
  } catch (error) {
    console.error("Vision Analysis Error:", error);

    // Check if it was an abort
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // Re-throw abort error
    }

    // Provide user-friendly error context
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorLogger.warning("Vision analysis took too long", {
          timeout: timeout || 45000,
          originalError: error.message,
        });
      } else if (error.message.includes("permission") || error.message.includes("API key")) {
        errorLogger.warning("Vision API not properly configured", { error: error.message });
      }
    }

    // Return offline fallback on error
    onProgress?.("Using offline fallback analysis", 100);
    return getOfflineAnalysis(base64Image);
  }
};