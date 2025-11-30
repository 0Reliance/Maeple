# POZIMIND: The Pattern Literacy Engine
> *Powered by Poziverse*

POZIMIND is a neuro-affirming health intelligence tool designed to shift the paradigm from **Symptom Surveillance** ("How broken are you?") to **Pattern Literacy** ("What is your context?").

It uses Google's Gemini 2.5 models to track multi-dimensional capacity, predict burnout trajectories, and provide context-aware coaching.

## 🌟 Core Features

### 1. Multi-Dimensional Capacity Grid
Replaces linear "spoons" with a 7-point capacity grid (Focus, Social, Sensory, Emotional, Physical, Structure, Executive). This allows for nuanced tracking of energy budgets.

### 2. Bio-Mirror (State Check) 📸
**New in v1.0:** An objective reality check for your nervous system.
*   **Vision AI:** Analyzes selfies for Jaw Tension, Eye Fatigue, and Masking signals.
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
*   **Live Coach:** Voice-first companion using Gemini Live API for verbal processing.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **AI Intelligence**: 
    *   `gemini-2.5-flash` (Reasoning & Parsing)
    *   `gemini-2.5-flash-image` (Visual Therapy & Bio-Mirror)
    *   `gemini-2.5-flash-native-audio-preview` (Live Coach)
*   **Visualization**: Recharts
*   **Storage**: IndexedDB (via `idb` wrapper) & LocalStorage.
*   **Security**: Web Crypto API (AES-GCM) for biometric data encryption.

## 🚀 Installation & Setup

### Prerequisites
*   Node.js v18+
*   A Google Cloud Project with the Gemini API enabled.
*   An API Key with access to the models listed above.

### Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/poziverse/pozimind.git
    cd pozimind
    ```

2.  **Install Dependencies**
    ```bash
    npm install react react-dom @google/genai lucide-react recharts uuid
    # Note: Ensure you have a build system like Vite or Create React App set up
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    # Your Google GenAI API Key
    REACT_APP_API_KEY=AIzaSy... 
    # Or VITE_API_KEY depending on your bundler
    ```
    *Note: The app expects `process.env.API_KEY` to be available.*

4.  **Run Development Server**
    ```bash
    npm start
    # or
    npm run dev
    ```

5.  **Access the App**
    Open `http://localhost:3000`.

### 🔐 Privacy & Security Note
POZIMIND follows a **Local-First** philosophy.
*   **Journal Entries:** Stored in `localStorage`.
*   **Bio-Mirror Data:** Images and analysis are stored in `IndexedDB`.
*   **Encryption:** Sensitive biometric analysis is encrypted with a locally generated key (AES-GCM) before saving.
*   **Cloud Usage:** Data is sent to Gemini API *only* for processing and is immediately returned. It is not stored on our servers.

---
&copy; 2025 Poziverse. All rights reserved.