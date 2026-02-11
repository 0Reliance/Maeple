# MAEPLE Component Reference

**Version**: 0.97.9  
**Last Updated**: February 9, 2026  
**Total Components**: 40 (11,726 lines)

This document provides detailed definitions for every React component in the MAEPLE application, organized by feature domain.

---

## Table of Contents

1. [Application Shell](#1-application-shell)
2. [Journal & Energy Check-in](#2-journal--energy-check-in)
3. [Bio Mirror (FACS Analysis)](#3-bio-mirror-facs-analysis)
4. [Dashboard & Analytics](#4-dashboard--analytics)
5. [AI & Live Coach](#5-ai--live-coach)
6. [Observation System](#6-observation-system)
7. [Authentication & Sync](#7-authentication--sync)
8. [Settings & Configuration](#8-settings--configuration)
9. [Navigation & Layout](#9-navigation--layout)
10. [Error Handling](#10-error-handling)
11. [Informational Pages](#11-informational-pages)
12. [Shared UI Primitives](#12-shared-ui-primitives)

---

## 1. Application Shell

### `App.tsx` (304 lines)

**Purpose**: Root application component. Wraps the entire app in providers and defines all routes.

**Responsibilities**:
- Initializes AI services, authentication, background sync, and notifications on startup
- Provides `DependencyProvider` (service DI) and `ObservationProvider` (observation state) contexts
- Defines all routes via React Router DOM with lazy-loaded heavy components
- Manages PWA install prompt
- Renders `MobileNav` bottom navigation and `ToastNotification` system

**Lazy-Loaded Components**: HealthMetricsDashboard, LiveCoach, VisionBoard, StateCheckWizard, Settings, ClinicalReport, BetaDashboard

**Key Dependencies**: `useAppStore`, `useAuthStore`, `DependencyProvider`, `ObservationProvider`

**Initialization Flow**:
1. `initializeAI()` — configure AI providers
2. `initializeAuth()` — restore auth session
3. `initializeApp()` — load entries from storage
4. `initBackgroundSync()` — start periodic sync
5. `initNotificationService()` — setup notifications

---

## 2. Journal & Energy Check-in

### `JournalEntry.tsx` (829 lines)

**Purpose**: The primary data entry component. Combines journal text/voice input, the 7-dimension Energy Check-in capacity grid, AI analysis, and optional Bio Mirror capture into a single entry flow.

**Sections**:
1. **Capture Method Selection** — text, voice, or photo (via `QuickCaptureMenu`)
2. **Energy Check-in** — 7 `CapacitySlider` components for capacity dimensions
3. **Journal Text Input** — freeform journaling with real-time AI suggestions
4. **Voice Recording** — audio capture with transcription (via `RecordVoiceButton`)
5. **Bio Mirror** — optional photo analysis (via `BiofeedbackCameraModal`)
6. **AI Strategies** — AI-generated coping strategies based on entry data
7. **Gentle Inquiry** — contextual follow-up questions (via `GentleInquiry`)

**Props**: `onSave`, `existingEntry?`, `initialMode?`

**State Management**:
- Local state for mood (1-5), capacity profile, raw text, tags, symptoms, medications
- Calls `useAppStore().addEntry()` on save
- AI analysis runs asynchronously after submission

**Key Functions**:
- `handleSave()` — validates and saves entry to storage
- `handleAIAnalysis()` — sends entry to AI for pattern analysis
- `handleCapacityChange()` — updates individual capacity dimensions
- `handleVoiceTranscript()` — processes voice recording output

---

### `JournalView.tsx`

**Purpose**: Wrapper component for the journal view. Renders `JournalEntry` with the entry list/timeline.

---

### `CapacitySlider.tsx` (98 lines)

**Purpose**: Individual range slider for one capacity dimension in the Energy Check-in section.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Dimension name (e.g., "Focus", "Social") |
| `value` | `number` | Current value (0-10) |
| `onChange` | `(value: number) => void` | Value change handler |
| `icon` | `ReactNode` | Dimension icon |
| `color` | `string` | Tailwind color class for the slider |
| `description?` | `string` | Tooltip text explaining the dimension |

**Implementation Details**:
- Uses native `<input type="range">` with custom styling
- Converts `e.target.value` to `Number()` with NaN guard (prevents state corruption)
- Gradient fill based on current value
- Accessible with `aria-label` and `aria-valuemin/max/now`

---

### `RecordVoiceButton.tsx` (380 lines)

**Purpose**: Voice recording button with real-time transcription via Web Speech API.

**Features**:
- Start/stop recording with visual feedback
- Real-time speech-to-text transcription
- Audio level visualization
- Duration tracking
- Outputs transcript text for journal entry

**State**: Recording status, duration timer, audio chunks, transcript accumulation

---

### `QuickCaptureMenu.tsx` (102 lines)

**Purpose**: Capture method selector offering three equally-valid input options: Bio Mirror (photo), Voice, or Text.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `onMethodSelect` | `(method: 'bio-mirror' \| 'voice' \| 'text') => void` | Selection handler |
| `disabled?` | `boolean` | Disable all options |

**Design**: Three cards in a grid layout, no hierarchy between methods. User chooses what matches their current capacity.

---

### `TimelineEntry.tsx` (179 lines)

**Purpose**: Renders a single journal entry in the timeline/list view.

**Displays**: Timestamp, mood indicator, capacity summary, tags, truncated text preview, AI strategy badges.

---

## 3. Bio Mirror (FACS Analysis)

### `StateCheckWizard.tsx` (271 lines)

**Purpose**: Main orchestrator for the Bio Mirror flow. Manages the 4-step wizard: INTRO → CAMERA → ANALYZING → RESULTS/ERROR.

**Step Flow**:
1. **INTRO**: Explains Bio Mirror, offers calibration link
2. **CAMERA**: Opens `BiofeedbackCameraModal` for photo capture
3. **ANALYZING**: Runs FACS analysis via `StateCheckAnalyzing`
4. **RESULTS/ERROR**: Displays results or error recovery

**Key Logic**:
- `handleAnalysisComplete(results)` — accepts results including empty `actionUnits[]` (graceful degradation). Only null/undefined results route to ERROR.
- Camera capture produces base64 image → compressed → sent to Gemini Vision
- Results optionally saved to encrypted IndexedDB via `stateCheckService`

**Dependencies**: `useVisionService()` (from DependencyContext)

---

### `BiofeedbackCameraModal.tsx` (301 lines)

**Purpose**: Portal-based camera modal for Bio Mirror photo capture. Renders outside the DOM tree to prevent CSS interference.

**Features**:
- Uses `useCameraCapture` hook for stable camera management
- Canvas-based image capture from video stream
- Image compression via `compressCapturedImage()` pipeline
- Front/back camera switching
- Portal captures all mouse events with `stopPropagation()` to prevent event leakage
- GPU optimizations (`willChange`, `contain`, `isolation`) on video elements

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Modal visibility |
| `onClose` | `() => void` | Close handler |
| `onCapture` | `(imageSrc: string) => void` | Capture callback with base64 |

---

### `StateCheckAnalyzing.tsx` (501 lines)

**Purpose**: Analysis UI shown during FACS processing. Displays real-time progress steps, facial landmark overlays, and intermediate AU detection results.

**UI Elements**:
- Progress stepper (Capturing → Processing → Analyzing → Complete)
- Animated facial landmark overlay on captured image
- Real-time AU detection feed (shows AUs as they're detected)
- Confidence score display
- Error handling with fallback analysis

**Key Logic**:
- Calls `geminiVisionService.analyzeImage()` with structured FACS prompt
- Transforms raw response via `transformAIResponse()` for format normalization
- Error fallback produces a minimal `FacialAnalysis` with empty AUs and informative message (no invalid properties)

---

### `StateCheckResults.tsx` (431 lines)

**Purpose**: Displays the complete FACS analysis results with comparison to journal mood.

**Sections**:
1. **Quality Assessment** — detection quality score with suggestions (informational only, never blocks)
2. **FACS Breakdown** — detected Action Units with intensity badges (A-E scale)
3. **Smile Analysis** — Duchenne (genuine) vs Social (posed) smile detection
4. **Tension & Fatigue** — AU-derived tension/fatigue scores with baselines
5. **Discrepancy Score** — 0-100 comparison of facial indicators vs reported mood
6. **Masking Indicators** — flags when facial expression contradicts mood report
7. **Save/Discard** — option to save encrypted results

**Key Logic**:
- `showResults` initializes to `true` — results display immediately for medium/high quality
- Low-quality results show quality gate first with improvement suggestions
- Calls `compareSubjectiveToObjective()` from comparison engine
- Save action encrypts and stores via `stateCheckService`

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `analysis` | `FacialAnalysis` | FACS analysis results |
| `journalEntry?` | `HealthEntry` | Optional journal for comparison |
| `onSave` | `() => void` | Save handler |
| `onDiscard` | `() => void` | Discard handler |

---

### `StateCheckCamera.tsx` (226 lines)

**Purpose**: Camera capture component used specifically by `BioCalibration`. Provides a simpler camera interface for baseline calibration.

**Key Fix (v0.97.9)**: `setIsCapturing(false)` now called on success path (was only reset on error, leaving capture button permanently disabled).

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `onCapture` | `(imageSrc: string) => void` | Capture callback |
| `onError?` | `(error: string) => void` | Error callback |

---

### `BioCalibration.tsx` (203 lines)

**Purpose**: Baseline calibration wizard for Bio Mirror. Captures user's neutral/resting facial state to establish personal baselines.

**Flow**: INTRO → CAMERA → ANALYZING → SUCCESS/ERROR

**Captures**:
- `neutralTension` — baseline tension level at rest
- `neutralFatigue` — baseline fatigue level at rest  
- `neutralMasking` — baseline masking level at rest

**Output**: Saves `FacialBaseline` via `stateCheckService.saveBaseline()`

---

### `PhotoObservations.tsx` (242 lines)

**Purpose**: Displays objective observations from a Bio Mirror photo analysis.

**Shows**:
- Lighting conditions and severity
- Tension indicators (AU4, AU24 based)
- Fatigue indicators (AU43, ptosis based)
- Environmental cues from background
- Improvement suggestions

**Design Principles**: Objective data only (no emotion labels). Always optional with prominent skip button.

---

## 4. Dashboard & Analytics

### `HealthMetricsDashboard.tsx` (1,044 lines)

**Purpose**: The main "Patterns" view. Comprehensive dashboard with tabbed interface showing longitudinal health data, charts, insights, and clinical reporting.

**Tabs**:
1. **Daily Patterns** — capacity trend charts, burnout prediction, cycle tracking, sleep analytics, cold-start empty states
2. **Clinical Report** — (rendered by `ClinicalReport` component)

**Charts** (via Recharts):
- Mood trend over time (area chart)
- Capacity heatmap (7 dimensions)
- Bandwidth moving average
- Correlation visualizations
- Empty state overlays with guidance icons for new users

**Dependencies**: `useAppStore().entries`, `generateInsights()`, `calculateBurnoutTrajectory()`

---

### `AnalysisDashboard.tsx` (162 lines)

**Purpose**: Analytics summary cards showing mood statistics, medication tracking, symptom counts, and AI-generated insights.

**Displays**:
- Average mood score
- Total medications tracked
- Total symptoms logged
- AI insight cards (correlation, warning, strength types)

---

### `ClinicalReport.tsx` (301 lines)

**Purpose**: Professional clinical summary for healthcare providers, printable as PDF.

**Sections**:
- Executive summary with date range
- Average capacity profile (radar chart)
- 30-day stability trend (area chart)
- Correlational analysis from AI insights
- Print-to-PDF button

**Minimum Data**: Requires 5+ entries for meaningful analysis.

---

### `StateTrendChart.tsx` (101 lines)

**Purpose**: Reusable capacity trend chart component showing bandwidth over time.

**Props**: `entries: HealthEntry[]`, `timeRange`, `dimensions`

---

## 5. AI & Live Coach

### `LiveCoach.tsx` (266 lines) — exported as `VoiceIntake`

**Purpose**: Real-time voice interaction with Mae, the AI companion. Captures voice, processes through Gemini, and displays conversation.

**Features**:
- Voice recording via MediaRecorder API
- Audio sent to AI service for analysis
- Real-time transcript display
- Session save to journal entry
- Circuit breaker state monitoring

**Technical Flow**:
1. User clicks record → `MediaRecorder` captures audio chunks
2. On stop → audio Blob assembled → sent to `aiService`
3. AI processes voice → returns text response
4. Transcript displayed in chat bubbles
5. User can save session as journal entry via `addEntry()`

---

### `AILoadingState.tsx`

**Purpose**: Full-screen or card overlay displayed during AI processing.

**Props**: `message: string`, `steps: string[]` — shows progress through named steps.

---

### `AIProviderSettings.tsx` (379 lines)

**Purpose**: Settings panel for configuring multiple AI providers (API keys, model selection, priority).

**Manages**: Provider enable/disable, API key entry, model configuration, priority ordering.

---

### `AIProviderStats.tsx` (134 lines)

**Purpose**: Displays AI provider usage statistics — request counts, token usage, error rates, costs per provider.

---

## 6. Observation System

### `GentleInquiry.tsx` (180 lines)

**Purpose**: Displays contextual follow-up questions based on objective observations. Questions are curious (not interrogative), always optional, and based on observed data only.

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `inquiry` | `GentleInquiryType` | Question data with tone, options |
| `onResponse` | `(response: string) => void` | Answer handler |
| `onSkip` | `() => void` | Skip handler (always prominent) |

**Tone Colors**: Curious (teal), Concerned (amber), Supportive (purple), Neutral (slate)

---

### `ObjectiveObservation.tsx` (142 lines)

**Purpose**: Displays a single objective observation that Mae detected from user input (voice, photo, or text).

**Shows**: Observation type, evidence, confidence score, severity indicator.

**Design**: Always provides skip button — user is in control.

---

### `VoiceObservations.tsx` (189 lines)

**Purpose**: Displays objective observations extracted from voice recordings: pitch patterns, speaking pace, energy level, background noise, breathing patterns.

---

## 7. Authentication & Sync

### `AuthModal.tsx` (329 lines)

**Purpose**: Sign in/up modal for cloud sync authentication.

**Modes**: Sign In (email/password), Sign Up (email/password), Magic Link (passwordless)

**Dependencies**: `authService` (signInWithEmail, signUpWithEmail, signInWithMagicLink)

---

### `CloudSyncSettings.tsx` (413 lines)

**Purpose**: UI for managing cloud synchronization — sync status, push/pull controls, sync statistics.

**Features**:
- Auth state display (signed in/out)
- Manual sync triggers (push, pull, full sync)
- Sync statistics (local entries, remote entries, pending)
- Conflict resolution status
- Auth modal launcher

---

### `SyncIndicator.tsx`

**Purpose**: Compact sync status indicator icon shown in the app header. Shows sync state (idle, syncing, error, offline).

---

## 8. Settings & Configuration

### `Settings.tsx` (736 lines)

**Purpose**: Main settings page with multiple sections.

**Sections**:
1. **Profile** — display name, email
2. **Appearance** — theme (light/dark/system)
3. **AI Providers** — links to `AIProviderSettings`
4. **Cloud Sync** — links to `CloudSyncSettings`
5. **Notifications** — links to `NotificationSettings`
6. **Data Management** — export, import, clear data
7. **Help & Resources** — replay onboarding, links to docs
8. **About** — version, legal

---

### `NotificationSettings.tsx` (251 lines)

**Purpose**: Notification preferences including journal reminders, check-in prompts, and browser notification permissions.

---

## 9. Navigation & Layout

### `MobileNav.tsx` (226 lines)

**Purpose**: Bottom navigation bar visible on all screen sizes.

**Navigation Items** (5):
1. **Patterns** → `/dashboard` (LayoutDashboard icon)
2. **Reflect** → `/bio-mirror` (Camera icon)
3. **Capture** → `/journal` (center floating action button)
4. **Guide** → `/coach` (MessagesSquare icon)
5. **User** → dropdown menu (User avatar icon)

**User Menu Dropdown**: Opens upward from bottom nav with links to Settings, MAEPLE Report, Wellness Assistant, Guide & Vision, Terms, Beta Dashboard, Sign Out.

---

### `UserMenu.tsx` (109 lines)

**Purpose**: User profile dropdown menu triggered from bottom nav. Shows account info and navigation links.

---

### `LandingPage.tsx` (347 lines)

**Purpose**: Pre-authentication landing page shown to unauthenticated users. Hero section with feature highlights and sign in/up CTAs.

---

## 10. Error Handling

### `ErrorBoundary.tsx` (288 lines)

**Purpose**: React error boundary that catches component rendering errors and displays recovery UI.

**Features**:
- Stable error ID generation (deterministic across re-renders)
- Error logging via `errorLogger`
- Retry button (re-renders children)
- Go Home button (navigates to `/`)
- Custom fallback component support via `fallback` prop
- Context-aware error messages

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Wrapped components |
| `fallback?` | `ComponentType<{error, retry}>` | Custom error UI |
| `onError?` | `(error, errorInfo) => void` | Error callback |
| `context?` | `string` | Display context label |

---

### `ErrorMessages.tsx` (392 lines)

**Purpose**: Collection of error message components for different error types — network errors, AI errors, validation errors, storage errors.

---

### `ToastNotification.tsx` (220 lines)

**Purpose**: Toast notification system for transient messages (success, warning, error, info).

**Features**: Auto-dismiss with configurable duration, stacking, dismiss on click.

---

### `TypingIndicator.tsx`

**Purpose**: Bouncing dots animation for chat interfaces during AI response generation.

---

## 11. Informational Pages

### `Guide.tsx` (168 lines)

**Purpose**: The "Poziverse" guide page explaining MAEPLE's philosophy, capacity metrics vocabulary, and features.

**Sections**: Hero (vision statement), Metric Dictionary (bandwidth, load, interference), Feature explanations.

---

### `VisionBoard.tsx` (309 lines)

**Purpose**: Personal vision board for goal setting and tracking, with AI-assisted reflection.

---

### `SearchResources.tsx` (234 lines)

**Purpose**: Resource search page for finding coping strategies, techniques, and educational content.

---

### `Roadmap.tsx` (151 lines)

**Purpose**: Product roadmap displaying planned features across phases with completion status.

---

### `Terms.tsx` (122 lines)

**Purpose**: Terms of service and legal information page.

---

### `BetaDashboard.tsx` (198 lines)

**Purpose**: Beta testing dashboard showing error logs, error statistics, and debugging tools.

**Features**: Error log viewer with expandable details, stats overview, copy-to-clipboard, clear logs, refresh.

**Dependencies**: `errorLogger` service

---

## 12. Shared UI Primitives

### `ui/Card.tsx`

**Purpose**: Card container with optional hover effects.

**Props**:
- `hoverable?: boolean` (default `false`) — when `true`, applies scale-on-hover. Default is shadow/border hover only.
- Base class includes `position: relative` for proper absolute child positioning.

### `ui/Button.tsx`

**Purpose**: Button component with variants (primary, secondary, ghost, danger) and sizes.

### `ui/Badge.tsx`

**Purpose**: Small badge/pill component for labels and status indicators.

### `ui/Input.tsx` (140 lines)

**Purpose**: Styled input component with label, error state, and helper text support.

### `ui/Icons.tsx`

**Purpose**: Custom icon components and Lucide icon re-exports.

---

## Component Dependency Graph

```
App.tsx
├── DependencyProvider (contexts/DependencyContext)
│   └── ObservationProvider (contexts/ObservationContext)
│       ├── MobileNav
│       ├── ToastNotification
│       └── Routes
│           ├── JournalView
│           │   └── JournalEntry
│           │       ├── CapacitySlider (×7)
│           │       ├── QuickCaptureMenu
│           │       ├── RecordVoiceButton
│           │       ├── BiofeedbackCameraModal
│           │       │   └── useCameraCapture (hook)
│           │       ├── GentleInquiry
│           │       ├── ObjectiveObservation
│           │       ├── PhotoObservations
│           │       ├── VoiceObservations
│           │       └── AILoadingState
│           ├── HealthMetricsDashboard (lazy)
│           │   ├── StateTrendChart
│           │   ├── AnalysisDashboard
│           │   └── ClinicalReport
│           ├── StateCheckWizard (lazy)
│           │   ├── BiofeedbackCameraModal
│           │   ├── StateCheckAnalyzing
│           │   └── StateCheckResults
│           ├── LiveCoach (lazy)
│           ├── Settings (lazy)
│           │   ├── AIProviderSettings
│           │   ├── CloudSyncSettings
│           │   │   └── AuthModal
│           │   └── NotificationSettings
│           ├── VisionBoard (lazy)
│           ├── BioCalibration
│           │   └── StateCheckCamera
│           ├── Guide
│           ├── SearchResources
│           ├── Terms
│           ├── Roadmap
│           └── BetaDashboard (lazy)
```
