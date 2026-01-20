# MAEPLE System Architecture

**Version**: 2.2.5  
**Last Updated**: January 20, 2026  
**Refactoring Status**: ✅ Complete (Camera v2.2.3, Vision, Observations, Drafts, Correlations, Onboarding v2.2.4, Card Fix v2.2.5)

## 1. Overview

MAEPLE (Mental And Emotional Pattern Literacy Engine) is a neuro-affirming health intelligence platform designed to help users track and understand their mental and emotional patterns. It uses a local-first, privacy-centric architecture with optional cloud synchronization via Supabase.

### Recent Architecture Updates (v2.2.5 - Card Interaction Fix)

- **Card Component Fix v2.2.5**: Fixed critical UI bug where form elements were unclickable
  - **Root Cause**: `.card` CSS missing `position: relative` for absolute child positioning
  - **Secondary Issue**: Aggressive hover transforms caused touch/click interaction problems
  - **Fix**: Added `relative` to `.card` base styles, removed transform from default hover
  - **New Class**: Added `.card-hoverable` for cards that need scale-on-hover behavior
  - **Component Update**: Changed Card `hoverable` prop default from `true` to `false`

### Recent Architecture Updates (v2.2.4 - Onboarding)

- **Onboarding System v2.2.4**: Complete UX and messaging overhaul
  - **User-Focused Messaging**: All 5 steps reframed from feature-focused to outcome-focused
  - **Skip Button**: Visible on every step, allows graceful exit without marking onboarding complete
  - **Dual First-Entry Detection**: Checks BOTH localStorage flag AND entries.length for robust first-time user detection
  - **Replay Feature**: Users can re-watch onboarding anytime via Settings → Help & Resources
  - **Improved Messaging Philosophy**: Changed from "What MAEPLE does" to "Why it matters to you"
    - Step 1: "Understand Yourself Better" (was "Welcome to MAEPLE")
    - Step 2: "See Your Patterns Clearly" (was "Pattern Literacy Over Surveillance")
    - Step 3: "Your Personal Pattern Analyst" (emphasizes Mae's benefit, not just capability)
    - Step 4: "Your Data Stays Yours" (privacy-first positioning)
    - Step 5: "Your Pattern Journey Starts with One Entry" (action-oriented)

### Recent Architecture Updates (v2.2.3)

- **Camera System**: Custom `useCameraCapture` hook eliminates flickering via `useRef` pattern
  - **v2.2.1 Fix**: Config values (`resolutions`, `maxRetries`) stored in refs to prevent dependency cascade
  - **v2.2.1 Fix**: `initializeCamera` accepts `facingMode` as parameter (not closure)
  - **v2.2.1 Fix**: Main `useEffect` only depends on `isActive` and `facingMode`
  - **v2.2.1 Fix**: Modal conditionally rendered only when `isOpen` is true
  - **v2.2.2 Fix**: React.StrictMode disabled to prevent double-rendering
  - **v2.2.2 Fix**: GPU optimizations (`willChange`, `contain`, `isolation`) added to video elements
  - **v2.2.2 Fix**: Removed `backdrop-blur` effects that cause GPU thrashing
  - **v2.2.2 Fix**: Camera components wrapped with `React.memo()` to block parent re-renders
  - **v2.2.3 Fix**: StateCheckWizard only renders intro when camera is closed (`!isCameraOpen`)
  - **v2.2.3 Fix**: Portal captures all mouse events with `stopPropagation()` to prevent leakage
- **Vision Service**: Enhanced progress callbacks, 45s timeout, offline fallback
- **Observation Context**: Centralized observation management with `useReducer`
- **Draft Service**: Auto-save (30s), versioning, localStorage persistence
- **Correlation Engine**: Real-time masking detection and pattern analysis

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI Framework with concurrent features |
| TypeScript | 5.2+ | Type safety (strict mode) |
| Vite | 7.2 | Build tool |
| Zustand | 5.0 | State management |
| Tailwind CSS | 3.4 | Styling (dark mode support) |
| React Router DOM | 7.10 | Routing |
| Capacitor | 8.0 | Native mobile apps |

### Backend Services

| Service | Technology | Purpose |
|---------|------------|---------|
| Database | PostgreSQL 14+ / Supabase | Data persistence |
| Auth | Supabase Auth | Authentication, user management |
| API | Node.js 22+ / Express 5 | REST API |
| Real-time | Supabase Realtime | Live updates |

### AI Layer

- **Orchestration**: `AIRouter` with Circuit Breaker pattern
- **Primary Provider**: Google Gemini (Text, Vision, Audio, Live)
- **Secondary Providers**: OpenAI, Anthropic, Z.ai, Perplexity
- **Fallback**: OpenRouter (free model access)
- **Local**: Ollama (offline inference)

## 3. Core Architecture Patterns

### 3.1 Local-First Data

- **Primary Source**: `localStorage` and `IndexedDB` (for large blobs like images).
- **Sync Strategy**: "Last Write Wins" with conflict resolution.
- **Offline Support**: `offlineQueue` (IndexedDB) stores requests when network is unavailable.
- **Onboarding State**: `localStorage` flag + entries count for robust first-entry detection

### 3.1.1 Onboarding State Management (v2.2.4)

The onboarding system uses dual-factor first-entry detection:

**localStorage Flag**: `maeple_onboarding_complete`
- Set to `'true'` when user completes onboarding
- Can be removed to replay onboarding from Settings

**Entries Count Check**: `getEntries().length`
- System checks if user has zero journal entries
- If entries exist, user is considered "not new" even if flag is missing
- Survives localStorage clearing and works across devices

**Logic**:
```typescript
const onboardingCompleted = localStorage.getItem("maeple_onboarding_complete") === "true";
const shouldShowOnboarding = !onboardingCompleted && entries.length === 0;
```

**Benefits**:
- ✅ Robust to browser cache clearing
- ✅ Works across device switches
- ✅ Distinguishes "true new users" from "returning users with cleared cache"
- ✅ Only shows onboarding once per user lifetime

### 3.2 AI Orchestration

- **Router**: `services/ai/router.ts` determines the best provider based on capability (Text, Vision, Audio) and user settings.
- **Adapters**: Each provider has a standardized adapter implementing `BaseAIAdapter`.
- **Live Coach Flow**:
  1.  **Input**: Web Audio API captures microphone stream.
  2.  **Processing**: `ScriptProcessorNode` converts Float32 audio to PCM16.
  3.  **Transport**: `GeminiAdapter` streams PCM16 to Gemini API via WebSocket.
  4.  **Output**: Gemini returns Audio (played via Web Audio API) and Text (displayed as transcript).
- **Rate Limiting**: Client-side token bucket limiter (`services/rateLimiter.ts`) prevents API quota exhaustion.

### 3.3 Security

- **Encryption**: AES-GCM 256-bit encryption for sensitive biometric data (Bio-Mirror) before storage.
- **API Keys**: Stored in `localStorage` (encrypted at rest) or environment variables.
- **Auth**: JWT-based authentication with secure password hashing.

## 4. Directory Structure

```
/workspaces/Maeple/
├── src/
│   ├── components/      # React UI Components
│   │   ├── OnboardingWizard.tsx        # v2.2.4 - User-focused messaging, skip button
│   │   ├── BiofeedbackCameraModal.tsx  # Refactored - uses useCameraCapture
│   │   ├── StateCheckCamera.tsx        # Refactored - uses useCameraCapture
│   │   ├── StateCheckWizard.tsx        # Updated - real progress callbacks
│   │   └── Settings.tsx                # v2.2.4 - Added Help & Resources section
│   ├── contexts/        # React Contexts
│   │   └── ObservationContext.tsx      # NEW - Centralized observation storage
│   ├── hooks/           # Custom React Hooks
│   │   └── useCameraCapture.ts         # NEW - Stable camera management
│   ├── services/        # Business Logic & API Clients
│   │   ├── ai/          # AI Router & Adapters
│   │   ├── wearables/   # Wearable Integrations
│   │   ├── correlationService.ts       # NEW - Pattern/masking detection
│   │   ├── draftService.ts             # NEW - Auto-save persistence
│   │   └── geminiVisionService.ts      # Enhanced - Progress callbacks
│   ├── stores/          # Zustand Stores
│   │   └── appStore.ts                 # v2.2.4 - Dual first-entry detection
│   └── ...
├── api/                 # Express API Server
├── tests/               # Vitest Suites
└── local_schema.sql     # Database Schema
```

## 5. New Service Architecture (v2.2.0)

### 5.0.1 Onboarding System (v2.2.4)

**Component**: `src/components/OnboardingWizard.tsx`
**Store Integration**: `src/stores/appStore.ts`

**Key Features**:

1. **User-Focused Messaging**: All 5 steps emphasize outcomes over features
   - Step 1: "Understand Yourself Better" - emphasizes self-compassion
   - Step 2: "See Your Patterns Clearly" - emphasizes practical awareness
   - Step 3: "Meet Mae, Your Personal Pattern Analyst" - emphasizes benefit
   - Step 4: "Your Data Stays Yours" - privacy-first approach
   - Step 5: "Your Pattern Journey Starts with One Entry" - action-oriented

2. **Skip Functionality**
   - Visible "Skip" button on every step (left side of navigation)
   - Does NOT mark onboarding as complete
   - User can see onboarding again on next session
   - Provides graceful exit for users who want to explore first

3. **Dual First-Entry Detection** (appStore.ts)
   - Primary: Check `localStorage.getItem('maeple_onboarding_complete') === 'true'`
   - Secondary: Check `getEntries().length === 0`
   - Show onboarding only if BOTH checks indicate new user
   - Survives browser cache clearing and works across devices

4. **Replay Feature** (Settings.tsx)
   - New "Help & Resources" section in Settings
   - "Replay Onboarding Tutorial" button
   - Removes localStorage flag and triggers `setShowOnboarding(true)`
   - Users can re-watch anytime

**User Flows**:

**Flow A: First-Time User (Completes)**
```
Open App → showOnboarding=true → Steps 1-5 → Click "Start Journaling" 
→ Mark complete (localStorage=true) → Modal closes → User sees dashboard
```

**Flow B: First-Time User (Skips)**
```
Open App → showOnboarding=true → Step 3 → Click "Skip" 
→ localStorage NOT set → Modal closes → User sees dashboard
→ Next session: showOnboarding=true (because entries.length=0) → Onboarding reappears
```

**Flow C: Existing User**
```
Open App → entries.length > 0 → showOnboarding=false → No modal shown
→ User can still replay from Settings if desired
```

**Flow D: Replay from Settings**
```
Settings → Help & Resources → Click "Replay Onboarding Tutorial"
→ localStorage cleared → setShowOnboarding=true) → Modal appears with all steps
```

### 5.1 Camera Management

**Hook**: `useCameraCapture(isActive, config)`

Provides stable camera management with proper lifecycle handling:
- Uses `useRef` for MediaStream (prevents re-renders)
- Uses `useRef` for config values (prevents dependency cascade)
- Single `useEffect` with minimal dependencies (`isActive`, `facingMode` only)
- `initializeCamera` accepts `facingMode` as parameter (not closure capture)
- Resolution fallback (HD → SD → Low)
- Context-aware error messages

```typescript
const {
  videoRef,
  canvasRef,
  state: { isReady, isInitializing, error },
  capture,
  switchCamera,
  retry,
  facingMode,
} = useCameraCapture(isModalOpen);
```

**Key Implementation Details (v2.2.1):**
```typescript
// Config stored in refs to prevent dependency changes
const resolutionsRef = useRef(config.resolutionPresets || DEFAULT_RESOLUTIONS);
const maxRetriesRef = useRef(config.maxRetries || 3);

// initializeCamera accepts facingMode explicitly
const initializeCamera = useCallback(
  async (resolutionIndex: number = 0, currentFacingMode: 'user' | 'environment' = 'user') => {
    // Uses resolutionsRef.current, not resolutions prop
  },
  [] // Empty deps - stable reference
);

// Main effect only depends on isActive and facingMode
useEffect(() => {
  if (isActive) initializeCamera(0, facingMode);
  else cleanup();
}, [isActive, facingMode]); // NOT initializeCamera, cleanup
```

### 5.2 Observation Context

**Context**: `ObservationProvider` / `useObservations()`

Centralized storage for visual, audio, and text observations:
- `useReducer` for immutable state management
- Supports correlation with journal entries
- Query methods by type, source, or time range

```typescript
const { add, getByType, getRecent, correlate } = useObservations();
add(faceAnalysisToObservation(analysis));
const visuals = getByType('visual', 24); // Last 24 hours
```

### 5.3 Draft Service

**Service**: `draftService` / `useDraft()`

Automatic draft persistence for journal entries:
- Auto-save every 30 seconds
- Multiple draft versions (max 10)
- 7-day retention with automatic cleanup
- Recovery on app restart

```typescript
const { draft, save, markDirty, autoSave } = useDraft();
markDirty(currentData); // Schedules auto-save
```

### 5.4 Correlation Service

**Service**: `correlationService` / `useCorrelationAnalysis()`

Real-time correlation analysis between subjective and objective data:
- Masking detection with confidence scoring
- Pattern identification (meeting stress, sensory overload, etc.)
- Actionable recommendations
- Alignment scoring (high/moderate/low/mismatch)

```typescript
const { analyze } = useCorrelationAnalysis();
const analysis = analyze(entry, observations);
// Returns: { score, alignment, masking, patterns, recommendations }
```
