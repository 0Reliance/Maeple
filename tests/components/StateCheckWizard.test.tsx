import React from 'react';
import { render, screen, fireEvent, waitFor, mockDependencies } from '../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StateCheckWizard from '../../src/components/StateCheckWizard';
import * as stateCheckService from '../../src/services/stateCheckService';
import * as storageService from '../../src/services/storageService';

// Mock dependencies
vi.mock('../../src/components/BiofeedbackCameraModal', () => ({
  default: ({ isOpen, onCapture, onCancel }: { isOpen: boolean, onCapture: (src: string) => void, onCancel: () => void }) => (
    isOpen ? (
      <div data-testid="camera">
        <button onClick={() => onCapture('data:image/jpeg;base64,test')}>Capture</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  )
}));

vi.mock('../../src/components/StateCheckResults', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="results">
      Results
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../src/services/stateCheckService', () => ({
  getBaseline: vi.fn()
}));

vi.mock('../../src/services/storageService', () => ({
  getEntries: vi.fn()
}));

describe('StateCheckWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storageService.getEntries as any).mockReturnValue([]);
    (stateCheckService.getBaseline as any).mockResolvedValue(null);
    // Reset vision service mock
    (mockDependencies.visionService.analyzeFromImage as any).mockReset();
    (mockDependencies.visionService.onStateChange as any).mockReturnValue(() => {});
    (mockDependencies.visionService.getState as any).mockReturnValue('CLOSED');
  });

  it('renders intro screen', () => {
    render(<StateCheckWizard />);
    expect(screen.getByText('Bio-Mirror Check')).toBeInTheDocument();
    expect(screen.getByText(/Objectively analyze your physical signs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Bio-Mirror/i })).toBeInTheDocument();
  });

  it('switches to camera on start', () => {
    render(<StateCheckWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    expect(screen.getByTestId('camera')).toBeInTheDocument();
  });

  it('handles image capture and analysis', async () => {
    const mockAnalysis = {
      fatigueScore: 7,
      stressScore: 5,
      emotionalState: 'Tired',
      physicalSigns: ['Droopy eyes'],
      recommendations: ['Rest']
    };
    
    // Mock the context service instead of the module
    (mockDependencies.visionService.analyzeFromImage as any).mockResolvedValue(mockAnalysis);

    render(<StateCheckWizard />);
    
    // Start
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    
    // Capture
    fireEvent.click(screen.getByText('Capture'));
    
    // Check loading
    expect(screen.getByText('Analyzing Bio-Signals...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });
  });

  it('handles analysis error', async () => {
    (mockDependencies.visionService.analyzeFromImage as any).mockRejectedValue(new Error('Analysis failed'));

    render(<StateCheckWizard />);
    
    // Start
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    
    // Capture
    fireEvent.click(screen.getByText('Capture'));
    
    await waitFor(() => {
      expect(screen.getByText('Bio-Mirror Check Failed')).toBeInTheDocument();
      expect(screen.getByText('Analysis failed. Please try again.')).toBeInTheDocument();
    });
  });
});
