# MAEPLE Data Models

**Version**: 2.0.0

## 1. Core Domain Models

### 1.1 Health Entry (`HealthEntry`)

The central record of a user's state.

- **id**: UUID
- **timestamp**: ISO 8601
- **rawText**: Original journal input
- **mood**: 1-5 Scale
- **neuroMetrics**:
  - `capacity`: Multi-dimensional (Focus, Social, Sensory, etc.)
  - `sensoryLoad`: 1-10
  - `maskingScore`: 1-10
- **aiStrategies**: Generated recommendations

### 1.2 User Settings (`UserSettings`)

- **theme**: 'light' | 'dark' | 'system'
- **cycleStartDate**: YYYY-MM-DD
- **safetyContact**: String

### 1.3 Wearable Data (`WearableDataPoint`)

- **provider**: 'OURA' | 'APPLE_HEALTH' | etc.
- **metrics**: Standardized metrics (HRV, Sleep Duration, Steps).

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
