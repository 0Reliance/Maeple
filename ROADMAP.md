# POZIMIND Product Roadmap

This document tracks the evolution of POZIMIND from a simple journal to a clinical-grade digital phenotype engine.

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
- [x] Create "Pozi's Strategy Deck" UI.
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

---

**Status:** Alpha Release v1.0 Ready. All core systems operational.