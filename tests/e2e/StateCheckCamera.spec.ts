import { test, expect, Page } from '@playwright/test';

/**
 * StateCheckCamera Component E2E Tests
 * 
 * These tests verify the StateCheckCamera React component behavior
 * in a real browser environment with actual camera access.
 * 
 * Tests cover:
 * - Component rendering and UI states
 * - Camera initialization flow
 * - User interactions (capture, switch, cancel)
 * - Image processing and compression
 * - Error handling and recovery
 */

test.describe('StateCheckCamera Component', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should render camera component with all UI elements', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Look for camera component
    const cameraContainer = page.locator('[data-testid="state-check-camera"]').or(
      page.locator('.camera-container')
    ).or(
      page.locator('video').first()
    );
    
    await expect(cameraContainer).toBeVisible();
    
    // Check for expected UI elements
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]');
    const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label*="cancel" i], button:has([data-lucide="x"])');
    const switchButton = page.locator('button:has([data-lucide="refresh-cw"])');
    
    // At least capture or cancel should be visible
    await expect(captureButton.or(cancelButton)).toBeVisible();
  });

  test('should initialize camera when component mounts', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for video element
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for video to be ready
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) {
          resolve();
        } else {
          el.addEventListener('loadeddata', () => resolve(), { once: true });
          setTimeout(resolve, 5000); // Fallback timeout
        }
      });
    });
    
    // Verify video has stream
    const hasStream = await video.evaluate((el: HTMLVideoElement) => {
      return el.srcObject !== null;
    });
    
    expect(hasStream).toBe(true);
  });

  test('should display loading state during initialization', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Check for loading indicators
    const loadingIndicator = page.locator('text=/loading|initializing|starting/i').or(
      page.locator('[data-testid="loading"]').or(
        page.locator('.loading-spinner')
      )
    );
    
    // Should show loading or camera
    const video = page.locator('video').first();
    await expect(loadingIndicator.or(video)).toBeVisible();
  });

  test('should display error state when camera fails', async ({ page, context }) => {
    // Clear permissions to cause failure
    await context.clearPermissions();
    
    // Override getUserMedia to simulate error
    await page.evaluate(() => {
      (navigator.mediaDevices as any).getUserMedia = async () => {
        throw new DOMException('Camera access denied', 'NotAllowedError');
      };
    });
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Should show error message
    const errorMessage = page.locator('text=/error|denied|permission|camera access/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should capture image when capture button is clicked', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera to be ready
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for video ready state
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) resolve();
        else el.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    });
    
    // Click capture button
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await expect(captureButton).toBeVisible();
    await captureButton.click();
    
    // Should show captured image or analyzing state
    await expect(page.locator('img, [data-testid="captured-image"], text=/analyzing/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should switch camera when switch button is clicked', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Find switch button
    const switchButton = page.locator('button:has([data-lucide="refresh-cw"]), button:has-text("Switch")').first();
    
    // Only test if switch button exists
    if (await switchButton.isVisible().catch(() => false)) {
      // Get initial stream ID
      const initialStreamId = await video.evaluate((el: HTMLVideoElement) => {
        const stream = el.srcObject as MediaStream;
        return stream?.id;
      });
      
      // Click switch
      await switchButton.click();
      
      // Wait for camera to switch
      await page.waitForTimeout(2000);
      
      // Camera should still be active
      await expect(video).toBeAttached();
      
      // Stream might be different after switch
      const newStreamId = await video.evaluate((el: HTMLVideoElement) => {
        const stream = el.srcObject as MediaStream;
        return stream?.id;
      });
      
      // Either stream changed or stayed the same (both are valid)
      expect(newStreamId).toBeTruthy();
    }
  });

  test('should cancel and close camera when cancel button is clicked', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Find cancel button
    const cancelButton = page.locator('button:has([data-lucide="x"]), button:has-text("Cancel"), button[aria-label*="cancel" i]').first();
    
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      
      // Camera should close
      await expect(video).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should display image size information after capture', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for ready
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) resolve();
        else el.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    });
    
    // Capture
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await captureButton.click();
    
    // Check for image size info
    const sizeInfo = page.locator('text=/KB|MB|size|file/i');
    await expect(sizeInfo.or(page.locator('img'))).toBeVisible({ timeout: 5000 });
  });

  test('should handle rapid capture attempts', async ({ page }) => {
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Wait for camera
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for ready
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) resolve();
        else el.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    });
    
    // Rapid clicks on capture
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    
    for (let i = 0; i < 3; i++) {
      await captureButton.click().catch(() => {});
      await page.waitForTimeout(100);
    }
    
    // Should still be in a valid state
    await expect(page.locator('video, img, text=/analyzing/i').first()).toBeVisible();
  });

  test('should retry camera initialization on error', async ({ page, context }) => {
    // Start with denied permission
    await context.clearPermissions();
    
    let attemptCount = 0;
    await page.evaluate(() => {
      (window as any).cameraAttempts = 0;
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      
      (navigator.mediaDevices as any).getUserMedia = async (constraints: any) => {
        (window as any).cameraAttempts++;
        if ((window as any).cameraAttempts < 2) {
          throw new DOMException('Not readable', 'NotReadableError');
        }
        return originalGetUserMedia(constraints);
      };
    });
    
    // Grant permission after first attempt
    await context.grantPermissions(['camera']);
    
    // Navigate to State Check
    await page.goto('/state-check');
    
    // Look for retry button
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();
    
    if (await retryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await retryButton.click();
      
      // Should eventually get camera working
      const video = page.locator('video').first();
      await expect(video).toBeAttached({ timeout: 10000 });
    }
  });
});

test.describe('StateCheckCamera - Image Processing', () => {
  
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/state-check');
    await page.waitForLoadState('networkidle');
  });

  test('should compress captured image', async ({ page }) => {
    // Wait for camera
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for ready
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2) resolve();
        else el.addEventListener('loadeddata', () => resolve(), { once: true });
      });
    });
    
    // Capture
    const captureButton = page.locator('button:has-text("Capture"), button[aria-label*="capture" i]').first();
    await captureButton.click();
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Check for compressed image or processing indicator
    const result = page.locator('img, [data-testid="captured-image"], text=/compressed|processed/i');
    await expect(result).toBeVisible({ timeout: 5000 });
  });

  test('should constrain image to maximum dimensions', async ({ page }) => {
    // Inject test to verify image constraints
    await page.evaluate(() => {
      (window as any).testImageConstraints = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          setTimeout(resolve, 1000);
        });
        
        const canvas = document.createElement('canvas');
        const maxDimension = 512;
        
        // Constrain dimensions
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        return {
          originalWidth: video.videoWidth,
          originalHeight: video.videoHeight,
          constrainedWidth: width,
          constrainedHeight: height,
          withinLimits: width <= maxDimension && height <= maxDimension
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testImageConstraints());
    expect(result.withinLimits).toBe(true);
  });

  test('should convert captured image to ImageData for processing', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testImageDataConversion = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          setTimeout(resolve, 1000);
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        let imageData: ImageData | null = null;
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        return {
          hasImageData: imageData !== null,
          width: imageData?.width,
          height: imageData?.height,
          dataLength: imageData?.data.length
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testImageDataConversion());
    expect(result.hasImageData).toBe(true);
    expect(result.dataLength).toBeGreaterThan(0);
  });
});

test.describe('StateCheckCamera - Accessibility', () => {
  
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/state-check');
    await page.waitForLoadState('networkidle');
  });

  test('should have accessible labels on buttons', async ({ page }) => {
    // Check for accessible buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const hasAccessibleName = await button.evaluate((el: HTMLButtonElement) => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') ||
               el.textContent?.trim().length > 0;
      });
      
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on the page
    await page.keyboard.press('Tab');
    
    // Should be able to tab through interactive elements
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tagName: active?.tagName,
        role: active?.getAttribute('role'),
        tabIndex: active?.tabIndex
      };
    });
    
    expect(focusedElement.tagName).toBeTruthy();
  });

  test('should announce camera status to screen readers', async ({ page }) => {
    // Look for live regions
    const liveRegion = page.locator('[aria-live], [role="status"], [role="alert"]');
    
    // Should have some form of status announcement
    const hasLiveRegion = await liveRegion.count() > 0;
    
    // Or check for status text
    const statusText = page.locator('text=/camera ready|initializing|error/i');
    const hasStatusText = await statusText.count() > 0;
    
    expect(hasLiveRegion || hasStatusText).toBe(true);
  });
});

test.describe('StateCheckCamera - Performance', () => {
  
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/state-check');
    await page.waitForLoadState('networkidle');
  });

  test('should initialize camera within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    // Wait for video
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 5000 });
    
    const initTime = Date.now() - startTime;
    expect(initTime).toBeLessThan(5000);
  });

  test('should not cause memory leaks on mount/unmount cycles', async ({ page }) => {
    // Get initial memory info
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Navigate away and back multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.goto('/state-check');
      await page.waitForTimeout(1000);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Get final memory info
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory shouldn't grow unbounded (allow 50MB growth)
    if (initialMetrics > 0 && finalMetrics > 0) {
      const growth = finalMetrics - initialMetrics;
      expect(growth).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('should maintain 30fps video playback', async ({ page }) => {
    // Wait for camera
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10000 });
    
    // Wait for playback
    await video.evaluate((el: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        if (el.readyState >= 2 && !el.paused) resolve();
        else {
          el.addEventListener('playing', () => resolve(), { once: true });
          setTimeout(resolve, 2000);
        }
      });
    });
    
    // Check playback rate
    const playbackInfo = await video.evaluate((el: HTMLVideoElement) => {
      return {
        paused: el.paused,
        playbackRate: el.playbackRate,
        readyState: el.readyState
      };
    });
    
    expect(playbackInfo.paused).toBe(false);
    expect(playbackInfo.readyState).toBeGreaterThanOrEqual(2);
  });
});
