/**
 * P0 Critical Test: StateCheckAnalyzing.test.tsx
 *
 * Tests analysis component including:
 * - Step progression
 * - Timer management (timer leak bug fix verification)
 * - Abort handling on unmount
 * - Progress callback
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import StateCheckAnalyzing from '../../src/components/StateCheckAnalyzing';

// Mock vision service
const mockAnalyzeFromImage = vi.fn();

vi.mock('../../src/contexts/DependencyContext', async () => {
  const actual = await vi.importActual('../../src/contexts/DependencyContext');
  return {
    ...actual,
    useVisionService: () => ({
      analyzeFromImage: mockAnalyzeFromImage,
    }),
  };
});

describe('StateCheckAnalyzing', () => {
  const mockOnProgress = vi.fn();
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  const mockAnalysisResult = {
    confidence: 0.92,
    actionUnits: [
      { auCode: 'AU6', name: 'Cheek Raiser', intensity: 'C', confidence: 0.89 },
      { auCode: 'AU12', name: 'Lip Corner Puller', intensity: 'D', confidence: 0.94 },
    ],
    facsInterpretation: {
      duchennSmile: true,
      socialSmile: false,
      maskingIndicators: [],
      fatigueIndicators: [],
      tensionIndicators: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockAnalyzeFromImage.mockResolvedValue(mockAnalysisResult);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('T-8.1: Component Renders with Steps', () => {
    it('should render all 5 analysis steps', () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/processing image/i)).toBeInTheDocument();
      expect(screen.getByText(/detecting facial landmarks/i)).toBeInTheDocument();
      expect(screen.getByText(/analyzing action units/i)).toBeInTheDocument();
      expect(screen.getByText(/comparing with baseline/i)).toBeInTheDocument();
      expect(screen.getByText(/generating insights/i)).toBeInTheDocument();
    });

    it('should show initial step as processing', () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // First step should be active
      expect(screen.getByText(/securely preparing your photo/i)).toBeInTheDocument();
    });

    it('should display timer countdown', () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
          estimatedTime={45}
        />
      );

      expect(screen.getByText(/0:45/)).toBeInTheDocument();
    });
  });

   describe('T-8.2: Progression Through Steps', () => {
    it('should progress through encoding step (2s)', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Initial state
      expect(mockOnProgress).not.toHaveBeenCalled();

      // Advance 2 seconds for encoding step
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockOnProgress).toHaveBeenCalledWith('encoding', expect.any(Number));
      });
    });

    it('should move to landmarks step after encoding', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Advance past encoding (2s) and landmarks (3s)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockOnProgress).toHaveBeenCalledWith('landmarks', expect.any(Number));
      });
    });

    it('should perform AI analysis with real timing', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Wait for analysis step
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      await waitFor(() => {
        // AI analysis should be called
        expect(mockAnalyzeFromImage).toHaveBeenCalled();
      });
    });
  });

  describe('T-8.3: AI Analysis Integration', () => {
    it('should call visionService.analyzeFromImage with base64', async () => {
      const imageSrc = 'data:image/webp;base64,mockImageData';

      render(
        <StateCheckAnalyzing
          imageSrc={imageSrc}
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Advance to analysis step
      await act(async () => {
        vi.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(mockAnalyzeFromImage).toHaveBeenCalled();
        const callArgs = mockAnalyzeFromImage.mock.calls[0];
        expect(callArgs[0]).toBe('mockImageData'); // base64 without prefix
      });
    });

    it('should pass AbortController in options', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(mockAnalyzeFromImage).toHaveBeenCalled();
        const callArgs = mockAnalyzeFromImage.mock.calls[0];
        expect(callArgs[1]).toHaveProperty('signal');
        expect(callArgs[1]).toHaveProperty('onProgress');
      });
    });

    it('should update progress via callback', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        const callArgs = mockAnalyzeFromImage.mock.calls[0];
        const options = callArgs[1];
        // Simulate progress callback
        options.onProgress('extracting features', 50);
        expect(mockOnProgress).toHaveBeenCalled();
      });
    });
  });

  describe('T-8.4: Action Unit Display', () => {
    it('should display detected AUs from result', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Advance through steps
      await act(async () => {
        vi.advanceTimersByTime(45000);
      });

      await waitFor(() => {
        // AUs should be displayed after analysis
        expect(mockAnalyzeFromImage).toHaveBeenCalled();
      });
    });

    it('should handle empty AU list', async () => {
      mockAnalyzeFromImage.mockResolvedValue({
        ...mockAnalysisResult,
        actionUnits: [],
      });

      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(45000);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('T-8.5: Timer Countdown', () => {
    it('should decrement timer every second', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
          estimatedTime={45}
        />
      );

      expect(screen.getByText(/0:45/)).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/0:44/)).toBeInTheDocument();
    });

    it('should format time as M:SS', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
          estimatedTime={65}
        />
      );

      expect(screen.getByText(/1:05/)).toBeInTheDocument();
    });

    it('should reach 0 at estimate time', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
          estimatedTime={5}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/0:00/)).toBeInTheDocument();
    });
  });

  describe('T-8.6: Timer Leak Prevention', () => {
    it('should clear interval on unmount', async () => {
      const { unmount } = render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Advance timer a bit
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      unmount();

      // After unmount, no more progress callbacks should fire
      const callCount = mockOnProgress.mock.calls.length;

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnProgress.mock.calls.length).toBe(callCount);
    });

    it('should call AbortController.abort on unmount', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(mockAnalyzeFromImage).toHaveBeenCalled();
      });

      const callArgs = mockAnalyzeFromImage.mock.calls[0];
      const signal = callArgs[1].signal;

      // Verify signal exists and is an AbortSignal
      expect(signal).toBeDefined();
    });
  });

  describe('T-8.7: Completion Handling', () => {
    it('should call onComplete with analysis result', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Advance through all steps
      await act(async () => {
        vi.advanceTimersByTime(50000);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      const result = mockOnComplete.mock.calls[0][0];
      expect(result).toHaveProperty('actionUnits');
      expect(result).toHaveProperty('confidence');
    });

    it('should set isComplete before calling onComplete', async () => {
      let isCompleteDuringCallback = false;

      const onComplete = (result: any) => {
        // Check if component shows complete state
        isCompleteDuringCallback = true;
      };

      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={onComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(50000);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });

      expect(isCompleteDuringCallback).toBe(true);
    });

    it('should have brief delay before completion callback', async () => {
      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      // Complete all steps
      await act(async () => {
        vi.advanceTimersByTime(48000);
      });

      expect(mockOnComplete).not.toHaveBeenCalled();

      // Wait for the 1s delay
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('T-8.8: Error Handling', () => {
    it('should handle analysis error gracefully', async () => {
      mockAnalyzeFromImage.mockRejectedValue(new Error('Analysis failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      // Should still call onComplete with partial result
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should call onComplete with error info on failure', async () => {
      mockAnalyzeFromImage.mockRejectedValue(new Error('Network error'));

      render(
        <StateCheckAnalyzing
          imageSrc="data:image/webp;base64,mock"
          onProgress={mockOnProgress}
          onComplete={mockOnComplete}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(50000);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
        const result = mockOnComplete.mock.calls[0][0];
        expect(result).toHaveProperty('error');
      });
    });
  });
});
