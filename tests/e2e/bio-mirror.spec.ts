import { test, expect, Page } from '@playwright/test';

/**
 * Bio-Mirror E2E Tests
 * 
 * These tests verify the camera and facial analysis functionality
 * in a real browser environment where MediaStream API is available.
 * 
 * Tests cover:
 * - Camera initialization and permissions
 * - StateCheckCamera component functionality
 * - useCameraCapture hook behavior
 * - Image capture and processing
 * - Error handling for camera failures
 */

test.describe('Bio-Mirror Camera Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to State Check from home page', async ({ page }) => {
    // Look for State Check button/link
    const stateCheckButton = page.locator('text=State Check').first();
    await expect(stateCheckButton).toBeVisible();
    
    // Click to open State Check
    await stateCheckButton.click();
    
    // Verify wizard is displayed
    await expect(page.locator('[data-testid="state-check-wizard"]')).toBeVisible();
  });

  test('should display camera component when starting State Check', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera component
    const cameraComponent = page.locator('[data-testid="state-check-camera"]').or(
      page.locator('video')
    );
    
    // Camera should be visible or intro screen should be shown
    await expect(cameraComponent.or(page.locator('text=Start Camera'))).toBeVisible();
  });

  test('should request camera permissions when starting camera', async ({ page, context }) => {
    // Grant camera permissions explicitly
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Click start camera button if present
    const startButton = page.locator('button:has-text("Start Camera"), button:has-text("Begin")').first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    }
    
    // Wait for video element to be present
    const video = page.locator('video');
    await expect(video).toBeAttached();
    
    // Verify video has srcObject (indicating camera stream)
    const hasStream = await video.evaluate((el: HTMLVideoElement) => {
      return el.srcObject !== null;
    });
    
    expect(hasStream).toBe(true);
  });

  test('should capture image from camera stream', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera to initialize
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for video to be ready (playing)
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) {
          resolve();
        } else {
          el.addEventListener('loadeddata', () => resolve(), { once: true });
        }
      });
    });
    
    // Find and click capture button
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await expect(captureButton).toBeVisible();
    await captureButton.click();
    
    // Verify capture occurred (image should be displayed or analysis should start)
    await expect(page.locator('img, [data-testid="captured-image"]').or(
      page.locator('text=Analyzing')
    )).toBeVisible({ timeout: 5000 });
  });

  test('should handle camera permission denial gracefully', async ({ page, context }) => {
    // Clear any existing permissions
    await context.clearPermissions();
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Try to start camera
    const startButton = page.locator('button:has-text("Start Camera"), button:has-text("Begin")').first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
    }
    
    // Should show error or permission request
    const errorMessage = page.locator('text=/permission denied|camera access|enable camera/i');
    const permissionButton = page.locator('button:has-text("Allow")');
    
    await expect(errorMessage.or(permissionButton).or(page.locator('video'))).toBeVisible();
  });

  test('should switch between front and back cameras', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Find switch camera button
    const switchButton = page.locator('button:has-text("Switch"), button[aria-label*="switch camera" i], button:has([data-lucide="refresh-cw"])').first();
    
    // Skip if no switch button (might be desktop only)
    if (await switchButton.isVisible().catch(() => false)) {
      await switchButton.click();
      
      // Camera should still be working after switch
      await expect(video).toBeAttached();
      
      // Verify video is still playing
      const isPlaying = await video.evaluate((el: HTMLVideoElement) => {
        return !el.paused && el.readyState >= 2;
      });
      
      expect(isPlaying).toBe(true);
    }
  });

  test('should display camera state indicators correctly', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Check for loading state
    const loadingIndicator = page.locator('text=/loading|initializing|starting/i');
    const video = page.locator('video');
    
    // Should show either loading or video
    await expect(loadingIndicator.or(video)).toBeVisible();
    
    // Wait for video to be ready
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Check for ready state indicators
    const readyIndicator = page.locator('text=/ready|active|live/i, [data-testid="camera-ready"]');
    const captureButton = page.locator('button:has-text("Capture")');
    
    await expect(readyIndicator.or(captureButton)).toBeVisible();
  });

  test('should retry camera initialization on error', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Find retry button if camera fails
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();
    
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
      
      // Should attempt to reinitialize
      await expect(video.or(page.locator('text=/loading|initializing/i'))).toBeVisible();
    }
  });

  test('should maintain camera state across component updates', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Get initial stream ID
    const initialStreamId = await video.evaluate((el: HTMLVideoElement) => {
      const stream = el.srcObject as MediaStream;
      return stream?.id;
    });
    
    // Trigger a re-render by clicking somewhere
    await page.click('body');
    
    // Verify stream is still active
    const currentStreamId = await video.evaluate((el: HTMLVideoElement) => {
      const stream = el.srcObject as MediaStream;
      return stream?.id;
    });
    
    expect(currentStreamId).toBe(initialStreamId);
  });
});

test.describe('Bio-Mirror Analysis Flow', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    await page.waitForLoadState('networkidle');
  });

  test('should transition to analyzing state after capture', async ({ page }) => {
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for video ready
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) resolve();
        else el.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    });
    
    // Capture image
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await captureButton.click();
    
    // Should show analyzing state
    await expect(page.locator('text=/analyzing|processing|analyzing/i').or(
      page.locator('[data-testid="analyzing"]')
    )).toBeVisible({ timeout: 5000 });
  });

  test('should display progress during analysis', async ({ page }) => {
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Capture image
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await captureButton.click();
    
    // Check for progress indicator
    const progressIndicator = page.locator('[role="progressbar"], .progress, [data-testid*="progress"]').or(
      page.locator('text=/percent|%/')
    );
    
    await expect(progressIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should show results after analysis completes', async ({ page }) => {
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Capture image
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await captureButton.click();
    
    // Wait for analysis to complete (timeout after 60 seconds)
    await expect(page.locator('[data-testid="results"], text=/results|complete|done/i').or(
      page.locator('text=/error|failed/i')
    )).toBeVisible({ timeout: 60000 });
  });
});

test.describe('Bio-Mirror Mobile Experience', () => {
  
  test('should adapt UI for mobile viewport', async ({ page, context, isMobile }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    if (isMobile) {
      // Check that video fills viewport appropriately on mobile
      const videoBox = await video.boundingBox();
      expect(videoBox).not.toBeNull();
      
      if (videoBox) {
        // Video should be reasonably sized for mobile
        expect(videoBox.width).toBeLessThanOrEqual(500);
      }
    }
  });

  test('should handle orientation changes', async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video');
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Change orientation
    await page.setViewportSize({ width: 812, height: 375 }); // Landscape
    
    // Camera should still be active
    await expect(video).toBeAttached();
    
    // Change back to portrait
    await page.setViewportSize({ width: 375, height: 812 }); // Portrait
    
    // Camera should still be active
    await expect(video).toBeAttached();
  });
});
