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
- **PWA**: Service Worker, Manifest, Installable

### Backend Services (Serverless/Cloud)

- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (JWT, RLS)
- **Storage**: Supabase Storage (for backups/exports)
- **API**: Node.js/Express (Legacy/Proxy for specific integrations)

### AI Layer

- **Orchestration**: `AIRouter` (Client-side routing)
- **Providers**:
  - **Gemini**: Primary (Text, Vision, Audio)
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
- **Rate Limiting**: Client-side token bucket limiter (`services/rateLimiter.ts`) prevents API quota exhaustion.

### 3.3 Security

- **Encryption**: AES-GCM 256-bit encryption for sensitive biometric data (Bio-Mirror) before storage.
- **API Keys**: Stored in `localStorage` (encrypted at rest) or environment variables.
- **RLS**: Row Level Security policies on Supabase ensure users can only access their own data.

## 4. Directory Structure

```
/workspaces/Maeple/
├── components/          # React UI Components
├── services/            # Business Logic & API Clients
│   ├── ai/              # AI Router & Adapters
│   ├── wearables/       # Wearable Integrations
│   └── ...
├── stores/              # Zustand Stores
├── supabase/            # DB Schema & Migrations
├── tests/               # Vitest Suites
└── types.ts             # TypeScript Definitions
```
