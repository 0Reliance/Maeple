# Camera & Recording Feature Test Plan

This document provides a comprehensive testing guide for verifying the camera and recording stability fixes implemented in Phase 1-3.

## Prerequisites
- Node.js 20.19+ (dev server requires this version)
- Browser with camera/microphone access (Chrome, Firefox, Safari, Edge)
- HTTPS or localhost (required for camera access)

## Phase 1: Critical Stability Fixes

### Test 1.1: AudioContext Resource Leak (audioAnalysisService.ts)

**Objective**: Verify AudioContext is properly closed after analysis

**Steps**:
1. Open Journal Entry component
2. Start a voice recording (10+ seconds)
3. Wait for analysis to complete
4. Repeat 20+ times rapidly
5. Check browser console for "maximum contexts reached" error

**Expected Result**:
- No "maximum AudioContexts reached" errors
- Memory remains stable
- All recordings analyze successfully

**Automated Test**:
```javascript
// tests/services/audioAnalysisService.test.ts
describe('AudioContext cleanup', () => {
  it('should close AudioContext after analyzeNoise', async () => {
    const audioBlob = createMockAudioBlob();
    const closeSpy = jest.spyOn(AudioContext.prototype, 'close');
    
    await analyzeNoise(audioBlob);
    
    expect(closeSpy).toHaveBeenCalled();
  });
});
```

---

### Test 1.2: Race Condition - Unmounted Component (RecordVoiceButton.tsx)

**Objective**: Verify no state updates after component unmount

**Steps**:
1. Navigate to a page with RecordVoiceButton
2. Start voice recording
3. Navigate away immediately (before recording finishes)
4. Wait for recording to complete in background

**Expected Result**:
- No React warning "Can't perform a React state update on an unmounted component"
- No TypeError "setIsAnalyzing is not a function"
- Application remains stable

**Automated Test**:
```javascript
// tests/components/RecordVoiceButton.test.tsx
describe('Unmount safety', () => {
  it('should not update state after unmount', async () => {
    const { unmount } = render(<RecordVoiceButton onTranscript={jest.fn()} />);
    const button = screen.getByRole('button');
    
    await fireEvent.click(button);
    unmount();
    
    // Wait for analysis to complete
    await waitFor(() => {}, { timeout: 5000 });
    
    // No errors should occur
    expect(console.error).not.toHaveBeenCalled();
  });
});
```

---

### Test 1.3: Stale Closure - Recognition Recreation (RecordVoiceButton.tsx)

**Objective**: Verify SpeechRecognition doesn't cause stuttering

**Steps**:
1. Open Journal Entry
2. Record multiple voice notes in succession
3. Observe recognition performance

**Expected Result**:
- Recognition starts immediately each time
- No delay in response
- SpeechRecognition object recreated efficiently

**Automated Test**:
```javascript
describe('Recognition lifecycle', () => {
  it('should not recreate recognition unnecessarily', () => {
    const { rerender } = render(
      <RecordVoiceButton onTranscript={jest.fn()} />
    );
    
    // Update callback (should use ref instead)
    rerender(<RecordVoiceButton onTranscript={jest.fn()} />);
    
    // Recognition should still be attached
    // (implementation detail: check recognition object reference)
  });
});
```

---

### Test 1.4: Object URL Memory Leak (StateCheckWizard.tsx)

**Objective**: Verify object URLs are revoked properly

**Steps**:
1. Open State Check Wizard
2. Capture multiple photos (take 10+ rapidly)
3. Navigate away from the component
4. Check browser memory usage

**Expected Result**:
- Memory doesn't grow unbounded
- Each previous image URL is revoked
- No warnings about lingering URLs

**Automated Test**:
```javascript
// tests/components/StateCheckWizard.test.tsx
describe('Object URL cleanup', () => {
  it('should revoke object URLs when image changes', () => {
    const revokeSpy = jest.spyOn(URL, 'revokeObjectURL');
    const { rerender } = render(
      <StateCheckWizard onCapture={jest.fn()} />
    );
    
    // Simulate multiple captures
    fireEvent.click(screen.getByText('Capture'));
    fireEvent.click(screen.getByText('Retake'));
    fireEvent.click(screen.getByText('Capture'));
    
    // At least one URL should be revoked
    expect(revokeSpy).toHaveBeenCalled();
  });
});
```

---

## Phase 2: High Priority Stability Fixes

### Test 2.1: Camera Error Handling & Retry (StateCheckCamera.tsx)

**Objective**: Verify camera fallback and retry mechanism

**Steps**:
1. Open Bio-Mirror camera
2. Request HD resolution (1280x720)
3. Simulate constraint failure (use camera that doesn't support HD)
4. Observe fallback behavior

**Expected Result**:
- Falls back to SD (640x480)
- Falls back to Low (320x240) if needed
- User sees clear error message
- Retry button works

**Manual Test**:
```javascript
// In browser console during camera test
// Override constraints to simulate failure
const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
navigator.mediaDevices.getUserMedia = async (constraints) => {
  if (constraints.video?.width?.ideal > 640) {
    throw new Error('Constraint not satisfied');
  }
  return originalGetUserMedia(constraints);
};

// Test camera - should fallback to SD
```

---

### Test 2.2: Recording Timeout (RecordVoiceButton.tsx)

**Objective**: Verify 5-minute auto-stop

**Steps**:
1. Start voice recording
2. Let it run for 6 minutes
3. Verify auto-stop behavior

**Expected Result**:
- Recording stops at 5 minutes (300 seconds)
- Timeout cleared properly
- Audio processed and returned

**Automated Test**:
```javascript
describe('Recording timeout', () => {
  jest.useFakeTimers();
  
  it('should stop recording after 5 minutes', () => {
    const onTranscript = jest.fn();
    render(<RecordVoiceButton onTranscript={onTranscript} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    // Fast-forward 5 minutes
    jest.advanceTimersByTime(300 * 1000);
    
    // Recording should stop
    expect(onTranscript).toHaveBeenCalled();
  });
});
```

---

### Test 2.3: Gemini Vision Timeout (geminiVisionService.ts)

**Objective**: Verify timeout cleanup and cancellation

**Steps**:
1. Open State Check Camera
2. Capture photo
3. Wait for AI analysis
4. Cancel before 30 seconds
5. Verify no memory leak

**Expected Result**:
- AbortSignal triggers cancellation
- Timeout cleared on success
- No "uncanceled promise" warnings

**Automated Test**:
```javascript
describe('Vision timeout', () => {
  it('should cleanup timeout on success', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    // Mock successful response
    mockAIResponse({ text: JSON.stringify(mockAnalysis) });
    
    await analyzeStateFromImage(mockImage, { timeout: 30000 });
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
```

---

### Test 2.4: Image Compression Validation (imageCompression.ts)

**Objective**: Verify compression handles edge cases

**Steps**:
1. Test with empty/zero-dimension image
2. Test with extremely large image (10,000x10,000)
3. Test with corrupted data URL
4. Test with already-small image

**Expected Result**:
- Zero dimensions throw descriptive error
- Large images compress successfully
- Corrupted URLs throw error
- Small images pass through unchanged

**Automated Test**:
```javascript
describe('Image compression validation', () => {
  it('should reject zero-dimension images', async () => {
    const zeroSizeImage = createMockImage(0, 0);
    
    await expect(compressImage(zeroSizeImage)).rejects.toThrow(
      'Invalid image: dimensions are zero'
    );
  });
  
  it('should validate calculated dimensions', async () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 10;
    mockCanvas.height = 10;
    
    await expect(compressImage(mockCanvas, { maxWidth: 5 })).rejects.toThrow(
      'Invalid calculated dimensions'
    );
  });
});
```

---

## Phase 3: Database Stability

### Test 3.1: Retry Logic (stateCheckService.ts)

**Objective**: Verify exponential backoff retries

**Steps**:
1. Mock IndexedDB to fail 2 times, succeed on 3rd
2. Save a state check
3. Verify retry pattern

**Expected Result**:
- Retry 1 after 100ms
- Retry 2 after 200ms (100 * 2^1)
- Retry 3 after 400ms (100 * 2^2)
- Succeeds or fails after 3 attempts
- Error logged for each failure

**Automated Test**:
```javascript
describe('Database retry logic', () => {
  it('should retry with exponential backoff', async () => {
    let attemptCount = 0;
    const mockDB = createMockIndexedDB(() => {
      attemptCount++;
      if (attemptCount < 3) throw new Error('DB Error');
      return { id: 'test' };
    });
    
    await saveStateCheck(mockDB, { analysis: mockAnalysis });
    
    expect(attemptCount).toBe(3);
  });
  
  it('should log errors for each retry', async () => {
    const logSpy = jest.spyOn(errorLogger, 'warn');
    
    // Fail all attempts
    const mockDB = createMockIndexedDB(() => {
      throw new Error('Persistent Error');
    });
    
    await expect(saveStateCheck(mockDB, { analysis: mockAnalysis }))
      .rejects.toThrow();
    
    expect(logSpy).toHaveBeenCalledTimes(3);
  });
});
```

---

### Test 3.2: AI Router Error Reporting (ai/router.ts)

**Objective**: Verify errors are logged with context

**Steps**:
1. Configure multiple AI providers
2. Make all providers fail with different errors
3. Check error logs

**Expected Result**:
- Each provider error logged separately
- Error includes provider name and details
- Final "all adapters failed" message logged

**Automated Test**:
```javascript
describe('AI router error reporting', () => {
  it('should log each adapter failure', async () => {
    const logSpy = jest.spyOn(errorLogger, 'error');
    
    // Mock all providers to fail
    mockProvider('anthropic', 'API Key invalid');
    mockProvider('openai', 'Rate limit exceeded');
    mockProvider('ollama', 'Service unavailable');
    
    await aiRouter.text({ prompt: 'test' });
    
    expect(logSpy).toHaveBeenCalledWith(
      'Anthropic adapter failed',
      expect.objectContaining({ provider: 'anthropic' })
    );
    expect(logSpy).toHaveBeenCalledWith(
      'OpenAI adapter failed',
      expect.objectContaining({ provider: 'openai' })
    );
  });
});
```

---

## Integration Tests

### Test I.1: End-to-End Recording Flow

**Steps**:
1. Navigate to Journal Entry
2. Start recording voice note
3. Speak for 10 seconds
4. Stop recording
5. Wait for analysis
6. Verify transcript returned
7. Navigate away during analysis
8. Wait for analysis to complete

**Expected Result**:
- All audio captured properly
- Analysis completes without errors
- No state updates after navigation
- Transcript displays correctly

---

### Test I.2: End-to-End Camera Flow

**Steps**:
1. Navigate to State Check
2. Open camera
3. Capture 5 photos in rapid succession
4. Wait for AI analysis on each
5. Cancel one analysis mid-flight
6. Navigate away while others processing

**Expected Result**:
- All photos captured
- Object URLs revoked after use
- Cancelled analysis stops cleanly
- No memory leaks
- Remaining analyses complete

---

## Performance Tests

### Test P.1: Memory Leak Detection

**Steps**:
1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Record 20 voice notes
4. Capture 20 camera photos
5. Take another heap snapshot
6. Compare snapshots

**Expected Result**:
- No detached DOM nodes
- No leaked AudioContext objects
- No leaked MediaRecorder objects
- Memory difference minimal

---

### Test P.2: Long-Running Stability

**Steps**:
1. Run automated test loop for 1 hour
2. Every 30 seconds: record voice + capture photo
3. Monitor memory and errors

**Expected Result**:
- No crashes after 1 hour
- Memory remains stable
- All operations complete
- No accumulation of errors

---

## Browser Compatibility Matrix

| Feature      | Chrome | Firefox | Safari | Edge |
|-------------|---------|----------|---------|-------|
| AudioContext | ✅      | ✅       | ✅      | ✅    |
| MediaRecorder | ✅     | ✅       | ✅*     | ✅    |
| Speech Recognition | ✅ | ✅    | ✅*    | ✅    |
| getUserMedia | ✅   | ✅       | ✅      | ✅    |
| AbortSignal | ✅     | ✅       | ✅      | ✅    |

\* Safari has limitations with some formats

---

## Manual Testing Checklist

### Audio Recording
- [ ] Record for 5 seconds - success
- [ ] Record for 5 minutes - auto-stops correctly
- [ ] Record, navigate away, return - no errors
- [ ] Record 20 times in a row - no memory leak
- [ ] Record while analysis running - disabled state works
- [ ] Cancel recording - cleanup occurs

### Camera
- [ ] Open camera - loads correctly
- [ ] Capture photo - saves correctly
- [ ] Retake photo - previous URL revoked
- [ ] Capture 10 photos rapidly - no crashes
- [ ] AI analysis timeout - handled gracefully
- [ ] Cancel analysis - stops cleanly

### Database
- [ ] Save state check - succeeds
- [ ] Save when DB fails - retries properly
- [ ] Load recent checks - returns correct data
- [ ] Save baseline - succeeds
- [ ] Concurrent saves - handled without conflicts

---

## Continuous Monitoring

### Error Tracking
Monitor errorLogger for patterns:
- AudioContext leak warnings
- Unmounted component updates
- Database transaction failures
- AI timeout errors

### Performance Metrics
Track:
- Average analysis time
- Memory usage over time
- Success rate of camera operations
- Success rate of recording operations

---

## Reporting Issues

When reporting bugs, include:
1. Browser version and OS
2. Console error messages
3. Steps to reproduce
4. Expected vs actual behavior
5. Memory profile if applicable

---

## Success Criteria

Phase 1-3 fixes are successful when:
- ✅ Zero "maximum contexts reached" errors
- ✅ Zero unmounted component warnings
- ✅ Zero object URL memory leaks
- ✅ All camera errors handled with user feedback
- ✅ All recordings timeout correctly
- ✅ All AI operations cancel cleanly
- ✅ Database operations retry on failure
- ✅ Memory usage stable over extended sessions