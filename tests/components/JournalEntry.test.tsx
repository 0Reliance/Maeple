import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import JournalEntry from '../../components/JournalEntry';
import * as geminiService from '../../services/geminiService';

// Mock dependencies
vi.mock('../../components/RecordVoiceButton', () => ({
  default: ({ onTranscript }: { onTranscript: (text: string) => void }) => (
    <button onClick={() => onTranscript('Hello world')}>Mock Voice Button</button>
  )
}));

vi.mock('../../services/geminiService', () => ({
  parseJournalEntry: vi.fn()
}));

describe('JournalEntry Component', () => {
  const mockOnEntryAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<JournalEntry onEntryAdded={mockOnEntryAdded} />);
    expect(screen.getByPlaceholderText(/What's happening/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capture/i })).toBeInTheDocument();
  });

  it('updates text input', () => {
    render(<JournalEntry onEntryAdded={mockOnEntryAdded} />);
    const textarea = screen.getByPlaceholderText(/What's happening/i);
    fireEvent.change(textarea, { target: { value: 'I am feeling great' } });
    expect(textarea).toHaveValue('I am feeling great');
  });

  it('handles voice input', () => {
    render(<JournalEntry onEntryAdded={mockOnEntryAdded} />);
    const voiceBtn = screen.getByText('Mock Voice Button');
    fireEvent.click(voiceBtn);
    expect(screen.getByPlaceholderText(/What's happening/i)).toHaveValue('Hello world');
  });

  it('submits entry successfully', async () => {
    const mockParsedResponse = {
      moodScore: 8,
      moodLabel: 'Happy',
      medications: [],
      symptoms: [],
      activityTypes: [],
      strengths: [],
      neuroMetrics: {
        sensoryLoad: 3,
        contextSwitches: 2,
        maskingScore: 1
      },
      summary: 'User is happy',
      strategies: [],
      analysisReasoning: 'Good mood detected'
    };

    (geminiService.parseJournalEntry as any).mockResolvedValue(mockParsedResponse);

    render(<JournalEntry onEntryAdded={mockOnEntryAdded} />);
    
    // Type something
    const textarea = screen.getByPlaceholderText(/What's happening/i);
    fireEvent.change(textarea, { target: { value: 'I am feeling great' } });
    
    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Capture/i });
    fireEvent.click(submitBtn);
    
    // Check loading state
    expect(screen.getByText(/Parsing/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockOnEntryAdded).toHaveBeenCalledTimes(1);
      const calledArg = mockOnEntryAdded.mock.calls[0][0];
      expect(calledArg.rawText).toBe('I am feeling great');
      expect(calledArg.mood).toBe(8);
    });
  });

  it('handles submission error', async () => {
    (geminiService.parseJournalEntry as any).mockRejectedValue(new Error('API Error'));
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<JournalEntry onEntryAdded={mockOnEntryAdded} />);
    
    const textarea = screen.getByPlaceholderText(/What's happening/i);
    fireEvent.change(textarea, { target: { value: 'Error test' } });
    
    const submitBtn = screen.getByRole('button', { name: /Capture/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Failed to analyze entry. Please try again.");
    });
    
    alertMock.mockRestore();
    consoleMock.mockRestore();
  });
});
