# Maeple E2E Tests with Playwright

This directory contains end-to-end tests for the Maeple application using Playwright. These tests are designed to verify camera and video functionality that cannot be properly tested in the jsdom environment used by Vitest.

## Test Structure

```
tests/e2e/
├── README.md                      # This file
├── bio-mirror.spec.ts             # Bio-Mirror flow tests
├── useCameraCapture.spec.ts       # useCameraCapture hook tests
└── StateCheckCamera.spec.ts       # StateCheckCamera component tests
```

## Why Playwright?

The Maeple application uses the MediaStream API for camera access, which is not available in jsdom. While we can mock these APIs in unit tests, the actual behavior can only be verified in a real browser environment.

### What These Tests Cover

1. **bio-mirror.spec.ts** - End-to-end user flows through the Bio-Mirror feature
   - Camera initialization and permissions
   - StateCheckWizard navigation
   - Image capture and analysis
   - Mobile responsiveness

2. **useCameraCapture.spec.ts** - Hook behavior with real MediaStream API
   - Camera initialization with different configurations
   - Stream lifecycle management
   - Error handling and retry logic
   - Camera switching between front/back
   - Image capture from video stream

3. **StateCheckCamera.spec.ts** - Component behavior in browser
   - UI rendering and interactions
   - Camera state management
   - Image processing and compression
   - Accessibility features
   - Performance metrics

## Running Tests

### Prerequisites

Ensure Playwright browsers are installed:

```bash
npx playwright install
```

### Run All E2E Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test bio-mirror.spec.ts
```

### Run in UI Mode (for debugging)

```bash
npx playwright test --ui
```

### Run in Headed Mode (see browser)

```bash
npx playwright test --headed
```

### Run on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Configuration

The Playwright configuration is in [`playwright.config.ts`](../../playwright.config.ts):

- **Base URL**: `http://localhost:5173` (Vite dev server)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Camera Permissions**: Automatically granted for all tests
- **Timeouts**: 15s action timeout, 30s navigation timeout
- **Workers**: 1 on CI (sequential), parallel locally

## Test Environment

### Camera Permissions

Tests automatically grant camera permissions using Playwright's context API:

```typescript
await context.grantPermissions(['camera']);
```

### Mocking getUserMedia

For error scenarios, we override `navigator.mediaDevices.getUserMedia`:

```typescript
await page.evaluate(() => {
  navigator.mediaDevices.getUserMedia = async () => {
    throw new DOMException('Camera not found', 'NotFoundError');
  };
});
```

### Dev Server

Playwright automatically starts the Vite dev server before running tests:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
}
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/state-check');
  });

  test('should do something', async ({ page }) => {
    // Test code here
  });
});
```

### Common Patterns

**Wait for video element:**
```typescript
const video = page.locator('video').first();
await expect(video).toBeAttached({ timeout: 10000 });
```

**Wait for video ready state:**
```typescript
await video.evaluate((el: HTMLVideoElement) => {
  return new Promise<void>((resolve) => {
    if (el.readyState >= 2) resolve();
    else el.addEventListener('loadeddata', () => resolve(), { once: true });
  });
});
```

**Check for stream:**
```typescript
const hasStream = await video.evaluate((el: HTMLVideoElement) => {
  return el.srcObject !== null;
});
expect(hasStream).toBe(true);
```

## Debugging Failed Tests

1. **View Trace**: Open `playwright-report/index.html` after test run
2. **Screenshots**: Automatically captured on failure in `test-results/`
3. **Videos**: Recorded on first retry in `test-results/`
4. **Console Logs**: View with `npx playwright test --reporter=list`

## CI/CD Integration

Tests are configured to run in CI mode with:
- Single worker (sequential execution)
- 2 retries on failure
- Screenshots and traces on failure

## Comparison with Unit Tests

| Aspect | Unit Tests (Vitest) | E2E Tests (Playwright) |
|--------|---------------------|------------------------|
| Environment | jsdom | Real browser (Chromium/Firefox/WebKit) |
| Camera API | Mocked | Real MediaStream API |
| Speed | Fast (~100ms/test) | Slower (~5s/test) |
| Coverage | Component logic | Full user flows |
| Use Case | Business logic, data flow | Camera, video, user interactions |

## Known Limitations

1. **Headless Mode**: Some camera features may behave differently in headless mode
2. **CI Environment**: Camera access may be limited in containerized CI environments
3. **Mobile Testing**: Device-specific camera features require real devices

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [MediaStream API](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
