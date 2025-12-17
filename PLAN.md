# Development Plan: Intelligence & Insights

**Version**: 1.0.0
**Status**: In Progress

## Overview
This plan outlines the next phases of development focused on "Pattern Literacy" — transforming raw data into actionable insights using the new Data Analysis Logic specification.

## Phase 1: AI Logic Refinement (The Brain)
**Goal**: Align the AI's immediate analysis with the new "Decision Matrix" to ensure neuro-affirming, context-aware responses.

- [ ] **Refactor `geminiService.ts`**:
    - Update `systemInstruction` to include the "Decision Matrix" (Green/Red Zone logic).
    - Enhance the prompt to explicitly check for "Masking Discrepancies" (e.g., High Mood but High Masking Score).
    - Ensure `strategies` are generated based on the *delta* between Capacity and Load.

## Phase 2: Dashboard Insights (The Display)
**Goal**: Surface the hidden patterns calculated by the Analytics Engine to the user.

- [ ] **Update `AnalysisDashboard.tsx`**:
    - Import `generateInsights` from `services/analytics.ts`.
    - Create a new UI section: "Pattern Recognition".
    - Render `Insight` cards (Correlation, Warning, Strength).
    - Add visual indicators for "Green Zone" vs "Red Zone" days.

## Phase 3: Context Correlation Engine (The Insights)
**Goal**: Mathematically correlate specific contexts (Tags) with Capacity drains.

- [ ] **Enhance `services/analytics.ts`**:
    - Implement `Tag Impact Analysis`: Calculate the average Capacity/Mood for each tag.
    - Identify "Drain Tags" (e.g., `#meeting` correlates with -2 Social Capacity).
    - Identify "Boost Tags" (e.g., `#nature` correlates with +1 Mood).
    - Add these findings to the `generateInsights` output.

## Phase 4: Memory & RAG (The Long-Term)
**Goal**: Enable the AI to remember what worked before.

- [ ] **Implement Simple Recall**:
    - Create a client-side search to find past entries with similar tags.
    - Feed these past entries into the `geminiService` prompt as "Historical Context".
