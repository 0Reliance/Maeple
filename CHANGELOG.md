# POZIMIND Changelog

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
