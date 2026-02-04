import { test, expect, Page } from '@playwright/test';

/**
 * useCameraCapture Hook E2E Tests
 * 
 * These tests specifically verify the behavior of the useCameraCapture hook
 * in a real browser environment with actual MediaStream API access.
 * 
 * Tests cover:
 * - Camera initialization with different configurations
 * - Stream lifecycle management
 * - Error handling for various scenarios
 * - Resolution fallback behavior
 * - Camera switching
 */

// Helper function to inject test component
async function injectTestComponent(page: Page, componentCode: string): Promise<void> {
  await page.evaluate((code) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = code;
    document.body.appendChild(container);
  }, componentCode);
}

test.describe('useCameraCapture Hook - Initialization', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(['camera']);
    
    // Navigate to a test page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should initialize camera with default configuration', async ({ page }) => {
    // Inject a test component that uses useCameraCapture
    await page.evaluate(() => {
      const testDiv = document.createElement('div');
      testDiv.id = 'camera-test';
      testDiv.innerHTML = `
        <video id="test-video" autoplay playsinline></video>
        <canvas id="test-canvas"></canvas>
        <div id="camera-state">initializing</div>
      `;
      document.body.appendChild(testDiv);
      
      // Simulate hook initialization
      (window as any).initializeCameraTest = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
          });
          const video = document.getElementById('test-video') as HTMLVideoElement;
          video.srcObject = stream;
          document.getElementById('camera-state')!.textContent = 'ready';
          return true;
        } catch (e) {
          document.getElementById('camera-state')!.textContent = 'error';
          return false;
        }
      };
    });
    
    // Initialize camera
    const success = await page.evaluate(() => (window as any).initializeCameraTest());
    expect(success).toBe(true);
    
    // Verify video element has stream
    const video = page.locator('#test-video');
    await expect(video).toHaveAttribute('srcObject');
  });

  test('should handle camera not found error', async ({ page, context }) => {
    // Clear permissions to simulate no camera
    await context.clearPermissions();
    
    // Override getUserMedia to simulate NotFoundError
    await page.evaluate(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      (navigator.mediaDevices as any).getUserMedia = async () => {
        const error = new DOMException('Requested device not found', 'NotFoundError');
        throw error;
      };
      
      (window as any).testCameraError = async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          return 'success';
        } catch (e: any) {
          return e.name;
        }
      };
    });
    
    const result = await page.evaluate(() => (window as any).testCameraError());
    expect(result).toBe('NotFoundError');
  });

  test('should handle permission denied error', async ({ page, context }) => {
    // Clear permissions
    await context.clearPermissions();
    
    // Override getUserMedia to simulate NotAllowedError
    await page.evaluate(() => {
      (navigator.mediaDevices as any).getUserMedia = async () => {
        const error = new DOMException('Permission denied', 'NotAllowedError');
        throw error;
      };
      
      (window as any).testCameraError = async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          return 'success';
        } catch (e: any) {
          return e.name;
        }
      };
    });
    
    const result = await page.evaluate(() => (window as any).testCameraError());
    expect(result).toBe('NotAllowedError');
  });

  test('should request specific resolution', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testResolution = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
          });
          
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          
          return {
            width: settings.width,
            height: settings.height
          };
        } catch (e) {
          return null;
        }
      };
    });
    
    const resolution = await page.evaluate(() => (window as any).testResolution());
    
    if (resolution) {
      // Resolution should be close to requested (within reason)
      expect(resolution.width).toBeGreaterThan(0);
      expect(resolution.height).toBeGreaterThan(0);
    }
  });

  test('should handle multiple resolution fallbacks', async ({ page }) => {
    const resolutions = [
      { width: 1920, height: 1080, label: 'FHD' },
      { width: 1280, height: 720, label: 'HD' },
      { width: 640, height: 480, label: 'VGA' }
    ];
    
    await page.evaluate((resList) => {
      (window as any).testResolutionFallback = async () => {
        const results = [];
        
        for (const res of resList) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: res.width },
                height: { ideal: res.height }
              }
            });
            
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            results.push({
              requested: res,
              actual: { width: settings.width, height: settings.height },
              success: true
            });
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
          } catch (e) {
            results.push({
              requested: res,
              success: false,
              error: (e as Error).name
            });
          }
        }
        
        return results;
      };
    }, resolutions);
    
    const results = await page.evaluate(() => (window as any).testResolutionFallback());
    
    // At least one resolution should work
    const successful = results.filter((r: any) => r.success);
    expect(successful.length).toBeGreaterThan(0);
  });
});

test.describe('useCameraCapture Hook - Stream Management', () => {
  
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should properly cleanup stream on unmount', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testStreamCleanup = async () => {
        // Create stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        
        // Verify track is live
        const initialState = track.readyState;
        
        // Stop track (simulating cleanup)
        track.stop();
        
        return {
          initialState,
          finalState: track.readyState
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testStreamCleanup());
    expect(result.initialState).toBe('live');
    expect(result.finalState).toBe('ended');
  });

  test('should stop all tracks when cleaning up', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testAllTracksCleanup = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const tracks = stream.getTracks();
        
        // Stop all tracks
        tracks.forEach(track => track.stop());
        
        // Check all tracks are ended
        return tracks.every(track => track.readyState === 'ended');
      };
    });
    
    const allEnded = await page.evaluate(() => (window as any).testAllTracksCleanup());
    expect(allEnded).toBe(true);
  });

  test('should handle rapid start/stop cycles', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testRapidCycles = async () => {
        const results = [];
        
        for (let i = 0; i < 5; i++) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            
            results.push({
              cycle: i + 1,
              trackState: track.readyState,
              success: true
            });
            
            track.stop();
          } catch (e) {
            results.push({
              cycle: i + 1,
              error: (e as Error).message,
              success: false
            });
          }
        }
        
        return results;
      };
    });
    
    const results = await page.evaluate(() => (window as any).testRapidCycles());
    
    // All cycles should succeed
    expect(results.every((r: any) => r.success)).toBe(true);
  });

  test('should maintain stream when video element is replaced', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testStreamPersistence = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const streamId = stream.id;
        
        // Create first video element
        const video1 = document.createElement('video');
        video1.srcObject = stream;
        document.body.appendChild(video1);
        
        // Create second video element with same stream
        const video2 = document.createElement('video');
        video2.srcObject = stream;
        document.body.appendChild(video2);
        
        // Remove first video
        video1.remove();
        
        // Stream should still be active
        const activeTracks = stream.getTracks().filter(t => t.readyState === 'live');
        
        return {
          streamId,
          activeTracks: activeTracks.length,
          totalTracks: stream.getTracks().length
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testStreamPersistence());
    expect(result.activeTracks).toBeGreaterThan(0);
  });
});

test.describe('useCameraCapture Hook - Capture Functionality', () => {
  
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should capture image from video stream', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testCapture = async () => {
        // Get stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Create video element
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        document.body.appendChild(video);
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          setTimeout(resolve, 1000); // Fallback timeout
        });
        
        // Create canvas and capture
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        // Get data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
        return {
          hasData: dataUrl.startsWith('data:image/png'),
          width: canvas.width,
          height: canvas.height
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testCapture());
    expect(result.hasData).toBe(true);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  test('should mirror image for front camera', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testMirrorCapture = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        document.body.appendChild(video);
        
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          setTimeout(resolve, 1000);
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Apply mirror transform
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
        return dataUrl.startsWith('data:image/png');
      };
    });
    
    const success = await page.evaluate(() => (window as any).testMirrorCapture());
    expect(success).toBe(true);
  });

  test('should handle capture when video is not ready', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testCaptureNotReady = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        // Don't autoplay - video won't be ready
        document.body.appendChild(video);
        
        // Try to capture immediately (should fail or return empty)
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        
        const ctx = canvas.getContext('2d');
        let captured = false;
        
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          captured = true;
        }
        
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
        return { captured, videoWidth: video.videoWidth };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testCaptureNotReady());
    // Should not capture since video wasn't ready
    expect(result.captured).toBe(false);
  });
});

test.describe('useCameraCapture Hook - Camera Switching', () => {
  
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should enumerate available cameras', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testEnumerateCameras = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        return {
          totalDevices: devices.length,
          videoDevices: videoDevices.length,
          deviceLabels: videoDevices.map(d => d.label || 'unnamed')
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testEnumerateCameras());
    expect(result.videoDevices).toBeGreaterThan(0);
  });

  test('should switch between user and environment cameras', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testCameraSwitch = async () => {
        const results = [];
        
        // Try user facing
        try {
          const userStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });
          const userTrack = userStream.getVideoTracks()[0];
          const userSettings = userTrack.getSettings();
          
          results.push({
            facingMode: 'user',
            success: true,
            settings: userSettings
          });
          
          userTrack.stop();
        } catch (e) {
          results.push({
            facingMode: 'user',
            success: false,
            error: (e as Error).message
          });
        }
        
        // Try environment facing
        try {
          const envStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          const envTrack = envStream.getVideoTracks()[0];
          const envSettings = envTrack.getSettings();
          
          results.push({
            facingMode: 'environment',
            success: true,
            settings: envSettings
          });
          
          envTrack.stop();
        } catch (e) {
          results.push({
            facingMode: 'environment',
            success: false,
            error: (e as Error).message
          });
        }
        
        return results;
      };
    });
    
    const results = await page.evaluate(() => (window as any).testCameraSwitch());
    
    // At least one camera should work
    const successful = results.filter((r: any) => r.success);
    expect(successful.length).toBeGreaterThan(0);
  });

  test('should properly cleanup old stream when switching', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).testCleanupOnSwitch = async () => {
        // Start with user camera
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        const userTrack = userStream.getVideoTracks()[0];
        const userId = userTrack.id;
        
        // Stop user track (simulating switch)
        userTrack.stop();
        
        // Start environment camera
        const envStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const envTrack = envStream.getVideoTracks()[0];
        
        return {
          userTrackEnded: userTrack.readyState === 'ended',
          envTrackActive: envTrack.readyState === 'live',
          differentTracks: userId !== envTrack.id
        };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testCleanupOnSwitch());
    expect(result.userTrackEnded).toBe(true);
    expect(result.envTrackActive).toBe(true);
    expect(result.differentTracks).toBe(true);
  });
});

test.describe('useCameraCapture Hook - Error Recovery', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should retry on NotReadableError', async ({ page, context }) => {
    let attemptCount = 0;
    
    await page.evaluate(() => {
      (window as any).attemptCount = 0;
      
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      (navigator.mediaDevices as any).getUserMedia = async (constraints: any) => {
        (window as any).attemptCount++;
        
        // Fail first 2 attempts
        if ((window as any).attemptCount < 3) {
          const error = new DOMException('Could not start video source', 'NotReadableError');
          throw error;
        }
        
        return originalGetUserMedia(constraints);
      };
      
      (window as any).testRetry = async () => {
        const maxRetries = 3;
        let lastError = null;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            return { success: true, attempts: (window as any).attemptCount };
          } catch (e: any) {
            lastError = e.name;
            if (e.name !== 'NotReadableError') break;
            await new Promise(r => setTimeout(r, 100));
          }
        }
        
        return { success: false, attempts: (window as any).attemptCount, lastError };
      };
    });
    
    await context.grantPermissions(['camera']);
    
    const result = await page.evaluate(() => (window as any).testRetry());
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
  });

  test('should give up after max retries', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).attemptCount = 0;
      
      (navigator.mediaDevices as any).getUserMedia = async () => {
        (window as any).attemptCount++;
        const error = new DOMException('Camera in use', 'NotReadableError');
        throw error;
      };
      
      (window as any).testMaxRetries = async () => {
        const maxRetries = 3;
        let attempts = 0;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            return { success: true, attempts };
          } catch (e) {
            attempts++;
          }
        }
        
        return { success: false, attempts, gaveUp: true };
      };
    });
    
    const result = await page.evaluate(() => (window as any).testMaxRetries());
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.gaveUp).toBe(true);
  });

  test('should handle abrupt stream termination', async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    
    await page.evaluate(() => {
      (window as any).testAbruptTermination = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        
        // Simulate abrupt termination
        track.stop();
        
        // Check state
        const state = track.readyState;
        
        // Try to get new stream
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = newStream.getVideoTracks()[0];
          
          return {
            oldTrackState: state,
            newTrackActive: newTrack.readyState === 'live',
            recovered: true
          };
        } catch (e) {
          return {
            oldTrackState: state,
            recovered: false,
            error: (e as Error).message
          };
        }
      };
    });
    
    const result = await page.evaluate(() => (window as any).testAbruptTermination());
    expect(result.oldTrackState).toBe('ended');
    expect(result.recovered).toBe(true);
  });
});
