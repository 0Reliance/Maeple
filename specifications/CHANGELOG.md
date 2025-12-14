# MAEPLE Changelog

## v1.5.0 (Current)

**Status**: 🚧 In Progress

### 🚀 New Features

- **AI Expansion**: Fully implemented adapters for **Perplexity** (Search/Chat), **OpenRouter** (Claude 3.5/Vision), and **Ollama** (Local Llama 3.2).
- **Export Optimization**: Added option to exclude images from JSON exports to prevent browser crashes with large datasets.
- **Multi-Provider Audio Routing**: Abstracted Live Coach audio session handling to support multiple AI providers (currently implementing Gemini Live).
- **AI Usage Tracking**: Added persistence for request counts, errors, and last usage time per provider.
- **Robust Data Migration**: Decoupled schema migrations from rebrand logic to ensure data integrity (e.g., `updatedAt` backfilling) for all users.

### 🎨 UX & Polish

- **Mobile-First Navigation**: Removed desktop sidebar in favor of a unified bottom navigation bar for all devices.
- **Dark Mode**: Implemented full dark mode support with system preference detection and manual toggle in Settings.
- **Theme UI**: Added Appearance section to Settings.
- **Visual Feedback**: Added `TypingIndicator` and `AILoadingState` overlays to `LiveCoach` and `VisionBoard` for better user feedback during AI operations.
- **Accessibility**: Added ARIA labels and roles to loading states and indicators.

### 🛠️ Improvements

- **Settings UI**: Updated Data Management section with export options.
- **AI Architecture**: Added `connectLive` capability to `BaseAIAdapter` and `AIRouter`.
- **Sync Reliability**: Verified "Last Write Wins" conflict resolution strategy.
- **Testing**: Added unit tests for `LiveCoach` and new AI adapters (Perplexity, OpenRouter, Ollama). Verified full suite (180+ tests passing).

## v1.4.0 (December 8, 2025)

**Status**: ✅ Production Ready

### 🚀 Major Improvements

#### TypeScript Strict Mode

- Enabled full TypeScript strict mode (`strict: true`, `strictNullChecks`, `strictFunctionTypes`)
- Fixed all type errors across the codebase
- Improved type safety and IDE support

#### API Rate Limiting (`services/rateLimiter.ts`)

- Queue-based rate limiter for Gemini API calls
- 55 requests/minute, 1400 requests/day limits
- Automatic retry with exponential backoff
- Daily usage stats persisted to localStorage
- Integrated into `geminiService.ts` and `geminiVisionService.ts`

#### Data Validation (`services/validationService.ts`)

- Runtime validation for all data loaded from localStorage/IndexedDB
- Type guards and sanitization with safe defaults
- Validates: HealthEntry, UserSettings, StateCheck, WearableDataPoint, CapacityProfile, NeuroMetrics, FacialAnalysis
- Prevents corrupted data from crashing the app

#### Error Logging (`services/errorLogger.ts`)

- Centralized error tracking service
- In-memory buffer with localStorage persistence
- Global error and unhandledrejection handlers
- Support for external endpoints (Sentry-like)
- Integrated into ErrorBoundary component

#### Offline Queue (`services/offlineQueue.ts`)

- IndexedDB-backed request queue for offline support
- Automatic retry when back online
- Handler registration pattern for different request types
- `withOfflineSupport()` wrapper for easy integration

#### State Management (Zustand)

- New stores: `appStore.ts`, `authStore.ts`, `syncStore.ts`
- Migrated App.tsx state to Zustand
- Improved code organization and testability

#### Code Splitting

- Granular chunk splitting in `vite.config.ts`
- 16 separate chunks (was 1 monolithic bundle)
- Feature-based chunks: coach, vision, statecheck, settings, clinical, dashboard
- Library chunks: vendor, icons, ai-sdk, storage, charts
- Largest chunk: 397KB (charts) - all under 500KB limit

#### Testing Infrastructure

- 112 tests across 6 test suites
- Test files: analytics, encryption, validation, rateLimiter, errorLogger, offlineQueue
- Vitest + React Testing Library
- Coverage reporting enabled

### 📦 Bundle Analysis

| Chunk              | Size        | Gzip        |
| ------------------ | ----------- | ----------- |
| charts             | 397 KB      | 100 KB      |
| services           | 245 KB      | 64 KB       |
| vendor             | 168 KB      | 52 KB       |
| ai-sdk             | 148 KB      | 24 KB       |
| components         | 67 KB       | 18 KB       |
| ai-services        | 38 KB       | 9 KB        |
| feature-settings   | 21 KB       | 5 KB        |
| icons              | 18 KB       | 6 KB        |
| feature-dashboard  | 17 KB       | 5 KB        |
| feature-statecheck | 13 KB       | 4 KB        |
| feature-clinical   | 9 KB        | 3 KB        |
| feature-vision     | 7 KB        | 2 KB        |
| feature-coach      | 6 KB        | 3 KB        |
| **Total**          | **~1.2 MB** | **~310 KB** |

### 🔧 Fixes

- Fixed LucideIcon type errors across components
- Fixed Session type import in LiveCoach
- Fixed SpeechRecognition types in RecordVoiceButton
- Fixed grounding types in SearchResources
- Fixed CapacityProfile index signature
- Fixed FacialAnalysis type guards in stateCheckService
- Fixed streamAudio return type in AI service

---

## Beta v5 (December 6, 2025)

**Status**: ✅ Ready for beta

### Highlights

- Multi-provider AI router: Gemini + OpenAI live; Anthropic, Perplexity, OpenRouter, Ollama, Z.ai adapters scaffolded and registered.
- Capability-based fallback: router now tries all eligible providers per capability with graceful logging.
- Audio: Gemini Live remains the audio path; router audio selection plumbed for future providers; Live Coach UX now surfaces provider/mic requirements.
- Journal UX: Added capture guidance, mic hints, and disabled-state helper for Capture.
- Env: Gemini key resolved via `import.meta.env` fallback; setup docs updated; optional providers configured in-app and stored encrypted.

### Fixed / Improved

- Live Coach handles missing keys and mic permission failures with clearer status notes.
- OpenAI capabilities trimmed to implemented surfaces (text/vision/image) to avoid false audio expectations.

### How to install (fresh)

```bash
git clone https://github.com/genpozi/pozimind.git
cd pozimind
npm install
cp .env.example .env
# add VITE_GEMINI_API_KEY=your_key
npm run dev
```

Add other provider keys in-app: Settings → AI Providers.

---

## Alpha v1.1 (previous)

## Changes Made

### 🔧 Critical Fixes

1. **Environment Configuration** ✅

   - Fixed Vite environment variable handling
   - Updated `vite.config.ts` to properly expose `VITE_GEMINI_API_KEY` as `process.env.API_KEY`
   - Created `.env.example` template for developers
   - Created `.env` file with placeholder (requires user's actual API key)

2. **Metadata Fix** ✅

   - Changed project name from "BROKEN POZIMIND" to "POZIMIND"
   - Updated `metadata.json`

3. **Build Configuration** ✅

   - Fixed JSX syntax error in `Guide.tsx` (escaped `>` character)
   - Installed missing `@types/node` dependency
   - Optimized Tailwind content configuration to avoid scanning `node_modules`
   - Build now completes successfully

4. **Error Handling** ✅

   - Added comprehensive `ErrorBoundary` component
   - Integrated error boundary into app entry point (`index.tsx`)
   - Added API key validation with helpful error messages in Gemini services
   - Error boundary provides setup instructions for API key issues

5. **Git Configuration** ✅
   - Enhanced `.gitignore` with comprehensive patterns
   - Added environment files to ignore list
   - Added build artifacts and editor configs

### 📚 Documentation

1. **New Files**

   - `SETUP.md` - Comprehensive setup guide with troubleshooting
   - `.env.example` - Template for environment configuration
   - `components/ErrorBoundary.tsx` - Error boundary component
   - `CHANGELOG.md` - This file

2. **Updated Files**
   - `README.md` - Updated installation instructions with link to SETUP.md
   - `.gitignore` - Added comprehensive ignore patterns

### 🔍 Code Quality Improvements

1. **Type Safety**

   - All TypeScript errors resolved
   - Build passes successfully
   - Added `@types/node` for Node.js type definitions

2. **API Configuration**

   - Centralized API key validation
   - Better error messages for missing/invalid API keys
   - Clear setup instructions in error states

3. **Performance**
   - Optimized Tailwind CSS content scanning
   - Reduced build warnings

## Verification Results

### Build Status

```
✅ TypeScript compilation: SUCCESS
✅ Vite build: SUCCESS
✅ Bundle size: 944.80 kB (acceptable for feature-rich app)
⚠️  Chunk size warning (informational - not a blocker)
```

### File Structure

```
✅ .env.example created
✅ .env created (needs user API key)
✅ .gitignore comprehensive
✅ ErrorBoundary component added
✅ SETUP.md guide created
```

## Setup Required by User

Users must perform ONE step before running the app:

1. **Add Gemini API Key**
   ```bash
   # Edit .env file
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
   Get free API key from: https://aistudio.google.com/app/apikey

## Testing Checklist

Before deploying to production, verify:

- [ ] Dev server starts: `npm run dev`
- [ ] Build completes: `npm run build`
- [ ] API key validation works (test with invalid key)
- [ ] Error boundary displays properly
- [ ] Camera permission prompt works (Bio-Mirror)
- [ ] Microphone permission prompt works (Live Coach, Voice Journal)
- [ ] Journal entry submission works
- [ ] State Check (Bio-Mirror) photo capture works
- [ ] Data persists in LocalStorage/IndexedDB
- [ ] Mobile responsive layout works
- [ ] PWA manifest is valid

## Known Limitations

1. **Bundle Size** - 944 KB is large but acceptable for feature-rich app

   - Future optimization: Consider code splitting for routes
   - Future optimization: Lazy load heavy components (Live Coach, Vision)

2. **API Key Security** - Currently exposed in client-side code

   - This is normal for client-side apps with user-provided keys
   - Consider adding a proxy server for production deployments

3. **Browser Support** - Requires modern browser with:
   - IndexedDB support
   - Web Crypto API
   - Camera/Microphone APIs
   - ES2022 support

## Next Steps for Development

1. **Immediate**

   - User adds their API key to `.env`
   - Test all features with real API key
   - Verify camera/mic permissions work

2. **Short Term**

   - Add unit tests for critical services
   - Add integration tests for journal flow
   - Set up CI/CD pipeline

3. **Future Enhancements**
   - Code splitting for better performance
   - Service worker for offline support
   - Data export/import functionality
   - Backup sync options

## Migration Notes

If upgrading from an earlier version:

1. No database migrations needed (v1.1 schema unchanged)
2. Environment variable renamed: Use `VITE_GEMINI_API_KEY` instead of `API_KEY`
3. Restart dev server after updating `.env`

---

**Status**: ✅ STABLE - Ready for continued development
**Tested**: Build successful, no TypeScript errors
**Breaking Changes**: Environment variable naming only
