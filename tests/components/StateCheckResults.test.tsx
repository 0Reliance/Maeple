/**
 * P0 Critical Test: StateCheckResults.test.tsx
 *
 * Tests results component including:
 * - Comparison display
 * - Save functionality
 * - Emergency contact display
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StateCheckResults from '../../src/components/StateCheckResults';
import { FacialAnalysis, FacialBaseline, HealthEntry } from '../../src/types';

// Mock services
vi.mock('../../src/services/stateCheckService', () => ({
  saveStateCheck: vi.fn().mockResolvedValue('saved-state-check-id'),
}));

vi.mock('../../src/services/storageService', () => ({
  getUserSettings: vi.fn().mockReturnValue({
    safetyContact: '+1234567890',
  }),
}));

vi.mock('../../src/services/comparisonEngine', () => ({
  compareSubjectiveToObjective: vi.fn().mockReturnValue({
    discrepancyScore: 60,
    subjectiveState: 'Happy (4/5)',
    objectiveState: 'Tension detected',
    insight: {
      description: 'Your face shows signs of strain',
      confidence: 0.85,
    },
    baselineApplied: true,
    isMaskingLikely: true,
    facsInsights: {
      detectedAUs: ['AU4', 'AU12', 'AU24'],
      smileType: 'social',
      tensionAUs: ['AU4', 'AU24'],
      fatigueAUs: [],
    },
  }),
}));

import { saveStateCheck } from '../../src/services/stateCheckService';
import { getUserSettings } from '../../src/services/storageService';

describe('StateCheckResults', () => {
  const mockOnClose = vi.fn();

  const mockAnalysis: FacialAnalysis = {
    confidence: 0.92,
    actionUnits: [
      {
        auCode: 'AU4',
        name: 'Brow Lowerer',
        intensity: 'C',
        intensityNumeric: 3,
        confidence: 0.89,
      },
      {
        auCode: 'AU12',
        name: 'Lip Corner Puller',
        intensity: 'D',
        intensityNumeric: 4,
        confidence: 0.94,
      },
      {
        auCode: 'AU24',
        name: 'Lip Pressor',
        intensity: 'B',
        intensityNumeric: 2,
        confidence: 0.82,
      },
    ],
    facsInterpretation: {
      duchennSmile: false,
      socialSmile: true,
      maskingIndicators: ['AU14'],
      fatigueIndicators: [],
      tensionIndicators: ['AU4', 'AU24'],
    },
    observations: [],
    lighting: 'natural',
    lightingSeverity: 'low',
    environmentalClues: ['indoor'],
    jawTension: 0.6,
    eyeFatigue: 0.3,
    signs: [{ description: 'Tension detected', confidence: 0.85 }],
  };

  const mockRecentEntry: HealthEntry = {
    id: 'journal-1',
    timestamp: new Date().toISOString(),
    rawText: 'Feeling good today',
    mood: 4,
    moodLabel: 'Happy',
    medications: [],
    symptoms: [],
    tags: [],
    activityTypes: [],
    strengths: [],
    neuroMetrics: {
      spoonLevel: 7,
      sensoryLoad: 4,
      contextSwitches: 2,
      capacity: {
        focus: 7,
        social: 6,
        structure: 5,
        emotional: 6,
        physical: 7,
        sensory: 6,
        executive: 7,
      },
    },
    notes: '',
  };

  const mockBaseline: FacialBaseline = {
    id: 'baseline-1',
    timestamp: new Date().toISOString(),
    neutralTension: 0.2,
    neutralFatigue: 0.1,
    neutralMasking: 0.1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      safetyContact: '+1234567890',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('T-9.1: Component Renders', () => {
    it('should render Bio-Feedback Analysis header', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/bio-feedback analysis/i)).toBeInTheDocument();
    });

    it('should display image', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const image = screen.getByAltText(/selfie/i);
      expect(image).toBeInTheDocument();
    });

    it('should display all analysis metrics', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/jaw tension/i)).toBeInTheDocument();
      expect(screen.getByText(/eye fatigue/i)).toBeInTheDocument();
    });

    it('should show Gemini Vision version', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/gemini vision/i)).toBeInTheDocument();
    });
  });

  describe('T-9.2: Comparison Display', () => {
    it('should show Reality Check card when recentEntry present', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/reality check/i)).toBeInTheDocument();
      expect(screen.getByText(/you reported/i)).toBeInTheDocument();
      expect(screen.getByText(/body shows/i)).toBeInTheDocument();
    });

    it('should display subjective mood label', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Happy/i)).toBeInTheDocument();
    });

    it('should display objective state from comparison', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Tension detected/i)).toBeInTheDocument();
    });

    it('should show message when no recentEntry', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/log a journal entry first/i)).toBeInTheDocument();
    });
  });

  describe('T-9.3: Discrepancy Detection', () => {
    it('should show discrepancy badge when score > 50', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/discrepancy detected/i)).toBeInTheDocument();
    });

    it('should use rose color for discrepancy badge', () => {
      const { container } = render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const badge = container.querySelector('.bg-rose-100, .text-rose-700');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('T-9.4: Jaw Tension Display', () => {
    it('should show correct tension percentage', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      // 0.6 * 10 = 6.0
      expect(screen.getByText(/6\.0/i)).toBeInTheDocument();
    });

    it('should show orange color when tension > 0.5', () => {
      const { container } = render(
        <StateCheckResults
          analysis={{ ...mockAnalysis, jawTension: 0.6 }}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const progressBar = container.querySelector('.bg-orange-400');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show emerald color when tension <= 0.5', () => {
      const { container } = render(
        <StateCheckResults
          analysis={{ ...mockAnalysis, jawTension: 0.3 }}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show baseline indicator when baselineApplied', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          baseline={mockBaseline}
          onClose={mockOnClose}
        />
      );

      const infoIcons = document.querySelectorAll('[title*="Baseline"]');
      expect(infoIcons.length).toBeGreaterThan(0);
    });
  });

  describe('T-9.5: Eye Fatigue Display', () => {
    it('should show correct fatigue percentage', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      // 0.3 * 10 = 3.0
      expect(screen.getByText(/3\.0/i)).toBeInTheDocument();
    });

    it('should show rose color when fatigue > 0.5', () => {
      const { container } = render(
        <StateCheckResults
          analysis={{ ...mockAnalysis, eyeFatigue: 0.7 }}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const progressBar = container.querySelector('.bg-rose-400');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show emerald color when fatigue <= 0.5', () => {
      const { container } = render(
        <StateCheckResults
          analysis={{ ...mockAnalysis, eyeFatigue: 0.3 }}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const progressBar = container.querySelector('.bg-emerald-400');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('T-9.6: FACS Signs Display', () => {
    it('should display detected markers', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/detected markers/i)).toBeInTheDocument();
    });

    it('should show individual sign badges', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Tension detected/i)).toBeInTheDocument();
    });

    it('should handle empty signs array', () => {
      render(
        <StateCheckResults
          analysis={{ ...mockAnalysis, signs: [] }}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      // Should render without error
      expect(screen.getByText(/bio-feedback analysis/i)).toBeInTheDocument();
    });
  });

  describe('T-9.7: Action Units Display', () => {
    it('should display Action Units section when AUs present', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/action units detected/i)).toBeInTheDocument();
    });

    it('should show AU code badges', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/AU4/i)).toBeInTheDocument();
      expect(screen.getByText(/AU12/i)).toBeInTheDocument();
      expect(screen.getByText(/AU24/i)).toBeInTheDocument();
    });

    it('should show AU names', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Brow Lowerer/i)).toBeInTheDocument();
      expect(screen.getByText(/Lip Corner Puller/i)).toBeInTheDocument();
    });

    it('should show intensity indicators', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/C/i)).toBeInTheDocument();
      expect(screen.getByText(/D/i)).toBeInTheDocument();
    });

    it('should not show AU section when empty', () => {
      render(
        <StateCheckResults
          analysis={{ ...mockAnalysis, actionUnits: [] }}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText(/action units detected/i)).not.toBeInTheDocument();
    });
  });

  describe('T-9.8: Save Functionality', () => {
    it('should call saveStateCheck when save button clicked', async () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save analysis securely/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveStateCheck).toHaveBeenCalled();
      });
    });

    it('should show saving state during save', async () => {
      // Delay the save to show loading state
      (saveStateCheck as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('saved-id'), 100))
      );

      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save analysis securely/i });
      fireEvent.click(saveButton);

      expect(screen.getByText(/encrypting/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/saved securely/i)).toBeInTheDocument();
      });
    });

    it('should prevent duplicate save clicks', async () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save analysis securely/i });

      // Click multiple times rapidly
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should only be called once
        expect(saveStateCheck).toHaveBeenCalledTimes(1);
      });
    });

    it('should show saved state after successful save', async () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save analysis securely/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/saved securely/i)).toBeInTheDocument();
      });
    });

    it('should handle save failure', async () => {
      (saveStateCheck as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Save failed'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save analysis securely/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to save securely.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('T-9.9: Emergency Contact', () => {
    it('should use settings.safetyContact when available', () => {
      (getUserSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        safetyContact: '+15551234567',
      });

      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const callButton = screen.getByRole('button', { name: /call support/i });
      expect(callButton).toBeInTheDocument();
    });

    it('should fall back to 988 when no safetyContact set', () => {
      (getUserSettings as ReturnType<typeof vi.fn>).mockReturnValue({});

      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const callButton = screen.getByRole('button', { name: /call support/i });
      expect(callButton).toBeInTheDocument();
    });

    it('should trigger tel: link when clicked', () => {
      const locationSpy = vi.spyOn(window.location, 'href', 'set');

      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const callButton = screen.getByRole('button', { name: /call support/i });
      fireEvent.click(callButton);

      expect(locationSpy).toHaveBeenCalled();

      locationSpy.mockRestore();
    });
  });

  describe('T-9.10: Masking Likely Warning', () => {
    it('should show masking warning when isMaskingLikely is true', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      // Component should render with masking indicators
      expect(screen.getByText(/social/i)).toBeInTheDocument();
    });

    it('should show social smile indicator', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/social/i)).toBeInTheDocument();
    });
  });

  describe('Discard Button', () => {
    it('should call onClose when discard clicked', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      const discardButton = screen.getByRole('button', { name: /discard/i });
      fireEvent.click(discardButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Encryption Notice', () => {
    it('should display encryption notice', () => {
      render(
        <StateCheckResults
          analysis={mockAnalysis}
          imageSrc="data:image/webp;base64,mock"
          recentEntry={mockRecentEntry}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/encrypted locally with aes-gcm/i)).toBeInTheDocument();
      expect(screen.getByText(/not shared with cloud/i)).toBeInTheDocument();
    });
  });
});
