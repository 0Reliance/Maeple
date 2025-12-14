




# How to Use MAEPLE
> *Your Kind, Trustworthy Companion for Pattern Literacy*


Welcome to MAEPLE. This is more than an app—it's a movement to help you move from **Symptom Surveillance** ("I feel broken") to **Pattern Literacy** ("I am running at high capacity in a low-resource environment").

MAEPLE is built for real-world impact, clinical reliability, and privacy-first care. Every feature is designed to empower you with actionable insights, not just data.

This guide will walk you through the core features and how to use them to prevent burnout and thrive.

> **New (v1.3.0):** MAEPLE now supports cloud sync with Supabase! Sign in under Settings → Cloud Sync to access your data from any device.

> **New (v1.2.0):** MAEPLE now includes an onboarding wizard, PWA installation, gentle reminders, and full data export/import. First-time users will be guided through a 5-step introduction to MAEPLE's mission.

> **AI Providers:** Gemini is the default; you can add OpenAI, Anthropic, Perplexity, OpenRouter, local Ollama, or Z.ai under **Settings → AI Providers**. Keys are stored encrypted locally, and the router will gracefully fall back to Gemini if others are disabled or fail.

> **Voice tips:** When using Mae Live or the Journal mic, allow microphone access. In Mae Live you should see "Listening…" after tapping the mic; if not, confirm your Gemini key is set.---

## 1. The Core Philosophy

MAEPLE tracks **Context**, not just symptoms. To get the most out of it, you need to track three dimensions:
1.  **Capacity (Spoons):** How much energy do you *actually* have available?
2.  **Demand (Load):** What is costing you energy? (Sensory noise, Masking, Task switching).
3.  **Output (Mood):** How do you feel as a result?

---

## 2. Daily Routine: The "Check-In"

### ☀️ Morning: Set Your Baseline
Before you start your day, go to the **Smart Journal**.
1.  Open the **Capacity Check-in** (click the ⚡ icon).
2.  Adjust the sliders based on how you feel *right now*.
    *   *Low Sleep?* Lower your **Physical** and **Executive** spoons.
    *   *Luteal Phase?* Lower your **Sensory** tolerance.
3.  This tells the AI your "Budget" for the day.

### 📝 During the Day: Contextual Logging
When logging an entry, don't just say "I'm tired." Add context:
*   **Activity:** "Had 3 back-to-back meetings." (AI detects: High Context Switching)
*   **Environment:** "The office lights are buzzing." (AI detects: High Sensory Load)
*   **Social:** "Had to pretend to be happy at lunch." (AI detects: High Masking)

**Pro Tip:** Use the **Microphone** button. Just talk naturally. The AI is trained to pick up on neurodivergent nuances like "Brain Fog" or "Hyperfocus".

### 📸 Mid-Day: The Bio-Mirror (State Check)
If you feel "off" but can't name the emotion (Alexithymia), or if you suspect you are masking heavily:

1.  **Calibrate First (Important):** Go to **Settings > Bio-Mirror Calibration**. Take a photo of your "Neutral / Resting Face". This teaches the AI your baseline, so it doesn't mistake your natural expression for fatigue.
2.  **Reflect:** Go to **Bio-Mirror** and follow the 10-second breathing prompt.
3.  **Capture:** Take a quick selfie.
4.  **Analyze:** The AI looks for changes from your baseline:
    *   **Jaw Tension:** A primary sign of stress suppression.
    *   **Eye Fatigue:** Indicators of cognitive exhaustion.
    *   **Masking Score:** Is your expression "performing" happiness while showing stress?
5.  **Reality Check:** The app compares your physical state to your last journal entry.
    *   *Discrepancy Detected?* If you wrote "I'm fine" but your jaw tension is elevated above your baseline, you might be dissociating.

---

## 3. Weekly Review: The Dashboard

Visit the **Pattern Dashboard** once a week to spot trends.

*   **Burnout Trajectory:** Look at the gauge. If it says **CRITICAL**, you have exceeded your capacity for >3 days. Schedule a "Rot Day" (Passive Rest).
*   **Bio-Signal Trends:** Look at the Orange (Tension) vs Purple (Masking) chart. Does high masking on Tuesday lead to high physical tension on Wednesday?
*   **Hormonal Weather:** Check your cycle phase.
    *   *Follicular?* High energy. Do hard tasks.
    *   *Luteal?* Low energy. Be kind to yourself.
*   **Cognitive Load:** If "Context Switches" are high (>8), try "Time Blocking" next week (grouping similar tasks).

---

## 4. Features Overview

| Feature | Best For... |
| :--- | :--- |
| **Smart Journal** | Capturing the "Why" behind your mood. |
| **Bio-Mirror** | Reality-checking your physical stress levels. |
| **Mae Live Coach** | Verbal processing when you are too overwhelmed to type. |
| **Visual Therapy** | Visualizing your feelings when words fail you. |
| **Clinical Report** | Generating a PDF for your therapist/doctor. |

---

## 5. Privacy First

*   **Your Data:** Stored locally in your browser (LocalStorage & IndexedDB).
*   **Your Images:** Selfies are processed in memory. If you choose to save them, they are stored locally on your device.
*   **Encryption:** Sensitive biometric analysis is encrypted with AES-GCM before being saved to your local database.
*   **Your Control:** You can clear your data in Settings at any time.

---

## 6. Data Management

MAEPLE gives you full control over your data:

### Export Your Data
1.  Go to **Settings** → **Data Management**
2.  Click **Export All Data**
3.  A JSON file will download containing all your journal entries, state checks, settings, and analytics

### Import / Restore
1.  Go to **Settings** → **Data Management**
2.  Click **Import Data**
3.  Select your backup file
4.  Choose to **merge** with existing data or **replace** entirely

### Storage Statistics
*   View how much space your data uses
*   See counts for journal entries, state checks, and other data

### Clear All Data
*   Complete data deletion with confirmation prompt
*   Cannot be undone—export first!

---

## 7. Notifications & Reminders

MAEPLE can gently remind you to check in:

### Setting Up Reminders
1.  Go to **Settings** → **Notifications**
2.  Enable notifications (you'll be prompted to allow browser notifications)
3.  Choose your preferred days (e.g., weekdays only)
4.  Set your preferred time for daily reminders

### Inactivity Nudges
*   If you haven't logged anything for 3+ days, Mae will gently check in
*   These are kind, not demanding—designed for neurodivergent needs

### Disabling Notifications
*   Toggle off in Settings anytime
*   Or use your browser/device notification settings

---

## 8. Installing MAEPLE (PWA)

MAEPLE works as a Progressive Web App—install it like a native app:

### On Mobile (iOS/Android)
1.  Open MAEPLE in your browser
2.  Tap the **Share** button (iOS) or **Menu** button (Android)
3.  Select **Add to Home Screen**
4.  MAEPLE now launches in full-screen mode!

### On Desktop (Chrome/Edge)
1.  Look for the install icon (➕) in the address bar
2.  Click **Install**
3.  MAEPLE opens in its own window

### Benefits
*   **Quick Access:** One tap from your home screen
*   **Full Screen:** No browser chrome
*   **Offline Support:** Core UI loads even without internet

---

## 9. Cloud Sync

Access your MAEPLE data from any device with cloud sync:

### Enabling Cloud Sync
1.  Go to **Settings** → **Cloud Sync**
2.  Click **Sign In / Sign Up**
3.  Create an account with email and password, or use a magic link
4.  Once signed in, your data will sync automatically

### How It Works
*   **Local-First:** Data is always saved locally first (works offline)
*   **Background Sync:** Changes sync to the cloud when you're online
*   **Cross-Device:** Sign in on another device to access your data

### Manual Sync Controls
*   **Pull:** Download any new data from the cloud
*   **Sync:** Full bidirectional sync (push + pull)
*   **Push:** Upload all local data to the cloud

### Privacy & Security
*   Your data is stored in a secure Supabase database
*   Row Level Security ensures only you can see your data
*   Biometric data remains encrypted even in the cloud

---


---

*Proudly built by Poziverse. Your data, your context, your power.*
