# Biofeedback Camera - Quick Reference Guide

## File Structure

```
src/components/
├── StateCheckWizard.tsx         # Main orchestrator (250 lines)
├── BiofeedbackCameraModal.tsx    # New: Full-screen camera modal (200 lines)
├── StateCheckResults.tsx         # Results display (unchanged)
└── StateCheckCamera.tsx          # DEPRECATED - replaced by modal
```

## Key Components

### 1. StateCheckWizard
**Purpose**: Orchestrates the biofeedback flow  
**Props**: None  
**State**:
```typescript
step: 'INTRO' | 'CAMERA' | 'ANALYZING' | 'RESULTS' | 'ERROR'
isCameraOpen: boolean
imageSrc: string | null
analysis: FacialAnalysis | null
```

### 2. BiofeedbackCameraModal
**Purpose**: Full-screen camera interface  
**Props**:
```typescript
isOpen: boolean
onCapture: (imageSrc: string) => void
onCancel: () => void
```

**Key Features**:
- Auto-starts camera on mount
- Shows oval face frame
- Single-tap capture
- Flash effect on capture
- Preview image display

## User Flow

```
1. User sees INTRO screen with "Open Bio-Mirror" button
2. Click button → Full-screen camera modal appears
3. User takes photo → Immediate flash + preview
4. Auto-transition to ANALYZING → Progress bar shows stages
5. Analysis completes → Auto-transition to RESULTS
6. User reviews results → Click to return to INTRO
```

## Common Modifications

### Change Camera Frame Style
Edit `BiofeedbackCameraModal.tsx`:
```typescript
// Oval shape (current)
<div className="rounded-full w-[90vw] h-[67.5vw] ...">

// Rectangle shape
<div className="rounded-2xl w-[90vw] h-[67.5vw] ...">

// Circle shape
<div className="rounded-full w-[70vw] h-[70vw] ...">
```

### Modify Progress Stages
Edit `StateCheckWizard.tsx` in `handleCapture`:
```typescript
const stages = [
  'Analyzing facial features...',
  'Detecting jaw tension...',
  'Measuring eye fatigue...',
  'Analyzing micro-expressions...',
  'Generating insights...'
];
```

### Change Analysis Timeout
Edit `StateCheckWizard.tsx`:
```typescript
// Current: 30 seconds default
const [estimatedTime, setEstimatedTime] = useState(30);

// Change to 45 seconds
const [estimatedTime, setEstimatedTime] = useState(45);
```

## Troubleshooting

### Camera Not Starting
1. Check browser permissions
2. Verify HTTPS (required for camera access)
3. Check console for `navigator.mediaDevices` errors
4. Ensure `getUserMedia` is supported

### Analysis Failing
1. Check `VITE_GEMINI_API_KEY` is set
2. Verify network connectivity
3. Check Circuit Breaker state (should be CLOSED)
4. Review error messages in console

### Layout Issues
1. Verify Tailwind CSS is loaded
2. Check responsive breakpoints
3. Ensure viewport meta tag is set
4. Test in different screen sizes

## Performance Tips

1. **Lazy Load Camera Modal**
```typescript
const BiofeedbackCameraModal = React.lazy(() => 
  import('./BiofeedbackCameraModal')
);
```

2. **Optimize Image Quality**
```typescript
const quality = 0.8; // Adjust 0.7-0.9
const maxSize = 2 * 1024 * 1024; // 2MB
```

3. **Cleanup Resources**
```typescript
useEffect(() => {
  return () => {
    if (imageSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
  };
}, [imageSrc]);
```

## Testing Checklist

### Manual Testing
- [ ] Camera opens centered
- [ ] No scrolling required
- [ ] Capture button works
- [ ] Flash effect visible
- [ ] Preview image displays
- [ ] Progress bar animates
- [ ] Results appear correctly
- [ ] Error states show
- [ ] Retry button works
- [ ] Mobile responsive
- [ ] Desktop responsive

### Automated Testing
```bash
# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build
```

## Deployment Notes

1. **Environment Variables Required**:
   - `VITE_GEMINI_API_KEY`
   - `VITE_API_URL`

2. **HTTPS Required**:
   - Camera access requires HTTPS in production
   - localhost works without HTTPS for development

3. **Browser Support**:
   - Chrome 90+, Safari 14+, Firefox 88+
   - Mobile browsers (iOS Safari, Chrome Mobile)

## Related Documentation

- [Full Improvements Document](./BIOFEEDBACK_CAMERA_IMPROVEMENTS.md)
- [API Reference](../specifications/API_REFERENCE.md)
- [UI/UX Guidelines](../specifications/UI_UX_GUIDELINES.md)

## Support

For issues or questions:
1. Check console for error messages
2. Review browser compatibility
3. Verify environment configuration
4. Test in different browsers/devices