
# MAEPLE Developer Quick Reference

Welcome to the MAEPLE codebase—a professional, world-class product built for neuro-affirming digital health. This reference is your guide to contributing, extending, and deploying with pride.


## 🚀 Daily Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Verify setup
./verify-setup.sh
```

## 📁 Project Structure

```
pozimind/
├── components/          # React components
│   ├── ErrorBoundary.tsx
│   ├── JournalEntry.tsx
│   ├── StateCheckWizard.tsx
│   └── ...
├── services/           # Business logic
│   ├── ai/                    # Multi-provider AI layer
│   │   ├── adapters/          # Provider adapters (Gemini, OpenAI, Anthropic, Perplexity, OpenRouter, Ollama, Z.ai)
│   │   ├── router.ts          # Capability routing (text/vision/image/search/audio)
│   │   ├── settingsService.ts # Encrypted provider config
│   │   └── types.ts           # AI types & capabilities
│   ├── geminiService.ts       # AI parsing (rate-limited via rateLimiter)
│   ├── geminiVisionService.ts # Vision AI (rate-limited via rateLimiter)
│   ├── stateCheckService.ts   # Bio-Mirror storage
│   ├── storageService.ts      # LocalStorage
│   ├── analytics.ts           # Pattern engine
│   ├── comparisonEngine.ts    # Subjective vs Objective
│   ├── rateLimiter.ts         # API rate limiting (55/min, 1400/day)
│   ├── validationService.ts   # Runtime data validation
│   ├── errorLogger.ts         # Centralized error tracking
│   ├── offlineQueue.ts        # Offline request queue (IndexedDB)
│   └── encryptionService.ts   # AES-GCM encryption
├── stores/              # Zustand state management
│   ├── appStore.ts            # Main app state (entries, view, etc.)
│   ├── authStore.ts           # Authentication state
│   ├── syncStore.ts           # Cloud sync state
│   └── index.ts               # Store exports
├── tests/               # Test suites (112 tests)
│   ├── analytics.test.ts      # Analytics tests (27)
│   ├── encryption.test.ts     # Encryption tests (14)
│   ├── validation.test.ts     # Validation tests (27)
│   ├── rateLimiter.test.ts    # Rate limiter tests (14)
│   ├── errorLogger.test.ts    # Error logger tests (15)
│   ├── offlineQueue.test.ts   # Offline queue tests (15)
│   └── setup.ts               # Test setup
├── App.tsx             # Main app component
├── types.ts            # TypeScript interfaces
├── index.tsx           # Entry point
└── .env                # Environment config (not committed)
```

## 🔑 Environment Variables

```env
# Required for Gemini (default provider)
VITE_GEMINI_API_KEY=your_key_here

# The app reads env in browser via import.meta.env and process.env fallbacks.
# Other providers (OpenAI, Anthropic, Perplexity, OpenRouter, Ollama, Z.ai) are configured via Settings → AI Providers and stored encrypted locally (not env-based).
```

## 🎯 Key Features & Components

### Smart Journal (`JournalEntry.tsx`)
- Multi-dimensional capacity tracking
- Voice input support
- AI-powered parsing via aiRouter (Supports Gemini, OpenAI, Anthropic, OpenRouter, Ollama)

### Bio-Mirror (`StateCheckWizard.tsx`)
- Camera-based facial analysis
- Encrypted storage in IndexedDB
- Baseline calibration support
- Comparison with journal entries
- Routes through aiRouter with Gemini fallback

### Pattern Dashboard (`HealthMetricsDashboard.tsx`)
- Burnout trajectory forecasting
- Cognitive load analysis
- Masking detection trends
- Hormonal cycle sync

### Live Coach (`LiveCoach.tsx`)
- Voice-first companion
- Uses `aiRouter.connectLive()` for provider-agnostic audio streaming
- Currently supports Gemini Live; extensible for OpenAI Realtime

### Sync Service (`syncService.ts`)
- Hybrid offline-first strategy
- "Last Write Wins" conflict resolution using `updatedAt` timestamps
- Background sync with Supabase
- Offline queue for pending changes

### Data Migration (`migrationService.ts`)
- Handles rebrand migration (Pozimind -> Maeple)
- Manages schema versioning (e.g., backfilling `updatedAt`)
- Runs automatically on app startup
- Real-time conversation with inline mic permission/status hints

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict mode) |
| State | Zustand 5 (appStore, authStore, syncStore) |
| Build | Vite 5 (16-chunk code splitting) |
| Styling | Tailwind CSS 3 |
| AI | Multi-provider router (Gemini + OpenAI live; others scaffolded) |
| Storage | LocalStorage + IndexedDB |
| Encryption | Web Crypto API (AES-GCM) |
| Icons | Lucide React |
| Charts | Recharts |
| Testing | Vitest + React Testing Library (112 tests) |

## 🆕 Core Services

### Rate Limiter (`services/rateLimiter.ts`)
Queue-based rate limiting for Gemini API calls.
```typescript
import { rateLimitedCall } from './services/rateLimiter';

// Wrap any API call
const result = await rateLimitedCall(() => ai.models.generateContent({...}));

// Check usage stats
import { getRateLimiterStats } from './services/rateLimiter';
const stats = getRateLimiterStats(); // { minute: 5, day: 150, lastMinuteReset: ... }
```

### Validation Service (`services/validationService.ts`)
Runtime validation for data loaded from storage.
```typescript
import { validateHealthEntry, validateUserSettings } from './services/validationService';

// Validates and sanitizes, returns safe defaults for missing/invalid data
const entry = validateHealthEntry(rawData);
const settings = validateUserSettings(rawData);
```

### Error Logger (`services/errorLogger.ts`)
Centralized error tracking with external endpoint support.
```typescript
import { errorLogger, logBoundaryError } from './services/errorLogger';

// Log errors with context
errorLogger.error('Operation failed', error, { component: 'JournalEntry' });

// In ErrorBoundary
logBoundaryError(error, { componentStack: errorInfo.componentStack });

// Configure external endpoint (Sentry-like)
errorLogger.setExternalEndpoint('https://your-error-service.com/api/log');
```

### Offline Queue (`services/offlineQueue.ts`)
IndexedDB-backed request queue for offline support.
```typescript
import { offlineQueue, withOfflineSupport } from './services/offlineQueue';

// Register handlers for request types
offlineQueue.registerHandler('journal', async (payload) => {
  return await api.saveJournal(payload);
});

// Wrap API calls with offline support
const result = await withOfflineSupport('journal', payload, async () => {
  return await api.saveJournal(payload);
});
```

## 🔒 Data Storage

```typescript
// LocalStorage (plain text)
- User settings (cycle dates, preferences)
- Journal entries
- Wearable data points

// IndexedDB (encrypted)
- State Check images (Blob)
- Facial analysis results (encrypted with AES-GCM)
- Baseline calibration data
```

## 🧪 Testing

MAEPLE has 112 tests across 6 test suites.

```bash
# Run all tests
npm run test:run

# Watch mode
npm run test

# Coverage report
npm run test:coverage
```

### Test Suites
| Suite | Tests | Coverage |
|-------|-------|----------|
| analytics.test.ts | 27 | Insights, burnout trajectory, cognitive load |
| encryption.test.ts | 14 | AES-GCM, key management, encoding |
| validation.test.ts | 27 | HealthEntry, UserSettings, StateCheck |
| rateLimiter.test.ts | 14 | Queue, rate limits, stats |
| errorLogger.test.ts | 15 | Logging, buffer, external endpoints |
| offlineQueue.test.ts | 15 | IndexedDB queue, handlers |

### Testing Checklist

Before committing major changes:

```bash
# 1. Type check
npm run build

# 2. Run tests
npm run test:run

# 3. Test key flows
- [ ] Journal entry submission
- [ ] State Check capture
- [ ] Camera/mic permissions
- [ ] Data persistence
- [ ] Mobile responsive layout
- [ ] Error boundary triggers

# 4. Check browser console
- [ ] No errors in console
- [ ] API calls succeed
- [ ] No infinite loops
```

## 🐛 Common Issues

### API Key Not Working
```bash
# Check .env file exists
ls -la .env

# Check variable name (must be VITE_*)
cat .env | grep VITE_GEMINI_API_KEY

# Restart dev server after .env changes
npm run dev
```

### Build Fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Camera Not Working
- Must use HTTPS or localhost
- Check browser permissions (🔒 icon in address bar)
- Try different browser (Chrome/Edge recommended)

## 📊 API Usage

### Gemini Models Used

```typescript
// Text Analysis (Journal Parsing)
"gemini-2.5-flash" 

// Vision Analysis (Bio-Mirror, Visual Therapy)
"gemini-2.5-flash-image"

// Voice Conversation (Live Coach)
"gemini-2.5-flash-native-audio-preview"

// Search (Resources)
"gemini-2.5-flash" with googleSearch tool
```

### Rate Limits (Implemented)
MAEPLE includes built-in rate limiting via `rateLimiter.ts`:
- 55 requests per minute (with 5 burst buffer)
- 1400 requests per day
- Automatic queuing and retry with exponential backoff
- Stats persisted to localStorage

## 🎨 Styling Conventions

```tsx
// Container
className="max-w-5xl mx-auto space-y-6"

// Card
className="bg-white rounded-2xl shadow-lg p-6"

// Button Primary
className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"

// Button Secondary
className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300"

// Text Hierarchy
className="text-2xl font-bold text-slate-900"  // Heading
className="text-slate-600"                      // Body
className="text-sm text-slate-500"             // Caption
```


## 📦 Deployment

See [README.md](./README.md#deployment) for full deployment instructions. Always set environment variables securely on your hosting platform. Use HTTPS for all production deployments.


## 📚 Documentation Files

- [README.md](./README.md) — Project overview, mission, features, deployment
- [SETUP.md](./SETUP.md) — Complete setup guide
- [HOW_TO_USE.md](./HOW_TO_USE.md) — User guide and best practices
- [ROADMAP.md](./ROADMAP.md) — Feature roadmap (all complete!)
- [CHANGELOG.md](./CHANGELOG.md) — Recent changes
- [DEV_REFERENCE.md](./DEV_REFERENCE.md) — This file

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly (see checklist above)
4. Update relevant documentation
5. Submit PR with clear description

---


---

**Questions?** Check SETUP.md or README.md
**Need help?** Open a GitHub issue

---

*Proudly built for the future of neuro-affirming care. Every contribution matters.*
