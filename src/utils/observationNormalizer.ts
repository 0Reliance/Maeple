import { Observation } from "../types";

const ALLOWED_CATEGORIES: Set<Observation["category"]> = new Set([
  "lighting",
  "noise",
  "tension",
  "fatigue",
  "speech-pace",
  "tone",
]);

const SEVERITY_ALIASES: Record<string, Observation["severity"]> = {
  low: "low",
  light: "low",
  mild: "low",
  moderate: "moderate",
  med: "moderate",
  medium: "moderate",
  high: "high",
  severe: "high",
  intense: "high",
};

const cleanText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
};

const normalizeCategory = (value: unknown): Observation["category"] | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (ALLOWED_CATEGORIES.has(normalized as Observation["category"])) {
      return normalized as Observation["category"];
    }
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const resolved = normalizeCategory(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
};

const normalizeSeverity = (value: unknown): Observation["severity"] => {
  if (!value) {
    return "low";
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    const aliased = SEVERITY_ALIASES[normalized];
    if (aliased) {
      return aliased;
    }
  }

  if (Array.isArray(value) && value.length > 0) {
    return normalizeSeverity(value[0]);
  }

  if (typeof value === "number") {
    if (value <= 3) {
      return "low";
    }
    if (value <= 7) {
      return "moderate";
    }
    return "high";
  }

  return "low";
};

export const normalizeObjectiveObservations = (input?: unknown): Observation[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<Observation[]>((acc, raw) => {
    if (!raw || typeof raw !== "object") {
      return acc;
    }

    const record = raw as Record<string, unknown>;
    const category = normalizeCategory(record.category);
    const value = cleanText(record.value);

    if (!category || !value) {
      return acc;
    }

    const evidence = cleanText(record.evidence) || `Observation described as "${value}"`;
    const severity = normalizeSeverity(record.severity);

    acc.push({
      category,
      value,
      severity,
      evidence,
    });

    return acc;
  }, []);
};
