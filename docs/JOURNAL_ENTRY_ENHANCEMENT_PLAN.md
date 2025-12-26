# Journal Entry & Voice Companion Enhancement Plan

**Date**: December 26, 2025  
**Status**: Planning Complete  
**Priority**: High - Core User Experience Issue

---

## Problem Statement

**Current Issue**: Journal entry capture expects rich, multi-dimensional data (7 capacity dimensions, sensory load, masking indicators, executive function states) but the UX encourages short, single-sentence inputs.

**Impact**: 
- Mae (AI companion) is designed to provide sophisticated pattern literacy insights
- Users provide minimal context, leading to superficial analysis
- Voice input is transactional (tap-speak-append) rather than conversational
- Capacity check-in feels disconnected from journaling
- Missed opportunity for meaningful pattern discovery

---

## Design Assumptions

Since we're proceeding without Q&A, I'm making these design assumptions based on MAEPLE's philosophy:

1. **Mobile-First Primary Context**
   - Phones are the main use case (PWA, mobile nav, portrait-optimized)
   - Quick captures are important but not at the expense of data quality
   - Progressive disclosure works better than overwhelming forms on small screens

2. **Progressive Multi-Stage Flow**
   - Start simple (mood check)
   - Add guided exploration as user engages
   - Build complexity gradually
   - Optional depth - users can stop at any stage

3. **Mae as Guided Companion, Not Passive AI**
   - Mae should ask probing questions
   - Provide contextual prompts based on previous input
   - Make the "invisible" visible (show what's being detected)
   - Build trust through transparency

4. **Time Investment Balance**
   - Target: 2-3 minutes for complete entry (not 1 minute)
   - Value: Rich pattern data > quick superficial data
   - Users can skip optional stages if needed

5. **Privacy-Sensitive Design**
   - Personal questions should be optional
   - Clear explanation of why Mae is asking
   - Contextual relevance (only ask if relevant to detected pattern)

---

## Proposed Solution: Guided Context Capture

### Architecture Overview

```
Stage 1: Quick Energy Check (5-10 seconds)
  ↓
Stage 2: Guided Context Exploration (30-60 seconds)
  ↓
Stage 3: Capacity Calibration (30-45 seconds)
  ↓
Stage 4: Pattern Analysis & Strategies (5-10 seconds)
```

**Total Time**: 60-90 seconds (1-1.5 minutes)
**Data Quality**: Significantly higher
**User Experience**: More engaged, less confused, builds trust

---

## Stage-by-Stage Design

### Stage 1: Quick Energy Check

**Purpose**: Fast entry point, establish baseline state

**UI Components**:
```
┌─────────────────────────────────────┐
│  What's your energy level right now?  │
│                                 │
│  [😔 Low]  [😐 Medium]  [😊 High]  │
│                                 │
│  Text input: "Quick note..."         │
└─────────────────────────────────────┘
```

**Data Collected**:
- Mood score (1-5)
- Quick mood label
- Brief initial text

**Rationale**: 
- Immediate, no friction
- Establishes baseline before deeper exploration
- Can skip to Stage 4 if user only wants quick log

---

### Stage 2: Guided Context Exploration (NEW - KEY FEATURE)

**Purpose**: Mae guides user to provide rich context through conversation

**Interaction Model**:
```
Mae: "Tell me about your environment right now."
[User taps mic or types]
User: "I'm in a noisy open office with fluorescent lights"

Mae: "I'm detecting sensory signals. How is that affecting you physically?"
[User responds]
User: "My head hurts, I feel overwhelmed"

Mae: "Thank you. I'm noting: Sensory Load 8/10, possible headache. 
What about social demands today?"
[User continues or skips]
```

**Key Features**:
1. **Contextual Probing**: Mae asks follow-up questions based on previous input
2. **Multi-Modal Support**: Voice for flowing thoughts, text for precision
3. **Progressive Disclosure**: Don't ask everything at once
4. **Make Invisible Visible**: Show real-time analysis of what Mae detects
5. **Optional Depth**: Users can skip stages if they only want quick log

**UI Components**:
```
┌─────────────────────────────────────────┐
│  💬 Mae                        [Skip Stage] │
│                                   │
│  "Tell me about your environment"    │
│                                   │
│  [Mic] [Text input]               │
│                                   │
│  📊 Detecting:                    │
│  • Sensory: 8/10 (noisy, lights) │
│  • Masking: 3/10 (authentic tone)   │
└─────────────────────────────────────────┘
```

**Technical Implementation**:
- Use streaming AI responses for real-time probing
- Maintain conversation history in session
- Display confidence scores for detected signals
- Allow users to correct detections

---

### Stage 3: Capacity Calibration (Enhanced)

**Purpose**: Fine-tune the 7 dimensions based on contextual exploration

**Current Problem**: 
- Sliders are separate from journaling
- Users may not understand connection to analysis
- Only 4 of 7 dimensions visible by default

**Proposed Solution**:

```
┌─────────────────────────────────────────┐
│  Based on what you shared, I detect: │
│                                   │
│  📊 Sensory Load: 8/10        │
│     [Adjust: ████░░░░░░]         │
│                                   │
│  🎭 Masking: 7/10                 │
│     [Adjust: ████████░░]          │
│                                   │
│  💪 Executive: 4/10               │
│     [Adjust: ████░░░░░░]          │
│                                   │
│  [Show All 7 Dimensions]            │
│  [Continue to Analysis]              │
└─────────────────────────────────────────┘
```

**Key Features**:
1. **Pre-populated Sliders**: Based on detected signals from Stage 2
2. **Contextual Highlighting**: Only show relevant dimensions by default
3. **Optional Depth**: "Show All 7 Dimensions" for advanced users
4. **Visual Feedback**: Color-coded zones (green/yellow/red)

**Data Flow**:
```
Stage 2 input → AI extracts signals → Pre-populate sliders
User adjusts → Final capacity profile → AI analysis
```

---

### Stage 4: Pattern Analysis & Strategies

**Purpose**: Mae provides personalized insights based on comprehensive data

**Current Implementation**:
- Already shows strategies and reasoning
- Already shows "Mae's Strategy Deck"

**Enhancements**:
1. **Show Detection Summary**: Make the invisible visible
   ```
   "I detected 3 signals from your entry:
   • High sensory load (8/10) from 'noisy office, lights'
   • Moderate masking (7/10) from 'professional face'
   • Low executive capacity (4/10) from 'overwhelmed'
   ```

2. **Explain Recommendations**: Connect strategies to detected patterns
   ```
   Because you have low executive capacity + high sensory load,
   I recommend:
   1. Reduce sensory environment to protect remaining bandwidth
   2. Don't make complex decisions right now
   3. Find a low-stimulation space
   ```

3. **Trust Building**: Show confidence levels
   ```
   Confidence: High (based on 3 detected signals)
   ```

---

## Enhanced Voice Interaction

### Current Model (Transactional)
```
User taps mic → Speaks → Appends to text field
```

### Proposed Model (Conversational)

**Phase A: Mae-Led Conversation**
```
Mae: "What's on your mind right now?"
[User] Taps mic → "I feel exhausted after meeting"

Mae: "That sounds like social depletion. What was the meeting like?"
[User] "5 people, had to present, felt pressure"

Mae: "I'm detecting high social demand + masking. How long have you felt this way?"
```

**Phase B: Contextual Prompts**
Based on conversation flow, Mae asks targeted questions:

**If user mentions:**
- "tired", "exhausted", "drained" → Ask about sleep
- "overwhelmed", "can't focus" → Ask about sensory environment
- "meeting", "social", "people" → Ask about social energy
- "decision", "plan", "schedule" → Ask about executive function

**Phase C: Detection Feedback**
Real-time display of what Mae is extracting:
```
📊 Live Analysis:
  Mood: 2/5 (exhausted)
  Social: 7/10 (high demand detected)
  Masking: 8/10 (pressure to perform)
  Activity: #Meeting
```

---

## Technical Implementation Plan

### Component Architecture

**New Components to Create**:

1. **`GuidedConversation.tsx`** (NEW)
   - Manages multi-stage conversation flow
   - Handles AI streaming responses
   - Displays real-time signal detection
   - Provides skip/continue controls

2. **`SignalDetector.ts`** (NEW UTILITY)
   - Real-time pattern detection from conversation
   - Confidence scoring
   - Signal categorization (sensory, social, executive, masking)

3. **`StageNavigation.tsx`** (NEW)
   - Progress indicator across stages
   - Back/forward navigation
   - Stage completion states

**Components to Enhance**:

1. **`JournalEntry.tsx`** (REFACTOR)
   - Transform from single-screen to multi-stage
   - Integrate guided conversation
   - Enhance capacity calibration
   - Improve strategy display

2. **`RecordVoiceButton.tsx`** (ENHANCE)
   - Add conversational mode
   - Show live transcript
   - Display detection feedback

3. **`geminiService.ts`** (ENHANCE)
   - Add streaming responses for conversational flow
   - Implement contextual prompting
   - Add real-time signal detection

---

### Data Model Changes

**New Types** (add to `src/types.ts`):

```typescript
export interface ConversationTurn {
  role: 'mae' | 'user';
  content: string;
  timestamp: string;
  signalsDetected?: DetectedSignal[];
}

export interface DetectedSignal {
  type: 'sensory' | 'social' | 'executive' | 'masking' | 'mood';
  confidence: number; // 0-1
  value: number; // 1-10 scale
  source: string; // "mentions 'overwhelmed'", "tone indicates pressure"
}

export interface JournalStage {
  stage: 1 | 2 | 3 | 4;
  completed: boolean;
  data: Partial<HealthEntry>;
}
```

**New AI Service Methods** (add to `geminiService.ts`):

```typescript
// Streaming conversation for guided exploration
export const streamConversation = async (
  conversationHistory: ConversationTurn[],
  options: { signal?: AbortSignal, onChunk?: (chunk: string) => void }
): Promise<AsyncGenerator<string>>

// Real-time signal detection
export const detectSignals = async (
  text: string,
  context: ConversationTurn[]
): Promise<DetectedSignal[]>
```

---

### State Management

**New Store** (`src/stores/journalStore.ts`):

```typescript
interface JournalStore {
  // Current session
  currentStage: 1 | 2 | 3 | 4;
  conversationHistory: ConversationTurn[];
  detectedSignals: DetectedSignal[];
  
  // Partial data accumulation
  partialEntry: Partial<HealthEntry>;
  capacityProfile: CapacityProfile;
  
  // Actions
  addConversationTurn: (turn: ConversationTurn) => void;
  updateDetectedSignals: (signals: DetectedSignal[]) => void;
  advanceStage: () => void;
  goBackStage: () => void;
  skipStage: (toStage: number) => void;
  submitEntry: () => Promise<void>;
  resetSession: () => void;
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-2)
- [ ] Create new types for conversation and signals
- [ ] Set up journal store with state management
- [ ] Implement StageNavigation component
- [ ] Create basic 4-stage flow structure

### Phase 2: Guided Conversation (Days 3-4)
- [ ] Implement streaming AI responses
- [ ] Create GuidedConversation component
- [ ] Add contextual prompting logic
- [ ] Integrate real-time signal detection
- [ ] Display live analysis feedback

### Phase 3: Enhanced Voice (Days 5-6)
- [ ] Add conversational mode to RecordVoiceButton
- [ ] Implement live transcript display
- [ ] Add detection feedback overlay
- [ ] Improve audio visualization

### Phase 4: Integration & Polish (Days 7-8)
- [ ] Integrate all stages into JournalEntry
- [ ] Connect guided exploration to capacity calibration
- [ ] Enhance strategy display with explanations
- [ ] Add progress animations
- [ ] Test on mobile devices

### Phase 5: Testing & Refinement (Days 9-10)
- [ ] User testing with neurodivergent participants
- [ ] A/B testing: single-screen vs multi-stage
- [ ] Performance optimization
- [ ] Accessibility audit (screen reader, keyboard nav)
- [ ] Documentation updates

---

## Success Metrics

### Data Quality Metrics
- ✅ Average entry length: +200% (more contextual detail)
- ✅ Signal detection accuracy: >85%
- ✅ Pattern match rate: >90% (user confirms detections)
- ✅ Strategy relevance score: >4/5 (user ratings)

### User Experience Metrics
- ✅ Completion rate: >80% (users complete multi-stage flow)
- ✅ Time to complete: 60-120 seconds (within target)
- ✅ Stage skip rate: <20% (most users complete all stages)
- ✅ Trust score: >4/5 (users trust Mae's insights)

### Business Impact Metrics
- ✅ Pattern discovery rate: +150% (more rich patterns found)
- ✅ User retention: +30% (more engaged users)
- ✅ Feature adoption: >70% (users use guided exploration)
- ✅ AI utilization: +100% (better data = better analysis)

---

## Risk Mitigation

### Risk 1: Increased Time Investment
**Mitigation**: 
- All stages are optional
- Quick path available (Stage 1 → Stage 4 in 30 seconds)
- Progress saved if interrupted
- Clear time indicators per stage

### Risk 2: User Overwhelm
**Mitigation**:
- Progressive disclosure (one thing at a time)
- Clear visual hierarchy
- Skip buttons at every stage
- Back navigation to review previous input

### Risk 3: Privacy Concerns
**Mitigation**:
- Explain why Mae is asking each question
- Allow users to skip any question
- Clear privacy policy for voice data
- Data stored locally with encryption

### Risk 4: AI Accuracy
**Mitigation**:
- Show confidence scores for detections
- Allow users to override Mae's suggestions
- Manual slider adjustments always available
- "Does this feel accurate?" confirmation

---

## Rollout Strategy

### Phase A: Beta Testing (1 week)
- Deploy to staging environment
- Invite 10-15 beta users (neurodivergent community)
- Collect qualitative feedback
- Monitor completion rates and time metrics

### Phase B: A/B Testing (2 weeks)
- **Group A**: Current single-screen design
- **Group B**: New multi-stage guided flow
- Compare: completion rate, data quality, user satisfaction
- Winner: Deploy to 100% of users

### Phase C: Gradual Rollout (1 week)
- Start with 25% of users
- Monitor metrics and errors
- Increase to 50%, then 75%, then 100%
- Rollback plan ready if issues arise

---

## Future Enhancements (Beyond This Plan)

1. **Voice-Only Mode**: Complete journaling by voice only (no typing)
2. **Pattern Notifications**: Mae alerts user to detected patterns ("You've had high sensory load for 3 days")
3. **Historical Context**: Mae references previous entries ("Your social capacity is lower than usual")
4. **Environment Detection**: Ask for location permission to detect context automatically
5. **Wearable Integration**: Use HRV/activity data to inform capacity calibration

---

## Conclusion

This enhancement transforms the journal entry from a **short mood check** into a **guided pattern discovery session**. By investing 60-90 seconds instead of 15-30 seconds, users get:

- **Richer data** for sophisticated analysis
- **Deeper insights** from pattern literacy
- **More accurate strategies** tailored to their state
- **Stronger trust** in Mae as a companion
- **Better understanding** of their own patterns

The key is making this **investment feel valuable** through transparent, conversational interaction rather than feeling like a longer form.

**Next Steps**: 
1. Review and approve this plan
2. Begin Phase 1 implementation (core infrastructure)
3. Iterate based on testing feedback
4. Deploy and measure success metrics
