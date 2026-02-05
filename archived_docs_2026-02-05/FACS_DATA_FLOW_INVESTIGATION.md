# FACS Data Flow Investigation Report

## Date: February 2, 2026

## Executive Summary

After conducting a full investigation of the FACS (Facial Action Coding System) logic, I've identified that the **data structures and validation are working correctly**. However, there appears to be a disconnect between the AI analysis results and what reaches the results page/database.

## Investigation Findings

### ✅ What's Working

1. **Data Types & Interfaces** (`src/types.ts`)
   - `ActionUnit` interface properly defined with all required fields
   - `FacialAnalysis` interface includes `actionUnits` and `facsInterpretation`
   - All type definitions are correct and complete

2. **Validation Service** (`src/services/validationService.ts`)
   - `validateFacialAnalysis()` correctly validates and preserves Action Units
   - `validateActionUnit()` properly validates individual AU data
   - Default values include empty `actionUnits` array
   - **Test Result: ✅ Preserves all 6 mock Action Units**

3. **JSON Serialization**
   - `JSON.stringify()` correctly serializes FACS data
   - `JSON.parse()` correctly deserializes FACS data
   - **Test Result: ✅ All Action Units preserved through JSON cycle**

4. **StateCheck Object Creation**
   - StateCheck objects correctly contain analysis with actionUnits
   - **Test Result: ✅ Analysis actionUnits: 6**

### 🔍 Potential Issues Identified

#### Issue 1: Encryption Service Dependency on localStorage
**Location:** `src/services/encryptionService.ts:40`

```typescript
const getKey = async (): Promise<CryptoKey> => {
  const storedKey = localStorage.getItem(STORAGE_KEY); // ❌ Fails in Node.js/test environment
  // ...
}
```

**Impact:**
- Encryption service requires browser environment (localStorage)
- Cannot test encryption/decryption in Node.js
- May fail if localStorage is disabled or cleared

**Status:** ⚠️ Expected limitation - not a bug, but needs better error handling

#### Issue 2: Data Flow Between Components

**Flow:**
1. `StateCheckWizard.tsx` → `StateCheckAnalyzing.tsx` (captures & analyzes)
2. `StateCheckAnalyzing.tsx` → `onComplete` callback (returns analysis)
3. `onComplete` → `StateCheckWizard.tsx` (sets analysis state)
4. `StateCheckWizard.tsx` → `StateCheckResults.tsx` (passes as prop)
5. `StateCheckResults.tsx` → `handleSave()` → `saveStateCheck()` (saves to DB)

**Potential Break Points:**

1. **AI Response Parsing** (`src/services/geminiVisionService.ts`)
   - Lines 385-399: `safeParseAIResponse` wrapper handling
   - Lines 401-405: Unwrapping `facs_analysis` object
   - If AI returns malformed JSON, actionUnits may be lost

2. **Component State Management** (`src/components/StateCheckWizard.tsx`)
   - Line 37: `const [analysis, setAnalysis] = useState<FacialAnalysis | null>(null);`
   - Line 122: `handleAnalysisComplete` callback receives analysis
   - If state update fails, analysis won't reach results

3. **Database Save Operation** (`src/services/stateCheckService.ts`)
   - Lines 37-44: `coerceFacialAnalysis` validation
   - Lines 46-47: Encryption of analysis
   - Lines 49-58: Database put operation

#### Issue 3: Empty Results Handling

**Location:** `src/services/geminiVisionService.ts:409-418`

```typescript
if (!result.actionUnits || result.actionUnits.length === 0) {
  console.warn("[GeminiVision] ⚠ WARNING: AI returned 0 Action Units!");
  console.warn("[GeminiVision] This may indicate:");
  console.warn("  1. Image quality too low after compression");
  console.warn("  2. Face not clearly visible in image");
  console.warn("  3. Lighting conditions insufficient");
  console.warn("  4. Gemini vision model unable to detect FACS markers");
}
```

**Impact:**
- If AI returns 0 Action Units, data is still saved but shows empty results
- User experience: "FACS process works but fails when sending to results"

### 🔧 Debugging Recommendations

#### Immediate Actions

1. **Add Comprehensive Logging**

Add logging at each data flow stage:

```typescript
// In StateCheckAnalyzing.tsx, after AI analysis
console.log('[StateCheckAnalyzing] AI Result:', {
  actionUnits: result.actionUnits?.length || 0,
  confidence: result.confidence,
  facsInterpretation: result.facsInterpretation
});

// In StateCheckWizard.tsx, before setting state
handleAnalysisComplete = (analysisResult: FacialAnalysis) => {
  console.log('[StateCheckWizard] Setting analysis state:', {
    actionUnitsCount: analysisResult.actionUnits?.length || 0,
    hasFacsInterpretation: !!analysisResult.facsInterpretation
  });
  setAnalysis(analysisResult);
};

// In StateCheckResults.tsx, before save
const handleSave = async () => {
  console.log('[StateCheckResults] Saving analysis:', {
    id,
    actionUnitsCount: analysis.actionUnits?.length || 0,
    hasJawTension: analysis.jawTension !== undefined,
    hasEyeFatigue: analysis.eyeFatigue !== undefined
  });
  // ... rest of save logic
};
```

2. **Verify AI Response Structure**

Add explicit validation of AI response structure:

```typescript
// In geminiVisionService.ts, after parsing
const requiredFields = ['confidence', 'actionUnits', 'facsInterpretation'];
const missingFields = requiredFields.filter(field => !(field in result));

if (missingFields.length > 0) {
  console.error('[GeminiVision] Missing required fields:', missingFields);
  console.error('[GeminiVision] Response structure:', Object.keys(result));
  return getOfflineAnalysis(base64Image);
}
```

3. **Add Error Boundaries**

Wrap each component with error boundaries:

```typescript
// In StateCheckWizard.tsx
const handleAnalysisComplete = useCallback((analysisResult: FacialAnalysis) => {
  try {
    if (!analysisResult || !analysisResult.actionUnits) {
      console.error('[StateCheckWizard] Invalid analysis result:', analysisResult);
      setError('Analysis returned invalid data');
      setStep('ERROR');
      return;
    }
    
    console.log('[StateCheckWizard] Valid analysis received:', {
      actionUnits: analysisResult.actionUnits.length,
      confidence: analysisResult.confidence
    });
    
    setAnalysis(analysisResult);
    setStep('RESULTS');
  } catch (error) {
    console.error('[StateCheckWizard] Error in handleAnalysisComplete:', error);
    setError('Failed to process analysis results');
    setStep('ERROR');
  }
}, []);
```

4. **Test IndexedDB Operations**

Add logging to database operations:

```typescript
// In stateCheckService.ts
export const saveStateCheck = async (data: Partial<StateCheck>, imageBlob?: Blob): Promise<string> => {
  return withRetry(async () => {
    console.log('[saveStateCheck] Starting save operation:', {
      id: data.id,
      hasAnalysis: !!data.analysis,
      actionUnitsCount: data.analysis?.actionUnits?.length || 0,
      hasBlob: !!imageBlob
    });
    
    const db = await openDB();
    const analysisToEncrypt = coerceFacialAnalysis(data.analysis, {
      stateCheckId: id,
      source: "saveStateCheck",
    });
    
    console.log('[saveStateCheck] Coerced analysis:', {
      actionUnitsCount: analysisToEncrypt.actionUnits?.length || 0,
      hasFacsInterpretation: !!analysisToEncrypt.facsInterpretation
    });
    
    const { cipher, iv } = await encryptData(analysisToEncrypt);
    
    console.log('[saveStateCheck] Encryption complete');
    
    // ... rest of save logic
  }, "saveStateCheck");
};
```

#### Root Cause Hypotheses

Based on the investigation, the most likely causes are:

1. **AI Returning Malformed Response**
   - Gemini 2.5 might be returning data in unexpected format
   - The `facs_analysis` wrapper might not be consistently present
   - Action Units array might be in different field name

2. **State Management Issue**
   - React state update might be failing silently
   - Analysis object might be getting lost during state transition
   - Component re-render might be clearing data

3. **Async Race Condition**
   - Save operation might be called before analysis is fully loaded
   - Promise chain might be breaking somewhere
   - Error might be swallowed in try-catch

4. **IndexedDB Transaction Failure**
   - Encryption might be failing silently
   - Database transaction might be rolling back
   - Browser storage quota might be exceeded

## Next Steps

1. **Implement comprehensive logging** at all data flow points
2. **Test with real AI responses** to see what Gemini actually returns
3. **Add explicit validation** before saving to database
4. **Test IndexedDB operations** in browser console
5. **Verify error handling** in all async operations

## Test Results

### Node.js Environment Test
```
✅ Validation Service: Correctly preserves 6 Action Units
✅ JSON Serialization: All data preserved
✅ StateCheck Creation: Correctly includes analysis
❌ Encryption/Decryption: Fails (expected - requires localStorage)
```

### Browser Environment
🔄 Requires testing with actual user flow

## Conclusion

The FACS data structures and validation logic are **working correctly**. The issue is likely in the **runtime data flow** between AI analysis, React state management, and database operations. The investigation provides a clear roadmap for debugging the actual runtime behavior.

**Priority 1:** Add comprehensive logging to identify where data is lost
**Priority 2:** Test with real AI responses to verify parsing
**Priority 3:** Verify IndexedDB operations in browser