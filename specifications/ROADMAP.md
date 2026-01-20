# MAEPLE Product Roadmap

**Last Updated**: January 4, 2026  
**Current Version**: 0.97.5

This document tracks the evolution of MAEPLE from a simple journal to a clinical-grade digital phenotype engine.

---

## ✅ Completed Phases

### Phase 0: Camera Stability (v2.2.1-v2.2.3) - January 2026
- [x] v2.2.1: useCameraCapture hook with useRef pattern and stable deps
- [x] v2.2.1: Conditional modal rendering (only mount when open)
- [x] v2.2.2: Disabled React.StrictMode for camera stability
- [x] v2.2.2: GPU optimizations (willChange, contain, isolation)
- [x] v2.2.2: Removed backdrop-blur effects causing GPU thrashing
- [x] v2.2.2: React.memo wrapping on camera components
- [x] v2.2.3: StateCheckWizard !isCameraOpen guard for intro content
- [x] v2.2.3: Portal mouse event isolation (stopPropagation)

### Phase 1: Multi-Dimensional Capacity
- [x] Create `CapacityProfile` interface (Focus, Social, Sensory, etc)
- [x] Replace single spoon slider with Capacity Grid UI
- [x] Update AI prompt to parse Activity Types
- [x] Update Timeline Cards to show "Capacity Fingerprint"

### Phase 2: Correlation Engine
- [x] Build `services/analytics.ts`
- [x] Implement logic to correlate Capacity dimensions with Mood
- [x] Create "Pattern Insights" widget in Dashboard

### Phase 3: Smart Recommendations
- [x] Implement `generateDailyStrategy` logic
- [x] Create "Mae's Strategy Deck" UI
- [x] Specific interventions for Sensory Overload and Social Burnout

### Phase 4-9: Core Intelligence
- [x] Burnout Trajectory forecasting
- [x] Cognitive Load tracking (Context Switch Costing)
- [x] Wearable data integration (Sleep, HRV)
- [x] Hormonal cycle phase tracking
- [x] Masking detection and scoring
- [x] Visual Therapy AI (Vision Board)

### Phase 10-15: Platform Maturity
- [x] React Router DOM navigation
- [x] Multi-provider AI architecture (Gemini, OpenAI, Anthropic, Z.ai, Perplexity)
- [x] Circuit Breaker pattern for resilience
- [x] Data validation and migration services
- [x] Empty state handling for all dashboards
- [x] Bio-Mirror FACS implementation
- [x] PWA installation support

### Phase 16: Code Quality (January 2026)
- [x] React 19 upgrade with concurrent features
- [x] TypeScript strict mode compliance
- [x] Comprehensive test suite (246 tests)
- [x] Production-ready authentication (Supabase)
- [x] Circuit breaker event subscriptions
- [x] Type-safe Supabase client

---

## 🟡 In Progress

### Phase 17: Wearable Ecosystem
- [ ] Apple Health native integration via Capacitor
- [ ] Garmin OAuth2 integration for real-time stress data
- [ ] Fitbit/Whoop provider support
- [ ] Real-time sync with background refresh

### Phase 18: Advanced AI Features
- [ ] OpenAI Realtime voice sessions
- [ ] Predictive capacity forecasting
- [ ] Custom strategy learning from user feedback

---

## 🔮 Future Phases

### Phase 19: Healthcare Integration
- [ ] Provider portal for therapists
- [ ] EHR integration (Epic, Cerner)
- [ ] Clinical report generation
- [ ] Therapy session notes import

### Phase 20: Community Features
- [ ] Anonymous pattern sharing
- [ ] Community strategies library
- [ ] Peer support matching
- [ ] Research contribution opt-in

## 🟢 Phase 11: Mobile Polish (COMPLETED)

- [x] Implement Sticky Bottom Navigation for mobile.
- [x] Optimize Journal Entry for "Thumb Zone" usage.
- [x] Refactor responsive layout logic.

## 🟢 State Check Epic (Bio-Mirror) (COMPLETED)

- [x] Phase 1: Privacy-First Foundation (IndexedDB + Encryption).
- [x] Phase 2: Neuro-Vision Intelligence (Gemini Integration).
- [x] Phase 3: Calm Capture Experience (UI/UX).
- [x] Phase 4: Comparison Engine (Subjective vs Objective).
- [x] Phase 5: Interface & Visualization.
- [x] Phase 6: Longitudinal Trends (Pattern Recognition).
- [x] Baseline Calibration (Neutral Face Learning).

---

## 🟢 Phase 19: Enhanced Journaling System (COMPLETED)

- [x] **Multi-Mode Input**: Implemented QuickCaptureMenu with text, voice, and photo modes
- [x] **Voice Recording**: RecordVoiceButton with live Web Speech API transcription
- [x] **Audio Analysis**: AudioAnalysisService for pitch, pace, energy, and noise detection
- [x] **Photo Capture**: Enhanced StateCheckWizard for Bio-Mirror integration
- [x] **Visual Analysis**: GeminiVisionService with FACS markers for fatigue/tension
- [x] **Objective Observations**: VoiceObservations and PhotoObservations components
- [x] **Informed Capacity Calibration**: AI suggestions based on objective data
- [x] **"Informed By" Badges**: Clear explanation of suggestion sources
- [x] **Gentle Inquiry System**: Context-aware, optional AI questions
- [x] **Context-Aware Strategies**: Enhanced strategy recommendations
- [x] **Neuro-Affirming Design**: All interactions optional, skip always prominent
- [x] **Image Compression**: Canvas-based optimization for AI processing
- [x] **Data Models**: ObjectiveObservation, GentleInquiry, AudioAnalysisResult, PhotoAnalysisResult
- [x] **Full Documentation**: 14 documents created, 2 critical documents updated

**Status:** Release v1.0.0 - Major enhancement complete. Transformed from symptom surveillance to pattern literacy.

---

**Status:** Release v2.0.0 Ready. Local API sync implemented.

## 🟢 Phase 12: Multi-Provider AI Platform (COMPLETED)

- [x] Add adapter architecture with retry/health helpers.
- [x] Implement Gemini adapter (text/vision/image/search/stream) and wire router.
- [x] Implement OpenAI adapter (text/vision/image) and register in router.
- [x] Implement Anthropic, Perplexity, OpenRouter, Ollama adapters and register in router.
- [x] Refactor `geminiService` and `geminiVisionService` to route via `aiRouter` with graceful Gemini fallback.
- [x] Wire audio routing entry point (router + `canUseAudio`), still Gemini Live-only in UI.

## 🟢 Phase 13: Quality & User Experience (COMPLETED)

- [x] Data Export/Import Service (`exportService.ts`) - Full backup/restore with encryption.
- [x] Data Management UI in Settings - Export, import, storage stats, clear all.
- [x] Testing Framework (`vitest.config.ts`, `tests/setup.ts`) - Vitest + React Testing Library.
- [x] Analytics Test Suite (`analytics.test.ts`) - 27 tests for insights, burnout, cognitive load.
- [x] Encryption Test Suite (`encryption.test.ts`) - 14 tests for security validation.
- [x] Onboarding Wizard (`OnboardingWizard.tsx`) - 5-step first-run experience.
- [x] PWA Enhancement (`manifest.json`, icons, meta tags) - Installable app experience.
- [x] Notification System (`notificationService.ts`, `NotificationSettings.tsx`) - Gentle reminders.
- [x] Real Wearable Integration (`ouraAdapter.ts`) - Oura Ring v2 API with OAuth2.

## 🟢 Phase 14: Server Sync & Persistence (COMPLETED)

- [x] Local API Client (`apiClient.ts`) - Connection to Express backend.
- [x] Database Schema (`local_schema.sql`) - Full PostgreSQL schema.
- [x] Authentication Service (`authService.ts`) - Email/password via Local API.
- [x] Sync Service (`syncService.ts`) - Hybrid local-first with server backup.
- [x] Storage Integration (`storageService.ts`) - Auto-queue changes for sync.
- [x] Auth Modal (`AuthModal.tsx`) - Sign in/up UI.
- [x] Cloud Sync Settings (`CloudSyncSettings.tsx`) - Sync status, push/pull controls.

## 🟢 Phase 16: UX & Polish (COMPLETED)

- [x] **Mobile-First Navigation**: Unified bottom bar, removed desktop sidebar.
- [x] **Dark Mode**: Full system/manual theme support.
- [x] **Visual Feedback**: Typing indicators and loading states for AI.
- [x] **Accessibility**: ARIA labels and improved contrast.
- [x] **Navigation Simplification (v0.97.7)**: Removed sidebar drawer entirely. Menu now links to Settings. Vision Board & Clinical Report moved to UserMenu.

---

## 🟡 Phase 17: Future Enhancements (PLANNED)

- [ ] Add provider health/fallback chain and comprehensive tests.
- [ ] Enable audio provider selection (OpenAI/others) in Live Coach.
- [ ] Expand wearable support (Fitbit, Apple Health, Garmin).
- [ ] Community features (anonymized pattern sharing).
- [ ] Therapist portal for clinical collaboration.
- [ ] Machine learning model for personalized burnout prediction.
      **Status:** Multi-provider layer shipped with Gemini + OpenAI; other adapters scaffolded; audio routing plumbed but UI still Gemini-only.
