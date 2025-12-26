# MAEPLE System Architecture

**Version**: 2.0.0
**Last Updated**: December 14, 2025

## 1. Overview

MAEPLE (Mental And Emotional Pattern Literacy Engine) is a neuro-affirming health intelligence platform designed to help users track and understand their mental and emotional patterns. It uses a local-first, privacy-centric architecture with optional cloud synchronization.

## 2. Technology Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (Persisted stores)
- **Styling**: Tailwind CSS (Dark mode support via `class` strategy)
- **Routing**: React Router DOM
- **PWA**:
  - **Manifest**: `public/manifest.json` defines app identity (icons, theme color).
  - **Service Worker**: `public/sw.js` handles caching and offline capabilities.
  - **Installation**: Custom `usePWAInstall` hook captures the `beforeinstallprompt` event to provide a custom in-app install UI.

### Backend Services

- **Database**: PostgreSQL (Local)
- **Auth**: Local Auth Service (JWT, bcrypt)
- **API**: Node.js v22+ / Express (REST API)

### AI Layer

- **Orchestration**: `AIRouter` (Client-side routing)
- **Providers**:
  - **Gemini**: Primary (Text, Vision, Audio).
    - **Gemini Live**: Real-time multimodal interaction (Audio/Text) via WebSockets.
    - **Gemini Vision**: Used for Bio-Mirror analysis, implementing FACS (Facial Action Coding System) to detect specific Action Units (AUs) for fatigue and tension.
  - **OpenAI**: Secondary (Text, Vision)
  - **Anthropic**: Text, Vision
  - **Perplexity**: Search/Research
  - **OpenRouter**: Model Aggregator
  - **Ollama**: Local Inference
  - **Z.ai**: Text Generation

## 3. Core Architecture Patterns

### 3.1 Local-First Data

- **Primary Source**: `localStorage` and `IndexedDB` (for large blobs like images).
- **Sync Strategy**: "Last Write Wins" with conflict resolution.
- **Offline Support**: `offlineQueue` (IndexedDB) stores requests when network is unavailable.

### 3.2 AI Orchestration

- **Router**: `services/ai/router.ts` determines the best provider based on capability (Text, Vision, Audio) and user settings.
- **Adapters**: Each provider has a standardized adapter implementing `BaseAIAdapter`.
- **Live Coach Flow**:
  1.  **Input**: Web Audio API captures microphone stream.
  2.  **Processing**: `ScriptProcessorNode` converts Float32 audio to PCM16.
  3.  **Transport**: `GeminiAdapter` streams PCM16 to Gemini API via WebSocket.
  4.  **Output**: Gemini returns Audio (played via Web Audio API) and Text (displayed as transcript).
- **Rate Limiting**: Client-side token bucket limiter (`services/rateLimiter.ts`) prevents API quota exhaustion.

### 3.3 Security

- **Encryption**: AES-GCM 256-bit encryption for sensitive biometric data (Bio-Mirror) before storage.
- **API Keys**: Stored in `localStorage` (encrypted at rest) or environment variables.
- **Auth**: JWT-based authentication with secure password hashing.

## 4. Directory Structure

```
/workspaces/Maeple/
├── src/
│   ├── components/      # React UI Components
│   ├── services/        # Business Logic & API Clients
│   │   ├── ai/          # AI Router & Adapters
│   │   ├── wearables/   # Wearable Integrations
│   │   └── ...
│   ├── stores/          # Zustand Stores
│   └── ...
├── api/                 # Express API Server
├── tests/               # Vitest Suites
└── local_schema.sql     # Database Schema
```
