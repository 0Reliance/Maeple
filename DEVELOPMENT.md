# MAEPLE Development Guide

**App Version**: 0.97.9  
**Last Updated**: February 9, 2026

This guide explains how to set up and run the MAEPLE (Mental And Emotional Pattern Literacy Engine) development environment, including the local Docker stack with PostgreSQL database.

---

## Prerequisites

| Requirement | Version | Purpose                           |
| ----------- | ------- | --------------------------------- |
| Node.js     | 22+     | JavaScript runtime                |
| npm         | 10+     | Package manager                   |
| Git         | 2.0+    | Version control                   |
| PostgreSQL  | 14+     | Database (optional for local dev) |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Required keys in .env:
# VITE_GEMINI_API_KEY=...       (primary AI provider)
# VITE_SUPABASE_URL=...         (production auth/sync)
# VITE_SUPABASE_ANON_KEY=...    (production auth/sync)
# See docs/QUICK_REFERENCE.md for full key list
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Local Docker Stack (Recommended)

The complete local development environment runs in Docker:

```bash
# Start the full stack
cd /opt/Maeple/deploy
docker-compose up -d

# Check status
docker ps

# View logs
docker logs deploy-api-1 --tail 50
```

### Services

| Container     | Port | Purpose                |
| ------------- | ---- | ---------------------- |
| deploy-db-1   | 5432 | PostgreSQL 16 database |
| deploy-api-1  | 3001 | Express API server     |
| deploy-web-1  | 80   | Production frontend    |

### Database

- **Database**: `maeple`
- **User**: `maeple_user`
- **Password**: `maeple_beta_2025`
- **Schema**: Initialized from `local_schema.sql`

### Access Points

- **Frontend**: http://localhost:80
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

### 4. Verify Installation

```bash
# Run health check
npm run health

# Check API health
curl http://localhost:3001/api/health

# Run type checking
npm run typecheck

# Run tests
npm run test:run
```

---

## Available Scripts

| Script              | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start development server     |
| `npm run build`     | Build for production         |
| `npm run preview`   | Preview production build     |
| `npm run typecheck` | TypeScript type checking     |
| `npm run test`      | Run tests (watch mode)       |
| `npm run test:run`  | Run tests once               |
| `npm run lint`      | Run ESLint                   |
| `npm run lint:fix`  | Fix ESLint errors            |
| `npm run format`    | Format code with Prettier    |
| `npm run check-all` | Run lint + typecheck + tests |

---

## Architecture Overview

### Technology Stack

| Layer      | Technology                      | Version  |
| ---------- | ------------------------------- | -------- |
| UI         | React + TypeScript              | 19.2 / 5.2+ |
| Build      | Vite                            | 7.2      |
| State      | Zustand                         | 5.0      |
| Styling    | Tailwind CSS                    | 3.4      |
| Routing    | React Router DOM                | 7.10     |
| Testing    | Vitest + React Testing Library  | 4.0      |
| Mobile     | Capacitor                       | 8.0      |
| AI Primary | Google Gemini 2.5 Flash         | Latest   |
| Backend    | Node.js + Express               | 22+ / 5  |
| Database   | PostgreSQL                      | 16       |
| Auth       | Supabase Auth (prod) / JWT (local) | —     |

### Directory Structure

```
src/
├── components/           # 40 React UI components (11,726 lines total)
│   ├── App.tsx              # Root application shell, routing, initialization
│   ├── JournalEntry.tsx     # Main journal + Energy Check-in (829 lines)
│   ├── JournalView.tsx      # Journal list/view wrapper
│   ├── HealthMetricsDashboard.tsx  # Patterns dashboard (1,044 lines)
│   ├── StateCheckWizard.tsx # Bio Mirror orchestrator (271 lines)
│   ├── StateCheckAnalyzing.tsx  # FACS analysis UI (501 lines)
│   ├── StateCheckResults.tsx    # Analysis results display (431 lines)
│   ├── StateCheckCamera.tsx     # Camera capture for calibration (226 lines)
│   ├── BiofeedbackCameraModal.tsx  # Camera modal portal (301 lines)
│   ├── BioCalibration.tsx   # Baseline calibration flow (203 lines)
│   ├── LiveCoach.tsx        # Voice intake / Mae companion (266 lines)
│   ├── Settings.tsx         # App settings (736 lines)
│   ├── ClinicalReport.tsx   # Professional PDF report (301 lines)
│   ├── AnalysisDashboard.tsx   # Analytics charts (162 lines)
│   ├── LandingPage.tsx      # Pre-auth landing (347 lines)
│   ├── AuthModal.tsx        # Sign in/up modal (329 lines)
│   ├── MobileNav.tsx        # Bottom navigation bar (226 lines)
│   ├── Guide.tsx            # Poziverse guide page (168 lines)
│   ├── VisionBoard.tsx      # Personal vision board (309 lines)
│   ├── SearchResources.tsx  # Resource search (234 lines)
│   ├── GentleInquiry.tsx    # Contextual follow-up questions (180 lines)
│   ├── ObjectiveObservation.tsx   # Objective data display (142 lines)
│   ├── PhotoObservations.tsx      # Bio Mirror photo results (242 lines)
│   ├── VoiceObservations.tsx      # Voice analysis results (189 lines)
│   ├── RecordVoiceButton.tsx      # Voice recording button (380 lines)
│   ├── QuickCaptureMenu.tsx       # Capture method selector (102 lines)
│   ├── CapacitySlider.tsx         # Energy Check-in slider (98 lines)
│   ├── AILoadingState.tsx         # AI processing overlay
│   ├── AIProviderSettings.tsx     # Multi-provider config (379 lines)
│   ├── AIProviderStats.tsx        # Provider usage stats (134 lines)
│   ├── CloudSyncSettings.tsx      # Sync configuration (413 lines)
│   ├── NotificationSettings.tsx   # Notification preferences (251 lines)
│   ├── ErrorBoundary.tsx          # React error boundary (288 lines)
│   ├── ErrorMessages.tsx          # Error display components (392 lines)
│   ├── StateTrendChart.tsx        # Capacity trend chart (101 lines)
│   ├── TimelineEntry.tsx          # Entry timeline item (179 lines)
│   ├── ToastNotification.tsx      # Toast system (220 lines)
│   ├── TypingIndicator.tsx        # Chat typing dots
│   ├── UserMenu.tsx               # User dropdown menu (109 lines)
│   ├── SyncIndicator.tsx          # Sync status display
│   ├── BetaDashboard.tsx          # Beta error log dashboard (198 lines)
│   ├── Roadmap.tsx                # Product roadmap (151 lines)
│   ├── Terms.tsx                  # Terms & legal (122 lines)
│   └── ui/                  # Shared UI primitives
│       ├── Badge.tsx, Button.tsx, Card.tsx, Icons.tsx, Input.tsx
│
├── services/             # Business logic services
│   ├── (22 core services, 7 AI adapters, 6 wearable adapters)
│   ├── ai/               # AI provider abstraction layer
│   │   ├── router.ts, types.ts, adapters/ (gemini, openai, anthropic, etc.)
│   ├── validation/       # Schema validation (Zod)
│   └── wearables/        # Wearable integrations (Oura, Apple, Garmin, etc.)
│
├── stores/               # Zustand state management (appStore, authStore, syncStore)
├── contexts/             # React contexts (DependencyContext, ObservationContext)
├── hooks/                # Custom hooks (useCameraCapture, usePWAInstall)
├── adapters/             # Service adapters with circuit breakers
├── patterns/             # Design patterns (CircuitBreaker, RequestBatcher)
├── workers/              # Web Workers (imageProcessor)
├── utils/                # Utility functions (12 modules)
├── factories/            # Factory pattern (dependencyFactory)
├── routes.ts             # Route definitions
├── types.ts              # Core TypeScript interfaces (291 lines)
└── index.tsx             # React entry point

tests/                    # Vitest test suites
api/                      # Express API server
deploy/                   # Docker configuration
```

---

## Key Design Patterns

### Circuit Breaker

All external service calls are wrapped in circuit breakers:

- **Closed**: Normal operation, requests pass through
- **Open**: Failure threshold exceeded, requests fail-fast
- **Half-Open**: After cooldown, one test request allowed

**Files**: `src/patterns/CircuitBreaker.ts`, `src/adapters/serviceAdapters.ts`

### Dependency Injection

Services injected via React context:

- **Factory**: `src/factories/dependencyFactory.ts`
- **Context**: `src/contexts/DependencyContext.tsx`
- **Hooks**: `useAIService()`, `useVisionService()`

### Local-First Storage

- **localStorage**: User settings, quick-access data
- **IndexedDB**: Large blobs (encrypted images), offline queue
- **Cloud**: Supabase (optional sync via `syncService.ts`)

### AI Provider Abstraction

- **Router**: `src/services/ai/router.ts` — capability-based selection
- **Adapters**: Each provider implements `BaseAIAdapter`
- **Fallback Chain**: Gemini → OpenAI → Anthropic → Z.ai

---

## Testing

Vitest with `--pool=forks` (required):

```bash
npx vitest run --pool=forks              # All tests
npx vitest run tests/components/ --pool=forks  # Component tests
npx vitest run --coverage --pool=forks   # With coverage
```

---

## Routes and Navigation

| Path             | Component                  | Lazy Loaded |
| ---------------- | -------------------------- | ----------- |
| `/journal`       | JournalView                | No          |
| `/dashboard`     | HealthMetricsDashboard     | Yes         |
| `/bio-mirror`    | StateCheckWizard           | Yes         |
| `/coach`         | LiveCoach                  | Yes         |
| `/vision`        | VisionBoard                | Yes         |
| `/resources`     | SearchResources            | No          |
| `/settings`      | Settings                   | Yes         |
| `/guide`         | Guide                      | No          |
| `/terms`         | Terms                      | No          |
| `/roadmap`       | Roadmap                    | No          |
| `/beta-dashboard`| BetaDashboard              | Yes         |

---

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| TypeScript errors | `npm run typecheck` |
| Test failures | `npx vitest run --pool=forks` (not `--no-threads`) |
| Build failures | `npm run build` |
| Onboarding loop | Clear `localStorage.getItem('maeple_onboarding_complete')` |

---

## Code Quality Standards

- TypeScript strict mode enabled
- ESLint with React hooks rules
- Prettier for consistent formatting
- Test coverage for core functionality
- Accessibility standards (keyboard navigation, ARIA labels)
