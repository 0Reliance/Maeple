
import { HealthEntry, FacialAnalysis, FacialBaseline } from "../types";

export interface ComparisonResult {
  discrepancyScore: number; // 0-100
  subjectiveState: string;
  objectiveState: string;
  insight: string;
  isMaskingLikely: boolean;
  baselineApplied?: boolean; // New: Flag to show if calibration was used
}

/**
 * Maps a 1-5 Mood Score to a generic valence string
 */
const getMoodLabel = (score: number): string => {
  if (score >= 4) return "Positive";
  if (score === 3) return "Neutral";
  return "Negative/Struggling";
};

/**
 * Maps facial analysis to a generic valence string
 */
const getFacialValence = (analysis: FacialAnalysis): string => {
  const negativeEmotions = ['sad', 'angry', 'fearful', 'disgusted', 'stressed', 'anxious'];
  const primary = analysis.primaryEmotion.toLowerCase();
  
  if (negativeEmotions.some(e => primary.includes(e))) return "Distressed";
  if (analysis.eyeFatigue > 0.6 || analysis.jawTension > 0.6) return "Physically Strained";
  if (primary.includes('happy') || primary.includes('joy')) return "Positive";
  return "Neutral";
};

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
  let tension = Math.max(analysis.jawTension, analysis.eyeFatigue);
  let masking = analysis.maskingScore;
  let baselineApplied = false;

  if (baseline) {
      baselineApplied = true;
      // Subtract baseline "resting" values to get the true current load
      // Clamp at 0 to avoid negative scores
      const tensionDelta = tension - Math.max(baseline.neutralTension, baseline.neutralFatigue);
      tension = Math.max(0, tensionDelta);
      
      const maskingDelta = masking - baseline.neutralMasking;
      masking = Math.max(0, maskingDelta);
  }

  // Default if no journal entry
  if (!journalEntry) {
    return {
      discrepancyScore: 0,
      subjectiveState: "No recent entry",
      objectiveState: analysis.primaryEmotion,
      insight: "Log a journal entry to see how your self-perception matches your physical state.",
      isMaskingLikely: masking > 0.6,
      baselineApplied
    };
  }

  let score = 0;
  const mood = journalEntry.mood; // 1-5
  
  // Normalize mood to 0-1 (1=0, 5=1)
  const normMood = (mood - 1) / 4; 
  
  // Detect positive sentiment in face?
  const isFacePositive = analysis.primaryEmotion.toLowerCase().includes('happy') || 
                         analysis.primaryEmotion.toLowerCase().includes('joy');

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
  const objectiveState = baselineApplied 
    ? `${analysis.primaryEmotion} (Adj. Tension: ${tensionLabel}/10)`
    : `${analysis.primaryEmotion} (Tension: ${tensionLabel}/10)`;

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
    insight,
    isMaskingLikely: discrepancyScore > 50 || masking > 0.6,
    baselineApplied
  };
};
