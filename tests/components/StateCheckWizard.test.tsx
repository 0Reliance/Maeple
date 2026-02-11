import { beforeEach, describe, expect, it, vi } from 'vitest';
import StateCheckWizard from '../../src/components/StateCheckWizard';
import * as stateCheckService from '../../src/services/stateCheckService';
import * as storageService from '../../src/services/storageService';
import { createMockDependencies, fireEvent, renderWithDependencies, screen, waitFor } from '../test-utils';

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
  default: ({ analysis, onClose }: { analysis: any, onClose: () => void }) => (
    <div data-testid="results">
      Results {analysis?.emotionalState || ''}
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
  let testDependencies: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    vi.clearAllMocks();
    (storageService.getEntries as any).mockReturnValue([]);
    (stateCheckService.getBaseline as any).mockResolvedValue(null);
    
    // Create fresh mock dependencies for each test
    testDependencies = createMockDependencies();
  });

  it('renders intro screen', () => {
    renderWithDependencies(<StateCheckWizard />, { dependencies: testDependencies });
    expect(screen.getByText('Bio-Mirror Check')).toBeInTheDocument();
    expect(screen.getByText(/Objectively analyze your physical signs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Bio-Mirror/i })).toBeInTheDocument();
  });

  it('switches to camera on start', () => {
    renderWithDependencies(<StateCheckWizard />, { dependencies: testDependencies });
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    expect(screen.getByTestId('camera')).toBeInTheDocument();
  });

  it('handles image capture and analysis', async () => {
    const mockAnalysis = {
      confidence: 0.8,
      actionUnits: [],
      facsInterpretation: {
        duchennSmile: false,
        socialSmile: false,
        maskingIndicators: [],
        fatigueIndicators: [],
        tensionIndicators: []
      },
      observations: [
         { category: 'physical', value: 'Droopy eyes', evidence: 'Visual', severity: 'low' }
      ],
      lighting: 'moderate',
      // Legacy fields if needed by component, though mostly unused now
      emotionalState: 'Tired',
    };
    
    // Mock the vision service for this test - use a longer timeout for analysis simulation
    testDependencies.visionService.analyzeFromImage = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockAnalysis), 100))
    );
    testDependencies.visionService.onStateChange = vi.fn().mockReturnValue(() => {});
    testDependencies.visionService.getState = vi.fn().mockReturnValue('CLOSED');

    renderWithDependencies(<StateCheckWizard />, { dependencies: testDependencies });
    
    // Start
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    
    // Capture
    fireEvent.click(screen.getByText('Capture'));
    
    // Check loading - the text is "Analyzing Bio-Signals" without the ellipsis
    expect(screen.getByText('Analyzing Bio-Signals')).toBeInTheDocument();
    
    // Wait for analysis to complete - StateCheckAnalyzing has built-in delays totaling ~14s
    // We need to wait for the onComplete callback to be called
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    }, { timeout: 20000 });
  }, 25000);

  it('calls analyzeFromImage only once per capture', async () => {
    const mockAnalysis = { confidence: 0.9, actionUnits: [], emotionalState: 'Neutral' };
    testDependencies.visionService.analyzeFromImage = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockAnalysis), 100))
    );
    testDependencies.visionService.onStateChange = vi.fn().mockReturnValue(() => {});
    testDependencies.visionService.getState = vi.fn().mockReturnValue('CLOSED');

    renderWithDependencies(<StateCheckWizard />, { dependencies: testDependencies });
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    fireEvent.click(screen.getByText('Capture'));

    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    }, { timeout: 20000 });

    expect(testDependencies.visionService.analyzeFromImage).toHaveBeenCalledTimes(1);
  }, 25000);

  it('handles analysis error', async () => {
    testDependencies.visionService.analyzeFromImage = vi.fn().mockImplementation(() => 
      new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis failed')), 100))
    );
    testDependencies.visionService.onStateChange = vi.fn().mockReturnValue(() => {});
    testDependencies.visionService.getState = vi.fn().mockReturnValue('CLOSED');

    renderWithDependencies(<StateCheckWizard />, { dependencies: testDependencies });
    
    // Start
    fireEvent.click(screen.getByRole('button', { name: /Open Bio-Mirror/i }));
    
    // Capture
    fireEvent.click(screen.getByText('Capture'));
    
    // After analysis fails, the component calls onComplete with error
    // which then shows results with empty data (not error screen)
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    }, { timeout: 20000 });
  }, 25000);
});
