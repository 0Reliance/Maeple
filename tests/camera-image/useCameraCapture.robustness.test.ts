import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCameraCapture } from '../../src/hooks/useCameraCapture';

describe('useCameraCapture Robustness', () => {
  let mockGetUserMedia: any;
  let mockStream: any;
  let mockTracks: any[];

  beforeEach(() => {
    mockTracks = [{
      stop: vi.fn(),
      kind: 'video',
      id: 'track-1',
    }];
    
    mockStream = {
      getTracks: () => mockTracks,
      getVideoTracks: () => mockTracks,
      active: true,
    };

    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle unmount during camera initialization', async () => {
    let resolveStream: any;
    const streamPromise = new Promise(resolve => { resolveStream = resolve; });
    mockGetUserMedia.mockReturnValue(streamPromise);

    const { result, unmount } = renderHook(() => useCameraCapture(true));
    
    expect(result.current.state.isInitializing).toBe(true);

    unmount();

    await act(async () => {
      resolveStream(mockStream);
    });

    expect(mockTracks[0].stop).toHaveBeenCalled();
  });

  it('should stop previous tracks when switching camera', async () => {
    const { result, rerender } = renderHook(({ isActive }) => useCameraCapture(isActive), {
      initialProps: { isActive: true }
    });

    await waitFor(() => expect(mockGetUserMedia).toHaveBeenCalled());
    
    const firstCallTracks = mockTracks[0].stop;

    // Switch camera
    await act(async () => {
      result.current.switchCamera();
    });

    await waitFor(() => expect(mockGetUserMedia).toHaveBeenCalledTimes(2));
    
    // Previous track should be stopped
    expect(firstCallTracks).toHaveBeenCalled();
  });
});
