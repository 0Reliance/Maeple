# Router Path Bug Investigation

## Critical Finding: Code Taking Wrong Path!

Looking at your console logs, I can see the **exact problem**:

## Console Log Analysis

```
14:56:28.009 [GeminiVision] analyzeStateFromImage called
14:56:28.009 [GeminiVision] Options: Object
14:56:28.009 [GeminiVision] Checking AI router availability...
14:56:28.009 [AIRouter] isAIAvailable() check: Object
14:56:28.009 [GeminiVision] AI router available: true
14:56:39.282 [GeminiVision:router] Markdown code blocks stripped from response
14:56:39.282 [GeminiVision:router] Parsed successfully, structure: Object
14:56:39.282 [VisionServiceAdapter] Analysis result: Object
14:56:39.282 [VisionServiceAdapter] Result confidence: undefined
14:56:39.282 [VisionServiceAdapter] Action Units count: undefined
```

## The Problem

### What We SHOULD See (from my new logging)
```
[GeminiVision] Raw AI response (first 500 chars): ...
[GeminiVision] Full AI response length: 1234
[GeminiVision] === ANALYSIS RESULT ===
[GeminiVision] Confidence: 0.85
[GeminiVision] Action Units count: 3
[GeminiVision] Action Units: [...]
```

### What We ACTUALLY See
```
[GeminiVision:router] Markdown code blocks stripped from response
[GeminiVision:router] Parsed successfully, structure: Object
[VisionServiceAdapter] Result confidence: undefined
[VisionServiceAdapter] Action Units count: undefined
```

## Root Cause

The code is taking the **router path** through `VisionServiceAdapter` instead of the **direct SDK path** with my new logging!

Look at the prefixes:
- `[GeminiVision:router]` = OLD PATH via router
- `[GeminiVision]` (no prefix) = NEW PATH with enhanced logging ✅

## Code Flow Issue

**Current Flow:**
```
1. StateCheckAnalyzing calls VisionServiceAdapter.analyzeFromImage()
2. VisionServiceAdapter tries AI router FIRST
3. AI router calls geminiVisionService via vision() method
4. Returns OLD format (missing confidence, actionUnits)
5. Result has `confidence: undefined`, `actionUnits: undefined`
```

**Required Flow:**
```
1. StateCheckAnalyzing calls VisionServiceAdapter.analyzeFromImage()
2. VisionServiceAdapter should FAIL router and use SDK DIRECTLY
3. SDK calls geminiVisionService.analyzeStateFromImage() directly
4. Returns NEW format with confidence, actionUnits
5. My new logging shows detailed results
```

## Why Router Path Fails

The AI router's `vision()` method likely:
1. Returns a different response format
2. Doesn't include all required fields
3. Missing: confidence, actionUnits, facsInterpretation
4. Returns partial structure that gets parsed as undefined

## Secondary Issues Found

### 1. Banner Warning
```
Banner not shown: beforeinstallpromptevent.preventDefault() called
```
**Status:** ✅ NOT A BUG
**Explanation:** Normal PWA behavior - browser warns because code calls `preventDefault()` to show banner later

### 2. Background Sync
```
[BackgroundSync] Skipping sync (background) - too soon
```
**Status:** ✅ NOT A BUG
**Explanation:** Normal behavior - sync waits minimum time between calls

## Fix Plan

### Fix 1: Force Direct SDK Path
**File:** `Maeple/src/services/geminiVisionService.ts`

The router path is failing. We need to either:
- **Option A:** Fix router to return correct format
- **Option B:** Skip router and use SDK directly (RECOMMENDED)

### Fix 2: Check Router Return Format
The AI router's `vision()` method needs investigation to ensure it returns full `FacialAnalysis` structure.

### Fix 3: Add Logging to Router Path
Add the same enhanced logging to the router path so we can see what it's returning.

## Next Steps

### Step 1: Read VisionServiceAdapter
Check how it decides between router vs SDK path
### Step 2: Read AI Router vision() method
Check what format it returns
### Step 3: Fix to use SDK directly
Skip router for FACS analysis to ensure correct format

## Expected Console Output After Fix

```
[GeminiVision] Raw AI response (first 500 chars): "```json\n{..."
[GeminiVision] === ANALYSIS RESULT ===
[GeminiVision] Confidence: 0.85
[GeminiVision] Action Units count: 3
[GeminiVision] Action Units: [{auCode: 'AU1', ...}, ...]
```

Then we'll see if AI still returns 0, or if we start getting actual data!