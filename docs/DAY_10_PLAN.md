# Day 10 Plan: Informed Capacity Calibration

**Date**: December 26, 2025  
**Status**: Ready to Start  
**Estimated Time**: 5 hours  
**Focus**: Use objective observations to suggest capacity values

---

## Current State Analysis

### ✅ What's Already Complete (Day 9)

1. **Type System**
   - `ParsedResponse` includes `objectiveObservations`
   - `HealthEntry` includes `objectiveObservations`
   - `ObjectiveObservation` interface defined

2. **AI Integration**
   - Schema includes `objectiveObservations` and `gentleInquiry`
   - System instruction emphasizes objectivity
   - AI can extract observations from text

3. **Data Persistence**
   - `handleSubmit` collects observations from voice, photo, and text
   - Observations stored in `HealthEntry.objectiveObservations`
   - All observation types persisted to localStorage

### ❌ What's Missing (Day 10 Gaps)

1. **Capacity Suggestions**
   - Capacity values are static defaults (focus: 7, social: 5, etc.)
   - No use of observations to inform capacity
   - User must manually set all values

2. **Context Display**
   - No indication of why a capacity value might be suggested
   - User doesn't know if observations informed the suggestion
   - No visual feedback linking observations to capacity

3. **Suggestion Override**
   - Can't distinguish between suggested and manual values
   - No way to acknowledge or reject suggestions
   - Missing "Suggested" indicator

---

## Day 10 Tasks

### Task 1: Implement getSuggestedCapacity (1.5 hours)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Analyze observations and return suggested capacity values

**Implementation**:
```typescript
const getSuggestedCapacity = (): Partial<CapacityProfile> => {
  const suggestions: Partial<CapacityProfile> = {};
  
  // Voice analysis suggestions
  if (voiceObservations) {
    // High noise → Lower sensory, focus
    const highNoise = voiceObservations.observations.some(
      obs => obs.category === 'noise' && obs.severity === 'high'
    );
    if (highNoise) {
      suggestions.sensory = 3;
      suggestions.focus = 4;
    }
    
    // Moderate noise → Lower sensory
    const moderateNoise = voiceObservations.observations.some(
      obs => obs.category === 'noise' && obs.severity === 'moderate'
    );
    if (moderateNoise) {
      suggestions.sensory = 5;
    }
    
    // Fast speech pace → Lower executive, social
    const fastPace = voiceObservations.observations.some(
      obs => obs.category === 'speech-pace' && obs.value.includes('fast')
    );
    if (fastPace) {
      suggestions.executive = 4;
      suggestions.social = 4;
    }
    
    // Tension in tone → Lower emotional
    const highTension = voiceObservations.observations.some(
      obs => obs.category === 'tone' && obs.severity === 'high'
    );
    if (highTension) {
      suggestions.emotional = 4;
    }
  }
  
  // Photo analysis suggestions
  if (photoObservations) {
    // High lighting severity → Lower sensory, emotional
    if (photoObservations.lightingSeverity === 'high') {
      suggestions.sensory = 3;
      suggestions.emotional = 4;
    }
    
    // Moderate lighting → Lower sensory
    if (photoObservations.lightingSeverity === 'moderate') {
      suggestions.sensory = 5;
    }
    
    // Tension in face → Lower emotional, executive
    const highTension = photoObservations.observations.some(
      obs => obs.category === 'tension' && obs.value.includes('high')
    );
    if (highTension) {
      suggestions.emotional = 4;
      suggestions.executive = 4;
    }
    
    // Fatigue indicators → Lower physical, focus
    const fatigueIndicators = photoObservations.observations.some(
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

**Acceptance Criteria**:
- [ ] Analyzes voice observations
- [ ] Analyzes photo observations
- [ ] Returns partial capacity profile
- [ ] Logic is reasonable and matches neuro-affirming principles

---

### Task 2: Initialize Capacity with Suggestions (30 minutes)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Use suggestions as starting point for capacity

**Implementation**:
```typescript
// Calculate suggested values
const suggestedCapacity = getSuggestedCapacity();

// Initialize capacity with suggestions, fallback to defaults
const [capacity, setCapacity] = useState<CapacityProfile>({
  focus: suggestedCapacity.focus || 7,
  social: suggestedCapacity.social || 5,
  structure: suggestedCapacity.structure || 4,
  emotional: suggestedCapacity.emotional || 6,
  physical: suggestedCapacity.physical || 5,
  sensory: suggestedCapacity.sensory || 6,
  executive: suggestedCapacity.executive || 5,
});

// Store suggestions for display
const [suggestedCapacity, setSuggestedCapacity] = useState<Partial<CapacityProfile>>({});
```

**Acceptance Criteria**:
- [ ] Capacity initialized with suggestions
- [ ] Fallback to defaults if no suggestions
- [ ] Suggestions stored for comparison
- [ ] No TypeScript errors

---

### Task 3: Implement getInformedByContext (1 hour)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Return explanation of why capacity value is suggested

**Implementation**:
```typescript
const getInformedByContext = (field: keyof CapacityProfile): string | null => {
  const reasons: string[] = [];
  
  // Voice analysis reasons
  if (voiceObservations) {
    if (field === 'sensory') {
      const noiseObs = voiceObservations.observations.find(obs => obs.category === 'noise');
      if (noiseObs?.severity === 'high') reasons.push('high noise level detected');
      else if (noiseObs?.severity === 'moderate') reasons.push('moderate noise detected');
    }
    if (field === 'executive') {
      const paceObs = voiceObservations.observations.find(obs => obs.category === 'speech-pace');
      if (paceObs) reasons.push('speech pace analysis');
    }
    if (field === 'emotional') {
      const toneObs = voiceObservations.observations.find(obs => obs.category === 'tone');
      if (toneObs?.severity === 'high') reasons.push('tension detected in voice tone');
    }
  }
  
  // Photo analysis reasons
  if (photoObservations) {
    if (field === 'sensory') {
      reasons.push('lighting conditions observed');
    }
    if (field === 'emotional') {
      const tensionObs = photoObservations.observations.find(obs => obs.category === 'tension');
      if (tensionObs) reasons.push('facial tension detected');
    }
    if (field === 'physical') {
      const fatigueObs = photoObservations.observations.find(obs => obs.category === 'fatigue');
      if (fatigueObs) reasons.push('fatigue indicators detected');
    }
  }
  
  return reasons.length > 0 ? `Informed by: ${reasons.join(', ')}` : null;
};
```

**Acceptance Criteria**:
- [ ] Returns context string or null
- [ ] Explains why slider is set
- [ ] Multiple reasons concatenated
- [ ] Friendly, non-judgmental language

---

### Task 4: Update CapacitySlider to Show Context (1.5 hours)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Display "Suggested" indicator and "Informed by" badge

**Implementation**:
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
          {/* Suggested indicator */}
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
      
      {/* Informed by badge */}
      {informedBy && (
        <div className="mb-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/50 rounded-full">
          <span>💡</span>
          <span>{informedBy}</span>
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
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
    </div>
  );
};
```

**Update Usage**:
```typescript
<CapacitySlider
  label="Deep Focus"
  icon={Brain}
  value={capacity.focus}
  field="focus"
  color="blue"
  suggested={suggestedCapacity.focus}
/>
<CapacitySlider
  label="Emotional Processing"
  icon={Heart}
  value={capacity.emotional}
  field="emotional"
  color="pink"
  suggested={suggestedCapacity.emotional}
/>
<CapacitySlider
  label="Social Battery"
  icon={Users}
  value={capacity.social}
  field="social"
  color="purple"
  suggested={suggestedCapacity.social}
/>
<CapacitySlider
  label="Executive / Decisions"
  icon={Zap}
  value={capacity.executive}
  field="executive"
  color="cyan"
  suggested={suggestedCapacity.executive}
/>
```

**Acceptance Criteria**:
- [ ] "Suggested" indicator shows
- [ ] "Informed by" badge displays
- [ ] Styling matches design
- [ ] Accessibility maintained
- [ ] User can override suggestions

---

### Task 5: Reset Suggestions on New Entry (30 minutes)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Recalculate suggestions when starting new entry

**Implementation**:
```typescript
// After handleSubmit, reset capacity with new suggestions
const handleSubmit = async () => {
  // ... existing submission logic ...
  
  onEntryAdded(newEntry);
  setText("");
  
  // ✅ Reset to defaults (not suggestions)
  setCapacity({
    focus: 7,
    social: 5,
    structure: 4,
    emotional: 6,
    physical: 5,
    sensory: 6,
    executive: 5,
  });
  
  // ✅ Clear suggestions
  setVoiceObservations(null);
  setPhotoObservations(null);
  setSuggestedCapacity({});
};
```

**Acceptance Criteria**:
- [ ] Capacity resets to defaults on submit
- [ ] Suggestions cleared on submit
- [ ] Next entry starts fresh

---

## Success Criteria

### Must-Have
- [ ] `getSuggestedCapacity` analyzes observations
- [ ] Capacity initialized with suggestions
- [ ] `getInformedByContext` returns explanations
- [ ] CapacitySlider shows "Suggested" indicator
- [ ] CapacitySlider shows "Informed by" badge
- [ ] User can override suggestions
- [ ] TypeScript compiles without errors

### Nice-to-Have
- [ ] Animation when capacity values are suggested
- [ ] Highlight suggested values in different color
- [ ] "Apply suggestions" button to reset to suggestions
- [ ] Tooltip explaining suggestion logic

---

## Risk Mitigation

### Risk 1: Suggestions Too Aggressive

**Issue**: Observations might suggest very low capacity values

**Mitigation**:
- Use moderate reductions (not extreme)
- Minimum value of 3 (not 1)
- Allow user to override
- Show context for suggestion

### Risk 2: Suggestion Logic Flawed

**Issue**: Heuristics might not match user's actual experience

**Mitigation**:
- Clear visual feedback
- Easy to override
- Suggestions are starting point, not final
- User can adjust after seeing reasons

### Risk 3: Performance Impact

**Issue**: Recalculating suggestions on every render

**Mitigation**:
- Calculate once on observations change
- Use useMemo for suggestions
- Not recalculated on slider change

---

## Order of Operations

1. **Step 1**: Implement `getSuggestedCapacity` (1.5 hours)
2. **Step 2**: Implement `getInformedByContext` (1 hour)
3. **Step 3**: Update capacity initialization (30 minutes)
4. **Step 4**: Update `CapacitySlider` component (1.5 hours)
5. **Step 5**: Add `suggested` prop to all sliders (30 minutes)

**Total**: 5 hours

---

## Next Steps After Day 10

Day 11 will focus on **Gentle Inquiry Integration**:
- Display gentle inquiries from AI
- Allow user to respond or skip
- Integrate into journal flow
- Test interaction patterns

---

## Conclusion

Day 10 makes capacity calibration informed by objective observations, providing users with a starting point based on their actual state rather than requiring manual adjustment.

**Key Success Factor**: Suggestions are helpful but not prescriptive - user always has control.

**Ready to Start**: Yes, all prerequisites complete from Day 9.
