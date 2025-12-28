# Comprehensive Application Stabilization Plan

**Project:** MAEPLE  
**Version:** 0.97.0  
**Date:** 2025-12-27  
**Status:** Ready for Implementation

---

## Executive Summary

This document outlines a complete stabilization plan for MAEPLE, addressing all identified issues across camera, audio, data processing, and general application stability. The plan is organized by priority with clear deliverables and validation criteria.

---

## Application Architecture Overview

### Current Stack
- **Frontend:** React 18.2, TypeScript 5.2, Vite 7.2
- **State Management:** Zustand 5.0 with persistence
- **Routing:** React Router v7
- **Styling:** Tailwind CSS 3.4
- **Storage:** localStorage + IndexedDB (via idb)
- **AI Integration:** Multiple providers (Gemini, OpenAI, Anthropic, etc.)
- **Mobile:** Capacitor 8.0 for iOS/Android
- **Sync:** Offline-first with cloud backup

### Data Flow Architecture
```
User Input → Component → Service Layer → Storage
                      ↓                   ↓
                   AI Processing ← → Sync Service → Cloud API
                      ↓
                   Error Logger
```

### Critical Integration Points
1. **Camera/Audio Flow:** StateCheckCamera/RecordVoiceButton → Analysis Services → Results Display
2. **Journal Flow:** JournalEntry → parseJournalEntry → HealthEntry → storageService
3. **Sync Flow:** storageService → syncService → apiClient (with offline queue)

---

## Issues Summary

| Priority | Count | Categories |
|----------|--------|------------|
| Critical | 4 | Resource leaks, race conditions |
| High | 6 | Error handling, UI blocking, timeouts |
| Medium | 5 | Silent failures, compatibility |
| Low | 4 | UX improvements, logging |
| **Total** | **19** | **Stability, Performance, Reliability** |

---

## PHASE 1: Critical Stability Fixes (Immediate)

### 1.1 Fix AudioContext Resource Leak
**File:** `src/services/audioAnalysisService.ts`

**Problem:** AudioContext instances are never closed, causing memory leaks and eventual "maximum contexts reached" errors.

**Solution:**
```typescript
// Wrap entire analyzeNoise function in try-finally
const analyzeNoise = async (audioBlob: Blob): Promise<NoiseAnalysis> => {
  let audioContext: AudioContext | null = null;
  
  try {
    audioContext = new AudioContext({ sampleRate: 48000 });
    const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
    // ... existing analysis code ...
    return { level, sources, dbLevel };
  } finally {
    if (audioContext) {
      await audioContext.close();
    }
  }
};
```

**Impact:** Prevents memory leaks, ensures audio analysis can run indefinitely.

---

### 1.2 Fix Race Condition in RecordVoiceButton
**File:** `src/components/RecordVoiceButton.tsx`

**Problem:** Async operations in `mediaRecorder.onstop` can run after component unmounts, causing React warnings and memory leaks.

**Solution:**
```typescript
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({...}) => {
  // Add ref to track mounted state
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    setIsAnalyzing(true);
    try {
      const { analyzeAudio } = await import('../services/audioAnalysisService');
      const analysis = await analyzeAudio(audioBlob, transcript);
      
      // Check mounted state before updates
      if (!isMountedRef.current) return;
      
      if (onAnalysisReady) {
        onAnalysisReady(analysis);
      }
      onTranscriptCallback(transcript, audioBlob, analysis);
    } catch (e) {
      console.error("Audio analysis failed", e);
      if (!isMountedRef.current) return;
      onTranscriptCallback('', audioBlob);
    } finally {
      if (isMountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  };
};
```

**Impact:** Eliminates React warnings, prevents memory leaks from unmounted components.

---

### 1.3 Fix Stale Closure in RecordVoiceButton
**File:** `src/components/RecordVoiceButton.tsx`

**Problem:** `recognition.onresult` captures stale `onTranscriptCallback`, and dependencies cause re-setup on every render.

**Solution:**
```typescript
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({
  onTranscript,
  onAnalysisReady,
  isDisabled = false,
}) => {
  // Use ref to store latest callback without triggering effect re-runs
  const onTranscriptRef = useRef(onTranscript);
  const onAnalysisReadyRef = useRef(onAnalysisReady);
  
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onAnalysisReadyRef.current = onAnalysisReady;
  }, [onTranscript, onAnalysisReady]);

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setError("Not Supported");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript); // Use ref to get latest callback
      }
    };

    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, []); // Empty dependency array - setup once
};
```

**Impact:** Eliminates stuttering, prevents recognition object recreation on every render.

---

### 1.4 Fix Memory Leak in StateCheckWizard
**File:** `src/components/StateCheckWizard.tsx`

**Problem:** Image data URLs are stored but never revoked, causing memory accumulation.

**Solution:**
```typescript
const StateCheckWizard: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  // ... other state ...

  // Cleanup object URL when imageSrc changes or component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const handleCapture = async (src: string) => {
    // Revoke previous image if it exists
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
    
    setImageSrc(src);
    // ... rest of capture logic ...
  };

  const reset = () => {
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
    setStep('INTRO');
    setImageSrc(null);
    setAnalysis(null);
    setProgress(0);
    setCurrentStage('');
  };
};
```

**Impact:** Prevents memory leaks from accumulated image data, allows extended use without crashes.

---

### Phase 1 Validation
- [ ] No React warnings about unmounted components
- [ ] Memory usage stable after 10+ camera/photo captures
- [ ] Audio can be analyzed repeatedly without errors
- [ ] No "maximum AudioContext contexts reached" errors

---

## PHASE 2: High Priority Stability (This Sprint)

### 2.1 Improve Camera Error Handling
**File:** `src/components/StateCheckCamera.tsx`

**Problem:** Camera errors are simplistic with no retry or fallback mechanisms.

**Solution:**
```typescript
const StateCheckCamera: React.FC<Props> = ({...}) => {
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const startCamera = async (fallbackResolution = false) => {
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: fallbackResolution 
            ? { ideal: 640 }  // Lower resolution fallback
            : { ideal: 1280 },
          height: fallbackResolution 
            ? { ideal: 480 }
            : { ideal: 720 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setRetryCount(0); // Reset retry count on success
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError("Camera permission denied. Please enable camera access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
          setError("No camera found. Please ensure your device has a working camera.");
        } else if (err.name === 'NotReadableError') {
          // Try fallback to lower resolution
          if (retryCount < MAX_RETRIES && !fallbackResolution) {
            setRetryCount(prev => prev + 1);
            await startCamera(true);
            return;
          }
          setError("Camera is already in use or not accessible. Try closing other applications.");
        } else if (err.name === 'OverconstrainedError') {
          // Try fallback to lower resolution
          if (!fallbackResolution) {
            setRetryCount(prev => prev + 1);
            await startCamera(true);
            return;
          }
          setError("Camera does not support requested resolution.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Unable to access camera. Please try again.");
      }
    }
  };

  // Add retry button to UI
  // ...
};
```

**Impact:** Better device compatibility, automatic fallback to lower resolutions, clear user feedback.

---

### 2.2 Add Loading States for Audio Processing
**File:** `src/services/audioAnalysisService.ts`

**Problem:** Audio decoding blocks UI, causing perceived freezes.

**Solution:**
```typescript
// In RecordVoiceButton, enhance the analyzing state
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({...}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Simulate progress updates (since decodeAudioData doesn't support progress)
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 80));
      }, 100);

      const { analyzeAudio } = await import('../services/audioAnalysisService');
      const analysis = await analyzeAudio(audioBlob, transcript);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // ... rest of handling ...
    } catch (e) {
      console.error("Audio analysis failed", e);
      setAnalysisProgress(0);
      // ... error handling ...
    } finally {
      setTimeout(() => setIsAnalyzing(false), 500); // Brief delay to show 100%
    }
  };

  // Update analyzing indicator in JSX to show progress
  {isAnalyzing && (
    <div className="absolute -top-8 flex items-center gap-2 bg-slate-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap animate-pulse">
      <Loader2 size={12} className="animate-spin" />
      Analyzing {analysisProgress}%
    </div>
  )}
};
```

**Impact:** Better UX during processing, prevents user confusion about whether app is working.

---

### 2.3 Implement Proper Cleanup in RecordVoiceButton
**File:** `src/components/RecordVoiceButton.tsx`

**Problem:** Resources not properly cleaned up, event listeners accumulate.

**Solution:**
```typescript
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({...}) => {
  // ... other refs ...
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Setup speech recognition
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setError("Not Supported");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error("Speech recognition error", event.error);
        setError("Mic Error");
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscriptRef.current(finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    // Return cleanup function
    return () => {
      // Stop recognition
      try {
        recognition.abort();
      } catch (e) {
        // Ignore
      }
      
      // Remove all event listeners
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      
      // Stop media recorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      
      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.onended = null; // Remove event listener
        });
      }
      
      recognitionRef.current = null;
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    };
  }, []);

  const stopRecording = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop media stream tracks with cleanup
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.onended = null;
      });
    }
  };
};
```

**Impact:** Prevents memory leaks, ensures clean resource deallocation.

---

### 2.4 Add Recording Timeout
**File:** `src/components/RecordVoiceButton.tsx`

**Problem:** No maximum recording duration, allowing indefinite recording.

**Solution:**
```typescript
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({...}) => {
  const [isListening, setIsListening] = useState(false);
  const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("No Mic Access");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition start failed", e);
        }
      }

      // Start MediaRecorder
      const MediaRecorderClass = window.MediaRecorder;
      if (MediaRecorderClass) {
        const mediaRecorder = new MediaRecorderClass(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          // ... rest of onstop handler ...
        };

        mediaRecorder.start();
      }

      // Set auto-stop timeout
      timeoutRef.current = setTimeout(() => {
        console.warn("Recording timeout reached");
        stopRecording();
      }, MAX_RECORDING_DURATION * 1000);
    } catch (e) {
      console.error("Microphone access error", e);
      setError("Mic Access Denied");
    }
  };

  const stopRecording = () => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // ... rest of stop logic ...
  };

  const cleanupRecording = () => {
    stopRecording();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    mediaStreamRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
};
```

**Impact:** Prevents accidental long recordings, memory exhaustion, and analysis failures.

---

### 2.5 Fix Gemini Vision Timeout Handling
**File:** `src/services/geminiVisionService.ts`

**Problem:** Timeout implementation doesn't properly clear timer on success.

**Solution:**
```typescript
export const analyzeStateFromImage = async (
  base64Image: string,
  options: { timeout?: number, onProgress?: (stage: string, progress: number) => void, signal?: AbortSignal } = {}
): Promise<FacialAnalysis> => {
  const { timeout = 30000, onProgress, signal } = options;
  
  try {
    // ... setup code ...

    // Create timeout with proper cleanup
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('AI analysis timeout after 30 seconds'));
      }, timeout);
      
      signal?.addEventListener('abort', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        reject(new DOMException('Analysis cancelled', 'AbortError'));
      });
    });

    onProgress?.('Sending image to AI', 20);
    
    const response = await Promise.race([
      rateLimitedCall(async () => {
        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: {
            parts: [
              { inlineData: { mimeType: "image/png", data: base64Image } },
              { text: promptText }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: facialAnalysisSchema,
            systemInstruction: "..."
          }
        });
        return result;
      }, { priority: 4 }),
      timeoutPromise
    ]);

    // Clear timeout on success
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    onProgress?.('Analyzing facial features', 50);
    
    const textResponse = response.text;
    if (!textResponse) throw new Error("No response from AI");
    
    onProgress?.('Parsing results', 90);
    
    return JSON.parse(textResponse) as FacialAnalysis;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    
    onProgress?.('Using offline analysis', 100);
    return getOfflineAnalysis(base64Image);
  }
};
```

**Impact:** Proper timeout handling, no hanging requests.

---

### 2.6 Add Image Compression Validation
**File:** `src/utils/imageCompression.ts`

**Problem:** No validation of compression results.

**Solution:**
```typescript
export const compressImage = async (
  source: HTMLCanvasElement | HTMLImageElement | string,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.85,
    format = 'image/webp'
  } = options;

  // Load source if it's a data URL
  let img: HTMLImageElement;
  if (typeof source === 'string') {
    img = await loadImage(source);
  } else if (source instanceof HTMLCanvasElement) {
    return source.toDataURL(format, quality);
  } else {
    img = source;
  }

  // Validate image loaded
  if (img.width === 0 || img.height === 0) {
    throw new Error('Invalid image: dimensions are zero');
  }

  // Calculate new dimensions while maintaining aspect ratio
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context for image compression');
  }

  // Use better quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Compress and return as data URL
  const compressed = canvas.toDataURL(format, quality);
  
  // Validate result
  if (!compressed || !compressed.startsWith('data:')) {
    throw new Error('Image compression failed: invalid data URL produced');
  }
  
  // Check if compression reduced size (optional validation)
  const originalSize = img instanceof HTMLCanvasElement 
    ? 0 
    : estimateFileSize(typeof source === 'string' ? source : '');
  const compressedSize = estimateFileSize(compressed);
  
  if (originalSize > 0 && compressedSize > originalSize) {
    console.warn(`Compression increased size: ${originalSize} -> ${compressedSize} bytes`);
  }
  
  return compressed;
};
```

**Impact:** Early error detection, better debugging, prevents silent failures.

---

### Phase 2 Validation
- [ ] Camera works on multiple devices with different capabilities
- [ ] Audio processing shows progress indication
- [ ] No memory leaks after repeated audio recordings
- [ ] Recording stops automatically after 5 minutes
- [ ] AI vision analysis properly times out after 30 seconds
- [ ] Image compression failures are caught and reported

---

## PHASE 3: Medium Priority Improvements (Next Sprint)

### 3.1 Improve AI Router Error Reporting
**File:** `src/services/ai/router.ts`

**Problem:** Silent failures with only console logging.

**Solution:**
```typescript
import { errorLogger } from '../errorLogger';

// In routeWithFallback method:
private async routeWithFallback<T>(capability: AICapability, fn: (adapter: BaseAIAdapter) => Promise<T>): Promise<T | null> {
  const adapters = this.getAdaptersForCapability(capability);
  if (adapters.length === 0) {
    errorLogger.warn(`No adapters available for capability: ${capability}`, {
      capability,
      availableProviders: this.settings?.providers.map(p => ({
        id: p.providerId,
        enabled: p.enabled,
        hasKey: !!p.apiKey
      }))
    });
    return null;
  }

  let lastError: unknown = null;
  for (const adapter of adapters) {
    try {
      return await fn(adapter);
    } catch (error) {
      lastError = error;
      const errorDetails = {
        adapter: adapter.constructor.name,
        capability,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error)
      };
      console.warn(`Adapter ${adapter.constructor.name} failed for ${capability}:`, error);
      errorLogger.warn(`AI adapter failure`, errorDetails);
      continue;
    }
  }

  if (lastError) {
    const finalErrorDetails = {
      capability,
      allAdaptersFailed: true,
      error: lastError instanceof Error ? {
        name: lastError.name,
        message: lastError.message
      } : String(lastError)
    };
    errorLogger.error(`All AI providers failed for capability ${capability}`, finalErrorDetails);
  }
  
  return null;
}
```

**Impact:** Better error visibility, easier debugging, user can be informed of failures.

---

### 3.2 Add Retry Logic to Database Operations
**File:** `src/services/stateCheckService.ts`

**Problem:** IndexedDB operations fail silently on transient errors.

**Solution:**
```typescript
import { errorLogger } from '../errorLogger';

const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // ms

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log retry attempt
      errorLogger.warn(`${operationName} failed, attempt ${attempt}/${MAX_RETRIES}`, {
        error: lastError.message,
        willRetry: attempt < MAX_RETRIES
      });
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  // All retries exhausted
  errorLogger.error(`${operationName} failed after ${MAX_RETRIES} attempts`, {
    error: lastError?.message
  });
  throw lastError;
}

export const saveStateCheck = async (
  data: Partial<StateCheck>,
  imageBlob?: Blob
): Promise<string> => {
  return withRetry(async () => {
    const db = await openDB();
    const id = data.id || `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { cipher, iv } = await encryptData(data.analysis);
    
    const record = {
      ...data,
      id,
      analysisCipher: cipher,
      iv: iv,
      imageBlob: imageBlob || null,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    delete (record as any).analysis;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }, 'saveStateCheck');
};

// Apply similar pattern to other DB operations...
```

**Impact:** More resilient to transient failures, better error tracking.

---

### 3.3 Add Camera Resolution Fallback
**File:** `src/components/StateCheckCamera.tsx`

**Problem:** Hardcoded resolution without fallback (partially addressed in Phase 2.1).

**Enhanced Solution:**
```typescript
const RESOLUTION_OPTIONS = [
  { ideal: 1280, label: 'HD' },
  { ideal: 720, label: 'SD' },
  { ideal: 480, label: 'Low' },
];

const startCamera = async (resolutionIndex = 0) => {
  try {
    const resolution = RESOLUTION_OPTIONS[Math.min(resolutionIndex, RESOLUTION_OPTIONS.length - 1)];
    
    const constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: resolution.ideal },
        height: { ideal: Math.round(resolution.ideal * 9/16) }
      },
      audio: false
    };
    
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    setStream(mediaStream);
    setError(null);
    
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === 'OverconstrainedError' || err.name === 'NotReadableError') {
        // Try next lower resolution
        if (resolutionIndex < RESOLUTION_OPTIONS.length - 1) {
          console.warn(`Camera resolution ${RESOLUTION_OPTIONS[resolutionIndex].label} failed, trying ${RESOLUTION_OPTIONS[resolutionIndex + 1].label}`);
          await startCamera(resolutionIndex + 1);
          return;
        }
      }
      // ... other error handling ...
    }
  }
};
```

**Impact:** Better compatibility with low-end devices and older cameras.

---

### 3.4 Clean Up Audio Blob URLs
**File:** `src/components/RecordVoiceButton.tsx`

**Problem:** If audio blob URLs are created (not currently used but may be added), they leak memory.

**Solution:**
```typescript
const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({...}) => {
  const audioBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Revoke blob URL on cleanup
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, []);

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // If you need to create a URL for playback:
    // audioBlobUrlRef.current = URL.createObjectURL(audioBlob);
    // Remember to revoke it when done playing
    
    // ... rest of handler ...
  };
};
```

**Impact:** Prevents memory leaks from audio blob URLs.

---

### 3.5 Optimize Image Capture Flow
**File:** `src/components/StateCheckCamera.tsx`

**Problem:** Image drawn to canvas twice unnecessarily.

**Solution:**
```typescript
const capture = async () => {
  if (videoRef.current && canvasRef.current) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    setIsCapturing(true);
    
    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally for "mirror" effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image directly from canvas (no need for intermediate step)
        const originalImage = canvas.toDataURL('image/png');
        const originalSize = estimateFileSize(originalImage);
        
        console.log(`Original image size: ${(originalSize / 1024).toFixed(2)} KB`);
        
        // Compress directly from canvas URL
        const compressedImage = await compressImage(canvas, {  // Pass canvas directly
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.85,
          format: 'image/webp'
        });
        
        const compressedSize = estimateFileSize(compressedImage);
        const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(0);
        
        console.log(`Compressed image size: ${(compressedSize / 1024).toFixed(2)} KB (${reduction}% reduction)`);
        setImageSize(`${(compressedSize / 1024).toFixed(1)} KB`);
        
        onCapture(compressedImage);
        stopCamera();
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }
};
```

Also update `imageCompression.ts` to handle canvas directly without reconversion:
```typescript
export const compressImage = async (
  source: HTMLCanvasElement | HTMLImageElement | string,
  options: CompressionOptions = {}
): Promise<string> => {
  const { maxWidth = 512, maxHeight = 512, quality = 0.85, format = 'image/webp' } = options;

  // If it's already a canvas with appropriate size, compress directly
  if (source instanceof HTMLCanvasElement) {
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // Check if resizing is needed
    const needsResize = source.width > maxWidth || source.height > maxHeight;
    
    if (!needsResize) {
      // Canvas is already small enough, just change format/quality
      return source.toDataURL(format, quality);
    }
    
    // Need to resize - create new canvas
    const { width, height } = calculateDimensions(
      source.width,
      source.height,
      maxWidth,
      maxHeight
    );
    
    const newCanvas = document.createElement('canvas');
    newCanvas.width = width;
    newCanvas.height = height;
    const newCtx = newCanvas.getContext('2d')!;
    newCtx.imageSmoothingEnabled = true;
    newCtx.imageSmoothingQuality = 'high';
    newCtx.drawImage(source, 0, 0, width, height);
    
    return newCanvas.toDataURL(format, quality);
  }
  
  // ... rest of existing code for string and HTMLImageElement ...
};
```

**Impact:** Faster capture, less memory usage, better performance.

---

### Phase 3 Validation
- [ ] AI failures are properly logged and visible
- [ ] Database operations retry on transient failures
- [ ] Camera works on low-end devices with automatic resolution adjustment
- [ ] No audio blob URL memory leaks
- [ ] Image capture is faster with optimized flow

---

## PHASE 4: Low Priority Improvements (Backlog)

### 4.1 Add Consistent Loading States
Create a shared `LoadingSpinner` component and ensure all async operations show loading indicators.

### 4.2 Standardize Error Messages
Create a `errorMessages` constant mapping error types to user-friendly messages.

### 4.3 Implement Analytics/Logging
Enhance `errorLogger` to track metrics and add a debug panel in Settings.

### 4.4 Add Input Validation
Add validation functions for all service inputs with clear error messages.

---

## Testing Strategy

### Unit Testing
- [ ] Test audioAnalysisService with mock AudioContext
- [ ] Test imageCompression edge cases
- [ ] Test error handling in all services

### Integration Testing
- [ ] Test full camera → analysis → results flow
- [ ] Test full recording → analysis → observations flow
- [ ] Test offline sync scenarios

### Manual Testing
- [ ] Memory profiling during extended use
- [ ] Camera functionality on multiple devices
- [ ] Audio recording and analysis stress testing
- [ ] Permission changes during operation

---

## Success Metrics

### Stability
- Zero React warnings about unmounted components
- No memory leaks after 30 minutes of continuous use
- < 1% crash rate on camera/audio operations

### Performance
- Image capture < 500ms
- Audio analysis < 2s for typical recordings
- Page load time < 2s

### Reliability
- Camera initialization success rate > 95%
- Audio recording success rate > 98%
- AI analysis success rate > 90% (with offline fallback)

---

## Implementation Timeline

| Phase | Duration | Dependencies | Start Date |
|--------|-----------|--------------|------------|
| Phase 1 | 2-3 days | None | Immediate |
| Phase 2 | 3-4 days | Phase 1 complete | Day 3 |
| Phase 3 | 2-3 days | Phase 2 complete | Day 7 |
| Phase 4 | Ongoing | None | Day 10+ |

**Total Critical/High Priority:** 5-7 days

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|---------|------------|
| Breaking changes to camera API | Low | High | Thorough testing on multiple devices |
| Increased bundle size | Medium | Low | Code splitting for optional features |
| Performance regression | Low | Medium | Benchmark before/after each change |

---

## Rollback Plan

If critical issues arise:
1. Revert to git commit before Phase 1
2. Document what failed
3. Update plan with alternative approaches
4. Re-test thoroughly

---

## Post-Implementation Verification

After completing all phases:
1. Run full test suite
2. Perform manual testing on multiple devices
3. Monitor error logs in production for 1 week
4. Gather user feedback
5. Create follow-up plan for any remaining issues

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-27  
**Next Review:** After Phase 1 completion