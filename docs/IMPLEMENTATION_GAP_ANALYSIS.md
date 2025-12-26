# MAEPLE Implementation Gap Analysis

**Date**: December 26, 2025  
**Status**: Critical Gaps Identified  
**Severity**: High - Core features missing from implementation

---

## Executive Summary

While Phases 1-3 component implementation is complete, **critical integration gaps** prevent the enhanced journal system from functioning as designed. The components exist but are not connected in a working user flow.

**Key Finding**: Components were built in isolation without integrating them into the actual JournalEntry workflow.

---

## Critical Gaps (Must Fix)

### 1. RecordVoiceButton Integration - INCOMPLETE ✅

**Problem:**
- RecordVoiceButton was enhanced with new props and dual recording
- But JournalEntry.tsx still uses OLD callback signature
- No analysis results are displayed to user
- No integration with VoiceObservations component

**Current Code (JournalEntry.tsx line 317):**
```typescript
<RecordVoiceButton
  onTranscript={handleTranscript}
  isDisabled={isProcessing}
/>
```

**Issue:**
- `handleTranscript` only accepts text: `(transcript: string) => void`
- New signature accepts: `(text, audioBlob?, analysis?) => void`
- `onAnalysisReady` callback not used
- VoiceObservations component never displayed

**Required Fix:**
```typescript
// 1. Update handleTranscript to accept new signature
const handleTranscript = (
  transcript: string, 
  audioBlob?: Blob, 
  analysis?: AudioAnalysisResult
) => {
  setText((prev) => {
    const trimmed = prev.trim();
    return trimmed ? `${trimmed} ${transcript}` : transcript;
  });
  
  // Store analysis for display
  if (analysis) {
    setCurrentAnalysis(analysis); // Add state
    setShowVoiceObservations(true); // Add state
  }
};

// 2. Add state for voice observations
const [currentAnalysis, setCurrentAnalysis] = useState<AudioAnalysisResult | null>(null);
const [showVoiceObservations, setShowVoiceObservations] = useState(false);

// 3. Add onAnalysisReady callback
<RecordVoiceButton
  onTranscript={handleTranscript}
  onAnalysisReady={(analysis) => {
    setCurrentAnalysis(analysis);
    setShowVoiceObservations(true);
  }}
  isDisabled={isProcessing}
/>

// 4. Display VoiceObservations when available
{showVoiceObservations && currentAnalysis && (
  <VoiceObservations
    analysis={currentAnalysis}
    onContinue={() => setShowVoiceObservations(false)}
    onSkip={() => setShowVoiceObservations(false)}
  />
)}
```

---

### 2. QuickCaptureMenu Integration - MISSING ✅

**Problem:**
- QuickCaptureMenu component created
- But NOT imported or used in JournalEntry.tsx
- Users cannot choose between text/voice/photo entry methods
- Still forced into text-only journaling

**Required Fix:**
```typescript
// 1. Import component
import QuickCaptureMenu from "./QuickCaptureMenu";
import VoiceObservations from "./VoiceObservations";
import PhotoObservations from "./PhotoObservations";
import StateCheckCamera from "./StateCheckCamera";

// 2. Add state for current capture mode
type CaptureMode = 'menu' | 'text' | 'voice' | 'bio-mirror' | 'observations';
const [captureMode, setCaptureMode] = useState<CaptureMode>('menu');

// 3. Add state for observations data
const [voiceAnalysis, setVoiceAnalysis] = useState<AudioAnalysisResult | null>(null);
const [photoAnalysis, setPhotoAnalysis] = useState<FacialAnalysis | null>(null);

// 4. Replace current input with mode-based rendering
return (
  <div className="space-y-6">
    {captureMode === 'menu' && (
      <QuickCaptureMenu
        onSelectMethod={(method) => setCaptureMode(method)}
      />
    )}
    
    {captureMode === 'text' && (
      // Current text input UI
    )}
    
    {captureMode === 'voice' && (
      // Voice recording UI
      <RecordVoiceButton 
        onTranscript={handleTranscript}
        onAnalysisReady={(analysis) => {
          setVoiceAnalysis(analysis);
          setCaptureMode('observations');
        }}
      />
    )}
    
    {captureMode === 'bio-mirror' && (
      <StateCheckCamera
        onPhotoCaptured={(photo, analysis) => {
          setPhotoAnalysis(analysis);
          setCaptureMode('observations');
        }}
      />
    )}
    
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

---

### 3. Objective Observations Not Being Stored - CRITICAL ✅

**Problem:**
- `HealthEntry` type has `objectiveObservations?: ObjectiveObservation[]` field
- But JournalEntry.tsx NEVER collects or stores these observations
- parseJournalEntry doesn't extract objective observations from text
- Voice and photo analysis results are discarded

**Required Fix:**

```typescript
// 1. Add to healthEntry type (already exists in types.ts)
// 2. Update handleSubmit to store observations

const handleSubmit = async () => {
  // ... existing code ...
  
  const newEntry: HealthEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    rawText: text,
    mood: parsed.moodScore,
    moodLabel: parsed.moodLabel,
    medications: /* ... */,
    symptoms: /* ... */,
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
    
    // ✅ ADD THIS:
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
    ],
  };
  
  onEntryAdded(newEntry);
};
```

---

### 4. geminiService Prompts Incomplete - CRITICAL ✅

**Problem:**
- parseJournalEntry schema doesn't include objective observations
- System instruction doesn't emphasize objectivity principles
- No extraction of objective observations from text (e.g., "harsh lighting")
- No gentle inquiry generation in journal context

**Required Fix:**

```typescript
// 1. Update schema to include objective observations
const healthEntrySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    moodScore: { type: Type.NUMBER, description: "Rating from 1 (terrible) to 5 (excellent)" },
    moodLabel: { type: Type.STRING, description: "One word adjective describing mood" },
    
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
          value: { type: Type.STRING, description: "Objective observation" },
          severity: { type: Type.STRING, enum: ["low", "moderate", "high"] },
          evidence: { type: Type.STRING, description: "Source of observation" }
        }
      },
      description: "Objective data extracted from text (e.g., 'harsh fluorescent lighting', 'noisy environment')"
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
      description: "Optional gentle question based on objective observations"
    },
    
    // ... rest of schema
  },
  required: ["moodScore", "moodLabel", "neuroMetrics", "activityTypes", "strengths", "summary", "strategies", "analysisReasoning"]
};

// 2. Update system instruction
const systemInstruction = `
You are Mae, voice of MAEPLE (Mental And Emotional Pattern Literacy Engine).

CRITICAL PRINCIPLE: OBJECTIVITY OVER SUBJECTIVITY

When analyzing text:
✅ DO: Extract objective data mentioned by user
   - "The fluorescent lights are killing me" → lighting: high severity
   - "This coffee shop is so loud" → noise: moderate severity
   - "My eyes feel droopy" → fatigue: moderate severity
   
❌ DO NOT: Subjective interpretations or emotion labels
   - "You sound stressed" - NO
   - "You seem angry" - NO
   - "You're masking" - NO

GENTLE INQUIRY GENERATION:
- If high-severity observations detected → generate gentle inquiry
- "I noticed you mentioned harsh lighting. How is that affecting your energy?"
- "How is that noisy environment working for your focus?"
- Always mark skipAllowed: true
- Tone must be "curious" never "interrogating"

DECISION MATRIX:
- If user mentions objective environmental factors → Extract and acknowledge
- If user expresses internal state → Validate without labeling
- If discrepancy between stated mood and text content → Ask gently
`;
```

---

### 5. GentleInquiry Component Never Used - MISSING ✅

**Problem:**
- GentleInquiry component created
- But never rendered anywhere
- No triggering mechanism
- No response handling

**Required Fix:**

```typescript
// 1. Add state for gentle inquiry
const [gentleInquiry, setGentleInquiry] = useState<GentleInquiry | null>(null);

// 2. Update handleTranscript to check for gentle inquiries
const handleTranscript = (
  transcript: string, 
  audioBlob?: Blob, 
  analysis?: AudioAnalysisResult
) => {
  setText(transcript);
  
  // Check if analysis includes gentle inquiry
  if (analysis?.gentleInquiry) {
    setGentleInquiry(analysis.gentleInquiry);
  }
};

// 3. Add in handleSubmit from geminiService
const handleSubmit = async () => {
  // ... existing parsing ...
  
  // Check if parsed response includes gentle inquiry
  if (parsed.gentleInquiry) {
    setGentleInquiry(parsed.gentleInquiry);
    return; // Don't submit yet, wait for user response
  }
  
  // ... rest of submission
};

// 4. Render GentleInquiry when triggered
{gentleInquiry && (
  <GentleInquiry
    inquiry={gentleInquiry}
    onResponse={(response) => {
      if (response === 'skip') {
        setGentleInquiry(null);
        handleSubmit(); // Continue with submission
      } else {
        // Handle yes/no response
        setGentleInquiry(null);
        // Optionally append response to text
        setText(text + ` (User noted: ${response})`);
      }
    }}
  />
)}
```

---

### 6. Informed Capacity Calibration Not Implemented - MISSING ✅

**Problem:**
- Capacity sliders are hardcoded defaults (7, 5, 4, 6, 5, 6, 5)
- No pre-population from objective observations
- No "Informed by X" context
- Users don't know WHY sliders are suggested

**Required Fix:**

```typescript
// 1. Calculate suggested values from observations
const getSuggestedCapacity = (): Partial<CapacityProfile> => {
  const suggestions: Partial<CapacityProfile> = {};
  
  if (voiceAnalysis) {
    // High noise → lower sensory capacity
    const highNoise = voiceAnalysis.observations.some(
      obs => obs.category === 'noise' && obs.severity === 'high'
    );
    if (highNoise) suggestions.sensory = 3;
    
    // Fast speech → lower executive capacity (may be rushed)
    const fastPace = voiceAnalysis.observations.some(
      obs => obs.category === 'speech-pace' && obs.severity === 'high'
    );
    if (fastPace) suggestions.executive = 4;
  }
  
  if (photoAnalysis) {
    // Harsh lighting → lower sensory capacity
    if (photoAnalysis.lightingSeverity === 'high') {
      suggestions.sensory = 3;
    }
    
    // Tension indicators → lower emotional capacity
    const highTension = photoAnalysis.observations.some(
      obs => obs.category === 'tension' && obs.value.includes('high')
    );
    if (highTension) suggestions.emotional = 4;
  }
  
  return suggestions;
};

// 2. Initialize capacity with suggestions
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

// 3. Display "Informed by" context
const getInformedByContext = (field: keyof CapacityProfile): string | null => {
  if (field === 'sensory' && suggestedCapacity.sensory !== undefined) {
    return `Informed by ${voiceAnalysis ? 'noise level' : 'lighting condition'}`;
  }
  if (field === 'executive' && suggestedCapacity.executive !== undefined) {
    return 'Informed by speech pace';
  }
  return null;
};

// 4. Update CapacitySlider to show context
const CapacitySlider = ({ label, icon: Icon, value, field, color }: any) => {
  const informedBy = getInformedByContext(field);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Icon className={styles.text} size={14} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold">{value}/10</span>
      </div>
      
      {/* ✅ Add informed by badge */}
      {informedBy && (
        <div className="mb-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <Info size={10} />
          {informedBy}
        </div>
      )}
      
      {/* ... rest of slider */}
    </div>
  );
};
```

---

## Medium Priority Gaps

### 7. No Integration with StateCheckWizard

**Problem:**
- StateCheckWizard exists as separate component
- But not connected to journal flow
- Bio-Mirror analysis happens in isolation
- No sharing of data between components

**Required Fix:**
- Either integrate StateCheckWizard into journal flow
- Or ensure both use shared state/store
- Implement data passing between components

### 8. Missing Error Handling for Failed Analyses

**Problem:**
- If voice analysis fails, no fallback
- If photo analysis fails, no fallback
- User gets stuck in observations view

**Required Fix:**
- Add error states
- Allow manual override
- Provide "Skip to text" option

### 9. No Progress Tracking Through Flow

**Problem:**
- Users don't know where they are in the process
- No progress indicator
- Unclear how many steps remain

**Required Fix:**
- Add progress bar
- Show "Step 1 of 3" style indicators
- Clear "Back" and "Continue" buttons

---

## Low Priority Gaps

### 10. No Accessibility Testing

**Concern:**
- Voice input needs keyboard alternatives
- Photo capture needs screen reader support
- Sliders need proper ARIA labels

**Recommendation:**
- Add accessibility audit
- Test with screen readers
- Ensure keyboard navigation

### 11. No Loading States for Long Operations

**Concern:**
- Voice analysis takes 1-2 seconds
- Photo analysis takes 2-3 seconds
- No visual feedback during wait

**Recommendation:**
- Add loading spinners
- Show "Processing..." messages
- Animated progress indicators

### 12. No Undo/Redo for Capacity Sliders

**Concern:**
- Users might accidentally change slider
- No way to reset to suggested value
- Hard to recover from mistakes

**Recommendation:**
- Add "Reset" button
- Show previous value
- Allow cancel changes

---

## Testing Gaps

### Unit Tests - Missing

- No tests for QuickCaptureMenu
- No tests for RecordVoiceButton enhancements
- No tests for VoiceObservations
- No tests for PhotoObservations
- No tests for GentleInquiry

### Integration Tests - Missing

- No tests for complete journal flow
- No tests for multi-modal entry
- No tests for data persistence
- No tests for error handling

### E2E Tests - Missing

- No user journey tests
- No accessibility tests
- No performance tests

---

## AI Prompt Accuracy Issues

### geminiService.ts Concerns

**Issue 1: System Instruction Still Subjective**
```
Current: "You are Mae... warmth of supportive friend..."
Problem: Still frames as "friend" which can lead to subjective responses
Should: Frame as objective observation tool
```

**Issue 2: No Objectivity Emphasis**
```
Current: Detects masking, sensory load, etc. through linguistic markers
Problem: Can lead to subjective interpretations like "You seem to be masking"
Should: Extract objective facts only, never make subjective claims
```

**Issue 3: Strategy Generation Still Prescriptive**
```
Current: "Generate 3 specific, micro-strategies..."
Problem: May feel like Mae knows what user needs
Should: Suggest options, always make optional
```

### geminiVisionService.ts Concerns

**Issue 1: FACS Terminology May Be Too Technical**
```
Current: Uses terms like "AU4", "AU43"
Problem: Users may not understand Action Unit numbers
Should: Use plain language with FACS in parentheses
```

**Issue 2: Lighting Detection May Not Capture Nuance**
```
Current: Binary classification (fluorescent/natural/low)
Problem: Doesn't capture mixed lighting, flickering, etc.
Should: Add more granular categories
```

---

## Security & Privacy Gaps

### 1. No Explicit Consent for Biometric Data

**Problem:**
- Photos uploaded without explicit consent
- Voice recordings processed automatically
- No opt-out for biometric analysis

**Fix Required:**
- Add consent checkboxes
- Explain what data is collected
- Provide clear opt-out option

### 2. No Data Retention Policy Implemented

**Problem:**
- Specifications mention auto-deletion
- But code doesn't implement
- Data accumulates indefinitely

**Fix Required:**
- Implement TTL for biometric data
- Auto-delete after configured period
- Provide manual delete button

---

## Performance Gaps

### 1. No Caching for Repeated Analyses

**Problem:**
- Same audio analyzed multiple times
- Same photo analyzed multiple times
- Wastes API quota

**Fix Required:**
- Cache analysis results by hash
- Check cache before API call
- Implement cache invalidation

### 2. No Lazy Loading for Components

**Problem:**
- All components loaded at startup
- Increases bundle size
- Slower initial load

**Fix Required:**
- Lazy load heavy components
- Dynamic imports
- Code splitting

---

## Summary

### Critical (Must Fix Before Launch)
1. ✅ QuickCaptureMenu integration
2. ✅ RecordVoiceButton integration with observations display
3. ✅ Objective observations storage in HealthEntry
4. ✅ geminiService schema and prompt updates
5. ✅ GentleInquiry component integration
6. ✅ Informed capacity calibration

### High Priority
7. StateCheckWizard integration
8. Error handling for failed analyses
9. Progress tracking

### Medium Priority
10. Accessibility testing
11. Loading states
12. Undo/redo for sliders

### Low Priority
13-15. Testing, security, performance improvements

---

## Recommended Action Plan

### Immediate (Next Session)
1. Fix RecordVoiceButton integration in JournalEntry.tsx
2. Add QuickCaptureMenu to journal flow
3. Implement observation display (VoiceObservations/PhotoObservations)
4. Update geminiService schema to include objective observations

### Short Term (This Week)
5. Implement storage of objective observations in HealthEntry
6. Add GentleInquiry triggers and display
7. Implement informed capacity calibration
8. Add error handling and fallbacks

### Medium Term (Next Sprint)
9. Integrate StateCheckWizard with journal flow
10. Add progress indicators
11. Implement accessibility features
12. Add loading states

### Long Term (Future Sprints)
13. Write comprehensive tests
14. Implement caching
15. Add data retention policies

---

## Conclusion

The component implementation in Phases 1-3 is **technically complete** but **functionally disconnected**. The pieces exist but don't work together as intended.

**Good News**: All the individual components are well-designed and follow the psychological safety principles.

**Challenge**: They need to be integrated into a cohesive user flow.

**Solution**: Focus on connecting the pieces rather than building new features.

**Estimated Effort**: 4-6 hours of focused integration work to address all critical gaps.

**Risk**: Without fixing these gaps, the enhanced journal system will not provide any value over the existing text-only approach.

---

**Next Step**: Begin integration work starting with RecordVoiceButton and QuickCaptureMenu.
