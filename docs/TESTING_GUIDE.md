# MAEPLE Testing Guide

**App Version**: 0.97.7  
**Internal Milestone**: 2.2.4  
**Last Updated**: January 6, 2026  
**Status**: Ready for Testing

---

## Overview

This guide covers testing procedures for the internal 2.2.4 milestone, including:

1. **Phase 1**: Camera stability fix (`useCameraCapture` hook v2.2.1-v2.2.3)
   - v2.2.1: Fixed dependency cascade causing re-renders
   - v2.2.1: Config values in refs, empty callback deps
   - v2.2.1: Conditional modal rendering
   - v2.2.2: Disabled React.StrictMode for camera stability
   - v2.2.2: GPU optimizations (willChange, contain, isolation)
   - v2.2.2: Removed backdrop-blur, React.memo wrapping
   - v2.2.3: Intro card flicker fix (!isCameraOpen guard)
   - v2.2.3: Mouse event isolation (stopPropagation)
2. **Phase 2**: Vision Service Enhancement (progress callbacks, 45s timeout)
3. **Phase 3**: Observation Context (centralized data flow)
4. **Phase 4**: Draft Service (auto-save, persistence)
5. **Phase 5**: Correlation Service (masking detection, patterns)
6. **Phase 6**: Onboarding System (v2.2.4 - User-focused messaging, skip button, dual first-entry detection)

---

## Prerequisites

### Development Environment

```bash
# Ensure you're in the Maeple directory
cd /opt/Maeple

# Install dependencies
npm install

# Start development server
npm run dev
```

### Browser Requirements

- Chrome 90+ or Firefox 90+ (for WebRTC camera support)
- DevTools open (F12) for console logging
- Camera and microphone permissions granted

### Test User Setup

1. Start the app at `http://localhost:5173`
2. Create or log into a test account
3. Activate trial if needed (Settings → Subscription → Start Trial)

---

## Phase 1: Camera Stability Testing

### Objective

Verify camera no longer flickers and operates smoothly.

### Test Cases

#### Test 1.1: Camera Initialization

**Steps:**

1. Open Bio-Mirror (Menu → Bio-Mirror or State Check)
2. Wait for camera to initialize
3. Observe the video feed

**Expected Results:**

- ✅ Single initialization (no restart loops)
- ✅ Console shows: `[Camera] Starting at HD resolution...`
- ✅ Console shows: `[Camera] Ready: 1280x720`
- ✅ Video feed appears within 3 seconds
- ❌ NO multiple "Starting..." messages
- ❌ NO flickering or black frames

#### Test 1.2: Camera Switch (Front/Back)

**Steps:**

1. With camera open, click "Switch Camera" button
2. Wait for camera to reinitialize
3. Repeat 3 times rapidly

**Expected Results:**

- ✅ Smooth transition between cameras
- ✅ Old stream properly stopped before new stream starts
- ✅ Console shows: `[Camera] Cleaning up existing stream`
- ✅ No memory leaks (check DevTools Performance → Memory)

#### Test 1.3: Resolution Fallback

**Steps:**

1. Use browser DevTools to throttle camera
2. Or test on low-spec device
3. Open Bio-Mirror

**Expected Results:**

- ✅ Console shows fallback: `[Camera] Trying lower resolution...`
- ✅ Falls back from HD → SD → Low as needed
- ✅ Eventually succeeds or shows clear error message

#### Test 1.4: Error Handling

**Steps:**

1. Deny camera permission when prompted
2. Or cover camera (for NotReadableError)

**Expected Results:**

- ✅ Clear error message displayed (not technical jargon)
- ✅ "Retry" button appears and functions
- ✅ No infinite retry loops

#### Test 1.5: Memory Management

**Steps:**

1. Open Bio-Mirror modal
2. Take a photo
3. Close modal
4. Repeat 10 times
5. Check DevTools → Performance → Memory

**Expected Results:**

- ✅ Memory returns to baseline after modal close
- ✅ No "detached" MediaStream objects
- ✅ No zombie video elements

#### Test 1.6: Mouse Motion Stability (v2.2.2)

**Steps:**

1. Open Bio-Mirror camera
2. Move mouse rapidly across the camera view
3. Hover over capture button, then move away
4. Repeat mouse movements for 30 seconds

**Expected Results:**

- ✅ Video feed remains stable (no flicker)
- ✅ No layout shifts or resizing
- ✅ No intro card appearing behind camera
- ✅ Console shows no repeated "[Camera] Starting..." messages

#### Test 1.7: Intro Card Isolation (v2.2.3)

**Steps:**

1. Open Bio-Mirror (should show intro card with "Bio-Mirror Check")
2. Click "Start Check" to open camera
3. Move mouse over camera modal
4. Hover over capture button area

**Expected Results:**

- ✅ Intro card completely hidden when camera is open
- ✅ No flicker between intro and camera views
- ✅ Mouse hover does not cause any content to appear behind camera
- ✅ Capture button responds normally to hover

#### Test 1.8: Portal Event Isolation (v2.2.3)

**Steps:**

1. Open Bio-Mirror camera
2. Open browser DevTools → Elements → Event Listeners
3. Click on the camera modal container
4. Move mouse around

**Expected Results:**

- ✅ Mouse events do not propagate to parent components
- ✅ No state changes in StateCheckWizard when hovering camera
- ✅ Parent component does not re-render (check React DevTools Profiler)

### Console Commands for Verification

```javascript
// Check for active streams (should be 0 when modal closed)
navigator.mediaDevices.enumerateDevices().then(console.log);

// Force garbage collection (Chrome DevTools Performance tab)
gc(); // Only available in DevTools
```

---

## Phase 2: Vision Service Testing

### Objective

Verify AI analysis completes with real progress tracking.

### Test Cases

#### Test 2.1: Progress Callback Accuracy

**Steps:**

1. Open Bio-Mirror
2. Take a photo
3. Watch progress bar during analysis

**Expected Results:**

- ✅ Progress bar moves in distinct stages (not smooth simulation)
- ✅ Stage labels appear: "Checking AI availability", "Preparing request", etc.
- ✅ Progress matches console logs:
  ```
  [Vision] Progress: Checking AI availability... (5%)
  [Vision] Progress: Preparing analysis request... (10%)
  [Vision] Progress: Connecting to Gemini API... (20%)
  [Vision] Progress: Sending image to AI service... (25%)
  [Vision] Progress: Received response from AI (75%)
  [Vision] Progress: Parsing facial analysis results... (85%)
  [Vision] Progress: Analysis complete (100%)
  ```

#### Test 2.2: Timeout Handling (45s)

**Steps:**

1. Temporarily disable network or slow connection to extreme
2. Take a photo
3. Wait for timeout

**Expected Results:**

- ✅ Analysis times out after 45 seconds
- ✅ Error message: "Analysis timed out after 45 seconds"
- ✅ Retry button appears
- ✅ No zombie API requests

#### Test 2.3: Offline Fallback

**Steps:**

1. Open DevTools → Network → Offline mode
2. Take a photo
3. Observe results

**Expected Results:**

- ✅ Console shows: `[Vision] AI not available, using offline fallback`
- ✅ Basic analysis returned (brightness, lighting estimate)
- ✅ Confidence marked as 0.3 (low)
- ✅ User informed results are limited

#### Test 2.4: API Error Handling

**Steps:**

1. Enter invalid API key in Settings
2. Take a photo

**Expected Results:**

- ✅ Clear error: "AI API not configured"
- ✅ Suggestion to check Settings
- ✅ No stack trace shown to user

---

## Phase 3: Observation Context Testing

### Objective

Verify observations flow correctly from capture to storage.

### Test Cases

#### Test 3.1: Observation Storage

**Steps:**

1. Open Bio-Mirror
2. Take a photo
3. Complete analysis
4. Check context state

**Expected Results:**

- ✅ Console shows observation stored
- ✅ React DevTools shows ObservationContext with visual observation
- ✅ Observation has correct structure:
  ```typescript
  {
    id: 'obs_...',
    type: 'visual',
    source: 'bio-mirror',
    observations: [...],
    confidence: 0.X,
    storedAt: Date
  }
  ```

#### Test 3.2: Observation Persistence

**Steps:**

1. Take a photo (stores observation)
2. Navigate to Journal Entry page
3. Check if observations are accessible

**Expected Results:**

- ✅ Observation indicator shows in Journal Entry
- ✅ "Objective observations captured and ready" message appears
- ✅ Observations included when saving entry

#### Test 3.3: Multiple Observations

**Steps:**

1. Take photo (visual observation)
2. Record voice (audio observation)
3. Check context state

**Expected Results:**

- ✅ Both observations stored
- ✅ `getAllObservations()` returns array with 2 items
- ✅ Each has correct type (visual/audio)

#### Test 3.4: Session Cleanup

**Steps:**

1. Add observations
2. Save a journal entry
3. Check context state

**Expected Results:**

- ✅ Observations cleared after entry saved
- ✅ Ready for new session

### Console Commands for Verification

```javascript
// Access observation context (in React DevTools or component)
// Check state
console.log(observationState.visual);
console.log(observationState.audio);

// Get all observations
const all = getAllObservations();
console.log("All observations:", all);
```

---

## Phase 4: Draft Service Testing

### Objective

Verify journal drafts auto-save and recover correctly.

### Test Cases

#### Test 4.1: Auto-Save Trigger

**Steps:**

1. Start new journal entry
2. Type some text
3. Wait 30 seconds (do NOT save manually)
4. Check console

**Expected Results:**

- ✅ Console shows: `[Draft] Auto-saving draft...`
- ✅ localStorage updated: `maeple:journal-draft:*`

#### Test 4.2: Manual Save

**Steps:**

1. Start journal entry
2. Click "Save Draft" button
3. Check console and localStorage

**Expected Results:**

- ✅ Console shows: `[Draft] Saved draft: draft_...`
- ✅ Draft retrievable via `draftService.getCurrent()`

#### Test 4.3: Draft Recovery

**Steps:**

1. Create a journal entry draft
2. Close the browser tab
3. Reopen the app
4. Navigate to Journal

**Expected Results:**

- ✅ Prompt to recover draft appears
- ✅ Draft content restored correctly
- ✅ All fields (text, capacity, observations) restored

#### Test 4.4: Version History

**Steps:**

1. Save draft
2. Modify and wait for auto-save
3. Repeat 3 times
4. Check `draftService.getAll()`

**Expected Results:**

- ✅ Multiple versions stored (up to 10)
- ✅ Each has different timestamp
- ✅ Version numbers increment

#### Test 4.5: Draft Cleanup

**Steps:**

1. Save draft
2. Manually set timestamp to 8 days ago in localStorage
3. Reload app

**Expected Results:**

- ✅ Old draft automatically removed
- ✅ Console shows: `[Draft] Cleaned up X old drafts`

### Console Commands for Verification

```javascript
// Check current draft
draftService.getCurrent();

// Check all drafts
draftService.getAll();

// Check localStorage directly
localStorage.getItem("maeple:drafts-index");
```

---

## Phase 5: Correlation Service Testing

### Objective

Verify masking detection and pattern analysis work correctly.

### Test Cases

#### Test 5.1: Basic Correlation Analysis

**Steps:**

1. Create journal entry with high capacity ratings (all 8+)
2. Add visual observation showing fatigue/tension
3. Run correlation analysis

**Expected Results:**

- ✅ Analysis detects mismatch
- ✅ `alignment` = 'mismatch' or 'low'
- ✅ Discrepancy score calculated
- ✅ Recommendations generated

#### Test 5.2: Masking Detection

**Steps:**

1. Rate yourself as "feeling great" (high mood, high spoon level)
2. Take a photo showing visible tension/fatigue
3. Check masking analysis

**Expected Results:**

- ✅ `masking.detected = true`
- ✅ `masking.confidence > 0.5`
- ✅ `masking.indicators` lists specific signs
- ✅ Recommendation for self-check break

#### Test 5.3: Pattern Detection

**Steps:**

1. Create multiple entries over simulated time period
2. Include recurring patterns (e.g., afternoon fatigue)
3. Run analysis

**Expected Results:**

- ✅ Patterns detected and listed
- ✅ Frequency and consistency scores calculated
- ✅ Examples from actual data

#### Test 5.4: Alignment Validation (Match)

**Steps:**

1. Rate yourself as low energy (spoon level 3)
2. Take photo showing visible fatigue
3. Check correlation

**Expected Results:**

- ✅ `alignment = 'high'`
- ✅ Validation message: "Self-assessment aligns with observations"
- ✅ Positive reinforcement for self-awareness

### Console Commands for Verification

```javascript
// Manual correlation test
const analysis = correlationService.analyzeEntry(mockEntry, mockObservations);
console.log("Correlation:", analysis);
console.log("Masking:", analysis.masking);
console.log("Recommendations:", analysis.recommendations);
```

---

## Integration Testing

### End-to-End Flow Test

**Steps:**

1. Start fresh session (clear localStorage if needed)
2. Open Bio-Mirror
3. Take photo → Verify no flickering
4. Wait for analysis → Verify real progress
5. View results → Verify observations stored
6. Go to Journal Entry
7. Add text content
8. Wait 30s → Verify auto-save
9. Add capacity ratings (high values)
10. Save entry → Verify observations included
11. View correlation insights → Verify masking detection

**Expected Final State:**

- ✅ Entry saved with objective observations
- ✅ Correlation analysis available
- ✅ Masking alerts if applicable
- ✅ Draft cleared
- ✅ Session reset

---

## Automated Test Execution

```bash
# Run all unit tests
npm test

# Run specific test suites
npm test -- --filter="camera"
npm test -- --filter="vision"
npm test -- --filter="observation"
npm test -- --filter="draft"
npm test -- --filter="correlation"

# Run with coverage
npm test -- --coverage
```

---

## Known Issues / Edge Cases

### Camera

- Some older Android devices may not support `facingMode: 'environment'`
- Safari may require explicit user gesture before camera access

### Vision Service

- Very dark images may fail analysis (recommend lighting guidance)
- Very large images (>5MB) may cause timeout

### Draft Service

- Private browsing mode disables localStorage (drafts won't persist)
- Very large entries may exceed localStorage quota

### Correlation Service

- Requires minimum 1 observation for meaningful analysis
- Pattern detection needs 3+ entries for accuracy

### Onboarding System (v2.2.4)

- Requires cookies/localStorage enabled
- Works in incognito after localStorage is cleared
- Skip button available on all 5 steps
- Replay button in Settings → Help & Resources

---

## Phase 6: Onboarding System Testing (v2.2.4)

### Objective

Verify onboarding messaging is user-focused, skip button works, and first-entry detection is robust.

### Setup

```bash
# Clear onboarding flag to test fresh install
# In browser DevTools Console:
localStorage.removeItem('maeple_onboarding_complete');
location.reload();
```

### Test 6.1: First-Time User (Complete Flow)

**Steps:**

1. Clear localStorage as shown above
2. Open app at `http://localhost:5173`
3. Read all 5 steps (don't skip)
4. Click "Start Journaling" on final step

**Expected Results:**

- ✅ Onboarding appears automatically on startup
- ✅ All 5 steps visible and readable
- ✅ Step 1: "Understand Yourself Better" emphasizes self-compassion
- ✅ Step 2: "See Your Patterns Clearly" emphasizes outcomes
- ✅ Step 3: "Meet Mae" introduces pattern analyst
- ✅ Step 4: Privacy-first messaging
- ✅ Step 5: Action-oriented ("Start with One Entry")
- ✅ "Start Journaling" button closes modal
- ✅ localStorage flag is set to 'true'
- ✅ User sees app dashboard

**Verification:**

```javascript
// In console after completion:
localStorage.getItem("maeple_onboarding_complete") === "true"; // should be true
```

### Test 6.2: First-Time User (Skip Flow)

**Steps:**

1. Clear localStorage
2. Open app
3. On any step (e.g., step 3), click "Skip" button
4. Verify app is visible

**Expected Results:**

- ✅ "Skip" button is visible and clickable
- ✅ Modal closes gracefully
- ✅ User sees app dashboard
- ✅ localStorage flag is NOT set (empty)
- ✅ Refresh page → Onboarding reappears

**Verification:**

```javascript
// After clicking Skip, in console:
localStorage.getItem("maeple_onboarding_complete"); // should be null
// After refresh:
// Onboarding should appear again because no entries exist
```

### Test 6.3: Skip → Create Entry → Return

**Steps:**

1. Skip onboarding (Test 6.2)
2. Create a journal entry (Journal → Create Entry)
3. Refresh page (Ctrl+R or Cmd+R)

**Expected Results:**

- ✅ Entry is saved
- ✅ Onboarding does NOT reappear
- ✅ User sees dashboard with entry

**Verification:**

```javascript
// After creating entry and refreshing:
// In browser console:
const { useAppStore } = await import("./src/stores/index.ts");
const store = useAppStore.getState();
store.entries.length > 0; // should be true
store.showOnboarding; // should be false
```

### Test 6.4: Replay from Settings

**Steps:**

1. Complete onboarding (or skip then create entry)
2. Go to Settings (bottom of dashboard)
3. Scroll to "Help & Resources" section
4. Click "Replay Onboarding Tutorial"

**Expected Results:**

- ✅ Onboarding modal appears with all 5 steps
- ✅ Can navigate through all steps
- ✅ Can skip or complete again
- ✅ Modal closes after completion

### Test 6.5: localStorage Clearing (Robustness)

**Steps:**

1. Complete onboarding (Test 6.1)
2. Create a journal entry
3. Clear all site data (DevTools → Application → Clear site data)
4. Refresh page

**Expected Results:**

- ✅ Onboarding does NOT reappear (because entries still loaded from IndexedDB)
- ✅ Entry is still visible
- ✅ User continues normally

**Note**: This tests the dual-factor detection logic.

### Test 6.6: Messaging Quality Check

**Validation Points:**

- ✅ All text uses second-person ("your" not "the user's")
- ✅ No jargon or technical terms
- ✅ Focus on outcomes ("Know yourself so you can plan your life")
- ✅ Tone is compassionate and non-judgmental
- ✅ No implicit shame or "fixing" language
- ✅ Privacy messaging is clear and reassuring

### Test 6.7: Accessibility

**Steps:**

1. Open onboarding
2. Press Tab to navigate through all buttons
3. Verify skip button is reachable
4. Test with screen reader (optional)

**Expected Results:**

- ✅ All buttons are keyboard navigable
- ✅ Skip button has focus indicator
- ✅ Screen reader announces button text

### Known Issues & Workarounds

#### Issue: Onboarding doesn't appear on first load

**Workaround**: Clear both flags:

```javascript
localStorage.removeItem("maeple_onboarding_complete");
// Also verify entries are empty
```

#### Issue: Skip button not responsive

**Workaround**: Check browser console for errors, refresh page

---

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Console logs** (especially [Camera], [Vision], [Draft], [Correlation], [Onboarding] prefixes)
4. **Browser and version**
5. **Device type** (desktop/mobile)
6. **Screenshots** if visual issue
7. **For onboarding**: Include localStorage state and entry count

---

_Testing guide updated: January 4, 2026_
_Onboarding v2.2.4 testing section added_
