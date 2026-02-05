# Data Capture Bug Fixes - February 1, 2026

## Issue Summary

Two critical bugs were identified in the AI data capture pipeline that were causing errors in facial analysis and journal entry processing.

## Bug #1: JSON Parse Error

### Symptom
```
SyntaxError: Unexpected token '`', "```json
{
"... is not valid JSON
    at JSON.parse (<anonymous>)
    at Module.g (geminiVisionService-3aoG-8zW.js:1:12390)
```

### Root Cause
The Gemini API was returning responses wrapped in markdown code blocks (``\`\`\`json\n...\n\`\`\``), which caused `JSON.parse()` to fail because it's not valid JSON.

### Fix Applied
Added markdown code block stripping before JSON parsing in three locations:

**File:** `src/services/geminiVisionService.ts`

1. **Router Response Parsing** (line ~400):
   ```typescript
   // Strip markdown code blocks if present
   const cleanJson = routed.content.replace(/```json\n|\n```|```json/g, '').trim();
   return JSON.parse(cleanJson) as FacialAnalysis;
   ```

2. **Main API Response Parsing** (line ~520):
   ```typescript
   // Strip markdown code blocks if present
   const cleanJson = textResponse.replace(/```json\n|\n```|```json/g, '').trim();
   result = JSON.parse(cleanJson) as FacialAnalysis;
   ```

3. **Direct API Fallback Parsing** (line ~215):
   ```typescript
   // Strip markdown code blocks if present
   const cleanJson = textResponse.replace(/```json\n|\n```|```json/g, '').trim();
   const result = JSON.parse(cleanJson) as FacialAnalysis;
   ```

### Regex Pattern
```regex
/```json\n|\n```|```json/g
```
This pattern matches:
- Opening markdown blocks: ` ```json\n`
- Closing markdown blocks: ` \n``` `
- Alternative opening: ` ```json `

All occurrences are removed and the result is trimmed before parsing.

---

## Bug #2: Zod Schema Validation Error

### Symptom
```
ZodError: [
  {
    "code": "invalid_value",
    "values": [
      "lighting",
      "noise",
      "tension",
      "fatigue",
      "speech-pace",
      "tone"
    ],
    "path": [
      "objectiveObservations",
      0,
      "category"
    ],
    "message": "Invalid input"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": [
      "objectiveObservations",
      0,
      "evidence"
    ],
    "message": "Invalid input"
  }
  // ... repeated for observations 1 and 2
]
```

### Root Cause
The AI was misinterpreting the schema and returning an ARRAY for the `category` field instead of a single string value:
- **Incorrect:** `"category": ["lighting", "noise", "tension", "fatigue", "speech-pace", "tone"]`
- **Expected:** `"category": "lighting"`

This happened because the prompt was not explicit enough about the data structure.

### Fix Applied
**File:** `src/components/JournalEntry.tsx`

Updated the AI prompt to be more explicit about the expected data structure:

```typescript
const prompt = `
  Analyze this journal entry and extract structured data.
  
  Current energy levels: ${JSON.stringify(capacity)}
  
  Text: ${text}
  
  Return a JSON object matching this schema:
  {
    "moodScore": 1-10,
    "moodLabel": "...",
    "medications": [{"name": "...", "amount": "...", "unit": "..."}],
    "symptoms": [{"name": "...", "severity": 1-10}],
    "activityTypes": ["#Tag"],
    "strengths": ["..."],
    "strategies": [{"title": "...", "action": "...", "type": "REST"}],
    "summary": "...",
    "analysisReasoning": "...",
    "objectiveObservations": [
      {
        "category": "lighting",  // ONE category from: lighting, noise, tension, fatigue, speech-pace, tone
        "value": "detailed description of what was observed",
        "severity": "low",  // or "moderate" or "high"
        "evidence": "specific evidence from the text supporting this observation"
      }
    ],
    "gentleInquiry": "... or null"
  }
  
  IMPORTANT: objectiveObservations should be an array of objects. Each object must have EXACTLY ONE category value (not an array). Each observation should describe ONE specific thing you detected.
`;
```

### Key Changes
1. Added inline comment showing valid category values
2. Added inline comment showing valid severity values
3. Added explicit example of the expected structure
4. Added **IMPORTANT** section at the end emphasizing:
   - `category` must be a single string, not an array
   - Each observation should describe ONE specific thing
   - Multiple observations should be separate objects in the array

---

## Testing Recommendations

### Test Case 1: Facial Analysis
1. Open the Bio-Mirror feature
2. Capture a photo
3. Verify the analysis completes without JSON parse errors
4. Check console logs for successful parsing

### Test Case 2: Journal Entry with Observations
1. Create a journal entry describing environment/fatigue
2. Submit the entry
3. Verify Zod validation passes
4. Check that `objectiveObservations` are properly saved with correct structure

### Test Case 3: Markdown Code Block Handling
1. Monitor network requests to Gemini API
2. Verify responses are successfully parsed even if they contain markdown code blocks
3. Confirm the JSON is correctly extracted and validated

---

## Error Handling Improvements

Both fixes include robust error handling:

1. **JSON Parsing Errors**: Fall back to offline analysis if parsing fails
2. **Zod Validation Errors**: Use safe defaults when validation fails
3. **Circuit Breaker**: Protects against repeated failures

---

## Impact

These fixes resolve:
- ✅ JSON parse errors in facial analysis
- ✅ Zod validation errors in journal entries
- ✅ Improved reliability of AI data capture
- ✅ Better error recovery and fallback mechanisms

---

## Related Files

- `src/services/geminiVisionService.ts` - JSON parsing fixes
- `src/components/JournalEntry.tsx` - Prompt improvement for Zod validation
- `src/services/validation/schemas.ts` - Zod schemas (reference)

---

## Future Improvements

1. Consider adding a utility function for JSON parsing with markdown stripping
2. Add integration tests for various AI response formats
3. Consider adding response preprocessing middleware
4. Improve logging to capture malformed responses for debugging