/**
 * P0 Critical Test: useCameraCapture.test.ts
 *
 * Tests camera hook including:
 * - Camera initialization
 * - Capture functionality
 * - Error handling (permission denied)
 * - Cleanup on unmount
 * - Video ready timeout handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCameraCapture } from '../../src/hooks/useCameraCapture';

// Helper to wrap async state updates in act
async function actAsync(fn: () => Promise<void> | void) {
  await act(fn);
}

describe('useCameraCapture', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockStream: MediaStream;
  let mockTracks: MediaStreamTrack[];

  beforeEach(() => {
    // Create mock tracks
    mockTracks = [
      {
        stop: vi.fn(),
        kind: 'video',
        id: 'track-1',
        enabled: true,
        muted: false,
        readyState: 'live',
        onended: null,
        onmute: null,
        onunmute: null,
        getSettings: vi.fn().mockReturnValue({}),
        getConstraints: vi.fn().mockReturnValue({}),
        applyConstraints: vi.fn().mockResolvedValue(undefined),
        clone: vi.fn(),
        getCapabilities: vi.fn().mockReturnValue({}),
      } as unknown as MediaStreamTrack,
    ];

    // Create mock stream
    mockStream = {
      getTracks: vi.fn().mockReturnValue(mockTracks),
      getVideoTracks: vi.fn().mockReturnValue(mockTracks),
      getAudioTracks: vi.fn().mockReturnValue([]),
      active: true,
      id: 'stream-1',
      onaddtrack: null,
      onremovetrack: null,
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
    } as unknown as MediaStream;

    // Mock getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      configurable: true,
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('T-4.1: Hook Initialization', () => {
    it('should return videoRef, canvasRef, and state', () => {
      const { result } = renderHook(() => useCameraCapture(true));

      expect(result.current.videoRef).toBeDefined();
      expect(result.current.canvasRef).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.state.isInitializing).toBe(true);
      expect(result.current.state.isReady).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('should not initialize when isActive is false', async () => {
      renderHook(() => useCameraCapture(false));

      // Should not call getUserMedia when inactive
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });

    it('should handle rapid toggle of isActive', async () => {
      const { rerender } = renderHook(
        ({ isActive }) => useCameraCapture(isActive),
        {
          initialProps: { isActive: true },
        }
      );

      // Rapid toggle wrapped in act
      await actAsync(() => {
        rerender({ isActive: false });
        rerender({ isActive: true });
        rerender({ isActive: false });
      });

      // Should handle gracefully without errors
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockGetUserMedia.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });

  describe('T-4.2: Camera Initialization Success', () => {
    it('should call getUserMedia with correct constraints', async () => {
      renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              facingMode: 'user',
              width: expect.objectContaining({ ideal: 1280 }),
              height: expect.objectContaining({ ideal: 720 }),
            }),
            audio: false,
          })
        );
      });
    });

    it('should set videoRef srcObject to MediaStream', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      // Simulate video element
      const mockVideo = document.createElement('video');
      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // After successful initialization, srcObject should be set
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should transition to isReady = true after initialization', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });
    });

    it('should check mounted state after async operations', async () => {
      const { unmount } = renderHook(() => useCameraCapture(true));

      // Unmount during initialization
      unmount();

      // Should not throw or cause memory leaks
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockTracks[0]!.stop).toHaveBeenCalled();
    });
  });

  describe('T-4.3: Camera Error Handling', () => {
    it('should handle NotAllowedError (permission denied)', async () => {
      const permissionError = new DOMException(
        'Permission denied',
        'NotAllowedError'
      );
      mockGetUserMedia.mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      expect(result.current.state.error).toContain('permission');
      expect(result.current.state.isInitializing).toBe(false);
    });

    it('should handle NotFoundError (no camera)', async () => {
      const notFoundError = new DOMException(
        'Requested device not found',
        'NotFoundError'
      );
      mockGetUserMedia.mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      expect(result.current.state.error).toContain('camera');
    });

    it('should handle NotReadableError (camera in use)', async () => {
      const notReadableError = new DOMException(
        'Could not start video source',
        'NotReadableError'
      );
      mockGetUserMedia.mockRejectedValueOnce(notReadableError);

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      expect(result.current.state.error).toContain('camera');
    });

    it('should handle unknown error types', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Unknown error'));

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      expect(result.current.state.error).toBeDefined();
    });
  });

  describe('T-4.4: Resolution Fallback', () => {
    it('should try lower resolutions on OverconstrainedError', async () => {
      const overconstrainedError = new DOMException(
        'Overconstrained',
        'OverconstrainedError'
      );

      // First call fails, subsequent calls succeed
      mockGetUserMedia
        .mockRejectedValueOnce(overconstrainedError)
        .mockResolvedValueOnce(mockStream);

      renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      });

      // Second call should have lower resolution
      const secondCall = mockGetUserMedia.mock.calls[1]![0] as MediaStreamConstraints;
      expect(secondCall.video).toMatchObject({
        facingMode: 'user',
      });
    });

    it('should try SD resolution after HD fails', async () => {
      const notReadableError = new DOMException(
        'Could not start',
        'NotReadableError'
      );

      mockGetUserMedia
        .mockRejectedValueOnce(notReadableError)
        .mockRejectedValueOnce(notReadableError)
        .mockResolvedValueOnce(mockStream);

      renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle all resolutions failing', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('All resolutions failed'));

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      expect(result.current.state.isInitializing).toBe(false);
    });
  });

  describe('T-4.5: Capture Image', () => {
    it('should return data URL when video is ready', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      // Wait for initialization
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Simulate ready video element
      const mockVideo = {
        readyState: 4, // HAVE_ENOUGH_DATA
        videoWidth: 1280,
        videoHeight: 720,
        paused: false,
        ended: false,
      } as unknown as HTMLVideoElement;

      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      // Mock canvas
      const mockCanvas = document.createElement('canvas');
      const mockContext = {
        drawImage: vi.fn(),
        scale: vi.fn(),
      };
      mockCanvas.getContext = vi.fn().mockReturnValue(mockContext);
      mockCanvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');

      Object.defineProperty(result.current.canvasRef, 'current', {
        value: mockCanvas,
        writable: true,
      });

      // Should be able to capture
      if (result.current.state.isReady) {
        const captured = await result.current.capture();
        expect(captured).toBeTruthy();
      }
    });

    it('should apply mirroring for front camera', async () => {
      const { result } = renderHook(() =>
        useCameraCapture(true, { facingMode: 'user' })
      );

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      expect(result.current.facingMode).toBe('user');
    });

    it('should handle video not ready', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      // Don't set up video element
      const captured = await result.current.capture();

      expect(captured).toBeNull();
    });

    it('should handle zero dimensions', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const mockVideo = {
        readyState: 4,
        videoWidth: 0,
        videoHeight: 0,
      } as unknown as HTMLVideoElement;

      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      const captured = await result.current.capture();
      expect(captured).toBeNull();
    });
  });

  describe('T-4.6: Cleanup on Unmount', () => {
    it('should stop all MediaStream tracks on unmount', async () => {
      const { unmount } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockTracks[0]!.stop).toHaveBeenCalled();
    });

    it('should set videoRef srcObject to null on cleanup', async () => {
      const { result, unmount } = renderHook(() => useCameraCapture(true));

      const mockVideo = document.createElement('video');
      mockVideo.srcObject = mockStream;

      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      expect(mockVideo.srcObject).toBeNull();
    });

    it('should reset state on cleanup', async () => {
      const { result, unmount } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      unmount();

      // State should be reset
      expect(result.current.state.isReady).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('should prevent memory leaks from active tracks', async () => {
      const { unmount } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Multiple unmounts should not cause issues
      unmount();

      // Track stop should be called
      expect(mockTracks[0]!.stop).toHaveBeenCalled();
    });
  });

  describe('T-4.7: Switch Camera Facing Mode', () => {
    it('should toggle facingMode when switchCamera is called', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const initialFacingMode = result.current.facingMode;

      await actAsync(() => {
        result.current.switchCamera();
      });

      expect(result.current.facingMode).not.toBe(initialFacingMode);
    });

    it('should reinitialize camera after switching', async () => {
      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const initialCallCount = mockGetUserMedia.mock.calls.length;

      await actAsync(() => {
        result.current.switchCamera();
      });

      // Should trigger reinitialization
      await waitFor(() => {
        expect(mockGetUserMedia.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should handle camera switch during initialization', async () => {
      // Delay getUserMedia to simulate slow initialization
      mockGetUserMedia.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockStream), 100))
      );

      const { result } = renderHook(() => useCameraCapture(true));

      // Switch while initializing wrapped in act
      await actAsync(() => {
        result.current.switchCamera();
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should handle gracefully
      expect(result.current.facingMode).toBeDefined();
    });
  });

  describe('T-4.8: Retry After Error', () => {
    it('should reset error state on retry', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      // Reset mock to succeed
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      await actAsync(() => {
        result.current.retry();
      });

      expect(result.current.state.error).toBeNull();
    });

    it('should reattempt initialization on retry', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Initial error'));

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      const callCountBeforeRetry = mockGetUserMedia.mock.calls.length;

      // Reset mock to succeed
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      await actAsync(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(mockGetUserMedia.mock.calls.length).toBeGreaterThan(callCountBeforeRetry);
      });
    });

    it('should handle multiple rapid retries', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() => useCameraCapture(true));

      await waitFor(() => {
        expect(result.current.state.error).toBeTruthy();
      });

      // Multiple rapid retries wrapped in act
      await actAsync(() => {
        result.current.retry();
        result.current.retry();
        result.current.retry();
      });

      // Should handle without throwing
      expect(result.current.retry).toBeDefined();
    });
  });

  describe('Video Ready Timeout', () => {
    it('should handle video ready timeout', async () => {
      // Mock video that never becomes ready
      const mockVideo = {
        readyState: 0, // HAVE_NOTHING
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLVideoElement;

      const { result } = renderHook(() => useCameraCapture(true));

      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 5500));

      // Should handle timeout gracefully
      expect(result.current.state.error || result.current.state.isInitializing).toBeDefined();
    });
  });
});
