# MAEPLE Data Analysis & Logic Specification

**Version**: 1.1.0  
**Created**: December 17, 2025  
**Last Updated**: February 8, 2026

> **v1.1.0 Update (February 2026)**: Added FACS Analysis documentation, Quality Assessment logic, and updated AI Decision Matrix.

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

### 3.1.5 FACS Analysis (Bio-Mirror)

**Input:** Base64-encoded facial image

**Process:**

1. **Image Capture:**
   - User captures via `StateCheckCamera` component
   - Compressed to optimize for AI transmission
   - Encrypted before storage

2. **AI Analysis (Gemini 2.5 Flash):**
   - Image sent to Gemini Vision API
   - Prompt requests specific Action Units (AUs)
   - Structured schema enforces `FacialAnalysis` format

3. **Response Transformation (v0.97.9):**
   - `transformAIResponse()` handles format variations
   - Unwraps `facs_analysis` wrapper if present
   - Maps snake_case to camelCase
   - Validates all required fields

4. **Quality Assessment (v0.97.9):**
   - `checkDetectionQuality()` evaluates detection confidence
   - 0-100 score calculated from multiple factors
   - Always allows proceeding (non-blocking)

5. **Comparison to Subjective Report:**
   - `compareSubjectiveToObjective()` calculates discrepancy
   - Compares mood (1-5) with facial indicators
   - Generates mask detection and insights

**Output:** `FacialAnalysis` object with:
- Action Units detected with intensity ratings
- FACS interpretation (Duchenne vs social smile)
- Tension and fatigue scores
- Confidence metrics
- Quality assessment (informational)

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

| User State | FACS Detection | Objective State | AI Response Strategy |
| :--- | :--- | :--- | :--- |
| **Mood 5** | **Duchenne Smile** (AU6+AU12) | Genuine positive emotion | "Your face matches your report. Great alignment!" |
| **Mood 5** | **Social Smile** (AU12 only) | Social/posed expression | "Your smile appears social - you may be masking" |
| **Mood 5** | **High Tension** (AU4+AU24) | Stress markers present | "Your face shows tension despite positive mood. Check in with your body." |
| **Mood 1** | **High Fatigue** (AU43+AU7) | Exhaustion indicators | "Physical fatigue detected - prioritize rest over pushing through." |
| **Any Mood** | **Low Quality Score** | Limited markers detected | "Lighting or angle may affect detection. Try again or use these results as-is." |
| **High Capacity / High Mood** | N/A | "Green Zone" | Encourage capitalization on strengths. Suggest creative tasks. |
| **Low Capacity / High Load** | N/A | "Red Zone" | Validate struggle. Suggest immediate sensory reduction. **Do not** suggest complex tasks. |
| **High Masking Score** | N/A | "Discrepancy" | Gentle inquiry: "You seem to be pushing through. Is it safe to unmask?" |
| **Inconsistent Data** | N/A | Text says "Fine", Mood is 1 | Trust the Mood score. Ask about the discrepancy gently. |

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

**See COMPLETE_SPECIFICATIONS.md for updated data flow including FACS analysis.**

---

## 7. Quality Assessment Logic (v0.97.9)

### Purpose

Evaluate FACS detection quality without blocking results. Quality checks provide users with guidance while ensuring they can always view their analysis.

### Algorithm

```typescript
qualityScore = (confidence * 0.4) + 
             (auCountScore * 0.3) + 
             (criticalAuScore * 0.3)

Where:
- confidence = 0-1 (AI's overall confidence)
- auCountScore = min(AUs.length / 8, 1) (number of AUs, max 8)
- criticalAuScore = min(criticalAUs.length / 2, 1) (key AUs detected)
```

### Critical AUs

The following Action Units are considered critical for reliable analysis:
- **AU6**: Cheek Raiser (genuine smile marker)
- **AU12**: Lip Corner Puller (smile indicator)
- **AU4**: Brow Lowerer (tension marker)
- **AU24**: Lip Pressor (tension marker)

### Quality Levels

| Score Range | Level | User Experience |
| :--- | :--- | :--- |
| **60-100** | High | Reliable detection, all critical AUs detected. No alert shown. |
| **30-59** | Medium | Some markers may have been missed. Informative warning with improvement suggestions. |
| **0-29** | Low | Limited detection, improvement suggestions provided. Still viewable. |

### User Impact

- **NEVER blocks results** - always shows analysis
- Provides improvement suggestions for low/medium quality
- Allows informed decision to retry capture
- Respects user autonomy and judgment

### Quality Suggestions

For low/medium quality, system provides specific guidance:

**Lighting:**
- "Use soft, frontal lighting"
- "Avoid harsh shadows on face"
- "Ensure even illumination"

**Positioning:**
- "Face camera directly"
- "Keep face centered in frame"
- "Maintain consistent distance"

**Environmental:**
- "Remove glasses if possible"
- "Clear hair from face"
- "Ensure clean background"

**Technical:**
- "Keep camera steady"
- "Ensure good focus"
- "Wait for image to stabilize"

---

## 8. FACS Analysis Data Flow

```
User captures photo
    ↓
Image compressed & encrypted
    ↓
Sent to Gemini Vision API
    ↓
AI analyzes facial features
    ↓
Raw AI response received
    ↓
transformAIResponse() standardizes format
    ↓
checkDetectionQuality() evaluates quality
    ↓
compareSubjectiveToObjective() calculates discrepancy
    ↓
FacialAnalysis stored in HealthEntry
    ↓
UI displays results with quality guidance
    ↓
User can view results or retry
```

---

## 9. References

### Academic Sources

1. Ekman, P., & Friesen, W. (1978). _Facial Action Coding System: A Technique for Measurement of Facial Movement._

2. Cohn, J. F., Ambadar, Z., & Ekman, P. (2007). _Observer-based measurement of facial expression with Facial Action Coding System._

### Implementation Documentation

3. `docs/FACS_IMPLEMENTATION_GUIDE.md` - Comprehensive FACS implementation guide
4. `specifications/COMPLETE_SPECIFICATIONS.md` - System architecture and data models
5. `docs/BIO_MIRROR_UX_IMPROVEMENTS.md` - User experience documentation

### AI Documentation

6. Google AI. (2024). _Gemini Vision API Documentation_
7. Google AI. (2024). _Prompt Engineering Best Practices_

---

**Document Version**: 1.1.0  
**Last Updated**: February 8, 2026  
**Maintained By**: MAEPLE Development Team

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
