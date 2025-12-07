

# MAEPLE: Mental And Emotional Pattern Literacy Engine
> *v1.2.0 | Multi-provider AI | PWA-Ready | Part of Poziverse*

---

## 🌟 Mission & Vision

**MAEPLE** (Mental And Emotional Pattern Literacy Engine) is a world-class, neuro-affirming health intelligence engine, brought to you by Mae, your kind and trustworthy clinical companion. Our mission is to empower every user—neurodivergent and neurotypical alike—to move beyond "Symptom Surveillance" ("How broken are you?") and embrace "Pattern Literacy" ("What is your context?"). We believe in a future where self-understanding, proactive care, and privacy-first technology enable everyone to thrive.

**Vision:** To become the global standard for digital phenotype engines—bridging subjective experience and objective signals, and providing actionable, context-aware insights for self-care, clinical support, and community well-being. MAEPLE is codenamed by Pozi, part of the Poziverse.

---

## 🚀 Professional Product

MAEPLE is built with pride, care, and a relentless focus on quality. Every feature, from multi-provider AI routing to privacy-first biometric analysis, is designed for real-world impact and clinical-grade reliability. This is not a demo—it's a professional product, ready for real users and real lives.

---

MAEPLE now uses a multi-provider AI router (Gemini 2.5 + OpenAI live; Anthropic/Perplexity/OpenRouter/Ollama/Z.ai scaffolded) to track multi-dimensional capacity, predict burnout trajectories, and provide context-aware coaching with graceful fallback.

## 🌟 Core Features

### 1. Multi-Dimensional Capacity Grid
Replaces linear "spoons" with a 7-point capacity grid (Focus, Social, Sensory, Emotional, Physical, Structure, Executive). This allows for nuanced tracking of energy budgets.

### 2. Bio-Mirror (State Check) 📸
**New in v1.1:** An objective reality check for your nervous system.
*   **Vision AI:** Analyzes selfies for Jaw Tension, Eye Fatigue, and Masking signals (routes through the AI router; falls back to Gemini if others are disabled).
*   **Baseline Calibration:** Teaches the AI your unique "resting face" to improve accuracy and reduce false positives for neurodivergent flat affect.
*   **Longitudinal Trends:** Visualizes how masking effort correlates with physical tension over time.
*   **Comparison Engine:** Compares your subjective mood log vs. objective physical signs to detect dissociation or high-functioning burnout.
*   **Privacy-First:** Images are processed in memory and encrypted locally using AES-GCM before storage.

### 3. The Pattern Engine
*   **Burnout Trajectory:** Forecasts crash risks 3-5 days in advance based on Load/Capacity ratios.
*   **Cognitive Load:** Quantifies the executive function tax of context switching.
*   **Masking Detection:** Linguistic analysis to detect the hidden effort of "fitting in".

### 4. Hormonal Sync 2.0
Predictive cognitive weather based on cycle phase (e.g., warning about Luteal Phase executive function drops).

### 5. Visual Therapy & Live Coach
*   **Visual Therapy:** Context-aware generative art for emotional processing.
*   **Live Coach:** Voice-first companion using Gemini Live API with Mae's kind, clinical tone (audio routing path is wired; UI currently Gemini-only).

### 6. Mobile-First Architecture
*   **Thumb Zone Navigation:** Sticky bottom bar for quick capture on mobile.
*   **Quick Actions:** Optimized flows for rapid logging during high-stress moments.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
*   **AI Intelligence**: 
    *   Multi-provider router: Gemini + OpenAI adapters live; Anthropic, Perplexity, OpenRouter, Ollama, Z.ai adapters scaffolded
    *   `gemini-2.5-flash` (Reasoning & Parsing default, also used for search tool)
    *   `gemini-2.5-flash-image` (Visual Therapy & Bio-Mirror fallback)
    *   `gemini-2.5-flash-native-audio-preview` (Live Coach; audio path wired for future providers)
    *   `gpt-4o-mini` / `gpt-4o` / `gpt-image-1` (OpenAI text, vision, image)
*   **Visualization**: Recharts
*   **Storage**: IndexedDB (via `idb` wrapper) & LocalStorage
*   **Security**: Web Crypto API (AES-GCM) for biometric data encryption
*   **Testing**: Vitest + React Testing Library (41 tests)
*   **Wearables**: Oura Ring API integration (OAuth2)

### 7. PWA & Installable App 📱
MAEPLE is now a full Progressive Web App (PWA):
*   **Install to Home Screen:** Add MAEPLE to your device like a native app
*   **Offline Capable:** Core UI loads even without internet
*   **App-Like Experience:** Full-screen, no browser chrome

### 8. Gentle Reminder System 🔔
*   **Customizable Notifications:** Set your preferred days and times for journaling reminders
*   **Inactivity Nudges:** Gentle check-ins after 3+ days of inactivity
*   **Privacy-Respecting:** All notification settings stored locally

### 9. Data Portability 💾
*   **Full Export:** Download all your data as encrypted JSON backup
*   **Import & Restore:** Restore from backups on any device
*   **Storage Stats:** See how much space your data uses
*   **Clear All:** Complete data deletion with confirmation

### 10. Onboarding Experience 🌱
*   **5-Step Welcome:** New users are guided through MAEPLE's mission and features
*   **Meet Mae:** Introduction to your clinical companion
*   **Privacy First:** Clear explanation of local-only data storage
*   **Quick Start:** Get journaling in under a minute

## 🚀 Installation & Setup (Beta v5)

**New users?** → See the complete [SETUP.md](./SETUP.md).

### Quick Start

1. **Clone**
   ```bash
   git clone https://github.com/genpozi/maeple.git
   cd maeple
   ```

2. **Install**
   ```bash
   npm install
   ```

3. **Configure env**
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_GEMINI_API_KEY=your_gemini_key
   ```
   Other providers (OpenAI, Anthropic, Perplexity, OpenRouter, Ollama, Z.ai) are added in-app under **Settings → AI Providers** and stored encrypted locally.

4. **Run**
   ```bash
   npm run dev
   ```

5. **Open** `http://localhost:5173`

### Testing

MAEPLE includes a comprehensive test suite (41 tests) covering analytics, encryption, and core services:

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:coverage
```

**Test Coverage:**
- `analytics.test.ts` (27 tests): Insights generation, daily strategies, burnout trajectory, cognitive load, cycle phase calculations
- `encryption.test.ts` (14 tests): Base64 utilities, key management, data encoding, security model validation

## 📱 Mobile Testing Guide

MAEPLE behaves differently depending on the device context to optimize for neurodivergent needs (Focus vs Capture).

**To test Mobile View in Chrome DevTools:**
1.  Open Developer Tools (F12).
2.  Toggle Device Toolbar (Ctrl+Shift+M).
3.  Select "iPhone 12" or "Pixel 5".
4.  **Observe:**
    *   Sidebar disappears.
    *   Sticky **Bottom Navigation** appears.
    *   Default view switches to **Smart Journal** (Capture-First) instead of Dashboard.
    *   "Quick Capture" header appears.

**To test Bio-Mirror Camera:**
*   Ensure your testing browser has permission to access the webcam.
*   On mobile devices, check that you are testing via HTTPS (required for Camera/Mic access).


## 📦 Deployment

MAEPLE is a modern, production-ready SPA. Deploy in minutes to Vercel, Netlify, or your own static host:

### Vercel / Netlify
1. Connect your GitHub repository.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Add your `VITE_GEMINI_API_KEY` in the Environment Variables section of your hosting dashboard.

### Self-Hosting
1. Run `npm run build`
2. Serve the `dist/` directory with any static file server (e.g., `serve`, NGINX, Apache).

### Production Best Practices
- Use HTTPS for all deployments (required for camera/mic access).
- Set all API keys as environment variables in your host, never hard-code secrets.
- Regularly export and back up your data (see in-app Settings).


### 🔐 Privacy & Security
MAEPLE is **privacy-first** by design:
- **Local-First:** All data (journal, biometric, settings) is stored locally in your browser (LocalStorage & IndexedDB).
- **Encryption:** Sensitive biometric data is encrypted with AES-GCM before saving.
- **No Cloud Storage:** Data is sent to AI providers *only* for processing and is never stored on our servers.
- **User Control:** You can clear or export your data at any time.

---

---

&copy; 2025 Poziverse. All rights reserved. Proudly built for the future of neuro-affirming care.
