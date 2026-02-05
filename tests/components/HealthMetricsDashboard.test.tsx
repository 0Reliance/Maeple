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
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div />,
  Area: () => <div />,
  PolarGrid: () => <div />,
  PolarAngleAxis: () => <div />,
  PolarRadiusAxis: () => <div />,
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

  it('renders dashboard with Daily Patterns tab active by default', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    expect(screen.getByText('Daily Patterns')).toBeInTheDocument();
    expect(screen.getByText('Clinical Report')).toBeInTheDocument();
  });

  it('renders Daily Patterns tab content', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Daily Patterns tab should be active
    const dailyTab = screen.getByText('Daily Patterns');
    expect(dailyTab).toHaveClass('text-primary');
    
    // Should show energy metrics
    expect(screen.getByText("Today's Energy")).toBeInTheDocument();
    
    // Expand details to see chart
    const showDetailsBtn = screen.getByText('Show Details');
    showDetailsBtn.click();
    
    await screen.findByTestId('composed-chart');
  });

  it('switches to Clinical Report tab', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Click Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    // Clinical Report content should appear
    await screen.findByText('MAEPLE Clinical Report');
    expect(screen.getByText('Longitudinal analysis for support context.')).toBeInTheDocument();
  });

  it('displays Clinical Report executive summary', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Switch to Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    await screen.findByText('Executive Summary');
    expect(screen.getByText('Burnout Risk')).toBeInTheDocument();
    expect(screen.getByText('Neuro-Cognitive Load')).toBeInTheDocument();
  });

  it('displays Clinical Report capacity profile', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Switch to Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    await screen.findByTestId('radar-chart');
    expect(screen.getByText('Baseline Capacity Profile')).toBeInTheDocument();
  });

  it('displays Clinical Report longitudinal trends', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Switch to Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    await screen.findByTestId('area-chart');
    expect(screen.getByText('30-Day Stability Trend')).toBeInTheDocument();
  });

  it('displays Clinical Report correlational analysis', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Switch to Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    await screen.findByText('Correlational Analysis');
    expect(screen.getByText('Test Insight')).toBeInTheDocument();
  });

  it('shows insufficient data message for Clinical Report', async () => {
    const fewEntries = [mockEntries[0]]; // Only 1 entry
    render(<HealthMetricsDashboard entries={fewEntries} />);
    
    // Switch to Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    await screen.findByText('Insufficient Data');
    expect(screen.getByText(/Please log at least 5 entries/)).toBeInTheDocument();
  });

  it('has Print to PDF button in Clinical Report tab', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Switch to Clinical Report tab
    const clinicalTab = screen.getByText('Clinical Report');
    clinicalTab.click();
    
    await screen.findByText('Print to PDF');
    const printButton = screen.getByText('Print to PDF');
    expect(printButton).toBeInTheDocument();
  });

  it('toggles details section in Daily Patterns tab', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Initially "Show Details"
    const showDetailsBtn = screen.getByText('Show Details');
    expect(showDetailsBtn).toBeInTheDocument();
    
    showDetailsBtn.click();
    
    // Should now say "Show Less" and show cycle context
    await screen.findByText('Show Less');
    await screen.findByText('Cycle Context');
    expect(screen.getByText('Day 5/28')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('displays insights in Daily Patterns details', async () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Expand details
    const showDetailsBtn = screen.getByText('Show Details');
    showDetailsBtn.click();

    await screen.findByText('Pattern Discoveries');
    expect(screen.getByText('Test Insight')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('displays energy metrics in Daily Patterns tab', () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    expect(screen.getByText("Today's Energy")).toBeInTheDocument();
    // 4.5 out of 10 (avg of 5 and 4)
    const scores = screen.getAllByText('4.5');
    expect(scores.length).toBeGreaterThan(0);
  });
});
