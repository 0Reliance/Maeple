import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MobileNav from "../../src/components/MobileNav";
import { View } from "../../src/types";

describe('MobileNav Component', () => {
  const defaultProps = {
    currentView: View.JOURNAL,
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
    expect(screen.getByText('Reflect')).toBeInTheDocument();
    expect(screen.getByText('Capture')).toBeInTheDocument();
    expect(screen.getByText('Guide')).toBeInTheDocument();
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
    expect(dashboardLink).toHaveClass('text-primary');
    
    const coachLink = screen.getByText('Guide').closest('a');
    expect(coachLink).toHaveClass('text-text-tertiary');
  });

  it('contains correct links', () => {
    renderWithRouter(<MobileNav {...defaultProps} />);
    
    expect(screen.getByText('Patterns').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Reflect').closest('a')).toHaveAttribute('href', '/bio-mirror');
    expect(screen.getByText('Guide').closest('a')).toHaveAttribute('href', '/coach');
    expect(screen.getByText('Capture').closest('a')).toHaveAttribute('href', '/journal');
  });

  it('menu button links to settings', () => {
    renderWithRouter(<MobileNav {...defaultProps} />);
    
    expect(screen.getByText('Menu').closest('a')).toHaveAttribute('href', '/settings');
  });

  it('renders floating MAEPLE brand label', () => {
    renderWithRouter(<MobileNav {...defaultProps} />);
    
    // Verify MAEPLE brand text is present
    expect(screen.getByText('MAEPLE')).toBeInTheDocument();
  });

  it('brand label has correct positioning and styling', () => {
    const { container } = renderWithRouter(<MobileNav {...defaultProps} />);
    
    // Find the brand label container (positioned above nav)
    const brandLabel = container.querySelector('.absolute.-top-6');
    expect(brandLabel).toBeInTheDocument();
    
    // Verify it has pill-shaped styling
    expect(brandLabel).toHaveClass('rounded-full', 'shadow-sm');
  });

  it('brand label contains gradient logo icon', () => {
    const { container } = renderWithRouter(<MobileNav {...defaultProps} />);
    
    // Find the logo container with gradient
    const logoContainer = container.querySelector('.bg-gradient-to-br');
    expect(logoContainer).toBeInTheDocument();
    
    // Verify it contains the "M" text
    expect(logoContainer).toHaveTextContent('M');
  });
});
