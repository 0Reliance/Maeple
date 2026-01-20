# MAEPLE Data Models

**Version**: 2.1.0
**Last Updated**: December 17, 2025

## 1. Core Domain Models

### 1.1 Health Entry (`HealthEntry`)

The central record of a user's state, capturing subjective experience, objective metrics, and AI analysis.

- **id**: `string` (UUID)
- **timestamp**: `string` (ISO 8601)
- **rawText**: `string` (Original journal input or transcript)
- **mood**: `number` (1-5 Scale)
- **moodLabel**: `string` (e.g., "Neutral", "Anxious")
- **tags**: `string[]` (e.g., "voice-session", "mae-live")
- **activityTypes**: `string[]` (e.g., "#DeepWork", "#Social")
- **strengths**: `string[]` (Character strengths identified)
- **neuroMetrics**: `NeuroMetrics` object
  - `spoonLevel`: `number` (Calculated average capacity)
  - `sensoryLoad`: `number` (1-10)
  - `contextSwitches`: `number` (Estimated count)
  - `maskingScore`: `number` (1-10)
  - `capacity`: `CapacityProfile` (7-point grid)
- **medications**: `Medication[]`
- **symptoms**: `Symptom[]`
- **sleep**: `SleepData` (Optional)
- **aiStrategies**: `StrategyRecommendation[]` (Generated advice)
- **aiReasoning**: `string` (Explanation of analysis)

### 1.2 Capacity Profile (`CapacityProfile`)

A 7-point grid representing available bandwidth in different domains (0-10 scale).

- **focus**: Cognitive bandwidth / Deep work ability.
- **social**: Capacity for interaction.
- **structure**: Need for routine vs. flexibility.
- **emotional**: Resilience and processing space.
- **physical**: Body energy and pain levels.
- **sensory**: Tolerance for noise, light, and texture.
- **executive**: Ability to plan and initiate tasks.

### 1.3 User Settings (`UserSettings`)

- **theme**: 'light' | 'dark' | 'system'
- **cycleStartDate**: YYYY-MM-DD
- **avgCycleLength**: number (Default 28)
- **safetyContact**: String (Crisis support)

### 1.4 Wearable Data (`WearableDataPoint`)

- **provider**: 'OURA' | 'APPLE_HEALTH' | etc.
- **metrics**: Standardized metrics (HRV, Sleep Duration, Steps).
- **syncedAt**: ISO Timestamp

### 1.5 Bio-Mirror Analysis (`FacialAnalysis`)

Objective physiological analysis based on the **Facial Action Coding System (FACS)** developed by Paul Ekman and Wallace Friesen.

**References:**

- Ekman, P., & Friesen, W. (1978). _Facial Action Coding System_
- Implementation using Gemini 1.5/2.0 Vision API
- Research: [iMotions FACS Guide](https://imotions.com/blog/facial-action-coding-system/)

#### Core Structure

**ActionUnit** (NEW v0.97.6):

- **auCode**: `string` - FACS code (e.g., "AU1", "AU4", "AU6", "AU12", "AU24")
- **name**: `string` - Anatomical name (e.g., "Inner Brow Raiser", "Brow Lowerer")
- **intensity**: `'A' | 'B' | 'C' | 'D' | 'E'` - FACS intensity scale:
  - A = Trace (barely visible)
  - B = Slight (small but clear)
  - C = Marked (obvious)
  - D = Severe (pronounced)
  - E = Maximum (extreme)
- **intensityNumeric**: `number` (1-5) - Numeric equivalent for calculations
- **confidence**: `number` (0-1) - AI detection confidence

**FacialAnalysis**:

- **confidence**: `number` (0-1) - Overall analysis confidence
- **actionUnits**: `ActionUnit[]` - Detected FACS Action Units (NEW)
- **facsInterpretation**: `object` (NEW) - Structured interpretation:
  - **duchennSmile**: `boolean` - True if AU6+AU12 detected (genuine smile)
  - **socialSmile**: `boolean` - True if AU12 without AU6 (posed/masking)
  - **maskingIndicators**: `string[]` - Signs of emotional suppression
  - **fatigueIndicators**: `string[]` - Signs of tiredness
  - **tensionIndicators**: `string[]` - Signs of stress
- **observations**: `array` - General visual observations (backward compatible)
- **lighting**: `string` - Lighting conditions
- **lightingSeverity**: `'low' | 'moderate' | 'high'`
- **environmentalClues**: `string[]` - Background elements
- **jawTension**: `number` (0-1) - Derived from AU4, AU24 (legacy)
- **eyeFatigue**: `number` (0-1) - Derived from ptosis, AU43 (legacy)
- **primaryEmotion**: `string` - Dominant expression (legacy)
- **signs**: `array` - Additional detected markers (legacy)

#### Key Action Units Detected

| AU Code | Muscle               | Meaning                  | Neurodivergent Relevance     |
| ------- | -------------------- | ------------------------ | ---------------------------- |
| AU1     | Inner Brow Raiser    | Sadness, worry           | Anxiety indicator            |
| AU4     | Brow Lowerer         | Concentration, distress  | Masking effort, tension      |
| AU6     | Cheek Raiser         | Genuine smile component  | Authenticity marker          |
| AU7     | Lid Tightener        | Concentration, squinting | Fatigue, sensory sensitivity |
| AU12    | Lip Corner Puller    | Smile                    | Can be genuine or social     |
| AU14    | Dimpler              | Contempt, suppression    | Emotional suppression        |
| AU15    | Lip Corner Depressor | Sadness                  | Distress indicator           |
| AU17    | Chin Raiser          | Doubt, sadness           | Emotional state              |
| AU24    | Lip Pressor          | Tension, stress          | Key masking indicator        |
| AU43    | Eyes Closed          | Fatigue                  | Burnout warning sign         |
| AU45    | Blink (excessive)    | Fatigue                  | Cognitive overload           |

### 1.6 Bio-Mirror Baseline (`FacialBaseline`)

Calibration data for a user's neutral state.

- **id**: `string` (UUID)
- **timestamp**: `string` (ISO 8601)
- **neutralTension**: `number`
- **neutralFatigue**: `number`
- **neutralMasking**: `number`

### 1.7 State Check Entry (`StateCheck`)

A saved record of a Bio-Mirror session.

- **id**: `string` (UUID)
- **timestamp**: `string` (ISO 8601)
- **imageBase64**: `string` (Optional, encrypted)
- **analysis**: `FacialAnalysis`
- **userNote**: `string` (Optional context)

## 2. Database Schema (PostgreSQL)

### `users`

- `id`: UUID (PK)
- `email`: String
- `created_at`: Timestamp

### `health_entries`

- `id`: UUID (PK)
- `user_id`: UUID (FK)
- `data`: JSONB (Stores the full `HealthEntry` object)
- `updated_at`: Timestamp (For sync)

### `user_settings`

- `user_id`: UUID (PK)
- `settings`: JSONB
- `updated_at`: Timestamp

### `wearable_data`

- `id`: UUID (PK)
- `user_id`: UUID (FK)
- `provider`: String
- `date`: Date
- `metrics`: JSONB

## 3. Sync Protocol

- **Strategy**: Last Write Wins (LWW) based on `updated_at`.
- **Granularity**: Record-level (Entry, Settings).
- **Deletes**: Soft deletes or tombstoning (implementation detail in `syncService`).
