# FACS Documentation Update Plan

**Created:** February 8, 2026
**Status:** Draft - Awaiting Implementation
**Priority:** High - Critical Bug Fixes Need Documentation

---

## Executive Summary

Recent fixes to the FACS (Facial Action Coding System) analysis system require comprehensive documentation updates. Two critical issues were resolved:

1. **AI Response Parsing Issue** - AI sometimes wraps responses in `{ facs_analysis: { ... } }` structure
2. **Quality Check Blocking** - Incorrect alert blocking valid results from display

This plan ensures all documentation accurately reflects current implementation, data structures, and system behavior.

---

## Recent Code Changes (Feb 2026)

### 1. AI Response Parsing Fix

**Files Modified:**
- `src/utils/transformAIResponse.ts` - Created new utility
- `src/services/geminiVisionService.ts` - Updated all three code paths

**Problem:**
Gemini AI sometimes returns data in two different formats:
- Direct: `{ actionUnits: [...], facsInterpretation: {...}, ... }`
- Wrapped: `{ facs_analysis: { actionUnits: [...], facsInterpretation: {...}, ... } }`

**Solution:**
Created centralized `transformAIResponse()` utility that:
- Detects and unwraps `facs_analysis` wrapper when present
- Handles both camelCase and snake_case field names
- Transforms to standardized `FacialAnalysis` interface
- Provides detailed logging for debugging

**Code Paths Updated:**
1. `makeDirectGeminiCall()` - Direct API fallback
2. `aiRouter.vision()` path - Router-based analysis
3. Main `analyzeStateFromImage()` path - Standard Gemini SDK

### 2. Quality Check Fix

**Files Modified:**
- `src/services/comparisonEngine.ts` - Updated `checkDetectionQuality()`
- `src/components/StateCheckResults.tsx` - Updated quality warning handling

**Problem:**
Quality check was blocking valid results:
- `canProceed = false` for scores below 30
- "Did not get good enough picture" alert showing for valid analyses
- Users couldn't see results even with valid AU detections

**Solution:**
- Changed `canProceed` to always be `true`
- Quality check now informational only, not a blocker
- Users see results regardless of quality score
- Added "View Results Anyway" button for both low and medium quality

---

## Documentation Files Requiring Updates

### 1. specifications/COMPLETE_SPECIFICATIONS.md

**Current Issues:**
- Section 2.2 "Bio-Mirror Technology" mentions v0.97.6 updates but missing v0.97.9 changes
- Data model in section 2.2 doesn't reflect current `FacialAnalysis` interface
- Missing documentation of `transformAIResponse` utility
- Quality check behavior not documented

**Required Updates:**

#### 2.1 Add New Version Information

```markdown
**v0.97.9 (February 2026) - AI Response Parsing & Quality Check Fixes**

- **Centralized Response Transformation**: Created `transformAIResponse()` utility to handle AI response format variations
- **Multi-Format Support**: Handles both direct and wrapped AI responses (camelCase + snake_case)
- **Non-Blocking Quality Checks**: Quality assessment now informational, allowing users to see all results
- **Enhanced Debugging**: Detailed logging for AI response parsing pipeline
- **Improved User Experience**: Removed "Did not get good enough picture" false alerts
```

#### 2.2 Update FacialAnalysis Interface Documentation

Add to section 2.2:

```markdown
interface FacialAnalysis {
  // Core FACS Data
  confidence: number; // 0-1 overall confidence
  
  // Structured Action Units (NEW)
  actionUnits: ActionUnit[]; // Detected FACS AUs with intensity
  
  // FACS Interpretation (NEW)
  facsInterpretation: {
    duchennSmile: boolean; // AU6+AU12 = genuine
    socialSmile: boolean; // AU12 alone = social
    maskingIndicators: string[]; // Signs of emotional suppression
    fatigueIndicators: string[]; // Signs of tiredness
    tensionIndicators: string[]; // Signs of stress
  };
  
  // Observations
  observations: Array<{
    category: "lighting" | "environmental" | "tension" | "fatigue";
    value: string;
    evidence: string;
    severity: "low" | "moderate" | "high";
  }>;
  
  // Environmental Context
  lighting: string; // "bright fluorescent", "soft natural", etc.
  lightingSeverity: "low" | "moderate" | "high";
  environmentalClues: string[]; // Background elements
  
  // Legacy Numeric Fields (for backward compatibility)
  jawTension: number; // 0-1, derived from AU4, AU24
  eyeFatigue: number; // 0-1, derived from AU43, ptosis
  primaryEmotion?: string; // AI-detected primary emotion
  signs?: string[]; // Legacy sign descriptions
}

interface ActionUnit {
  auCode: string; // "AU1", "AU4", "AU6", etc.
  name: string; // "Inner Brow Raiser", "Brow Lowerer", etc.
  intensity: "A" | "B" | "C" | "D" | "E"; // FACS intensity scale
  intensityNumeric: number; // 1-5 for calculations
  confidence: number; // 0-1 detection confidence
}
```

#### 2.3 Document AI Response Parsing

Add new section after "Technical Implementation":

```markdown
##### AI Response Parsing Pipeline

The `transformAIResponse` utility ensures consistent data handling across AI response formats:

**Supported Response Formats:**

1. **Direct Structure:**
   ```json
   {
     "confidence": 0.85,
     "actionUnits": [...],
     "facsInterpretation": {...}
   }
   ```

2. **Wrapped Structure:**
   ```json
   {
     "facs_analysis": {
       "confidence": 0.85,
       "actionUnits": [...],
       "facsInterpretation": {...}
     }
   }
   ```

3. **Field Name Variations:**
   - camelCase: `actionUnits`, `jawTension`, `eyeFatigue`
   - snake_case: `action_units_detected`, `jaw_tension`, `eye_fatigue`

**Transformation Logic:**

```typescript
1. Detect and unwrap `facs_analysis` wrapper if present
2. Handle both `action_units_detected` and `actionUnits` array names
3. Map snake_case to camelCase field names
4. Ensure all required fields present with sensible defaults
5. Log transformation for debugging
```

**Why This Matters:**

- AI models may evolve response formats
- Different providers use different conventions
- Centralized logic prevents code duplication
- Single point of maintenance for parsing changes
```

#### 2.4 Document Quality Check System

Add new section after "Technical Implementation":

```markdown
##### Quality Assessment System

The `checkDetectionQuality()` function evaluates detection quality on a 0-100 scale.

**Quality Metrics:**

1. **Confidence Score (40% weight):** AI's confidence in overall detection
2. **AU Count Score (30% weight):** Number of AUs detected (up to 8)
3. **Critical AU Score (30% weight):** Detection of key AUs (AU6, AU12, AU4, AU24)

**Quality Levels:**

- **High (60-100):** Reliable detection, all critical AUs detected
- **Medium (30-59):** Some markers may have been missed
- **Low (0-29):** Limited detection, improvement suggestions provided

**User Experience:**

- **Quality Check is Informational Only:** Users can always view results
- **Suggestions Provided:** Specific guidance for improving capture quality
- **No Blocking:** All results accessible regardless of score
- **Progress Indicators:** Clear feedback during analysis process

**Quality Suggestions:**

For low/medium quality, the system provides:
- Lighting recommendations (soft, frontal lighting)
- Positioning guidance (face camera directly)
- Environmental factors (remove glasses, clear hair)
- Technical tips (steady camera, good focus)
```

---

### 2. docs/FACS_IMPLEMENTATION_GUIDE.md

**Current Issues:**
- Missing documentation of `transformAIResponse` utility
- Quality check section doesn't reflect non-blocking behavior
- Data models need updating to match current interfaces
- Missing recent bug fix documentation

**Required Updates:**

#### 2.1 Add "AI Response Transformation" Section

Insert after "Detection Logic" section:

```markdown
## AI Response Transformation

### Overview

The `transformAIResponse` utility centralizes AI response parsing to handle format variations from different AI providers and model versions.

### Function Signature

```typescript
export const transformAIResponse = (aiResponse: any): FacialAnalysis
```

### Transformation Rules

1. **Wrapper Detection:**
   ```typescript
   if (data.facs_analysis && typeof data.facs_analysis === 'object') {
     data = data.facs_analysis;
   }
   ```

2. **Action Units Mapping:**
   - Supports `action_units_detected` (snake_case) and `actionUnits` (camelCase)
   - Transforms each AU with proper field mapping:
     ```typescript
     {
       auCode: au.au || au.auCode,
       name: au.name,
       intensity: au.intensity || 'C',
       intensityNumeric: au.intensity_numeric || au.intensityNumeric || 3,
       confidence: au.confidence || 0.5
     }
     ```

3. **FACS Interpretation Mapping:**
   - Handles `interpretation_rules` (snake_case) and `facsInterpretation` (camelCase)
   - Maps interpretation fields:
     ```typescript
     {
       duchennSmile: rules.duchenne_smile || rules.duchennSmile || false,
       socialSmile: rules.social_posed_smile || rules.socialSmile || false,
       maskingIndicators: rules.masking_indicators || rules.maskingIndicators || [],
       fatigueIndicators: rules.fatigue_cluster ? ['Fatigue detected'] : rules.fatigue_indicators || [],
       tensionIndicators: rules.tension_cluster ? ['Tension detected'] : rules.tension_indicators || []
     }
     ```

4. **Legacy Field Support:**
   - Maintains backward compatibility with legacy numeric fields
   - Derives `jawTension` from AU4, AU24
   - Derives `eyeFatigue` from AU43, ptosis, low intensity

5. **Default Values:**
   - Ensures all required fields present
   - Uses sensible defaults when data missing
   - Prevents `undefined` or null errors

### Logging

The utility provides detailed logging at each transformation step:

```
[transformAIResponse] Input: { ... }
[transformAIResponse] Unwrapping facs_analysis wrapper
[transformAIResponse] Mapped X AUs from action_units_detected
[transformAIResponse] Mapped interpretation_rules to facsInterpretation
[transformAIResponse] Output: { ... }
```

### Error Handling

- Graceful degradation when fields missing
- Type-safe transformations with TypeScript
- Logs warnings for unusual response structures
- Never blocks analysis - always returns valid `FacialAnalysis`
```

#### 2.2 Update "Validation & Testing" Section

Add quality check validation:

```markdown
### Quality Assessment Validation

```typescript
// File: src/services/comparisonEngine.ts

interface DetectionQuality {
  score: number; // 0-100
  level: "high" | "medium" | "low";
  suggestions: string[];
  canProceed: boolean; // Always true - non-blocking
}

function checkDetectionQuality(analysis: FacialAnalysis): DetectionQuality
```

**Validation Rules:**

- `canProceed` is always `true` (informational only)
- Score calculated from confidence + AU count + critical AUs
- Level determined: high (60+), medium (30-59), low (0-29)
- Suggestions generated for low/medium quality only

**Test Coverage:**

- ✅ Quality score calculation accurate
- ✅ Suggestions appropriate for quality level
- ✅ `canProceed` never blocks results
- ✅ High quality has empty suggestions
- ✅ Medium quality provides improvement guidance
- ✅ Low quality gives actionable feedback
```

#### 2.3 Add Bug Fix Documentation

Add to end of document:

```markdown
## Recent Bug Fixes (v0.97.9)

### Fix #1: AI Response Format Variability

**Issue:** Gemini AI sometimes wraps responses in `facs_analysis` object

**Symptoms:**
- Empty results in UI when AI used wrapped format
- Missing action units despite successful API call
- Inconsistent behavior between different AI calls

**Root Cause:**
Code expected direct response structure only, didn't handle wrapped format.

**Solution:**
Created `transformAIResponse` utility to:
- Detect and unwrap `facs_analysis` wrapper
- Handle both `actionUnits` and `action_units_detected`
- Support snake_case and camelCase field names
- Provide consistent `FacialAnalysis` output

**Files Changed:**
- `src/utils/transformAIResponse.ts` (created)
- `src/services/geminiVisionService.ts` (updated)

### Fix #2: Quality Check Blocking Valid Results

**Issue:** Quality check blocked valid analyses from display

**Symptoms:**
- "Did not get good enough picture" alert for valid results
- Users couldn't see results with valid AU detections
- False negatives causing poor user experience

**Root Cause:**
`canProceed` set to `false` for quality scores below 30

**Solution:**
- Changed `canProceed` to always be `true`
- Quality check now informational only
- Users can always view results with or without retry
- Added "View Results Anyway" button for clarity

**Files Changed:**
- `src/services/comparisonEngine.ts` (updated `checkDetectionQuality`)
- `src/components/StateCheckResults.tsx` (updated UI handling)

**Impact:**
- Improved user experience by showing all results
- Maintained quality guidance as informational
- Reduced false blocking of valid analyses
```

---

### 3. specifications/DATA_ANALYSIS_LOGIC.md

**Current Issues:**
- Missing documentation of FACS-based analysis logic
- No mention of `transformAIResponse` utility
- Quality check system not documented
- Data transformation pipeline not described

**Required Updates:**

#### 3.1 Add FACS Analysis Section

Add after "3.1 Immediate Analysis (On Entry)":

```markdown
### 3.1.5 FACS Analysis (Bio-Mirror)

**Input:** Base64-encoded facial image

**Process:**

1. **Image Capture:**
   - User captures via `StateCheckCamera` component
   - Compressed to optimize for AI transmission
   - Encrypted before storage

2. **AI Analysis (Gemini 2.5 Flash):**
   - Image sent to Gemini Vision API
   - Prompt requests specific Action Units (AUs)
   - Structured schema enforces `FacialAnalysis` format

3. **Response Transformation:**
   - `transformAIResponse()` handles format variations
   - Unwraps `facs_analysis` wrapper if present
   - Maps snake_case to camelCase
   - Validates all required fields

4. **Quality Assessment:**
   - `checkDetectionQuality()` evaluates detection confidence
   - 0-100 score calculated from multiple factors
   - Always allows proceeding (non-blocking)

5. **Comparison to Subjective Report:**
   - `compareSubjectiveToObjective()` calculates discrepancy
   - Compares mood (1-5) with facial indicators
   - Generates mask detection and insights

**Output:** `FacialAnalysis` object with:
- Action Units detected with intensity ratings
- FACS interpretation (Duchenne vs social smile)
- Tension and fatigue scores
- Confidence metrics
- Quality assessment (informational)
```

#### 3.2 Update AI Decision Matrix

Update table to include FACS-based decisions:

```markdown
| User State | FACS Detection | Objective State | AI Response Strategy |
| :--- | :--- | :--- | :--- |
| **Mood 5** | **Duchenne Smile** (AU6+AU12) | Genuine positive emotion | "Your face matches your report. Great alignment!" |
| **Mood 5** | **Social Smile** (AU12 only) | Social/posed expression | "Your smile appears social - you may be masking" |
| **Mood 5** | **High Tension** (AU4+AU24) | Stress markers present | "Your face shows tension despite positive mood. Check in with your body." |
| **Mood 1** | **High Fatigue** (AU43+AU7) | Exhaustion indicators | "Physical fatigue detected - prioritize rest over pushing through." |
| **Any Mood** | **Low Quality Score** | Limited markers detected | "Lighting or angle may affect detection. Try again or use these results as-is." |
```

#### 3.3 Add Quality Check Logic

Add new section:

```markdown
### 3.3 Quality Assessment Logic

**Purpose:** Evaluate FACS detection quality without blocking results

**Algorithm:**

```typescript
qualityScore = (confidence * 0.4) + 
             (auCountScore * 0.3) + 
             (criticalAuScore * 0.3)

Where:
- confidence = 0-1 (AI's overall confidence)
- auCountScore = min(AUs.length / 8, 1) (number of AUs, max 8)
- criticalAuScore = min(criticalAUs.length / 2, 1) (key AUs detected)
```

**Critical AUs:** AU6, AU12, AU4, AU24

**Quality Levels:**
- High (60-100): Good detection, proceed normally
- Medium (30-59): Some markers missed, informative warning
- Low (0-29): Limited detection, suggestions provided

**User Impact:**
- NEVER blocks results - always shows analysis
- Provides improvement suggestions
- Allows informed decision to retry
```

---

### 4. docs/BIO_MIRROR_UX_IMPROVEMENTS.md

**Current Issues:**
- May not reflect recent quality check changes
- Missing documentation of non-blocking quality alerts
- No mention of "View Results Anyway" UX pattern

**Required Updates:**

```markdown
## Quality Alert UX (v0.97.9)

### Non-Blocking Quality Warnings

Quality checks are now **informational only** - users can always proceed.

**Alert Display:**

**Low Quality (0-29 score):**
- Title: "Photo Quality Issues Detected"
- Message: "The image quality may be affecting facial analysis. Some markers couldn't be detected clearly."
- Options:
  1. "Retake Photo" (primary action)
  2. "View Results Anyway" (always available)

**Medium Quality (30-59 score):**
- Title: "Limited Analysis Quality"
- Message: "Some facial markers may have been missed. Results may be less accurate."
- Options:
  1. "Try Better Lighting" (primary action)
  2. "View Results Anyway" (always available)

**High Quality (60-100 score):**
- No alert displayed
- Results shown immediately

### Rationale

Users often capture valid photos that simply don't meet ideal quality thresholds. By never blocking results:
- Respects user autonomy
- Provides complete data even when imperfect
- Maintains quality guidance as suggestions
- Improves trust in the system

### User Feedback Loop

Users can:
1. Review analysis despite quality warnings
2. Decide if results seem accurate
3. Retake if they believe better capture is needed
4. Save any results they find valuable
```

---

### 5. docs/BIOMIRROR_TROUBLESHOOTING.md

**Required Updates:**

```markdown
## Issue: "Did not get good enough picture" Alert (RESOLVED)

**Status:** Fixed in v0.97.9

**Previous Behavior:**
- Alert blocked valid results from display
- Users couldn't see analysis even with valid AU detections
- Confusing when results appeared in console but not UI

**Current Behavior:**
- Quality check is informational only
- "View Results Anyway" button always available
- Results accessible regardless of quality score

**Solution:**
Modified `checkDetectionQuality()` to always return `canProceed = true`

**User Guidance:**
- Quality warnings are suggestions, not blocks
- You can always view your analysis
- Retake photo only if you believe quality can be improved
- Trust your judgment about result accuracy
```

---

## Implementation Priority

### Phase 1: Critical Documentation (Immediate)

- [ ] Update `specifications/COMPLETE_SPECIFICATIONS.md` with v0.97.9 changes
- [ ] Add `transformAIResponse` documentation
- [ ] Document non-blocking quality check behavior
- [ ] Update `FacialAnalysis` interface examples

### Phase 2: FACS Guide Updates (Within 1 week)

- [ ] Add AI Response Transformation section to `FACS_IMPLEMENTATION_GUIDE.md`
- [ ] Update Validation & Testing section
- [ ] Document recent bug fixes
- [ ] Add troubleshooting for quality alerts

### Phase 3: Data Logic Documentation (Within 2 weeks)

- [ ] Update `DATA_ANALYSIS_LOGIC.md` with FACS analysis
- [ ] Add quality assessment logic section
- [ ] Update AI decision matrix
- [ ] Document data transformation pipeline

### Phase 4: UX Documentation (Within 2 weeks)

- [ ] Update `BIO_MIRROR_UX_IMPROVEMENTS.md`
- [ ] Document quality alert UX patterns
- [ ] Update troubleshooting guide
- [ ] Add user flow documentation

---

## Review Checklist

For each documentation update, ensure:

- [ ] Version number updated to reflect v0.97.9
- [ ] Date of update included (February 2026)
- [ ] Code examples use current TypeScript syntax
- [ ] Data model examples match actual interfaces
- [ ] Links to related documentation updated
- [ ] Technical terms defined when first used
- [ ] Rationale explained for all major decisions
- [ ] Cross-references to other docs are accurate
- [ ] Examples include edge cases
- [ ] Known limitations clearly stated

---

## Related Files

- `src/utils/transformAIResponse.ts` - New utility for AI response handling
- `src/services/geminiVisionService.ts` - Updated to use transform utility
- `src/services/comparisonEngine.ts` - Updated quality check logic
- `src/components/StateCheckResults.tsx` - Updated quality alert UI

---

## References

- Ekman, P., & Friesen, W. (1978). Facial Action Coding System
- Google AI. (2024). Gemini Vision API Documentation
- iMotions. (2024). FACS Visual Guidebook

---

**Document Status:** Draft
**Next Review:** February 15, 2026
**Owner:** MAEPLE Development Team