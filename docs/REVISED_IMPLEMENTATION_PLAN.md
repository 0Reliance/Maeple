# MAEPLE Revised Implementation Plan

**Date**: December 26, 2025  
**Status**: Revised based on gap analysis  
**Focus**: Integration over new features

---

## Overview

**Key Finding from Gap Analysis:** Phase 1-3 components are technically complete but functionally disconnected. The pieces exist but don't work together.

**Revised Strategy:** Focus 100% on **integration work** to connect existing components. No new component development until critical gaps are fixed.

---

## Revised Phase Structure

### Phase 1: Core Integration (Was "Informed Capacity Calibration")
**Original Days 8-9** → **Extended to Days 8-10**  
**Focus:** Connect existing components into working journal flow

### Phase 2: User Flow Testing (Was "Friendly Pattern Discovery")
**Original Days 10-11** → **Extended to Days 11-13**  
**Focus:** End-to-end testing of complete flow

### Phase 3: System Integration (Was "Integration & Polish")
**Original Days 12-13** → **Extended to Days 14-16**  
**Focus:** StateCheckWizard integration, error handling

### Phase 4: Testing & Refinement (Was "Testing & Refinement")
**Original Days 14-15** → **Extended to Days 17-20**  
**Focus:** Comprehensive testing, bug fixes, polish

**Total Timeline:** Days 8-20 (13 days instead of 8 days)

---

## Phase 1: Core Integration (Days 8-10)

### Day 8: JournalEntry Component Integration

**Goal:** Connect QuickCaptureMenu, RecordVoiceButton, and observation displays

**Tasks:**

#### Task 1.1: Import New Components (1 hour)
```typescript
// Add to JournalEntry.tsx
import QuickCaptureMenu from "./QuickCaptureMenu";
import VoiceObservations from "./VoiceObservations";
import PhotoObservations from "./PhotoObservations";
import StateCheckCamera from "./StateCheckCamera";
import { AudioAnalysisResult } from "../services/audioAnalysisService";
import { FacialAnalysis } from "../types";
```

**Acceptance Criteria:**
- [ ] All components imported successfully
- [ ] No TypeScript errors
- [ ] Components accessible within component scope

---

#### Task 1.2: Add Capture Mode State (30 minutes)
```typescript
type CaptureMode = 'menu' | 'text' | 'voice' | 'bio-mirror' | 'observations';
const [captureMode, setCaptureMode] = useState<CaptureMode>('menu');
```

**Acceptance Criteria:**
- [ ] Type defined correctly
- [ ] State initialized to 'menu'
- [ ] TypeScript no errors

---

#### Task 1.3: Add Analysis State (30 minutes)
```typescript
const [voiceAnalysis, setVoiceAnalysis] = useState<AudioAnalysisResult | null>(null);
const [photoAnalysis, setPhotoAnalysis] = useState<FacialAnalysis | null>(null);
```

**Acceptance Criteria:**
- [ ] Both states added
- [ ] Properly typed
- [ ] Initialized to null

---

#### Task 1.4: Update handleTranscript Signature (1 hour)
```typescript
const handleTranscript = (
  transcript: string, 
  audioBlob?: Blob, 
  analysis?: AudioAnalysisResult
) => {
  setText(transcript);
  
  if (analysis) {
    setVoiceAnalysis(analysis);
    setCaptureMode('observations');
  }
};
```

**Acceptance Criteria:**
- [ ] Accepts all three parameters
- [ ] Stores analysis in state
- [ ] Transitions to observations mode

---

#### Task 1.5: Update RecordVoiceButton Props (30 minutes)
```typescript
<RecordVoiceButton 
  onTranscript={handleTranscript}
  onAnalysisReady={(analysis) => {
    setVoiceAnalysis(analysis);
    setCaptureMode('observations');
  }}
  isDisabled={isProcessing}
/>
```

**Acceptance Criteria:**
- [ ] onAnalysisReady callback connected
- [ ] Analysis stored in state
- [ ] Mode transitions correctly

---

#### Task 1.6: Implement Mode-Based Rendering (2 hours)
```typescript
return (
  <div className="space-y-6">
    {/* Step 1: Choose Input Method */}
    {captureMode === 'menu' && (
      <QuickCaptureMenu
        onSelectMethod={(method) => setCaptureMode(method)}
      />
    )}
    
    {/* Step 2a: Text Input */}
    {captureMode === 'text' && (
      // Existing text input UI
      // Wrap existing JSX in conditional
    )}
    
    {/* Step 2b: Voice Recording */}
    {captureMode === 'voice' && (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl">
        <h3 className="text-lg font-bold mb-4">Voice Recording</h3>
        <RecordVoiceButton 
          onTranscript={handleTranscript}
          onAnalysisReady={(analysis) => {
            setVoiceAnalysis(analysis);
            setCaptureMode('observations');
          }}
          isDisabled={isProcessing}
        />
        <button 
          onClick={() => setCaptureMode('menu')}
          className="mt-4 text-slate-600 dark:text-slate-400"
        >
          Back to menu
        </button>
      </div>
    )}
    
    {/* Step 2c: Bio-Mirror */}
    {captureMode === 'bio-mirror' && (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl">
        <h3 className="text-lg font-bold mb-4">Bio-Mirror Check</h3>
        <StateCheckCamera
          onPhotoCaptured={(photo, analysis) => {
            setPhotoAnalysis(analysis);
            setCaptureMode('observations');
          }}
        />
        <button 
          onClick={() => setCaptureMode('menu')}
          className="mt-4 text-slate-600 dark:text-slate-400"
        >
          Back to menu
        </button>
      </div>
    )}
    
    {/* Step 3: Display Observations */}
    {captureMode === 'observations' && voiceAnalysis && (
      <VoiceObservations
        analysis={voiceAnalysis}
        onContinue={() => setCaptureMode('text')}
        onSkip={() => setCaptureMode('text')}
      />
    )}
    
    {captureMode === 'observations' && photoAnalysis && (
      <PhotoObservations
        analysis={photoAnalysis}
        onContinue={() => setCaptureMode('text')}
        onSkip={() => setCaptureMode('text')}
      />
    )}
  </div>
);
```

**Acceptance Criteria:**
- [ ] All modes render correctly
- [ ] Navigation between modes works
- [ ] Back buttons functional
- [ ] Observations display after capture

---

#### Task 1.7: Add Progress Indicator (1 hour)
```typescript
const getProgressStep = () => {
  switch (captureMode) {
    case 'menu': return 1;
    case 'voice':
    case 'bio-mirror':
    case 'text': return 2;
    case 'observations': return 3;
    default: return 1;
  }
};

// Add to JSX
<div className="flex items-center gap-2 mb-6">
  {[1, 2, 3].map((step) => (
    <div
      key={step}
      className={`h-2 rounded-full flex-1 ${
        step <= getProgressStep()
          ? 'bg-indigo-600'
          : 'bg-slate-200 dark:bg-slate-700'
      }`}
    />
  ))}
  <span className="text-sm text-slate-600 dark:text-slate-400">
    Step {getProgressStep()} of 3
  </span>
</div>
```

**Acceptance Criteria:**
- [ ] Progress bar shows correctly
- [ ] Updates when mode changes
- [ ] Accessible to screen readers

---

**Day 8 Success Criteria:**
- [ ] User can choose input method
- [ ] User can record voice
- [ ] User can take photo
- [ ] Observations display after capture
- [ ] User can navigate between modes

---

### Day 9: Data Storage & Persistence

**Goal:** Ensure observations are stored in HealthEntry

#### Task 2.1: Update ParsedResponse Type (30 minutes)
```typescript
// Add to types.ts if not already there
interface ParsedResponse {
  moodScore: number;
  moodLabel: string;
  medications: Array<{ name: string; amount: string; unit: string }>;
  symptoms: Array<{ name: string; severity: number }>;
  neuroMetrics: {
    sensoryLoad: number;
    contextSwitches: number;
    maskingScore: number;
  };
  activityTypes: string[];
  strengths: string[];
  summary: string;
  strategies: StrategyRecommendation[];
  analysisReasoning: string;
  
  // ✅ ADD THIS:
  objectiveObservations?: Observation[];
  gentleInquiry?: GentleInquiry;
}
```

**Acceptance Criteria:**
- [ ] Type updated
- [ ] Optional fields (not required)
- [ ] TypeScript compiles

---

#### Task 2.2: Update parseJournalEntry Schema (1 hour)
```typescript
const healthEntrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    moodScore: { type: Type.NUMBER },
    moodLabel: { type: Type.STRING },
    // ... existing properties ...
    
    // ✅ ADD THIS:
    objectiveObservations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { 
            type: Type.STRING, 
            enum: ["lighting", "noise", "tension", "fatigue", "speech-pace", "tone"]
          },
          value: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "moderate", "high"] },
          evidence: { type: Type.STRING }
        }
      },
      description: "Objective data extracted from text"
    },
    
    gentleInquiry: {
      type: Type.OBJECT,
      properties: {
        basedOn: { type: Type.ARRAY, items: { type: Type.STRING } },
        question: { type: Type.STRING },
        tone: { type: Type.STRING, enum: ["curious", "supportive", "informational"] },
        skipAllowed: { type: Type.BOOLEAN },
        priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
      },
      description: "Optional gentle question"
    }
  },
  required: ["moodScore", "moodLabel", "neuroMetrics", "activityTypes", "strengths", "summary", "strategies", "analysisReasoning"]
};
```

**Acceptance Criteria:**
- [ ] Schema updated
- [ ] Fields are optional
- [ ] Descriptions clear
- [ ] No breaking changes to existing parsing

---

#### Task 2.3: Update System Instruction for Objectivity (1 hour)
```typescript
const systemInstruction = `
You are Mae, voice of MAEPLE (Mental And Emotional Pattern Literacy Engine).

CRITICAL PRINCIPLE: OBJECTIVITY OVER SUBJECTIVITY

When analyzing text:
✅ DO: Extract objective data mentioned by user
   - "The fluorescent lights are killing me" → Extract: lighting (high severity)
   - "This coffee shop is so loud" → Extract: noise (moderate severity)
   - "My eyes feel droopy" → Extract: fatigue (moderate severity)
   
❌ DO NOT: Make subjective interpretations
   - "You sound stressed" - NEVER say this
   - "You seem angry" - NEVER say this
   - "You're masking" - NEVER say this

GENTLE INQUIRY GENERATION:
- If high-severity observations detected → Generate gentle inquiry
- "I noticed you mentioned harsh lighting. How is that affecting your energy?"
- Always mark skipAllowed: true
- Tone must be "curious" never "interrogating"

DECISION MATRIX:
- If user mentions objective environmental factors → Extract and acknowledge
- If user expresses internal state → Validate without labeling
- If discrepancy between stated mood and text content → Ask gently

STRATEGY GENERATION:
- Generate 3 neuro-affirming strategies
- Base on capacity profile and observations
- Always make optional, never prescriptive
`;
```

**Acceptance Criteria:**
- [ ] Objectivity emphasized
- [ ] Examples of what to do/not do
- [ ] Gentle inquiry guidance included
- [ ] No subjective language

---

#### Task 2.4: Update handleSubmit to Store Observations (1 hour)
```typescript
const handleSubmit = async () => {
  if (!text.trim()) return;
  setIsProcessing(true);
  
  try {
    const parsed: ParsedResponse = await parseJournalEntry(text, capacity);
    
    const newEntry: HealthEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      rawText: text,
      mood: parsed.moodScore,
      moodLabel: parsed.moodLabel,
      medications: parsed.medications.map((m) => ({
        name: m.name,
        dosage: m.amount,
        unit: m.unit,
      })),
      symptoms: parsed.symptoms.map((s) => ({
        name: s.name,
        severity: s.severity,
      })),
      tags: [],
      activityTypes: parsed.activityTypes || [],
      strengths: parsed.strengths || [],
      neuroMetrics: {
        spoonLevel: calculateAverageSpoons(),
        sensoryLoad: parsed.neuroMetrics.sensoryLoad,
        contextSwitches: parsed.neuroMetrics.contextSwitches,
        maskingScore: parsed.neuroMetrics.maskingScore,
        capacity: capacity,
      },
      notes: parsed.summary,
      aiStrategies: parsed.strategies,
      aiReasoning: parsed.analysisReasoning,
      
      // ✅ ADD THIS: Store objective observations
      objectiveObservations: [
        ...(voiceAnalysis ? [{
          type: 'audio',
          source: 'voice',
          observations: voiceAnalysis.observations,
          confidence: voiceAnalysis.confidence,
          timestamp: new Date().toISOString(),
        }] : []),
        ...(photoAnalysis ? [{
          type: 'visual',
          source: 'bio-mirror',
          observations: photoAnalysis.observations,
          confidence: photoAnalysis.confidence,
          timestamp: new Date().toISOString(),
        }] : []),
        ...(parsed.objectiveObservations ? [{
          type: 'text',
          source: 'text-input',
          observations: parsed.objectiveObservations,
          confidence: 0.8, // Text analysis confidence
          timestamp: new Date().toISOString(),
        }] : []),
      ],
    };
    
    onEntryAdded(newEntry);
    
    // Reset states
    setText("");
    setVoiceAnalysis(null);
    setPhotoAnalysis(null);
    setCaptureMode('menu');
    setLastStrategies(parsed.strategies || []);
  } catch (e) {
    console.error("Failed to process entry", e);
    alert("Failed to analyze entry. Please try again.");
  } finally {
    setIsProcessing(false);
  }
};
```

**Acceptance Criteria:**
- [ ] Voice observations stored
- [ ] Photo observations stored
- [ ] Text observations stored
- [ ] All observation types included
- [ ] States reset after submission

---

**Day 9 Success Criteria:**
- [ ] Schema updated for objective observations
- [ ] AI prompts emphasize objectivity
- [ ] Observations stored in HealthEntry
- [ ] Data persists correctly

---

### Day 10: Informed Capacity Calibration

**Goal:** Use objective data to suggest capacity values

#### Task 3.1: Implement getSuggestedCapacity (1.5 hours)
```typescript
const getSuggestedCapacity = (): Partial<CapacityProfile> => {
  const suggestions: Partial<CapacityProfile> = {};
  
  // Voice analysis suggestions
  if (voiceAnalysis) {
    const highNoise = voiceAnalysis.observations.some(
      obs => obs.category === 'noise' && obs.severity === 'high'
    );
    if (highNoise) {
      suggestions.sensory = 3;
      suggestions.focus = 4;
    }
    
    const moderateNoise = voiceAnalysis.observations.some(
      obs => obs.category === 'noise' && obs.severity === 'moderate'
    );
    if (moderateNoise) {
      suggestions.sensory = 5;
    }
    
    const fastPace = voiceAnalysis.observations.some(
      obs => obs.category === 'speech-pace' && obs.value.includes('fast')
    );
    if (fastPace) {
      suggestions.executive = 4; // May be rushed
      suggestions.social = 4; // Too rushed for social
    }
  }
  
  // Photo analysis suggestions
  if (photoAnalysis) {
    if (photoAnalysis.lightingSeverity === 'high') {
      suggestions.sensory = 3;
      suggestions.emotional = 4;
    }
    
    if (photoAnalysis.lightingSeverity === 'moderate') {
      suggestions.sensory = 5;
    }
    
    const highTension = photoAnalysis.observations.some(
      obs => obs.category === 'tension' && obs.value.includes('high')
    );
    if (highTension) {
      suggestions.emotional = 4;
      suggestions.executive = 4;
    }
    
    const fatigueIndicators = photoAnalysis.observations.some(
      obs => obs.category === 'fatigue' && obs.severity !== 'low'
    );
    if (fatigueIndicators) {
      suggestions.physical = 4;
      suggestions.focus = 4;
    }
  }
  
  return suggestions;
};
```

**Acceptance Criteria:**
- [ ] Analyzes voice observations
- [ ] Analyzes photo observations
- [ ] Returns partial capacity profile
- [ ] Logic is reasonable

---

#### Task 3.2: Initialize Capacity with Suggestions (30 minutes)
```typescript
const suggestedCapacity = getSuggestedCapacity();
const [capacity, setCapacity] = useState<CapacityProfile>({
  focus: suggestedCapacity.focus || 7,
  social: suggestedCapacity.social || 5,
  structure: suggestedCapacity.structure || 4,
  emotional: suggestedCapacity.emotional || 6,
  physical: suggestedCapacity.physical || 5,
  sensory: suggestedCapacity.sensory || 6,
  executive: suggestedCapacity.executive || 5,
});
```

**Acceptance Criteria:**
- [ ] Capacity initialized with suggestions
- [ ] Fallback to defaults if no suggestions
- [ ] No TypeScript errors

---

#### Task 3.3: Implement getInformedByContext (1 hour)
```typescript
const getInformedByContext = (field: keyof CapacityProfile): string | null => {
  const reasons: string[] = [];
  
  if (voiceAnalysis) {
    if (field === 'sensory') {
      const noiseObs = voiceAnalysis.observations.find(obs => obs.category === 'noise');
      if (noiseObs?.severity === 'high') reasons.push('high noise level');
      else if (noiseObs?.severity === 'moderate') reasons.push('moderate noise');
    }
    if (field === 'executive') {
      const paceObs = voiceAnalysis.observations.find(obs => obs.category === 'speech-pace');
      if (paceObs) reasons.push('speech pace');
    }
  }
  
  if (photoAnalysis) {
    if (field === 'sensory') {
      reasons.push('lighting condition');
    }
    if (field === 'emotional') {
      const tensionObs = photoAnalysis.observations.find(obs => obs.category === 'tension');
      if (tensionObs) reasons.push('facial tension');
    }
  }
  
  return reasons.length > 0 ? `Informed by: ${reasons.join(', ')}` : null;
};
```

**Acceptance Criteria:**
- [ ] Returns context string or null
- [ ] Explains why slider is set
- [ ] Multiple reasons concatenated

---

#### Task 3.4: Update CapacitySlider to Show Context (1 hour)
```typescript
const CapacitySlider = ({ label, icon: Icon, value, field, color, suggested }: any) => {
  const styles = colorStyles[color] || colorStyles.blue;
  const informedBy = getInformedByContext(field);
  const isSuggested = suggested !== undefined && value === suggested;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${styles.bg} ${styles.text}`}>
            <Icon size={14} />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>
          {/* ✅ Suggested indicator */}
          {isSuggested && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              (Suggested)
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {value}/10
        </span>
      </div>
      
      {/* ✅ Informed by badge */}
      {informedBy && (
        <div className="mb-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/50 rounded-full">
          <Info size={10} />
          {informedBy}
        </div>
      )}
      
      <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer group">
        <div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${styles.gradient} rounded-full transition-all duration-300`}
          style={{ width: `${value * 10}%` }}
        ></div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => updateCapacity(field, parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] "Suggested" indicator shows
- [ ] "Informed by" badge displays
- [ ] Styling matches design
- [ ] Accessibility maintained

---

**Day 10 Success Criteria:**
- [ ] Capacity values suggested from observations
- [ ] Context displayed for each suggestion
- [ ] User can override suggestions
- [ ] Clear indication of suggested vs manual

---

### Phase 1 Summary (Days 8-10)

**Total Time:** 13 hours  
**Deliverables:**
- ✅ Integrated journal flow (menu → capture → observations → text)
- ✅ Observations stored in HealthEntry
- ✅ AI prompts emphasize objectivity
- ✅ Capacity calibration informed by objective data

---

## Phase 2: User Flow Testing (Days 11-13)

### Day 11: Gentle Inquiry Integration

**Goal:** Add gentle inquiry triggers and display

#### Task 4.1: Add GentleInquiry State (30 minutes)
```typescript
const [gentleInquiry, setGentleInquiry] = useState<GentleInquiry | null>(null);
```

---

#### Task 4.2: Trigger Gentle Inquiry from Text Analysis (1 hour)
```typescript
const handleSubmit = async () => {
  if (!text.trim()) return;
  setIsProcessing(true);
  
  try {
    const parsed: ParsedResponse = await parseJournalEntry(text, capacity);
    
    // ✅ Check for gentle inquiry
    if (parsed.gentleInquiry) {
      setGentleInquiry(parsed.gentleInquiry);
      setIsProcessing(false);
      return; // Don't submit yet, wait for user response
    }
    
    // ... rest of submission
  } catch (e) {
    console.error("Failed to process entry", e);
  } finally {
    setIsProcessing(false);
  }
};
```

---

#### Task 4.3: Trigger Gentle Inquiry from Voice Analysis (30 minutes)
```typescript
const handleTranscript = (
  transcript: string, 
  audioBlob?: Blob, 
  analysis?: AudioAnalysisResult
) => {
  setText(transcript);
  
  if (analysis?.gentleInquiry) {
    setGentleInquiry(analysis.gentleInquiry);
  }
};
```

---

#### Task 4.4: Render GentleInquiry Component (1 hour)
```typescript
{gentleInquiry && (
  <GentleInquiry
    inquiry={gentleInquiry}
    onResponse={(response) => {
      if (response === 'skip') {
        setGentleInquiry(null);
        // Continue with original submission
        handleSubmit();
      } else if (response === 'yes' || response === 'no') {
        setGentleInquiry(null);
        // Append response to text
        setText(text + `\n\n[User noted: ${response === 'yes' ? 'Yes' : 'No'}]`);
        // Submit after brief delay
        setTimeout(handleSubmit, 500);
      }
    }}
  />
)}
```

---

**Day 11 Success Criteria:**
- [ ] Gentle inquiries trigger from text analysis
- [ ] Gentle inquiries trigger from voice analysis
- [ ] Gentle inquiry displays correctly
- [ ] User can skip or respond
- [ ] Flow continues appropriately

---

### Day 12: Error Handling & Fallbacks

**Goal:** Make system resilient to failures

#### Task 5.1: Add Error States (1.5 hours)
```typescript
const [analysisError, setAnalysisError] = useState<string | null>(null);

// Wrap analysis calls in try-catch
const handleTranscript = async (
  transcript: string, 
  audioBlob?: Blob, 
  analysis?: AudioAnalysisResult
) => {
  setText(transcript);
  
  try {
    if (analysis) {
      setVoiceAnalysis(analysis);
      setCaptureMode('observations');
      setAnalysisError(null);
    }
  } catch (error) {
    console.error("Analysis failed:", error);
    setAnalysisError("Analysis failed. You can still complete your entry manually.");
    setCaptureMode('text');
  }
};
```

---

#### Task 5.2: Display Error Messages (1 hour)
```typescript
{analysisError && (
  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
    <div className="flex items-start gap-2">
      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {analysisError}
        </p>
        <button
          onClick={() => setCaptureMode('text')}
          className="mt-2 text-sm text-amber-700 dark:text-amber-300 hover:underline"
        >
          Continue to text entry
        </button>
      </div>
    </div>
  </div>
)}
```

---

#### Task 5.3: Add Loading States (1 hour)
```typescript
const [isAnalyzing, setIsAnalyzing] = useState(false);

// Show loading during analysis
{isAnalyzing && (
  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6">
    <div className="flex items-center gap-3">
      <Loader2 size={20} className="animate-spin text-indigo-600 dark:text-indigo-400" />
      <span className="text-sm text-slate-700 dark:text-slate-300">
        Analyzing...
      </span>
    </div>
  </div>
)}
```

---

**Day 12 Success Criteria:**
- [ ] Errors displayed gracefully
- [ ] Fallback to manual entry works
- [ ] Loading states show correctly
- [ ] User never gets stuck

---

### Day 13: End-to-End Testing

**Goal:** Test complete user journey

#### Task 6.1: Test Voice Flow (1 hour)
- [ ] Select voice option
- [ ] Record audio
- [ ] See observations
- [ ] Continue to text
- [ ] Complete entry
- [ ] Verify data stored

#### Task 6.2: Test Bio-Mirror Flow (1 hour)
- [ ] Select Bio-Mirror option
- [ ] Capture photo
- [ ] See observations
- [ ] Continue to text
- [ ] Complete entry
- [ ] Verify data stored

#### Task 6.3: Test Text Flow (1 hour)
- [ ] Select text option
- [ ] Type entry
- [ ] See gentle inquiry (if applicable)
- [ ] Adjust capacity
- [ ] Complete entry
- [ ] Verify data stored

#### Task 6.4: Test Error Scenarios (1 hour)
- [ ] Test with no AI configured
- [ ] Test with failed analysis
- [ ] Test with microphone denied
- [ ] Test with camera denied
- [ ] Test with network error

**Day 13 Success Criteria:**
- [ ] All flows work end-to-end
- [ ] Errors handled gracefully
- [ ] Data persists correctly
- [ ] No critical bugs found

---

### Phase 2 Summary (Days 11-13)

**Total Time:** 10 hours  
**Deliverables:**
- ✅ Gentle inquiry integration
- ✅ Error handling implemented
- ✅ Loading states added
- ✅ End-to-end testing complete

---

## Phase 3: System Integration (Days 14-16)

### Day 14: StateCheckWizard Integration

**Goal:** Connect StateCheckWizard to journal flow

#### Task 7.1: Analyze StateCheckWizard Integration (2 hours)
- Review current implementation
- Identify data flow
- Plan integration approach

#### Task 7.2: Implement Shared State (2 hours)
- Create shared store for Bio-Mirror data
- Ensure both components can access
- Update both components to use store

#### Task 7.3: Test Integration (1 hour)
- Verify data flows correctly
- Test both components working together
- Ensure no conflicts

---

### Day 15: Accessibility Improvements

**Goal:** Ensure accessibility compliance

#### Task 8.1: Add ARIA Labels (1 hour)
- Label all interactive elements
- Add landmarks
- Ensure keyboard navigation

#### Task 8.2: Screen Reader Testing (1 hour)
- Test with NVDA or VoiceOver
- Fix reading order issues
- Ensure descriptions are clear

#### Task 8.3: Keyboard Navigation (1 hour)
- Ensure all actions accessible via keyboard
- Add focus indicators
- Test tab order

---

### Day 16: Performance Optimization

**Goal:** Optimize for speed and efficiency

#### Task 9.1: Add Caching (2 hours)
- Cache analysis results
- Implement cache invalidation
- Check cache before API calls

#### Task 9.2: Lazy Loading (1 hour)
- Lazy load heavy components
- Implement code splitting
- Reduce initial bundle size

#### Task 9.3: Performance Testing (1 hour)
- Measure load times
- Identify bottlenecks
- Optimize critical path

---

### Phase 3 Summary (Days 14-16)

**Total Time:** 13 hours  
**Deliverables:**
- ✅ StateCheckWizard integrated
- ✅ Accessibility improvements
- ✅ Performance optimizations

---

## Phase 4: Testing & Refinement (Days 17-20)

### Day 17: Unit Tests

**Goal:** Write comprehensive unit tests

#### Task 10.1: Test QuickCaptureMenu (1 hour)
#### Task 10.2: Test RecordVoiceButton (1.5 hours)
#### Task 10.3: Test VoiceObservations (1 hour)
#### Task 10.4: Test PhotoObservations (1 hour)
#### Task 10.5: Test GentleInquiry (1 hour)

---

### Day 18: Integration Tests

**Goal:** Test component interactions

#### Task 11.1: Test Journal Flow Integration (2 hours)
#### Task 11.2: Test Data Persistence (1.5 hours)
#### Task 11.3: Test Error Handling (1.5 hours)

---

### Day 19: E2E Tests

**Goal:** Test complete user journeys

#### Task 12.1: Write E2E tests (3 hours)
#### Task 12.2: Run tests on multiple browsers (1 hour)

---

### Day 20: Bug Fixes & Polish

**Goal:** Fix issues found in testing

#### Task 13.1: Fix Critical Bugs (2 hours)
#### Task 13.2: Fix Medium Priority Issues (1.5 hours)
#### Task 13.3: Polish UI/UX (1.5 hours)

---

### Phase 4 Summary (Days 17-20)

**Total Time:** 20 hours  
**Deliverables:**
- ✅ Comprehensive test suite
- ✅ All known bugs fixed
- ✅ UI/UX polished

---

## Total Summary

### Time Investment
- **Phase 1 (Days 8-10):** 13 hours
- **Phase 2 (Days 11-13):** 10 hours
- **Phase 3 (Days 14-16):** 13 hours
- **Phase 4 (Days 17-20):** 20 hours
- **Total:** 56 hours over 13 days

### Deliverables
✅ Integrated journal flow  
✅ Objective observations stored  
✅ AI prompts updated  
✅ Informed capacity calibration  
✅ Gentle inquiry integration  
✅ Error handling  
✅ StateCheckWizard integration  
✅ Accessibility improvements  
✅ Performance optimizations  
✅ Comprehensive testing  
✅ Bug fixes and polish  

### Success Criteria
- [ ] User can complete journal entry via any method (text/voice/photo)
- [ ] Observations are objective and displayed appropriately
- [ ] Capacity values are suggested and explained
- [ ] Gentle inquiries feel supportive, not interrogating
- [ ] System is accessible to screen readers
- [ ] System performs well under load
- [ ] All critical bugs are fixed
- [ ] Test coverage >80%

---

## Risk Mitigation

### High Risk: AI Prompts Still Subjective

**Mitigation:**
- Continuous prompt testing
- User feedback collection
- A/B testing different prompt versions
- Manual review of AI outputs

### Medium Risk: Integration Complexity

**Mitigation:**
- Incremental integration
- Test at each step
- Rollback plan for major changes
- Clear commit messages

### Low Risk: Timeline Overrun

**Mitigation:**
- Prioritize critical features
- Defer low-priority items
- Buffer time for unexpected issues
- Regular progress reviews

---

## Conclusion

This revised plan focuses on **integration over new features**. The components from Phases 1-3 are well-designed but disconnected. The priority is connecting them into a cohesive user experience.

**Key Success Factor:** Resist urge to build new features until existing pieces work together perfectly.

**Next Step:** Begin Day 8, Task 1.1 - Import new components into JournalEntry.tsx.
