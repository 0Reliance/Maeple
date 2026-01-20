/**
 * useCameraCapture Hook
 * 
 * Provides stable camera management with proper lifecycle handling.
 * Uses refs instead of state for MediaStream to prevent re-renders.
 * Solves flickering by:
 * - Using useRef for stream (no state changes)
 * - Single useEffect with proper dependencies
 * - Stable cleanup function with empty deps
 * - Proper track cleanup before requesting new stream
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface CameraConfig {
  facingMode?: 'user' | 'environment';
  maxRetries?: number;
  resolutionPresets?: Array<{ label: string; width: number; height: number }>;
}

interface CameraState {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  currentResolution: string;
}

interface UseCameraCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: CameraState;
  capture: () => Promise<string | null>;
  switchCamera: () => void;
  retry: () => void;
  facingMode: 'user' | 'environment';
}

const DEFAULT_RESOLUTIONS = [
  { label: 'HD', width: 1280, height: 720 },
  { label: 'SD', width: 720, height: 480 },
  { label: 'Low', width: 480, height: 360 },
];

export function useCameraCapture(
  isActive: boolean,
  config: CameraConfig = {}
): UseCameraCaptureReturn {
  // Use refs for values that shouldn't trigger re-renders
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  
  // CRITICAL: Use refs for config to prevent dependency changes
  const resolutionsRef = useRef(config.resolutionPresets || DEFAULT_RESOLUTIONS);
  const maxRetriesRef = useRef(config.maxRetries || 3);
  const initialFacingModeRef = useRef(config.facingMode || 'user');
  
  // State for UI updates only
  const [state, setState] = useState<CameraState>({
    isReady: false,
    isInitializing: false,
    error: null,
    currentResolution: 'HD',
  });
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingModeRef.current);

  // Stable cleanup function - NO dependencies (critical for preventing re-renders!)
  const cleanup = useCallback(() => {
    console.log('[useCameraCapture] Cleanup called');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          console.log('[useCameraCapture] Track stopped:', track.kind);
        } catch (e) {
          console.warn('[useCameraCapture] Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Reset state on cleanup
    setState({
      isReady: false,
      isInitializing: false,
      error: null,
      currentResolution: 'HD',
    });
  }, []);

  // Initialize camera - this is the main camera setup logic
  // CRITICAL: Use refs instead of state/props in deps to prevent recreation
  const initializeCamera = useCallback(
    async (resolutionIndex: number = 0, currentFacingMode: 'user' | 'environment' = 'user') => {
      if (!mountedRef.current) return;
      
      // Stop existing tracks before starting new ones
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setState(prev => ({ ...prev, isInitializing: true, error: null, isReady: false }));
      
      try {
        const resolutions = resolutionsRef.current;
        const resolution = resolutions[Math.min(resolutionIndex, resolutions.length - 1)];
        
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: currentFacingMode,
            width: { ideal: resolution.width },
            height: { ideal: resolution.height },
          },
          audio: false,
        };
        
        console.log(`[useCameraCapture] Starting at ${resolution.label} (${resolution.width}x${resolution.height})...`);
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Check if still mounted after async operation
        if (!mountedRef.current) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = mediaStream;
        retryCountRef.current = 0;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          // Wait for video to be ready with timeout
          await new Promise<void>((resolve, reject) => {
            const video = videoRef.current!;
            const timeoutId = setTimeout(() => {
              reject(new Error('Video ready timeout'));
            }, 5000);
            
            const handleReady = () => {
              if (video.readyState >= 2) {
                clearTimeout(timeoutId);
                video.removeEventListener('loadedmetadata', handleReady);
                resolve();
              }
            };
            
            video.addEventListener('loadedmetadata', handleReady);
            
            // Check if already ready
            if (video.readyState >= 2) {
              clearTimeout(timeoutId);
              video.removeEventListener('loadedmetadata', handleReady);
              resolve();
            }
          });
          
          console.log(`[useCameraCapture] Ready: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        }
        
        if (mountedRef.current) {
          setState({
            isReady: true,
            isInitializing: false,
            error: null,
            currentResolution: resolution.label,
          });
        }
        
      } catch (err) {
        console.error('[useCameraCapture] Error:', err);
        
        if (!mountedRef.current) return;
        
        // Try lower resolution on certain errors
        if (err instanceof DOMException) {
          const resolutions = resolutionsRef.current;
          if ((err.name === 'NotReadableError' || err.name === 'OverconstrainedError') 
              && resolutionIndex < resolutions.length - 1) {
            console.warn(`[useCameraCapture] Resolution ${resolutions[resolutionIndex].label} failed, trying lower...`);
            await initializeCamera(resolutionIndex + 1, currentFacingMode);
            return;
          }
          
          // Map errors to user-friendly messages
          const errorMessages: Record<string, string> = {
            NotAllowedError: 'Camera permission denied. Please enable camera access in your browser settings.',
            NotFoundError: 'No camera found. Please ensure your device has a working camera.',
            NotReadableError: 'Camera is in use by another application. Please close other apps using the camera.',
            OverconstrainedError: 'Camera does not support the requested resolution.',
          };
          
          setState(prev => ({
            ...prev,
            isInitializing: false,
            error: errorMessages[err.name] || `Camera error: ${err.message}`,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isInitializing: false,
            error: 'Unable to access camera. Please try again.',
          }));
        }
      }
    },
    [] // CRITICAL: Empty deps - uses refs internally for stable reference
  );

  // Capture image from video stream
  const capture = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current || !state.isReady) {
      console.error('[useCameraCapture] Not ready for capture');
      return null;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('[useCameraCapture] Invalid video dimensions:', video.videoWidth, video.videoHeight);
      return null;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Mirror the image for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return as PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
    console.log('[useCameraCapture] Capture successful');
    return dataUrl;
  }, [state.isReady, facingMode]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => {
      const newMode = prev === 'user' ? 'environment' : 'user';
      console.log('[useCameraCapture] Switching camera to:', newMode);
      return newMode;
    });
  }, []);

  // Retry initialization - uses ref for maxRetries
  const retry = useCallback(() => {
    const maxRetries = maxRetriesRef.current;
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      console.log(`[useCameraCapture] Retry attempt ${retryCountRef.current}/${maxRetries}`);
      // Must get current facingMode from state
      setFacingMode(current => {
        initializeCamera(0, current);
        return current;
      });
    } else {
      setState(prev => ({
        ...prev,
        error: 'Maximum retry attempts reached. Please refresh the page.',
      }));
    }
  }, [initializeCamera]);

  // Main lifecycle effect - SINGLE effect for ALL camera management
  // CRITICAL: Only depends on isActive and facingMode - NOT on callbacks
  useEffect(() => {
    mountedRef.current = true;
    
    if (isActive) {
      console.log('[useCameraCapture] Initializing camera, facingMode:', facingMode);
      initializeCamera(0, facingMode);
    } else {
      console.log('[useCameraCapture] Camera inactive, cleaning up');
      cleanup();
    }
    
    return () => {
      console.log('[useCameraCapture] Effect cleanup - unmounting');
      mountedRef.current = false;
      // Inline cleanup to avoid dependency
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, facingMode]); // ONLY these two - initializeCamera/cleanup are stable refs

  return {
    videoRef,
    canvasRef,
    state,
    capture,
    switchCamera,
    retry,
    facingMode,
  };
}
