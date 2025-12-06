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

## 🟢 Phase 10: Clinical Phenotyping (COMPLETED)
- [x] Create `ClinicalReport` component.
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

**Status:** Alpha Release v1.1 Ready. All planned features implemented.

## 🟡 Phase 12: Multi-Provider AI Platform (IN PROGRESS)
- [x] Add adapter architecture with retry/health helpers.
- [x] Implement Gemini adapter (text/vision/image/search/stream) and wire router.
- [x] Implement OpenAI adapter (text/vision/image) and register in router.
- [x] Scaffold Anthropic, Perplexity, OpenRouter, Ollama, Z.ai adapters and register stubs.
- [x] Refactor `geminiService` and `geminiVisionService` to route via `aiRouter` with graceful Gemini fallback.
- [x] Wire audio routing entry point (router + `canUseAudio`), still Gemini Live-only in UI.
- [ ] Add provider health/fallback chain and tests.
- [ ] Enable audio provider selection (OpenAI/others) in Live Coach.

**Status:** Multi-provider layer shipped with Gemini + OpenAI; other adapters scaffolded; audio routing plumbed but UI still Gemini-only.