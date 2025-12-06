
# POZIMIND Developer Quick Reference

Welcome to the POZIMIND codebase—a professional, world-class product built for neuro-affirming digital health. This reference is your guide to contributing, extending, and deploying with pride.


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
│   │   ├── adapters/          # Provider adapters (Gemini, OpenAI, Anthropic, Perplexity, OpenRouter, Ollama, Z.ai stubs)
│   │   ├── router.ts          # Capability routing (text/vision/image/search/audio)
│   │   ├── settingsService.ts # Encrypted provider config
│   │   └── types.ts           # AI types & capabilities
│   ├── geminiService.ts      # AI parsing (routes via aiRouter, Gemini fallback)
│   ├── geminiVisionService.ts # Vision AI (routes via aiRouter, Gemini fallback)
│   ├── stateCheckService.ts  # Bio-Mirror storage
│   ├── storageService.ts     # LocalStorage
│   ├── analytics.ts          # Pattern engine
│   └── comparisonEngine.ts   # Subjective vs Objective
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
- AI-powered parsing via aiRouter (Gemini + OpenAI now; other providers pending)

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
- Currently Gemini Live Audio only (router audio streaming plumbed; other providers pending)
- Real-time conversation with inline mic permission/status hints

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| AI | Multi-provider (Gemini + OpenAI shipped; Anthropic/Perplexity/OpenRouter/Ollama/Z.ai adapters scaffolded). Router-enabled for text/vision/image/search/audio; audio UX currently Gemini Live-only. Beta v5 release. |
| Storage | LocalStorage + IndexedDB |
| Encryption | Web Crypto API (AES-GCM) |
| Icons | Lucide React |
| Charts | Recharts |

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

## 🧪 Testing Checklist

Before committing major changes:

```bash
# 1. Type check
npm run build

# 2. Test key flows
- [ ] Journal entry submission
- [ ] State Check capture
- [ ] Camera/mic permissions
- [ ] Data persistence
- [ ] Mobile responsive layout
- [ ] Error boundary triggers

# 3. Check browser console
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

### Rate Limits (Free Tier)
- 60 requests per minute
- 1500 requests per day
- Add delays for rapid requests

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
