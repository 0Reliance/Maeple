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
