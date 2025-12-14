# MAEPLE API Reference

**Version**: 2.0.0
**Context**: Client-Side Services & External Integrations

## 1. Internal Service APIs

### 1.1 AI Service (`services/ai`)

The AI layer is abstracted through the `AIRouter`.

```typescript
// Core Interface
interface BaseAIAdapter {
  generateText(request: AITextRequest): Promise<AITextResponse>;
  generateVision(request: AIVisionRequest): Promise<AIVisionResponse>;
  streamAudio?(request: AIAudioRequest): Promise<ReadableStream>;
  connectLive?(config: AILiveConfig): Promise<AILiveSession>;
}

// Usage
import { aiRouter } from "../services/ai/router";
const response = await aiRouter.generateText({
  prompt: "Analyze this journal entry...",
  systemInstruction: "You are an empathetic coach...",
});
```

### 1.2 Storage Service (`services/storageService.ts`)

Abstraction over LocalStorage and IndexedDB.

- `getEntries(): HealthEntry[]`
- `saveEntry(entry: HealthEntry): void`
- `getUserSettings(): UserSettings`
- `saveUserSettings(settings: UserSettings): void`

### 1.3 Sync Service (`services/syncService.ts`)

Handles synchronization with the Local API.

- `initializeSync()`: Sets up background sync.
- `triggerPendingSync()`: Forces a sync of queued items.
- `resolveConflict(local: any, remote: any): any`: Last-write-wins logic.

## 2. External Integrations

### 2.1 Local API (Database & Auth)

- **Endpoint**: `/api` (Proxied to `http://localhost:3001`)
- **Auth**: Handles Sign Up, Sign In, JWT Management.
- **Database**: PostgreSQL via Express API.

### 2.2 AI Providers

Direct API calls from client (proxied if needed for CORS, but mostly direct).

- **Gemini**: `generativelanguage.googleapis.com`
- **OpenAI**: `api.openai.com`
- **Anthropic**: `api.anthropic.com`
- **Perplexity**: `api.perplexity.ai`

### 2.3 Wearables

- **Oura**: OAuth2 integration.
- **Apple Health**: via Capacitor plugin (Mobile only).
- **Google Fit**: REST API (Read-only).

## 3. Rate Limiting

Implemented in `services/rateLimiter.ts`.

- **Gemini**: 55 requests/minute, 1400/day.
- **Strategy**: Token Bucket algorithm.
- **Storage**: Persisted in `localStorage` to track daily usage.
