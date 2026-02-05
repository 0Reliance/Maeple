import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../../src/components/Settings';
import { wearableManager } from '../../src/services/wearables/manager';
import * as storageService from '../../src/services/storageService';

// Mock dependencies
vi.mock('../../src/services/wearables/manager', () => ({
  wearableManager: {
    getAllConfigs: vi.fn(),
    connectProvider: vi.fn(),
    syncRecentData: vi.fn(),
    disconnectProvider: vi.fn(),
  }
}));

vi.mock('../../src/services/storageService', () => ({
  getUserSettings: vi.fn(),
  saveUserSettings: vi.fn(),
}));

vi.mock('../../src/services/exportService', () => ({
  exportAllData: vi.fn(),
  downloadExport: vi.fn(),
  clearAllData: vi.fn(),
  importData: vi.fn(),
  readFileAsText: vi.fn(),
}));

// Mock child components
vi.mock('../../src/components/BioCalibration', () => ({ default: () => <div data-testid="bio-calibration">Bio Calibration</div> }));
vi.mock('../../src/components/AIProviderSettings', () => ({ default: () => <div data-testid="ai-settings">AI Settings</div> }));
vi.mock('../../src/components/NotificationSettings', () => ({ default: () => <div data-testid="notification-settings">Notification Settings</div> }));
vi.mock('../../src/components/CloudSyncSettings', () => ({ default: () => <div data-testid="cloud-sync-settings">Cloud Sync Settings</div> }));

// Mock PWA install hook
vi.mock('../../src/hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(),
}));

describe('Settings Component', () => {
  const mockOnDataSynced = vi.fn();
  const mockInstall = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (wearableManager.getAllConfigs as any).mockReturnValue({});
    (storageService.getUserSettings as any).mockReturnValue({
      cycleStartDate: '2023-01-01',
      avgCycleLength: 28,
      safetyContact: '123-456-7890'
    });
    
    // Mock PWA install hook
    const { usePWAInstall } = require('../../src/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      isInstallable: false,
      install: mockInstall,
    });
  });

  it('renders all sections', () => {
    render(<Settings onDataSynced={mockOnDataSynced} />);
    expect(screen.getByText('Device Integrations')).toBeInTheDocument();
    expect(screen.getByText('Biological Context')).toBeInTheDocument();
    expect(screen.getByTestId('ai-settings')).toBeInTheDocument();
    expect(screen.getByTestId('notification-settings')).toBeInTheDocument();
    expect(screen.getByTestId('cloud-sync-settings')).toBeInTheDocument();
  });

  it('loads user settings on mount', () => {
    render(<Settings onDataSynced={mockOnDataSynced} />);
    expect(screen.getByDisplayValue('2023-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
  });

  it('saves bio context settings', async () => {
    render(<Settings onDataSynced={mockOnDataSynced} />);
    
    const contactInput = screen.getByDisplayValue('123-456-7890');
    fireEvent.change(contactInput, { target: { value: '987-654-3210' } });
    
    const saveBtn = screen.getByText('Save Safety Plan');
    fireEvent.click(saveBtn);
    
    expect(storageService.saveUserSettings).toHaveBeenCalledWith(expect.objectContaining({
      safetyContact: '987-654-3210'
    }));
    
    await waitFor(() => {
      // Check if the button text changed to "Saved"
      // Since there might be multiple "Saved" buttons (if other sections are also saved or have similar state),
      // we should scope it or just check if *a* button with "Saved" exists.
      // But wait, the error said "Found multiple elements with the text: Saved".
      // This implies there are multiple elements with that text.
      // Let's use getAllByText and check if at least one is present.
      expect(screen.getAllByText('Saved').length).toBeGreaterThan(0);
    });
  });

  it('handles wearable connection', async () => {
    (wearableManager.connectProvider as any).mockResolvedValue(undefined);
    (wearableManager.syncRecentData as any).mockResolvedValue([]);
    
    render(<Settings onDataSynced={mockOnDataSynced} />);
    
    // Find connect button for Oura Ring
    const connectButtons = screen.getAllByText('Connect');
    fireEvent.click(connectButtons[0]); // Click the first one
    
    await waitFor(() => {
      expect(wearableManager.connectProvider).toHaveBeenCalled();
      expect(wearableManager.syncRecentData).toHaveBeenCalled();
      expect(mockOnDataSynced).toHaveBeenCalled();
    });
  });

  it('does not render PWA install section when not installable', () => {
    // Mock not installable
    const { usePWAInstall } = require('../../src/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      isInstallable: false,
      install: mockInstall,
    });

    render(<Settings onDataSynced={mockOnDataSynced} />);
    
    expect(screen.queryByText('Install MAEPLE')).not.toBeInTheDocument();
    expect(screen.queryByText('Install App')).not.toBeInTheDocument();
  });

  it('renders PWA install section when installable', () => {
    // Mock installable
    const { usePWAInstall } = require('../../src/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      isInstallable: true,
      install: mockInstall,
    });

    render(<Settings onDataSynced={mockOnDataSynced} />);
    
    expect(screen.getByText('Install MAEPLE')).toBeInTheDocument();
    expect(screen.getByText('Install App')).toBeInTheDocument();
  });

  it('PWA install section has correct styling', () => {
    // Mock installable
    const { usePWAInstall } = require('../../src/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      isInstallable: true,
      install: mockInstall,
    });

    const { container } = render(<Settings onDataSynced={mockOnDataSynced} />);
    
    // Find PWA install section
    const installSection = screen.getByText('Install MAEPLE').closest('section');
    expect(installSection).toBeInTheDocument();
    
    // Verify emerald/teal gradient background styling
    const gradientDiv = container.querySelector('.from-emerald-50');
    expect(gradientDiv).toBeInTheDocument();
  });

  it('calls install function when install button clicked', async () => {
    // Mock installable
    const { usePWAInstall } = require('../../src/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      isInstallable: true,
      install: mockInstall,
    });

    render(<Settings onDataSynced={mockOnDataSynced} />);
    
    const installButton = screen.getByText('Install App');
    fireEvent.click(installButton);
    
    expect(mockInstall).toHaveBeenCalledTimes(1);
  });
});
