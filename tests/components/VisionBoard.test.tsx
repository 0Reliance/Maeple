import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VisionBoard from '../../components/VisionBoard';
import * as geminiVisionService from '../../services/geminiVisionService';
import * as storageService from '../../services/storageService';

// Mock services
vi.mock('../../services/geminiVisionService', () => ({
  generateOrEditImage: vi.fn(),
}));

vi.mock('../../services/storageService', () => ({
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
    neuroMetrics: { spoonLevel: 5, sensoryLoad: 8, contextSwitches: 2, maskingScore: 1, capacity: {} as any },
    notes: 'Feeling good',
    rawText: 'Feeling good'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (storageService.getEntries as any).mockReturnValue([mockEntry]);
  });

  it('renders initial state correctly', () => {
    render(<VisionBoard />);
    expect(screen.getByText('Visual Therapy AI')).toBeInTheDocument();
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
    (geminiVisionService.generateOrEditImage as any).mockResolvedValue(mockImage);

    render(<VisionBoard />);
    
    const input = screen.getByPlaceholderText(/Describe what you want to visualize/);
    fireEvent.change(input, { target: { value: 'A beautiful sunset' } });
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(geminiVisionService.generateOrEditImage).toHaveBeenCalledWith('A beautiful sunset', undefined);
    });

    await waitFor(() => {
      const img = screen.getByAltText('Generated');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', mockImage);
    });
  });

  it('handles generation error', async () => {
    (geminiVisionService.generateOrEditImage as any).mockRejectedValue(new Error('Failed'));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<VisionBoard />);
    
    const input = screen.getByPlaceholderText(/Describe what you want to visualize/);
    fireEvent.change(input, { target: { value: 'A beautiful sunset' } });
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to generate image. Please try again.');
    });
  });
});
