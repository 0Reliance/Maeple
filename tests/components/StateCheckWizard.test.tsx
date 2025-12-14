import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StateCheckWizard from '../../components/StateCheckWizard';
import * as geminiVisionService from '../../services/geminiVisionService';
import * as stateCheckService from '../../services/stateCheckService';
import * as storageService from '../../services/storageService';

// Mock dependencies
vi.mock('../../components/StateCheckCamera', () => ({
  default: ({ onCapture, onCancel }: { onCapture: (src: string) => void, onCancel: () => void }) => (
    <div data-testid="camera">
      <button onClick={() => onCapture('data:image/jpeg;base64,test')}>Capture</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock('../../components/StateCheckResults', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="results">
      Results
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../services/geminiVisionService', () => ({
  analyzeStateFromImage: vi.fn()
}));

vi.mock('../../services/stateCheckService', () => ({
  getBaseline: vi.fn()
}));

vi.mock('../../services/storageService', () => ({
  getEntries: vi.fn()
}));

describe('StateCheckWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storageService.getEntries as any).mockReturnValue([]);
    (stateCheckService.getBaseline as any).mockResolvedValue(null);
  });

  it('renders intro screen', () => {
    render(<StateCheckWizard />);
    expect(screen.getByText('Bio-Mirror')).toBeInTheDocument();
    expect(screen.getByText(/Use AI Vision to detect/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Check/i })).toBeInTheDocument();
  });

  it('switches to camera on start', () => {
    render(<StateCheckWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Start Check/i }));
    expect(screen.getByTestId('camera')).toBeInTheDocument();
  });

  it('handles image capture and analysis', async () => {
    const mockAnalysis = {
      fatigueScore: 7,
      stressScore: 5,
      maskingScore: 3,
      emotionalState: 'Tired',
      physicalSigns: ['Droopy eyes'],
      recommendations: ['Rest']
    };
    (geminiVisionService.analyzeStateFromImage as any).mockResolvedValue(mockAnalysis);

    render(<StateCheckWizard />);
    
    // Start
    fireEvent.click(screen.getByRole('button', { name: /Start Check/i }));
    
    // Capture
    fireEvent.click(screen.getByText('Capture'));
    
    // Check loading
    expect(screen.getByText('Analyzing Bio-Signals...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });
  });

  it('handles analysis error', async () => {
    (geminiVisionService.analyzeStateFromImage as any).mockRejectedValue(new Error('Analysis failed'));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<StateCheckWizard />);
    
    // Start
    fireEvent.click(screen.getByRole('button', { name: /Start Check/i }));
    
    // Capture
    fireEvent.click(screen.getByText('Capture'));
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Analysis failed. Please try again.");
      expect(screen.getByText('Bio-Mirror')).toBeInTheDocument(); // Should return to intro
    });
    
    alertMock.mockRestore();
  });
});
