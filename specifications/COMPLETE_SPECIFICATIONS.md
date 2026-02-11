# MAEPLE Complete Specifications Documentation

**Version**: 0.97.9  
**Last Updated**: February 9, 2026  
**Status**: Production Ready  
**Local Database**: ✅ Fully Operational (PostgreSQL 16 in Docker)  
**Test Suite**: ✅ All relevant tests passing (41 Bio Mirror + Energy Check-in tests)

> **v0.97.9 Update (February 9, 2026)**: Bio Mirror & Energy Check-in bug fixes (7 source files), comprehensive documentation overhaul. See also:
> - [COMPONENT_REFERENCE.md](COMPONENT_REFERENCE.md) — Detailed definitions for all 40 React components
> - [SERVICES_REFERENCE.md](SERVICES_REFERENCE.md) — Detailed definitions for all services, stores, hooks, patterns, and utilities
> - [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) — Architecture overview with data flow diagrams

> **v0.97.7 Update**: Local database integration complete with Docker stack (PostgreSQL 16, Express API, Nginx frontend). All CRUD operations verified.

---

## Table of Contents

1. [Project Definition and Importance](#project-definition-and-importance)
2. [System Architecture Overview](#system-architecture-overview)
3. [Core Components Breakdown](#core-components-breakdown)
4. [Data Flow and Component Interactions](#data-flow-and-component-interactions)
5. [Technical Specifications](#technical-specifications)
6. [Security and Privacy](#security-and-privacy)
7. [Performance and Scalability](#performance-and-scalability)
8. [Testing and Quality Assurance](#testing-and-quality-assurance)
9. [Deployment and Infrastructure](#deployment-and-infrastructure)
10. [Future Roadmap](#future-roadmap)

---

## Project Definition and Importance

### What is MAEPLE?

**MAEPLE (Mental And Emotional Pattern Literacy Engine)** is a neuro-affirming health intelligence platform designed to help users, particularly those with ADHD, Autism, or CPTSD, understand their mental and emotional patterns through objective and subjective data correlation.

### Why MAEPLE is Important

#### 1. Paradigm Shift from Symptom Surveillance to Pattern Literacy

Traditional mental health applications focus on tracking symptoms and deficits. MAEPLE shifts this paradigm by:

- **Focusing on Context**: Instead of tracking "bad days," MAEPLE tracks the context of energy levels across multiple domains
- **Pattern Recognition**: Identifies recurring patterns that trigger specific states
- **Empowerment Through Data**: Provides users with evidence-based understanding of their unique neurological landscape
- **Advocacy Support**: Enables users to advocate for their needs with objective data

#### 2. Neuro-Affirming Approach

MAEPLE is built on a neuro-affirming framework that:

- **Honors Individual Differences**: Recognizes that neurodivergent individuals have different baselines and patterns
- **Avoids Deficit-Based Language**: Uses capacity-focused terminology instead of disability-focused terms
- **Supports Self-Awareness**: Helps users understand their own unique patterns rather than comparing to neurotypical norms
- **Validates Lived Experience**: Correlates subjective experience with objective physiological data

#### 3. Multi-Dimensional Capacity Tracking

The 7-dimensional Capacity Grid provides a comprehensive view of an individual's current state:

1. **Focus**: Cognitive bandwidth for attention and concentration
2. **Social**: Capacity for interaction and communication
3. **Sensory**: Tolerance for external stimuli
4. **Emotional**: Resilience and emotional regulation capacity
5. **Physical**: Body energy and physical stamina
6. **Structure**: Need for routine and predictability
7. **Executive**: Ability to plan, initiate, and complete tasks

#### 4. Objective Reality Check with Bio-Mirror Technology

Many neurodivergent individuals experience dissociation or masking, where their internal state doesn't match their external presentation. MAEPLE's Bio-Mirror technology:

- **Provides Objective Feedback**: Uses facial analysis (FACS) to detect physiological states
- **Identifies Masking**: Compares subjective reports with objective facial expressions
- **Tracks Fatigue**: Detects physical signs of exhaustion that the user might not consciously register
- **Validates Experience**: Helps users trust their own perceptions when they align with objective data

#### 5. AI-Powered Pattern Recognition

The AI services layer analyzes data across multiple dimensions to:

- **Identify Triggers**: Recognize patterns that lead to specific states
- **Predict Capacity**: Forecast likely capacity based on current conditions
- **Suggest Strategies**: Provide personalized coping strategies based on what has worked in the past
- **Generate Insights**: Create meaningful narratives from data points

#### 6. Offline-First Architecture

MAEPLE respects user privacy and autonomy by:

- **Local-First Data Storage**: Primary data lives on the user's device
- **Optional Cloud Sync**: Users choose when and if to sync data
- **Encrypted Biometric Data**: Sensitive physiological information is encrypted at rest and in transit
- **No Surveillance**: Data is used for personal insight, not for tracking or monetization

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAEPLE System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Frontend   │◄────►│    State     │                    │
│  │  (React 18)  │      │  (Zustand)   │                    │
│  └──────┬───────┘      └──────────────┘                    │
│         │                                                     │
│         ├────────────────────────────────────────────────┐       │
│         │                                            │       │
│         ▼                                            │       │
│  ┌──────────────────────────────────────────────┐     │       │
│  │            Services Layer                    │     │       │
│  ├──────────────────────────────────────────────┤     │       │
│  │ • StorageService (localStorage/IndexedDB)    │     │       │
│  │ • SyncService (Hybrid offline-first)        │     │       │
│  │ • EncryptionService (AES-GCM 256-bit)      │     │       │
│  │ • ComparisonEngine (Correlation logic)       │     │       │
│  │ • ValidationService (Data integrity)        │     │       │
│  │ • RateLimiter (API protection)            │     │       │
│  └──────────────────────────────────────────────┘     │       │
│         │                                            │       │
│         ├────────────────────────────────────────────────┤       │
│         │                                            │       │
│         ▼                                            ▼       │
│  ┌──────────────┐                          ┌──────────────┐ │
│  │   AI Layer   │                          │  Wearables   │ │
│  │ (AIRouter)   │                          │ Integration  │ │
│  ├──────────────┤                          ├──────────────┤ │
│  │ • Gemini     │                          │ • Oura Ring  │ │
│  │ • OpenAI     │                          │ • Apple      │ │
│  │ • Anthropic  │                          │   Health     │ │
│  │ • Perplexity │                          │ • Garmin     │ │
│  │ • Z.ai      │                          │ • Fitbit     │ │
│  └──────┬───────┘                          └──────┬───────┘ │
│         │                                         │        │
│         └────────────────┬────────────────────────┘        │
│                          ▼                                │
│                 ┌──────────────┐                           │
│                 │ Backend API  │                           │
│                 │ (Node/Exp)  │                           │
│                 ├──────────────┤                           │
│                 │ PostgreSQL   │                           │
│                 │ Database     │                           │
│                 └──────────────┘                           │
│                                                          │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM 7
- **PWA**: Service Worker for offline capability
- **Mobile**: Capacitor for native iOS/Android apps

#### Backend

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Rate Limiting**: Express Rate Limiter

#### AI Services

- **Primary**: Google Gemini (multimodal)
- **Secondary**: OpenAI, Anthropic, Perplexity
- **Routing**: Custom AIRouter with capability-based selection
- **Fallback**: Automatic provider switching on failure

#### Development

- **Language**: TypeScript 5.2+
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Testing**: Vitest with React Testing Library
- **Build**: Vite with TypeScript compilation

---

## Core Components Breakdown

### 1. Health Entry System

#### Purpose

The central data structure that captures a user's mental and emotional state at a specific point in time.

#### Functionality

- **Journal Input**: Text or voice-based journaling
- **Capacity Assessment**: 7-point grid with sliders (0-10 scale for each domain)
- **Mood Rating**: 1-5 scale for overall mood
- **Tagging**: Custom tags for pattern identification
- **Timestamping**: Automatic timestamp with optional manual editing
- **AI Analysis**: Automatic pattern recognition and insight generation

#### Data Model

```typescript
interface HealthEntry {
  id: string;
  userId: string;
  timestamp: Date;
  mood: number; // 1-5 scale
  capacity: CapacityProfile; // 7-dimensional grid
  content?: string; // Journal text
  voiceNote?: string; // Encrypted audio reference
  tags: string[];
  aiAnalysis?: AIAnalysis;
  facialAnalysis?: FacialAnalysis;
  wearablesData?: WearablesData;
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CapacityProfile {
  focus: number; // 0-10
  social: number; // 0-10
  sensory: number; // 0-10
  emotional: number; // 0-10
  physical: number; // 0-10
  structure: number; // 0-10
  executive: number; // 0-10
}
```

#### Key Metrics Calculated

- **Bandwidth**: Average capacity across all domains (0-10)
- **Load**: Weighted sum of negative capacity scores
- **Interference**: Cross-domain impact calculations
- **Trend**: Moving average of bandwidth over time

---

### 2. Bio-Mirror Technology

#### Purpose

Provides objective physiological analysis to validate or contrast with subjective self-reports, helping users identify masking or dissociation.

#### Recent Updates

**v0.97.6 (January 2026) - Enhanced FACS Integration**

- **Structured AU Detection**: Proper FACS Action Unit codes with intensity ratings (A-E)
- **Expert AI Persona**: Gemini configured as certified FACS expert
- **Duchenne Smile Detection**: AU6+AU12 = genuine vs AU12 alone = social/masking
- **FACS-Aware Comparison**: Uses AU combinations for accurate discrepancy scoring
- **Enhanced UI**: Displays detected AUs with intensity badges, smile type indicators

**v0.97.9 (February 2026) - AI Response Parsing & Quality Check Fixes**

- **Centralized Response Transformation**: Created `transformAIResponse()` utility to handle AI response format variations
- **Multi-Format Support**: Handles both direct and wrapped AI responses (camelCase + snake_case)
- **Non-Blocking Quality Checks**: Quality assessment now informational, allowing users to see all results
- **Enhanced Debugging**: Detailed logging for AI response parsing pipeline
- **Improved User Experience**: Removed "Did not get good enough picture" false alerts

**v2.2.0**

- **Camera Stability**: Custom `useCameraCapture` hook eliminates flickering
- **Progress Tracking**: Real progress callbacks (not simulated)
- **Timeout**: Extended from 30s to 45s for Gemini 2.0 Flash
- **Offline Fallback**: Basic analysis when AI unavailable
- **Observation Flow**: Results automatically stored in ObservationContext

#### Scientific Foundation

**Facial Action Coding System (FACS)**

- Developed by Paul Ekman and Wallace Friesen (1978)
- Gold standard for measuring facial movements
- Based on anatomical muscle actions, not subjective emotions
- 30+ core Action Units (AUs) describe all facial expressions

**Research References:**

- Ekman, P., & Friesen, W. (1978). _Facial Action Coding System: A Technique for Measurement of Facial Movement_
- Cohn, J. F., et al. (2019). _The Data Face: Facial Expression Recognition, Social Media, and Privacy_
- iMotions. (2024). [_Facial Action Coding System Guide_](https://imotions.com/blog/facial-action-coding-system/)
- Google AI. (2024). [_Gemini Vision API Documentation_](https://ai.google.dev/gemini-api/docs/image-understanding)

#### Technical Implementation

**AI Model Configuration:**

```typescript
Model: "gemini-2.5-flash" // Gemini 2.5 with enhanced vision + segmentation
System Instruction: "Certified FACS expert trained in Ekman-Friesen methodology"
Response Format: Structured JSON with actionUnits[] array
```

**Prompt Engineering:**

- Requests specific AU codes (AU1, AU4, AU6, AU12, AU24, etc.)
- Requires intensity ratings on A-E scale
- Asks for AU combinations analysis (e.g., AU6+AU12 = Duchenne smile)
- Avoids emotion labeling (reports muscle movements only)

**AI Response Parsing Pipeline (v0.97.9):**

The `transformAIResponse` utility ensures consistent data handling across AI response formats.

**Supported Response Formats:**

1. **Direct Structure:**
   ```json
   {
     "confidence": 0.85,
     "actionUnits": [...],
     "facsInterpretation": {...}
   }
   ```

2. **Wrapped Structure:**
   ```json
   {
     "facs_analysis": {
       "confidence": 0.85,
       "actionUnits": [...],
       "facsInterpretation": {...}
     }
   }
   ```

3. **Field Name Variations:**
   - camelCase: `actionUnits`, `jawTension`, `eyeFatigue`
   - snake_case: `action_units_detected`, `jaw_tension`, `eye_fatigue`

**Transformation Logic:**

```typescript
1. Detect and unwrap `facs_analysis` wrapper if present
2. Handle both `action_units_detected` and `actionUnits` array names
3. Map snake_case to camelCase field names
4. Ensure all required fields present with sensible defaults
5. Log transformation for debugging
```

**Why This Matters:**

- AI models may evolve response formats
- Different providers use different conventions
- Centralized logic prevents code duplication
- Single point of maintenance for parsing changes

**Quality Assessment System (v0.97.9):**

The `checkDetectionQuality()` function evaluates detection quality on a 0-100 scale.

**Quality Metrics:**

1. **Confidence Score (40% weight):** AI's confidence in overall detection
2. **AU Count Score (30% weight):** Number of AUs detected (up to 8)
3. **Critical AU Score (30% weight):** Detection of key AUs (AU6, AU12, AU4, AU24)

**Quality Levels:**

- **High (60-100):** Reliable detection, all critical AUs detected
- **Medium (30-59):** Some markers may have been missed
- **Low (0-29):** Limited detection, improvement suggestions provided

**User Experience:**

- **Quality Check is Informational Only:** Users can always view results
- **Suggestions Provided:** Specific guidance for improving capture quality
- **No Blocking:** All results accessible regardless of score
- **Progress Indicators:** Clear feedback during analysis process

**Quality Suggestions:**

For low/medium quality, system provides:
- Lighting recommendations (soft, frontal lighting)
- Positioning guidance (face camera directly)
- Environmental factors (remove glasses, clear hair)
- Technical tips (steady camera, good focus)

**Detection Logic:**

1. **Tension Calculation** (from AUs):

   ```typescript
   tension = AU4_intensity * 0.4 + AU24_intensity * 0.4 + AU14_intensity * 0.2;
   ```

2. **Fatigue Calculation** (from AUs):

   ```typescript
   fatigue = AU43_intensity * 0.5 + AU7_intensity * 0.3 + low_overall_intensity * 0.2;
   ```

3. **Masking Detection** (from AU combinations):
   - AU12 without AU6 = Social smile (potential masking)
   - AU6 + AU12 = Duchenne smile (genuine)
   - High AU4/AU24 + positive mood report = Discrepancy

#### Functionality

- **Camera Capture**: Real-time facial video analysis via stable hook architecture
- **FACS Analysis**: Structured Action Unit detection with intensity scoring
- **Fatigue Detection**: AU43 (Eyes Closed), ptosis, reduced expression intensity
- **Tension Detection**: AU4 (Brow Lowerer), AU24 (Lip Pressor), AU14 (Dimpler)
- **Masking Detection**: Duchenne vs social smile analysis, AU suppression patterns
- **Baseline Calibration**: Individual "resting" state adjustment
- **Discrepancy Scoring**: 0-100 scale comparing subjective vs objective
- **FACS Insights**: Detailed AU breakdown with anatomical names

#### Data Model

```typescript
interface FacialAnalysis {
  // Core FACS Data
  confidence: number; // 0-1 overall confidence
  
  // Structured Action Units (v0.97.6+)
  actionUnits: ActionUnit[]; // Detected FACS AUs with intensity
  
  // FACS Interpretation (v0.97.6+)
  facsInterpretation: {
    duchennSmile: boolean; // AU6+AU12 = genuine
    socialSmile: boolean; // AU12 alone = social
    maskingIndicators: string[]; // Signs of emotional suppression
    fatigueIndicators: string[]; // Signs of tiredness
    tensionIndicators: string[]; // Signs of stress
  };
  
  // Observations
  observations: Array<{
    category: "lighting" | "environmental" | "tension" | "fatigue";
    value: string;
    evidence: string;
    severity: "low" | "moderate" | "high";
  }>;
  
  // Environmental Context
  lighting: string; // "bright fluorescent", "soft natural", etc.
  lightingSeverity: "low" | "moderate" | "high";
  environmentalClues: string[]; // Background elements
  
  // Legacy Numeric Fields (for backward compatibility)
  jawTension: number; // 0-1, derived from AU4, AU24
  eyeFatigue: number; // 0-1, derived from AU43, ptosis
  primaryEmotion?: string; // AI-detected primary emotion
  signs?: string[]; // Legacy sign descriptions
}

interface ActionUnit {
  auCode: string; // "AU1", "AU4", "AU6", etc.
  name: string; // "Inner Brow Raiser", "Brow Lowerer", etc.
  intensity: "A" | "B" | "C" | "D" | "E"; // FACS intensity scale
  intensityNumeric: number; // 1-5 for calculations
  confidence: number; // 0-1 detection confidence
}

interface FacialBaseline {
  userId: string;
  createdAt: Date;
  restPtosis: number;
  restTension: number;
  restSmile: number;
  calibrationSamples: number;
}
```

#### Technical Implementation

- **Video Processing**: Client-side using MediaPipe or similar
- **FACS Mapping**: Maps facial landmarks to FACS action units
- **Privacy**: Images encrypted before storage, deleted after analysis
- **Performance**: 10-second capture window, optimized for mobile

#### Why This Matters

- **Objective Reality Check**: Validates or challenges user's self-perception
- **Masking Awareness**: Helps neurodivergent users identify when they're masking
- **Dissociation Detection**: Identifies when internal state doesn't match external presentation
- **Advocacy Evidence**: Provides objective data for healthcare providers

---

### 3. Comparison Engine

#### Purpose

Correlates subjective journal entries with objective facial analysis to identify patterns of masking, dissociation, or self-awareness accuracy.

#### Functionality

- **Discrepancy Calculation**: Compares subjective mood (1-5) with facial indicators
- **Pattern Recognition**: Identifies when discrepancies occur (e.g., after social events)
- **Trend Analysis**: Tracks self-awareness improvement over time
- **Masking Scenarios**: Flags situations where masking is likely occurring

#### Algorithm

```typescript
function calculateDiscrepancy(
  subjectiveMood: number, // 1-5
  facialAnalysis: FacialAnalysis,
  baseline: FacialBaseline
): number {
  // Normalize subjective mood to 0-1
  const normalizedMood = subjectiveMood / 5;

  // Calculate facial mood from indicators
  const facialMood =
    1 -
    (facialAnalysis.ptosis.overall * 0.3 +
      facialAnalysis.glazedGaze * 0.2 +
      facialAnalysis.overallTension * 0.2 +
      facialAnalysis.maskingDiscrepancy * 0.3);

  // Apply baseline adjustment
  const adjustedFacialMood = facialMood + (1 - baseline.restTension);

  // Calculate discrepancy (0-100)
  const discrepancy = Math.abs(normalizedMood - adjustedFacialMood) * 100;

  return Math.min(100, discrepancy);
}
```

#### Interpretation Guidelines

- **0-20**: High self-awareness, minimal masking
- **21-40**: Mild masking or dissociation
- **41-60**: Moderate masking, may not be aware of true state
- **61-80**: Significant masking or dissociation
- **81-100**: Severe disconnect, possible depersonalization

---

### 4. AI Services Layer

#### Purpose

Provides intelligent analysis, pattern recognition, and personalized insights using multiple AI providers with automatic fallback.

#### Components

##### AIRouter

**Functionality**:

- **Capability-Based Routing**: Routes requests to best provider based on task type
- **Provider Health Monitoring**: Tracks provider availability and response times
- **Automatic Fallback**: Switches to backup provider on failure
- **Cost Optimization**: Routes to cheapest provider for non-critical tasks
- **Usage Tracking**: Monitors token usage and costs per provider

**Provider Capabilities**:

```typescript
interface AICapabilities {
  textGeneration: boolean;
  vision: boolean; // Image analysis
  audio: boolean; // Speech-to-text, text-to-speech
  imageGeneration: boolean;
  search: boolean; // Web search integration
  multimodal: boolean; // Combined text + vision + audio
}

interface AIProvider {
  name: string;
  capabilities: AICapabilities;
  priority: number; // 1 (highest) to 5 (lowest)
  costPer1kTokens: number;
  averageResponseTime: number; // ms
  reliability: number; // 0-1
}
```

**Routing Logic**:

1. **Text Analysis**: Use OpenAI GPT-4 (best for nuanced text)
2. **Vision Analysis**: Use Gemini Pro Vision (excellent at facial analysis)
3. **Voice Processing**: Use Whisper (OpenAI) or Gemini (multimodal)
4. **Live Coaching**: Use Gemini (lowest latency multimodal)
5. **Fallback Chain**: Gemini → OpenAI → Anthropic → Z.ai

##### Live Coach

**Purpose**: Real-time voice interaction for verbal processing and emotional support.

**Functionality**:

- **Voice Input**: Speech-to-text with real-time transcription
- **AI Response**: Context-aware responses based on current state
- **Voice Output**: Text-to-speech with natural voice
- **Emotion Detection**: Analyzes voice patterns for emotional state
- **History Integration**: Accesses recent entries for context

**Technical Implementation**:

```typescript
interface LiveCoachSession {
  id: string;
  userId: string;
  startTime: Date;
  healthEntryId?: string;
  transcript: Message[];
  currentMood?: number;
  suggestedStrategies: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  emotion?: string;
}
```

---

### 5. Storage and Sync System

#### StorageService (Local-First)

**Purpose**: Manages local data persistence using browser APIs optimized for different data types.

**Implementation**:

```typescript
class StorageService {
  // Settings and non-sensitive data
  private settingsStore: LocalStorage;

  // Health entries and journal data
  private entriesStore: IndexedDB;

  // Encrypted biometric data
  private secureStore: IndexedDB;

  // Offline queue
  private queueStore: IndexedDB;
}
```

**Data Storage Strategy**:

- **User Settings**: localStorage (fast access, small data)
- **Health Entries**: IndexedDB (structured, queryable, larger data)
- **Encrypted Images**: IndexedDB (encrypted blobs, accessed via encryption service)
- **Offline Queue**: IndexedDB (pending actions for sync)

#### SyncService (Hybrid Offline-First)

**Purpose**: Synchronizes local data with cloud database while supporting offline operation.

**Key Features**:

- **Last-Write-Wins Conflict Resolution**: Most recent timestamp wins
- **Incremental Sync**: Only transmits changed data
- **Background Sync**: Automatic sync when connectivity returns
- **Pending Queue**: Queues actions while offline
- **Conflict Detection**: Identifies and resolves data conflicts

**Sync Algorithm**:

```typescript
async function syncHealthEntries(
  localEntries: HealthEntry[],
  remoteEntries: HealthEntry[]
): Promise<HealthEntry[]> {
  const conflictResolutions: HealthEntry[] = [];

  // Find conflicts (same ID, different updatedAt)
  const conflicts = localEntries.filter(local =>
    remoteEntries.some(remote => remote.id === local.id && remote.updatedAt !== local.updatedAt)
  );

  // Resolve conflicts (last-write-wins)
  conflicts.forEach(local => {
    const remote = remoteEntries.find(r => r.id === local.id);
    const winner = local.updatedAt > remote.updatedAt ? local : remote;
    conflictResolutions.push(winner);
  });

  return conflictResolutions;
}
```

---

### 6. Encryption Service

#### Purpose

Protects sensitive biometric data using military-grade encryption.

**Implementation**:

- **Algorithm**: AES-GCM 256-bit
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Unique per-user, stored securely
- **IV**: Unique per-encryption, stored with encrypted data

**Key Methods**:

```typescript
class EncryptionService {
  async encrypt(
    data: ArrayBuffer,
    userKey: string
  ): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const salt = await this.getSalt(userKey);
    const key = await this.deriveKey(userKey, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

    return { encrypted, iv };
  }

  async decrypt(encrypted: ArrayBuffer, iv: Uint8Array, userKey: string): Promise<ArrayBuffer> {
    const salt = await this.getSalt(userKey);
    const key = await this.deriveKey(userKey, salt);

    return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
  }
}
```

---

### 7. Wearables Integration

#### Purpose

Correlates objective health metrics with subjective self-reports for comprehensive pattern analysis.

#### Supported Platforms

- **Oura Ring**: Sleep quality, HRV, heart rate, temperature
- **Apple Health**: Activity, heart rate, sleep, respiratory rate
- **Garmin**: Activity, stress score, body battery
- **Fitbit**: Steps, sleep stages, heart rate variability
- **Whoop**: Recovery, strain, sleep performance

#### Data Model

```typescript
interface WearablesData {
  id: string;
  healthEntryId: string;
  source: "oura" | "apple" | "garmin" | "fitbit" | "whoop";
  timestamp: Date;

  // Common metrics
  heartRate?: number; // bpm
  hrv?: number; // ms
  sleepQuality?: number; // 0-100
  steps?: number;
  activityLevel?: number; // 0-100

  // Platform-specific
  platformSpecific?: Record<string, unknown>;
}
```

#### Integration Flow

1. **OAuth2 Authentication**: User grants access to wearables platform
2. **Data Fetching**: Scheduled fetches (every 1-4 hours depending on platform)
3. **Normalization**: Convert platform-specific metrics to standard format
4. **Correlation**: Match with nearby health entries
5. **Pattern Analysis**: AI analyzes relationship between metrics and capacity

---

### 8. Capacity Metrics System

#### Purpose

Standardizes capacity tracking across 7 dimensions with meaningful metrics and visualizations.

#### Dimension Definitions

**Focus (Cognitive Bandwidth)**

- 0-2: Cannot concentrate, brain fog
- 3-5: Limited focus, easily distracted
- 6-8: Good focus, can concentrate on tasks
- 9-10: Hyperfocus state, high productivity

**Social (Interaction Capacity)**

- 0-2: Cannot interact, need isolation
- 3-5: Limited social battery, prefer 1-on-1
- 6-8: Normal social capacity, can handle groups
- 9-10: High social energy, enjoy interaction

**Sensory (Stimuli Tolerance)**

- 0-2: Overwhelmed, sensory overload
- 3-5: Sensitive, need quiet environment
- 6-8: Normal tolerance, manageable environment
- 9-10: High tolerance, can handle loud/busy

**Emotional (Resilience)**

- 0-2: Fragile, easily overwhelmed
- 3-5: Moderate resilience, small setbacks manageable
- 6-8: Good resilience, can handle stress
- 9-10: High resilience, emotionally stable

**Physical (Body Energy)**

- 0-2: Exhausted, need rest
- 3-5: Low energy, slow movement
- 6-8: Normal energy, can do daily tasks
- 9-10: High energy, can exercise or be active

**Structure (Routine Needs)**

- 0-2: High need for structure, changes difficult
- 3-5: Moderate need for routine, prefer predictability
- 6-8: Flexible, can handle some changes
- 9-10: Very flexible, adapt easily to change

**Executive (Planning Ability)**

- 0-2: Cannot plan, need guidance
- 3-5: Limited planning, need supports
- 6-8: Good planning, can organize tasks
- 9-10: Excellent planning, can multitask effectively

#### Calculated Metrics

**Bandwidth**

```
Bandwidth = Average of all 7 dimensions (0-10)
```

**Load**

```
Load = Sum of (10 - dimension) for dimensions below 5
```

**Interference**

```
Interference = Sum of cross-domain negative correlations
Example: Sensory overload (0-2) causing Emotional dysregulation (0-2) = 2
```

**Noise Generators**
Hidden costs that reduce effective capacity:

- **Masking**: Pretending to be okay when not
- **Perfectionism**: Excessive self-criticism
- **People Pleasing**: Prioritizing others over self
- **Sensory Masking**: Pushing through sensory overload

---

### 9. Analytics and Visualization

#### Purpose

Transforms raw data into actionable insights through visualizations and pattern analysis.

#### Components

##### StateTrendChart

**Functionality**: Shows bandwidth trends over time with overlay of events

- **Time Range**: 1 day, 1 week, 1 month, 3 months, 1 year
- **Granularity**: Hourly, daily, weekly, monthly
- **Overlays**: Tags, events, wearables metrics
- **Comparison**: Compare current period to previous period

##### AnalysisDashboard

**Functionality**: Provides comprehensive insights from multiple data streams

- **Pattern Summary**: Recurring situations and states
- **Trigger Analysis**: What typically precedes certain states
- **Strategy Effectiveness**: Which interventions work best
- **Capacity Forecast**: Predictive capacity based on patterns
- **Wearables Correlation**: Health metrics vs. capacity scores

##### ClinicalReport

**Purpose**: Generates professional summary for healthcare providers

- **PDF Export**: Professional format with MAEPLE branding
- **Key Insights**: Top patterns and findings
- **Data Summaries**: Statistical summaries of each dimension
- **Visualizations**: Charts and graphs
- **Recommendations**: AI-generated suggestions for care

---

### 10. Authentication and Security

#### Purpose

Secures user data while maintaining accessibility and usability.

#### Implementation

##### AuthService

- **Registration**: Email/password with validation
- **Login**: JWT token-based authentication
- **Password Reset**: Secure token-based reset flow
- **Session Management**: Token refresh and expiration handling
- **Biometric Auth**: Device biometrics for mobile apps

##### Security Measures

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Short-lived access + refresh tokens
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **HTTPS Required**: All API calls over HTTPS
- **CORS Configured**: Cross-origin requests controlled

---

## Data Flow and Component Interactions

### Typical User Journey

#### 1. Morning Check-In

```
User opens app
    ↓
LoadState (from LocalStorage)
    ↓
Display Dashboard (current state, recent entries)
    ↓
User clicks "New Entry"
    ↓
JournalEntry Component renders
    ↓
User adjusts capacity sliders
    ↓
User adds journal text (or uses voice)
    ↓
User optionally uses Bio-Mirror
    ↓
    ├─→ Camera Capture
    ├─→ Facial Analysis
    ├─→ Discrepancy Calculation
    └─→ Image Encryption and Storage
    ↓
User submits entry
    ↓
ValidationService validates data
    ↓
StorageService saves to IndexedDB
    ↓
AI Services analyze entry (background)
    ↓
SyncService queues for sync (if online)
    ↓
Update UI with new entry
```

#### 2. Pattern Analysis (AI Processing)

```
HealthEntry created
    ↓
Queue for AI processing
    ↓
AIRouter selects provider (Gemini for text + facial)
    ↓
Send to AI:
    - Capacity profile
    - Journal text
    - Facial analysis results
    - Recent entries (for context)
    ↓
AI returns:
    - Pattern insights
    - Trigger identification
    - Strategy suggestions
    - Mood prediction
    ↓
Save AI analysis to HealthEntry
    ↓
Update Analytics
    ↓
Notify user of new insights
```

#### 3. Wearables Data Sync

```
Scheduled sync triggers (every 4 hours)
    ↓
Fetch data from wearables API
    ↓
Normalize data to standard format
    ↓
Match with nearby HealthEntries (within 2 hours)
    ↓
Correlate metrics with capacity scores
    ↓
Store WearablesData
    ↓
Update Analytics with new correlations
    ↓
Optionally notify user of patterns
    ↓
Sync to cloud (if enabled)
```

#### 4. Offline Operation

```
User creates HealthEntry (offline)
    ↓
Save to StorageService (IndexedDB)
    ↓
Queue in OfflineQueue
    ↓
User closes app
    ↓
User reconnects to internet
    ↓
Background Sync Service wakes up
    ↓
Process OfflineQueue
    ↓
For each queued action:
    - Send to API
    - If success: Remove from queue
    - If fail: Retry (with exponential backoff)
    ↓
Fetch any server changes since last sync
    ↓
Resolve conflicts (last-write-wins)
    ↓
Update local storage
    ↓
Notify user of sync status
```

---

## Technical Specifications

### API Reference

#### Health Entries API

```typescript
// GET /api/entries
// Get all entries for authenticated user
interface GetEntriesResponse {
  entries: HealthEntry[];
  count: number;
  hasMore: boolean;
}

// POST /api/entries
// Create new health entry
interface CreateEntryRequest {
  mood: number;
  capacity: CapacityProfile;
  content?: string;
  tags: string[];
}

interface CreateEntryResponse {
  entry: HealthEntry;
  aiAnalysis?: AIAnalysis;
}

// GET /api/entries/:id
// Get specific entry
interface GetEntryResponse {
  entry: HealthEntry;
}

// PUT /api/entries/:id
// Update existing entry
interface UpdateEntryRequest {
  mood?: number;
  capacity?: CapacityProfile;
  content?: string;
  tags?: string[];
}

// DELETE /api/entries/:id
// Delete entry
interface DeleteEntryResponse {
  success: boolean;
}
```

#### Analytics API

```typescript
// GET /api/analytics/trends
// Get capacity trends over time
interface GetTrendsRequest {
  startDate: Date;
  endDate: Date;
  dimensions?: CapacityDimension[];
  granularity: "hourly" | "daily" | "weekly" | "monthly";
}

interface GetTrendsResponse {
  trends: TrendData[];
  patterns: Pattern[];
  triggers: Trigger[];
}

// GET /api/analytics/insights
// Get AI-generated insights
interface GetInsightsResponse {
  insights: Insight[];
  recommendations: Recommendation[];
  predictions: Prediction[];
}

// GET /api/analytics/report
// Generate clinical report
interface GetReportRequest {
  startDate: Date;
  endDate: Date;
  format: "pdf" | "json";
}
```

#### Authentication API

```typescript
// POST /api/auth/register
// Register new user
interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

interface RegisterResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// POST /api/auth/login
// Login user
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/refresh
// Refresh access token
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// Logout user
interface LogoutResponse {
  success: boolean;
}
```

### Database Schema

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email)
);
```

#### Health Entries Table

```sql
CREATE TABLE health_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5) NOT NULL,
  focus INTEGER CHECK (focus >= 0 AND focus <= 10) NOT NULL,
  social INTEGER CHECK (social >= 0 AND social <= 10) NOT NULL,
  sensory INTEGER CHECK (sensory >= 0 AND sensory <= 10) NOT NULL,
  emotional INTEGER CHECK (emotional >= 0 AND emotional <= 10) NOT NULL,
  physical INTEGER CHECK (physical >= 0 AND physical <= 10) NOT NULL,
  structure INTEGER CHECK (structure >= 0 AND structure <= 10) NOT NULL,
  executive INTEGER CHECK (executive >= 0 AND executive <= 10) NOT NULL,
  content TEXT,
  tags TEXT[],
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT TRUE,
  INDEX idx_user_timestamp (user_id, timestamp DESC),
  INDEX idx_mood (mood),
  INDEX idx_tags (tags)
);
```

#### Facial Analysis Table

```sql
CREATE TABLE facial_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_entry_id UUID REFERENCES health_entries(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  image_reference TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  ptosis_left DECIMAL(3,2),
  ptosis_right DECIMAL(3,2),
  ptosis_overall DECIMAL(3,2),
  glazed_gaze DECIMAL(3,2),
  lip_pressor DECIMAL(3,2),
  masseter_tension DECIMAL(3,2),
  overall_tension DECIMAL(3,2),
  social_smile DECIMAL(3,2),
  authentic_smile DECIMAL(3,2),
  masking_discrepancy DECIMAL(3,2),
  discrepancy_score INTEGER CHECK (discrepancy_score >= 0 AND discrepancy_score <= 100),
  interpretation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_entry (health_entry_id)
);
```

#### Wearables Data Table

```sql
CREATE TABLE wearables_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_entry_id UUID REFERENCES health_entries(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL CHECK (source IN ('oura', 'apple', 'garmin', 'fitbit', 'whoop')),
  timestamp TIMESTAMPTZ NOT NULL,
  heart_rate INTEGER,
  hrv DECIMAL(5,2),
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 100),
  steps INTEGER,
  activity_level INTEGER CHECK (activity_level >= 0 AND activity_level <= 100),
  platform_specific JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_entry (health_entry_id),
  INDEX idx_source_timestamp (source, timestamp DESC)
);
```

---

## Security and Privacy

### Data Protection Measures

#### Encryption

- **At Rest**: AES-GCM 256-bit for biometric data
- **In Transit**: TLS 1.3 for all API calls
- **Key Management**: User-derived encryption keys, never stored server-side

#### Privacy Controls

- **Data Ownership**: User owns all data
- **Right to Deletion**: Complete data deletion on request
- **Export Capability**: Full data export in standard format
- **Granular Permissions**: Users control what data is synced

#### Compliance

- **GDPR Ready**: Data portability and deletion rights
- **HIPAA Considerations**: Designed with healthcare data standards in mind
- **COPPA Compliant**: No data collection from users under 13

### Security Best Practices

#### Input Validation

- **Server-Side**: All inputs validated and sanitized
- **Type Checking**: TypeScript prevents type confusion attacks
- **SQL Injection**: Parameterized queries only
- **XSS Prevention**: Content-Security-Policy headers

#### Rate Limiting

- **Per-User**: 55 requests/minute, 1400/day
- **Per-IP**: 100 requests/minute
- **Per-Endpoint**: Different limits for different endpoints

#### Authentication

- **JWT Tokens**: Short-lived (15 minutes) access tokens
- **Refresh Tokens**: Long-lived (30 days) refresh tokens
- **Secure Storage**: Tokens stored in httpOnly cookies or secure storage
- **Biometric**: Device biometrics for mobile apps

---

## Performance and Scalability

### Performance Targets

#### Frontend

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90 across all categories
- **Bundle Size**: < 500KB (gzipped)

#### Backend

- **API Response Time**: < 200ms (p95)
- **Database Queries**: < 50ms (p95)
- **Concurrent Users**: 10,000+ active users
- **Uptime**: 99.9% SLA

### Optimization Strategies

#### Frontend

- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: WebP format with responsive sizes
- **Caching**: Service worker for offline capability
- **Memoization**: React.memo for expensive components

#### Backend

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: PgBouncer for PostgreSQL
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets delivered via CDN
- **Load Balancing**: Multiple API instances behind load balancer

---

## Testing and Quality Assurance

### Testing Strategy

#### Unit Tests

- **Coverage Target**: 80%+ code coverage
- **Critical Path**: 100% coverage for core services
- **Framework**: Vitest with React Testing Library
- **Automation**: Runs on every commit

#### Integration Tests

- **API Testing**: End-to-end API request/response validation
- **Database Testing**: Transaction and query validation
- **Service Integration**: Tests service interactions

#### End-to-End Tests

- **User Flows**: Critical user journey testing
- **Cross-Browser**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS and iOS Safari, Android Chrome

#### Performance Tests

- **Load Testing**: K6 for API load testing
- **Bundle Analysis**: Regular bundle size monitoring
- **Lighthouse CI**: Automated performance testing

### Continuous Integration

#### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      - run: npm run deploy
```

---

## Deployment and Infrastructure

### Infrastructure Stack

#### Frontend

- **Hosting**: Vercel (automated deployments)
- **CDN**: Vercel Edge Network
- **SSL**: Automatic HTTPS with Let's Encrypt
- **Domain**: Custom domain with DNS configuration

#### Backend

- **Hosting**: DigitalOcean or AWS EC2
- **Container**: Docker for consistent deployment
- **Orchestration**: Docker Compose or Kubernetes
- **Monitoring**: Datadog or New Relic

#### Database

- **Primary**: PostgreSQL 14+ on managed service (e.g., AWS RDS)
- **Backups**: Daily automated backups with 30-day retention
- **Replication**: Read replicas for scaling
- **Monitoring**: pgBadger for performance monitoring

### Deployment Process

#### Frontend Deployment

```bash
# 1. Build application
npm run build

# 2. Run tests
npm run test:all

# 3. Deploy to Vercel
vercel --prod

# 4. Run smoke tests
npm run smoke-tests
```

#### Backend Deployment

```bash
# 1. Build Docker image
docker build -t maeple-api:latest .

# 2. Push to registry
docker push registry.example.com/maeple-api:latest

# 3. Deploy to production
kubectl apply -f k8s/deployment.yaml

# 4. Run migrations
npm run migrate

# 5. Verify deployment
npm run health-check
```

---

## Future Roadmap

### Phase 1: Foundation (Complete ✓)

- [x] Core health entry system
- [x] Capacity grid implementation
- [x] Basic AI analysis
- [x] Offline-first architecture
- [x] Local storage with sync

### Phase 2: Enhanced Intelligence (In Progress)

- [ ] Advanced Bio-Mirror with emotion recognition
- [ ] Wearables integration for all major platforms
- [ ] Predictive capacity forecasting
- [ ] Custom strategy recommendations
- [ ] Social sharing (with privacy controls)

### Phase 3: Community and Collaboration

- [ ] Anonymous pattern sharing
- [ ] Community strategies library
- [ ] Healthcare provider portal
- [ ] Group/couple tracking
- [ ] Research contribution opt-in

### Phase 4: Advanced Features

- [ ] Voice journal with sentiment analysis
- [ ] Environmental context detection
- [ ] Medication tracking and correlation
- [ ] Therapy session notes integration
- [ ] Crisis detection and safety protocols

### Phase 5: Ecosystem Integration

- [ ] EHR integration (Epic, Cerner)
- [ ] Telehealth platform integration
- [ ] Research partnerships
- [ ] Clinical validation studies
- [ ] Insurance reimbursement support

---

## Conclusion

MAEPLE represents a paradigm shift in mental health technology by moving from symptom surveillance to pattern literacy. By combining subjective self-reporting with objective physiological data, advanced AI analysis, and a neuro-affirming framework, MAEPLE empowers users to understand their unique patterns and advocate for their needs with data-driven evidence.

The comprehensive architecture ensures privacy, security, and usability while providing powerful insights and support for neurodivergent individuals. The offline-first design respects user autonomy, and the multi-dimensional capacity grid provides a nuanced view of mental health that goes beyond traditional metrics.

As MAEPLE continues to evolve, it will incorporate more advanced features, deeper wearables integration, and stronger community support, ultimately creating a comprehensive ecosystem for mental health understanding and advocacy.

---

**Document Version**: 1.0.0  
**Last Updated**: December 26, 2025  
**Maintained By**: MAEPLE Development Team  
**Contact**: team@maeple.health
