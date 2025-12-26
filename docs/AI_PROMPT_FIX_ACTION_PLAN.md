# AI Prompt Fix Action Plan

**Date**: December 26, 2025  
**Priority**: CRITICAL - Blocks entire implementation  
**Estimated Time**: 2-3 hours

---

## Problem Statement

The current `geminiService.ts` prompt asks the AI to perform **subjective detection** that violates MAEPLE's core design principle of **objectivity**.

### Specific Issues

#### Issue 1: "Detecting Masking" is Subjective
```
Current Prompt:
DETECTING MASKING (Linguistic Markers):
- High Masking: Over-explaining, apologetic tone, rigid structure, suppression of emotions, mentioning "acting normal" or "professional face".
- Low Masking (Authentic): Fragmented sentences (if tired), vivid sensory metaphors, mentioning special interests, honest expression of burnout.

Problem:
- AI is asked to JUDGE whether user is "authentic" or "masking"
- This assumes AI knows user's internal intent
- Pathologizes normal communication styles (e.g., someone might naturally be apologetic due to social anxiety, not "masking")
- Violates principle: "You know your experience best"
```

**Why This is Harmful:**
1. **Invalidates User's Experience**: If AI says "you're masking" and user isn't, user feels misunderstood
2. **Assumes Intent**: The AI assumes it knows why someone speaks the way they do
3. **Medicalizes Normal Behavior**: Having an apologetic tone isn't inherently pathological
4. **Creates Power Imbalance**: System tells user about themselves rather than learning from user

---

#### Issue 2: "Detecting Sensory Load" is Subjective
```
Current Prompt:
DETECTING SENSORY LOAD:
- Look for mentions of: Lights, sounds, textures, crowds, temperature, "buzzing", "overwhelmed", "shut down".

Problem:
- This is actually GOOD - it asks to EXTRACT mentions, not detect internal state
- However, the 1-10 score assignment is still subjective
- How do we know it's a "7" vs "3" based on text alone?
```

**Why This is Problematic:**
- AI has no objective measure of sensory load
- Scale is arbitrary without baseline
- User's self-report should be primary source

---

#### Issue 3: "Detecting Executive Dysfunction" Labels Users
```
Current Prompt:
DETECTING EXECUTIVE DYSFUNCTION:
- Look for: "Stuck", "Doom scrolling", "Couldn't start", "Forgot", "Scattered". Do not label this as laziness.

Problem:
- Still uses term "executive dysfunction" - diagnostic language
- Even with "don't label as laziness" caveat, still pathologizes
- User didn't ask for diagnosis

**Why This is Problematic:**
- Medicalizes normal experiences
- Using diagnostic terms without clinical context
- "Executive dysfunction" is a clinical diagnosis, not something to infer from journal text
```

---

#### Issue 4: Decision Matrix Still Subjective
```
Current Prompt:
DECISION MATRIX (How to Respond):
- GREEN ZONE (High Capacity / High Mood): Encourage capitalization on strengths
- RED ZONE (Low Capacity / High Load): Validate struggle
- DISCREPANCY (High Masking Score): Gentle inquiry: "You seem to be pushing through. Is it safe to unmask?"
- INCONSISTENT (Text says "Fine", Mood is 1): Trust the Mood score. Ask about the discrepancy gently.

Problem:
- "DISCREPANCY (High Masking Score)" - assumes masking is detectable
- "You seem to be pushing through" - assumes user's internal state
- "Is it safe to unmask?" - assumes user IS masking
```

---

## The Solution: Rewrite Prompts for Objective Extraction

### Core Principle Change

**OLD APPROACH**: "Detect subjective states (masking, sensory load) based on linguistic markers"

**NEW APPROACH**: "Extract objective facts (what user said, what they mentioned) WITHOUT making interpretations"

---

## Revised Prompt Structure

### 1. Change "Detecting" to "Extracting"

```
OLD: DETECTING MASKING (Linguistic Markers)
NEW: EXTRACTING OBJECTIVE MENTIONS

✅ DO EXTRACT:
- User mentions: "I put on my professional face" → Mention: "professional face"
- User mentions: "I'm pretending to be okay" → Mention: "pretending to be okay"
- User mentions: "harsh fluorescent lights" → Mention: "harsh fluorescent lights"
- User mentions: "loud coffee shop" → Mention: "loud coffee shop"
- User mentions: "can't focus in this environment" → Mention: "can't focus"

❌ DO NOT INTERPRET:
- User says "I'm okay" → Do NOT say "but their tone suggests otherwise"
- User mentions "professional face" → Do NOT say "they are masking"
- User mentions apologetic language → Do NOT say "they are being inauthentic"
```

### 2. Remove "Sensory Load" Score - Use Mentions Instead

```
OLD: sensoryLoad: { type: Type.NUMBER, description: "1-10 scale of environmental intensity" }

NEW: sensoryMentions: { 
  type: Type.ARRAY, 
  items: { 
    type: Type.STRING,
    enum: ["lights", "sounds", "noise", "temperature", "crowds", "textures", "overwhelmed", "buzzing"]
  },
  description: "List of environmental factors user mentioned (extracted directly from text, not scored)"
}

OLD ANALYSIS: "Sensory load is 7/10" (subjective)
NEW ANALYSIS: ["lights", "noise"] (objective - what user said)
```

### 3. Remove "Masking Score" - Use Mentions Instead

```
OLD: maskingScore: { type: Type.NUMBER, description: "1-10 estimate of effort spent 'performing' neurotypicality" }

NEW: socialMaskingMentions: { 
  type: Type.ARRAY, 
  items: { type: Type.STRING },
  description: "List of masking-related terms user mentioned (e.g., 'professional face', 'acting normal', 'hiding how I feel'). Extract verbatim if possible."
}

OLD ANALYSIS: "Masking score is 8/10" (subjective)
NEW ANALYSIS: ["professional face", "hiding how I feel"] (objective - what user said)
```

### 4. Remove "Executive Dysfunction" - Extract Challenges Instead

```
OLD: DETECTING EXECUTIVE DYSFUNCTION:
- Look for: "Stuck", "Doom scrolling", "Couldn't start", "Forgot", "Scattered".

NEW: EXTRACTING EXECUTIVE CHALLENGES:
- User mentions: "I couldn't start" → Extract: "difficulty starting"
- User mentions: "doom scrolling" → Extract: "doom scrolling"
- User mentions: "forgot" → Extract: "forgot something"
- User mentions: "scattered" → Extract: "feeling scattered"

DO NOT: Label as "executive dysfunction" or any clinical term
```

### 5. Remove "Authenticity" Judgments

```
OLD: Low Masking (Authentic): Fragmented sentences, vivid sensory metaphors

NEW: Extract exactly what user says:
- User says: "I'm exhausted and can barely form sentences" → Extract: "exhausted, difficulty forming sentences"
- Do NOT judge if this is "authentic" or not
```

---

## Complete Revised Prompt

```typescript
const systemInstruction = `
You are Mae, voice of MAEPLE (Mental And Emotional Pattern Literacy Engine).

CRITICAL PRINCIPLE: OBJECTIVE EXTRACTION, NOT SUBJECTIVE INTERPRETATION

Your role is to EXTRACT what the user explicitly stated, NOT to interpret their internal state.

NEVER do:
❌ Say "you are masking" - you cannot know this
❌ Say "you seem stressed" - this is subjective
❌ Say "your tone suggests X" - you cannot read tone in text
❌ Make assumptions about intent or internal experience
❌ Assign numerical scores to subjective states (e.g., "sensory load: 7/10")

ALWAYS do:
✅ Extract verbatim what user mentioned
✅ Report objective facts (what was said, not what it "means")
✅ Validate user's own descriptions without adding interpretation
✅ Trust user's self-reported mood over your inferences
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
- Trust user's self-report
- Ask gently: "You mentioned 'fine' but rated your mood as 1/5. Would you like to share more about what's happening?"
- Do NOT say "you're in denial" (judgmental)

STRATEGY GENERATION:
- Base strategies on EXPLICIT mentions, not inferences
- If user mentioned difficulty starting → Offer "task initiation strategies"
- If user mentioned environmental challenges → Offer "sensory management strategies"
- If user mentioned social discomfort → Offer "social boundary strategies"
- Always present as options, not prescriptions
- Allow user to skip any suggestion

SUMMARY:
Your job is to be a careful transcriber of what the user says, not an interpreter of what they mean. Extract exactly what they mention, ask curious questions, and never assume you know their internal state.
`;
```

---

## Revised Schema

```typescript
const healthEntrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    moodScore: { 
      type: Type.NUMBER, 
      description: "User's self-reported mood rating (1-5). Trust their report." 
    },
    moodLabel: { 
      type: Type.STRING, 
      description: "One word label for user's self-reported mood" 
    },
    
    // ✅ NEW: Extracted mentions (not scored)
    environmentalMentions: {
      type: Type.ARRAY,
      items: { 
        type: Type.STRING,
        enum: ["lights", "noise", "sounds", "temperature", "crowds", "textures", "overwhelmed", "buzzing", "harsh", "bright", "dark"]
      },
      description: "Environmental factors user explicitly mentioned (extracted, not scored)"
    },
    
    socialMentions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Social/emotional phrases user mentioned verbatim (e.g., 'professional face', 'acting normal'). Extract as stated, do not label as 'masking'"
    },
    
    executiveMentions: {
      type: Type.ARRAY,
      items: { 
        type: Type.STRING,
        enum: ["difficulty starting", "procrastination", "doom scrolling", "forgot", "scattered", "overwhelmed", "stuck"]
      },
      description: "Executive challenges user mentioned (e.g., 'couldn't start', 'doom scrolling'). Do not use clinical terms like 'executive dysfunction'"
    },
    
    physicalMentions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Physical sensations user mentioned (e.g., 'droopy eyes', 'headache', 'exhaustion')"
    },
    
    // ❌ REMOVED: subjective scores
    // maskingScore, sensoryLoad - these should come from user, not AI
    
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
          severity: { type: Type.NUMBER, description: "User's self-reported severity (1-10)" }
        }
      }
    },
    activityTypes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Activity tags: #DeepWork, #Meeting, #Social, #Chore, #Rest, #Travel, #Admin"
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Character strengths user displayed (e.g., Curiosity, Persistence, Honesty)"
    },
    summary: { 
      type: Type.STRING, 
      description: "Brief neutral summary of what user mentioned" 
    },
    analysisReasoning: { 
      type: Type.STRING, 
      description: "Brief explanation of what you extracted from the text (not why you scored something)" 
    },
    strategies: {
      type: Type.ARRAY,
      description: "3 neuro-affirming strategies based on user's explicit mentions",
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
    },
    
    // ✅ NEW: Gentle inquiry based on mentions
    gentleInquiry: {
      type: Type.OBJECT,
      properties: {
        basedOn: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "What user mentioned that prompted this inquiry"
        },
        question: { type: Type.STRING },
        tone: { 
          type: Type.STRING, 
          enum: ["curious", "supportive", "informational"],
          description: "Must be 'curious' - never judgmental or interrogating"
        },
        skipAllowed: { type: Type.BOOLEAN },
        priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
      },
      description: "Optional gentle question based on explicit mentions (not interpretations)"
    }
  },
  required: ["moodScore", "moodLabel", "environmentalMentions", "socialMentions", "executiveMentions", "activityTypes", "strengths", "summary", "strategies", "analysisReasoning"]
};
```

---

## Example: Old vs. New Analysis

### Input Text
```
"The fluorescent lights in this office are killing me. I'm exhausted and put on my professional face for my boss. Couldn't start my work all day, just doom scrolling."
```

### OLD Analysis (Subjective - WRONG)
```json
{
  "moodScore": 2,
  "sensoryLoad": 8,    // ❌ Arbitrary score
  "maskingScore": 9,     // ❌ Subjective judgment
  "analysisReasoning": "User is showing signs of high masking and sensory overload. The apologetic tone suggests they're struggling to be authentic."
}
```

**Problems:**
- Scores are arbitrary
- "Masking" is a judgment
- "Apologizing" is inferred (user didn't apologize)
- Assumes user's internal state

### NEW Analysis (Objective - CORRECT)
```json
{
  "moodScore": 2,
  "environmentalMentions": ["fluorescent lights", "office environment", "harsh lighting"],
  "socialMentions": ["professional face", "acting normal for boss"],
  "executiveMentions": ["difficulty starting work", "doom scrolling"],
  "physicalMentions": ["exhaustion"],
  "analysisReasoning": "User mentioned harsh fluorescent lighting, putting on professional face for boss, difficulty starting work, and exhaustion. Reported mood is 2/5.",
  "gentleInquiry": {
    "basedOn": ["fluorescent lights", "professional face", "difficulty starting"],
    "question": "I noticed you mentioned harsh lighting, putting on a professional face, and difficulty starting work. How are you holding up right now?",
    "tone": "curious",
    "skipAllowed": true,
    "priority": "medium"
  }
}
```

**Improvements:**
- Extracts what user actually said
- No arbitrary scores
- No judgments about "authenticity"
- Gentle inquiry is curious, not interrogating
- User's experience is validated

---

## Implementation Steps

### Step 1: Update System Instruction (30 minutes)
- Replace current system instruction with revised version
- Emphasize extraction over interpretation
- Add examples of do's and don'ts

### Step 2: Update Schema (45 minutes)
- Remove: maskingScore, sensoryLoad (subjective scores)
- Add: environmentalMentions, socialMentions, executiveMentions, physicalMentions
- Add: gentleInquiry object
- Update descriptions to emphasize extraction

### Step 3: Update Validation Function (15 minutes)
- Update validateParsedResponse to handle new fields
- Add defaults for new arrays
- Ensure backward compatibility

### Step 4: Update Types (15 minutes)
- Update ParsedResponse interface to match new schema
- Update HealthEntry interface if needed
- Ensure type safety

### Step 5: Test Prompt Changes (45 minutes)
- Create test cases with various inputs
- Verify extraction is objective
- Verify no subjective interpretations
- Verify gentle inquiries are curious, not judgmental

### Step 6: Update Component Integration (1 hour)
- Update JournalEntry to use new mention arrays instead of scores
- Update displays to show mentions rather than scores
- Ensure backward compatibility with existing entries

---

## Testing Checklist

### Objectivity Tests
- [ ] Prompt does NOT ask AI to "detect" masking
- [ ] Prompt does NOT ask AI to score sensory load
- [ ] Prompt does NOT use clinical terms (executive dysfunction)
- [ ] All extractions are based on explicit mentions
- [ ] No interpretations or assumptions about internal state

### Extraction Tests
- [ ] Environmental mentions extracted correctly
- [ ] Social mentions extracted verbatim
- [ ] Executive challenges extracted without clinical terms
- [ ] Physical sensations extracted as stated

### Gentle Inquiry Tests
- [ ] Inquiries are based on explicit mentions
- [ ] Tone is always "curious" never judgmental
- [ ] No "you seem to be" language
- [ ] Skip always allowed

### Example Tests
- [ ] User says "I'm fine" with mood 1 → Trusts user, asks gently
- [ ] User mentions "professional face" → Extracts verbatim, doesn't label as masking
- [ ] User mentions apologetic language → Extracts, doesn't judge authenticity
- [ ] User mentions lights → Extracts lighting type, doesn't assign arbitrary score

---

## Risk Mitigation

### Risk: Breaking Changes

**Mitigation**: Keep old fields in database, add new fields
- maskingScore stays in existing entries (historical data)
- New entries use mention arrays
- Gradual migration strategy

### Risk: AI Still Subjective Despite New Prompt

**Mitigation**: 
- Extensive testing with diverse inputs
- A/B testing different prompt versions
- User feedback collection on AI responses
- Manual review of outputs during development

### Risk: Loss of "Pattern Literacy" Value

**Mitigation**:
- Pattern detection still works with mention arrays over time
- Can still identify patterns like "user often mentions lighting when mood is low"
- Actually MORE accurate because it's based on what user says, not interpretations

---

## Success Criteria

- [ ] System instruction emphasizes extraction over interpretation
- [ ] Schema uses mention arrays instead of subjective scores
- [ ] No "masking score" or "sensory load score" in outputs
- [ ] Gentle inquiries are curious, not judgmental
- [ ] All tests pass
- [ ] User feedback indicates objective, supportive experience
- [ ] No subjective judgments in AI responses

---

## Conclusion

This is a **critical fix** that aligns the AI prompts with MAEPLE's core design principles. The current prompts violate the "objective, not subjective" principle by asking the AI to detect and score inherently subjective states.

The revised approach focuses on **extraction** - capturing exactly what the user mentioned - without making interpretations or assumptions about internal state.

**Estimated Time**: 2-3 hours  
**Priority**: CRITICAL - Blocks entire implementation  
**Next Step**: Update geminiService.ts with new system instruction and schema
