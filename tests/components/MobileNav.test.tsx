import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MobileNav from '../../components/MobileNav';
import { View } from '../../types';

describe('MobileNav Component', () => {
  const mockOnToggleMenu = vi.fn();

  const defaultProps = {
    currentView: View.JOURNAL,
    onToggleMenu: mockOnToggleMenu,
    isMenuOpen: false
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    );
  };

  it('renders all navigation items', () => {
    renderWithRouter(<MobileNav {...defaultProps} />);
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    expect(screen.getByText('Bio-Mirror')).toBeInTheDocument();
    expect(screen.getByText('Capture')).toBeInTheDocument();
    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('highlights the current view', () => {
    // In MemoryRouter, we can set initialEntries to simulate current path
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MobileNav {...defaultProps} currentView={View.DASHBOARD} />
      </MemoryRouter>
    );
    
    const dashboardLink = screen.getByText('Patterns').closest('a');
    expect(dashboardLink).toHaveClass('text-teal-600');
    
    const coachLink = screen.getByText('Coach').closest('a');
    expect(coachLink).toHaveClass('text-slate-400');
  });

  it('contains correct links', () => {
    renderWithRouter(<MobileNav {...defaultProps} />);
    
    expect(screen.getByText('Patterns').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Bio-Mirror').closest('a')).toHaveAttribute('href', '/bio-mirror');
    expect(screen.getByText('Coach').closest('a')).toHaveAttribute('href', '/coach');
    expect(screen.getByText('Capture').closest('a')).toHaveAttribute('href', '/journal');
  });

  it('calls onToggleMenu when menu is clicked', () => {
    renderWithRouter(<MobileNav {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Menu'));
    expect(mockOnToggleMenu).toHaveBeenCalled();
  });
});
