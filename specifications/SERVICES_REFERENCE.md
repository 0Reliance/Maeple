# MAEPLE Services & Infrastructure Reference

**Version**: 0.97.9  
**Last Updated**: February 9, 2026  
**Total Services**: 22 core + 7 AI adapters + 6 wearable adapters + 12 utility modules

This document provides detailed definitions for every service, store, context, hook, pattern, worker, and utility module in the MAEPLE codebase.

---

## Table of Contents

1. [AI Services Layer](#1-ai-services-layer)
2. [Core Application Services](#2-core-application-services)
3. [Data Services](#3-data-services)
4. [FACS & Vision Services](#4-facs--vision-services)
5. [Infrastructure Services](#5-infrastructure-services)
6. [Wearable Integrations](#6-wearable-integrations)
7. [Validation Layer](#7-validation-layer)
8. [State Management (Zustand Stores)](#8-state-management-zustand-stores)
9. [React Contexts](#9-react-contexts)
10. [Custom Hooks](#10-custom-hooks)
11. [Design Patterns](#11-design-patterns)
12. [Web Workers](#12-web-workers)
13. [Utility Modules](#13-utility-modules)
14. [Service Adapters (DI)](#14-service-adapters-di)

---

## 1. AI Services Layer

### `services/ai/router.ts` — AIRouter (357 lines)

**Purpose**: Central orchestrator that routes AI requests to the best available provider based on task capability, user settings, and provider health.

**Capabilities Routed**:
| Capability | Primary Provider | Fallback Chain |
|-----------|-----------------|----------------|
| Text Generation | Gemini | OpenAI → Anthropic → Z.ai |
| Vision Analysis | Gemini (Vision) | — |
| Audio Processing | Gemini (Multimodal) | OpenAI Whisper |
| Live Coaching | Gemini (Multimodal) | — |
| Web Search | Perplexity | — |
| Offline | Ollama | — |

**Key Methods**:
- `generateText(request)` — route text generation to best provider
- `generateVision(request)` — route vision analysis (FACS)
- `streamAudio(request)` — route audio processing
- `connectLive(config)` — establish live coaching session
- `isAIAvailable()` — check if any provider is accessible
- `getProviderHealth()` — returns health status of all providers

**Routing Logic**: Checks user-configured priority → provider health → capability match → cost optimization

---

### `services/ai/types.ts` — AI Interfaces (225 lines)

**Key Interfaces**:
```typescript
interface AITextRequest { prompt: string; systemInstruction?: string; maxTokens?: number; }
interface AIVisionRequest { image: string; prompt: string; schema?: object; }
interface AIAudioRequest { audio: Blob; mimeType: string; }
interface AILiveConfig { systemInstruction: string; voice?: string; }
interface BaseAIAdapter {
  generateText(req: AITextRequest): Promise<AITextResponse>;
  generateVision?(req: AIVisionRequest): Promise<AIVisionResponse>;
  streamAudio?(req: AIAudioRequest): Promise<ReadableStream>;
  connectLive?(config: AILiveConfig): Promise<AILiveSession>;
}
```

---

### `services/ai/adapters/base.ts` — BaseAIAdapter (184 lines)

**Purpose**: Abstract base class all AI adapters extend. Provides standardized error handling, retry logic, and response normalization.

---

### `services/ai/adapters/gemini.ts` — GeminiAdapter (307 lines)

**Purpose**: Google Gemini adapter. Primary provider for text, vision, audio, and live multimodal interactions.

**Models Used**:
- `gemini-2.5-flash` — text, vision, audio analysis
- `gemini-2.0-flash-exp` — live coaching (WebSocket streaming)

**Special Features**: Structured JSON output with schema enforcement, PCM16 audio streaming via WebSocket.

---

### `services/ai/adapters/anthropic.ts` — AnthropicAdapter (248 lines)

**Purpose**: Anthropic Claude adapter. Secondary text generation provider.

---

### `services/ai/adapters/openai.ts` — OpenAIAdapter (225 lines)

**Purpose**: OpenAI GPT adapter. Secondary text generation, Whisper for audio.

---

### `services/ai/adapters/ollama.ts` — OllamaAdapter (212 lines)

**Purpose**: Ollama adapter for local/offline AI inference. Connects to locally-running Ollama server.

---

### `services/ai/adapters/openrouter.ts` — OpenRouterAdapter (233 lines)

**Purpose**: OpenRouter adapter providing access to free and open-source models as fallback.

---

### `services/ai/adapters/perplexity.ts` — PerplexityAdapter (231 lines)

**Purpose**: Perplexity adapter for AI-powered web search integration.

---

### `services/ai/adapters/zai.ts` — ZaiAdapter (183 lines)

**Purpose**: Z.ai adapter. Alternative text generation provider in fallback chain.

---

### `services/ai/modelConfig.ts` (69 lines)

**Purpose**: Model configuration constants — model names, token limits, pricing per provider.

---

### `services/ai/settingsService.ts` (204 lines)

**Purpose**: Manages user's AI provider settings — API keys, enabled providers, priority ordering. Persists to localStorage.

---

### `services/ai/index.ts` (92 lines)

**Purpose**: AI initialization entry point. Configures all adapters and starts the router.

**Key Export**: `initializeAI()` — called once on app startup by `App.tsx`

---

## 2. Core Application Services

### `services/geminiService.ts` (590 lines)

**Purpose**: Gemini-specific service for journal entry analysis. Sends entry text + capacity profile to Gemini for sentiment analysis, strategy generation, and pattern insights.

**Key Functions**:
- `analyzeJournalEntry(text, capacity)` — analyze journal entries for mood, strategies, patterns
- `generateStrategies(entry)` — generate personalized coping strategies based on capacity state

**Features**:
- Structured schema enforcement for consistent AI output
- Response caching via `cacheService` (avoids duplicate analysis)
- Rate limiting via `rateLimitedCall()`
- Circuit breaker protection via `createCircuitBreaker()`
- Safe JSON parsing via `safeParseAIResponse()`

---

### `services/analytics.ts` (468 lines)

**Purpose**: Client-side analytics engine. Generates insights, detects patterns, and predicts burnout from entry history.

**Key Functions**:
- `generateInsights(entries)` → `Insight[]` — correlation, warning, strength, bio-link insights
- `calculateBurnoutTrajectory(entries)` → `BurnoutForecast` — predicts burnout risk based on capacity trends
- `calculateBandwidth(capacity)` — average across 7 dimensions
- `calculateLoad(capacity)` — sum of capacity deficits below threshold
- `calculateInterference(capacity)` — cross-domain negative correlations

**Burnout Prediction Heuristic**: If `spoonLevel < 3` for > 3 consecutive days AND `sensoryLoad > 7` → "Risk of Autistic Burnout detected"

---

### `services/correlationService.ts` (396 lines)

**Purpose**: Real-time correlation analysis between subjective self-reports and objective observations (voice, photo, text).

**Key Functions**:
- `analyze(entry, observations)` — produces correlation analysis
- Returns: `{ score, alignment, masking, patterns, recommendations }`

**Pattern Detection**:
- Meeting stress patterns
- Sensory overload correlations
- Masking detection with confidence scoring
- Alignment scoring: high / moderate / low / mismatch

---

### `services/audioAnalysisService.ts` (493 lines)

**Purpose**: Analyzes audio characteristics for objective observations. Reports ONLY objective data (no emotion labels).

**Detects**:
- Background noise levels
- Speaking pace (words per minute)
- Pitch patterns and variability
- Energy level in voice
- Breathing patterns
- Environmental sounds

**Output**: `Observation[]` with evidence and confidence scores

---

### `services/draftService.ts` (403 lines)

**Purpose**: Auto-save journal entry drafts to localStorage with versioning.

**Features**:
- Auto-save every 30 seconds when dirty
- Multiple draft versions (max 10 retained)
- 7-day automatic cleanup
- Recovery of latest draft on app restart
- `markDirty()` / `autoSave()` / `save()` API

---

### `services/notificationService.ts` (314 lines)

**Purpose**: Gentle push notification reminders for journaling and check-ins.

**Features**:
- Browser notification permission management
- Configurable reminder schedules
- Respects do-not-disturb preferences
- Neuro-affirming notification copy

**Export**: `initNotificationService()` — called on app startup

---

### `services/userFeedbackService.ts` (286 lines)

**Purpose**: Captures user feedback on AI strategies, insights, and suggestions — used to improve AI recommendation quality.

---

### `services/exportService.ts` (388 lines)

**Purpose**: Exports user data as ZIP archive for backup, portability, and GDPR compliance.

**Exports**: Journal entries, settings, state checks, wearable data — in JSON format within a ZIP.

**Dependencies**: JSZip library

---

### `services/migrationService.ts` (289 lines)

**Purpose**: Data migration from legacy POZIMIND keys to MAEPLE keys. Ensures users don't lose data after the application rebrand.

---

## 3. Data Services

### `services/storageService.ts` (199 lines)

**Purpose**: Abstraction over localStorage for entries and settings.

**Key Methods**:
- `getEntries()` → `HealthEntry[]`
- `saveEntry(entry)` — persist single entry
- `getUserSettings()` → `UserSettings`
- `saveUserSettings(settings)` — persist settings

---

### `services/storageWrapper.ts` (120 lines)

**Purpose**: Error-handling wrapper around raw localStorage operations. Handles quota exceeded, corrupt data, and parsing failures.

---

### `services/IndexedDBFallback.ts` (80 lines)

**Purpose**: IndexedDB polyfill/fallback for browsers without full IndexedDB support.

---

### `services/stateCheckService.ts` (251 lines)

**Purpose**: CRUD operations for Bio Mirror state checks (facial analysis sessions).

**Key Methods**:
- `saveStateCheck(check)` — save encrypted analysis
- `getRecentStateChecks(limit)` — retrieve recent checks
- `saveBaseline(baseline)` — save calibration baseline
- `getBaseline()` → `FacialBaseline | null`

**Storage**: IndexedDB with AES-GCM encryption for image data

---

### `services/encryptionService.ts` (136 lines)

**Purpose**: AES-GCM 256-bit encryption for sensitive biometric data (Bio Mirror images and results).

**Algorithm**: AES-GCM with:
- PBKDF2 key derivation (100,000 iterations)
- Unique per-user salt
- Unique per-encryption IV (stored alongside ciphertext)

**Key Methods**:
- `encrypt(data, userKey)` → `{ encrypted, iv }`
- `decrypt(encrypted, iv, userKey)` → `ArrayBuffer`

**Security Note**: Key stored in localStorage. Protects against casual observation; for production, should migrate to more secure key management.

---

### `services/cacheService.ts` (307 lines)

**Purpose**: Multi-layer caching service for AI responses and frequently-accessed data.

**Layers**:
- **L1 (Memory)**: In-memory Map, instant access, cleared on refresh
- **L2 (IndexedDB)**: Persistent, survives refresh, TTL-based expiration
- **L3 (Network)**: Fallback to actual API call

**Key Methods**:
- `get(key)` — check L1 → L2 → miss
- `set(key, value, ttl)` — write to L1 + L2
- `invalidate(key)` — remove from all layers

---

## 4. FACS & Vision Services

### `services/geminiVisionService.ts` (627 lines)

**Purpose**: Gemini Vision API integration for FACS (Facial Action Coding System) analysis. Sends captured facial images to Gemini 2.5 Flash with structured FACS prompt.

**Key Functions**:
- `analyzeImage(base64Image)` → `FacialAnalysis` — full FACS analysis
- `analyzeImageWithProgress(base64Image, onProgress)` — with progress callbacks

**Prompt Engineering**:
- Configures Gemini as "Certified FACS expert trained in Ekman-Friesen methodology"
- Requests specific AU codes (AU1, AU4, AU6, AU7, AU12, AU14, AU24, AU43, AU45)
- Requires intensity ratings on A-E scale
- Requests AU combination analysis (Duchenne vs social smile)
- Enforces structured JSON schema for response format
- Avoids emotion labeling (reports muscle movements only)

**Configuration**: 45-second timeout, structured JSON output, retry with circuit breaker

---

### `services/comparisonEngine.ts` (317 lines)

**Purpose**: Compares subjective journal mood (1-5) with objective facial analysis to detect masking, dissociation, and self-awareness accuracy.

**Key Exported Functions**:
- `compareSubjectiveToObjective(entry, analysis, baseline?)` → comparison result with discrepancy score (0-100)
- `calculateTensionFromAUs(actionUnits)` → `number` (0-1) — weighted: AU4×0.4 + AU24×0.4 + AU14×0.2
- `calculateFatigueFromAUs(actionUnits)` → `number` (0-1) — weighted: AU43×0.5 + AU7×0.3 + low_expressiveness×0.2
- `checkDetectionQuality(analysis)` → `{ score, level, suggestions, canProceed }` — detection quality assessment (0-100)
- `hasAUWithIntensity(actionUnits, auCode, minIntensity)` — check for specific AU at minimum intensity

**Discrepancy Score Calculation**:
1. Detect genuine smile (AU6+AU12) vs social smile (AU12 alone)
2. Calculate tension and fatigue from AUs
3. Apply baseline adjustment (subtract neutral levels independently)
4. If mood ≥ 4 and tension > 0.3 → +60 points (masking detected)
5. If mood ≥ 4 and fatigue > 0.3 → +40 points (fatigue contradiction)
6. FACS interpretation bonuses (social smile, masking indicators, fatigue indicators)
7. Cap at 0-100

**Interpretation Guide**:
| Score | Meaning |
|-------|---------|
| 0-20 | High self-awareness, minimal masking |
| 21-40 | Mild masking or dissociation |
| 41-60 | Moderate masking |
| 61-80 | Significant masking or dissociation |
| 81-100 | Severe disconnect |

---

## 5. Infrastructure Services

### `services/authService.ts` (577 lines)

**Purpose**: Authentication flows supporting email/password, magic link, and session management.

**Key Functions**:
- `signInWithEmail(email, password)` — email/password login
- `signUpWithEmail(email, password)` — email/password registration
- `signInWithMagicLink(email)` — passwordless login
- `signOut()` — clear session
- `getAuthState()` → `AuthState` — current auth status
- `onAuthStateChange(callback)` — subscribe to auth changes

**Production**: Supabase Auth. **Local Dev**: JWT with bcrypt via Express API.

---

### `services/apiClient.ts` (467 lines)

**Purpose**: HTTP client for the local Express API server. Handles JWT tokens, request formatting, and response parsing.

**Base URL**: `VITE_API_URL` env var or `/api` (proxied to `localhost:3001`)

**Features**: Auto-attach JWT, token refresh on 401, request/response logging, error normalization

---

### `services/syncService.ts` (498 lines)

**Purpose**: Cloud synchronization with Last-Write-Wins conflict resolution.

**Key Functions**:
- `initializeSync()` — start background sync
- `fullSync()` — sync all data bidirectionally
- `pushToCloud()` — upload local changes
- `pullFromCloud()` — download remote changes
- `getSyncState()` → `SyncState`
- `getSyncStats()` — local/remote entry counts, pending items

**Algorithm**: Compare `updatedAt` timestamps → most recent wins → merge results → update both sides

---

### `services/backgroundSync.ts` (70 lines)

**Purpose**: Capacitor-aware background sync that triggers periodic data synchronization.

**Config**: 15-minute sync interval, 5-minute minimum between syncs. Uses Capacitor `App` plugin for lifecycle events.

---

### `services/offlineQueue.ts` (382 lines)

**Purpose**: IndexedDB-based queue for failed API requests when offline. Retries automatically when connection returns.

**Features**:
- Queue any failed HTTP request with full payload
- Exponential backoff retry strategy
- Persistent across sessions (IndexedDB)
- Processes queue on reconnection
- Reports queue status

---

### `services/circuitBreaker.ts` (197 lines)

**Purpose**: Circuit breaker pattern implementation preventing cascading failures from unreliable external services.

**States**:
- **CLOSED**: Normal operation, failures tracked
- **OPEN**: Threshold exceeded (default: 5 failures), requests fail-fast for cooldown period (default: 30s)
- **HALF_OPEN**: After cooldown, one test request allowed. Success → CLOSED, failure → OPEN

**Key Methods**:
- `createCircuitBreaker(name, options)` — factory function
- `execute(fn)` — wrap an async function in circuit breaker protection
- `getState()` → `CircuitState`

---

### `services/rateLimiter.ts` (299 lines)

**Purpose**: Token bucket rate limiter for AI API calls. Prevents quota exhaustion.

**Limits**:
- **Free tier**: 60 requests/minute, 1500 requests/day
- **Pro tier**: 55 requests/minute, 1400 requests/day (conservative margins)

**Algorithm**: Token bucket with localStorage persistence for daily tracking

**Key Export**: `rateLimitedCall(fn, options)` — wraps any async function with rate limiting

---

### `services/errorLogger.ts` (311 lines)

**Purpose**: Centralized error tracking and log management.

**Features**:
- Log errors/warnings/info with context
- Persistent log storage (localStorage, max 500 entries)
- Statistics by level and context
- Export logs for debugging
- Used by `BetaDashboard` component

**Key Exports**: `errorLogger`, `logError()`, `logInfo()`, `logWarning()`

---

### `services/imageWorkerManager.ts` (355 lines)

**Purpose**: Manages lifecycle and communication with the image processor Web Worker.

**Features**:
- Worker pool management
- Promise-based API for image operations
- Request queuing when worker is busy
- Fallback to main-thread processing if workers unavailable
- Timeout handling

**Key Methods**:
- `compressImage(imageData, options)` — compress via worker
- `resizeImage(imageData, dimensions)` — resize via worker

---

### `services/supabaseClient.ts` (32 lines)

**Purpose**: Supabase client initialization with env-based configuration.

---

## 6. Wearable Integrations

### `services/wearables/manager.ts` (261 lines)

**Purpose**: Central manager for all wearable connections. Handles OAuth flows, data fetching, and normalization.

**Key Methods**:
- `connect(provider)` — initiate OAuth connection
- `disconnect(provider)` — revoke access
- `fetchData(provider, dateRange)` — fetch and normalize data
- `getConnectedProviders()` — list of active connections

---

### `services/wearables/types.ts` (54 lines)

**Key Interfaces**:
```typescript
interface WearableAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchData(start: Date, end: Date): Promise<WearableDataPoint[]>;
  isConnected(): boolean;
}

interface WearableDataPoint {
  provider: 'oura' | 'apple' | 'garmin' | 'fitbit' | 'whoop';
  metrics: { heartRate?, hrv?, sleepQuality?, steps?, activityLevel? };
  syncedAt: string;
}
```

---

### `services/wearables/ouraAdapter.ts` (301 lines)

**Purpose**: Oura Ring integration via OAuth2 API. Fetches sleep quality, HRV, heart rate, temperature, readiness score.

---

### `services/wearables/appleHealthAdapter.ts` (490 lines)

**Purpose**: Apple Health integration via Capacitor plugin (mobile only). Fetches activity, heart rate, sleep, respiratory rate.

---

### `services/wearables/garminAdapter.ts` (563 lines)

**Purpose**: Garmin Connect integration. Fetches activity, stress score, body battery, sleep data.

---

### `services/wearables/whoopAdapter.ts` (118 lines)

**Purpose**: WHOOP integration. Fetches recovery, strain, sleep performance scores.

---

### `services/wearables/mockAdapter.ts` (80 lines)

**Purpose**: Mock wearable adapter for testing and development without real device connections.

---

## 7. Validation Layer

### `services/validationService.ts` (565 lines)

**Purpose**: Runtime data validation and sanitization for all data types. Provides defense-in-depth alongside Zod schema validation.

**Key Functions**:
- `validateHealthEntry(data)` — validates full entry, clamps mood to 1-5 range
- `validateCapacityProfile(data)` — ensures 7 dimensions within 0-10
- `validateFacialAnalysis(data)` — validates FACS analysis structure
- `sanitizeString(input)` — XSS prevention
- `clamp(value, min, max)` — numeric range enforcement

**Important**: Mood clamped to 1-5 (matching types.ts and Zod schema, fixed in v0.97.9)

---

### `services/validation/schemas.ts` (255 lines)

**Purpose**: Zod schema definitions for compile-time and runtime type validation.

**Schemas**: `HealthEntrySchema`, `CapacityProfileSchema`, `FacialAnalysisSchema`, `ActionUnitSchema`, `UserSettingsSchema`

---

### `services/validation/validator.ts` (227 lines)

**Purpose**: Validation runner that applies Zod schemas to data with error formatting.

---

## 8. State Management (Zustand Stores)

### `stores/appStore.ts` (333 lines)

**Purpose**: Main application state store managing entries, settings, and app-level state.

**State**:
```typescript
interface AppStore {
  entries: HealthEntry[];
  wearableData: WearableDataPoint[];
  userSettings: UserSettings;
  view: View;
  showOnboarding: boolean;
  isLoading: boolean;
}
```

**Key Actions**:
- `initializeApp()` — load entries from storage, check onboarding status
- `addEntry(entry)` — save new entry to storage + state
- `deleteEntry(id)` — remove entry
- `setView(view)` — change current view
- `mergeWearableData(data)` — merge new wearable data points

**Onboarding Detection**: Dual-factor check — `localStorage('maeple_onboarding_complete')` AND `entries.length === 0`

---

### `stores/authStore.ts` (263 lines)

**Purpose**: Authentication state — current user, auth status, session management.

**State**:
```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}
```

**Key Actions**: `initializeAuth()`, `login(email, password)`, `logout()`, `refreshSession()`

---

### `stores/syncStore.ts` (266 lines)

**Purpose**: Sync state tracking — sync status, last sync time, pending items, errors.

**State**:
```typescript
interface SyncStore {
  syncState: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncTime: Date | null;
  pendingCount: number;
  syncError: string | null;
}
```

---

### `stores/index.ts` (45 lines)

**Purpose**: Barrel exports for all stores — `useAppStore`, `useAuthStore`, `useSyncStore`.

---

## 9. React Contexts

### `contexts/DependencyContext.tsx` (147 lines)

**Purpose**: Dependency injection container for services. Provides service instances to components without direct imports, enabling testing and swapping.

**Provided Services**:
- `useAIService()` — AI router with circuit breaker
- `useVisionService()` — Vision service with circuit breaker

**Pattern**: Factory creates services → Context provides them → Components consume via hooks

---

### `contexts/ObservationContext.tsx` (309 lines)

**Purpose**: Centralized observation state management for visual, audio, and text observations collected during journal entry creation.

**State Management**: `useReducer` for immutable updates

**Key Methods** (via `useObservations()` hook):
- `add(observation)` — add new observation
- `getByType(type, hoursBack)` — query by type with time window
- `getRecent(hoursBack)` — get all recent observations
- `correlate(entry)` — correlate observations with a journal entry
- `clear()` — reset all observations

---

## 10. Custom Hooks

### `hooks/useCameraCapture.ts` (316 lines)

**Purpose**: Stable camera management hook that eliminates flickering via `useRef` pattern.

**Signature**: `useCameraCapture(isActive: boolean, config?: CameraConfig)`

**Returns**:
```typescript
{
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  state: { isReady: boolean; isInitializing: boolean; error: string | null };
  capture: () => string | null;    // Returns base64 image
  switchCamera: () => void;        // Toggle front/back
  retry: () => void;               // Re-initialize
  facingMode: 'user' | 'environment';
}
```

**Stability Techniques**:
- Config values (`resolutions`, `maxRetries`) stored in refs (prevents dependency cascade)
- `initializeCamera` accepts `facingMode` as parameter (not closure)
- Main `useEffect` only depends on `isActive` and `facingMode`
- Resolution fallback: HD → SD → Low

---

### `hooks/usePWAInstall.ts` (49 lines)

**Purpose**: Manages PWA install prompt — detects installability and triggers install dialog.

**Returns**: `{ isInstallable: boolean; install: () => Promise<void> }`

---

## 11. Design Patterns

### `patterns/CircuitBreaker.ts` (151 lines)

**Purpose**: Core circuit breaker implementation (distinct from the service-level wrapper in `services/circuitBreaker.ts`).

**States**: CLOSED → OPEN → HALF_OPEN → CLOSED

**Configuration**:
| Parameter | Default | Description |
|-----------|---------|-------------|
| `failureThreshold` | 5 | Failures before opening |
| `cooldownMs` | 30000 | Time in OPEN before test request |
| `halfOpenMax` | 1 | Test requests in HALF_OPEN |

**Key Methods**:
- `execute<T>(fn: () => Promise<T>)` → `Promise<T>` — execute with protection
- `getState()` → `CircuitState`
- `onStateChange(callback)` — subscribe to state transitions

---

### `patterns/RequestBatcher.ts` (215 lines)

**Purpose**: Batches multiple similar requests into a single API call to reduce network overhead.

**Use Cases**: Batch multiple entry saves, batch AI analyses for similar entries.

**Configuration**: `maxBatchSize`, `maxWaitMs`, `batchFn`

---

## 12. Web Workers

### `workers/imageProcessor.ts` (254 lines)

**Purpose**: Web Worker for CPU-intensive image compression operations. Runs off the main thread to prevent UI blocking.

**Supported Operations**:
- `compress` — reduce image file size with quality/dimension targets
- `resize` — resize to specific dimensions
- `convertFormat` — convert between image formats

**Communication**: Message-based API via `postMessage` / `onmessage`

**Pipeline**: Receive ImageBitmap/base64 → process in OffscreenCanvas → return compressed result

---

## 13. Utility Modules

### `utils/captureAndCompress.ts` (112 lines)

**Purpose**: Image capture and compression pipeline. Captures from canvas, routes through Web Worker with main-thread fallback.

**Key Export**: `compressCapturedImage(canvas)` → `Promise<string>` (base64)

**Pipeline**: Canvas → toDataURL → Web Worker compression → fallback to main thread if worker unavailable

---

### `utils/transformAIResponse.ts` (117 lines)

**Purpose**: Normalizes diverse AI response formats into consistent `FacialAnalysis` structure.

**Handled Formats**:
1. Direct structure (`{ confidence, actionUnits, ... }`)
2. Wrapped structure (`{ facs_analysis: { ... } }`)
3. snake_case field names (`action_units_detected`, `jaw_tension`)
4. camelCase field names (`actionUnits`, `jawTension`)

**Key Export**: `transformAIResponse(rawResponse)` → `FacialAnalysis`

---

### `utils/safeParse.ts` (223 lines)

**Purpose**: Safe JSON parsing with multiple fallback strategies for AI responses that may contain markdown code blocks or invalid JSON.

**Strategies**: Direct parse → strip markdown fences → extract JSON from text → regex extraction

**Key Export**: `safeParseAIResponse(text)` → `ParsedResponse`

---

### `utils/dataValidation.ts` (370 lines)

**Purpose**: Legacy data validation functions. Contains `validateFacialAnalysis()` (duplicate of functionality in `validationService.ts`).

**Note**: This module predates `validationService.ts`. Some functions overlap. The canonical validation is in `validationService.ts`.

---

### `utils/safeArray.ts` (101 lines)

**Purpose**: Safe array operations that prevent runtime errors from null/undefined arrays.

**Key Functions**: `safeMap()`, `safeFilter()`, `safeReduce()`, `safeFind()`, `ensureArray()`

---

### `utils/typeGuards.ts` (221 lines)

**Purpose**: Runtime type guard functions for TypeScript type narrowing.

**Key Guards**: `isHealthEntry()`, `isFacialAnalysis()`, `isActionUnit()`, `isCapacityProfile()`

---

### `utils/imageCompression.ts` (181 lines)

**Purpose**: Main-thread image compression fallback when Web Workers are unavailable.

---

### `utils/observationNormalizer.ts` (121 lines)

**Purpose**: Normalizes different observation formats into consistent `Observation` objects.

---

### `utils/offlineDetector.ts` (222 lines)

**Purpose**: Network status detection with event-based notifications.

**Features**: Online/offline detection, connection quality estimation, reconnection events

---

### `utils/debounce.ts` (267 lines)

**Purpose**: Debounce and throttle utility functions for input handlers and API calls.

---

### `utils/serviceCache.ts` (264 lines)

**Purpose**: Service-level caching utility with TTL, LRU eviction, and cache invalidation.

---

### `utils/cn.ts` (10 lines)

**Purpose**: `clsx` + `tailwind-merge` className merger utility.

**Usage**: `cn('px-4 py-2', isActive && 'bg-blue-500', className)`

---

## 14. Service Adapters (DI)

### `adapters/serviceAdapters.ts` (325 lines)

**Purpose**: Dependency injection adapter wrappers that wrap raw services with circuit breaker protection and standardized error handling.

**Adapters Created**:
- `AIServiceAdapter` — wraps `aiRouter` with circuit breaker
- `VisionServiceAdapter` — wraps `geminiVisionService` with circuit breaker

**Pattern**:
```typescript
const adapter = {
  generateText: circuitBreaker.execute(() => aiRouter.generateText(req)),
  onStateChange: circuitBreaker.onStateChange,
  getCircuitState: circuitBreaker.getState,
};
```

**Consumed By**: `DependencyContext.tsx` provides these adapters to components

---

### `factories/dependencyFactory.ts`

**Purpose**: Factory function that creates all service adapter instances and returns them as a dependency bundle.

**Key Export**: `getDependencies()` → `{ aiService, visionService }`
