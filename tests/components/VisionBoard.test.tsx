import { render, screen, fireEvent, waitFor, mockDependencies } from '../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VisionBoard from '../../src/components/VisionBoard';
import * as storageService from '../../src/services/storageService';

// Mock services
vi.mock('../../src/services/storageService', () => ({
  getEntries: vi.fn(),
}));

describe('VisionBoard Component', () => {
  const mockEntry = {
    id: '1',
    timestamp: new Date().toISOString(),
    mood: 4,
    moodLabel: 'Good',
    medications: [],
    symptoms: [],
    tags: [],
    activityTypes: [],
    strengths: ['Creativity'],
    neuroMetrics: { spoonLevel: 5, sensoryLoad: 8, contextSwitches: 2, capacity: {} as any },
    notes: 'Feeling good',
    rawText: 'Feeling good'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (storageService.getEntries as any).mockReturnValue([mockEntry]);
    // Reset mock dependencies
    mockDependencies.visionService.generateImage.mockReset();
    mockDependencies.visionService.generateImage.mockResolvedValue('base64-image-data');
  });

  it('renders initial state correctly', () => {
    render(<VisionBoard />);
    expect(screen.getByText('Visual Therapy')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what you want to visualize/)).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('loads recent entry and shows smart prompts', () => {
    render(<VisionBoard />);
    expect(screen.getByText('Suggested for your current state')).toBeInTheDocument();
    expect(screen.getByText(/Visualize "Good"/)).toBeInTheDocument();
    expect(screen.getByText(/Generate a Sensory Sanctuary/)).toBeInTheDocument(); // Because sensoryLoad > 6
    expect(screen.getByText(/Creativity/)).toBeInTheDocument(); // Strength
  });

  it('populates prompt when smart prompt is clicked', () => {
    render(<VisionBoard />);
    const promptButton = screen.getByText(/Visualize "Good"/);
    fireEvent.click(promptButton);
    
    const input = screen.getByPlaceholderText(/Describe what you want to visualize/) as HTMLTextAreaElement;
    expect(input.value).toContain('Good');
  });

  it('generates image when generate button is clicked', async () => {
    const mockImage = 'data:image/png;base64,fakeimage';
    mockDependencies.visionService.generateImage.mockResolvedValue(mockImage);

    render(<VisionBoard />);
    
    const input = screen.getByPlaceholderText(/Describe what you want to visualize/);
    fireEvent.change(input, { target: { value: 'A beautiful sunset' } });
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockDependencies.visionService.generateImage).toHaveBeenCalledWith('A beautiful sunset', undefined);
    });

    await waitFor(() => {
      const img = screen.getByAltText('Generated');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockImage);
    });
  });

  it('handles generation error', async () => {
    mockDependencies.visionService.generateImage.mockRejectedValue(new Error('Failed to generate'));
    
    render(<VisionBoard />);
    
    const input = screen.getByPlaceholderText(/Describe what you want to visualize/);
    fireEvent.change(input, { target: { value: 'A beautiful sunset' } });
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
    });
  });
});
