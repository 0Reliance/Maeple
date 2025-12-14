import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthModal from '../../components/AuthModal';
import * as authService from '../../services/authService';

// Mock auth service
vi.mock('../../services/authService', () => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithMagicLink: vi.fn(),
}));

describe('AuthModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<AuthModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('renders Sign In form by default', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('switches to Sign Up mode', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const signUpLink = screen.getByText("Don't have an account? Sign up");
    fireEvent.click(signUpLink);
    
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('switches to Magic Link mode', () => {
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    const magicLink = screen.getByText("Sign in with magic link instead");
    fireEvent.click(magicLink);
    
    expect(screen.getByRole('heading', { name: 'Magic Link' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();
  });

  it('handles Sign In submission', async () => {
    (authService.signInWithEmail as any).mockResolvedValue({ user: { id: '123' }, error: null });
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    await waitFor(() => {
      expect(authService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles Sign Up submission', async () => {
    (authService.signUpWithEmail as any).mockResolvedValue({ user: { id: '123' }, error: null });
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    
    await waitFor(() => {
      expect(authService.signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles Magic Link submission', async () => {
    (authService.signInWithMagicLink as any).mockResolvedValue({ error: null });
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    fireEvent.click(screen.getByText("Sign in with magic link instead"));
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Send Magic Link' }));
    
    await waitFor(() => {
      expect(authService.signInWithMagicLink).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText('Check your email!')).toBeInTheDocument();
    });
  });

  it('displays error messages', async () => {
    (authService.signInWithEmail as any).mockResolvedValue({ user: null, error: { message: 'Invalid credentials' } });
    
    render(<AuthModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
