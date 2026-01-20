import React from 'react';
import { render, screen } from '../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthMetricsDashboard from '../../src/components/HealthMetricsDashboard';
import * as storageService from '../../src/services/storageService';
import * as analyticsService from '../../src/services/analytics';

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Bar: () => <div />,
  Legend: () => <div />,
  Line: () => <div />,
  ReferenceArea: () => <div />,
}));

// Mock services
vi.mock('../../src/services/storageService', () => ({
  getUserSettings: vi.fn(),
}));

vi.mock('../../src/services/analytics', () => ({
  generateInsights: vi.fn(),
  generateDailyStrategy: vi.fn(),
  calculateBurnoutTrajectory: vi.fn(),
  calculateCognitiveLoad: vi.fn(),
  calculateCyclePhase: vi.fn(),
}));

describe('HealthMetricsDashboard Component', () => {
  const mockEntries = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      mood: 4,
      moodLabel: 'Good',
      medications: [],
      symptoms: [],
      tags: [],
      activityTypes: [],
      strengths: [],
      neuroMetrics: { spoonLevel: 5, sensoryLoad: 3, contextSwitches: 2, capacity: {} as any },
      notes: 'Feeling good',
      rawText: 'Feeling good'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      mood: 3,
      moodLabel: 'Okay',
      medications: [],
      symptoms: [],
      tags: [],
      activityTypes: [],
      strengths: [],
      neuroMetrics: { spoonLevel: 4, sensoryLoad: 4, contextSwitches: 3, capacity: {} as any },
      notes: 'Feeling okay',
      rawText: 'Feeling okay'
    }
  ];

  const mockUserSettings = {
    name: 'Test User',
    cycleStartDate: '2024-01-01',
    avgCycleLength: 28,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (storageService.getUserSettings as any).mockReturnValue(mockUserSettings);
    (analyticsService.generateInsights as any).mockReturnValue([
      { type: 'WARNING', title: 'Test Insight', description: 'Test Description' }
    ]);
    (analyticsService.generateDailyStrategy as any).mockReturnValue([
      { id: '1', title: 'Test Strategy', action: 'Do this' }
    ]);
    (analyticsService.calculateBurnoutTrajectory as any).mockReturnValue({ riskLevel: 'low', trend: 'stable', description: 'Stable' });
    (analyticsService.calculateCognitiveLoad as any).mockReturnValue({ load: 50, state: 'MODERATE', efficiencyLoss: 10, switches: 5 });
    (analyticsService.calculateCyclePhase as any).mockReturnValue({ 
      phase: 'FOLLICULAR', 
      day: 5, 
      length: 28,
      energyPrediction: 'High',
      advice: 'Go for it'
    });
  });

  it('renders no data state when entries are empty', () => {
    render(<HealthMetricsDashboard entries={[]} />);
    expect(screen.getByText('Your pattern garden is waiting')).toBeInTheDocument();
    expect(screen.getByText(/Every pattern you notice is a seed/)).toBeInTheDocument();
  });

  it('renders dashboard with data', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    expect(screen.getByText('Pattern Dashboard')).toBeInTheDocument();
    
    // Expand details to see the chart
    const showDetailsBtn = screen.getByText('Show Details');
    showDetailsBtn.click();
    
    await screen.findByTestId('composed-chart');
  });

  it('displays cycle context', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    // Need to expand details to see cycle context
    const showDetailsBtn = screen.getByText('Show Details');
    showDetailsBtn.click();
    
    await screen.findByText('Cycle Context');
    expect(screen.getByText('Day 5/28')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('displays insights', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    // Need to expand details to see insights
    const showDetailsBtn = screen.getByText('Show Details');
    showDetailsBtn.click();

    await screen.findByText('Pattern Discoveries');
    expect(screen.getByText('Test Insight')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('displays energy metrics', () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    expect(screen.getByText("Today's Energy")).toBeInTheDocument();
    // 4.5 out of 10 (avg of 5 and 4)
    const scores = screen.getAllByText('4.5');
    expect(scores.length).toBeGreaterThan(0);
  });
});
