# Debugging Router Path Analysis

## Issue Summary
User reported that FACS analysis returns 0 Action Units despite no errors in console.

## Investigation Timeline

### Initial User Logs (Feb 1, 2026)
```
13:55:39.386 [VisionServiceAdapter] analyzeFromImage called
13:55:39.386 [VisionServiceAdapter] Image data length: 21776
13:55:39.486 [GeminiVision] analyzeStateFromImage called
13:55:51.140 Vision router JSON parse failed, falling back to Gemini SDK
13:55:59.122 [VisionServiceAdapter] Analysis result: Object
13:55:59.123 [VisionServiceAdapter] Result confidence: 0.85
13:55:59.123 [VisionServiceAdapter] Action Units count: 3
13:56:45.372 Failed to parse or validate AI response, using fallback ZodError
```

### Key Findings

1. **Router Path Taken**: The code took the router path (`aiRouter.vision()`) instead of the direct SDK path
2. **Router Parse Failed**: "Vision router JSON parse failed, falling back to Gemini SDK"
3. **Fallback Error**: Final parsing failed with ZodError showing invalid objectiveObservations schema
4. **Original Schema Mismatch**: Router returned observations with `category` and `evidence` fields, but schema expected different structure

### Problem Location

The bug was in `geminiVisionService.ts`:

```typescript
const routed = await aiRouter.vision({
  imageData: base64Image,
  mimeType: "image/png",
  prompt: promptText,
});

if (routed?.content) {
  const { data, error } = safeParseAIResponse<FacialAnalysis>(routed.content, {
    context: 'GeminiVision:router',
    stripMarkdown: true,
  });
  if (error) {
    console.warn("Vision router JSON parse failed, falling back to Gemini SDK", error);
  } else if (data) {
    return data;  // <-- RETURNS EARLY! Skips logging!
  }
}
```

The router path returned data immediately, so the enhanced logging that was added to the direct SDK path **never executed**.

### Root Cause

The AI router was returning data in a different format than expected by the `FacialAnalysis` schema:

**Expected schema** (`objectiveObservations`):
```typescript
{
  category: "lighting" | "noise" | "tension" | "fatigue" | "speech-pace" | "tone",
  value: string,
  severity: "low" | "moderate" | "high",
  evidence: string
}
```

**What router returned** (from error):
```typescript
{
  category: "lighting",  // Valid
  value: string,         // Missing
  severity: string,       // Missing
  evidence: string        // Missing
}
```

### Enhanced Logging Added

To debug this in production, added comprehensive logging to the **router path**:

```typescript
console.log("[GeminiVision] Calling aiRouter.vision...");
const routed = await aiRouter.vision({...});

console.log("[GeminiVision] Router response received:", routed);
console.log("[GeminiVision] Router content type:", typeof routed?.content);
console.log("[GeminiVision] Router content (first 500 chars):", routed?.content?.substring?.(0, 500) || "NO CONTENT");
console.log("[GeminiVision] Router content length:", routed?.content?.length || 0);

if (routed?.content) {
  const { data, error } = safeParseAIResponse<FacialAnalysis>(routed.content, {...});
  console.log("[GeminiVision] Router parse result:", { data, error });
  
  if (error) {
    console.warn("Vision router JSON parse failed, falling back to Gemini SDK", error);
  } else if (data) {
    console.log("[GeminiVision] === ROUTER ANALYSIS RESULT ===");
    console.log("[GeminiVision] Confidence:", data.confidence);
    console.log("[GeminiVision] Action Units count:", data.actionUnits?.length || 0);
    console.log("[GeminiVision] Action Units:", data.actionUnits);
    console.log("[GeminiVision] Lighting:", data.lighting);
    console.log("[GeminiVision] FACS Interpretation:", data.facsInterpretation);
    console.log("[GeminiVision] Observations:", data.observations);
    console.log("[GeminiVision] Jaw Tension:", data.jawTension);
    console.log("[GeminiVision] Eye Fatigue:", data.eyeFatigue);
    
    // Warn if empty results from router
    if (!data.actionUnits || data.actionUnits.length === 0) {
      console.warn("[GeminiVision] ⚠️ WARNING: Router returned 0 Action Units!");
      console.warn("[GeminiVision] This may indicate:");
      console.warn("  1. Image quality too low after compression");
      console.warn("  2. Face not clearly visible in image");
      console.warn("  3. Lighting conditions insufficient");
      console.warn("  4. Gemini vision model unable to detect FACS markers");
      console.warn("[GeminiVision] Router returned:", JSON.stringify(data, null, 2));
    }
    
    return data;
  }
}
```

### Next Steps

1. **Deploy** to production with enhanced logging
2. **User tests** FACS analysis again
3. **Share new console logs** showing:
   - Router raw response
   - Router parse result
   - Full analysis result with Action Units

### Expected New Logs

After deployment, user should see logs like:
```
[GeminiVision] Calling aiRouter.vision...
[GeminiVision] Router response received: {content: "...", ...}
[GeminiVision] Router content type: string
[GeminiVision] Router content (first 500 chars): {"confidence":0.85,...}
[GeminiVision] Router content length: 1234
[GeminiVision] Router parse result: {data: {...}, error: null}
[GeminiVision] === ROUTER ANALYSIS RESULT ===
[GeminiVision] Confidence: 0.85
[GeminiVision] Action Units count: 3
[GeminiVision] Action Units: [{auCode: "AU6", ...}, ...]
```

This will reveal exactly what the router is returning and why Action Units might be empty.

## Status

- [x] Identified router path is being taken
- [x] Found router returns early, skipping logging
- [x] Added comprehensive logging to router path
- [x] Built successfully
- [x] Deployed to Vercel
- [ ] User to test and share new logs
- [ ] Analyze new logs to determine root cause