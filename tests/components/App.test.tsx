import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../../src/App";
import { useAppStore, useAuthStore } from "../../src/stores";
import { View } from "../../src/types";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
} as any;

// Mock lazy loaded components to avoid suspense issues in tests
vi.mock("../../src/components/LiveCoach", () => ({
  default: () => <div data-testid="live-coach">Live Coach</div>,
}));
vi.mock("../../src/components/VisionBoard", () => ({
  default: () => <div data-testid="vision-board">Vision Board</div>,
}));
vi.mock("../../src/components/StateCheckWizard", () => ({
  default: () => <div data-testid="state-check">State Check</div>,
}));
vi.mock("../../src/components/Settings", () => ({
  default: () => <div data-testid="settings">Settings</div>,
}));
vi.mock("../../src/components/ClinicalReport", () => ({
  default: () => <div data-testid="clinical-report">Clinical Report</div>,
}));

describe("App Navigation", () => {
  beforeEach(() => {
    // Reset URL
    window.history.pushState({}, 'Test page', '/');

    useAppStore.setState({
      currentView: View.JOURNAL,
      entries: [],
      wearableData: [],
      mobileMenuOpen: false,
      showOnboarding: false,
      setView: (view) => useAppStore.setState({ currentView: view }),
    });

    useAuthStore.setState({
      user: { id: "1", email: "test@example.com" },
      isAuthenticated: true,
      isInitialized: true,
    });
  });

  it("renders Journal by default", async () => {
    render(<App />);
    await waitFor(() => {
      // Check for the Journal View content or Nav item
      expect(screen.getByText(/Energy Check-in/i)).toBeInTheDocument();
    });
  });

  it("navigates to Dashboard", async () => {
    render(<App />);
    
    const dashboardBtn = screen.getAllByText("Patterns")[0];
    fireEvent.click(dashboardBtn);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("contains link to Settings", async () => {
    render(<App />);

    // Open User Menu first
    const userMenuBtn = screen.getByText("T").closest('button');
    if (userMenuBtn) {
        fireEvent.click(userMenuBtn);
    } else {
        throw new Error("User menu button not found");
    }

    const settingsBtn = await screen.findByText("Settings");
    // Verify the link is correct. 
    // Navigation testing is flaky due to component unmounting on click in JSDOM.
    expect(settingsBtn.closest('a')).toHaveAttribute('href', '/settings');
  });

  it("navigates to Bio-Mirror", async () => {
    render(<App />);

    const bioBtn = screen.getAllByText("Reflect")[0];
    fireEvent.click(bioBtn);

    await waitFor(() => {
      expect(screen.getByTestId("state-check")).toBeInTheDocument();
    });
  });

  it("renders Landing Page when not authenticated", async () => {
    useAuthStore.setState({ isAuthenticated: false });
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Notice your patterns/i)).toBeInTheDocument();
    });
  });
});
