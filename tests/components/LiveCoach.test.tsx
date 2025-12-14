import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LiveCoach from '../../components/LiveCoach';
import { aiRouter } from '../../services/ai/router';
import * as aiService from '../../services/ai';

// Mock services
vi.mock('../../services/ai/router', () => ({
  aiRouter: {
    connectLive: vi.fn(),
  },
}));

vi.mock('../../services/ai', () => ({
  canUseAudio: vi.fn(),
}));

// Mock AudioContext
class MockAudioContext {
  resume = vi.fn().mockResolvedValue(undefined);
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  createScriptProcessor = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  });
  close = vi.fn().mockResolvedValue(undefined);
  decodeAudioData = vi.fn();
  createBufferSource = vi.fn().mockReturnValue({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  });
}

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

// Mock window.AudioContext
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;

describe('LiveCoach Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to true
    (aiService.canUseAudio as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<LiveCoach />);
    expect(screen.getByText('Mae Live Coach')).toBeInTheDocument();
    expect(screen.getByText('Tap the mic, allow access, and start talking.')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument(); // Mic button
  });

  it('disables button if audio is not capable', async () => {
    (aiService.canUseAudio as any).mockReturnValue(false);
    
    render(<LiveCoach />);
    
    const micButton = screen.getByRole('button');
    expect(micButton).toBeDisabled();
  });

  it('starts session when mic is clicked', async () => {
    const mockConnect = vi.fn().mockResolvedValue({
      sendAudio: vi.fn(),
      disconnect: vi.fn(),
    });
    (aiRouter.connectLive as any).mockImplementation(mockConnect);

    render(<LiveCoach />);
    
    const micButton = screen.getByRole('button');
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(screen.getByText(/Requesting microphone/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
      expect(aiRouter.connectLive).toHaveBeenCalled();
    });
  });

  it('handles connection error', async () => {
    (aiRouter.connectLive as any).mockRejectedValue(new Error('Connection failed'));

    render(<LiveCoach />);
    
    const micButton = screen.getByRole('button');
    fireEvent.click(micButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to connect/)).toBeInTheDocument();
    });
  });
});
