# MAEPLE Memory Bank

**Last Updated**: December 14, 2025

## 1. Project Context

MAEPLE started as a local-only prototype and evolved into a "Production-Ready Enterprise Full-Stack System". The transition involved moving from pure LocalStorage to a hybrid Sync model with a Local API.

## 2. Key Decisions

- **Client-Side AI**: We moved away from a heavy backend proxy for AI to client-side adapters (Gemini, OpenAI, etc.) to reduce latency and server costs, using `AIRouter` to manage keys and fallbacks.
- **Local API**: We reverted from Supabase to a custom Express + PostgreSQL backend to ensure full control over the data stack and simplify the local development environment.
- **Mobile-First Navigation**: The desktop sidebar was removed in v1.5.0 to unify the codebase and focus on a single, polished navigation experience.
- **Zustand**: Chosen over Redux for simplicity and bundle size.

## 3. "Gotchas" & Implementation Details

- **Sync Conflicts**: Currently uses "Last Write Wins". Be careful when editing the same entry from multiple devices simultaneously.
- **Dark Mode**: Requires manual class toggling on the `html` element in `appStore.ts`. Don't rely on system preference alone if the user has overridden it.
- **AI Rate Limiting**: It's client-side (`rateLimiter.ts`). If the user clears LocalStorage, their rate limit counters reset (which is acceptable for now).
- **Audio**: `LiveCoach` uses the Web Audio API. It requires HTTPS in production to access the microphone.

## 4. Active Sprints

- **Sprint 4 (UX & Polish)**: Recently completed Dark Mode and Visual Feedback.
- **Next Up**: Push Notifications, Widget Support, Performance Optimization.

## 5. File Locations

- **Specs**: `/workspaces/Maeple/specifications/`
- **Archive**: `/workspaces/Maeple/archive/`
- **Source**: `/workspaces/Maeple/src/`
