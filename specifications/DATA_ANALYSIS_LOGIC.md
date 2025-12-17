# MAEPLE Data Analysis & Logic Specification

**Version**: 1.0.0
**Created**: December 17, 2025

## 1. Overview

This document details the data inputs, storage mechanisms, and analysis logic used within MAEPLE. It serves as the reference for understanding how user data is transformed into actionable insights and how the AI makes determinations.

## 2. Data Inputs

### 2.1 Journal Entry (The Core Unit)
The primary data input is the `HealthEntry`. It aggregates data from multiple UI surfaces.

| Input Field | Source UI | Data Type | Purpose |
| :--- | :--- | :--- | :--- |
| **Raw Text** | Journal Input / Voice Transcript | `string` | Source for NLP analysis (sentiment, topics). |
| **Mood** | Slider / Emoji Picker | `number` (1-5) | Subjective emotional state tracking. |
| **Capacity Profile** | Capacity Grid (7 sliders) | `CapacityProfile` | Granular resource tracking (Focus, Social, etc.). |
| **Tags** | Tag Picker / Auto-tagging | `string[]` | Contextual labeling (e.g., #work, #sensory-overload). |
| **Symptoms** | Symptom Checklist | `Symptom[]` | Tracking physical/mental symptoms. |
| **Medications** | Med Tracker | `Medication[]` | Correlating meds with state changes. |

### 2.2 Live Coach Session
Real-time interaction data.

| Input Field | Source | Data Type | Transformation |
| :--- | :--- | :--- | :--- |
| **Audio Stream** | Microphone | `Float32Array` | Converted to PCM16 for Gemini API. |
| **Transcript** | Speech Recognition / Gemini | `string` | Saved as `rawText` in a new `HealthEntry`. |
| **Session Metadata** | System | `tags` | Tagged as `#mae-live`, `#voice-session`. |

### 2.3 Passive Data (Planned)
| Input Field | Source | Data Type | Purpose |
| :--- | :--- | :--- | :--- |
| **Wearable Metrics** | Oura/Apple Health | `WearableDataPoint` | Objective correlation (HRV vs. Reported Stress). |

## 3. Analysis Logic

### 3.1 Immediate Analysis (On Entry)
When a user submits a journal entry, the following logic triggers:

1.  **Sentiment Analysis (Gemini)**:
    *   **Input**: `rawText` + `CapacityProfile`.
    *   **Process**: The text is sent to Gemini with a system prompt to extract:
        *   `moodScore` (1-5 validation).
        *   `moodLabel` (Descriptive).
        *   `symptoms` (Extracted from text).
        *   `activityTypes` (Inferred context).
    *   **Output**: Populates the `HealthEntry` fields.

2.  **Strategy Generation (Gemini)**:
    *   **Input**: The fully populated `HealthEntry`.
    *   **Logic**: "Given the user has Low Focus (2/10) and High Sensory Load (8/10), what are 3 micro-strategies?"
    *   **Output**: `aiStrategies` array (e.g., "Dim the lights", "Put on noise-canceling headphones").

### 3.2 Longitudinal Analysis (Dashboard)
Aggregated analysis performed on the client-side (and eventually AI-assisted).

1.  **Capacity Trends**:
    *   **Logic**: Calculate moving average of `neuroMetrics.spoonLevel` over 7/30 days.
    *   **Insight**: "Your capacity is trending down this week."

2.  **Context Correlation (Planned)**:
    *   **Logic**: Correlate `tags` with `mood` or `capacity`.
    *   **Example**: "Entries tagged `#meeting` correlate with a 30% drop in `Social Capacity`."

3.  **Burnout Prediction (Heuristic)**:
    *   **Logic**: If `spoonLevel` < 3 for > 3 consecutive days AND `sensoryLoad` > 7.
    *   **Alert**: "Risk of Autistic Burnout detected. Recommend radical rest."

## 4. AI Decision Matrix

How the AI "thinks" about the user.

| User State | Detected Pattern | AI Response Strategy |
| :--- | :--- | :--- |
| **High Capacity / High Mood** | "Green Zone" | Encourage capitalization on strengths. Suggest creative tasks. |
| **Low Capacity / High Load** | "Red Zone" | Validate struggle. Suggest immediate sensory reduction. **Do not** suggest complex tasks. |
| **High Masking Score** | "Discrepancy" | Gentle inquiry: "You seem to be pushing through. Is it safe to unmask?" |
| **Inconsistent Data** | Text says "Fine", Mood is 1 | Trust the Mood score. Ask about the discrepancy gently. |

## 5. Future Logic Roadmap

1.  **RAG (Retrieval Augmented Generation)**:
    *   **Goal**: AI remembers past strategies that worked.
    *   **Implementation**: Vector search on past `HealthEntry` embeddings to find similar contexts.
    *   **Benefit**: "Last time you felt this way, 'Deep Pressure' helped."

2.  **Cycle-Aware Analysis**:
    *   **Goal**: Correlate capacity with menstrual cycle phase.
    *   **Logic**: Overlay `cycleDay` on capacity charts.

3.  **Voice Biomarkers (Experimental)**:
    *   **Goal**: Detect stress/fatigue in voice tone during Live Coach sessions.
    *   **Privacy**: Processed locally if possible.

## 6. Data Flow Diagram

```mermaid
graph TD
    User[User] -->|Input| JournalUI[Journal UI]
    User -->|Voice| LiveCoach[Live Coach]
    
    JournalUI -->|Text + Metrics| AppStore[Zustand Store]
    LiveCoach -->|Transcript| AppStore
    
    AppStore -->|Entry Data| GeminiAdapter[Gemini Adapter]
    GeminiAdapter -->|Analysis + Strategies| AppStore
    
    AppStore -->|Persist| LocalStorage[LocalStorage]
    AppStore -->|Sync| Postgres[PostgreSQL (Optional)]
    
    AppStore -->|Read| Dashboard[Analysis Dashboard]
```
