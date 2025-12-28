
import { HealthEntry, FacialAnalysis, FacialBaseline } from "../types";

export interface ComparisonResult {
  discrepancyScore: number; // 0-100
  subjectiveState: string;
  objectiveState: string;
  insight: { description: string; confidence: number };
  isMaskingLikely: boolean;
  baselineApplied?: boolean; // New: Flag to show if calibration was used
}

/**
 * Compares the user's subjective journal entry with the objective facial analysis.
 * Now supports optional Baseline Calibration.
 */
export const compareSubjectiveToObjective = (
  journalEntry: HealthEntry | null,
  analysis: FacialAnalysis,
  baseline?: FacialBaseline | null
): ComparisonResult => {
  // 1. Calculate Deltas (if baseline exists)
  let tension = Math.max(analysis.jawTension || 0, analysis.eyeFatigue || 0);
  let masking = analysis.maskingScore || 0;
  let baselineApplied = false;

  if (baseline) {
      baselineApplied = true;
      // Subtract baseline "resting" values to get the true current load
      // Clamp at 0 to avoid negative scores
      const tensionDelta = tension - Math.max(baseline.neutralTension || 0, baseline.neutralFatigue || 0);
      tension = Math.max(0, tensionDelta);
      
      const maskingDelta = (masking || 0) - (baseline.neutralMasking || 0);
      masking = Math.max(0, maskingDelta);
  } else {
      // If no baseline, use raw values
      masking = analysis.maskingScore || 0;
  }

  // Default if no journal entry
  if (!journalEntry) {
    return {
      discrepancyScore: 0,
      subjectiveState: "No recent entry",
      objectiveState: analysis.primaryEmotion || "Unknown",
      insight: { 
        description: "Log a journal entry to see how your self-perception matches your physical state.",
        confidence: analysis.confidence || 0.8 
      },
      isMaskingLikely: masking > 0.6,
      baselineApplied
    };
  }

  let score = 0;
  const mood = journalEntry.mood; // 1-5
  
  // Detect positive sentiment in face?
  const primaryEmotion = (analysis.primaryEmotion || "").toLowerCase();
  const isFacePositive = primaryEmotion.includes('happy') || primaryEmotion.includes('joy');

  // Calculation:
  // If Mood is High (>4) but Tension (adjusted) is High (>0.6) -> Discrepancy
  if (mood >= 4 && tension > 0.5) {
      score += 60;
  }

  // If Mood is High (>4) but Face is NOT positive -> Discrepancy
  if (mood >= 4 && !isFacePositive && analysis.confidence > 0.7) {
      score += 40;
  }

  // If Mood is Low (<2) and Face is Happy -> Masking (faking it)
  if (mood <= 2 && isFacePositive) {
      score += 80;
  }

  // Masking factor (adjusted)
  if (masking > 0.6) {
      score += 20;
  }

  const discrepancyScore = Math.min(100, score);
  const subjectiveState = `${journalEntry.moodLabel} (${journalEntry.mood}/5)`;
  
  // Display string shows "Corrected" if baseline used
  const tensionLabel = (tension * 10).toFixed(0);
  const primaryEmotionStr = analysis.primaryEmotion || "Unknown";
  const objectiveState = baselineApplied 
    ? `${primaryEmotionStr} (Adj. Tension: ${tensionLabel}/10)`
    : `${primaryEmotionStr} (Tension: ${tensionLabel}/10)`;

  let insight = "Your internal state matches your physical signals.";
  
  if (discrepancyScore > 70) {
      insight = "High Discrepancy. You reported feeling okay, but your body is showing significant distress signals. This is a classic sign of dissociation.";
  } else if (discrepancyScore > 40) {
      insight = "Moderate Discrepancy. There is a gap between your words and your body.";
  } else if (masking > 0.6) {
      insight = "Masking Detected. Even if your mood matches, your expression shows the effort of performance.";
  }

  return {
    discrepancyScore,
    subjectiveState,
    objectiveState,
    insight: { description: insight, confidence: analysis.confidence || 0.8 },
    isMaskingLikely: discrepancyScore > 50 || masking > 0.6,
    baselineApplied
  };
};