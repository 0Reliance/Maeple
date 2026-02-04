import { GoogleGenAI, Schema, Type } from "@google/genai";
import { CapacityProfile, ParsedResponse } from "../types";
import { aiRouter } from "./ai";
import { cacheService } from "./cacheService";
import { createCircuitBreaker } from "./circuitBreaker";
import { errorLogger } from "./errorLogger";
import { rateLimitedCall } from "./rateLimiter";
import { safeParseAIResponse } from "../utils/safeParse";

// Validate and retrieve API Key - returns null if not available
const getApiKey = (): string | null => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!envKey) {
    console.warn(
      "[GeminiService] API Key not found. AI features will be limited. " +
        "Add VITE_GEMINI_API_KEY to your .env file or configure in Settings."
    );
    console.warn("[GeminiService] Available env keys:", Object.keys(import.meta.env));
    return null;
  }
  return envKey;
};

// Lazy-loaded AI client - may be null if no API key
let _ai: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI | null => {
  if (_ai) return _ai;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
};

// Circuit breaker for journal parsing
const journalCircuitBreaker = createCircuitBreaker(
  async () => {
    const ai = getAI();
    if (!ai) {
      throw new Error("AI client not initialized");
    }
    return ai;
  },
  {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 60000, // 60 seconds for journal parsing
    monitoringPeriod: 120000, // 2 minutes
    onStateChange: state => {
      errorLogger.info(`Journal circuit breaker state changed: ${state}`);
    },
  }
);

// Circuit breaker for search
const searchCircuitBreaker = createCircuitBreaker(
  async () => {
    const ai = getAI();
    if (!ai) {
      throw new Error("AI client not initialized");
    }
    return ai;
  },
  {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000, // 30 seconds for search
    monitoringPeriod: 120000, // 2 minutes
    onStateChange: state => {
      errorLogger.info(`Search circuit breaker state changed: ${state}`);
    },
  }
);

// Check if AI is available
export const isAIConfigured = (): boolean => !!getApiKey();

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
          unit: { type: Type.STRING },
        },
      },
    },
    symptoms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          severity: { type: Type.NUMBER, description: "1-10 scale" },
        },
      },
    },
    neuroMetrics: {
      type: Type.OBJECT,
      properties: {
        environmentalMentions: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: [
              "lights",
              "noise",
              "sounds",
              "temperature",
              "crowds",
              "textures",
              "overwhelmed",
              "buzzing",
              "harsh",
              "bright",
              "dark",
            ],
          },
          description: "Environmental factors user explicitly mentioned (extracted, not scored)",
        },
        socialMentions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "Social/emotional phrases user mentioned verbatim (e.g., 'professional face', 'acting normal'). Extract as stated, do not label as 'masking'",
        },
        executiveMentions: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: [
              "difficulty starting",
              "procrastination",
              "doom scrolling",
              "forgot",
              "scattered",
              "overwhelmed",
              "stuck",
            ],
          },
          description:
            "Executive challenges user mentioned (e.g., 'couldn't start', 'doom scrolling'). Do not use clinical terms like 'executive dysfunction'",
        },
        physicalMentions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "Physical sensations user mentioned (e.g., 'droopy eyes', 'headache', 'exhaustion')",
        },
      },
      required: [
        "environmentalMentions",
        "socialMentions",
        "executiveMentions",
        "physicalMentions",
      ],
    },
    activityTypes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Tags for activity types detected: #DeepWork, #Meeting, #Social, #Chore, #Rest, #Travel, #Admin, #Masking",
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of character strengths displayed (e.g., Curiosity, Zest, Flow, Persistence, Empathy)",
    },
    summary: { type: Type.STRING, description: "Brief neutral summary of the entry" },
    analysisReasoning: {
      type: Type.STRING,
      description:
        "Brief explanation of why you assigned the masking/sensory scores based on linguistic markers.",
    },
    strategies: {
      type: Type.ARRAY,
      description:
        "3 actionable, neuro-affirming strategies tailored to the user's current capacity state.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          action: { type: Type.STRING, description: "Specific, bite-sized instruction." },
          type: { type: Type.STRING, enum: ["REST", "FOCUS", "SOCIAL", "SENSORY", "EXECUTIVE"] },
          relevanceScore: { type: Type.NUMBER },
        },
      },
    },

    // ✅ ADD: Objective observations extracted from text
    objectiveObservations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: ["lighting", "noise", "tension", "fatigue", "speech-pace", "tone"],
          },
          value: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "moderate", "high"] },
          evidence: { type: Type.STRING },
        },
        required: ["category", "value", "severity", "evidence"],
      },
      description: "Objective data extracted from text (only what user explicitly mentions)",
    },

    // ✅ ADD: Gentle inquiry generated by AI
    gentleInquiry: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        basedOn: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "What observations or text the question is based on",
        },
        question: { type: Type.STRING },
        tone: {
          type: Type.STRING,
          enum: ["curious", "supportive", "informational"],
        },
        skipAllowed: { type: Type.BOOLEAN },
        priority: {
          type: Type.STRING,
          enum: ["low", "medium", "high"],
        },
      },
      required: ["id", "basedOn", "question", "tone", "skipAllowed", "priority"],
      description: "Optional gentle question to ask user (only if high-severity observations)",
    },
  },
  required: [
    "moodScore",
    "moodLabel",
    "neuroMetrics",
    "activityTypes",
    "strengths",
    "summary",
    "strategies",
    "analysisReasoning",
  ],
};

// Helper to ensure response structure is valid
const validateParsedResponse = (parsed: any): ParsedResponse => {
  return {
    ...parsed,
    medications: Array.isArray(parsed.medications) ? parsed.medications : [],
    symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
    activityTypes: Array.isArray(parsed.activityTypes) ? parsed.activityTypes : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    strategies: Array.isArray(parsed.strategies) ? parsed.strategies : [],
    neuroMetrics: parsed.neuroMetrics || {
      environmentalMentions: [],
      socialMentions: [],
      executiveMentions: [],
      physicalMentions: [],
    },
  };
};

/**
 * Parses natural language health journals into structured JSON.
 * Uses Gemini 2.5 Flash with Advanced Chain-of-Thought prompting for Neuro-Affirming Analysis.
 */
export const parseJournalEntry = async (
  text: string,
  capacityProfile: CapacityProfile,
  options: { useCache?: boolean } = {}
): Promise<ParsedResponse> => {
  const { useCache = true } = options;
  const cacheKey = `journal:${text.substring(0, 50)}:${JSON.stringify(capacityProfile)}`;

  try {
    // Try cache first
    if (useCache) {
      const cached = await cacheService.get<ParsedResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    const systemInstruction = `
      You are Mae, voice of MAEPLE (Mental And Emotional Pattern Literacy Engine). MAEPLE is codenamed POZIMIND and is part of Poziverse.
      
      CRITICAL PRINCIPLE: OBJECTIVE EXTRACTION, NOT SUBJECTIVE INTERPRETATION

      Your role is to EXTRACT what the user explicitly stated, NOT to interpret their internal state.

      NEVER do:
      ❌ Say "you are masking" - you cannot know this
      ❌ Say "you seem stressed" - this is subjective
      ❌ Say "your tone suggests X" - you cannot read tone in text
      ❌ Make assumptions about intent or internal experience
      ❌ Assign numerical scores to subjective states (e.g., "sensory load: 7/10")

      ALWAYS do:
      ✅ Extract verbatim what the user mentioned
      ✅ Report objective facts (what was said, not what it "means")
      ✅ Validate the user's own descriptions without adding interpretation
      ✅ Trust the user's self-reported mood over your inferences
      ✅ Ask for clarification when something is ambiguous

      EXTRACTION GUIDELINES:

      1. EXTRACTING ENVIRONMENTAL MENTIONS:
         - "The fluorescent lights are killing me" → Extract: ["fluorescent lights", "harsh lighting"]
         - "This coffee shop is so loud" → Extract: ["coffee shop", "loud environment"]
         - "Can't focus with this buzzing" → Extract: ["buzzing sound", "focus difficulty"]

      2. EXTRACTING SOCIAL/EMOTIONAL EXPRESSIONS:
         - "I put on my professional face" → Extract: ["professional face"]
         - "Acting normal for my family" → Extract: ["acting normal"]
         - "Hiding how I really feel" → Extract: ["hiding true feelings"]
         - NOTE: Extract the phrase verbatim, do NOT label as "masking"

      3. EXTRACTING EXECUTIVE CHALLENGES:
         - "Couldn't start the task" → Extract: ["difficulty starting tasks"]
         - "Been doom scrolling all day" → Extract: ["doom scrolling"]
         - "Forgot my meeting" → Extract: ["forgot appointment"]
         - "Feel scattered" → Extract: ["feeling scattered"]
         - NOTE: Do NOT use clinical terms like "executive dysfunction"

      4. EXTRACTING PHYSICAL SENSATIONS:
         - "My eyes feel droopy" → Extract: ["droopy eyes"]
         - "Head is pounding" → Extract: ["headache"]
         - "Exhausted" → Extract: ["exhaustion"]

      DECISION MATRIX (How to Respond):

      IF USER MENTIONS CHALLENGING ENVIRONMENT:
      - Acknowledge: "I noticed you mentioned [lights/noise/etc.]"
      - Ask curious question: "How is that affecting you right now?"
      - Do NOT say "that must be stressful" (subjective)
      - Do NOT say "you should leave that environment" (prescriptive)

      IF USER MENTIONS SOCIAL DISCOMFORT:
      - Acknowledge: "I noticed you mentioned [acting normal/professional face/etc.]"
      - Ask curious question: "How does that feel for you?"
      - Do NOT say "you're masking" (labeling)
      - Do NOT say "you should be authentic" (prescriptive)

      IF USER MENTIONS EXECUTIVE DIFFICULTIES:
      - Acknowledge: "I noticed you mentioned [difficulty starting/scattered/etc.]"
      - Offer support: "That's a common experience. Would you like strategies for [specific challenge]?"
      - Do NOT use clinical terms
      - Do NOT diagnose

      IF THERE'S A DISCREPANCY:
      - Example: User says "I'm fine" but mood is 1/5
      - Trust the user's self-report
      - Ask gently: "You mentioned 'fine' but rated your mood as 1/5. Would you like to share more about what's happening?"
      - Do NOT say "you're in denial" (judgmental)

      STRATEGY GENERATION:
      - Base strategies on EXPLICIT mentions, not inferences
      - If user mentioned difficulty starting → Offer "task initiation strategies"
      - If user mentioned environmental challenges → Offer "sensory management strategies"
      - If user mentioned social discomfort → Offer "social boundary strategies"
      - Always present as options, not prescriptions
      - Allow the user to skip any suggestion

      OBJECTIVE OBSERVATIONS GENERATION:

ONLY extract observations if user EXPLICITLY mentions them in text:
- "The fluorescent lights are killing me" → Extract: lighting (high severity)
- "This coffee shop is so loud" → Extract: noise (moderate severity)
- "My eyes feel droopy" → Extract: fatigue (moderate severity)
- "I'm talking really fast right now" → Extract: speech-pace (moderate severity)
- "My voice sounds strained" → Extract: tone (high severity)

DO NOT extract if not explicitly mentioned:
- ❌ "You seem stressed" - NEVER infer stress
- ❌ "You're masking" - NEVER infer masking
- ❌ "Sensory load is high" - NEVER score or assign numerical values

Each observation MUST include:
- category: One of: lighting, noise, tension, fatigue, speech-pace, tone
- value: What user actually said (verbatim or close to it)
- severity: low, moderate, or high (based on user's intensity of language)
- evidence: "mentioned in text"

GENTLE INQUIRY GENERATION:

ONLY generate gentle inquiry if:
- User mentions high-severity observations, AND
- The observation could be affecting their state, AND
- A question would be genuinely helpful

Example of WHEN to generate gentle inquiry:
- User says "fluorescent lights are killing me" → Ask: "How is the lighting affecting you right now?"
- User says "my head is pounding" → Ask: "Would you like strategies for managing headache?"

Example of WHEN NOT to generate gentle inquiry:
- Low or moderate severity observations → No inquiry needed
- User clearly states their state → No inquiry needed
- Observation is minor or environmental → No inquiry needed

Gentle inquiry format:
- id: unique identifier
- basedOn: Array of observations or text question relates to
- question: Open-ended, curious question (not yes/no if possible)
- tone: "curious" (never "interrogating" or "demanding")
- skipAllowed: always true
- priority: "high" only if multiple high-severity observations, else "medium"

      SUMMARY:
      Your job is to be a careful transcriber of what the user says, not an interpreter of what they mean. Extract exactly what they mention, ask curious questions, and never assume you know their internal state.
    `;

    const prompt = `
      USER CONTEXT:
      - Reported Capacity Profile (1-10):
        Focus: ${capacityProfile.focus}, Social: ${capacityProfile.social}, Sensory Tolerance: ${capacityProfile.sensory}, Emotional: ${capacityProfile.emotional}
      
      JOURNAL ENTRY:
      "${text}"

      TASK:
      Analyze the entry using the Decision Matrix.
      1. Determine the user's "Zone" (Green/Red/Discrepancy).
      2. Did the user exceed their reported capacity? 
      3. Extract only what the user explicitly mentions (no inference).
      4. Extract specific activities.
      5. Generate 3 specific neuro-affirming strategies for the next 2 hours based on their Zone.
    `;

    // Prefer router (multi-provider); fallback to direct Gemini client
    const routerResult = await aiRouter.chat({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      responseFormat: "json",
      temperature: 0.7,
    });

    if (routerResult?.content) {
      const { data, error } = safeParseAIResponse<ParsedResponse>(routerResult.content, {
        context: 'geminiService:router',
        stripMarkdown: true,
      });
      if (error) {
        console.warn("Router JSON parse failed, falling back to Gemini SDK", error);
      } else if (data) {
        return validateParsedResponse(data);
      }
    }

    const ai = getAI();
    if (!ai) {
      return getDefaultParsedResponse(text);
    }

    const response = await rateLimitedCall(
      async () => {
        const ai = await journalCircuitBreaker.execute();

        return await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: healthEntrySchema,
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
      },
      { priority: 5 }
    ); // Journal parsing is high priority

    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");

    const { data, error } = safeParseAIResponse<ParsedResponse>(textResponse, {
      context: 'geminiService:direct',
      stripMarkdown: true,
    });
    if (error) {
      throw new Error(error);
    }
    const validated = validateParsedResponse(data!);

    // Cache successful results
    if (useCache) {
      await cacheService.set(cacheKey, validated, { ttl: 86400000 }); // 24 hours
    }

    return validated;
  } catch (error) {
    console.error("Parsing error:", error);
    return getDefaultParsedResponse(text);
  }
};

/**
 * Default response when AI is not available
 */
const getDefaultParsedResponse = (text: string): ParsedResponse => ({
  moodScore: 3,
  moodLabel: "Recorded",
  medications: [],
  symptoms: [],
  neuroMetrics: {
    environmentalMentions: [],
    socialMentions: [],
    executiveMentions: [],
    physicalMentions: [],
  },
  activityTypes: [],
  strengths: [],
  summary: text.slice(0, 200) + (text.length > 200 ? "..." : ""),
  analysisReasoning:
    "AI analysis not configured. Go to Settings → AI Providers to enable intelligent analysis.",
  strategies: [
    {
      id: "setup-ai",
      title: "Enable AI Analysis",
      action: "Configure an AI provider in Settings to get personalized insights.",
      type: "EXECUTIVE",
      relevanceScore: 1,
    },
  ],
});

/**
 * Performs a grounded search for health information.
 * Uses Gemini 2.5 Flash with Google Search tool.
 * Returns null if AI is not configured.
 */
export const searchHealthInfo = async (query: string) => {
  try {
    // Prefer router
    const routed = await aiRouter.search({ query });
    if (routed) {
      return {
        text: routed.content,
        grounding: routed.sources,
      };
    }

    const ai = getAI();
    if (!ai) {
      return null;
    }

    const response = await rateLimitedCall(
      () =>
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: query,
          config: {
            tools: [{ googleSearch: {} }],
          },
        }),
      { priority: 3 } // Search is medium priority
    );

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks,
    };
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
};

// Export the AI instance for Live API usage in components
export const getAIClient = (): GoogleGenAI | null => getAI();