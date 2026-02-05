# FACS Debugging and Testing Guide

## Overview

This guide provides instructions for debugging FACS (Facial Action Coding System) data flow issues where the process appears to work but fails when sending data to the results page and database.

## Changes Made

### 1. Enhanced Logging Added

All critical data flow points now include comprehensive console logging:

#### StateCheckAnalyzing.tsx
- Logs AI analysis results including actionUnits count, confidence, FACS interpretation
- Logs jaw tension and eye fatigue values
- Logs full analysis object for debugging
- Provides structured fallback result on error

#### StateCheckWizard.tsx
- Logs when analysis complete callback is received
- Validates analysis before setting state
- Checks for actionUnits presence and facsInterpretation
- Logs error if analysis is invalid

#### StateCheckResults.tsx
- Logs save operation start with analysis details
- Logs blob creation and size
- Logs successful save with returned ID
- Logs any errors during save

#### stateCheckService.ts
- Logs input data including actionUnits count
- Logs coercion process and results
- Logs encryption completion
- Logs database put operation

### 2. Improved Error Handling

- **Fallback results** include all required FacialAnalysis fields
- **Validation checks** before state updates
- **Error boundaries** with user-friendly messages
- **Detailed error logging** at each stage

## Testing Instructions

### Step 1: Open Browser DevTools

1. Open Maeple application in Chrome or Firefox
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Clear console (right-click → Clear console)

### Step 2: Run FACS Analysis

1. Navigate to Bio-Mirror Check
2. Click "Open Bio-Mirror"
3. Capture a photo
4. Wait for analysis to complete

### Step 3: Check Console Logs

Look for these specific log patterns:

#### Expected Success Flow:
```
[StateCheckAnalyzing] === AI ANALYSIS COMPLETE ===
[StateCheckAnalyzing] Action Units count: <number>
[StateCheckAnalyzing] Confidence: <number>
[StateCheckAnalyzing] FACS Interpretation: { duchennSmile: ..., socialSmile: ... }
[StateCheckAnalyzing] Jaw Tension: <number>
[StateCheckAnalyzing] Eye Fatigue: <number>
[StateCheckAnalyzing] Full analysis object: { ... }

[StateCheckWizard] === ANALYSIS COMPLETE CALLBACK ===
[StateCheckWizard] Received analysis: { actionUnitsCount: <number>, ... }
[StateCheckWizard] Analysis is valid, setting state...
```

#### Save Operation Flow (when clicking Save):
```
[StateCheckResults] === SAVE OPERATION START ===
[StateCheckResults] Analysis to save: { actionUnitsCount: <number>, ... }
[StateCheckResults] Converting image to blob...
[StateCheckResults] Blob created, size: <number>
[StateCheckResults] Calling saveStateCheck...

[saveStateCheck] === SAVE OPERATION START ===
[saveStateCheck] Input data: { id: "...", actionUnitsCount: <number>, ... }
[saveStateCheck] Coercing facial analysis...
[saveStateCheck] Coerced analysis: { actionUnitsCount: <number>, ... }
[saveStateCheck] Encrypting analysis...
[saveStateCheck] Encryption complete, cipher length: <number>

[StateCheckResults] Save successful, ID: "..."
```

### Step 4: Identify the Failure Point

If data is not reaching the results page or database, check where logs stop:

#### Scenario A: Logs stop after AI analysis
**Issue:** Data lost between `StateCheckAnalyzing` and `StateCheckWizard`
**Likely cause:** State management issue, callback not firing
**Check:** Look for React warnings or errors

#### Scenario B: Logs reach wizard but not results
**Issue:** Data lost between `StateCheckWizard` and `StateCheckResults`
**Likely cause:** Props not passed correctly, component re-render issue
**Check:** Verify analysis is not null

#### Scenario C: Logs reach results but save fails
**Issue:** Database save operation failing
**Likely cause:** IndexedDB error, encryption failure, storage quota
**Check:** Look for specific error messages

#### Scenario D: Save completes but data is empty
**Issue:** Data is saved but actionUnits are empty
**Likely cause:** AI returned empty array, validation stripped data
**Check:** Verify actionUnits count in logs

### Step 5: Check IndexedDB

If save appears to succeed but data is lost:

1. Open DevTools → Application tab
2. Navigate to IndexedDB → maeple_db
3. Check state_checks object store
4. Click on recent entries
5. Verify analysisCipher and iv fields are populated
6. Check timestamp is current

### Step 6: Test Decryption

If encrypted data exists but results page shows empty:

1. In browser console, run:
```javascript
// Get latest record
const request = indexedDB.open('maeple_db', 2);
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction('state_checks', 'readonly');
  const store = tx.objectStore('state_checks');
  const getAll = store.getAll();
  getAll.onsuccess = () => {
    const records = getAll.result;
    console.log('All records:', records);
    
    // Try to decrypt the latest one
    const latest = records[records.length - 1];
    if (latest) {
      console.log('Latest record:', latest);
      // Check if cipher and iv exist
      console.log('Has cipher:', !!latest.analysisCipher);
      console.log('Has iv:', !!latest.iv);
      console.log('Cipher length:', latest.analysisCipher?.length);
    }
  };
};
```

## Common Issues and Solutions

### Issue: "AI returned 0 Action Units"

**Logs:**
```
[GeminiVision] ⚠ WARNING: AI returned 0 Action Units!
```

**Possible causes:**
1. Image quality too low (compression artifacts)
2. Face not clearly visible
3. Poor lighting
4. AI model unable to detect FACS markers

**Solution:**
- Capture photo in good lighting
- Ensure face is clearly visible
- Check image is not blurry

### Issue: "Invalid analysis received"

**Logs:**
```
[StateCheckWizard] Invalid analysis received: { ... }
```

**Possible causes:**
1. AI response structure is malformed
2. Required fields missing
3. Type mismatch

**Solution:**
- Check AI response format in logs
- Verify API key is valid
- Test with different image

### Issue: "Encryption failed"

**Logs:**
```
[saveStateCheck] Encryption failed: <error>
```

**Possible causes:**
1. localStorage not accessible
2. Crypto API not available
3. Key generation failed

**Solution:**
- Clear browser cache and localStorage
- Try in different browser
- Check browser supports Web Crypto API

### Issue: "IndexedDB error"

**Logs:**
```
[saveStateCheck] IndexedDB error: <error>
```

**Possible causes:**
1. Storage quota exceeded
2. Database version conflict
3. Transaction aborted

**Solution:**
- Clear old state checks from database
- Increase browser storage quota
- Check for other IndexedDB errors

### Issue: Data Saves but Results Show Empty

**Symptom:** Save completes but actionUnits display as empty

**Check logs for:**
```
[StateCheckResults] actionUnitsCount: 0
```

**Possible causes:**
1. AI actually returned 0 actionUnits
2. Validation stripped actionUnits
3. Decryption returned different data

**Solution:**
- Check AI response in logs before save
- Verify coercion preserved actionUnits
- Test decryption manually

## Debugging Commands

### Test AI Analysis Directly

In browser console:
```javascript
// Test with a sample image
const testImage = 'data:image/png;base64,...';
window.maeple?.visionService?.analyzeFromImage(testImage, {
  onProgress: (stage, progress) => console.log(stage, progress),
  timeout: 45000
}).then(result => {
  console.log('AI Result:', result);
  console.log('Action Units:', result.actionUnits);
}).catch(error => {
  console.error('AI Error:', error);
});
```

### Test Validation Directly

In browser console:
```javascript
// Test validation service
const testAnalysis = {
  confidence: 0.87,
  actionUnits: [
    { auCode: 'AU1', name: 'Inner Brow Raiser', intensity: 'C', intensityNumeric: 3, confidence: 0.94 }
  ],
  facsInterpretation: {
    duchennSmile: false,
    socialSmile: true,
    maskingIndicators: [],
    fatigueIndicators: [],
    tensionIndicators: []
  },
  observations: [],
  lighting: 'moderate',
  lightingSeverity: 'moderate',
  environmentalClues: [],
  primaryEmotion: 'neutral',
  jawTension: 0.4,
  eyeFatigue: 0.3,
  signs: []
};

const validated = window.maeple?.validationService?.validateFacialAnalysis(testAnalysis);
console.log('Validated:', validated);
console.log('Action Units preserved:', validated.actionUnits?.length);
```

### Test Database Operations

In browser console:
```javascript
// Test save directly
const testData = {
  id: 'test_' + Date.now(),
  timestamp: new Date().toISOString(),
  analysis: testAnalysis
};

window.maeple?.stateCheckService?.saveStateCheck(testData)
  .then(id => console.log('Save success:', id))
  .catch(error => console.error('Save failed:', error));

// Test retrieval
window.maeple?.stateCheckService?.getStateCheck(testData.id)
  .then(record => console.log('Retrieved:', record))
  .catch(error => console.error('Retrieve failed:', error));
```

## Expected Behavior

### Successful Flow:

1. **Photo Capture** → Image converted to base64
2. **AI Analysis** → Returns analysis with actionUnits
3. **State Update** → Wizard receives and validates analysis
4. **Results Display** → Shows actionUnits, interpretation, and metrics
5. **Save Operation** → Encrypts and stores in IndexedDB
6. **Success Feedback** → Shows "Saved Securely" message

### Data Should Include:

- **Action Units Array**: 0+ AU objects with auCode, name, intensity, confidence
- **FACS Interpretation**: duchennSmile, socialSmile, maskingIndicators, etc.
- **Metrics**: jawTension (0-1), eyeFatigue (0-1)
- **Observations**: Array of category/value/evidence objects
- **Metadata**: confidence, lighting, lightingSeverity, environmentalClues

## Reporting Issues

When reporting an issue, include:

1. **Console logs** (full log output from start to failure)
2. **Browser info**: Name and version (e.g., Chrome 120)
3. **Steps taken**: What you clicked/selected
4. **Screenshot**: Of the results page if visible
5. **IndexedDB screenshot**: Of the state_checks store if accessible

## Next Steps

After identifying the failure point:

1. **If AI issue**: Check API key, image quality, Gemini 2.5 availability
2. **If state issue**: Check React component lifecycle, prop passing, re-renders
3. **If database issue**: Check IndexedDB quota, encryption key, transaction errors
4. **If display issue**: Check rendering logic, conditional rendering, data binding

## Success Criteria

FACS is working correctly when:

✅ Console shows actionUnits count > 0
✅ Results page displays Action Units section
✅ Action Units show correct codes (AU1, AU4, etc.)
✅ FACS Interpretation section displays
✅ Save button shows "Saved Securely" after clicking
✅ IndexedDB contains encrypted analysis with cipher and iv
✅ Retrieval returns analysis with actionUnits preserved

## Support

If issues persist:

1. Check this guide's common issues section
2. Review console logs for specific error messages
3. Test with different images and browsers
4. Check FACS_DATA_FLOW_INVESTIGATION.md for technical details
5. Contact development team with full log output