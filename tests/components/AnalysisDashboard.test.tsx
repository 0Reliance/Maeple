import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AnalysisDashboard from "../../src/components/AnalysisDashboard";
import { HealthEntry } from '../../types';

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  LineChart: () => <div />,
  Line: () => <div />,
}));

describe('AnalysisDashboard Component', () => {
  const mockEntries: HealthEntry[] = [
    {
      id: '1',
      timestamp: new Date('2023-01-01T10:00:00').toISOString(),
      mood: 4,
      moodLabel: 'Good',
      medications: [{ name: 'Med A', dosage: '10mg', unit: 'mg' }],
      symptoms: [{ name: 'Headache', severity: 2 }],
      tags: [],
      activityTypes: [],
      strengths: [],
      neuroMetrics: { spoonLevel: 5, sensoryLoad: 3, contextSwitches: 2, capacity: {} as any },
      notes: 'Feeling good',
      rawText: 'Feeling good'
    },
    {
      id: '2',
      timestamp: new Date('2023-01-02T10:00:00').toISOString(),
      mood: 2,
      moodLabel: 'Bad',
      medications: [],
      symptoms: [],
      tags: [],
      activityTypes: [],
      strengths: [],
      neuroMetrics: { spoonLevel: 2, sensoryLoad: 8, contextSwitches: 5, capacity: {} as any },
      notes: 'Feeling bad',
      rawText: 'Feeling bad'
    }
  ];

  it('renders stats cards correctly', () => {
    render(<AnalysisDashboard entries={mockEntries} />);
    
    // Avg Mood: (4 + 2) / 2 = 3.0
    expect(screen.getByText('3.0')).toBeInTheDocument();
    
    // Total Meds: 1 and Total Symptoms: 1
    // Since there are multiple "1"s, we check if we can find them.
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(2);
    
    // Check for labels to ensure context
    expect(screen.getByText('Avg Mood')).toBeInTheDocument();
    expect(screen.getByText('Meds Logged')).toBeInTheDocument();
    expect(screen.getByText('Symptoms')).toBeInTheDocument();
  });

  it('renders chart', () => {
    render(<AnalysisDashboard entries={mockEntries} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders recent logs list', () => {
    render(<AnalysisDashboard entries={mockEntries} />);
    
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Feeling good')).toBeInTheDocument();
    expect(screen.getByText(/Med A/)).toBeInTheDocument();
    
    expect(screen.getByText('Bad')).toBeInTheDocument();
    expect(screen.getByText('Feeling bad')).toBeInTheDocument();
  });

  it('handles empty entries', () => {
    render(<AnalysisDashboard entries={[]} />);
    
    // Avg Mood: 0, Total Meds: 0, Symptoms: 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
    
    expect(screen.getByText('No entries yet. Start by logging your day!')).toBeInTheDocument();
  });
});
