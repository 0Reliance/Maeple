import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/stateCheckService", () => {
  return {
    getRecentStateChecks: vi.fn(),
    saveStateCheck: vi.fn(),
  };
});

import { importData } from "../src/services/exportService";
import { getRecentStateChecks, saveStateCheck } from "../src/services/stateCheckService";

describe("exportService.importData (Bio-Mirror restore)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("imports only non-duplicate state checks when mergeStateChecks=true", async () => {
    (getRecentStateChecks as any).mockResolvedValue([
      {
        id: "sc_existing",
        timestamp: new Date().toISOString(),
        analysis: {
          confidence: 0.5,
          primaryEmotion: "unknown",
          observations: [],
          lighting: "unknown",
          lightingSeverity: "low",
          environmentalClues: [],
          eyeFatigue: 0,
          jawTension: 0,
          signs: [],
          actionUnits: [],
          facsInterpretation: {
            duchennSmile: false,
            socialSmile: false,
            maskingIndicators: [],
            fatigueIndicators: [],
            tensionIndicators: [],
          },
        },
      },
    ]);

    (saveStateCheck as any).mockResolvedValue("sc_new");

    const payload = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      app: "MAEPLE",
      data: {
        entries: [],
        settings: { avgCycleLength: 28 },
        stateChecks: [
          {
            id: "sc_existing",
            timestamp: new Date().toISOString(),
            analysis: { confidence: 0.1 },
          },
          {
            id: "sc_new",
            timestamp: new Date().toISOString(),
            analysis: { confidence: 0.2 },
            userNote: "hello",
          },
        ],
      },
      metadata: {
        totalEntries: 0,
        totalStateChecks: 2,
        dateRange: { earliest: null, latest: null },
      },
    };

    const result = await importData(JSON.stringify(payload), {
      mergeEntries: true,
      overwriteSettings: false,
      mergeStateChecks: true,
    });

    expect(result.success).toBe(true);
    expect(result.imported.stateChecks).toBe(1);
    expect(saveStateCheck).toHaveBeenCalledTimes(1);

    const call = (saveStateCheck as any).mock.calls[0];
    expect(call[0]).toMatchObject({ id: "sc_new", userNote: "hello" });
  });

  it("skips invalid state checks and reports an error", async () => {
    (getRecentStateChecks as any).mockResolvedValue([]);

    const payload = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      app: "MAEPLE",
      data: {
        entries: [],
        settings: { avgCycleLength: 28 },
        stateChecks: [{ timestamp: new Date().toISOString(), analysis: { confidence: 0.2 } }],
      },
      metadata: {
        totalEntries: 0,
        totalStateChecks: 1,
        dateRange: { earliest: null, latest: null },
      },
    };

    const result = await importData(JSON.stringify(payload), {
      mergeStateChecks: true,
    });

    expect(result.success).toBe(true);
    expect(result.imported.stateChecks).toBe(0);
    expect(result.errors.some(e => e.includes("Skipped invalid Bio-Mirror record"))).toBe(true);
    expect(saveStateCheck).not.toHaveBeenCalled();
  });
});
