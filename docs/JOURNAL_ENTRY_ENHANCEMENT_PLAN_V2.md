# Journal Entry & Voice Companion Enhancement Plan V2

**Date**: December 26, 2025  
**Status**: Refined Based on User Feedback  
**Priority**: High - Core User Experience Issue

---

## Core Psychological Principle: Safe Observational Curiosity

**Critical Insight**: MAEPLE must balance **data collection** with **psychological safety**.

**The Problem with Probing**:
- "You seem sad" → Creepy, judgmental, subjective
- "Tell me more about your meeting" → Intrusive, feels like interrogation
- Users feel examined, not supported

**The Solution: Objective Observational Curiosity**:
- "I notice a lot of background noise in your recording" → Factual, objective
- "I see bright fluorescent lighting in the photo" → Observable, not judgmental
- "Your self-report says you feel calm, but your face shows tension" → Discrepancy as information, not failure

**Key Principles**:
1. **Objective, Not Subjective**: Report what Mae sees/hears, not what Mae "thinks"
2. **Gentle Curiosity, Not Interrogation**: Ask for context, not justification
3. **Coping-Focused**: Frame observations in terms of how they affect the user
4. **Never Creepy**: Friendly, sincere, helpful tone always
5. **Fast Flow**: TAP-TAP-TAP-RECORD - Easy and efficient

---

## Discrepancy Handling: From Scary Warning to Curious Inquiry

### Current Problem (Too Scary)
```
⚠️ WARNING: Discrepancy Detected
Your self-reported mood (5/5) doesn't match your facial analysis (2/5).
This could indicate masking or dissociation.
```

**User Experience**: Feels like an accusation, "You're lying to yourself"

### Proposed Solution (Gentle Inquiry)
```
📊 Observation

I noticed something interesting:
• Your self-report: "I feel calm and focused" (mood: 5/5)
• What I see: Tension around eyes, slight frown lines

This isn't wrong - it's actually useful information. People often feel different than they appear.

Mind telling me a bit more about how you're actually feeling right now?
[I'll type] [I'll explain]
```

**User Experience**: Curious, supportive, invites honest reflection

---

## Enhanced Multi-Stage Flow: Objective Context Capture

### Architecture Overview

```
Stage 1: Quick TAP-TAP-TAP-RECORD (5-10 seconds)
  ↓
Stage 2: Gentle Context Inquiry (Optional, 20-40 seconds)
  ↓
Stage 3: Capacity Check-in (Informed, 30-45 seconds)
  ↓
Stage 4: Pattern Discovery (Friendly, 5-10 seconds)
```

**Total Time**: 60-90 seconds for full flow, 15 seconds for quick flow
**Psychological Safety**: High throughout
**Data Quality**: Significantly enhanced

---

## Stage-by-Stage Design

### Stage 1: Quick TAP-TAP-TAP-RECORD

**Purpose**: Frictionless entry, establish baseline state

**Key Design**: Fast, intuitive, no thinking required

**UI Components**:
```
┌─────────────────────────────────────────┐
│  📸 Bio-Mirror    🎤 Voice    ✏️ Text  │
│                                   │
│  [Tap one to capture your state]      │
└─────────────────────────────────────────┘
```

**Interaction Flow**:

**Option A: Bio-Mirror (Photo)**
```
[TAP camera icon]
→ Camera opens → Quick guide → SNAP → Compress
→ Photo analyzed for facial tension, fatigue, masking
→ Results available in Stage 3
```

**Option B: Voice Record**
```
[TAP mic icon]
→ Hold to record (2-10 seconds) → Release
→ Audio analyzed for:
   • Background noise level
   • Speech pace (rushed vs calm)
   • Emotional tone (excited vs exhausted)
→ Transcript displayed
```

**Option C: Text Input**
```
[TAP text icon]
→ Simple text field appears
→ "How are you feeling right now?"
→ 5-10 second quick input
```

**Rationale**: 
- TAP-TAP-TAP: Three clear, equally valid options
- No hierarchy (voice isn't "better" than text)
- User chooses what feels right in the moment
- Objective data collection starts immediately

---

### Stage 2: Gentle Context Inquiry (OPTIONAL)

**Purpose**: Contextual follow-up based on objective observations

**Critical Rule**: Only engage if Mae has **objective data** to work with

**Triggered By**:
- High background noise in voice recording
- Bright/harsh lighting detected in photo
- Facial tension indicators in photo
- Discrepancy between self-report and observations
- Specific signals detected (e.g., "meeting" mentioned in text)

**NOT Triggered By**:
- Subjective "feelings" or assumptions
- Random probing for more information
- Absence of objective data

**Example Scenarios**:

**Scenario 1: Noisy Background (Voice Recording)**
```
🎤 Voice captured: "I feel pretty good today"

📊 Objective Observation:
• Audio: Moderate background noise detected
• Speech pace: Normal (not rushed)
• Emotional tone: Generally positive

💬 Gentle Inquiry:
"I noticed there's some background noise in your recording. 
Is that affecting your focus right now?"

[Yes, it's distracting] [No, I'm used to it] [Skip]
```

**Scenario 2: Discrepancy Detection**
```
📸 Bio-Mirror: Tension detected in jaw/eyes
✏️ Self-report: "I feel great, lots of energy!"

📊 Objective Observation:
• Face shows tension markers
• Self-report contradicts visual data
• This is common and valuable information

💬 Gentle Inquiry:
"Your words say you're feeling great, and I noticed some physical tension.
This is actually interesting - sometimes we feel one way but show another.
Mind sharing a bit more about what's going on?"

[I'll share] [Actually, I am great - just tired] [Skip]
```

**Scenario 3: No Inquiry Needed**
```
🎤 Voice: "I had a great meeting, feeling energized"

📊 Objective Observation:
• Clean audio, no distractions
• Consistent tone and speech pace
• All signals aligned

[Continue to Stage 3] → No inquiry needed
```

**Key Design Principles**:
1. **Show the Objective Data**: "I noticed X in the recording"
2. **Connect to User Experience**: "Is this affecting your focus?"
3. **Always Optional**: Skip button prominent
4. **No Judgment**: Discrepancy = information, not problem
5. **Fast**: Takes 20-40 seconds, not several minutes

---

### Stage 3: Informed Capacity Check-in

**Purpose**: Fine-tune capacity profile based on objective observations

**Key Change**: Sliders are now **informed** by data from Stage 1-2

**Current Problem**:
- Sliders are generic/untethered from reality
- Users don't know what to rate
- "Social energy" - what does that mean right now?

**Proposed Solution**:

```
┌─────────────────────────────────────────┐
│  Based on what we've captured:         │
│                                   │
│  📸 Bio-Mirror detected:             │
│  • Mild fatigue indicators            │
│  • Possible eye strain                │
│                                   │
│  🎤 Voice showed:                    │
│  • Background noise (moderate)        │
│  • Speech pace: Calm                 │
│                                   │
│  Let's calibrate your capacity:       │
│                                   │
│  🧠 Focus Energy                    │
│     [Informed by voice pace: Calm]   │
│     Slider: ████████░░░ 8/10         │
│                                   │
│  👂 Sensory Tolerance               │
│     [Informed by audio: Moderate noise]│
│     Slider: ██████░░░░░ 6/10         │
│                                   │
│  💪 Physical Energy                 │
│     [Informed by facial analysis]     │
│     Slider: █████░░░░░░ 5/10         │
│                                   │
│  [Adjust as needed] [Continue]        │
└─────────────────────────────────────────┘
```

**Key Features**:

1. **Show the Evidence**: "Informed by X" gives context
2. **Pre-populate from Objective Data**: Not random starting values
3. **User Always Controls**: Can override any suggestion
4. **Relevant Dimensions**: Only show dimensions we have data for
5. **Optional Depth**: "Show All 7 Dimensions" for detailed users

**Example Interaction**:

**User adjusts focus from 8/10 to 4/10**:
```
[User] Drags slider down
[Mae] "I noted that - so even though your voice sounds calm, 
you're feeling lower mental energy. Thanks for sharing that."
```

**Rationale**:
- User sees Mae is paying attention to their input
- Builds trust through acknowledgment
- Capacity calibration becomes meaningful, not arbitrary

---

### Stage 4: Friendly Pattern Discovery

**Purpose**: Present insights in a supportive, non-judgmental way

**Key Change**: Frame everything as "information you can use", not "problems you have"

**Current Tone**:
```
📊 Analysis Results
⚠️ High sensory load detected
⚠️ Masking score elevated
Recommendation: Reduce sensory input
```

**Proposed Tone**:
```
✨ What I Noticed

Looking at everything you shared today, here's what stood out:

🔍 Observation 1: Sensory Load
You mentioned the noise in the recording, and your sensory tolerance is 6/10.
This is totally normal for busy environments.

💡 Insight:
When sensory load is moderate, it can help to take brief "sensory breaks."
Even 2 minutes of quiet can help your brain reset.

📊 Your Pattern (Last 7 Days):
Your sensory tolerance has been 5-7 range all week.
This suggests you're handling consistent environmental demands well.

💬 Friendly Question:
What's one thing that usually helps you feel less overwhelmed?
```

**Key Design Principles**:

1. **Observation Language**: "What I noticed" instead of "What you did wrong"
2. **Normalizing**: "This is totally normal" instead of "This is a problem"
3. **Helpful, Not Prescriptive**: "Here's an insight" instead of "You should do this"
4. **Pattern Context**: Show how today fits into longer patterns
5. **Friendly Questions**: Invite reflection, not compliance

---

## Enhanced Voice Interaction: Objective-Focused

### Current Model (Transaction-Based)
```
Tap mic → Speak → Text appended to field
```

### Proposed Model (Observation-Based)

**Phase A: TAP-RECORD-RELEASE**

```
[User] Taps and holds mic
[Mae] "Recording... hold until you're done"

[User] "I'm in the office, feeling pretty good, had a good meeting"
[User] Releases mic

[Mae] Captures:
• Audio: Clean, low background noise
• Speech pace: Moderate (neither rushed nor slow)
• Emotional tone: Positive, upbeat
• Transcript: "I'm in the office, feeling pretty good, had a good meeting"
```

**Phase B: Objective Observation Display**

```
🎤 Voice Captured:

"I'm in the office, feeling pretty good, had a good meeting"

📊 Quick Analysis:

✓ Background Noise: Low (Clean recording)
✓ Speech Pace: Moderate (Calm, natural)
✓ Emotional Tone: Positive (Uplifting energy)

[Continue to Stage 3] → No inquiry needed
```

**Phase C: Gentle Inquiry (If Needed)**

**Example: High Noise Detected**
```
🎤 Voice Captured:

"I'm feeling okay... (background noise)... pretty good... (siren sounds)"

📊 Quick Analysis:

⚠ Background Noise: High (sirens, traffic detected)
✓ Speech Pace: Moderate
✓ Emotional Tone: Mixed (some hesitation)

💬 Gentle Inquiry:

"I noticed there was a lot of background noise in your recording - 
sirens and traffic sounds. That can be pretty stressful to process.

How is that environment affecting your focus right now?"

[It's distracting me] [I'm used to it] [Skip]
```

**Key Difference**:
- **Old**: "You seem stressed" (Subjective, creepy)
- **New**: "I noticed background noise. How is it affecting you?" (Objective, curious)

---

## Biofeedback Discrepancy Handling: From Warning to Inquiry

### Current Implementation (Too Scary)
```
⚠️ DISCREPANCY WARNING

Your self-reported mood (5/5) doesn't match your facial analysis (2/5).
This could indicate:
• Masking: You're hiding your true feelings
• Dissociation: You're disconnected from your emotions
• Denial: You're not acknowledging your state

Please be honest with yourself.
```

**Problems**:
- Feels accusatory
- Pathologizes normal human experience
- Scary language ("denial", "dissociation")
- Assumes user is wrong

### Proposed Implementation (Gentle Inquiry)

```
📊 Interesting Observation

I noticed something interesting between what you said and what I saw:

What You Said:
"I feel great, lots of energy!" (Mood: 5/5)

What I See:
Your face shows some tension around the eyes and jaw.

💭 What This Means:

This isn't wrong or bad. In fact, it's really common and useful information.

Sometimes we feel one way internally but show another externally. This can happen when:
• We're masking - putting energy into appearing okay
• We're in denial - avoiding acknowledging how we actually feel
• We're dissociated - disconnected from our body signals
• We're just tired - body is exhausted even if mood is good

💬 Friendly Question:

Mind sharing a bit more about what's actually going on right now?

[I'll explain] [Actually, I do feel great - just tired] [Maybe I am masking]
```

**Key Improvements**:
1. **Curious, Not Scary**: "Interesting observation" instead of "WARNING"
2. **Normalize**: "This isn't wrong or bad. In fact, it's really common."
3. **Provide Context**: List multiple valid explanations, not just negative ones
4. **Invite Reflection**: "Mind sharing a bit more?" instead of "Please be honest"
5. **Validate User's Reality**: "Actually, I do feel great" is a valid response

**Rationale**:
- Discrepancy = information to explore, not problem to fix
- User's self-knowledge is respected
- Builds trust through curiosity, not correction
- Supports self-awareness instead of demanding it

---

## Self-Reported Criteria: Design Philosophy

### Core Principle: User's Self-Report is Sacred

**Key Insight**: Self-reported data (what users say, feel, believe) is the foundation.

**Why It's Important**:
1. **User is the Expert**: Only they know their internal experience
2. **Builds Trust**: Mae respects user's self-knowledge
3. **Avoids Gaslighting**: Mae doesn't tell users how they "should" feel
4. **Pattern Literacy**: Discrepancies between self-report and objective data ARE the pattern

### How MAEPLE Should Handle Self-Report

**Scenario 1: Self-Report Matches Objective Data**
```
User: "I feel exhausted"
Bio-Mirror: Shows fatigue indicators
Voice: Slow speech, flat tone

Mae's Response:
"Your voice and face are showing what you're telling me. 
Thanks for sharing - that helps me understand your state accurately."
```

**Scenario 2: Self-Report Contradicts Objective Data**
```
User: "I feel great!"
Bio-Mirror: Shows tension, fatigue
Voice: Rushed, high energy but strained

Mae's Response:
"Your words say you're feeling great, but I notice some physical tension.
This is actually interesting - people often feel different than they appear.
Mind telling me a bit more about what's going on?"

[User]: "Well, actually... I'm pretty drained but trying to stay positive"

Mae's Response:
"I really appreciate you sharing that. That's the kind of pattern that's
really useful to track - how often you're pushing through versus resting."
```

**Scenario 3: User Disagrees with Mae's Observation**
```
Mae: "I noticed some tension..."
User: [Adjusts sliders] "Nope, I feel great, just tired"

Mae's Response:
"Got it - thanks for correcting me! I'll note that you feel great despite
being tired. That's an important distinction for understanding your patterns."
```

**Key Design Rules**:
1. **Trust the User**: If user says X, X is valid
2. **Show Discrepancies as Information**: "I notice X, you say Y"
3. **Don't Label**: Don't say "you're masking" or "you're in denial"
4. **Invite Reflection**: "Mind sharing more?" not "You're wrong"
5. **Value the Discrepancy**: The gap IS the pattern worth tracking

---

## TAP-TAP-TAP-RECORD Flow: Complete Implementation

### Complete User Journey

**Step 1: TAP (Choose Input Method)**
```
┌─────────────────────────────────────────┐
│  📸 Bio-Mirror    🎤 Voice    ✏️ Text  │
│                                   │
│  [Choose your capture method]         │
└─────────────────────────────────────────┘
```

**Step 2: TAP (Capture)**
```
If Bio-Mirror:
[TAP camera] → Quick guide → SNAP → Photo captured and compressed

If Voice:
[TAP and hold mic] → Speak (2-10 seconds) → Release → Audio captured

If Text:
[TAP text] → Type (5-10 seconds) → Enter
```

**Step 3: TAP (Quick Review - Optional)**
```
📸 Photo captured
✓ Image size: 75KB (compressed)
✓ Ready for analysis

[Continue] → Stage 2
```

**Step 4: RECORD (Context Inquiry - If Needed)**
```
📊 Objective Observation:
I noticed bright fluorescent lighting in your photo.

💬 Gentle Inquiry:
How is that lighting affecting you right now?

[It's harsh] [I'm used to it] [Skip]
```

**Step 5: CALIBRATE (Capacity Check-in)**
```
Based on your input:

💡 Sensory Tolerance
[Informed by photo: Harsh lighting mentioned]
Slider: ██████░░░░░ 6/10

[Adjust as needed] [Continue]
```

**Step 6: DISCOVER (Pattern Insights)**
```
✨ What I Noticed

Your sensory tolerance (6/10) suggests you're handling the 
fluorescent lighting well today. Compared to your typical range 
(4-7), you're in your normal zone.

💡 Quick Insight:
When lighting is harsh but you're tolerating it well, that often
means your sensory regulation systems are working efficiently.

💬 Friendly Question:
What's one thing that helps you with bright environments?
```

**Total Time**: 60-90 seconds
**Psychological Safety**: High throughout
**User Agency**: Preserved at every step
**Data Quality**: Enhanced through objective observations

---

## Technical Implementation Plan

### Component Architecture

**New Components to Create**:

1. **`QuickCaptureMenu.tsx`** (NEW)
   - TAP-TAP-TAP input selection
   - Three equal options: Bio-Mirror, Voice, Text
   - No hierarchy between options

2. **`ObjectiveObservation.tsx`** (NEW)
   - Displays what Mae detected (noise, lighting, tension)
   - Shows evidence (e.g., "background noise detected")
   - Provides skip button always

3. **`GentleInquiry.tsx`** (NEW)
   - Contextual follow-up question
   - Based on objective observations
   - User can always skip

4. **`InformedCapacityCalibration.tsx`** (NEW)
   - Shows "Informed by X" context for each slider
   - Pre-populated from Stage 1-2 data
   - User can override

5. **`PatternDiscovery.tsx`** (NEW)
   - Friendly tone, not prescriptive
   - "What I Noticed" instead of "Analysis Results"
   - "What does this mean?" instead of "Problem"

**Components to Refactor**:

1. **`JournalEntry.tsx`** (COMPLETE REFACTOR)
   - Transform to multi-stage flow
   - Integrate all new components
   - Maintain fast TAP-TAP-TAP-RECORD rhythm

2. **`StateCheckWizard.tsx`** (ENHANCE)
   - Update discrepancy handling
   - Change from scary warning to gentle inquiry
   - Normalize discrepancies

3. **`RecordVoiceButton.tsx`** (ENHANCE)
   - Add objective analysis display
   - Show background noise detection
   - Show speech pace and tone analysis

4. **`StateCheckCamera.tsx`** (ENHANCE)
   - Display objective observations (lighting, angle, etc.)
   - Show what bio-mirror detected
   - Always provide option to proceed without inquiry

**Services to Enhance**:

1. **`geminiVisionService.ts`** (ENHANCE)
   - Return objective observations only
   - No subjective judgments ("you seem sad")
   - Confidence scores for all detections

2. **`geminiService.ts`** (ENHANCE)
   - Implement objective prompt engineering
   - "What do you observe?" not "How do they feel?"
   - Gentle inquiry generation

3. **`audioAnalysisService.ts`** (NEW)
   - Detect background noise levels
   - Analyze speech pace
   - Detect emotional tone (as objective data, not label)

---

### Data Model Changes

**New Types** (add to `src/types.ts`):

```typescript
export interface ObjectiveObservation {
  type: 'visual' | 'audio' | 'text';
  source: 'bio-mirror' | 'voice' | 'text-input';
  observations: Observation[];
  confidence: number;
}

export interface Observation {
  category: 'lighting' | 'noise' | 'tension' | 'fatigue' | 'speech-pace' | 'tone';
  value: string; // "bright fluorescent", "moderate background noise"
  severity: 'low' | 'moderate' | 'high';
  evidence: string; // "detected in photo", "measured in audio"
}

export interface GentleInquiry {
  basedOn: string[]; // ["lighting detected", "user mentioned 'harsh'"]
  question: string; // "How is that lighting affecting you?"
  tone: 'curious' | 'supportive' | 'informational';
  skipAllowed: boolean; // Always true
}

export interface PatternInsight {
  observation: string; // "Your sensory tolerance is 6/10"
  context: string; // "Compared to typical range (4-7)"
  insight: string; // "Your sensory regulation is working efficiently"
  question?: string; // "What helps you with bright environments?"
}

export interface CapacityCalibration {
  dimension: keyof CapacityProfile;
  informedBy: string[]; // ["audio: calm speech", "text: 'feeling great'"]
  suggestedValue: number;
  userAdjustable: boolean;
}
```

---

### AI Prompt Engineering

**Visual Analysis Prompt (Bio-Mirror)**:
```
You are MAEPLE's Bio-Mirror, an objective observation tool.

Your task: Analyze facial features and report ONLY objective observations.

DO NOT:
- Say "the user looks sad/angry/happy" (Subjective)
- Label emotions or feelings
- Make assumptions about internal state

DO:
- Report physical features: "tension around eyes", "slight frown lines"
- Note lighting conditions: "bright fluorescent lighting", "soft natural light"
- Note facial indicators: "ptosis (drooping eyelids)", "furrowed brow"
- Note quality of photo: "blurry", "good lighting", "low resolution"

Format as JSON:
{
  "observations": [
    {
      "category": "tension",
      "value": "tension around eyes and jaw",
      "evidence": "visible in facial expression",
      "severity": "moderate"
    },
    {
      "category": "lighting",
      "value": "bright fluorescent lighting",
      "evidence": "detected in photo",
      "severity": "high"
    }
  ]
}
```

**Audio Analysis Prompt (Voice)**:
```
You are MAEPLE's Audio Analysis tool.

Your task: Analyze audio characteristics and report ONLY objective observations.

DO NOT:
- Say "the user sounds sad/stressed/happy" (Subjective)
- Label emotions or internal states
- Make assumptions about feelings

DO:
- Report audio quality: "background noise", "clean recording"
- Analyze speech patterns: "speech pace: 120 words/minute (moderate)", "pauses: frequent"
- Note environmental sounds: "sirens", "traffic", "keyboard typing"
- Note vocal characteristics: "flat tone", "varied pitch", "strained voice"

Format as JSON:
{
  "observations": [
    {
      "category": "noise",
      "value": "moderate background noise",
      "evidence": "sirens and traffic detected",
      "severity": "moderate"
    },
    {
      "category": "speech-pace",
      "value": "moderate pace",
      "evidence": "measured at 118 words/minute",
      "severity": "low"
    }
  ]
}
```

**Discrepancy Inquiry Prompt**:
```
You are MAEPLE, a supportive companion helping users understand their patterns.

Context: User self-report says X, but objective observations show Y.

Your task: Generate a GENTLE, NON-JUDGMENTAL inquiry to explore this discrepancy.

REQUIREMENTS:
1. Be curious, not accusatory
2. Normalize the discrepancy ("this is common", "this is normal")
3. Don't label the user ("you're masking", "you're in denial")
4. Invite exploration, not confession
5. Respect user's self-knowledge

EXAMPLES OF GOOD TONE:
"I noticed something interesting between what you said and what I observed..."
"This isn't wrong or bad. In fact, it's really common and useful information."
"Mind sharing a bit more about what's actually going on?"

EXAMPLES OF BAD TONE:
"You're masking your true feelings."
"You're not being honest with yourself."
"This discrepancy indicates denial."

Format as JSON:
{
  "opening": "friendly, curious statement",
  "context": "what was observed vs what was said",
  "normalization": "why this is normal/common",
  "question": "gentle invitation to explore"
}
```

**Pattern Discovery Prompt**:
```
You are MAEPLE, a supportive companion helping users discover their patterns.

Your task: Present insights in a FRIENDLY, NON-PRESCRIPTIVE way.

REQUIREMENTS:
1. Use observation language ("What I noticed") instead of problem language ("What you did wrong")
2. Normalize findings ("This is totally normal")
3. Provide context (how today fits into patterns)
4. Offer insights, not prescriptions ("Here's an insight" not "You should do this")
5. Invite reflection, not compliance

EXAMPLES OF GOOD TONE:
"✨ What I Noticed: Your sensory tolerance is 6/10..."
"💡 Insight: This suggests your sensory systems are working efficiently..."
"💬 Question: What helps you with bright environments?"

EXAMPLES OF BAD TONE:
"⚠️ Problem: Your sensory load is too high."
"⚠️ Recommendation: You need to reduce sensory input."
"⚠️ You're at risk of burnout."

Format as JSON:
{
  "title": "✨ What I Noticed",
  "observations": ["observation 1", "observation 2"],
  "insight": "what this suggests in a supportive way",
  "patternContext": "how this fits longer patterns",
  "friendlyQuestion": "invitation to explore further"
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-3)
- [ ] Create new types (Observation, GentleInquiry, PatternInsight)
- [ ] Implement QuickCaptureMenu component (TAP-TAP-TAP)
- [ ] Create ObjectiveObservation display component
- [ ] Implement GentleInquiry component
- [ ] Set up basic multi-stage flow structure

### Phase 2: Audio Analysis (Days 4-5)
- [ ] Create audioAnalysisService (noise detection, speech pace, tone)
- [ ] Integrate audio analysis into RecordVoiceButton
- [ ] Display objective observations from voice
- [ ] Implement gentle inquiry triggers based on audio

### Phase 3: Enhanced Bio-Mirror (Days 6-7)
- [ ] Update geminiVisionService prompts (objective only)
- [ ] Display objective observations from photos
- [ ] Implement lighting/noise detection from visual data
- [ ] Update discrepancy handling (warning → gentle inquiry)

### Phase 4: Informed Capacity Calibration (Days 8-9)
- [ ] Create InformedCapacityCalibration component
- [ ] Show "Informed by X" context for sliders
- [ ] Pre-populate from Stage 1-2 data
- [ ] Allow user overrides with acknowledgment

### Phase 5: Friendly Pattern Discovery (Days 10-11)
- [ ] Create PatternDiscovery component
- [ ] Update tone: "What I Noticed" instead of "Analysis Results"
- [ ] Implement normalization language
- [ ] Add friendly questions instead of prescriptions

### Phase 6: Integration & Polish (Days 12-13)
- [ ] Integrate all stages into JournalEntry
- [ ] Maintain TAP-TAP-TAP-RECORD flow rhythm
- [ ] Test complete user journey
- [ ] Performance optimization (fast transitions)

### Phase 7: Testing & Refinement (Days 14-15)
- [ ] User testing with neurodivergent participants
- [ ] Focus group: Tone feedback (creepy vs friendly?)
- [ ] A/B testing: single-screen vs multi-stage
- [ ] Accessibility audit (screen reader, keyboard nav)
- [ ] Documentation updates

---

## Success Metrics

### Psychological Safety Metrics
- ✅ User trust score: >4.5/5 (survey after 1 week)
- ✅ "Felt judged" responses: <5%
- ✅ "Felt supported" responses: >85%
- ✅ Discrepancy inquiry acceptance: >90% (users engage with inquiries)

### User Experience Metrics
- ✅ Completion rate: >80% (complete full flow)
- ✅ Quick path usage: >30% (users use TAP-TAP-TAP → skip)
- ✅ Time to complete: 60-90 seconds (within target)
- ✅ User satisfaction: >4/5

### Data Quality Metrics
- ✅ Objective data captured: 100% (every entry has observations)
- ✅ Self-report + objective alignment: Tracked (discrepancies as patterns)
- ✅ Signal detection accuracy: >90%
- ✅ Contextual inquiry relevance: >85% (users find inquiries helpful)

### Pattern Discovery Metrics
- ✅ Patterns discovered: +200% (from current)
- ✅ User pattern awareness: +150% (users recognize their patterns)
- ✅ Insight usefulness: >4/5 (user ratings)
- ✅ Strategy application: >60% (users try suggested insights)

---

## Risk Mitigation

### Risk 1: Still Feels Creepy Despite Design
**Mitigation**:
- Focus group testing specifically on tone
- Multiple prompt iterations based on feedback
- Always show the evidence ("I observed X because Y")
- Prominent "Skip" buttons at every inquiry
- User can disable inquiries entirely in settings

### Risk 2: Increased Complexity Reduces Completion
**Mitigation**:
- Fast path always available (TAP-TAP-TAP → Stage 4)
- Progress indicators showing steps
- Time estimates per stage
- Save progress, allow resume later
- Skip buttons prominent

### Risk 3: Objective Analysis Misses Important Nuances
**Mitigation**:
- User self-report remains primary
- User can override all suggestions
- "Actually, I'm fine" is always valid
- Train AI on diverse examples of subjective language
- Confidence scores shown to user

### Risk 4: Audio Analysis Doesn't Work Reliably
**Mitigation**:
- Fallback to text-only if audio analysis fails
- No blocking on audio data
- User can skip audio analysis entirely
- Progressive enhancement: nice-to-have, not required

---

## Rollout Strategy

### Phase A: Tone Validation (1 week)
- Create prototype of gentle inquiry system
- Test with 5-10 users
- Specifically ask: "Does this feel creepy or supportive?"
- Iterate on prompt engineering until 90%+ report supportive

### Phase B: Beta Testing (2 weeks)
- Deploy full system to staging
- Invite 20-30 beta users (neurodivergent community)
- Monitor: completion rates, skip rates, inquiry acceptance
- Weekly feedback sessions to refine tone

### Phase C: Gradual Rollout (2 weeks)
- Week 1: 10% of users
- Week 2: 30% of users
- Week 3: 60% of users
- Week 4: 100% of users
- Monitor metrics, rollback plan ready

---

## Conclusion

This enhancement transforms journal entry from a **quick mood check** into a **guided pattern discovery experience** while maintaining:

✅ **Fast TAP-TAP-TAP-RECORD flow** - Easy and efficient  
✅ **Psychological safety** - Never creepy, always supportive  
✅ **Objective observations** - Show the evidence, don't label  
✅ **Gentle inquiries** - Curious, not interrogative  
✅ **Respect for self-report** - User's self-knowledge is sacred  
✅ **Discrepancies as information** - The gap IS the pattern  

By investing 60-90 seconds, users get:
- Richer data for sophisticated analysis
- Deeper self-awareness through objective feedback
- Trust in Mae as a supportive companion
- Understanding of their unique patterns
- Strategies that actually fit their life

The key is making objective observations feel **curious and supportive**, not creepy or judgmental.

**Next Steps**: 
1. Review and approve this refined plan
2. Begin Phase 1 implementation (core infrastructure)
3. Tone validation focus group before full rollout
4. Iterate based on psychological safety feedback

**Status**: Ready for implementation with user approval
