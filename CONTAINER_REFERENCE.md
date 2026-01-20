# MAEPLE Development Container Reference

> **AI Context Document** - This file provides comprehensive information about the development container, project structure, and available services for AI assistants working with this codebase.

---

## 📦 Container Information

| Property              | Value                          |
| --------------------- | ------------------------------ |
| **Hostname**          | `maeple-dev`                   |
| **Primary IP**        | `192.168.1.192`                |
| **Docker Bridge IPs** | `172.17.0.1`, `172.18.0.1`     |
| **OS**                | Debian GNU/Linux 12 (bookworm) |
| **Kernel**            | Linux 6.1.0-41-amd64           |
| **Architecture**      | x86_64                         |
| **User**              | root                           |
| **Working Directory** | `/opt/Maeple`                  |

### System Resources

| Resource | Available                            |
| -------- | ------------------------------------ |
| **RAM**  | 12 GB total, ~8.4 GB available       |
| **Disk** | 100 GB total, ~72 GB free            |
| **Swap** | None configured                      |

---

## 🛠️ Development Environment

### Runtime Versions

| Tool           | Version  |
| -------------- | -------- |
| **Node.js**    | v22.21.0 |
| **npm**        | 10.9.4   |
| **TypeScript** | 5.9.3    |
| **Docker**     | 29.1.3   |

### Environment Variables

The following environment variables are configured in `.env`:

| Variable                 | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL for backend services       |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key for client auth          |
| `VITE_APP_NAME`          | Application display name                        |
| `VITE_APP_ENV`           | Environment identifier (development/production) |
| `VITE_DEFAULT_THEME`     | Default UI theme setting                        |

**Optional AI Provider Keys** (configure as needed):

- `VITE_GEMINI_API_KEY` - Google Gemini AI
- `VITE_OPENAI_API_KEY` - OpenAI
- `VITE_ANTHROPIC_API_KEY` - Anthropic Claude
- `VITE_PERPLEXITY_API_KEY` - Perplexity AI
- `VITE_OPENROUTER_API_KEY` - OpenRouter

---

## 📁 Project Overview

**MAEPLE** (Mental And Emotional Pattern Literacy Engine) is a neuro-affirming health intelligence platform designed for users with ADHD, Autism, or CPTSD. Version: **0.97.7**

### Technology Stack

| Layer                | Technology                  |
| -------------------- | --------------------------- |
| **Frontend**         | React 19.2, TypeScript 5.2+ |
| **Build Tool**       | Vite 7.2                    |
| **Styling**          | Tailwind CSS 3.4            |
| **State Management** | Zustand 5.0                 |
| **Routing**          | React Router 7.10           |
| **Database**         | PostgreSQL 16 (Local Docker) + Supabase (Production) |
| **Local Storage**    | IndexedDB (idb 8.0)         |
| **Testing**          | Vitest 4.0, Testing Library |
| **Mobile**           | Capacitor 8.0 (iOS/Android) |

### Directory Structure

```
/opt/Maeple/
├── src/                    # Application source code
│   ├── adapters/           # Service adapters for dependency injection
│   ├── components/         # React UI components
│   ├── contexts/           # React contexts (DI, Observations)
│   ├── factories/          # Dependency factory
│   ├── hooks/              # Custom React hooks
│   ├── patterns/           # Design patterns (CircuitBreaker)
│   ├── services/           # Business logic services
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── workers/            # Web Workers
├── tests/                  # Test suites (246 tests)
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
├── android/                # Android Capacitor project
├── ios/                    # iOS Capacitor project
├── deploy/                 # Docker deployment configs
└── database/               # SQL schema files
```

---

## 🔧 Available NPM Scripts

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Start Vite development server              |
| `npm run start`         | Health check + dev server                  |
| `npm run build`         | TypeScript compile + Vite production build |
| `npm run preview`       | Preview production build locally           |
| `npm run test`          | Run Vitest in watch mode                   |
| `npm run test:run`      | Run tests once                             |
| `npm run test:coverage` | Run tests with coverage report             |
| `npm run test:ai`       | Test AI provider connectivity              |
| `npm run lint`          | ESLint check                               |
| `npm run lint:fix`      | Auto-fix lint issues                       |
| `npm run format`        | Prettier format all files                  |
| `npm run typecheck`     | TypeScript type checking                   |
| `npm run check-all`     | Lint + typecheck + tests                   |
| `npm run analyze`       | Analyze bundle size                        |

---

## 🏗️ Service Architecture

### Core Services (`src/services/`)

#### Authentication & User Management

| Service            | File                | Description                                                                    |
| ------------------ | ------------------- | ------------------------------------------------------------------------------ |
| **AuthService**    | `authService.ts`    | Handles Supabase authentication, session management, login/logout/signup flows |
| **SupabaseClient** | `supabaseClient.ts` | Supabase client configuration and connection                                   |

#### AI & Analysis Services

| Service                  | File                      | Description                                               |
| ------------------------ | ------------------------- | --------------------------------------------------------- |
| **AI Router**            | `ai/router.ts`            | Routes AI requests to appropriate providers with fallback |
| **GeminiService**        | `geminiService.ts`        | Google Gemini text/chat AI integration                    |
| **GeminiVisionService**  | `geminiVisionService.ts`  | FACS-based facial analysis, image generation              |
| **AudioAnalysisService** | `audioAnalysisService.ts` | Voice recording analysis (noise, tone, pace)              |
| **CorrelationService**   | `correlationService.ts`   | Correlates subjective reports with objective observations |
| **ComparisonEngine**     | `comparisonEngine.ts`     | Compares baseline data with current state                 |

#### Data & Storage Services

| Service              | File                  | Description                                     |
| -------------------- | --------------------- | ----------------------------------------------- |
| **StorageService**   | `storageService.ts`   | Local storage for journal entries and settings  |
| **CacheService**     | `cacheService.ts`     | Multi-layer caching (L1: Memory, L2: IndexedDB) |
| **DraftService**     | `draftService.ts`     | Auto-save journal drafts every 30 seconds       |
| **SyncService**      | `syncService.ts`      | Offline-first sync with cloud backend           |
| **ExportService**    | `exportService.ts`    | Data export/import functionality                |
| **MigrationService** | `migrationService.ts` | Data schema migrations                          |

#### Infrastructure Services

| Service            | File                | Description                              |
| ------------------ | ------------------- | ---------------------------------------- |
| **CircuitBreaker** | `circuitBreaker.ts` | Prevents cascading failures in API calls |
| **RateLimiter**    | `rateLimiter.ts`    | API rate limiting with queuing           |
| **OfflineQueue**   | `offlineQueue.ts`   | Queues operations when offline           |
| **BackgroundSync** | `backgroundSync.ts` | Service worker background sync           |
| **ErrorLogger**    | `errorLogger.ts`    | Structured error logging and analytics   |

#### Feature Services

| Service                 | File                     | Description                                    |
| ----------------------- | ------------------------ | ---------------------------------------------- |
| **StateCheckService**   | `stateCheckService.ts`   | Bio-Mirror state check and baseline management |
| **NotificationService** | `notificationService.ts` | Push notifications and reminders               |
| **UserFeedbackService** | `userFeedbackService.ts` | User feedback collection                       |
| **ImageWorkerManager**  | `imageWorkerManager.ts`  | Web Worker image compression                   |
| **Analytics**           | `analytics.ts`           | Usage analytics and metrics                    |
| **EncryptionService**   | `encryptionService.ts`   | AES-GCM 256-bit encryption for sensitive data  |
| **ValidationService**   | `validationService.ts`   | Input validation with Zod schemas              |
| **APIClient**           | `apiClient.ts`           | HTTP client for backend API calls              |

### AI Provider Adapters (`src/services/ai/adapters/`)

| Adapter               | Description                    |
| --------------------- | ------------------------------ |
| **GeminiAdapter**     | Google Gemini Pro/Flash models |
| **OpenAIAdapter**     | OpenAI GPT models              |
| **AnthropicAdapter**  | Anthropic Claude models        |
| **PerplexityAdapter** | Perplexity search-augmented AI |
| **OpenRouterAdapter** | OpenRouter multi-model routing |
| **OllamaAdapter**     | Local Ollama models            |
| **ZaiAdapter**        | Z.ai integration               |

---

## 🔌 Context Providers

| Context                | File                              | Purpose                                              |
| ---------------------- | --------------------------------- | ---------------------------------------------------- |
| **DependencyContext**  | `contexts/DependencyContext.tsx`  | Dependency injection for all services                |
| **ObservationContext** | `contexts/ObservationContext.tsx` | Unified data flow for visual/audio/text observations |

---

## 📊 State Stores (Zustand)

| Store         | File                  | Purpose                                          |
| ------------- | --------------------- | ------------------------------------------------ |
| **AppStore**  | `stores/appStore.ts`  | Main application state (entries, settings, view) |
| **AuthStore** | `stores/authStore.ts` | Authentication state                             |
| **SyncStore** | `stores/syncStore.ts` | Sync status and pending changes                  |

---

## 🧪 Testing

- **Test Framework**: Vitest 4.0
- **Test Count**: 246 tests (all passing)
- **Coverage**: Available via `npm run test:coverage`

Test directories:

- `tests/` - Unit and integration tests
- `tests/components/` - Component tests
- `tests/services/` - Service tests
- `tests/patterns/` - Pattern tests
- `tests/integration/` - End-to-end tests

---

## 🚀 Quick Start Commands

```bash
# Start development server
npm run dev

# Run all tests
npm run test:run

# Type check
npm run typecheck

# Full validation
npm run check-all

# Build for production
npm run build
```

---

## 📝 Key Files for AI Context

| File                          | Purpose                       |
| ----------------------------- | ----------------------------- |
| `README.md`                   | Project overview and features |
| `CODEBASE_REVIEW_CONCERNS.md` | Resolved issues and fixes     |
| `src/types.ts`                | Core TypeScript interfaces    |
| `src/App.tsx`                 | Main application entry point  |
| `package.json`                | Dependencies and scripts      |
| `tsconfig.json`               | TypeScript configuration      |
| `vite.config.ts`              | Build configuration           |

---

## 🔒 Security Notes

- All sensitive data encrypted with AES-GCM 256-bit
- Supabase Row Level Security (RLS) enabled
- API keys stored in environment variables (never committed)
- Offline-first architecture - data stays on device by default

---

_Last Updated: January 6, 2026_
_Container: maeple-dev @ 192.168.1.192_
