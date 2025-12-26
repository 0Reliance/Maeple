# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-26

### 🚀 Major Release: Enhanced Journaling System

This release represents a transformative milestone for MAEPLE, introducing multi-modal journaling with objective data collection, AI-powered observations, and gentle inquiry systems. The system now supports text, voice, and photo inputs with intelligent capacity calibration and contextual AI interactions.

### ✨ New Features

#### Multi-Mode Journaling
- **Text Entry** with real-time feedback and AI analysis
- **Voice Recording** with live transcription using Web Speech API
- **Photo Capture (Bio-Mirror)** with FACS-based visual analysis
- **Quick Capture Menu** for easy mode selection
- **Skip for Now** option for user autonomy

#### Objective Data Collection
- **Audio Analysis Service** - Analyzes voice recordings for:
  - Environmental noise levels
  - Speech pace and cognitive load
  - Tone and emotional indicators
  - Breathing patterns
- **Visual Analysis Service** - Analyzes photos for:
  - Fatigue indicators (Ptosis, glazed gaze)
  - Facial tension markers
  - Environmental context (lighting, clutter)
  - Masking detection
- **Text Analysis** - Extracts observations from journal text

#### Informed Capacity Calibration
- **AI-Powered Suggestions** - Capacity values suggested based on objective observations
- **"Informed by" Badges** - Clear explanations for why suggestions are made
- **User Override** - All suggestions can be overridden by user
- **Real-time Updates** - Capacity values update when observations change

#### Gentle Inquiry System
- **Context-Aware Questions** - AI generates inquiries based on objective data
- **Optional Responses** - Users can respond or skip entirely
- **Quick Response Buttons** - Pre-defined responses for easy interaction
- **Custom Input** - Users can type their own responses
- **Neuro-Affirming Tone** - Curious, supportive, non-judgmental phrasing
- **Response Integration** - Inquiries and responses saved to entry notes

#### Enhanced Strategy Feedback
- **Context-Aware Strategies** - Recommendations based on objective + subjective data
- **Strategy Deck Display** - 3 strategies shown after each entry
- **Dismissable Overlay** - Strategies can be reviewed or dismissed
- **Pattern Reasoning** - AI explains detected patterns

### 🧩 New Components

- **QuickCaptureMenu** - Entry mode selection interface
- **RecordVoiceButton** - Voice recording with transcription
- **VoiceObservations** - Audio analysis results display
- **PhotoObservations** - Visual analysis results display
- **GentleInquiry** - Context-aware AI question interface
- **JournalEntry** (Major Refactor) - Multi-mode input with all integrations
- **StateCheckWizard** (Refactored) - Enhanced photo capture flow

### 🔧 New Services

- **AudioAnalysisService** - Voice analysis with feature extraction
- **GeminiVisionService** - Photo analysis with FACS markers
- **ImageCompression** - Image optimization for AI processing

### 📊 New Data Models

- **ObjectiveObservation** - Multi-source observation storage
- **GentleInquiry** - Inquiry structure with tone indicators
- **AudioAnalysisResult** - Voice analysis output with confidence scores
- **PhotoAnalysisResult** - Visual analysis output with context

### 🎨 User Experience Improvements

- **Neuro-Affirming Design** - All interactions optional, skip always prominent
- **Transparency** - Shows what AI detected, explains suggestions
- **Non-Judgmental** - Curious tone, validates user experience
- **Supportive** - Quick responses, typing optional, skip normalized

### 📝 Documentation

- **Complete Day-by-Day Documentation** (Days 8-12)
- **Enhanced Journaling Complete Summary** (15KB comprehensive overview)
- **Testing Plan** (20+ test scenarios)
- **Documentation Review Plan** (Systematic update strategy)

### 🛠 Technical Improvements

- **TypeScript Strict Mode** - Full type safety with no `any` types
- **Component Reusability** - Shared patterns across components
- **Efficient State Management** - Proper React state with cleanup
- **Comprehensive Error Handling** - Graceful fallbacks and recovery
- **Performance Optimization** - Lazy loading, debouncing, caching

### 🧪 Testing

- **20+ Test Scenarios** - Comprehensive test coverage
- **Edge Case Testing** - Empty entries, long entries, rapid submissions
- **Data Integrity Verification** - All fields properly stored
- **Network Error Handling** - Graceful degradation

### 📈 Metrics

- **Time Invested**: ~12-15 hours
- **Files Modified/Created**: 15+
- **Lines of Code**: ~3,000+
- **New Components**: 7
- **New Services**: 3
- **Documentation**: 14 documents created/updated

### 🔑 Key Innovation

Transformed MAEPLE from "symptom surveillance" to **"pattern literacy"** through:
- Multi-modal data collection (text, voice, photo)
- Objective + subjective data correlation
- Intelligent, context-aware AI interactions
- Neuro-affirming design throughout

### 🎯 Impact

**For Users**:
- Multiple ways to capture their state
- Objective data supports self-knowledge
- Informed suggestions based on observations
- Gentle, optional AI interactions
- Context-aware strategies for patterns

**For MAEPLE**:
- Richer data for pattern literacy
- Evidence-based insights for advocacy
- More accurate AI analysis
- Improved user engagement

### 🔄 Breaking Changes

- **JournalEntry Component** - Now supports multi-mode input, state management updated
- **Data Model** - Added `objectiveObservations` field to HealthEntry
- **Capacity Calibration** - Enhanced with suggestion system
- **Storage Schema** - Updated to support new observation types

### ⚠️ Known Limitations

- **Inquiry Frequency** - AI may generate inquiries too frequently (acceptable for MVP)
- **Observation Accuracy** - Voice/photo analysis may have false positives (acceptable for MVP)
- **Network Dependencies** - Requires internet for AI features (by design)
- **Storage Limits** - localStorage size limits (acceptable for MVP)

### 🔮 Future Enhancements

- Priority-based inquiry display (high/medium/low)
- Inquiry history and analytics dashboard
- Inquiry response editing
- Advanced observation accuracy improvements
- Offline caching for strategies

---

## [0.95.0] - 2025-12-17

### 🚀 Release: Polish & Privacy Update

This release focuses on refining the user experience, simplifying the dashboard, and clarifying our commitment to privacy and local-first data storage.

### ✨ New Features
-   **Simplified Dashboard**: Redesigned "Daily Capacity Check-in" with intuitive gradient sliders and a cleaner card layout.
-   **Visual Context Grid**: "Recent Context" is now a responsive grid of colorful cards, making it easier to scan past states.
-   **User Menu**: New top-right dropdown menu for quick access to Settings, Resources, and Legal pages, decluttering the main navigation.
-   **Local-First Privacy**: Explicit "Data Privacy & Storage" section in Terms, clarifying that data lives on your device by default.

### 🛠 Improvements
-   **Navigation**: Streamlined sidebar by moving secondary tools to the User Menu.
-   **Branding**: Added "Powered by Poziverse" and GitHub links to the footer.
-   **UI Polish**: Enhanced card styling with pastel themes based on capacity levels.

## [0.9.0-beta] - 2025-12-17

### 🚀 Major Release: Beta v.9

This release marks a significant milestone in the MAEPLE project, introducing full Dark Mode support, enhanced AI capabilities, and a polished user experience.

### ✨ New Features
-   **Dark Mode**: Complete UI overhaul with system-aware Dark Mode support. All components, charts, and reports now look beautiful in low-light conditions.
-   **Bio-Mirror Enhancements**: Improved facial analysis for jaw tension and eye fatigue.
-   **Capacity Reports**: New PDF-ready report generation with "Neuro-Affirming" language.
-   **Capacity Grid**: Replaced simple mood tracking with a 7-point capacity grid (Focus, Social, Sensory, etc.).

### 🛠 Improvements
-   **Documentation**: Complete rewrite of README, Installation, and Feature guides.
-   **Performance**: Optimized React rendering and reduced bundle size.
-   **Accessibility**: Improved ARIA labels and contrast ratios.

### 🐛 Fixes
-   Fixed "Cannot access 'r' before initialization" build error.
-   Fixed hardcoded white backgrounds in various components.
-   Fixed Recharts tooltip visibility in Dark Mode.

---

## [0.8.0] - 2025-11-01
-   Initial Alpha release.
-   Basic Journaling and Mood Tracking.
-   Docker Compose setup.
