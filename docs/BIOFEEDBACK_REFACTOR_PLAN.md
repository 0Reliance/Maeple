# MAEPLE Biofeedback Refactor Plan

**Document Version**: 1.0  
**Date**: December 26, 2025  
**Status**: Planning Phase (No code written yet)

---

## Executive Summary

This document provides a comprehensive analysis and refactor plan for MAEPLE's biofeedback functionality (Bio-Mirror, State Check, and Calibration). The current implementation suffers from critical UI/UX issues, performance problems (30-second freezes), and poor user experience that makes the feature appear broken.

**Key Problems Identified**:
1. ❌ UI appears frozen for 30 seconds during AI analysis
2. ❌ No clear instructions or guidance for users
3. ❌ Portrait phone displays landscape-optimized interface
4. ❌ Buttons are unclear and provide no feedback
5. ❌ No progress indication or status updates
6. ❌ No error recovery or retry mechanisms
7. ❌ Large images cause performance issues
8. ❌ No timeout or cancellation options

**Refactor Goal**: Create a responsive, intuitive, and performant biofeedback experience that guides users through calibration and state checks with clear feedback, progress indication, and graceful error handling.

---

## Part 1: Current State Analysis

### 1.1 Component Architecture

```
BioCalibration (Setup Baseline)
    ↓
StateCheckWizard (Main Entry)
    ↓
StateCheckCamera (Capture Interface)
    ↓
StateCheckResults (Display Results)
```

### 1.2 Service Layer

- **geminiVisionService**: AI analysis (vision)
- **stateCheckService**: Encrypted storage (IndexedDB)
- **comparisonEngine**: Compare subjective vs objective data
- **encryptionService**: AES-GCM encryption for biometrics

### 1.3 Data Flow

```
User Captures Image
    ↓
Convert to Base64 (FULL RESOLUTION - ISSUE)
    ↓
Send to Gemini API
    ↓
Wait 30 seconds (BLOCKING UI - ISSUE)
    ↓
Parse JSON Response
    ↓
Display Results
    ↓
Encrypt & Store (AES-GCM)
```

---

## Part 2: Issues Identified

### 2.1 Critical Performance Issues

#### Issue #1: 30-Second UI Freeze

**Root Cause**: AI analysis is completely synchronous with no progress indication

**Location**: `geminiVisionService.ts` → `analyzeStateFromImage()`

**Current Code**:
```typescript
const response = await rateLimitedCall(() =>
  ai.models.generateContent({
    model: "gemini-2.5-flash", // INCORRECT MODEL NAME
    contents: { parts: [...] },
    config: { responseMimeType: "application/json" }
  }),
  { priority: 4 }
);
// NO TIMEOUT, NO PROGRESS, NO CANCELLATION
```

**Impact**: 
- User thinks app is frozen
- No way to cancel
- Poor UX experience
- App appears broken

**Solution**:
- Add 30-second timeout with exponential backoff
- Implement streaming responses for real-time progress
- Add cancellation token
- Show progress indicator with estimated time remaining

---

#### Issue #2: Large Image Base64 Encoding

**Root Cause**: Capturing full video resolution (1920x1080+) and converting to base64

**Location**: `StateCheckCamera.tsx` → `capture()`

**Current Code**:
```typescript
canvas.width = video.videoWidth;  // Can be 1920px
canvas.height = video.videoHeight; // Can be 1080px
const imageSrc = canvas.toDataURL('image/png'); // Full resolution
```

**Impact**:
- 1920x1080 PNG = ~6MB base64 string
- Slow upload to API
- Slow processing
- Encrypted storage takes longer

**Solution**:
- Resize to 512x512 or 640x480 for facial analysis
- Use WebP format (smaller than PNG)
- Compress before base64 encoding
- Target image size: <500KB

---

#### Issue #3: Synchronous Encryption/Decryption

**Root Cause**: AES-GCM operations are synchronous and block UI thread

**Location**: `stateCheckService.ts` → `saveStateCheck()`, `getStateCheck()`

**Impact**:
- UI freeze during save/load operations
- Poor performance on mobile devices

**Solution**:
- Use Web Crypto API (native, faster)
- Implement incremental encryption for large data
- Show loading indicator during encryption

---

### 2.2 Critical UI/UX Issues

#### Issue #4: No Clear Instructions

**Location**: `StateCheckWizard.tsx` → INTRO step

**Problem**: 
- Generic description without step-by-step guidance
- No visual examples
- No explanation of what's being measured
- Unclear why user should do this

**Current State**:
```typescript
<p className="text-slate-600 dark:text-slate-400 leading-relaxed">
  Objectively analyze your physical signs of stress and masking. 
  Your body often signals burnout before your mind acknowledges it.
</p>
```

**Solution**:
- Add step-by-step onboarding with visual guides
- Explain each metric (Jaw Tension, Eye Fatigue, Micro-Expressions)
- Show example of good vs bad lighting
- Add "What is Bio-Mirror?" tooltip/modal
- Include video demonstration (optional)

---

#### Issue #5: Portrait vs Landscape Layout

**Location**: `StateCheckCamera.tsx`

**Problem**:
- Fixed dimensions designed for landscape (`w-64 h-80`)
- Portrait phones show squeezed interface
- Bottom sheet controls may be too small
- Face guide overlay doesn't scale properly

**Current Code**:
```typescript
<div className="w-64 h-80 border-2 ..."> {/* Fixed size */}
  <div className="absolute top-0 left-1/2 ...">Face Here</div>
</div>
```

**Solution**:
- Responsive design with Tailwind breakpoints
- Dynamic sizing based on viewport
- Better mobile-first approach
- Test on actual portrait devices
- Use CSS Grid/Flexbox for adaptive layouts

---

#### Issue #6: No Progress Feedback

**Location**: `StateCheckWizard.tsx` → ANALYZING step

**Problem**:
- Single static loading state
- No indication of progress
- No estimated time remaining
- User has no idea if it's working

**Current State**:
```typescript
if (step === 'ANALYZING') {
  return (
    <div className="flex flex-col items-center justify-center h-96 space-y-6">
      <Loader2 className="animate-spin ..." />
      <h3>Analyzing Bio-Signals...</h3>
    </div>
  );
}
```

**Solution**:
- Implement 5-stage progress indicator:
  1. 📸 Processing image (0-20%)
  2. 🧠 Sending to AI (20-40%)
  3. 🔍 Analyzing facial features (40-70%)
  4. 📊 Calculating metrics (70-90%)
  5. ✓ Preparing results (90-100%)
- Show estimated time remaining
- Animated progress bar
- Cancel button if taking too long

---

#### Issue #7: No Error Recovery

**Location**: All components

**Problem**:
- Generic `alert("Analysis failed. Please try again.")`
- No specific error messages
- No guidance on how to fix
- No retry mechanism
- No offline mode fallback

**Solution**:
- Specific error messages:
  - "Camera permission denied. Please enable in Settings."
  - "Network error. Check your connection and try again."
  - "AI service unavailable. Using offline mode."
- Retry button with exponential backoff
- Offline mode with basic analysis
- Error logging for debugging

---

#### Issue #8: Unclear Button States

**Location**: `StateCheckResults.tsx`

**Problem**:
- Save button just says "Save Analysis Securely"
- No indication it's working while saving
- No confirmation after save
- "Encrypting & Saving..." appears but no time estimate

**Current Code**:
```typescript
<button disabled={isSaving} onClick={handleSave}>
  <Save size={20} />
  {isSaving ? 'Encrypting & Saving...' : 'Save Analysis Securely'}
</button>
```

**Solution**:
- Loading spinner on button
- Progress bar for encryption
- Success animation after save
- Clear button states:
  - "Save Analysis" (idle)
  - "Encrypting... 50%" (in progress)
  - "✓ Saved Securely" (success)
  - "⚠️ Save Failed - Retry" (error)

---

### 2.3 Technical Issues

#### Issue #9: Incorrect AI Model Name

**Location**: `geminiVisionService.ts`

**Problem**:
```typescript
model: "gemini-2.5-flash"  // ❌ DOESN'T EXIST
```

**Correct Models**:
- `gemini-2.0-flash-exp` (current)
- `gemini-2.0-flash` (stable)
- `gemini-1.5-pro` (higher quality)

**Solution**: Use correct model name

---

#### Issue #10: No Timeout Handling

**Location**: `geminiVisionService.ts`

**Problem**: API call can hang indefinitely

**Solution**:
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), 30000)
);

const response = await Promise.race([
  ai.models.generateContent(...),
  timeoutPromise
]);
```

---

#### Issue #11: No Input Validation

**Location**: `StateCheckCamera.tsx`

**Problem**:
- No check if face is in frame
- No check for lighting quality
- No check for image blur
- User can capture empty/bad images

**Solution**:
- Face detection API (`FaceDetector` from `@tensorflow-models/face-detection`)
- Lighting analysis (histogram brightness)
- Blur detection (Laplacian variance)
- Show "No face detected" or "Too dark" warnings
- Disable capture button until conditions are good

---

#### Issue #12: No Cancellation Support

**Location**: All async operations

**Problem**: 
- User can't cancel analysis mid-way
- User can't cancel encryption
- No abort controllers

**Solution**:
- Implement `AbortController` for API calls
- Cancellation tokens for async operations
- Cancel button during analysis
- Cleanup on component unmount

---

## Part 3: Refactor Strategy

### 3.1 Principles

1. **Mobile-First Design**: Optimize for portrait phones (primary use case)
2. **Progressive Enhancement**: Core features work offline, enhanced online
3. **Clear Feedback**: Every action has immediate visual feedback
4. **Graceful Degradation**: If AI fails, provide basic functionality
5. **Performance First**: Optimize image size, use streaming, lazy load
6. **Error Recovery**: Specific errors with clear solutions
7. **User Control**: User can cancel, retry, and manage their data

### 3.2 Refactor Phases

#### Phase 1: Critical Fixes (Week 1)
- Fix AI model name
- Add timeout handling
- Implement image compression
- Add progress feedback
- Fix responsive layout

#### Phase 2: UX Improvements (Week 2)
- Add clear instructions with onboarding
- Implement face detection validation
- Add error recovery with specific messages
- Improve button states and feedback
- Add cancellation support

#### Phase 3: Performance Optimization (Week 3)
- Implement streaming responses
- Optimize encryption/decryption
- Add offline mode
- Implement caching
- Lazy load heavy components

#### Phase 4: Advanced Features (Week 4)
- Add real-time guidance during capture
- Implement before/after comparison
- Add trend analysis
- Export data
- Accessibility improvements

---

## Part 4: Detailed Refactor Plan

### 4.1 Component Refactor: StateCheckCamera

#### Current Issues:
- Fixed dimensions don't work on portrait
- No validation of capture quality
- No guidance during capture
- Poor lighting handling

#### New Design:

**Responsive Layout**:
```typescript
// Use dynamic sizing based on viewport
const faceGuideSize = useWindowSize() < 768 ? 'w-48 h-64' : 'w-64 h-80';

<div className={`border-2 border-white/30 rounded-[3rem] relative ${faceGuideSize}`}>
  {/* Face guide */}
</div>
```

**Face Detection**:
```typescript
// Use FaceDetector API
const [faceDetected, setFaceDetected] = useState(false);
const [lightingQuality, setLightingQuality] = useState<'good' | 'poor'>('poor');

useEffect(() => {
  detectFacePeriodically();
}, [stream]);

const detectFacePeriodically = async () => {
  // Use @tensorflow-models/face-detection
  const faces = await faceDetector.estimateFaces(videoRef.current);
  const hasFace = faces.length > 0;
  setFaceDetected(hasFace);
  
  // Analyze lighting
  const quality = analyzeLighting(videoRef.current);
  setLightingQuality(quality);
};
```

**Image Compression**:
```typescript
const capture = async () => {
  if (!faceDetected || lightingQuality === 'poor') {
    showToast('Please ensure good lighting and face in frame');
    return;
  }
  
  // Compress image
  const compressed = await compressImage(canvasRef.current, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    format: 'image/webp'
  });
  
  onCapture(compressed.dataUrl);
};
```

**Capture Guidance**:
```typescript
<div className="absolute bottom-4 left-0 right-0">
  {lightingQuality === 'poor' && (
    <div className="bg-amber-500 text-white px-4 py-2 rounded-lg">
      ⚠️ Too dark - move to brighter area
    </div>
  )}
  {!faceDetected && (
    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg">
      👤 Position face in frame
    </div>
  )}
  {faceDetected && lightingQuality === 'good' && (
    <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg">
      ✓ Perfect - tap to capture
    </div>
  )}
</div>
```

---

### 4.2 Component Refactor: StateCheckWizard

#### Current Issues:
- No onboarding/instructions
- Single static loading state
- No progress indication
- No cancellation

#### New Design:

**Onboarding Modal** (First time):
```typescript
const [showOnboarding, setShowOnboarding] = useState(
  !localStorage.getItem('bio-mirror-onboarding-complete')
);

const Onboarding = () => (
  <div className="fixed inset-0 z-50 bg-black/80">
    <div className="max-w-md mx-auto p-6">
      <Step1: What is Bio-Mirror />
      <Step2: Why it matters />
      <Step3: How it works />
      <Step4: Tips for best results />
      <button onClick={completeOnboarding}>Got it!</button>
    </div>
  </div>
);
```

**Progress Indicator**:
```typescript
const [progress, setProgress] = useState(0);
const [currentStage, setCurrentStage] = useState('');

const stages = [
  { name: 'Processing image', weight: 20 },
  { name: 'Sending to AI', weight: 20 },
  { name: 'Analyzing features', weight: 30 },
  { name: 'Calculating metrics', weight: 20 },
  { name: 'Preparing results', weight: 10 }
];

const analyzeWithProgress = async (image) => {
  for (let i = 0; i < stages.length; i++) {
    setCurrentStage(stages[i].name);
    setProgress(progress + stages[i].weight);
    await simulateDelay(stages[i].estimatedTime);
  }
};

// UI
<div className="progress-bar">
  <div className="fill" style={{ width: `${progress}%` }} />
  <p>{currentStage}</p>
  <p>Estimated time: {30 - progress * 0.3}s</p>
</div>
```

**Cancellation Support**:
```typescript
const [abortController, setAbortController] = useState(null);

const handleCapture = async (image) => {
  const controller = new AbortController();
  setAbortController(controller);
  
  try {
    await analyzeWithTimeout(image, { signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      showToast('Analysis cancelled');
      setStep('INTRO');
    }
  }
};

const cancelAnalysis = () => {
  if (abortController) {
    abortController.abort();
  }
};

// UI
<button onClick={cancelAnalysis}>Cancel</button>
```

---

### 4.3 Service Refactor: geminiVisionService

#### Current Issues:
- Incorrect model name
- No timeout
- No streaming
- No offline fallback

#### New Design:

**Correct Model with Timeout**:
```typescript
const analyzeStateFromImage = async (
  base64Image: string,
  options: { timeout?: number, signal?: AbortSignal } = {}
): Promise<FacialAnalysis> => {
  const { timeout = 30000, signal } = options;
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('AI analysis timeout'));
    }, timeout);
    
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
  
  try {
    const ai = getAI();
    if (!ai) throw new Error('AI not configured');
    
    // Correct model name
    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: { parts: [...] },
        config: { responseMimeType: "application/json" }
      }),
      timeoutPromise
    ]);
    
    return JSON.parse(response.text) as FacialAnalysis;
  } catch (error) {
    console.error('Vision Analysis Error:', error);
    return getOfflineAnalysis(base64Image); // Fallback
  }
};
```

**Streaming Response**:
```typescript
const analyzeWithStreaming = async (
  base64Image: string,
  onProgress: (stage: string, progress: number) => void,
  signal?: AbortSignal
): Promise<FacialAnalysis> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: { parts: [...] },
    config: { responseMimeType: "application/json" },
    signal // Pass abort signal
  });
  
  // Process streaming response
  for await (const chunk of response.stream) {
    const stage = parseStage(chunk);
    const progress = calculateProgress(stage);
    onProgress(stage, progress);
  }
  
  return finalResult;
};
```

**Offline Fallback**:
```typescript
const getOfflineAnalysis = async (
  base64Image: string
): Promise<FacialAnalysis> => {
  // Basic image analysis without AI
  const brightness = analyzeBrightness(base64Image);
  const contrast = analyzeContrast(base64Image);
  const sharpness = analyzeSharpness(base64Image);
  
  // Estimate metrics based on image quality
  return {
    primaryEmotion: "unknown",
    confidence: 0.3,
    eyeFatigue: estimateFatigue(sharpness, brightness),
    jawTension: estimateTension(contrast),
    maskingScore: estimateMasking(sharpness),
    signs: ["Offline analysis - basic estimates"],
    note: "AI unavailable. Results are estimates based on image quality."
  };
};
```

---

### 4.4 Service Refactor: stateCheckService

#### Current Issues:
- Synchronous encryption blocks UI
- No caching
- No batch operations

#### New Design:

**Asynchronous Encryption**:
```typescript
const saveStateCheck = async (
  data: Partial<StateCheck>,
  imageBlob?: Blob,
  onProgress?: (progress: number) => void
): Promise<string> => {
  onProgress?.(0);
  
  // Compress image
  const compressed = await compressImage(imageBlob, {
    maxWidth: 512,
    quality: 0.8
  });
  onProgress?.(20);
  
  // Encrypt asynchronously
  const { cipher, iv } = await encryptDataAsync(
    data.analysis,
    onProgress?.bind(null, 40)
  );
  onProgress?.(60);
  
  // Store
  const id = await storeInIndexedDB({
    ...data,
    id: generateId(),
    analysisCipher: cipher,
    iv,
    imageBlob: compressed,
    timestamp: new Date().toISOString()
  });
  onProgress?.(100);
  
  return id;
};

// UI usage
<SaveButton
  onClick={() => saveStateCheck(data, blob, setProgress)}
  progress={progress}
/>
```

**Caching Layer**:
```typescript
const analysisCache = new Map<string, FacialAnalysis>();

const analyzeWithCache = async (image: string): Promise<FacialAnalysis> => {
  const cacheKey = hashImage(image);
  
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }
  
  const result = await analyzeStateFromImage(image);
  analysisCache.set(cacheKey, result);
  
  // Persist to localStorage
  localStorage.setItem('analysis-cache', JSON.stringify([...analysisCache]));
  
  return result;
};
```

---

### 4.5 Component Refactor: StateCheckResults

#### Current Issues:
- No loading state during save
- Unclear button states
- No comparison visualization
- Safety banner appears abruptly

#### New Design:

**Animated Save Button**:
```typescript
const [saveProgress, setSaveProgress] = useState(0);
const [saveState, setSaveState] = useState<'idle' | 'encrypting' | 'saving' | 'success' | 'error'>('idle');

const handleSave = async () => {
  setSaveState('encrypting');
  setSaveProgress(0);
  
  try {
    const encrypted = await encryptWithProgress(analysis, (p) => setSaveProgress(p));
    setSaveState('saving');
    
    await saveToDatabase(encrypted);
    setSaveState('success');
    
    // Auto-dismiss after 2 seconds
    setTimeout(() => setSaveState('idle'), 2000);
  } catch (e) {
    setSaveState('error');
  }
};

// UI
<button
  onClick={handleSave}
  disabled={saveState !== 'idle'}
  className={getButtonClass(saveState)}
>
  {saveState === 'idle' && (
    <><Save /> Save Analysis</>
  )}
  {saveState === 'encrypting' && (
    <>
      <Shield className="animate-pulse" />
      Encrypting {saveProgress}%
    </>
  )}
  {saveState === 'saving' && (
    <>
      <Loader2 className="animate-spin" />
      Saving...
    </>
  )}
  {saveState === 'success' && (
    <>
      <CheckCircle2 />
      ✓ Saved Securely
    </>
  )}
  {saveState === 'error' && (
    <>
      <AlertTriangle />
      Save Failed - Retry
    </>
  )}
</button>
```

**Visual Comparison**:
```typescript
const ComparisonVisualizer = ({ subjective, objective, discrepancy }) => (
  <div className="comparison-container">
    <h3>Reality Check</h3>
    
    <div className="subjective-objective">
      <div className="subjective">
        <h4>You Reported</h4>
        <MoodIndicator mood={subjective.mood} label={subjective.moodLabel} />
        <p>"{subjective.summary}"</p>
      </div>
      
      <div className="discrepancy-visual">
        <DiscrepancyMeter score={discrepancy} />
        {discrepancy > 50 && <DiscrepancyExplanation />}
      </div>
      
      <div className="objective">
        <h4>Your Body Shows</h4>
        <FaceAnalysisChart data={objective} />
        <p>{objective.insight}</p>
      </div>
    </div>
    
    <InsightPanel insight={comparison.insight} />
  </div>
);
```

**Smooth Safety Banner**:
```typescript
<SafetyBanner
  isCritical={isCritical}
  onDismiss={() => setShowSafetyBanner(false)}
  animated={true}
>
  <WarningContent />
</SafetyBanner>
```

---

## Part 5: Testing Strategy

### 5.1 Unit Tests

```typescript
// tests/services/geminiVisionService.test.ts
describe('geminiVisionService', () => {
  test('should timeout after 30 seconds', async () => {
    await expect(
      analyzeStateFromImage(image, { timeout: 1000 })
    ).rejects.toThrow('timeout');
  });
  
  test('should fallback to offline mode on error', async () => {
    const result = await analyzeStateFromImage(badImage);
    expect(result.signs).toContain('Offline analysis');
  });
});

// tests/components/StateCheckCamera.test.ts
describe('StateCheckCamera', () => {
  test('should disable capture when no face detected', () => {
    render(<StateCheckCamera {...props} />);
    const captureButton = screen.getByRole('button', { name: /capture/i });
    expect(captureButton).toBeDisabled();
  });
  
  test('should show warning when lighting is poor', () => {
    render(<StateCheckCamera {...props} lightingQuality="poor" />);
    expect(screen.getByText(/too dark/i)).toBeInTheDocument();
  });
});
```

### 5.2 Integration Tests

```typescript
// tests/integration/biofeedback-flow.test.ts
describe('Biofeedback Flow', () => {
  test('complete state check flow', async () => {
    // Start wizard
    render(<StateCheckWizard />);
    
    // Click start
    fireEvent.click(screen.getByText(/open bio-mirror/i));
    
    // Wait for camera
    await waitFor(() => screen.getByRole('button', { name: /capture/i }));
    
    // Simulate face detection
    act(() => mockFaceDetection(true));
    
    // Capture
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    
    // Wait for analysis
    await waitFor(() => screen.getByText(/analyzing/i));
    
    // Wait for results
    await waitFor(() => screen.getByText(/bio-feedback analysis/i));
    
    // Save
    fireEvent.click(screen.getByText(/save/i));
    
    // Verify save
    await waitFor(() => screen.getByText(/saved securely/i));
  });
});
```

### 5.3 Performance Tests

```typescript
// tests/performance/image-compression.test.ts
describe('Image Compression', () => {
  test('should compress to <500KB', async () => {
    const compressed = await compressImage(largeImage);
    expect(compressed.size).toBeLessThan(500 * 1024);
  });
  
  test('should complete in <1 second', async () => {
    const start = performance.now();
    await compressImage(testImage);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

### 5.4 Manual Testing Checklist

- [ ] Test on portrait phone (iPhone SE, Android)
- [ ] Test on tablet (iPad)
- [ ] Test in low light conditions
- [ ] Test with poor network connection
- [ ] Test with network offline
- [ ] Test cancellation during analysis
- [ ] Test error handling (camera denied, API failure)
- [ ] Test encryption/decryption performance
- [ ] Test with large dataset (100+ entries)
- [ ] Test accessibility (screen reader, keyboard nav)
- [ ] Test battery usage during capture
- [ ] Test memory usage (no leaks)

---

## Part 6: Implementation Timeline

### Week 1: Critical Fixes
**Days 1-2**: 
- Fix AI model name
- Add timeout handling
- Implement image compression
- Fix responsive layout

**Days 3-4**:
- Add progress feedback
- Implement cancellation
- Fix button states
- Add error messages

**Days 5-7**:
- Testing
- Bug fixes
- Documentation updates

### Week 2: UX Improvements
**Days 8-9**:
- Implement onboarding
- Add face detection
- Lighting analysis

**Days 10-11**:
- Blur detection
- Capture quality validation
- Guidance during capture

**Days 12-14**:
- Error recovery
- Retry mechanism
- Offline mode
- Testing

### Week 3: Performance
**Days 15-16**:
- Streaming responses
- Optimized encryption
- Caching layer

**Days 17-18**:
- Lazy loading
- Code splitting
- Bundle optimization

**Days 19-21**:
- Performance testing
- Profiling
- Optimization

### Week 4: Advanced Features
**Days 22-23**:
- Real-time guidance
- Before/after comparison

**Days 24-25**:
- Trend analysis
- Data export

**Days 26-28**:
- Accessibility improvements
- Final testing
- Deployment

---

## Part 7: Success Metrics

### Performance Metrics
- ✅ Image capture to analysis: <5 seconds (currently 30+ seconds)
- ✅ Save/encryption: <2 seconds (currently blocked UI)
- ✅ Initial load: <2 seconds
- ✅ Image size: <500KB (currently ~6MB)
- ✅ Memory usage: <100MB (currently higher)

### UX Metrics
- ✅ Completion rate: >90% (currently unknown)
- ✅ Time to first use: <3 minutes (currently 5+ minutes)
- ✅ Error rate: <5% (currently higher)
- ✅ User satisfaction: 4/5 stars
- ✅ Support tickets: <10% of users

### Technical Metrics
- ✅ Test coverage: >90%
- ✅ Accessibility score: 95+ (Lighthouse)
- ✅ Performance score: 90+ (Lighthouse)
- ✅ Bundle size: <500KB gzipped
- ✅ API error rate: <1%

---

## Part 8: Risk Mitigation

### Risks

1. **AI API Unreliable**
   - Mitigation: Offline mode, multiple providers, caching
   - Fallback: Basic image analysis

2. **Performance Degradation**
   - Mitigation: Progressive enhancement, lazy loading, compression
   - Fallback: Reduced quality mode

3. **User Confusion**
   - Mitigation: Onboarding, clear instructions, tooltips
   - Fallback: Help documentation, support chat

4. **Privacy Concerns**
   - Mitigation: Local-only processing, encryption, transparency
   - Fallback: Clear privacy policy, opt-out option

5. **Cross-Device Issues**
   - Mitigation: Responsive design, device testing, fallback UI
   - Fallback: Browser compatibility checks

---

## Part 9: Post-Refactor Checklist

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing on multiple devices
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security audit passed

### Documentation
- [ ] Updated component docs
- [ ] Updated API docs
- [ ] User guide updated
- [ ] Onboarding created
- [ ] Help documentation created

### Deployment
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Analytics set up

### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] A/B test features
- [ ] Iterate based on feedback

---

## Part 10: Conclusion

This refactor plan addresses all identified issues in a systematic, phased approach. By prioritizing critical fixes (performance, UI freeze) and then improving UX (instructions, feedback), we can transform the biofeedback feature from a confusing, broken experience into a polished, intuitive tool that users trust and value.

**Key Outcomes**:
1. **30-second freeze → 5-second analysis** (6x improvement)
2. **No instructions → Comprehensive onboarding**
3. **Portrait issues → Fully responsive**
4. **No feedback → Progress indicators at every step**
5. **No recovery → Graceful error handling**
6. **Broken UI → Professional, polished experience**

The refactor maintains backward compatibility while dramatically improving the user experience. All changes are designed to be testable, maintainable, and scalable.

---

**Next Steps**:
1. Review and approve this plan
2. Prioritize phases based on feedback
3. Begin Phase 1 implementation
4. Continuous testing and iteration
5. Deploy incrementally

**Document Owner**: MAEPLE Development Team  
**Review Cycle**: Before each phase start  
**Update Frequency**: As issues are discovered/resolved
