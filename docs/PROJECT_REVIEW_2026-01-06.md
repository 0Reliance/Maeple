# MAEPLE Project Review (2026-01-06)

Scope: end-to-end review of capture surfaces (Bio‑Mirror/FACS, journaling, voice/audio, wearables), storage/sync, validation, and analysis logic. This report focuses on correctness, data integrity, and product-trust risks.

## Executive Summary (Top Risks)

**P0 (high risk / trust & data integrity)**

1. **Validation is fragmented**. There are multiple validation systems (custom validators, Zod schemas, ad-hoc type guards), which increases drift risk. (As of 2026-01-06, Bio‑Mirror/state checks now run `validateFacialAnalysis` on decrypt/read and log a warning when validation fails, rather than silently accepting/using ad-hoc type guards.)

2. **Bio‑Mirror (state checks) are not actually included in cloud sync**. This creates a trust gap: users may assume they are backed up, but they are not. (As of 2026-01-06, the code no longer implies state checks are queued for sync.)

3. **Export/import parity for Bio‑Mirror history**. (As of 2026-01-06, JSON import restores Bio‑Mirror history into IndexedDB; ZIP restore is still not implemented.)

4. **The journaling AI prompt previously contradicted the system instruction’s “objective-only” constraint** (asked the model to detect masking and tone). This creates unpredictable extraction and a governance/compliance risk if “objective-only” is part of MAEPLE’s positioning. (Fixed 2026-01-06 by removing the inference instruction from the prompt.)

**P1 (medium risk / correctness & messaging)** 5) **Dashboard “Average Mood” was computed from energy/spoon level** (copy/paste bug), which can mislead users. (Fixed 2026-01-06.)

6. **Bio‑Mirror UI copy implied “micro‑expressions” despite a single still capture flow**, which is scientifically/methodologically mismatched and can reduce trust. (Fixed 2026-01-06 by changing the UI label to “Facial Cues”.)

7. **Multiple “truths” for numeric scales and ID formats** exist across code paths (e.g., 0–1 vs 1–10; UUID vs non‑UUID), making it hard to safely evolve the data model.

**P2 (longer-term / product evolution)** 8) **Analytics engine relies on heuristics with hard-coded thresholds** and no calibration layer or confidence intervals. This can be OK for MVP, but the app should clearly distinguish “heuristic guidance” from “validated inference,” and ideally track uncertainty.

## Evidence Pointers (Key Files)

### Validation divergence + schema drift

- `src/services/stateCheckService.ts`
  - Decrypted analysis is validated/sanitized via `validateFacialAnalysis`.
  - If a decrypted payload does not look like a valid FacialAnalysis, the app logs a privacy-safe warning and returns sanitized defaults.

- `src/services/validationService.ts`
  - Contains custom runtime validators for `validateFacialAnalysis` and `validateStateCheck`.
  - As of 2026-01-06, these validators are used in runtime flows (state-check decrypt/read; backup import).

- `src/services/validation/schemas.ts` + `src/services/validation/validator.ts`
  - Zod schemas define a different shape and constraints than actual persisted records.
  - Examples:
    - `jawTension` / `eyeFatigue` expect 1–10 optional values.
    - Baseline schema expects UUID and 1–10 ranges.
    - StateCheck schema expects `imageBase64` and UUID id.
  - These schemas are also **not used by state check persistence** (IndexedDB encryption stores `analysisCipher` and `iv`).

### Cloud sync gap

- `src/services/storageService.ts`
  - Pending sync queue only supports `entry|settings`; no state-check queuing.

- `src/services/syncService.ts`
  - `processPendingChanges()` handles only `entry` and `settings`.

### Export/import mismatch

- `src/services/exportService.ts`
  - Export includes `stateChecks` (via IndexedDB read/decrypt).
  - As of 2026-01-06, JSON import restores `stateChecks` back into IndexedDB.

### Journaling AI prompt contradiction

- `src/services/geminiService.ts`
  - System instruction emphasizes objective extraction only.
  - Previously the user prompt included: “Are they masking? Look at the tone.” (Fixed 2026-01-06.)
  - Consequence (pre-fix): even with good system guidance, the prompt instructed prohibited inference.

### Dashboard correctness bug

- `src/components/HealthMetricsDashboard.tsx`
  - Previously `avgMood` was computed from `curr.energy` (spoonLevel) rather than mood. (Fixed 2026-01-06.)

## Recommendations (Prioritized)

### P0 — Data integrity & trust (do first)

1. **Establish a single canonical runtime validator for each persisted artifact** (StateCheck, FacialAnalysis, Baseline, HealthEntry, AudioAnalysisResult). Recommendation:
   - Define canonical Zod schemas for persisted shapes (the exact storage payload), not aspirational shapes.
   - Use `safeParse` in persistence boundaries:
     - Before encrypt+save (write path)
     - After decrypt (read path)
   - On validation failure: surface a structured warning + keep raw payload for debugging (don’t silently replace with defaults without logging).

2. **Decide whether StateChecks are intended to be synced.**
   - If yes: implement sync support end-to-end (queue stateCheck changes; add API endpoints; update syncService).
   - If no: remove `stateCheck` from pending types and make UI/Docs explicitly say Bio‑Mirror history is local-only.

3. **Fix export/import parity for Bio‑Mirror history**.
   - Minimum: allow restoring state checks from exported JSON into IndexedDB.
   - If images are exported in ZIP: restore metadata and images as well.

4. **Resolve “objective-only” vs “inference” contradictions in prompts**.
   - If MAEPLE’s policy is “objective-only”: remove masking/tone inference tasks from prompts.
   - If you do want interpretive inference: explicitly label it as “inference” and build guardrails/consent UX.

### P1 — Correctness & user-facing integrity

5. **Fix dashboard metric bug (Average Mood).**
   - Ensure it uses entry mood values rather than spoon/energy.

6. **Align Bio‑Mirror messaging with methodology.**

- Remove/replace “micro-expressions” language unless you implement temporal capture. (Fixed 2026-01-06.)
- Add a short “limitations” disclaimer in the Bio‑Mirror flow or results: single still, lighting sensitivity, etc.

7. **Unify numeric scales** (0–1 vs 1–10) and document it.
   - If tension/fatigue are now 0–1: migrate old data or support both with explicit normalization.

### P2 — Research-backed improvements (capture + analysis)

8. **Temporal sampling for FACS** (recommended if you keep any “micro-expression” claims).
   - Capture short clip (e.g., 1–2 seconds) or 3–5 frames across a second, then aggregate AUs (e.g., median intensity, max intensity, stability).

9. **Hybrid AU detection architecture** (privacy & reliability).
   - Gemini Vision structured output is convenient, but for AU detection reliability, consider classical/ML tooling (server-side or on-device) for AUs, then use LLM only for interpretation of already-extracted signals.
   - Options:
     - OpenFace (C++ toolkit) provides AU detection and landmark/head pose tracking.
     - py-feat (Python toolbox) supports AUs and facial expression features.

10. **Analytics calibration and uncertainty**.

- Add a calibration layer: record sample sizes behind each insight, avoid strong phrasing below thresholds, and track whether wearable coverage is sufficient.

## Suggested next steps (concrete)

**Day 1–2**

- Fix Average Mood computation.
- Decide: “state checks sync” yes/no.
- Add structured logging for state check decrypt/parse failures.

**Week 1**

- Make one canonical schema for StateCheck persisted record + one for decrypted analysis.
- Implement state check import restoration (JSON → IndexedDB records).

**Week 2–4**

- Implement temporal capture for Bio‑Mirror if you keep any micro‑expression framing.
- Prototype AU extraction via OpenFace/py-feat as a benchmark against Gemini Vision.

## External References (for implementation options)

- Google Gemini API: Image understanding (vision inputs): https://ai.google.dev/gemini-api/docs/image-understanding
- Google Gemini API: Structured outputs / JSON schema: https://ai.google.dev/gemini-api/docs/structured-output
- OpenFace 2.2.0 (AU detection toolkit): https://github.com/TadasBaltrusaitis/OpenFace
- py-feat (Python facial expression analysis toolbox incl. AUs): https://github.com/cosanlab/py-feat
