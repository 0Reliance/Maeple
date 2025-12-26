# MAEPLE Product Roadmap

This document tracks the evolution of MAEPLE from a simple journal to a clinical-grade digital phenotype engine.

## 🟢 Phase 1: Multi-Dimensional Capacity (COMPLETED)

- [x] Create `CapacityProfile` interface (Focus, Social, Sensory, etc).
- [x] Replace single spoon slider with Capacity Grid UI.
- [x] Update AI prompt to parse Activity Types (`#DeepWork`, `#Social`).
- [x] Update Timeline Cards to show "Capacity Fingerprint".

## 🟢 Phase 2: Correlation Engine (COMPLETED)

- [x] Build `services/analytics.ts`.
- [x] Implement logic to correlate Capacity dimensions with Mood.
- [x] Create "Pattern Insights" widget in Dashboard.

## 🟢 Phase 3: Smart Recommendations (COMPLETED)

- [x] Implement `generateDailyStrategy` logic.
- [x] Create "Mae's Strategy Deck" UI.
- [x] specific interventions for Sensory Overload and Social Burnout.

## 🟢 Phase 4: Burnout Trajectory (COMPLETED)

- [x] Create `BurnoutForecast` data model.
- [x] Implement logic to calculate Demand/Capacity ratio over 7 days.
- [x] Build "Burnout Forecast" widget with predictive text.

## 🟢 Phase 5: Cognitive Load (COMPLETED)

- [x] Implement `calculateCognitiveLoad` logic (Context Switch Costing).
- [x] Visualizing "Efficiency Loss" due to fragmentation.

## 🟢 Phase 6: Passive Context (COMPLETED)

- [x] Integrate `WearableData` into the Analytics Engine.
- [x] Correlate Sleep Duration (Objective) with Focus Capacity (Subjective).
- [x] Correlate HRV with Sensory Tolerance.

## 🟢 Phase 7: Hormonal Sync 2.0 (COMPLETED)

- [x] Implement `calculateCyclePhase` logic.
- [x] Create `CyclePhaseContext` interface.
- [x] Build "Hormonal Weather" widget (predicting Luteal phase risks).

## 🟢 Phase 8: Masking Detection (COMPLETED)

- [x] Update Gemini System Instruction to analyze Linguistic Tone.
- [x] Create `maskingScore` metric (1-10).
- [x] Visualize "Masking Burden" trends on Dashboard.

## 🟢 Phase 9: Visual Therapy AI (COMPLETED)

- [x] Connect Vision Board to Neuro-Metrics.
- [x] Generate "Smart Prompts" based on current state (e.g., "Visualize Serenity" if Sensory Load > 8).

## 🟢 Phase 11: Platform Hardening (COMPLETED)

- [x] **Routing**: Migrated to `react-router-dom` for proper URL navigation.
- [x] **AI Stability**: Implemented health checks and usage tracking for all providers.
- [x] **Data Integrity**: Added schema migration service and robust sync conflict resolution.
- [x] **Export**: Optimized JSON export to handle large datasets (image exclusion).
- [x] **Live Coach**: Abstracted audio routing to support multi-provider real-time sessions.
- [x] **AI Expansion**: Fully implemented Perplexity, OpenRouter, and Ollama adapters.

## 🟢 Phase 14: Polish & Privacy (COMPLETED)

- [x] **Dashboard Simplification**: Redesigned Capacity Check-in and Context Grid.
- [x] **Navigation Refactor**: Implemented User Menu and streamlined Sidebar.
- [x] **Privacy Clarity**: Added explicit "Local-First" terms and legal documentation.
- [x] **Branding**: Added Poziverse branding and GitHub links.

## � Phase 15: Pattern Literacy & UX Polish (COMPLETED)

- [x] **Empty States**: Implemented "Cold Start" UI for all charts and widgets.
- [x] **Educational Overlays**: Added "Waiting for Data" guidance to prevent confusion.
- [x] **Bio-Mirror Guidance**: Added "Pro Tip" logic for masking detection context.
- [x] **Chart Safety**: Prevented Recharts from rendering with null data.

## � Phase 18: Bio-Mirror & PWA (COMPLETED)

- [x] **Bio-Mirror FACS**: Implemented Facial Action Coding System for fatigue and tension detection.
- [x] **PWA Install**: Added custom install prompt and button.
- [x] **Deployment**: Fixed environment variable injection for Docker builds.
- [x] **UI Cleanup**: Standardized card headers and removed duplicates.

## �🟡 Phase 16: Wearable Ecosystem (NEXT)

- [ ] **Apple Health**: Native integration via Capacitor.
- [ ] **Garmin**: OAuth2 integration for real-time stress data.
- [ ] **Fitbit/Whoop**: Add support for additional providers.

## 🟡 Phase 17: Advanced AI Features

- [ ] **OpenAI Realtime**: Implement `connectLive` for OpenAI.
- [x] **Perplexity/OpenRouter**: Finalize adapters for research/broad model support.
- [x] **Local AI**: Optimize Ollama adapter for privacy-first users.
- [x] Generate Radar Chart for Baseline Capacity.
- [x] Build Print-to-PDF layout for therapist sharing.

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

---

## 🟡 Phase 17: Future Enhancements (PLANNED)

- [ ] Add provider health/fallback chain and comprehensive tests.
- [ ] Enable audio provider selection (OpenAI/others) in Live Coach.
- [ ] Expand wearable support (Fitbit, Apple Health, Garmin).
- [ ] Community features (anonymized pattern sharing).
- [ ] Therapist portal for clinical collaboration.
- [ ] Machine learning model for personalized burnout prediction.
      **Status:** Multi-provider layer shipped with Gemini + OpenAI; other adapters scaffolded; audio routing plumbed but UI still Gemini-only.
