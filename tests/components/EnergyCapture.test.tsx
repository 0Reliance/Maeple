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

describe("Energy Capture Feature - Data Capture Testing", () => {
  const mockOnEntryAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset AI service mock to return complete responses
    mockDependencies.aiService.analyze.mockResolvedValue({
      content: JSON.stringify({
        moodScore: 5,
        moodLabel: "Neutral",
        summary: "Entry analyzed",
        strategies: [],
        analysisReasoning: "",
        objectiveObservations: [],
      }),
    });
  });

  const renderWithDependencies = (component: React.ReactNode) => {
    return render(
      <DependencyProvider dependencies={mockDependencies}>
        <ObservationProvider>{component}</ObservationProvider>
      </DependencyProvider>
    );
  };

  describe("AI-Extracted Observations Integration", () => {
    it("should capture AI-extracted fatigue observations from text", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Tired",
          summary: "User reports fatigue",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "fatigue",
              value: "exhausted",
              severity: "high",
              evidence: "text mentions 'exhausted'",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "I'm feeling exhausted and completely drained" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.objectiveObservations).toBeDefined();
      expect(savedEntry.objectiveObservations).toHaveLength(1);
      expect(savedEntry.objectiveObservations![0].type).toBe("text");
      expect(savedEntry.objectiveObservations![0].observations).toContainEqual(
        expect.objectContaining({
          category: "fatigue",
          severity: "high",
        })
      );
    });

    it("should capture AI-extracted lighting observations from text", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 6,
          moodLabel: "Neutral",
          summary: "User describes environment",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "lighting",
              value: "blinding lights",
              severity: "high",
              evidence: "text mentions 'blinding'",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "The lights are blinding in here" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.objectiveObservations![0].observations).toContainEqual(
        expect.objectContaining({
          category: "lighting",
          severity: "high",
        })
      );
    });

    it("should capture multiple AI-extracted observations", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Struggling",
          summary: "Multiple issues detected",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "fatigue",
              value: "tired",
              severity: "high",
              evidence: "text mentions fatigue",
            },
            {
              category: "noise",
              value: "noisy environment",
              severity: "moderate",
              evidence: "text mentions noise",
            },
            {
              category: "lighting",
              value: "bright lights",
              severity: "high",
              evidence: "text mentions lighting",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, {
        target: {
          value: "I'm so tired, there's a lot of noise around me, and the lights are too bright",
        },
      });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.objectiveObservations![0].observations).toHaveLength(3);
    });
  });

  describe("Capacity Suggestion from AI Observations", () => {
    it("should lower physical capacity when high fatigue is detected", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 3,
          moodLabel: "Exhausted",
          summary: "User is exhausted",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "fatigue",
              value: "completely drained",
              severity: "high",
              evidence: "text mentions exhaustion",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "I'm completely drained and exhausted" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.neuroMetrics.capacity.physical).toBeLessThanOrEqual(4);
    });

    it("should lower sensory capacity when high lighting is detected", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Overwhelmed",
          summary: "Sensory issues",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "lighting",
              value: "blinding lights",
              severity: "high",
              evidence: "text mentions blinding",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "The lights are blinding me" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.neuroMetrics.capacity.sensory).toBeLessThanOrEqual(3);
    });

    it("should lower executive capacity when high tension is detected", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 4,
          moodLabel: "Stressed",
          summary: "High tension",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "tension",
              value: "very tense",
              severity: "high",
              evidence: "text mentions tension",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "I feel very tense and stressed" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.neuroMetrics.capacity.executive).toBeLessThanOrEqual(4);
    });

    it("should lower focus capacity when high noise is detected", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Distracted",
          summary: "Noise issues",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "noise",
              value: "very noisy",
              severity: "high",
              evidence: "text mentions noise",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "It's very noisy here and hard to concentrate" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      expect(savedEntry.neuroMetrics.capacity.focus).toBeLessThanOrEqual(4);
      expect(savedEntry.neuroMetrics.capacity.sensory).toBeLessThanOrEqual(3);
    });
  });

  describe("SpoonLevel Recalculation", () => {
    it("should recalculate spoonLevel based on AI-updated capacity", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Neutral",
          summary: "Multiple capacity impacts",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "fatigue",
              value: "exhausted",
              severity: "high",
              evidence: "text mentions fatigue",
            },
            {
              category: "noise",
              value: "loud noise",
              severity: "high",
              evidence: "text mentions noise",
            },
            {
              category: "lighting",
              value: "bright lights",
              severity: "high",
              evidence: "text mentions lighting",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, {
        target: {
          value: "I'm exhausted, there's loud noise, and the lights are too bright",
        },
      });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      const capacityValues = Object.values(savedEntry.neuroMetrics.capacity) as number[];
      const expectedSpoonLevel = Math.round(
        capacityValues.reduce((a, b) => a + b, 0) / capacityValues.length
      );

      expect(savedEntry.neuroMetrics.spoonLevel).toBe(expectedSpoonLevel);
      // Spoon level should be lower than default due to multiple high severity observations
      expect(savedEntry.neuroMetrics.spoonLevel).toBeLessThan(5);
    });

    it("should maintain spoonLevel when no AI observations are detected", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 7,
          moodLabel: "Good",
          summary: "Normal entry",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "Just a normal day" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      // Spoon level should be based on default capacity values
      expect(savedEntry.neuroMetrics.spoonLevel).toBeGreaterThan(4);
    });
  });

  describe("End-to-End Energy Capture Flow", () => {
    it("should capture complete energy metrics from text analysis", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 3,
          moodLabel: "Overwhelmed",
          summary: "User reports multiple energy drains",
          strategies: [],
          analysisReasoning: "High sensory load detected",
          objectiveObservations: [
            {
              category: "fatigue",
              value: "exhausted",
              severity: "high",
              evidence: "text mentions exhausted",
            },
            {
              category: "lighting",
              value: "blinding lights",
              severity: "high",
              evidence: "text mentions blinding",
            },
            {
              category: "noise",
              value: "construction noise",
              severity: "high",
              evidence: "text mentions noise",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, {
        target: {
          value: "I'm completely exhausted, the lights are blinding me, and there's construction noise everywhere",
        },
      });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];

      // Verify observations were captured
      expect(savedEntry.objectiveObservations).toBeDefined();
      expect(savedEntry.objectiveObservations![0].type).toBe("text");
      expect(savedEntry.objectiveObservations![0].observations).toHaveLength(3);

      // Verify capacity was updated correctly
      expect(savedEntry.neuroMetrics.capacity.physical).toBeLessThanOrEqual(4);
      expect(savedEntry.neuroMetrics.capacity.sensory).toBeLessThanOrEqual(3);
      expect(savedEntry.neuroMetrics.capacity.focus).toBeLessThanOrEqual(4);

      // Verify spoonLevel reflects the low energy state
      expect(savedEntry.neuroMetrics.spoonLevel).toBeLessThan(5);

      // Verify entry structure is complete
      expect(savedEntry.id).toBeDefined();
      expect(savedEntry.timestamp).toBeDefined();
      expect(savedEntry.mood).toBe(3);
      expect(savedEntry.rawText).toBe(
        "I'm completely exhausted, the lights are blinding me, and there's construction noise everywhere"
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty objectiveObservations array", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Neutral",
          summary: "No observations",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "Just a normal day" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      // Entry should still be saved with default capacity
      expect(savedEntry.neuroMetrics.capacity).toBeDefined();
      expect(savedEntry.neuroMetrics.spoonLevel).toBeDefined();
    });

    it("should handle missing objectiveObservations field", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 5,
          moodLabel: "Neutral",
          summary: "Missing observations field",
          strategies: [],
          analysisReasoning: "",
          // objectiveObservations field is missing
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "Test entry" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      // Entry should still be saved without errors
      expect(savedEntry.neuroMetrics.capacity).toBeDefined();
      expect(savedEntry.neuroMetrics.spoonLevel).toBeDefined();
    });

    it("should handle low severity observations without significant capacity changes", async () => {
      const mockResponse = {
        content: JSON.stringify({
          moodScore: 6,
          moodLabel: "Okay",
          summary: "Minor issues",
          strategies: [],
          analysisReasoning: "",
          objectiveObservations: [
            {
              category: "fatigue",
              value: "slightly tired",
              severity: "low",
              evidence: "text mentions low fatigue",
            },
          ],
        }),
      };

      mockDependencies.aiService.analyze.mockResolvedValue(mockResponse);

      renderWithDependencies(<JournalEntry onEntryAdded={mockOnEntryAdded} />);

      const input = screen.getByPlaceholderText(/Describe your current state/i);
      fireEvent.change(input, { target: { value: "I'm slightly tired but okay" } });

      const submitBtn = screen.getByText("Save Entry");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnEntryAdded).toHaveBeenCalled();
      });

      const savedEntry = mockOnEntryAdded.mock.calls[0][0];
      // Low severity fatigue should not significantly impact capacity
      expect(savedEntry.neuroMetrics.capacity.physical).toBeGreaterThan(4);
    });
  });
});