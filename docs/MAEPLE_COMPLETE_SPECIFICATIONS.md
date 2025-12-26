# MAEPLE - Complete System Specifications

**Version**: 2.0 (Enhanced Journal System)  
**Date**: December 26, 2025  
**Status**: Active Development - Journal Enhancement Phase 1-3 Complete

---

## Table of Contents

1. [About MAEPLE](#about-maeple)
2. [System Architecture](#system-architecture)
3. [Core Design Principles](#core-design-principles)
4. [Component Specifications](#component-specifications)
   - [Input Components](#input-components)
   - [Analysis Services](#analysis-services)
   - [Display Components](#display-components)
   - [Data Models](#data-models)
5. [User Flows](#user-flows)
6. [Technical Implementation](#technical-implementation)
7. [Security & Privacy](#security--privacy)
8. [Future Enhancements](#future-enhancements)

---

## About MAEPLE

### What is MAEPLE?

**MAEPLE** (Mental And Emotional Pattern Literacy Engine) is a neuro-affirming health intelligence platform designed to help users, particularly those with ADHD, Autism, or CPTSD, understand their mental and emotional patterns through objective and subjective data correlation.

### Why MAEPLE Matters

**The Problem:**
- Traditional health apps focus on "symptom surveillance" - tracking what's wrong with you
- Subjective self-reporting alone is unreliable due to:
  - **Masking**: Neurodivergent users often hide their true state
  - **Dissociation**: Trauma survivors may be disconnected from emotions
  - **Executive Dysfunction**: May not notice internal signals until overwhelmed
- Current approaches are accusatory ("Your mood doesn't match your face")

**MAEPLE's Solution:**
- Shifts from "symptom surveillance" to **"pattern literacy"** - understanding your unique patterns
- Correlates **subjective reports** (how you feel) with **objective data** (bio-metrics)
- Uses **gentle curiosity** instead of interrogation
- Validates that **appearance doesn't always match internal experience**
- Empowers users with data to advocate for their needs

**Neuro-Affirming Framework:**
- MAEPLE uses a **7-dimensional Capacity Grid** to track energy across domains:
  1. **Focus** (cognitive bandwidth)
  2. **Social** (interaction capacity)
  3. **Sensory** (stimuli tolerance)
  4. **Emotional** (resilience)
  5. **Physical** (body energy)
  6. **Structure** (routine needs)
  7. **Executive** (planning ability)

**Key Metrics:**
- **Bandwidth**: Available capacity in each domain
- **Load**: Current demand on each domain
- **Interference**: Cross-domain disruption (e.g., sensory overload causing emotional dysregulation)
- **Noise Generators**: Hidden costs like masking or perfectionism

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MAEPLE System                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Frontend   │  │   Backend    │  │  Database    │    │
│  │   React 18   │  │  Node.js     │  │ PostgreSQL   │    │
│  │  TypeScript  │  │  Express     │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                               │
│                    ┌───────┴───────┐                      │
│                    │  AI Router    │                      │
│                    │  (Multi-      │                      │
│                    │   provider)   │                      │
│                    └───────┬───────┘                      │
│                            │                               │
│    ┌───────────────┬───────┴───────┬───────────────┐    │
│    │               │               │               │    │
│    ▼               ▼               ▼               ▼    │
│  Gemini         OpenAI          Anthropic       Perplexity│
│  Vision         Text/Img        Claude         Search    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

**Tech Stack:**
- React 18 + TypeScript
- Vite build system
- Zustand state management
- Tailwind CSS styling
- PWA with service worker
- IndexedDB for local storage

**Key Services:**
- **AIRouter**: Multi-provider AI orchestration
- **StorageService**: Local-first persistence
- **SyncService**: Hybrid offline-first sync
- **EncryptionService**: AES-GCM 256-bit encryption
- **RateLimiter**: Client-side API limiting
- **ErrorLogger**: Comprehensive error tracking

### Backend Architecture

**Tech Stack:**
- Node.js + Express
- PostgreSQL database
- JWT authentication
- bcrypt hashing

**API Endpoints:**
- `/api/auth` - User authentication
- `/api/entries` - Health entry CRUD
- `/api/sync` - Data synchronization
- `/api/statecheck` - Bio-Mirror data

---

## Core Design Principles

### 1. Objective, Not Subjective

**Problem with Subjective Labels:**
- "You look sad" - assumes internal state
- "You seem anxious" - makes user feel judged
- "You're masking" - pathologizes normal behavior

**MAEPLE's Objective Approach:**
- "Tension around eyes" - physical observation
- "Fast speech pace (165 words/minute)" - measured data
- "Bright fluorescent lighting" - environmental factor
- Every observation includes evidence

**Example Transformation:**
```
❌ Subjective: "You look tired, your mood (4/5) doesn't match your face"
✅ Objective: "I detected tension around eyes. How are you feeling today?"
```

### 2. Gentle Curiosity, Not Interrogation

**Problem with Interrogation:**
- "Tell me more about why you're sad" - demands explanation
- "Why is your face showing stress?" - challenges user
- "You should be honest with yourself" - accusatory

**MAEPLE's Gentle Approach:**
- "How is that environment affecting you?" - contextual question
- "I noticed [observation]. Would you like to explore that?" - optional
- "Would you like to share more about that?" - invites, doesn't demand

**Example:**
```
❌ Interrogation: "Why are you speaking so fast? Are you stressed?"
✅ Curiosity: "I noticed you're speaking at a faster pace. How is that feeling for you?"
```

### 3. User is Expert, Not the System

**Problem with System as Expert:**
- "Your mood should be X" - system corrects user
- "You're not being honest" - invalidates user's experience
- "Trust my analysis" - dismisses user's judgment

**MAEPLE's User-Centric Approach:**
- "You know your experience better than I do" - validates user
- "Feel free to skip if this doesn't resonate" - gives control
- User can override any suggestion - respects expertise

**Example:**
```
❌ System as Expert: "Our analysis shows you're actually sad, not happy"
✅ User is Expert: "This is what I detected. You know your experience best."
```

### 4. Never Creepy

**Problem with Creepy Approaches:**
- "I can see you're stressed" - feels like surveillance
- "Your biometric data shows..." - impersonal, clinical
- "AI knows how you feel" - unsettling

**MAEPLE's Non-Creepy Approach:**
- "I observed..." - what I can see/hear
- "This is what Mae detected" - transparent tool language
- Confidence scores shown - honesty about uncertainty
- Always optional with skip buttons - user control

**Example:**
```
❌ Creepy: "Our AI can tell you're depressed from your voice"
✅ Non-Creepy: "I noticed fast speech. This is 78% confident. Feel free to skip."
```

### 5. Graceful Degradation

**Problem with Failure Modes:**
- App stops working if AI unavailable
- Blocks user from completing tasks
- Shows scary error messages

**MAEPLE's Resilient Approach:**
- Offline-first operation
- Works without AI (manual entry)
- Clear, friendly error messages
- Progressive enhancement

**Example:**
```
❌ Fragile: "AI unavailable - cannot proceed"
✅ Resilient: "AI is temporarily unavailable. You can still complete this manually."
```

---

## Component Specifications

### Input Components

#### QuickCaptureMenu

**Purpose**: Provide multi-modal entry point for journal input

**Features:**
- Three input methods:
  - 📝 Text - Traditional text entry
  - 🎤 Voice - Voice recording with transcription
  - 📸 Bio-Mirror - Photo analysis

**Design:**
- Three-column grid layout
- Each option has icon, title, description
- Hover states with subtle animation
- Accessible buttons with proper ARIA labels

**Props Interface:**
```typescript
interface QuickCaptureMenuProps {
  onSelectMethod: (method: 'text' | 'voice' | 'bio-mirror') => void;
}
```

**Usage Flow:**
```
User sees QuickCaptureMenu
↓
Selects input method
↓
Appropriate component renders (JournalEntry, VoiceRecording, Bio-Mirror)
```

#### RecordVoiceButton

**Purpose**: Capture audio with real-time transcription and analysis

**Features:**
- **Dual Recording System**:
  - Web Speech API: For real-time transcription
  - MediaRecorder API: For audio blob capture
- **Recording States**:
  - `isListening`: Currently recording
  - `isAnalyzing`: Processing audio (with spinner)
  - `error`: Microphone access issues
- **Visual Feedback**:
  - Pulse animation while recording
  - "Analyzing..." indicator
  - Error tooltips

**Props Interface:**
```typescript
interface RecordVoiceButtonProps {
  onTranscript: (text: string, audioBlob?: Blob, analysis?: AudioAnalysisResult) => void;
  onAnalysisReady?: (analysis: AudioAnalysisResult) => void;
  isDisabled?: boolean;
}
```

**Audio Capture Workflow:**
1. User taps and holds mic
2. Speech recognition starts (transcribing in real-time)
3. MediaRecorder captures audio blob
4. User releases mic
5. Recognition stops, final transcript returned
6. Recorder stops, audio blob created
7. Audio analysis runs (noise, pace, tone)
8. Complete result returned to parent

#### StateCheckCamera

**Purpose**: Capture photos for Bio-Mirror analysis

**Features:**
- Real-time camera feed
- Face detection overlay
- Photo capture with compression
- Quality assessment

**Key Functions:**
- `initializeCamera()`: Request camera permissions
- `capturePhoto()`: Take snapshot
- `compressImage()`: Reduce file size
- `sendForAnalysis()`: Send to Gemini Vision

**Privacy Considerations:**
- Photos processed locally when possible
- Encrypted before cloud storage
- Auto-deleted after analysis (configurable)

---

### Analysis Services

#### audioAnalysisService

**Purpose**: Analyze audio recordings for objective characteristics

**Analysis Dimensions:**

**1. Noise Detection**
- Uses Web Audio API for spectral analysis
- Calculates RMS (root mean square) for volume
- Converts to approximate decibel levels
- Classifies: low, moderate, high

**2. Speech Pace Analysis**
- Counts words from transcript
- Calculates words per minute (WPM)
- Classifies: slow (<120 WPM), moderate (120-160 WPM), fast (>160 WPM)

**3. Vocal Characteristics**
- Pitch variation: flat, normal, varied
- Volume: low, normal, high
- Clarity: mumbled, normal, clear

**4. Confidence Scoring**
- Base confidence: 0.5
- Increases with more observations
- Increases with longer recordings
- Capped at 1.0

**5. Gentle Inquiry Generation**
- Generates contextual questions based on high-severity observations
- Examples:
  - Noise: "How is that environment affecting your focus right now?"
  - Fast speech: "Are you feeling rushed or pressed for time?"

**Return Type:**
```typescript
interface AudioAnalysisResult {
  observations: Array<{
    category: 'noise' | 'speech-pace' | 'tone';
    value: string; // "moderate background noise", "fast pace (165 words/minute)"
    severity: 'low' | 'moderate' | 'high';
    evidence: string; // "measured in audio", "measured at 165 words/minute"
  }>;
  confidence: number; // 0-1
  duration: number; // seconds
  transcript?: string;
  gentleInquiry?: GentleInquiry;
}
```

**Key Design Principles:**
- ✅ Objective data only - NO emotion labels
- ✅ Shows evidence for every observation
- ✅ Confidence scores displayed
- ✅ User can override all suggestions
- ✅ Graceful degradation if analysis fails

#### geminiVisionService

**Purpose**: Analyze photos for objective visual observations

**Analysis Dimensions:**

**1. Lighting Detection**
- Type: Fluorescent, natural, low light
- Severity: low, moderate, high
- Context: Bright, harsh, soft

**2. Tension Indicators**
- Physical tightness indicators
- FACS (Facial Action Coding System) terminology
- Evidence: "visible in facial expression"

**3. Fatigue Indicators**
- Signs of tiredness or drooping
- FACS terminology: "ptosis (drooping eyelids)"
- Evidence: "visible in facial expression"

**4. Environmental Clues**
- Background elements
- Examples: "busy office", "blank wall", "outdoor"
- Context for understanding user's situation

**5. Confidence Scoring**
- Overall confidence in analysis (0-1)
- Mandatory for all analyses

**Return Type:**
```typescript
interface FacialAnalysis {
  confidence: number; // 0-1
  observations: Array<{
    category: 'tension' | 'fatigue' | 'lighting' | 'environmental';
    value: string; // "tension around eyes", "bright fluorescent lighting"
    evidence: string; // "visible in facial expression"
  }>;
  lighting: string; // "bright fluorescent", "soft natural light", "low light"
  lightingSeverity: 'low' | 'moderate' | 'high';
  environmentalClues: string[]; // ["busy office", "blank wall", "outdoor"]
}
```

**Prompt Design:**
```
Analyze this facial image for OBJECTIVE OBSERVATIONS ONLY.

DO NOT:
- Say "the user looks sad/angry/happy" (Subjective)
- Label emotions or feelings
- Make assumptions about internal state

DO:
- Report physical features: "tension around eyes", "drooping eyelids"
- Note lighting conditions: "bright fluorescent lighting"
- Note environmental elements: "busy office background"
- Use FACS terminology: "ptosis (AU43)", "furrowed brow (AU4)"
```

**System Instruction:**
```
You are MAEPLE's Bio-Mirror, an objective observation tool. 
Report ONLY what you can physically observe. NEVER label emotions.
Be precise and evidence-based. Confidence scores are mandatory.
```

**Key Design Principles:**
- ✅ Objective observations only
- ✅ FACS terminology for precision
- ✅ No emotion labels
- ✅ Confidence scores mandatory
- ✅ Shows evidence for each observation

---

### Display Components

#### ObjectiveObservation

**Purpose**: Display objective data from analysis (reusable)

**Features:**
- Category icon matching observation type
- Observation value description
- Severity badge (low/moderate/high)
- Evidence display with checkmark
- Optional skip button

**Props Interface:**
```typescript
interface ObjectiveObservationProps {
  observation: Observation;
  onSkip?: () => void;
}
```

**Visual Hierarchy:**
```
[Icon]  Category Label  [Severity Badge]
        Observation Value
        ✓ Evidence
```

#### VoiceObservations

**Purpose**: Display voice analysis results

**Features:**

**Header:**
- Mic icon with indigo background
- "Voice Analysis" title
- Recording duration displayed
- Confidence score badge (percentage)
- Color-coded: green (80%+), amber (60-79%), gray (<60%)

**Observation Cards:**
Each observation shows:
- Category icon (noise, pace, tone)
- Human-readable label
- Value ("moderate background noise", "fast pace")
- Severity badge (color-coded)
- Evidence ("measured in audio")
- Checkmark for transparency

**Transcript Display:**
- Shown in indigo-tinted box
- Mic icon and "TRANSCRIPT" header
- Italicized text in quotes

**Footer Note:**
- Green-tinted box with checkmark
- Message: "You know your experience better than I do"
- Reinforces user expertise

**Props Interface:**
```typescript
interface VoiceObservationsProps {
  analysis: AudioAnalysisResult;
  onContinue: () => void;
  onSkip?: () => void;
}
```

#### PhotoObservations

**Purpose**: Display Bio-Mirror photo analysis results

**Features:**

**Header:**
- Camera icon with indigo background
- "Bio-Mirror Analysis" title
- "Objective visual observations" subtitle
- Confidence score badge (percentage)

**Lighting Condition Card:**
- Bulb icon (color-coded by type)
- "Lighting Condition" label
- Severity badge (low/moderate/high)
- Lighting description
- "Detected in photo" evidence

**Observation Cards:**
- Category icons (tension, fatigue, environmental)
- Human-readable labels
- Values with FACS terminology
- Evidence display
- Checkmarks

**Environmental Clues:**
- MapPin icon in cyan-tinted box
- "ENVIRONMENT" header
- Tags array (["busy office", "computer screen"])

**Footer Note:**
- Green-tinted box with checkmark
- Message: "Physical appearance doesn't always match how you feel"
- Normalizes discrepancy between appearance and internal state

**Props Interface:**
```typescript
interface PhotoObservationsProps {
  analysis: FacialAnalysis;
  onContinue: () => void;
  onSkip?: () => void;
}
```

#### GentleInquiry

**Purpose**: Contextual questions based on objective data

**Features:**
- Gentle, curious tone
- Based on objective observations
- Optional response buttons (Yes, No, Skip)
- Prominent skip buttons (header and footer)
- "You know best" footer note

**Example Dialog:**
```
💬 Gentle Inquiry

I noticed there was a lot of background noise in your recording.
How is that environment affecting your focus right now?

[Yes, it's distracting]  [No, I'm used to it]  [Skip]

──────────────────────────────

You know your experience best. If this question doesn't resonate,
feel free to skip. There's no right or wrong answer here.

[Skip]
```

**Props Interface:**
```typescript
interface GentleInquiryProps {
  inquiry: GentleInquiry;
  onResponse: (response: 'yes' | 'no' | 'skip') => void;
}
```

**Inquiry Types:**
- Based on noise: Environment impact
- Based on speech pace: Rushed or energetic
- Based on lighting: Sensory considerations
- Based on tension: Physical state

---

### Data Models

#### Observation

**Purpose**: Standardized observation type across all input methods

```typescript
interface Observation {
  category: 'lighting' | 'noise' | 'tension' | 'fatigue' | 'speech-pace' | 'tone';
  value: string; // "bright fluorescent", "moderate background noise"
  severity: 'low' | 'moderate' | 'high';
  evidence: string; // "detected in photo", "measured in audio"
}
```

#### ObjectiveObservation

**Purpose**: Wrapper for observations with metadata

```typescript
interface ObjectiveObservation {
  type: 'visual' | 'audio' | 'text';
  source: 'bio-mirror' | 'voice' | 'text-input';
  observations: Observation[];
  confidence: number; // 0-1
  timestamp: string; // ISO date string
}
```

#### GentleInquiry

**Purpose**: Contextual question based on objective data

```typescript
interface GentleInquiry {
  id: string;
  basedOn: string[]; // ["lighting detected", "user mentioned 'harsh'"]
  question: string; // "How is that lighting affecting you?"
  tone: 'curious' | 'supportive' | 'informational';
  skipAllowed: boolean; // Always true
  priority: 'low' | 'medium' | 'high';
}
```

#### CapacityProfile

**Purpose**: 7-dimensional energy tracking

```typescript
interface CapacityProfile {
  focus: number; // Deep work / Hyperfocus (0-10)
  social: number; // Interaction bandwidth (0-10)
  structure: number; // Meetings / Admin tolerance (0-10)
  emotional: number; // Caregiving / Processing (0-10)
  physical: number; // Movement energy (0-10)
  sensory: number; // Noise / Light tolerance (0-10)
  executive: number; // Decision making (0-10)
}
```

**Key Metrics:**
- **Bandwidth**: Available capacity (current value)
- **Load**: Current demand (inverse of bandwidth)
- **Interference**: Cross-domain disruption

#### HealthEntry

**Purpose**: Central record for journal entries

```typescript
interface HealthEntry {
  id: string;
  timestamp: string; // ISO string
  rawText: string;
  mood: number; // 1-5
  moodLabel: string;
  medications: Medication[];
  symptoms: Symptom[];
  tags: string[];
  activityTypes: string[]; // #DeepWork, #Meeting, #Social
  strengths: string[]; // Character strengths
  neuroMetrics: NeuroMetrics;
  sleep?: SleepData;
  notes: string;
  aiStrategies?: StrategyRecommendation[];
  aiReasoning?: string;
  objectiveObservations?: ObjectiveObservation[];
  updatedAt?: string; // For sync conflict resolution
}
```

---

## User Flows

### Flow 1: Voice Journal Entry

```
1. User opens journal
   ↓
2. QuickCaptureMenu displays
   ↓
3. User selects "🎤 Voice"
   ↓
4. RecordVoiceButton renders
   ↓
5. User taps and holds mic
   - Pulse animation shows
   - Real-time transcription appears
   ↓
6. User releases mic
   - "Analyzing..." indicator shows
   - Audio blob processed
   ↓
7. VoiceObservations displays
   - Shows noise level
   - Shows speech pace
   - Shows vocal characteristics
   - Displays transcript
   ↓
8. Optional: GentleInquiry triggers (if high severity)
   - Contextual question based on observations
   - User responds or skips
   ↓
9. User adjusts capacity sliders
   - Pre-populated from observations
   - User can override
   ↓
10. Entry saved
```

**Time**: 20-40 seconds  
**Psychological Safety**: High throughout (objective, optional, user-centric)

### Flow 2: Bio-Mirror Journal Entry

```
1. User opens journal
   ↓
2. QuickCaptureMenu displays
   ↓
3. User selects "📸 Bio-Mirror"
   ↓
4. StateCheckCamera renders
   - Camera feed shows
   - Face detection overlay
   ↓
5. User taps to capture
   - Photo taken
   - Compressed
   ↓
6. Photo sent to Gemini Vision
   - "Analyzing..." indicator
   - 2-3 seconds processing
   ↓
7. PhotoObservations displays
   - Lighting condition
   - Tension indicators
   - Fatigue indicators
   - Environmental clues
   ↓
8. Optional: GentleInquiry triggers
   - Contextual question
   - User responds or skips
   ↓
9. User adjusts capacity sliders
   - Pre-populated from observations
   - User can override
   ↓
10. Entry saved
```

**Time**: 30-60 seconds  
**Psychological Safety**: High throughout (objective, optional, normalizes discrepancy)

### Flow 3: Text Journal Entry

```
1. User opens journal
   ↓
2. QuickCaptureMenu displays
   ↓
3. User selects "📝 Text"
   ↓
4. JournalEntry renders
   - Text area for free-form input
   - Quick buttons for common phrases
   ↓
5. User types or dictates
   - Text captured
   - Voice input supported
   ↓
6. Entry analyzed by AI
   - Mood extracted
   - Activity types identified
   - Observations from text (e.g., mentions of "harsh lighting")
   ↓
7. Optional: GentleInquiry triggers
   - Contextual question based on text
   - User responds or skips
   ↓
8. User adjusts capacity sliders
   - Pre-populated from analysis
   - User can override
   ↓
9. Entry saved
```

**Time**: 2-5 minutes  
**Psychological Safety**: High throughout (optional observations, user expertise validated)

---

## Technical Implementation

### AI Router Architecture

**Purpose**: Multi-provider AI orchestration with capability-based routing

**Supported Providers:**
- Gemini (Google)
- OpenAI (GPT-4, GPT-4 Vision)
- Anthropic (Claude)
- Perplexity (Search)
- OpenRouter (Multi-provider gateway)
- Ollama (Local models)
- Z.ai

**Router Logic:**
```typescript
interface AIRouter {
  text(prompt: string, options?: RequestOptions): Promise<AIResponse>;
  image(prompt: string, options?: RequestOptions): Promise<AIImageResponse>;
  audio(audioBlob: Blob, options?: RequestOptions): Promise<AIResponse>;
  vision(imageData: string, prompt: string): Promise<AIResponse>;
  search(query: string): Promise<AIResponseWithSources>;
}
```

**Capability-Based Routing:**
1. Check provider capabilities (text, vision, audio, image-gen)
2. Select best provider for task
3. Fallback chain if primary fails
4. Load balancing for multiple providers

### State Management (Zustand)

**Key Stores:**

**appStore**
- Current view/route
- Journal session state
- Observation history
- Theme preferences

**authStore**
- User authentication state
- JWT token management
- Profile data

**syncStore**
- Sync status (syncing, complete, offline)
- Pending changes queue
- Conflict resolution

### Storage Strategy

**Local-First Architecture:**
1. All data saved to IndexedDB locally first
2. Background sync to PostgreSQL when online
3. Offline operation with pending change queue
4. Last-write-wins conflict resolution

**Data Layers:**
```
UI Layer
   ↓
Zustand Stores (In-memory)
   ↓
IndexedDB (Local persistence)
   ↓
SyncService (Background queue)
   ↓
PostgreSQL (Cloud storage)
```

**Encryption:**
- Sensitive biometric data: AES-GCM 256-bit encryption
- Encryption key stored locally (never sent to cloud)
- Photos: Encrypted before cloud storage
- Audio blobs: Processed locally, only analysis stored

### Performance Optimizations

**Image Processing:**
- Web Worker for compression
- Progressive JPEG loading
- Lazy loading for gallery views
- Thumbnail generation

**Audio Processing:**
- Real-time transcription (no waiting)
- Background analysis (non-blocking)
- Chunking for long recordings

**API Rate Limiting:**
- Client-side token bucket
- 55 requests/minute
- 1400 requests/day
- Priority-based queueing

---

## Security & Privacy

### Authentication

**JWT-Based Auth:**
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry
- Secure httpOnly cookies for refresh tokens
- Automatic token refresh

**Password Security:**
- bcrypt hashing (12 rounds)
- Minimum 8 characters
- No password reuse checking

### Data Privacy

**Data Classification:**

**Public:**
- Username (if public profile)
- Public posts (if enabled)

**Private:**
- All health entries
- Bio-metric data
- Photos (encrypted)
- Audio analysis (encrypted)

**Sensitive:**
- Facial recognition data (never stored)
- Voice recordings (processed locally)
- Encryption keys (local only)

**Right to Deletion:**
- Users can delete all data
- Automatic data retention policy (configurable)
- Export function for data portability

### HIPAA Considerations

**If used clinically:**
- BAA (Business Associate Agreement) with providers
- Audit logging for all data access
- Data encryption at rest and in transit
- Access controls and authentication
- Data backup and disaster recovery
**Note**: Currently for personal use, not clinical

---

## Future Enhancements

### Phase 4: Informed Capacity Calibration (Days 8-9)

**Planned Features:**
- CapacityCalibration component
- "Informed by X" context for sliders
- Pre-population from observations
- User acknowledgment system

### Phase 5: Friendly Pattern Discovery (Days 10-11)

**Planned Features:**
- PatternInsights component
- Weekly/monthly trend analysis
- Capacity correlation discovery
- Gentle pattern explanations

### Phase 6: Integration & Polish (Days 12-13)

**Planned Features:**
- StateCheckWizard discrepancy refactoring
- Complete user flow testing
- Performance optimization
- UI polish

### Phase 7: Testing & Refinement (Days 14-15)

**Planned Features:**
- User testing with neurodivergent participants
- Accessibility audit
- Performance testing
- Bug fixes

### Long-Term Enhancements

**1. Advanced Bio-Metrics**
- Apple Health integration (HRV, sleep stages)
- Oura Ring integration (recovery score)
- Garmin/Fitbit integration (activity data)
- WHOOP integration (strain and recovery)

**2. Enhanced AI**
- Fine-tuned models on neurodivergent data
- Contextual pattern recognition
- Predictive capability forecasting
- Personalized strategy generation

**3. Social Features (Optional)**
- Caregiver sharing (with consent)
- Anonymous pattern sharing
- Community insights
- Peer support

**4. Wearable Integration**
- Smart watch notifications
- Voice commands for quick capture
- Ambient notifications for breaks
- Capacity trend alerts

---

## Conclusion

MAEPLE is a **neuro-affirming health intelligence platform** that shifts from traditional "symptom surveillance" to "pattern literacy." By correlating subjective self-reports with objective bio-metrics, it helps users understand their unique patterns and advocate for their needs with data-driven evidence.

**Key Differentiators:**

1. **Objective, Not Subjective**: Reports what is observed, not what is "thought"
2. **Gentle Curiosity**: Invites exploration instead of demanding explanation
3. **User is Expert**: Validates user's experience over system judgment
4. **Never Creepy**: Transparent, optional, user-controlled
5. **Resilient**: Works offline, graceful degradation, multiple input methods

**Current Status:**
- ✅ Phase 1-3 Complete: Core infrastructure, audio analysis, enhanced Bio-Mirror
- 🔄 Phase 4-7: In progress
- 📅 Target Completion: January 15, 2026

**Impact:**
- Empowers neurodivergent users with pattern literacy
- Reduces masking by validating internal experience
- Provides data for self-advocacy
- Supports emotional regulation through objective self-awareness

MAEPLE is not just another health tracking app - it's a tool for building **pattern literacy** and understanding your unique neurodivergent experience.
