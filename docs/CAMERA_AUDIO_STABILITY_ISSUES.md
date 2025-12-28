# Camera & Audio Stability Issues Report

**Date:** 2025-12-27  
**Reviewed By:** System Analysis  
**Project:** Maeple

---

## Executive Summary

This report identifies stability issues found in the camera, recording, and processing functions of the Maeple application. The issues range from memory leaks and race conditions to insufficient error handling and resource management.

## Critical Issues (Priority 1)

### 1. AudioContext Resource Leak in `audioAnalysisService.ts`

**Location:** `src/services/audioAnalysisService.ts:87-95`

**Issue:**
```typescript
const audioContext = new AudioContext({ sampleRate: 48000 });
const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
// ... analysis code ...
// ❌ AudioContext is NEVER closed
```

**Impact:**
- Creates a new AudioContext for every analysis
- Each AudioContext remains in memory until the tab is closed
- Eventually leads to "maximum number of contexts reached" errors
- Wastes system resources

**Fix Required:**
```typescript
try {
  const audioContext = new AudioContext({ sampleRate: 48000 });
  const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
  // ... analysis code ...
  return { level, sources, dbLevel };
} finally {
  await audioContext.close();
}
```

---

### 2. Race Condition in `RecordVoiceButton.tsx`

**Location:** `src/components/RecordVoiceButton.tsx:135-155`

**Issue:**
The `mediaRecorder.onstop` handler calls `analyzeAudio()` which is async, but there's no guarantee the component won't unmount during analysis.

```typescript
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
  
  setIsAnalyzing(true);
  try {
    const { analyzeAudio } = await import('../services/audioAnalysisService');
    const analysis = await analyzeAudio(audioBlob, transcript); // ❌ Can run after unmount
    
    if (onAnalysisReady) {
      onAnalysisReady(analysis); // ❌ Can call callback on unmounted component
    }
    
    onTranscriptCallback(transcript, audioBlob, analysis);
  } catch (e) {
    console.error("Audio analysis failed", e);
    onTranscriptCallback('', audioBlob); // ❌ Callback on unmounted component
  } finally {
    setIsAnalyzing(false); // ❌ State update on unmounted component
  }
};
```

**Impact:**
- React warning: "Can't perform a React state update on an unmounted component"
- Memory leaks from unclosed promises
- Lost audio data if user navigates away

**Fix Required:**
Use a ref to track mounted state and check before state updates.

---

### 3. Stale Closure in `RecordVoiceButton.tsx`

**Location:** `src/components/RecordVoiceButton.tsx:56-87`

**Issue:**
The `recognition.onresult` handler captures `onTranscriptCallback` from the initial render, but this prop can change.

```typescript
useEffect(() => {
  // ... setup ...
  
  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      onTranscriptCallback(finalTranscript); // ❌ Stale closure
    }
  };
  
  return () => { /* cleanup */ };
}, [onTranscriptCallback, onAnalysisReady]); // ❌ Dependency causes re-setup on every render
```

**Impact:**
- Recognition object is destroyed and recreated on every render
- Causes stuttering and lost audio
- Poor user experience

**Fix Required:**
Use a ref to store the latest callback value without causing re-setup.

---

### 4. Memory Leak in `StateCheckWizard.tsx`

**Location:** `src/components/StateCheckWizard.tsx:85-120`

**Issue:**
Image data URLs are not revoked, causing memory accumulation.

```typescript
const handleCapture = async (src: string) => {
  setImageSrc(src); // ❌ Data URL stored, never revoked
  // ... analysis ...
};
```

**Impact:**
- Each photo creates a large data URL string in memory
- Multiple photos without cleanup leads to memory pressure
- Can cause crashes on devices with limited memory

**Fix Required:**
Revoke object URLs when no longer needed:
```typescript
useEffect(() => {
  return () => {
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
  };
}, [imageSrc]);
```

---

## High Priority Issues (Priority 2)

### 5. Insufficient Error Handling in `StateCheckCamera.tsx`

**Location:** `src/components/StateCheckCamera.tsx:34-58`

**Issue:**
Camera error handling is too simplistic and doesn't provide recovery options.

```typescript
} catch (err) {
  console.error("Camera error:", err);
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      setError("Camera permission denied. Please enable camera access in your browser settings.");
    }
    // ... other errors ...
  } else {
    setError("Unable to access camera. Please try again.");
  }
}
```

**Missing:**
- No retry mechanism
- No fallback to lower resolution
- No detection of camera hardware changes
- No handling of camera becoming unavailable after initial success

**Fix Required:**
Add automatic retry with different constraints and user-initiated retry button.

---

### 6. Synchronous Audio Processing Blocks UI

**Location:** `src/services/audioAnalysisService.ts:119-148`

**Issue:**
`decodeAudioData` and audio analysis are CPU-intensive and run on the main thread.

```typescript
const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
// ❌ Blocks main thread during decoding
```

**Impact:**
- UI freezes during audio processing
- Poor perceived performance
- Can cause "page unresponsive" warnings

**Fix Required:**
Consider using Web Workers for audio processing, or at least show loading indicators.

---

### 7. Missing Cleanup in `RecordVoiceButton.tsx`

**Location:** `src/components/RecordVoiceButton.tsx:167-186`

**Issue:**
Several resources are not properly cleaned up:

```typescript
const stopRecording = () => {
  // Stops recognition
  if (recognitionRef.current) {
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Ignore stop errors
    }
  }

  // ❌ Does not remove event listeners
  // ❌ Does not clear recognitionRef
  // ❌ Does not handle async cleanup of media recorder
};
```

**Impact:**
- Event listeners accumulate over time
- Memory leaks
- Potential multiple recordings starting simultaneously

---

### 8. No Timeout for Voice Recording

**Location:** `src/components/RecordVoiceButton.tsx:127-163`

**Issue:**
Voice recording has no maximum duration, allowing indefinite recording.

**Impact:**
- User can accidentally record for hours
- Creates enormous audio blobs
- Memory exhaustion
- Slow/failing analysis

**Fix Required:**
Add maximum recording duration (e.g., 5 minutes) with auto-stop.

---

### 9. Gemini Vision Service Timeout Issues

**Location:** `src/services/geminiVisionService.ts:147-159`

**Issue:**
Timeout implementation uses `clearTimeout` which doesn't work with `AbortController`.

```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  const timer = setTimeout(() => {
    reject(new Error('AI analysis timeout after 30 seconds'));
  }, timeout);
  
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(new DOMException('Analysis cancelled', 'AbortError'));
  });
});
```

**Issue:** The timeout promise is created inside the function but if the main promise resolves first, the timer isn't cleared.

**Fix Required:**
Ensure timer is always cleared, not just on abort.

---

### 10. Image Compression No Validation

**Location:** `src/utils/imageCompression.ts:20-52`

**Issue:**
No validation that the compression actually succeeded or produced a valid result.

```typescript
return canvas.toDataURL(format, quality);
// ❌ No check if result is valid
// ❌ No error handling if canvas context is lost
```

**Impact:**
- Returns invalid data URLs without indication
- Causes downstream failures
- Silent failures

**Fix Required:**
Validate the result and throw meaningful errors on failure.

---

## Medium Priority Issues (Priority 3)

### 11. AI Router Silent Failures

**Location:** `src/services/ai/router.ts:127-140`

**Issue:**
The `routeWithFallback` method logs errors but returns null, causing silent failures.

```typescript
for (const adapter of adapters) {
  try {
    return await fn(adapter);
  } catch (error) {
    lastError = error;
    console.warn(`Adapter ${adapter.constructor.name} failed for ${capability}:`, error);
    continue; // ❌ Silent fallback
  }
}

if (lastError) {
  console.error(`All providers failed for capability ${capability}`, lastError);
}
return null; // ❌ Silent failure - caller may not know why it failed
```

**Impact:**
- Users don't know why AI features aren't working
- Difficult to debug
- No user feedback

---

### 12. Database Operations No Retry

**Location:** `src/services/stateCheckService.ts`

**Issue:**
IndexedDB operations have no retry logic and fail silently on transient errors.

```typescript
const request = store.put(record);
request.onsuccess = () => resolve(id);
request.onerror = () => reject(request.error);
```

**Missing:**
- No retry on transient failures
- No handling of quota exceeded errors
- No user feedback for storage issues

---

### 13. Camera Resolution Hardcoded

**Location:** `src/components/StateCheckCamera.tsx:37-40`

**Issue:**
Camera resolution is hardcoded without fallback to supported resolutions.

```typescript
const mediaStream = await navigator.mediaDevices.getUserMedia({ 
  video: { 
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }, 
```

**Impact:**
- Fails on devices that don't support 720p
- No fallback to lower resolution
- Poor user experience on older devices

---

### 14. No Audio Blob URL Cleanup

**Location:** `src/components/RecordVoiceButton.tsx:135-163`

**Issue:**
Audio blobs are created but their URLs are never revoked.

```typescript
const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
// ❌ If blob URL is created, it's never revoked
```

**Impact:**
- Memory leaks
- Can't be garbage collected

---

### 15. Duplicate Image Conversion

**Location:** `src/components/StateCheckCamera.tsx:91-96`

**Issue:**
Image is drawn to canvas twice unnecessarily.

```typescript
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

const ctx = canvas.getContext('2d');
if (ctx) {
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  // ...
  const compressedImage = await compressImage(originalImage, ...); // ❌ Re-creates canvas
```

**Impact:**
- Slower capture
- Unnecessary processing
- Higher memory usage

---

## Low Priority Issues (Priority 4)

### 16. Missing Loading States

Various components lack loading indicators for async operations.

### 17. Inconsistent Error Messages

Error messages vary in style and detail across components.

### 18. No Analytics/Logging

No centralized logging of failures for monitoring.

### 19. Minimal Input Validation

No validation of inputs to services.

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Immediate)
1. Fix AudioContext resource leak
2. Fix race condition in RecordVoiceButton
3. Fix stale closure in RecordVoiceButton
4. Fix memory leak in StateCheckWizard

### Phase 2: High Priority (This Sprint)
5. Add robust error handling to camera
6. Move audio processing to worker or add better loading
7. Implement proper cleanup in RecordVoiceButton
8. Add timeout for voice recording
9. Fix timeout handling in geminiVisionService
10. Add validation to image compression

### Phase 3: Medium Priority (Next Sprint)
11. Improve AI Router error reporting
12. Add retry logic to database operations
13. Add camera resolution fallback
14. Clean up audio blob URLs
15. Optimize image capture flow

### Phase 4: Low Priority (Backlog)
16. Add consistent loading states
17. Standardize error messages
18. Implement analytics/logging
19. Add input validation

---

## Testing Recommendations

1. **Memory Testing**: Run camera and audio features for extended periods, monitoring memory usage
2. **Stress Testing**: Rapidly start/stop camera and recording
3. **Network Testing**: Test AI features with poor network conditions
4. **Device Testing**: Test on various devices with different capabilities
5. **Permission Testing**: Test camera/mic permission changes during operation
6. **Component Lifecycle Testing**: Unmount components during async operations

---

## Metrics to Track

1. Memory usage over time
2. Number of AudioContext instances created
3. Camera initialization failure rate
4. Audio analysis failure rate
5. AI provider failure rate
6. Time to capture image
7. Time to analyze audio
8. User-reported errors

---

## Notes

- Many issues stem from insufficient React lifecycle management
- Async operations need better error boundary handling
- Resource cleanup should be comprehensive (not just "best effort")
- User-facing error messages need to be actionable

---

**Report Generated:** 2025-12-27  
**Next Review:** After Phase 1 fixes are completed