
# POZIMIND: The Pattern Literacy Engine
> *Beta v5 | Multi-provider AI | Powered by Poziverse*

POZIMIND is a neuro-affirming health intelligence tool designed to shift the paradigm from **Symptom Surveillance** ("How broken are you?") to **Pattern Literacy** ("What is your context?").

It now uses a multi-provider AI router (Gemini 2.5 + OpenAI live; Anthropic/Perplexity/OpenRouter/Ollama/Z.ai scaffolded) to track multi-dimensional capacity, predict burnout trajectories, and provide context-aware coaching with graceful fallback.

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
*   **Live Coach:** Voice-first companion using Gemini Live API (audio routing path is wired; UI still Gemini-only).

### 6. Mobile-First Architecture
*   **Thumb Zone Navigation:** Sticky bottom bar for quick capture on mobile.
*   **Quick Actions:** Optimized flows for rapid logging during high-stress moments.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **AI Intelligence**: 
    *   Multi-provider router: Gemini + OpenAI adapters live; Anthropic, Perplexity, OpenRouter, Ollama, Z.ai adapters scaffolded
    *   `gemini-2.5-flash` (Reasoning & Parsing default, also used for search tool)
    *   `gemini-2.5-flash-image` (Visual Therapy & Bio-Mirror fallback)
    *   `gemini-2.5-flash-native-audio-preview` (Live Coach; audio path wired for future providers)
    *   `gpt-4o-mini` / `gpt-4o` / `gpt-image-1` (OpenAI text, vision, image)
*   **Visualization**: Recharts
*   **Storage**: IndexedDB (via `idb` wrapper) & LocalStorage.
*   **Security**: Web Crypto API (AES-GCM) for biometric data encryption.

## 🚀 Installation & Setup (Beta v5)

**New users?** → See the complete [SETUP.md](./SETUP.md).

### Quick Start

1. **Clone**
   ```bash
   git clone https://github.com/genpozi/pozimind.git
   cd pozimind
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

## 📱 Mobile Testing Guide

POZIMIND behaves differently depending on the device context to optimize for neurodivergent needs (Focus vs Capture).

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

This app is designed to be deployed as a Static Single Page Application (SPA).

**Vercel / Netlify:**
1.  Connect your repository.
2.  Set Build Command: `npm run build`.
3.  Set Output Directory: `dist` or `build`.
4.  **Important:** Add your `REACT_APP_API_KEY` (or equivalent) in the Environment Variables settings of your hosting dashboard.

### 🔐 Privacy & Security Note
POZIMIND follows a **Local-First** philosophy.
*   **Journal Entries:** Stored in `localStorage`.
*   **Bio-Mirror Data:** Images and analysis are stored in `IndexedDB`.
*   **Encryption:** Sensitive biometric analysis is encrypted with a locally generated key (AES-GCM) before saving.
*   **Cloud Usage:** Data is sent to Gemini API *only* for processing and is immediately returned. It is not stored on our servers.

---
&copy; 2025 Poziverse. All rights reserved.
