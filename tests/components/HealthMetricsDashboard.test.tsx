import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthMetricsDashboard from '../../components/HealthMetricsDashboard';
import * as storageService from '../../services/storageService';
import * as analyticsService from '../../services/analytics';

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

// Mock StateTrendChart
vi.mock('../../components/StateTrendChart', () => ({
  default: () => <div data-testid="state-trend-chart">StateTrendChart</div>,
}));

// Mock services
vi.mock('../../services/storageService', () => ({
  getUserSettings: vi.fn(),
}));

vi.mock('../../services/analytics', () => ({
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
      neuroMetrics: { spoonLevel: 5, sensoryLoad: 3, contextSwitches: 2, maskingScore: 1, capacity: {} as any },
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
      neuroMetrics: { spoonLevel: 4, sensoryLoad: 4, contextSwitches: 3, maskingScore: 2, capacity: {} as any },
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
    (analyticsService.generateDailyStrategy as any).mockReturnValue([]);
    (analyticsService.calculateBurnoutTrajectory as any).mockReturnValue({ riskLevel: 'low', trend: 'stable' });
    (analyticsService.calculateCognitiveLoad as any).mockReturnValue({ load: 50, status: 'moderate' });
    (analyticsService.calculateCyclePhase as any).mockReturnValue({ 
      phase: 'follicular', 
      day: 5, 
      length: 28,
      energyPrediction: 'High',
      cognitiveImpact: 'Low',
      advice: 'Go for it'
    });
  });

  it('renders no data state when entries are empty', () => {
    render(<HealthMetricsDashboard entries={[]} />);
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText(/Start logging to track/)).toBeInTheDocument();
  });

  it('renders dashboard with data', () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    
    // Check for charts
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    expect(screen.getByTestId('state-trend-chart')).toBeInTheDocument();
  });

  it('displays hormonal forecast', () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    expect(screen.getByText('Hormonal Forecast')).toBeInTheDocument();
    expect(screen.getByText('follicular Phase')).toBeInTheDocument();
    expect(screen.getByText('Energy Prediction')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('displays insights', () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    expect(screen.getByText('AI Pattern Discovery')).toBeInTheDocument();
    expect(screen.getByText('Test Insight')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('displays masking trend', () => {
    render(<HealthMetricsDashboard entries={mockEntries} />);
    expect(screen.getByText('Current Effort:')).toBeInTheDocument();
    // 1/10
    expect(screen.getByText('1/10')).toBeInTheDocument();
  });
});
