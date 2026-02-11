# MAEPLE System Architecture

**Version**: 3.0.0  
**Last Updated**: February 9, 2026  
**App Version**: 0.97.9

---

## 1. Overview

MAEPLE (Mental And Emotional Pattern Literacy Engine) is a neuro-affirming health intelligence platform that helps users track and understand their mental and emotional patterns. It uses a local-first, privacy-centric architecture with optional cloud synchronization via Supabase.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAEPLE System                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐   ┌──────────────────┐   ┌──────────────────┐      │
│  │   React 19.2 UI   │◄─►│  Zustand Stores  │◄─►│  React Contexts  │      │
│  │   (40 components) │   │  (app/auth/sync)  │   │  (DI, Observe)   │      │
│  └────────┬──────────┘   └──────────────────┘   └──────────────────┘      │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      Services Layer (22 services)               │       │
│  ├─────────────────────────────────────────────────────────────────┤       │
│  │ Storage     │ Validation  │ Comparison  │ Analytics   │ Drafts  │       │
│  │ Encryption  │ RateLimiter │ Correlation │ AudioAnalysis│ Cache  │       │
│  │ ErrorLogger │ OfflineQueue│ StateCheck  │ Notifications│ Export │       │
│  │ Sync        │ Auth        │ APIClient   │ Migration    │ ...    │       │
│  └──────────────────────┬──────────────────────────────────────────┘       │
│                         │                                                   │
│           ┌─────────────┴──────────────┐                                   │
│           ▼                            ▼                                   │
│  ┌─────────────────┐       ┌─────────────────┐                            │
│  │   AI Layer      │       │  Wearables Layer│                            │
│  │   (AIRouter)    │       │  (Manager)      │                            │
│  ├─────────────────┤       ├─────────────────┤                            │
│  │ Gemini (primary)│       │ Oura Ring       │                            │
│  │ OpenAI          │       │ Apple Health    │                            │
│  │ Anthropic       │       │ Garmin          │                            │
│  │ Perplexity      │       │ WHOOP           │                            │
│  │ Z.ai            │       │ Fitbit          │                            │
│  │ Ollama (local)  │       └────────┬────────┘                            │
│  │ OpenRouter      │                │                                      │
│  └────────┬────────┘                │                                      │
│           │                         │                                      │
│  ┌────────┴─────────────────────────┴──────────┐                          │
│  │           Infrastructure Patterns            │                          │
│  │  Circuit Breaker │ Request Batcher │ Workers │                          │
│  └──────────────────────────┬───────────────────┘                          │
│                             │                                              │
│           ┌─────────────────┴──────────────────┐                          │
│           ▼                                    ▼                          │
│  ┌─────────────────┐                ┌─────────────────┐                   │
│  │  Local Storage   │                │  Cloud Backend   │                   │
│  ├─────────────────┤                ├─────────────────┤                   │
│  │ localStorage    │                │ Supabase Auth   │                   │
│  │ IndexedDB       │                │ PostgreSQL 16   │                   │
│  │ (AES-GCM enc)   │                │ Express API     │                   │
│  └─────────────────┘                └─────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend

| Technology       | Version | Purpose                               |
|------------------|---------|---------------------------------------|
| React            | 19.2    | UI framework with concurrent features |
| TypeScript       | 5.2+    | Type safety (strict mode)             |
| Vite             | 7.2     | Build tool and dev server            |
| Zustand          | 5.0     | Lightweight state management          |
| Tailwind CSS     | 3.4     | Utility-first styling + dark mode     |
| React Router DOM | 7.10    | Client-side routing                   |
| Capacitor        | 8.0     | Native iOS/Android apps               |
| Recharts         | Latest  | Data visualization charts             |
| Lucide React     | Latest  | Icon library                          |
| Zod              | Latest  | Schema validation                     |

### Backend

| Technology   | Version | Purpose                    |
|-------------|---------|----------------------------|
| Node.js     | 22+     | Runtime                    |
| Express     | 5       | REST API                   |
| PostgreSQL  | 16      | Primary database           |
| Supabase    | Latest  | Auth + realtime (production) |
| JWT + bcrypt| —       | Authentication (local dev) |

### AI Providers

| Provider    | Model                 | Capabilities               | Role            |
|------------|----------------------|---------------------------|-----------------|
| Gemini     | 2.5 Flash            | Text, Vision, Audio, Live | Primary         |
| OpenAI     | GPT-4                | Text                      | Secondary       |
| Anthropic  | Claude               | Text                      | Tertiary        |
| Z.ai       | —                    | Text                      | Quaternary      |
| Perplexity | —                    | Web Search                | Search          |
| Ollama     | Local models         | Text                      | Offline         |
| OpenRouter | Free/open models     | Text                      | Free fallback   |

### Development & Testing

| Tool         | Version | Purpose                          |
|-------------|---------|----------------------------------|
| Vitest       | 4.0     | Unit/integration testing         |
| React Testing Library | — | Component testing            |
| Playwright   | Latest  | E2E testing                      |
| ESLint       | Latest  | Linting with TypeScript rules    |
| Prettier     | Latest  | Code formatting                  |

---

## 4. Core Architecture Patterns

### 4.1 Local-First Data Storage

All user data is stored locally first. Cloud sync is optional and user-controlled.

| Storage Layer | Technology   | Data Types                                   |
|--------------|-------------|----------------------------------------------|
| Fast access  | localStorage | User settings, AI provider configs, draft state |
| Structured    | IndexedDB   | Health entries, offline queue, cached AI responses |
| Encrypted     | IndexedDB   | Bio Mirror images, facial analysis (AES-GCM) |
| Cloud (opt)   | PostgreSQL  | Synced entries, settings (Supabase-hosted)    |

**Offline Support**: All core features work offline. API failures are queued in `offlineQueue` (IndexedDB) and retried with exponential backoff on reconnection.

### 4.2 AI Provider Abstraction

The AI layer abstracts 7 providers behind a unified `BaseAIAdapter` interface:

```
User Request → AIRouter (capability routing)
                  ├── Text → Gemini/OpenAI/Anthropic/Z.ai
                  ├── Vision → Gemini (FACS analysis)
                  ├── Audio → Gemini/OpenAI Whisper
                  ├── Live → Gemini (WebSocket)
                  └── Search → Perplexity
                  
On failure → automatic fallback to next provider in chain
```

**Routing Logic**: User-configured priority → provider health check → capability match → cost optimization

### 4.3 Dependency Injection

Services are injected via React context rather than direct imports:

```
dependencyFactory.ts → creates service instances with circuit breakers
         ↓
DependencyContext.tsx → provides via React context
         ↓
Components → consume via useAIService(), useVisionService()
```

**Benefits**: Testability (mock services), swappability, centralized circuit breaker wrapping.

### 4.4 Circuit Breaker Pattern

All external service calls are wrapped in circuit breakers:

```
CLOSED ──(5 failures)──► OPEN ──(30s cooldown)──► HALF_OPEN
   ▲                                                  │
   └──────────(test request succeeds)─────────────────┘
```

**Implementation**: `patterns/CircuitBreaker.ts` (core) + `services/circuitBreaker.ts` (factory) + `adapters/serviceAdapters.ts` (wrappers)

### 4.5 Encryption

Sensitive biometric data is encrypted at rest:

| Aspect         | Detail                               |
|---------------|--------------------------------------|
| Algorithm      | AES-GCM 256-bit                     |
| Key derivation | PBKDF2 (100,000 iterations)         |
| Salt           | Unique per-user                     |
| IV             | Unique per-encryption               |
| Encrypted data | Bio Mirror images, facial analysis   |

### 4.6 Onboarding State Management

Dual-factor first-entry detection:

```typescript
const onboardingCompleted = localStorage.getItem("maeple_onboarding_complete") === "true";
const shouldShowOnboarding = !onboardingCompleted && entries.length === 0;
```

- Survives browser cache clearing
- Works across device switches
- Skip button does NOT mark complete (reappears next session)
- Replay available in Settings

---

## 5. Data Flow Architecture

### 5.1 Journal Entry Flow

```
User Input (text/voice/photo)
    │
    ├── CapacitySliders (7 dimensions, 0-10)
    ├── Mood Rating (1-5)
    ├── Journal Text / Voice Transcript
    ├── Tags & Symptoms
    └── Optional Bio Mirror capture
         │
         ▼
    ValidationService
    (clamp mood 1-5, sanitize text, validate capacity 0-10)
         │
         ▼
    StorageService.saveEntry()  ──►  localStorage / IndexedDB
         │
         ├──►  AI Analysis (background, async)
         │     geminiService.analyzeJournalEntry()
         │     └── Returns: strategies, patterns, insights
         │
         ├──►  SyncService.queue()  ──►  Cloud (if online + authenticated)
         │
         └──►  ObservationContext.add()  ──►  Correlation analysis
```

### 5.2 Bio Mirror (FACS Analysis) Flow

```
StateCheckWizard (INTRO → CAMERA → ANALYZING → RESULTS)
    │
    ▼
BiofeedbackCameraModal
    ├── useCameraCapture hook (stable refs, GPU optimized)
    ├── Canvas capture → base64, Compress via Web Worker
    └── Portal rendering (event isolation)
         │
         ▼
StateCheckAnalyzing
    ├── geminiVisionService.analyzeImage(base64)
    │   ├── Gemini 2.5 Flash API call (structured JSON schema)
    │   ├── FACS expert persona prompt
    │   ├── 45-second timeout, circuit breaker wrapped
    │   └── On error: fallback minimal FacialAnalysis
    │
    ├── transformAIResponse(rawResponse)
    │   ├── Unwrap facs_analysis wrapper
    │   ├── Map snake_case → camelCase
    │   └── Ensure required fields with defaults
    │
    └── checkDetectionQuality(analysis)
        ├── Quality score 0-100 (informational, never blocks)
        └── Suggestions for improvement
         │
         ▼
StateCheckResults
    ├── FACS AU breakdown (intensity A-E badges)
    ├── Smile analysis (Duchenne vs Social)
    ├── compareSubjectiveToObjective(entry, analysis, baseline)
    │   ├── calculateTensionFromAUs() → AU4×0.4 + AU24×0.4 + AU14×0.2
    │   ├── calculateFatigueFromAUs() → AU43×0.5 + AU7×0.3 + low_exp×0.2
    │   ├── Apply baseline adjustment (subtract neutral levels)
    │   └── Discrepancy score 0-100
    │
    └── Save: encryptionService.encrypt() → IndexedDB
```

### 5.3 Live Coach Flow

```
User taps Record
    │
    ▼
MediaRecorder API → audio chunks
    │                (Float32 → PCM16)
    ▼
AIRouter.streamAudio() or connectLive()
    │
    ├── Gemini WebSocket (live mode)
    │   ├── PCM16 streaming input
    │   ├── Audio + text response
    │   └── Real-time transcript display
    │
    └── Batch mode (record → stop → send)
         │
         ▼
    Response displayed in chat bubbles
    User can save transcript → new HealthEntry
```

### 5.4 Cloud Sync Flow

```
SyncService.fullSync()
    │
    ├── Fetch remote entries with timestamps
    ├── Compare with local entries
    │
    ├── Conflicts (same ID, different updatedAt):
    │   └── Last-Write-Wins: most recent timestamp wins
    │
    ├── Local-only entries → Push to cloud
    ├── Remote-only entries → Pull to local
    └── Update both sides with merged state
```

---

## 6. Directory Structure

```
/opt/Maeple/
├── src/
│   ├── components/           # 40 React UI components
│   ├── services/             # 22 core business services
│   │   ├── ai/               # AI router + 7 provider adapters
│   │   ├── validation/       # Zod schemas + validation runner
│   │   └── wearables/        # 5 wearable adapters + manager
│   ├── stores/               # 3 Zustand stores (app, auth, sync)
│   ├── contexts/             # 2 React contexts (DI, observations)
│   ├── hooks/                # 2 custom hooks (camera, PWA)
│   ├── adapters/             # Service adapters with circuit breakers
│   ├── patterns/             # Circuit Breaker, Request Batcher
│   ├── workers/              # Web Worker (image processing)
│   ├── utils/                # 12 utility modules
│   ├── factories/            # Dependency factory
│   ├── routes.ts             # Route definitions
│   ├── types.ts              # Core TypeScript interfaces
│   └── index.tsx             # Entry point
│
├── api/                      # Express API server
│   └── index.cjs
│
├── tests/                    # Vitest test suites
│   ├── components/
│   ├── services/
│   ├── facs-core/
│   └── patterns/
│
├── deploy/                   # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── nginx.conf
│
├── specifications/           # Technical specifications
│   ├── COMPLETE_SPECIFICATIONS.md
│   ├── COMPONENT_REFERENCE.md
│   ├── SERVICES_REFERENCE.md
│   ├── DATA_MODELS.md
│   ├── DATA_ANALYSIS_LOGIC.md
│   ├── API_REFERENCE.md
│   ├── UI_UX_GUIDELINES.md
│   └── ...
│
├── docs/                     # User & developer guides
│   ├── INDEX.md
│   ├── FEATURES.md
│   ├── FACS_IMPLEMENTATION_GUIDE.md
│   ├── AI_INTEGRATION_GUIDE.md
│   └── ...
│
├── android/                  # Capacitor Android build
├── ios/                      # Capacitor iOS build (planned)
├── public/                   # Static assets
├── supabase/                 # Supabase config
│
├── DEVELOPMENT.md            # Development setup guide
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Vite build configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── vitest.config.ts          # Test configuration
└── vercel.json               # Vercel deployment config
```

---

## 7. Security Architecture

### Data Protection

| Layer        | Mechanism                 | Scope                        |
|-------------|--------------------------|------------------------------|
| At rest     | AES-GCM 256-bit          | Bio Mirror images/analysis   |
| In transit  | TLS 1.3 (HTTPS)          | All API calls                |
| Auth        | JWT (access + refresh)    | API authentication           |
| Auth (prod) | Supabase Auth             | Production sessions          |
| Input       | Zod schemas + runtime validation | All user data          |
| API         | Token bucket rate limiter | Prevent quota exhaustion     |
| XSS         | Content sanitization      | All text inputs              |

### Privacy Model

- **Local-first**: Primary data on user's device
- **Opt-in sync**: User explicitly enables cloud sync
- **No tracking**: No analytics, no third-party tracking
- **Data export**: Full GDPR-compliant data export (ZIP)
- **Encryption**: Biometric data encrypted before storage

---

## 8. Performance Architecture

### Frontend Optimization

| Strategy           | Implementation                      |
|-------------------|-------------------------------------|
| Code splitting     | Route-based lazy loading (7 routes) |
| React.memo         | Camera components wrapped           |
| Web Workers        | Image compression off main thread   |
| Service caching    | Multi-layer L1/L2 cache             |
| Debouncing         | Input handlers, API calls           |
| GPU hints          | `willChange`, `contain`, `isolation` on video |
| Portal isolation   | Camera modal renders in portal      |

### Bundle Strategy

- Heavy components lazy-loaded: HealthMetricsDashboard, LiveCoach, VisionBoard, StateCheckWizard, Settings, ClinicalReport, BetaDashboard
- Eagerly loaded: JournalView, Guide, SearchResources, Terms, Roadmap, MobileNav

---

## 9. Deployment Architecture

### Development (Docker)

```
docker-compose up -d
├── deploy-web-1 (Nginx, port 80)      → serves built frontend
├── deploy-api-1 (Node.js, port 3001)  → Express API
└── deploy-db-1  (PostgreSQL, port 5432) → database
```

### Production (Vercel + Supabase)

```
Vercel ──► serves frontend SPA
    │
    ├── Supabase Auth ──► authentication
    ├── Supabase DB   ──► PostgreSQL (data storage)
    └── AI APIs       ──► direct client-side calls
        ├── Gemini API (generativelanguage.googleapis.com)
        ├── OpenAI API (api.openai.com)
        ├── Anthropic API (api.anthropic.com)
        └── Perplexity API (api.perplexity.ai)
```

### Mobile (Capacitor)

```
Capacitor wraps the web app as native:
├── Android (android/ directory, Gradle build)
└── iOS (ios/ directory, Xcode project) [planned]
```

---

## 10. Cross-References

| Document | Content |
|----------|---------|
| [COMPONENT_REFERENCE.md](COMPONENT_REFERENCE.md) | Detailed definitions for all 40 React components |
| [SERVICES_REFERENCE.md](SERVICES_REFERENCE.md) | Detailed definitions for all services, stores, hooks, patterns, utilities |
| [DATA_MODELS.md](DATA_MODELS.md) | Core data types: HealthEntry, CapacityProfile, FacialAnalysis, ActionUnit |
| [DATA_ANALYSIS_LOGIC.md](DATA_ANALYSIS_LOGIC.md) | Analysis algorithms, quality assessment, AI decision matrix |
| [COMPLETE_SPECIFICATIONS.md](COMPLETE_SPECIFICATIONS.md) | Full feature specifications with data flow diagrams |
| [API_REFERENCE.md](API_REFERENCE.md) | REST API endpoints and service interfaces |
| [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) | Design philosophy, theming, navigation, accessibility |
