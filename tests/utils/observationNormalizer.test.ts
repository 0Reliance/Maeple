import { describe, expect, it } from "vitest";
import { normalizeObjectiveObservations } from "../../src/utils/observationNormalizer";

describe("normalizeObjectiveObservations", () => {
  it("normalizes category arrays, numeric severities, and default evidence", () => {
    const entries = [
      { category: ["lighting", "noise"], value: "Bright lights", severity: 6, evidence: null },
      { category: ["noise", "tone"], value: "Background hum", severity: "High", evidence: "recorded hum" },
      { category: "fatigue", value: "Heavy eyelids", severity: 2, evidence: null },
    ];

    const normalized = normalizeObjectiveObservations(entries);

    expect(normalized).toEqual([
      {
        category: "lighting",
        value: "Bright lights",
        severity: "moderate",
        evidence: "Observation described as \"Bright lights\"",
      },
      {
        category: "noise",
        value: "Background hum",
        severity: "high",
        evidence: "recorded hum",
      },
      {
        category: "fatigue",
        value: "Heavy eyelids",
        severity: "low",
        evidence: "Observation described as \"Heavy eyelids\"",
      },
    ]);
  });

  it("filters invalid entries and applies severity aliasing", () => {
    const entries = [
      { category: "unknown", value: "No data", severity: 3 },
      { category: "tone", value: "", severity: "low", evidence: "soft" },
      { category: "tension", value: "Jaw tight", severity: "Severe", evidence: null },
    ];

    const normalized = normalizeObjectiveObservations(entries);

    expect(normalized).toEqual([
      {
        category: "tension",
        value: "Jaw tight",
        severity: "high",
        evidence: "Observation described as \"Jaw tight\"",
      },
    ]);
  });
});
