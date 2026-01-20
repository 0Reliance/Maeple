import { render, screen, fireEvent, waitFor, mockDependencies } from '../test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LiveCoach from '../../src/components/LiveCoach';

// Mock MediaDevices
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
});

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

describe('LiveCoach Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockDependencies.aiService.analyzeAudio as any).mockReset();
    (mockDependencies.aiService.onStateChange as any).mockReturnValue(() => {});
    (mockDependencies.aiService.getState as any).mockReturnValue('CLOSED');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<LiveCoach />);
    expect(screen.getByText('Mae Live Companion')).toBeInTheDocument();
    expect(screen.getByText(/Real-time, voice-first reflection/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument(); // Mic button
  });

  it('starts session when mic is clicked', async () => {
    render(<LiveCoach />);
    
    const micButton = screen.getByRole('button');
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });
  });
});
