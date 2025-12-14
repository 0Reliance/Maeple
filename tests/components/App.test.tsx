import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';
import { useAppStore } from '../../stores';
import { View } from '../../types';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
} as any;

// Mock lazy loaded components to avoid suspense issues in tests
vi.mock('../../components/LiveCoach', () => ({ default: () => <div data-testid="live-coach">Live Coach</div> }));
vi.mock('../../components/VisionBoard', () => ({ default: () => <div data-testid="vision-board">Vision Board</div> }));
vi.mock('../../components/StateCheckWizard', () => ({ default: () => <div data-testid="state-check">State Check</div> }));
vi.mock('../../components/Settings', () => ({ default: () => <div data-testid="settings">Settings</div> }));
vi.mock('../../components/ClinicalReport', () => ({ default: () => <div data-testid="clinical-report">Clinical Report</div> }));

describe('App Navigation', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentView: View.JOURNAL,
      entries: [],
      wearableData: [],
      mobileMenuOpen: false,
      showOnboarding: false,
      isInitialized: true
    });
    
    // Reset URL
    window.history.pushState({}, 'Test page', '/');
  });

  it('renders Journal by default', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/MAEPLE Journal/i)).toBeInTheDocument();
    });
  });

  it('navigates to Dashboard', async () => {
    render(<App />);
    
    // Find the button in the sidebar
    const dashboardBtn = screen.getAllByText('Pattern Dashboard')[0];
    fireEvent.click(dashboardBtn);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Pattern Dashboard/i)[0]).toBeInTheDocument();
    });
  });

  it('navigates to Settings', async () => {
    render(<App />);
    
    const settingsBtn = screen.getAllByText('Settings')[0];
    fireEvent.click(settingsBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('settings')).toBeInTheDocument();
    });
  });
  
  it('navigates to Bio-Mirror', async () => {
    render(<App />);
    
    const bioBtn = screen.getAllByText('Bio-Mirror (State Check)')[0];
    fireEvent.click(bioBtn);
    
    await waitFor(() => {
      expect(screen.getByTestId('state-check')).toBeInTheDocument();
    });
  });
});
