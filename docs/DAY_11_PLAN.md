# Day 11 Plan: Gentle Inquiry Integration

**Date**: December 26, 2025  
**Status**: Ready to Start  
**Estimated Time**: 3 hours  
**Focus**: Display and interact with AI-generated gentle inquiries

---

## Current State Analysis

### ✅ What's Already Complete (Day 9)

1. **Type System**
   - `GentleInquiry` interface defined in `src/types.ts`
   - Properties: id, basedOn, question, tone, skipAllowed, priority

2. **AI Integration**
   - Schema includes `gentleInquiry` field
   - System instruction defines when to generate inquiries
   - AI can generate inquiries for high-severity observations

3. **Component Available**
   - `GentleInquiry.tsx` component exists
   - Displays question and allows response/skip
   - Styled appropriately

### ❌ What's Missing (Day 11 Gaps)

1. **Inquiry Not Extracted from AI**
   - `parseJournalEntry()` returns `ParsedResponse`
   - `gentleInquiry` field exists but not used
   - Not displayed to user

2. **No Inquiry State Management**
   - No state to track if inquiry should show
   - No state to track inquiry response
   - No state to track if inquiry was skipped

3. **No Integration into Journal Flow**
   - Inquiry not shown after AI analysis
   - Response not integrated into journal entry
   - Skip not integrated

---

## Day 11 Tasks

### Task 1: Extract Inquiry from ParsedResponse (30 minutes)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Store gentle inquiry from AI response

**Implementation**:
```typescript
const handleSubmit = async () => {
  // ... existing code ...
  
  const parsed: ParsedResponse = await parseJournalEntry(text, capacity);
  
  // ✅ Store gentle inquiry if provided
  const gentleInquiry = parsed.gentleInquiry || null;
  
  // ... rest of submission logic ...
};
```

**Acceptance Criteria**:
- [ ] Extract gentleInquiry from parsed response
- [ ] Handle null case gracefully
- [ ] Store in variable for display
- [ ] No TypeScript errors

---

### Task 2: Add Inquiry State Management (30 minutes)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Track inquiry display and response

**Implementation**:
```typescript
// Add to component state
const [gentleInquiry, setGentleInquiry] = useState<any>(null);
const [inquiryResponse, setInquiryResponse] = useState<string>("");
const [showInquiry, setShowInquiry] = useState(false);

const handleInquirySubmit = () => {
  if (inquiryResponse.trim()) {
    // Add response to journal entry
    // Then close inquiry
    setShowInquiry(false);
    setInquiryResponse("");
  }
};

const handleInquirySkip = () => {
  // Just close inquiry without response
  setShowInquiry(false);
  setInquiryResponse("");
};
```

**Acceptance Criteria**:
- [ ] gentleInquiry state added
- [ ] inquiryResponse state added
- [ ] showInquiry state added
- [ ] handleInquirySubmit implemented
- [ ] handleInquirySkip implemented

---

### Task 3: Display Inquiry After Analysis (1 hour)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Show inquiry overlay after AI completes analysis

**Implementation**:
```typescript
// In handleSubmit, after AI analysis
if (parsed.gentleInquiry) {
  setGentleInquiry(parsed.gentleInquiry);
  setShowInquiry(true);
}

// In JSX, after AILoadingState
{showInquiry && gentleInquiry && (
  <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 animate-fadeIn">
    <GentleInquiry
      inquiry={gentleInquiry}
      onResponse={setInquiryResponse}
      onSubmit={handleInquirySubmit}
      onSkip={handleInquirySkip}
    />
  </div>
)}
```

**Placement**:
- Show after strategy feedback
- Show before allowing new entry
- Or show as modal overlay

**Acceptance Criteria**:
- [ ] Inquiry displays after AI analysis
- [ ] Only shows if gentleInquiry exists
- [ ] Positioned correctly in UI
- [ ] Animated in smoothly

---

### Task 4: Integrate Inquiry Response (30 minutes)

**File**: `src/components/JournalEntry.tsx`

**Goal**: Add inquiry response to journal entry

**Implementation**:
```typescript
const newEntry: HealthEntry = {
  // ... existing fields ...
  
  // ✅ Add inquiry response if provided
  notes: inquiryResponse.trim() 
    ? `${parsed.summary}\n\nInquiry Response: ${inquiryResponse}`
    : parsed.summary,
  
  // ... rest of fields ...
};
```

Or store in separate field:
```typescript
// Add to HealthEntry type (optional)
inquiryResponse?: string;
```

**Acceptance Criteria**:
- [ ] Inquiry response added to entry
- [ ] Integrated with notes or separate field
- [ ] Only added if user responded
- [ ] Not added if user skipped

---

### Task 5: Test Inquiry Flow (30 minutes)

**File**: Manual testing

**Goal**: Verify complete inquiry interaction

**Test Scenarios**:

1. **Inquiry Generated and User Responds**:
   - User submits journal entry
   - AI generates gentle inquiry
   - Inquiry displays
   - User types response
   - User clicks Submit
   - Inquiry closes
   - Entry saved with response

2. **Inquiry Generated and User Skips**:
   - User submits journal entry
   - AI generates gentle inquiry
   - Inquiry displays
   - User clicks Skip
   - Inquiry closes
   - Entry saved without response

3. **No Inquiry Generated**:
   - User submits journal entry
   - AI doesn't generate inquiry
   - No inquiry displayed
   - Entry saved normally

4. **Multiple Entries**:
   - User submits first entry with inquiry
   - Responds or skips
   - Submits second entry
   - Each entry independent

**Acceptance Criteria**:
- [ ] All test scenarios work correctly
- [ ] No state pollution between entries
- [ ] Entry saved correctly in all cases
- [ ] No memory leaks

---

## Success Criteria

### Must-Have
- [ ] GentleInquiry component integrated
- [ ] Inquiry extracted from AI response
- [ ] Inquiry displayed after analysis
- [ ] User can respond to inquiry
- [ ] User can skip inquiry
- [ ] Response integrated into entry
- [ ] TypeScript compiles without errors

### Nice-to-Have
- [ ] Inquiry displays as modal/overlay
- [ ] Inquiry has smooth animations
- [ ] Tone indicator displayed (curious/supportive)
- [ ] Skip button clearly labeled
- [ ] Response preview before submission

---

## Design Decisions

### Decision 1: Inquiry Display Position

**Options**:
1. In-place with other content
2. Modal/overlay
3. Separate section below strategies

**Selection**: Modal/overlay
- Focuses attention
- Doesn't clutter UI
- Clear completion action
- Matches pattern of VoiceObservations

### Decision 2: Response Storage

**Options**:
1. Append to notes field
2. Separate inquiryResponse field
3. Not stored, just displayed

**Selection**: Separate field (optional)
- Preserves original notes
- Allows analysis of inquiry responses
- Optional field for backward compatibility
- Can analyze inquiry effectiveness later

### Decision 3: Inquiry Triggers

**When to show**:
- Only if AI generates inquiry
- Only for high-priority inquiries
- Only if not previously shown

**Priority logic**:
- High: Show immediately
- Medium: Show with "Show Inquiry" button
- Low: Don't show, just store

---

## Risk Mitigation

### Risk 1: Inquiry Annoying Users

**Issue**: Too many inquiries become bothersome

**Mitigation**:
- AI only generates for high-severity observations
- Priority system (high/medium/low)
- User can always skip
- Skip button prominent

### Risk 2: State Pollution

**Issue**: Inquiry state persists between entries

**Mitigation**:
- Reset all inquiry state after submission
- Clear response on skip
- Clear response on submit
- useEffect cleanup

### Risk 3: Response Loss

**Issue**: User responds but response not saved

**Mitigation**:
- Clear submit action
- Visual feedback on submit
- Show preview before closing
- Error handling on save

---

## Order of Operations

1. **Step 1**: Extract inquiry from ParsedResponse (30 min)
2. **Step 2**: Add inquiry state management (30 min)
3. **Step 3**: Display inquiry component (1 hour)
4. **Step 4**: Integrate response into entry (30 min)
5. **Step 5**: Test all scenarios (30 min)

**Total**: 3 hours

---

## Next Steps After Day 11

Day 12 will focus on **Testing & Refinement**:
- End-to-end testing of all features
- Bug fixes and edge cases
- Performance optimization
- User feedback integration

---

## Conclusion

Day 11 adds a conversational element to journaling by displaying gentle inquiries from AI. This makes journaling more interactive while maintaining user control through skip functionality.

**Key Success Factor**: Inquiries are genuinely helpful, not intrusive.

**Ready to Start**: Yes, GentleInquiry component exists, AI can generate inquiries, state management needed.
