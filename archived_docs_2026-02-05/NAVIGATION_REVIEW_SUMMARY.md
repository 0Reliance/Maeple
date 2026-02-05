# User Navigation Review Summary
**Date:** February 2, 2026
**Updated:** February 2, 2026 (Navigation changes applied)

## Task
Review items in user navigation, confirm removal of "image therapy", and document what other navigation items actually do.

## Findings

### "Image Therapy" Status
✅ **CONFIRMED: "Image Therapy" is NOT present in codebase**

- Searched entire codebase for "image therapy", "imagetherapy", and similar terms
- No results found
- The feature has already been removed or never existed in current implementation

---

## Navigation Changes Applied

### Removed:
- ❌ **Vision Board** - Removed from user menu entirely

### Renamed:
- 📝 **"Clinical Report" → "MAEPLE Report"** - Changed to emphasize brand and purpose
- 🔍 **"Resources" → "Wellness Assistant"** - Changed to reflect AI-powered nature of tool

---

## Current User Navigation Items

### 1. Settings (Gear Icon)
**Purpose:** Comprehensive application configuration and data management

**Features:**
- **Appearance:** Light/Dark/System theme selection
- **AI Provider Configuration:** Configure AI service provider settings and view usage statistics
- **Cloud Sync:** Enable/disable cloud backup and sync across devices
- **Reminders & Notifications:** Configure journal reminders
- **Safety & Support Protocol:** Set emergency contact for crisis support when burnout or dissociation detected
- **Bio-Mirror Calibration:** Teach the system user's "resting face" to improve facial analysis accuracy
- **Data Management:**
  - Export data as JSON (text only)
  - Export full backup as ZIP (includes images)
  - Import backup from JSON
  - Delete all data (danger zone)
- **Biological Context:** Track menstrual cycle for predicting energy dips and correlating with neurodivergent symptoms
- **Device Integrations:** Connect wearable devices (Oura Ring, Google Fit) for biometric data sync

**Data Storage:** Local-first (IndexedDB), optional cloud sync

---

### 2. MAEPLE Report (File Text Icon)
**Purpose:** Longitudinal capacity & wellness analysis for support context

**Requirements:** Minimum 5 journal entries required

**Trust & Context:**
- Explains what the report shows and why it matters
- Highlights early burnout warning signs before crisis
- Identifies biological patterns (cycle phases, sleep quality)
- Detects environmental triggers impacting capacity
- Establishes baseline capacity across 7 functional domains
- Clearly states this is NOT a diagnostic tool, but a support resource for self-understanding and informed conversations with healthcare providers

**Features:**
- **Executive Summary:**
  - Burnout Risk Level (SUSTAINABLE, MODERATE, CRITICAL)
  - Average Sensory Load (1-10 scale)
- **Baseline Capacity Profile:** Radar chart showing average capacity across 7 domains:
  - Focus
  - Social
  - Structure
  - Emotional
  - Physical
  - Sensory
  - Executive
- **30-Day Stability Trend:** Area chart showing capacity (spoons) and mood over time
- **Correlational Analysis:** Pattern insights including:
  - Warning patterns
  - Biological links (wearable data correlations)
  - Capacity-demand correlations
- **Print to PDF:** Generate professional report format

**Clinical Value:** Provides context for therapists, doctors, or support systems

---

### 3. Wellness Assistant (Search Icon)
**Purpose:** AI-powered health information search with verified sources

**Trust & Context:**
- **Grounded Search:** Uses Google Search Grounding to verify information against current medical sources
- **Source Citations:** Every answer includes direct links to original medical literature
- **AI Synthesis:** Complex medical information is summarized into understandable language
- **Privacy First:** Search queries are processed but never used to train AI models
- **Clear Disclaimer:** Explicitly states this provides information for educational purposes only and users should always consult with qualified healthcare providers for diagnosis and treatment decisions
- **Helps Users:** Designed to help users ask informed questions during medical conversations

**Features:**
- Search for health information (side effects, symptoms, health news)
- Powered by Google Search Grounding for up-to-date medical info
- Comprehensive AI-generated answers
- **Sources Section:** Displays cited URLs and titles with links
- Loading states with step-by-step progress
- Circuit breaker protection for reliability

**Use Cases:** Understanding medication effects, researching symptoms, finding health resources

**Privacy:** Search queries sent to AI for processing; no personal health data used for training

---

### 4. Guide (Book Icon)
**Purpose:** Educational documentation explaining MAEPLE's philosophy and features

**Content Sections:**

**The MAEPLE Metrics:**
- **Bandwidth (Capacity):** Available energy/capacity (not just tiredness)
- **Load & Interference:** Environmental weight and cross-domain stress
- **Noise Generators:** Hidden drains like masking, perfectionism
- **Biological Context:** Hormonal phases affecting executive function

**Getting Started (4 Steps):**
1. Set Your Baseline (Capacity Slider)
2. Speak Freely (voice journaling with auto-tagging)
3. Use Bio-Mirror (objective facial analysis)
4. Identify Gap (compare capacity vs demand)

**Philosophy:** Neuro-affirming approach - tracking patterns, not deficits

---

### 5. Terms (Shield Icon)
**Purpose:** Legal information and privacy policy

**Sections:**
- **Important Disclaimer:** MAEPLE is a support tool, not a medical device
- **Data Privacy & Storage:**
  - Local-first architecture (data stored in browser)
  - Optional cloud sync with encryption
  - AI processing via Google Gemini (no training on personal data)
- **Terms of Service:**
  - Lawful use requirements
  - AI technology limitations (potential hallucinations)
  - Intellectual property rights
- **Privacy Policy:**
  - Data storage in browser
  - External API usage (Google GenAI, wearable providers)

**Last Updated:** March 2025

---

### 6. Beta Dashboard (Terminal Icon)
**Purpose:** System monitoring and error tracking for beta testing

**Features:**
- **Log Statistics:**
  - Total logs count
  - Errors count
  - Warnings count
  - Info count
- **System Logs:**
  - Expandable log entries
  - Severity indicators (error, warning, info)
  - Timestamps and context
  - Detailed JSON data on expansion
  - Session and user IDs
- **Actions:**
  - Refresh data
  - Copy logs to clipboard
  - Export logs as JSON
  - Clear all logs
- **Beta Testing Instructions:** Guidance on collecting logs for bug reports

**Privacy:** Logs help identify issues without accessing personal health data

---

## Navigation Structure Summary

The user menu is organized into three logical groups:

1. **Account Section:**
   - Settings
   - MAEPLE Report

2. **Resources Section:**
   - Wellness Assistant (AI-powered health information)
   - Guide (Educational Documentation)
   - Terms (Legal Information)

3. **Development Section:**
   - Beta Dashboard (Testing & Debugging)

4. **Account Actions:**
   - Sign Out

---

## Recommendations

### Navigation Organization
Current structure is logical and well-organized. No changes needed.

### Label Clarity
- "MAEPLE Report" is appropriate (emphasizes brand and longitudinal analytics)
- "Wellness Assistant" accurately reflects AI-powered nature of tool
- Other labels are clear and intuitive

### Feature Validation
All navigation items are functional and serve distinct purposes:
- Settings: Configuration and data management ✓
- MAEPLE Report: Longitudinal health analysis ✓
- Wellness Assistant: AI-powered health information search ✓
- Guide: Educational documentation ✓
- Terms: Legal compliance ✓
- Beta Dashboard: Development testing ✓

### Priority for Users
Based on typical user journeys, navigation priority is appropriate:
1. Settings (first-time setup)
2. Guide (understanding the system)
3. MAEPLE Report (value demonstration)
4. Wellness Assistant (research)
5. Terms (legal compliance)
6. Beta Dashboard (development/testing only)

### Trust Building Enhancements
**MAEPLE Report:**
- Added detailed context explaining why the report matters
- Listed specific benefits (burnout warnings, biological patterns, triggers, baseline capacity)
- Clear statement that it's not a diagnostic tool
- Positioned as support resource for self-understanding and healthcare provider conversations

**Wellness Assistant:**
- Added "What Makes This Trustworthy" section with 4 key points
- Explains grounded search, source citations, AI synthesis, and privacy
- Clear disclaimer about educational purpose only
- Positioned as tool to ask informed questions during medical conversations

---

## Conclusion

The user navigation is well-organized with no "image therapy" item present (already removed). All current navigation items serve clear, distinct purposes and provide value to users. The organization follows logical groupings that make sense for user workflows.

**Changes Applied:**
- ✅ Removed Vision Board from navigation
- ✅ Renamed "Clinical Report" to "MAEPLE Report"
- ✅ Renamed "Resources" to "Wellness Assistant"
- ✅ Added trust-building context to MAEPLE Report page
- ✅ Added trust-building context to Wellness Assistant page

**Result:** Navigation is now more focused and provides better context to build user trust in the tools, particularly around what they do and why they're valid.