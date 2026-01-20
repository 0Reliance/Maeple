# MAEPLE Memory Bank

**Last Updated**: January 20, 2026  
**Current Version**: 0.97.7 (Sidebar Removal, Navigation Simplification, Card Interaction Fix)

## 1. Project Context

MAEPLE started as a local-only prototype and evolved into a "Production-Ready Enterprise Full-Stack System". The transition involved moving from pure LocalStorage to a hybrid Sync model with a Local API.

## 2. Key Architectural Decisions

### Card Interaction Fix (v0.97.7) - CRITICAL

**Problem**: Energy Check-in sliders, textarea, and buttons unclickable on Capture screen.

**Root Cause**:
- `.card` CSS class missing `position: relative`
- Absolute children (sliders, overlays, buttons) positioned incorrectly
- Aggressive hover transforms caused touch/click issues

**Solution**:
- Added `relative` to `.card` base styles in `index.css`
- Removed transform from default card hover
- Added `.card-hoverable` class for cards that need scale effect
- Changed Card component `hoverable` default to `false`

**Key Files**:
- `src/index.css` - Card base styles
- `src/components/ui/Card.tsx` - Hoverable prop default

### Complete Codebase Review (v0.97.6) - CRITICAL

**Problem**: 25 issues identified during comprehensive codebase review.

**Solution**: Three-phase implementation resolving all issues:

| Phase   | Focus               | Issues Resolved                                                 |
| ------- | ------------------- | --------------------------------------------------------------- |
| Phase 1 | Critical fixes      | ObservationContext, progress callbacks, memory leaks, dead code |
| Phase 2 | Medium/low priority | Camera auto-start, Supabase config, AI validation, typed mocks  |
| Phase 3 | Deferred items      | Accessibility fix, typed test utilities                         |

**Key Improvements**:

- `src/contexts/ObservationContext.tsx` - Now wired into App.tsx
- `src/services/draftService.ts` - Integrated with `useDraft()` hook
- `src/services/correlationService.ts` - Integrated on entry save
- `src/components/JournalEntry.tsx` - Zod validation for AI responses
- `tests/test-utils.tsx` - Typed mock factory functions

### Camera Architecture (v2.2.3) - CRITICAL

**Problem**: Camera flickered constantly, making Bio-Mirror unusable.

**Solution Stack** (cumulative):
| Version | Problem | Solution |
|---------|---------|----------|
| v2.2.1 | Dependency cascade | `useRef` for config, empty callback deps |
| v2.2.1 | Always-mounted modal | Conditional render only when `isOpen` |
| v2.2.2 | React double-render | Disabled `React.StrictMode` |
| v2.2.2 | GPU thrashing | Removed `backdrop-blur`, added `willChange`/`contain`/`isolation` |
| v2.2.2 | Parent re-renders | Wrapped camera components with `React.memo()` |
| v2.2.3 | Intro card flicker | `!isCameraOpen` guard in StateCheckWizard return |
| v2.2.3 | Mouse event leakage | `stopPropagation()` on all portal mouse events |

**Key Files**:

- `src/hooks/useCameraCapture.ts` - Stable camera hook (317 lines)
- `src/components/BiofeedbackCameraModal.tsx` - Portal with GPU opts
- `src/components/StateCheckWizard.tsx` - Orchestrates camera flow
- `src/index.tsx` - StrictMode disabled (comment explains why)

### Client-Side AI

We moved away from a heavy backend proxy for AI to client-side adapters (Gemini, OpenAI, etc.) to reduce latency and server costs, using `AIRouter` to manage keys and fallbacks.

### Local API

We reverted from Supabase to a custom Express + PostgreSQL backend to ensure full control over the data stack and simplify the local development environment.

### Mobile-First Navigation

The desktop sidebar was removed in v1.5.0 to unify the codebase. In v0.97.7, the mobile menu drawer was also removed entirely. Navigation is now:
- **Bottom Nav**: Patterns, Reflect, Capture (center), Guide, Menu (→ Settings)
- **UserMenu** (top-right): Settings, Vision Board, Clinical Report, Resources, Guide & Vision, Terms & Legal

### State Management

**Zustand** chosen over Redux for simplicity and bundle size.

## 3. "Gotchas" & Implementation Details

### Card Component Gotchas

- **Position relative**: `.card` base class MUST have `position: relative` for absolute children
- **Hover transforms**: Use `hoverable={false}` (default) for cards with form elements
- **Scale on hover**: Only use `.card-hoverable` or `hoverable={true}` for clickable display cards
- **Touch devices**: Transforms on hover interfere with touch events

### Camera-Specific Gotchas

- **StrictMode is OFF**: Re-enable only when debugging non-camera features
- **No backdrop-blur**: Performance killer on camera components
- **No transition-all**: Use specific transitions (`transition-colors`, `transition-opacity`)
- **Portal events**: Always `stopPropagation()` to prevent parent re-renders
- **React.memo**: Camera components MUST be wrapped or they re-render on any parent state change

### General Gotchas

- **Sync Conflicts**: Currently uses "Last Write Wins". Be careful when editing the same entry from multiple devices simultaneously.
- **Dark Mode**: Requires manual class toggling on the `html` element in `appStore.ts`.
- **AI Rate Limiting**: Client-side (`rateLimiter.ts`). Counters reset if LocalStorage cleared.
- **Audio**: `LiveCoach` uses Web Audio API. Requires HTTPS in production for microphone access.
- **Docker Build Args**: `VITE_GEMINI_API_KEY` must be passed as build argument because Vite embeds env vars at build time.

## 4. Active Sprints

- **Sprint 6 (Camera Stability)**: ✅ COMPLETE - v2.2.1 through v2.2.3 camera fixes
- **Next Up**: Wearable Integrations (Apple Health, Garmin), Push Notifications

## 5. File Locations

- **Specs**: `/opt/Maeple/specifications/`
- **Docs**: `/opt/Maeple/docs/`
- **Source**: `/opt/Maeple/src/`
- **Archive**: `/opt/Maeple/.archive/` (historical docs)

## 6. Testing Quick Reference

```bash
# Run tests
npm test

# Build check
npm run build

# Dev server
npm run dev
```

**Critical Test**: Open Bio-Mirror, move mouse rapidly over camera view → should NOT flicker or show intro card.
