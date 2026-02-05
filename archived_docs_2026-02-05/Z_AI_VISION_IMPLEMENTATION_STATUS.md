# Z.AI Vision Testing Enhancement - Implementation Status

## Overview
Implementation of Z.AI Vision MCP Server integration for enhanced testing capabilities in Maeple.

---

## Phase 1: Foundation - ✅ COMPLETE

### Completed Tasks

#### 1. Directory Structure ✅
- Created `tests/visual/` directory
- Created `tests/visual/baselines/` for baseline screenshots
- Created `tests/visual/current/` for comparison screenshots
- Created `tests/hooks/` for test utilities

#### 2. Error Analyzer Service ✅
**File**: `tests/visual/error-analyzer.ts`

Features:
- Wraps Z.AI Vision's `diagnose_error_screenshot` tool
- Provides automatic error analysis with fix suggestions
- Severity classification (low/medium/high/critical)
- Component-level identification
- Confidence scoring
- Batch analysis support
- Human-readable report generation

#### 3. Error Handler Hook ✅
**File**: `tests/hooks/error-handler.ts`

Features:
- Automatic screenshot capture on test failure
- Console log capture
- Z.AI Vision error analysis integration
- Save analysis to JSON and text reports
- Configurable via environment variables
- Custom test annotations

Environment Variables:
- `ZAI_VISION_ENABLED` - Enable/disable error handler (default: true)
- `ZAI_VISION_ANALYZE` - Enable/disable error analysis (default: true)

#### 4. MCP Client Utility ✅
**File**: `tests/visual/mcp-client.ts`

Features:
- Simplified interface for calling Z.AI Vision tools
- Mock implementation for testing (ready for real MCP integration)
- Singleton pattern for global access
- Convenience functions for common operations
- Timeout and configuration management

Supported Tools:
- `diagnose_error_screenshot`
- `ui_diff_check`
- `image_analysis`
- `understand_technical_diagram`
- `extract_text_from_screenshot`
- `analyze_data_visualization`
- `ui_to_artifact`
- `video_analysis`

#### 5. Baseline Capture Tests ✅
**File**: `tests/visual/baseline-capture.spec.ts`

Features:
- Captures baselines for 8 critical screens:
  1. Landing Page (/)
  2. Dashboard (/dashboard)
  3. New Journal Entry (/journal/new)
  4. Journal List (/journal)
  5. Bio-Mirror (/bio-mirror)
  6. Observations (/observations)
  7. Settings (/settings)
  8. Profile (/profile)

- Includes variants:
  - Dark mode (dashboard-dark.png)
  - Mobile viewport (375x667)
  - Tablet viewport (768x1024)
- Generates baseline manifest with metadata

---

## Usage Instructions

### Running Baseline Capture

```bash
# Capture all baselines
cd /opt/Maeple
npx playwright test tests/visual/baseline-capture.spec.ts

# Capture specific baseline
npx playwright test tests/visual/baseline-capture.spec.ts -g "capture baseline for dashboard"
```

### Enabling Error Analysis

Error analysis is enabled by default. To use:

```typescript
// In your test files, import the error handler
// It's automatically registered and will run on test failures

import { test } from '@playwright/test';

test('my test', async ({ page }) => {
  // If this test fails, Z.AI Vision will automatically:
  // 1. Capture a screenshot
  // 2. Analyze the error
  // 3. Provide fix suggestions
  // 4. Save analysis to test-results/errors/
  
  await page.goto('/dashboard');
  // ... test code
});
```

### Disabling Error Analysis

```typescript
import { disableErrorHandler } from './tests/hooks/error-handler';

test('test without analysis', async ({ page }) => {
  disableErrorHandler();
  // This test won't trigger error analysis
});
```

### Environment Configuration

```bash
# Disable Z.AI Vision globally
export ZAI_VISION_ENABLED=false

# Disable only error analysis (keep screenshot capture)
export ZAI_VISION_ANALYZE=false
```

---

## Files Created

| File | Purpose | Lines |
|------|---------|--------|
| `tests/visual/error-analyzer.ts` | Error analysis service | 220 |
| `tests/hooks/error-handler.ts` | Test error handling hook | 200 |
| `tests/visual/mcp-client.ts` | MCP client utilities | 250 |
| `tests/visual/baseline-capture.spec.ts` | Baseline capture tests | 280 |

**Total**: ~950 lines of code

---

## Next Steps

### Phase 2: Core Visual Tests (Not Started)
- [ ] Implement visual regression tests
- [ ] Create screenshot validation tests
- [ ] Add Bio-Mirror flow validation
- [ ] Implement automated error analysis in tests

### Phase 3: Documentation & Accessibility (Not Started)
- [ ] Create diagram verification tests
- [ ] Add accessibility visual tests
- [ ] Implement text validation tests

### Phase 4: CI/CD Integration (Not Started)
- [ ] Add visual tests to CI pipeline
- [ ] Configure failure thresholds
- [ ] Set up automated reporting

---

## Testing the Implementation

### Manual Testing Steps

1. **Test MCP Client**
```bash
cd /opt/Maeple
node -e "
const { getMCPClient } = require('./tests/visual/mcp-client');
const client = getMCPClient();
console.log('MCP Client config:', client.getConfig());
"
```

2. **Test Baseline Capture**
```bash
# Start dev server
npm run dev

# In another terminal, capture baselines
npx playwright test tests/visual/baseline-capture.spec.ts --headed
```

3. **Test Error Analysis**
```bash
# Create a failing test
# Run tests - errors should trigger Z.AI Vision analysis
npx playwright test --grep="failing test"
```

---

## Known Limitations

1. **MCP Protocol**: Current implementation uses mock responses. Real MCP protocol integration needed for production use.

2. **Network Calls**: Actual tool calls to Z.AI Vision server not yet implemented. Mock responses provide interface testing.

3. **Performance**: Visual tests will be slower than unit tests due to screenshot capture and analysis.

4. **False Positives**: Visual diffing may have false positives. Manual review process needed for failures.

---

## Success Criteria

### Phase 1 Metrics
- ✅ Test directory structure created
- ✅ Error analyzer service implemented
- ✅ Error handler hook created
- ✅ MCP client utility implemented
- ✅ Baseline capture tests written
- ✅ All files compile without errors

### Overall Metrics (Target)
- [ ] Baseline capture completes successfully
- [ ] Error analysis provides actionable suggestions
- [ ] Visual regression tests detect real changes
- [ ] Test suite execution time < 10 minutes
- [ ] False positive rate < 5%

---

## Resources

### Documentation
- [Z_AI_VISION_MCP_SETUP.md](../Z_AI_VISION_MCP_SETUP.md) - Setup guide
- [Z_AI_VISION_TESTING_ENHANCEMENTS.md](../Z_AI_VISION_TESTING_ENHANCEMENTS.md) - Enhancement plan

### Test Files
- `tests/visual/baseline-capture.spec.ts` - Baseline capture tests
- `tests/visual/error-analyzer.ts` - Error analysis service
- `tests/hooks/error-handler.ts` - Error handling hook
- `tests/visual/mcp-client.ts` - MCP client utilities

---

**Status**: Phase 1 Complete ✅  
**Next Phase**: Phase 2 - Core Visual Tests  
**Last Updated**: 2026-02-02  
**Progress**: 25% (1 of 4 phases complete)