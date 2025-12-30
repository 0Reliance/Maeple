# Capture Functionality Testing Guide

**Date:** 2025-12-28
**Purpose:** Comprehensive testing of all capture features (camera, microphone, audio)

---

## Test Environment Setup

### Prerequisites
- ✅ Application built and running: http://localhost:3000
- ✅ Device with camera (for camera tests)
- ✅ Device with microphone (for audio tests)
- ✅ Browser permissions enabled for camera/microphone
- ✅ Stable internet connection

---

## Test Scenarios

### 1. Camera Capture (Bio-Mirror / State Check)

#### Components Tested:
- `StateCheckCamera.tsx` - Bio-Mirror camera capture
- `BioCalibration.tsx` - Facial calibration
- `VisionBoard.tsx` - Image generation with camera upload

#### Test Cases:

##### Test 1.1: Camera Initialization
**Steps:**
1. Navigate to Bio-Mirror feature
2. Grant camera permission when prompted
3. Verify camera stream starts

**Expected Results:**
- ✅ Camera permission requested
- ✅ Video feed displays correctly
- ✅ "Waiting for camera..." message disappears
- ✅ Face guide overlay visible
- ✅ No error messages

**Potential Issues:**
- ⚠️ Camera permission denied
- ⚠️ Camera not found
- ⚠️ Camera already in use
- ⚠️ Resolution not supported

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 98-173)

---

##### Test 1.2: Resolution Fallback
**Steps:**
1. Start camera with HD resolution (default)
2. If HD fails, verify automatic fallback to SD
3. If SD fails, verify fallback to Low resolution

**Expected Results:**
- ✅ HD resolution attempts first
- ✅ Fallback to SD if HD fails
- ✅ Fallback to Low if SD fails
- ✅ Error message displayed if all resolutions fail
- ✅ Current resolution displayed (if not HD)

**Potential Issues:**
- ⚠️ All resolutions fail (camera hardware issue)
- ⚠️ Resolution switching not smooth

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 140-155)

---

##### Test 1.3: Image Capture
**Steps:**
1. Wait for video to be ready
2. Tap capture button
3. Verify image is captured and processed

**Expected Results:**
- ✅ Capture button disabled until video ready
- ✅ Image capture triggers haptic feedback
- ✅ Image compressed and displayed
- ✅ File size shown (e.g., "45 KB")
- ✅ Image passed to parent component
- ✅ Camera stopped after capture

**Potential Issues:**
- ⚠️ Image capture fails (canvas issue)
- ⚠️ Compression fails (worker issue)
- ⚠️ Memory leak (ImageData not cleaned up)
- ⚠️ Component unmounted during capture

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 177-280)

---

##### Test 1.4: Camera Toggle (Front/Back)
**Steps:**
1. Start camera (front-facing default)
2. Tap switch camera button
3. Verify camera switches to back-facing
4. Tap switch again to return to front

**Expected Results:**
- ✅ Camera switches smoothly
- ✅ Video feed updates
- ✅ Haptic feedback on toggle
- ✅ Image mirroring correct (front camera mirrored, back not)

**Potential Issues:**
- ⚠️ Camera switch fails (device only has one camera)
- ⚠️ Video freezes during switch
- ⚠️ Permission denied on switch

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 176-182)

---

##### Test 1.5: Error Handling - Permission Denied
**Steps:**
1. Open Bio-Mirror feature
2. Deny camera permission when prompted
3. Verify error message displayed

**Expected Results:**
- ✅ Error message: "Camera permission denied. Please enable camera access in your browser settings."
- ✅ Retry button visible
- ✅ Close button visible
- ✅ Video feed not displayed

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 142-144)

---

##### Test 1.6: Error Handling - Camera Not Found
**Steps:**
1. Open Bio-Mirror on device without camera
2. Verify error message

**Expected Results:**
- ✅ Error message: "No camera found. Please ensure your device has a working camera."
- ✅ Retry button visible
- ✅ Close button visible

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 145-147)

---

##### Test 1.7: Error Handling - Camera Already in Use
**Steps:**
1. Open camera in another application
2. Open Bio-Mirror feature
3. Verify error and fallback behavior

**Expected Results:**
- ✅ Error message if all resolutions fail
- ✅ Automatic retry with lower resolution attempted
- ✅ Clear error message: "Camera is already in use or not accessible."

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 148-156)

---

##### Test 1.8: Retry Mechanism
**Steps:**
1. Trigger camera error
2. Tap retry button
3. Verify retry count updates
4. Continue retrying up to MAX_RETRIES (3)

**Expected Results:**
- ✅ Retry button works
- ✅ Retry count displayed (e.g., "Retry (1/3)")
- ✅ After 3 retries: "Maximum retry attempts reached. Please refresh page."
- ✅ Retry button disabled after max retries

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 185-193)

---

##### Test 1.9: Memory Cleanup
**Steps:**
1. Capture multiple images in succession
2. Monitor memory usage in browser DevTools
3. Verify no memory leaks

**Expected Results:**
- ✅ ImageData cleaned up after capture
- ✅ Object URLs revoked
- ✅ Memory usage stable
- ✅ No gradual increase in memory

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 26-30, 76-79)

---

### 2. Audio/Microphone Capture

#### Components Tested:
- `RecordVoiceButton.tsx` - Voice recording button
- `LiveCoach.tsx` - Voice intake for journal entries

#### Test Cases:

##### Test 2.1: Microphone Access
**Steps:**
1. Navigate to Voice Intake feature
2. Grant microphone permission when prompted
3. Verify microphone is accessible

**Expected Results:**
- ✅ Microphone permission requested
- ✅ Recording button enabled
- ✅ No "No Mic Access" error
- ✅ Audio visualizer displays (if implemented)

**Code Reference:** `src/components/RecordVoiceButton.tsx` (lines 55-60)

---

##### Test 2.2: Recording Start/Stop
**Steps:**
1. Tap record button
2. Speak for a few seconds
3. Tap stop button
4. Verify audio is processed

**Expected Results:**
- ✅ Recording starts immediately
- ✅ Recording indicator visible
- ✅ Recording stops on second tap
- ✅ Audio processed (transcription/analysis)
- ✅ No errors during recording

**Code Reference:** `src/components/RecordVoiceButton.tsx` (lines 62-120)

---

##### Test 2.3: Audio Quality
**Steps:**
1. Record voice sample
2. Verify audio quality
3. Check transcript accuracy

**Expected Results:**
- ✅ Audio clear and audible
- ✅ Transcript captures speech accurately
- ✅ No background noise issues
- ✅ Recording length appropriate (15 seconds)

**Code Reference:** `src/components/LiveCoach.tsx` (lines 89-120)

---

##### Test 2.4: Error Handling - Permission Denied
**Steps:**
1. Open Voice Intake feature
2. Deny microphone permission
3. Verify error handling

**Expected Results:**
- ✅ Error message: "Could not access microphone. Please check permissions."
- ✅ Recording button disabled
- ✅ Clear instruction to user

**Code Reference:** `src/components/LiveCoach.tsx` (lines 115-119)

---

##### Test 2.5: Error Handling - No Microphone
**Steps:**
1. Open Voice Intake on device without microphone
2. Verify error message

**Expected Results:**
- ✅ Error: "No Mic Access"
- ✅ Recording button disabled
- ✅ Clear error message

**Code Reference:** `src/components/RecordVoiceButton.tsx` (lines 55-60)

---

##### Test 2.6: Recording Timeout
**Steps:**
1. Start recording
2. Wait for 15-second timeout
3. Verify automatic stop

**Expected Results:**
- ✅ Recording stops automatically after 15 seconds
- ✅ Audio processed without errors
- ✅ No manual stop required

**Code Reference:** `src/components/LiveCoach.tsx` (implicit - check timeout logic)

---

### 3. Image Worker Compression

#### Component Tested:
- `src/services/imageWorkerManager.ts` - Web Worker for image compression

#### Test Cases:

##### Test 3.1: Worker Initialization
**Steps:**
1. Capture image
2. Verify worker initializes
3. Check console for worker logs

**Expected Results:**
- ✅ Worker initialized successfully
- ✅ No worker initialization errors
- ✅ Worker pool created (if using pool)

**Code Reference:** `src/services/imageWorkerManager.ts`

---

##### Test 3.2: Image Compression
**Steps:**
1. Capture image
2. Verify compression works
3. Check file size reduction

**Expected Results:**
- ✅ Original image captured
- ✅ Image resized to max 512x512
- ✅ Image compressed with quality 0.85
- ✅ File size reduced (e.g., "45 KB" vs original "500 KB")
- ✅ Reduction percentage displayed

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 210-260)

---

##### Test 3.3: Worker Fallback
**Steps:**
1. Force worker to fail (simulate error)
2. Verify main thread fallback
3. Check error logs

**Expected Results:**
- ✅ Error logged: "Worker compression failed, falling back to main thread"
- ✅ Main thread compression executes
- ✅ Image still compressed successfully
- ✅ No visible error to user

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 261-269)

---

##### Test 3.4: Memory Cleanup
**Steps:**
1. Capture multiple images
2. Verify worker cleanup
3. Check memory usage

**Expected Results:**
- ✅ Worker cleanup called on unmount
- ✅ ImageData references nullified
- ✅ No memory leaks
- ✅ Object URLs revoked

**Code Reference:** `src/components/StateCheckCamera.tsx` (lines 26-30, 270-274)

---

## Known Issues & Fixes

### Issue 1: Worker Not Initialized
**Symptoms:**
- "Worker compression failed, falling back to main thread"
- Main thread compression used every time

**Root Cause:**
- Worker file not found
- Worker not properly initialized

**Fix:**
```typescript
// Verify worker file exists
// src/workers/imageWorker.ts should be in public/workers/imageWorker.js
```

---

### Issue 2: Camera Timeout
**Symptoms:**
- "Video ready timeout" error
- Camera not starting

**Root Cause:**
- 5-second timeout too short for slow cameras
- Camera permission dialog blocking

**Fix:**
```typescript
// Increase timeout in StateCheckCamera.tsx
setTimeout(() => {
  video.removeEventListener('loadedmetadata', handleReady);
  reject(new Error('Video ready timeout'));
}, 10000); // Increase to 10 seconds
```

---

### Issue 3: Memory Leak on Capture
**Symptoms:**
- Memory increases with each capture
- Browser becomes slow after multiple captures

**Root Cause:**
- ImageData not cleaned up
- Object URLs not revoked

**Fix:**
```typescript
// Already implemented in StateCheckCamera.tsx
// Verify cleanup is working:
useEffect(() => {
  return () => {
    if (imageDataRef.current) {
      imageDataRef.current = null;
    }
  };
}, []);
```

---

### Issue 4: Component Unmounted During Capture
**Symptoms:**
- "Component unmounted during compression" warning
- Lost captures

**Root Cause:**
- User navigates away during capture
- Async operation completes after unmount

**Fix:**
```typescript
// Already implemented with mountedRef.current checks
// Verify all async operations check mounted state
if (!mountedRef.current) {
  console.warn('Component unmounted during compression');
  return;
}
```

---

## Browser Compatibility

### Camera Support

| Browser | getUserMedia | Facing Mode | MediaRecorder | Status |
|---------|--------------|-------------|---------------|--------|
| Chrome 88+ | ✅ | ✅ | ✅ | Full Support |
| Firefox 76+ | ✅ | ✅ | ✅ | Full Support |
| Safari 14+ | ✅ | ⚠️ | ⚠️ | Limited Support |
| Edge 88+ | ✅ | ✅ | ✅ | Full Support |

### Known Browser Issues

#### Safari
- **Issue:** `facingMode` may not work correctly
- **Workaround:** Show only rear camera on Safari
- **Status:** Documented, needs testing

#### Firefox
- **Issue:** Camera permission prompt behavior
- **Workaround:** Clear instructions in UI
- **Status:** Works, but UX may differ

---

## Testing Checklist

### Camera Tests
- [ ] 1.1 Camera Initialization
- [ ] 1.2 Resolution Fallback
- [ ] 1.3 Image Capture
- [ ] 1.4 Camera Toggle (Front/Back)
- [ ] 1.5 Error Handling - Permission Denied
- [ ] 1.6 Error Handling - Camera Not Found
- [ ] 1.7 Error Handling - Camera Already in Use
- [ ] 1.8 Retry Mechanism
- [ ] 1.9 Memory Cleanup

### Audio Tests
- [ ] 2.1 Microphone Access
- [ ] 2.2 Recording Start/Stop
- [ ] 2.3 Audio Quality
- [ ] 2.4 Error Handling - Permission Denied
- [ ] 2.5 Error Handling - No Microphone
- [ ] 2.6 Recording Timeout

### Worker Tests
- [ ] 3.1 Worker Initialization
- [ ] 3.2 Image Compression
- [ ] 3.3 Worker Fallback
- [ ] 3.4 Memory Cleanup

---

## Automated Test Plan

### Unit Tests Needed

```typescript
// tests/components/StateCheckCamera.test.ts
describe('StateCheckCamera', () => {
  it('should initialize camera on mount')
  it('should handle camera permission denied')
  it('should fallback to lower resolution')
  it('should capture and compress image')
  it('should cleanup on unmount')
});

// tests/components/RecordVoiceButton.test.ts
describe('RecordVoiceButton', () => {
  it('should request microphone permission')
  it('should start/stop recording')
  it('should handle microphone errors')
});
```

### Integration Tests Needed

```typescript
// tests/integration/captureFlow.test.ts
describe('Capture Integration', () => {
  it('should complete full camera capture flow')
  it('should complete full audio recording flow')
  it('should handle permission errors gracefully')
});
```

---

## Manual Testing Instructions

### Pre-Test Setup
1. Open browser DevTools (F12)
2. Go to Console tab
3. Go to Network tab
4. Go to Performance tab (for memory testing)

### Camera Testing
1. Navigate to http://localhost:3000
2. Open Bio-Mirror feature
3. Grant camera permission
4. Complete test cases 1.1-1.9
5. Monitor console for errors
6. Monitor memory usage in Performance tab

### Audio Testing
1. Open Voice Intake feature
2. Grant microphone permission
3. Complete test cases 2.1-2.6
4. Monitor console for errors
5. Test with different audio levels (quiet/loud)
6. Test with background noise

### Cross-Browser Testing
1. Chrome (latest)
2. Firefox (latest)
3. Safari (if available)
4. Edge (if available)
5. Mobile Chrome (if available)
6. Mobile Safari (if available)

---

## Expected Performance Metrics

### Camera Performance
- **Init time:** <3 seconds
- **Capture time:** <500ms
- **Compression time:** <2 seconds
- **Memory per capture:** <10 MB
- **Max concurrent captures:** 5+

### Audio Performance
- **Init time:** <1 second
- **Recording duration:** 15 seconds (max)
- **Processing time:** <3 seconds
- **Audio quality:** Clear speech

---

## Troubleshooting Guide

### Camera Not Starting

**Symptoms:** Camera permission denied or not found

**Solutions:**
1. Check browser settings → Privacy → Camera
2. Check system settings → Camera permissions
3. Close other apps using camera
4. Refresh page and try again
5. Try different browser
6. Check device camera is working

---

### Audio Not Recording

**Symptoms:** Microphone permission denied or no audio

**Solutions:**
1. Check browser settings → Privacy → Microphone
2. Check system settings → Microphone permissions
3. Check device microphone is working
4. Try different browser
5. Check audio input/output settings

---

### Compression Failing

**Symptoms:** "Worker compression failed, falling back to main thread"

**Solutions:**
1. Check console for specific error
2. Verify worker file exists in public/workers/
3. Try refreshing page
4. Check browser supports Web Workers
5. Disable extensions that may block workers

---

### Memory Issues

**Symptoms:** Browser becomes slow after multiple captures

**Solutions:**
1. Refresh page to clear memory
2. Check for memory leaks in DevTools
3. Close other tabs
4. Restart browser
5. Verify cleanup code is executing

---

## Next Steps

1. **Complete Manual Testing**
   - Execute all test cases
   - Document results
   - Identify issues

2. **Create Automated Tests**
   - Unit tests for components
   - Integration tests for flows
   - E2E tests with Playwright/Cypress

3. **Fix Identified Issues**
   - Prioritize critical issues
   - Test fixes thoroughly
   - Document solutions

4. **Performance Optimization**
   - Monitor metrics in production
   - Optimize slow operations
   - Reduce memory usage

---

## Conclusion

This comprehensive testing guide covers all capture functionality in the Maeple application. Execute tests systematically, document results, and fix any issues discovered before deploying to production.

**Status:** Ready for testing
**Test Environment:** http://localhost:3000
**Documentation Version:** 1.0