# Maeple Test Implementation Plan

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Test File Structure](#test-file-structure)
3. [Priority 0 (P0) - Critical Test Coverage](#priority-0-p0---critical-test-coverage)
4. [Priority 1 (P1) - High Priority Test Coverage](#priority-1-p1---high-priority-test-coverage)
5. [Priority 2 (P2) - Medium Priority Test Coverage](#priority-2-p2---medium-priority-test-coverage)
6. [Test Dependencies & Mocking Strategy](#test-dependencies--mocking-strategy)
7. [Implementation Order](#implementation-order)
8. [Testing Strategy by Module Type](#testing-strategy-by-module-type)
9. [Appendix: Critical Bugs to Cover](#appendix-critical-bugs-to-cover)

---

## Executive Summary

### Context from Code Review

The Maeple project has significant test coverage gaps in the FACS/Bio-Mirror system and related infrastructure. This plan addresses:

**Critical Gaps (P0):**
- FACS Analysis services with no unit tests
- IndexedDB operations in state management
- Camera lifecycle hooks
- Worker management and image processing
- Component behavior for Bio-Mirror flow

**Bugs Found Requiring Test Coverage:**
- Memory leak in URL.revokeObjectURL (StateCheckCamera.tsx)
- Timer leak in StateCheckAnalyzing
- Race condition in Worker initialization
- Missing error handling for IndexedDB quota exceeded

### Testing Framework
- **Framework**: Vitest (configured in [`vitest.config.ts`](Maeple/vitest.config.ts))
- **DOM Testing**: jsdom environment
- **React Testing**: @testing-library/react
- **Coverage**: v8 provider with text/json/html reporters
- **Mocks**: vi.fn() from vitest

---

## Test File Structure

```
tests/
├── setup.ts                              # Global test setup
├── test-utils.tsx                        # Custom render utilities & mocks
├── facs-core/                           # P0: FACS/Bio-Mirror Core
│   ├── geminiVisionService.test.ts       # AI service analysis
│   ├── stateCheckService.test.ts         # IndexedDB operations
│   ├── comparisonEngine.test.ts          # FACS comparison logic
│   └── serviceAdapters.test.ts           # Circuit breaker integration
├── camera-image/                        # P0: Camera & Image Processing
│   ├── useCameraCapture.test.ts          # Hook lifecycle
│   ├── imageWorkerManager.test.ts        # Worker management
│   └── imageProcessor.worker.test.ts     # Web worker logic
├── components/                          # P0: Bio-Mirror Components
│   ├── StateCheckCamera.test.tsx         # Camera capture component
│   ├── StateCheckAnalyzing.test.tsx      # Analysis progress component
│   └── StateCheckResults.test.tsx        # Results display component
├── infrastructure/                      # P1: Infrastructure Services
│   ├── rateLimiter.test.ts               # API rate limiting
│   ├── encryptionService.test.ts         # Data encryption
│   ├── errorLogger.test.ts               # Error tracking
│   ├── offlineQueue.test.ts              # Offline request queue
│   └── syncService.test.ts               # Data synchronization
└── integration/                         # Cross-module integration
    └── bio-mirror-flow.test.ts           # Full Bio-Mirror flow
```

---

## Priority 0 (P0) - Critical Test Coverage

### 1. [`src/services/geminiVisionService.ts`](Maeple/src/services/geminiVisionService.ts)

**Test File**: `tests/facs-core/geminiVisionService.test.ts`

#### Test Cases

**T-1.1: analyzeStateFromImage - Successful Analysis**
- **Input**: Valid base64 image string, mock Gemini response with FACS data
- **Expected**: Returns [`FacialAnalysis`](Maeple/src/types.ts:175) with actionUnits array
- **Edge Cases**:
  - Empty actionUnits array handling
  - High confidence (>0.9) response
  - Low confidence (<0.5) response

**T-1.2: analyzeStateFromImage - API Key Missing**
- **Input**: Image data when VITE_GEMINI_API_KEY is not set
- **Expected**: Returns null, logs warning to console
- **Edge Cases**: Malformed API key, partial key setup

**T-1.3: analyzeStateFromImage - Rate Limiting**
- **Input**: Multiple concurrent requests
- **Expected**: Requests queued, rateLimitedCall invoked with correct priority
- **Edge Cases**: 
  - Priority levels (1=analysis, 2=image gen)
  - Error recovery after rate limit hit

**T-1.4: analyzeStateFromImage - Circuit Breaker Integration**
- **Input**: Multiple failures followed by recovery
- **Expected**: Circuit breaker state changes from CLOSED to OPEN on failures
- **Edge Cases**: Half-open state handling, success threshold

**T-1.5: FACS Schema Validation**
- **Input**: LLM response with AU codes (AU1, AU4, AU6, AU12, AU24)
- **Expected**: Validated ActionUnit structure with intensity, confidence
- **Edge Cases**:
  - Invalid AU codes
  - Missing intensity values
  - Out-of-range confidence values

**T-1.6: generateOrEditImage - Image Generation**
- **Input**: Prompt string, optional base64Image
- **Expected**: Returns data URL with generated image
- **Edge Cases**:
  - Empty prompt
  - Invalid base64 input
  - Router fallback when router fails

---

### 2. [`src/services/stateCheckService.ts`](Maeple/src/services/stateCheckService.ts)

**Test File**: `tests/facs-core/stateCheckService.test.ts`

#### Test Cases

**T-2.1: saveStateCheck - Successful Save**
- **Input**: Partial [`StateCheck`](Maeple/src/types.ts:216), image blob
- **Expected**: 
  - Data encrypted via [`encryptData`](Maeple/src/services/encryptionService.ts:85)
  - Record stored in IndexedDB with cipher + iv
  - Returns generated ID
- **Edge Cases**: Empty analysis object, null userNote

**T-2.2: saveStateCheck - Coerce Invalid Analysis**
- **Input**: Analysis data missing required fields (confidence, actionUnits)
- **Expected**: [`coerceFacialAnalysis`](Maeple/src/services/stateCheckService.ts:23) returns sanitized defaults
- **Edge Cases**:
  - Null analysis data
  - Non-object analysis
  - Missing confidence property
  - Partial object structure

**T-2.3: saveStateCheck - IndexedDB Quota Exceeded**
- **Input**: Large image blob exceeding storage quota
- **Expected**: Error thrown, logged via [`errorLogger`](Maeple/src/services/errorLogger.ts)
- **Edge Cases**: Recovery attempt, graceful degradation

**T-2.4: getStateCheck - Successful Retrieval**
- **Input**: Valid state check ID
- **Expected**: 
  - Decrypts analysis via [`decryptData`](Maeple/src/services/encryptionService.ts)
  - Returns [`StateCheck`](Maeple/src/types.ts:216) with analysis
- **Edge Cases**: Non-existent ID, malformed cipher data

**T-2.5: getStateCheck - Retry Logic**
- **Input**: ID that fails on first attempt, succeeds on second
- **Expected**: [`withRetry`](Maeple/src/services/stateCheckService.ts:40) retries up to MAX_RETRIES (3)
- **Edge Cases**: All retries exhausted, exponential backoff delay

**T-2.6: getRecentStateChecks - Retrieval with Limit**
- **Input**: Limit parameter (default 7)
- **Expected**: 
  - Returns sorted array by timestamp descending
  - Decrypts each record
  - Skips records failing decryption
- **Edge Cases**: Empty database, invalid limit values

**T-2.7: openDB - Database Initialization**
- **Input**: First call to database
- **Expected**: 
  - Creates maeple_db with version 2
  - Creates state_checks store with keyPath id
  - Creates facial_baseline store
- **Edge Cases**: Database exists, upgrade needed

**T-2.8: saveFacialBaseline / getFacialBaseline**
- **Input**: [`FacialBaseline`](Maeple/src/types.ts:208) data
- **Expected**: Encrypt and store baseline data, retrieve and decrypt
- **Edge Cases**: Multiple baseline records, overwrite behavior

---

### 3. [`src/services/comparisonEngine.ts`](Maeple/src/services/comparisonEngine.ts)

**Test File**: `tests/facs-core/comparisonEngine.test.ts`

#### Test Cases

**T-3.1: compareSubjectiveToObjective - Genuine Smile Detection**
- **Input**: High mood (4-5) in [`journalEntry`](Maeple/src/types.ts:70), AU6 + AU12 in analysis
- **Expected**: smileType === "genuine", masking score low
- **Edge Cases**: AU6 only, AU12 only (social smile)

**T-3.2: compareSubjectiveToObjective - Social Smile Masking**
- **Input**: High mood (4-5), AU12 without AU6
- **Expected**: smileType === "social", isMaskingLikely === true, discrepancyScore > 50
- **Edge Cases**: Various AU12 intensity levels

**T-3.3: compareSubjectiveToObjective - High Tension with Good Mood**
- **Input**: Mood >= 4, AU4 (Brow Lowerer) + AU24 (Lip Pressor) with intensity >= C
- **Expected**: discrepancyScore increased by 60, tension indicators flagged
- **Edge Cases**: Partial tension AUs, baseline-adjusted tension

**T-3.4: compareSubjectiveToObjective - Fatigue Indicators**
- **Input**: AU43 (Eyes Closed) + low overall AU intensity
- **Expected**: fatigue score calculated, fatigueIndicators populated
- **Edge Cases**: High energy mood with fatigue AUs

**T-3.5: compareSubjectiveToObjective - Baseline Adjustment**
- **Input**: [`FacialBaseline`](Maeple/src/types.ts:208), current analysis
- **Expected**: 
  - Tension delta calculated from baseline
  - baselineApplied flag set
  - Adjusted values returned
- **Edge Cases**: Null baseline, partial baseline data

**T-3.6: calculateTensionFromAUs**
- **Input**: ActionUnit array with AU4, AU24, AU14
- **Expected**: Tension score 0-1 based on intensity-weighted formula
- **Edge Cases**: Empty array, single AU, max intensity

**T-3.7: calculateFatigueFromAUs**
- **Input**: ActionUnit array with AU43, AU7
- **Expected**: Fatigue score 0-1 based on eye closure and squinting
- **Edge Cases**: No fatigue AUs, excessive blinking (AU45)

**T-3.8: hasAUWithIntensity**
- **Input**: Array of AUs, code string, minIntensity (default 2)
- **Expected**: Boolean indicating if AU present with sufficient intensity
- **Edge Cases**: Case-insensitive matching, exact threshold

---

### 4. [`src/hooks/useCameraCapture.ts`](Maeple/src/hooks/useCameraCapture.ts)

**Test File**: `tests/camera-image/useCameraCapture.test.ts`

#### Test Cases

**T-4.1: Hook Initialization**
- **Input**: isActive = true
- **Expected**: 
  - Returns videoRef, canvasRef
  - State has isInitializing = true initially
  - No memory leaks from repeated mount/unmount
- **Edge Cases**: isActive false initially, rapid toggle

**T-4.2: Camera Initialization Success**
- **Input**: Valid getUserMedia permissions
- **Expected**: 
  - navigator.mediaDevices.getUserMedia called with constraints
  - videoRef.srcObject set to MediaStream
  - State transitions to isReady = true
- **Edge Cases**: Already mounted check after async

**T-4.3: Camera Error Handling**
- **Input**: Various DOMException errors
- **Expected**: 
  - NotAllowedError -> permission denied message
  - NotFoundError -> no camera message
  - NotReadableError -> camera in use message
- **Edge Cases**: Unknown error types

**T-4.4: Resolution Fallback**
- **Input**: OverconstrainedError or NotReadableError
- **Expected**: Tries lower resolutions (HD -> SD -> Low)
- **Edge Cases**: All resolutions fail

**T-4.5: Capture Image**
- **Input**: Ready camera state
- **Expected**: 
  - Returns data URL PNG
  - Canvas drawn with correct dimensions
  - Mirroring applied for front camera
- **Edge Cases**: Video not ready, zero dimensions

**T-4.6: Cleanup on Unmount**
- **Input**: Component unmounts
- **Expected**: 
  - All MediaStream tracks stopped
  - videoRef.srcObject set to null
  - State reset
- **Bug Coverage**: Prevents memory leaks from active tracks

**T-4.7: Switch Camera Facing Mode**
- **Input**: switchCamera() called
- **Expected**: facingMode toggles user/environment, camera reinitializes
- **Edge Cases**: Camera switch during initialization

**T-4.8: Retry After Error**
- **Input**: Error state, retry() called
- **Expected**: Resets error state, reattempts initialization
- **Edge Cases**: Multiple rapid retries

---

### 5. [`src/services/imageWorkerManager.ts`](Maeple/src/services/imageWorkerManager.ts)

**Test File**: `tests/camera-image/imageWorkerManager.test.ts`

#### Test Cases

**T-5.1: Worker Initialization**
- **Input**: First processImage call
- **Expected**: 
  - Worker dynamically imported via `?worker` suffix
  - Single worker instance created
  - Message handler registered
- **Edge Cases**: Race condition during rapid init calls

**T-5.2: Singleton Pattern**
- **Input**: Multiple concurrent requests
- **Expected**: 
  - Only one worker instance exists
  - Initialization promise reused
- **Bug Coverage**: Race condition in Worker initialization

**T-5.3: Image Processing - Resize**
- **Input**: ImageData, target width/height
- **Expected**: 
  - Correct message sent to worker
  - Buffer transferred (not copied)
  - Returns processed result
- **Edge Cases**: Same dimensions, upscaling

**T-5.4: Image Processing - Compress**
- **Input**: ImageData, quality (0.85), format (webp)
- **Expected**: Returns Blob with correct MIME type
- **Edge Cases**: Quality 0, quality 1, unsupported format

**T-5.5: Image Processing - Edge Detection**
- **Input**: ImageData
- **Expected**: Sobel operator applied, ImageData returned
- **Edge Cases**: Very small images, transparent images

**T-5.6: Request Timeout**
- **Input**: Worker that doesn't respond
- **Expected**: Rejects with timeout after 30s, cleanup performed
- **Edge Cases**: Worker responds just before timeout

**T-5.7: Worker Error Handling**
- **Input**: Worker throws error
- **Expected**: Error propagated to caller, stats updated
- **Edge Cases**: Re-initialization after error

**T-5.8: Statistics Tracking**
- **Input**: Multiple successful and failed requests
- **Expected**: 
  - totalRequests incremented
  - successfulRequests/failedRequests accurate
  - averageProcessingTime calculated
- **Edge Cases**: Stats after cleanup, empty processing times array

**T-5.9: Cleanup**
- **Input**: cleanup() called
- **Expected**: Worker terminated, pending requests rejected
- **Edge Cases**: Cleanup during active processing

**T-5.10: imageToImageData Utility**
- **Input**: HTMLImageElement
- **Expected**: Returns ImageData with correct dimensions
- **Edge Cases**: Image not loaded, cross-origin image

---

### 6. [`src/workers/imageProcessor.ts`](Maeple/src/workers/imageProcessor.ts)

**Test File**: `tests/camera-image/imageProcessor.worker.test.ts`

#### Test Cases

**T-6.1: Resize Operation**
- **Input**: ImageData 1920x1080, target 640x480
- **Expected**: Downscaled ImageData using nearest-neighbor algorithm
- **Edge Cases**: Upscaling, exact dimensions match

**T-6.2: Edge Detection (Sobel)**
- **Input**: Test image with known edges
- **Expected**: Edge-detected ImageData output
- **Edge Cases**: Uniform color, 1x1 pixel, transparent

**T-6.3: Compress Operation**
- **Input**: ImageData, quality 0.85, webp format
- **Expected**: Blob with correct size reduction
- **Edge Cases**: Quality extremes (0, 1), jpeg format

**T-6.4: Message Passing**
- **Input**: Valid ProcessImageRequest
- **Expected**: Correct ProcessImageResponse structure
- **Edge Cases**: Invalid message format, missing fields

---

### 7. [`src/components/StateCheckCamera.tsx`](Maeple/src/components/StateCheckCamera.tsx)

**Test File**: `tests/components/StateCheckCamera.test.tsx`

#### Test Cases

**T-7.1: Component Renders**
- **Input**: onCapture, onCancel callbacks
- **Expected**: 
  - Camera preview displayed
  - Capture button present
  - Cancel button present
- **Edge Cases**: autoStart prop variations

**T-7.2: Capture Flow**
- **Input**: User clicks capture button
- **Expected**: 
  - isCapturing state set
  - cameraCaptureRaw invoked
  - image processed via worker
  - onCapture called with compressed image
- **Edge Cases**: Rapid capture clicks

**T-7.3: Worker Compression Success**
- **Input**: Raw image from camera
- **Expected**: 
  - ImageWorkerManager.resizeImage called
  - ImageWorkerManager.compressImage called
  - Compressed image size displayed
- **Edge Cases**: Processing very large images

**T-7.4: Worker Fallback to Main Thread**
- **Input**: Worker fails/throws error
- **Expected**: Falls back to mainThreadCompress from utils
- **Edge Cases**: Both worker and fallback fail

**T-7.5: Memory Leak Prevention - URL.revokeObjectURL**
- **Input**: Image capture success
- **Expected**: URL.revokeObjectURL called on blob URLs
- **Bug Coverage**: Memory leak in URL creation without cleanup

**T-7.6: Unmount Cleanup**
- **Input**: Component unmounts during capture
- **Expected**: 
  - mountedRef prevents state updates
  - imageWorkerManager.cleanup() called
  - imageDataRef cleared
- **Bug Coverage**: Memory leaks from orphaned references

**T-7.7: Camera Error Display**
- **Input**: useCameraCapture returns error state
- **Expected**: Error message displayed, retry button shown
- **Edge Cases**: Various error message types

**T-7.8: Image Size Display**
- **Input**: After successful compression
- **Expected**: File size in KB displayed to user
- **Edge Cases**: Very small or very large files

**T-7.9: Toggle Camera**
- **Input**: User clicks toggle button
- **Expected**: Camera switches facing mode, haptic feedback if available
- **Edge Cases**: Single-camera device

---

### 8. [`src/components/StateCheckAnalyzing.tsx`](Maeple/src/components/StateCheckAnalyzing.tsx)

**Test File**: `tests/components/StateCheckAnalyzing.test.tsx`

#### Test Cases

**T-8.1: Component Renders with Steps**
- **Input**: imageSrc, onProgress, onComplete callbacks
- **Expected**: 
  - All 5 analysis steps displayed
  - Initial step shows processing
  - Timer countdown displays

**T-8.2: Progression Through Steps**
- **Input**: Time passes, visionService.analyzeFromImage progresses
- **Expected**: 
  - Step 0: encoding (2s)
  - Step 1: landmarks (3s)
  - Step 2: AI analysis (real timing)
  - Step 3: baseline (3s)
  - Step 4: insights (5s)
- **Edge Cases**: Analysis faster/slower than expected

**T-8.3: AI Analysis Integration**
- **Input**: Valid image data
- **Expected**: 
  - visionService.analyzeFromImage called with base64
  - AbortController passed in options
  - Progress callbacks update UI

**T-8.4: Action Unit Display**
- **Input**: Analysis returns actionUnits array
- **Expected**: DetectedAUs displayed in UI
- **Edge Cases**: Empty AU list, many AUs

**T-8.5: Timer Countdown**
- **Input**: Component mounted
- **Expected**: 
  - Timer decrements every second
  - Format shows M:SS
  - Reaches 0 at estimate time
- **Edge Cases**: Timer cleanup on unmount

**T-8.6: Timer Leak Prevention**
- **Input**: Component unmounts during analysis
- **Expected**: 
  - clearInterval called on timerInterval
  - AbortController.abort() called
- **Bug Coverage**: Timer leak in StateCheckAnalyzing

**T-8.7: Completion Handling**
- **Input**: All steps complete
- **Expected**: 
  - onComplete called with analysis result
  - Brief delay (1s) before completion
  - isComplete state set before callback
- **Edge Cases**: Rapid completion, error completion

**T-8.8: Error Handling**
- **Input**: visionService.analyzeFromImage throws error
- **Expected**: 
  - Error caught and logged
  - onComplete still called with partial result
  - Graceful degradation

**T-8.9: Facial Landmarks Overlay**
- **Input**: Step 1+ reached (landmarks detection)
- **Expected**: SVG/X landmarks displayed over image
- **Edge Cases**: Image loading delays

---

### 9. [`src/components/StateCheckResults.tsx`](Maeple/src/components/StateCheckResults.tsx)

**Test File**: `tests/components/StateCheckResults.test.tsx`

#### Test Cases

**T-9.1: Component Renders**
- **Input**: analysis, imageSrc, recentEntry, baseline
- **Expected**: 
  - Image displayed (mirrored)
  - Bio-Feedback Analysis header shown
  - All analysis metrics displayed

**T-9.2: Comparison Display**
- **Input**: Recent journal entry present
- **Expected**: 
  - Reality Check card displayed
  - Subjective (moodLabel) vs Objective (analysis) shown
  - Comparison object from compareSubjectiveToObjective used
- **Edge Cases**: Null recentEntry

**T-9.3: Discrepancy Detection**
- **Input**: discrepancyScore > 50
- **Expected**: Discrepancy Detected badge shown (rose color)
- **Edge Cases**: Edge of threshold (50)

**T-9.4: Jaw Tension Display**
- **Input**: analysis.jawTension value
- **Expected**: 
  - Progress bar shows correct percentage
  - Color orange if > 0.5, else emerald
  - Baseline indicator if baselineApplied
- **Edge Cases**: Missing tension value (default 0)

**T-9.5: Eye Fatigue Display**
- **Input**: analysis.eyeFatigue value
- **Expected**: Similar to jaw tension with rose color if > 0.5
- **Edge Cases**: 0-1 range, missing value

**T-9.6: FACS Signs Display**
- **Input**: analysis.signs array
- **Expected**: Badge for each sign displayed
- **Edge Cases**: Empty array, null signs

**T-9.7: Action Units Display**
- **Input**: analysis.actionUnits array
- **Expected**: AU code badges with intensity indicators
- **Edge Cases**: Empty AU array, invalid AU structure

**T-9.8: Save Functionality**
- **Input**: User clicks Save Analysis button
- **Expected**: 
  - saveStateCheck called with converted blob
  - setIsSaving state toggled
  - savedId set on success
- **Edge Cases**: Save failure, duplicate save clicks

**T-9.9: Emergency Call**
- **Input**: User clicks emergency contact
- **Expected**: 
  - Uses settings.safetyContact if available
  - Falls back to 988 crisis line
  - tel: link triggered
- **Edge Cases**: Invalid phone number format

**T-9.10: Masking Likely Warning**
- **Input**: comparison.isMaskingLikely === true
- **Expected**: Alert/warning displayed about masking detection
- **Edge Cases**: Social smile detected, tension with good mood

---

## Priority 1 (P1) - High Priority Test Coverage

### 10. Infrastructure Services

#### 10.1 [`src/services/rateLimiter.ts`](Maeple/src/services/rateLimiter.ts)
**Test File**: `tests/infrastructure/rateLimiter.test.ts`

**T-10.1.1: Rate Limit Enforcement**
- **Input**: 60 requests within 1 minute window
- **Expected**: Requests 56+ delayed or queued

**T-10.1.2: Daily Quota Tracking**
- **Input**: 1400 requests within 24 hours
- **Expected**: Request 1401+ waits for next day or rejects

**T-10.1.3: Priority Queue**
- **Input**: High and low priority requests mixed
- **Expected**: High priority processed before low

**T-10.1.4: LocalStorage Persistence**
- **Input**: Rate limiter stats saved
- **Expected**: Stats survive page reload

**T-10.1.5: Retry with Exponential Backoff**
- **Input**: Failed request with retry enabled
- **Expected**: Retries after 2s, 4s, 8s delays

#### 10.2 [`src/services/encryptionService.ts`](Maeple/src/services/encryptionService.ts)
**Test File**: `tests/infrastructure/encryptionService.test.ts`

**T-10.2.1: Key Generation**
- **Input**: First call to getKey()
- **Expected**: 256-bit AES-GCM key generated and stored

**T-10.2.2: Encryption/Decryption Roundtrip**
- **Input**: JSON object
- **Expected**: Encrypt returns {cipher, iv}, decrypt restores original

**T-10.2.3: Key Import/Export**
- **Input**: JWK format key
- **Expected**: Can import and use for encryption

**T-10.2.4: Key Reset**
- **Input**: resetEncryptionKey() called
- **Expected**: Old key removed, new key generated

#### 10.3 [`src/services/errorLogger.ts`](Maeple/src/services/errorLogger.ts)
**Test File**: `tests/infrastructure/errorLogger.test.ts`

**T-10.3.1: Error Logging**
- **Input**: Error message with details
- **Expected**: Log added to internal array with timestamp

**T-10.3.2: Global Error Handlers**
- **Input**: Unhandled promise rejection or uncaught error
- **Expected**: Automatically logged via event listeners

**T-10.3.3: Log Buffer Limit**
- **Input**: More than 100 logs
- **Expected**: Oldest logs evicted (FIFO)

**T-10.3.4: Level-based Logging**
- **Input**: error, warning, info level calls
- **Expected**: Correct level stored in log entry

#### 10.4 [`src/services/offlineQueue.ts`](Maeple/src/services/offlineQueue.ts)
**Test File**: `tests/infrastructure/offlineQueue.test.ts`

**T-10.4.1: Offline Detection**
- **Input**: navigator.onLine = false
- **Expected**: Requests queued instead of executed

**T-10.4.2: Queue on Reconnect**
- **Input**: Back online after offline period
- **Expected**: Queued requests automatically processed

**T-10.4.3: IndexedDB Persistence**
- **Input**: Requests queued, page reloaded
- **Expected**: Queue survives page reload

**T-10.4.4: Max Retries**
- **Input**: Request fails maxRetries times
- **Expected**: Request permanently failed, removed from queue

**T-10.4.5: Handler Registration**
- **Input**: Register handler for request type
- **Expected**: Handler invoked when request processed

#### 10.5 [`src/services/syncService.ts`](Maeple/src/services/syncService.ts)
**Test File**: `tests/infrastructure/syncService.test.ts`

**T-10.5.1: Sync State Management**
- **Input**: Sync started, completed, error
- **Expected**: Status transitions through idle -> syncing -> synced/error

**T-10.5.2: Pending Changes Queue**
- **Input**: Multiple pending changes
- **Expected**: Changes persisted to localStorage

**T-10.5.3: Conflict Resolution**
- **Input**: Local and remote versions differ
- **Expected**: Last-write-wins or merge strategy applied

**T-10.5.4: Sync Listeners**
- **Input**: onSyncStateChange registered
- **Expected**: Callback invoked on every state change

---

## Priority 2 (P2) - Medium Priority Test Coverage

### 11. Additional Test Coverage

#### 11.1 Integration Tests

**T-11.1.1: Full Bio-Mirror Flow**
- **Input**: User completes StateCheckWizard end-to-end
- **Expected**: 
  - Photo captured
  - Analysis performed
  - Saved to database
  - Comparison displayed
- **File**: `tests/integration/bio-mirror-flow.test.ts`

#### 11.2 [`src/adapters/serviceAdapters.ts`](Maeple/src/adapters/serviceAdapters.ts)

**T-11.2.1: VisionServiceAdapter Circuit Breaker**
- **Input**: 5 consecutive failures
- **Expected**: Circuit opens, subsequent calls fail fast

**T-11.2.2: AIServiceAdapter Circuit Breaker**
- **Input**: Mixed success/failure pattern
- **Expected**: State transitions correctly tracked

**T-11.2.3: State Change Subscription**
- **Input**: onStateChange callback registered
- **Expected**: Callback invoked on every circuit state change

---

## Test Dependencies & Mocking Strategy

### Global Mocks (setup.ts)

```typescript
// Already configured in tests/setup.ts:
- localStorage mock
- indexedDB mock  
- window.navigator.onLine
```

### Service Mocks (test-utils.tsx)

Existing mocks to extend:
- [`createMockVisionService`](Maeple/tests/test-utils.tsx:22) - Add analyzeFromImage FACS response
- Add createMockImageWorkerManager()
- Add createMockMediaDevices()

### Specific Mock Requirements

#### MediaDevices Mock
```typescript
const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: vi.fn() }],
  }),
};
Object.defineProperty(global.navigator, 'mediaDevices', { value: mockMediaDevices });
```

#### Web Worker Mock
```typescript
// Mock worker module imports
vi.mock('../workers/imageProcessor?worker', () => ({
  default: class MockWorker {
    onmessage: ((event: any) => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    postMessage = vi.fn((data, transfer) => {
      // Simulate response
      setTimeout(() => this.onmessage?.({ data: { id: data.id, result: {} } }), 10);
    });
    terminate = vi.fn();
  },
}));
```

#### IndexedDB Mock Enhancements
```typescript
// More complete IDB mock with transaction support
const createMockIDBDatabase = () => ({
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      put: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
      }),
      get: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
      }),
      getAll: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
      }),
    }),
  }),
});
```

#### Crypto.subtle Mock
```typescript
// Mock for encryption service testing
global.crypto.subtle = {
  generateKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  exportKey: vi.fn(),
  importKey: vi.fn(),
} as any;
global.crypto.getRandomValues = vi.fn((arr) => arr);
```

---

## Implementation Order

### Phase 1: P0 Foundation (Start Here)
1. **Test Setup Enhancement**
   - Add worker mock to setup.ts
   - Enhance IndexedDB mock with transaction support
   - Create createMockMediaDevices helper

2. **Service Core (Week 1)**
   - `tests/facs-core/comparisonEngine.test.ts` (pure functions, easiest start)
   - `tests/facs-core/stateCheckService.test.ts` (needs IDB mock)
   - `tests/facs-core/geminiVisionService.test.ts` (needs fetch/AI mock)

3. **Camera & Hook (Week 2)**
   - `tests/camera-image/useCameraCapture.test.ts`
   - `tests/components/StateCheckCamera.test.tsx`

4. **Worker & Processing (Week 3)**
   - `tests/camera-image/imageWorkerManager.test.ts`
   - `tests/camera-image/imageProcessor.worker.test.ts`

5. **Components (Week 4)**
   - `tests/components/StateCheckAnalyzing.test.tsx`
   - `tests/components/StateCheckResults.test.tsx`

### Phase 2: P1 Infrastructure
6. `tests/infrastructure/rateLimiter.test.ts`
7. `tests/infrastructure/encryptionService.test.ts`
8. `tests/infrastructure/errorLogger.test.ts`
9. `tests/infrastructure/offlineQueue.test.ts`
10. `tests/infrastructure/syncService.test.ts`

### Phase 3: P2 & Integration
11. `tests/facs-core/serviceAdapters.test.ts`
12. `tests/integration/bio-mirror-flow.test.ts`

---

## Testing Strategy by Module Type

### Unit Tests (Pure Functions)
**Examples**: comparisonEngine.ts
- **Approach**: Direct function calls with varied inputs
- **Coverage Goal**: 100% branch coverage
- **Tools**: Vitest assertions

### Integration Tests (Services with Dependencies)
**Examples**: stateCheckService.ts, geminiVisionService.ts
- **Approach**: Mock external dependencies, test interaction patterns
- **Coverage Goal**: 80%+ line coverage
- **Mock Strategy**: vi.mock, vi.fn()

### Hook Tests (useCameraCapture)
- **Approach**: @testing-library/react renderHook
- **Coverage Goal**: Lifecycle methods, effect cleanup
- **Tools**: waitFor, act

### Component Tests (React Components)
**Examples**: StateCheckCamera, StateCheckAnalyzing, StateCheckResults
- **Approach**: @testing-library/react render with providers
- **Coverage Goal**: User interactions, state changes
- **Tools**: screen, fireEvent, waitFor

### Worker Tests (Web Workers)
**Examples**: imageProcessor.ts
- **Approach**: Mock Worker constructor, simulate postMessage
- **Coverage Goal**: Message handling, error propagation
- **Tools**: vi.mock for worker module

### E2E Flow Tests
**Examples**: bio-mirror-flow.test.ts
- **Approach**: Test complete user journey
- **Coverage Goal**: Critical path only
- **Tools**: Full component tree rendering

---

## Appendix: Critical Bugs to Cover

### Bug 1: Memory Leak in URL.revokeObjectURL (StateCheckCamera.tsx)
**Location**: Line 126-127
**Current Code**:
```typescript
URL.revokeObjectURL(URL.createObjectURL(compressResult.blob));
```
**Issue**: Creates URL just to revoke it immediately - should revoke the original URL
**Test Case**: T-7.5 verifies proper cleanup

### Bug 2: Timer Leak in StateCheckAnalyzing
**Location**: Lines 192-207
**Current Code**:
```typescript
const timerInterval = setInterval(() => { ... }, 1000);
return () => {
  clearInterval(timerInterval);
};
```
**Issue**: Timer cleared in useEffect cleanup but also needs clearing on early completion
**Test Case**: T-8.6 verifies timer cleanup on unmount

### Bug 3: Race Condition in Worker Initialization
**Location**: imageWorkerManager.ts line 86-127
**Current Code**:
```typescript
if (this.worker) return;
if (this.isInitializing && this.initializationPromise) {
  return this.initializationPromise;
}
```
**Issue**: Fast sequential calls can create multiple workers
**Test Case**: T-5.2 verifies singleton pattern

### Bug 4: Missing Error Handling for IndexedDB Quota Exceeded
**Location**: stateCheckService.ts saveStateCheck
**Current Code**: No try-catch around store.put
**Issue**: Storage quota exceeded throws unhandled error
**Test Case**: T-2.3 tests quota exceeded scenario

---

## Test Validation Checklist

Before marking this plan complete, verify:

- [ ] All P0 modules have comprehensive test cases defined
- [ ] All P1 modules have primary test paths defined  
- [ ] Each test case includes: Input, Expected, Edge Cases
- [ ] All 4 critical bugs have specific test coverage
- [ ] Test file structure follows project conventions
- [ ] Mock strategy is documented for each dependency type
- [ ] Implementation order prioritizes critical paths

---

## Running Tests

```bash
# Run all tests
npm run test:run

# Run specific test file
npx vitest run tests/facs-core/comparisonEngine.test.ts

# Watch mode for development
npm run test

# Coverage report
npm run test:coverage

# Debug specific test
npx vitest run --reporter=verbose tests/facs-core/
```

---

*Document Version: 1.0*
*Created: 2026-02-01*
*Framework: Vitest + @testing-library/react + jsdom*
