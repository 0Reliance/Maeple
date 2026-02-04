import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JournalEntry from "../../src/components/JournalEntry";
import { DependencyProvider } from "../../src/contexts/DependencyContext";
import { ObservationProvider } from "../../src/contexts/ObservationContext";
import { createMockDependencies } from "../test-utils";

// Create properly typed mock dependencies
const mockDependencies = createMockDependencies();

// Mock the RecordVoiceButton component since it uses browser APIs
vi.mock("../../src/components/RecordVoiceButton", () => ({
  default: ({ onTranscript }: { onTranscript: (text: string) => void }) => (
    <button onClick={() => onTranscript("Voice transcript")}>Record Voice</button>
  ),
}));

// Mock the draft service to avoid localStorage issues in tests
vi.mock("../../src/services/draftService", () => ({
  useDraft: () => ({
    draft: null,
    markDirty: vi.fn(),
    save: vi.fn(),
  }),
}));

describe("JournalEntry Component", () => {
  const mockOnEntryAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithDependencies = (component: React.ReactNode) => {
    return render(
      <DependencyProvider dependencies={mockDependencies}>
        <ObservationProvider>{component}</ObservationProvider>
      </DependencyProvider>
    );
  };

  it("renders correctly", () => {
    renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);
    expect(screen.getByText("Energy Check-in")).toBeInTheDocument();
  });

  it("handles text input and submission", async () => {
    renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

    // 1. Enter text
    const input = screen.getByPlaceholderText(/Describe your current state/i);
    fireEvent.change(input, { target: { value: "Feeling great today!" } });

    // 3. Mock AI response
    const mockResponse = {
      content: JSON.stringify({
        moodScore: 8,
        moodLabel: "Happy",
        summary: "User is feeling great",
        strategies: [],
        analysisReasoning: "Positive sentiment detected",
      }),
    };
    mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

    // 4. Submit
    const submitBtn = screen.getByText("Save Entry");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockDependencies.aiService.analyze).toHaveBeenCalled();
    });
  });

  it("handles submission error", async () => {
    renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

    const input = screen.getByPlaceholderText(/Describe your current state/i);
    fireEvent.change(input, { target: { value: "Test entry" } });

    mockDependencies.aiService.analyze.mockRejectedValue(new Error("Analysis failed"));

    const submitBtn = screen.getByText("Save Entry");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Failed to analyze entry. Please try again.")).toBeInTheDocument();
    });
  });
});
