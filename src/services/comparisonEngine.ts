import { ActionUnit, FacialAnalysis, FacialBaseline, HealthEntry } from "../types";

export interface ComparisonResult {
  discrepancyScore: number; // 0-100
  subjectiveState: string;
  objectiveState: string;
  insight: { description: string; confidence: number };
  baselineApplied?: boolean; // New: Flag to show if calibration was used
  isMaskingLikely?: boolean; // True if user shows signs of masking emotions
  facsInsights?: {
    // NEW: FACS-specific insights
    detectedAUs: string[]; // List of detected AU codes
    smileType: "genuine" | "social" | "none";
    tensionAUs: string[]; // AUs indicating tension
    fatigueAUs: string[]; // AUs indicating fatigue
  };
}

/**
 * Helper: Find AU by code in the actionUnits array
 */
const findAU = (actionUnits: ActionUnit[], code: string): ActionUnit | undefined => {
  return actionUnits.find(au => au.auCode.toUpperCase() === code.toUpperCase());
};

/**
 * Helper: Check if AU is present with minimum intensity
 * Relaxed threshold for demo purposes - accepts trace-level detections (intensity >= 1)
 */
const hasAUWithIntensity = (
  actionUnits: ActionUnit[],
  code: string,
  minIntensity: number = 1
): boolean => {
  const au = findAU(actionUnits, code);
  return au ? au.intensityNumeric >= minIntensity : false;
};

/**
 * Helper: Calculate tension score from FACS Action Units
 */
const calculateTensionFromAUs = (actionUnits: ActionUnit[]): number => {
  // AU4 (Brow Lowerer) + AU24 (Lip Pressor) are key tension indicators
  const au4 = findAU(actionUnits, "AU4");
  const au24 = findAU(actionUnits, "AU24");
  const au14 = findAU(actionUnits, "AU14"); // Dimpler - suppression

  let tensionScore = 0;
  if (au4) tensionScore += (au4.intensityNumeric / 5) * 0.4;
  if (au24) tensionScore += (au24.intensityNumeric / 5) * 0.4;
  if (au14) tensionScore += (au14.intensityNumeric / 5) * 0.2;

  return Math.min(1, tensionScore);
};

/**
 * Helper: Calculate fatigue score from FACS Action Units
 */
const calculateFatigueFromAUs = (actionUnits: ActionUnit[]): number => {
  // AU43 (Eyes Closed) and reduced overall AU intensity indicate fatigue
  const au43 = findAU(actionUnits, "AU43");
  const au7 = findAU(actionUnits, "AU7"); // Lid Tightener (squinting from fatigue)

  let fatigueScore = 0;
  if (au43) fatigueScore += (au43.intensityNumeric / 5) * 0.5;
  if (au7) fatigueScore += (au7.intensityNumeric / 5) * 0.3;

  // Check for low overall intensity (tired faces have less expression)
  const avgIntensity =
    actionUnits.length > 0
      ? actionUnits.reduce((sum, au) => sum + au.intensityNumeric, 0) / actionUnits.length / 5
      : 0;
  if (avgIntensity < 0.3 && actionUnits.length > 0) {
    fatigueScore += 0.2; // Low expressiveness suggests fatigue
  }

  return Math.min(1, fatigueScore);
};

/**
 * Compares the user's subjective journal entry with the objective facial analysis.
 * Now uses FACS Action Units for more accurate detection.
 */
export const compareSubjectiveToObjective = (
  journalEntry: HealthEntry | null,
  analysis: FacialAnalysis,
  baseline?: FacialBaseline | null
): ComparisonResult => {
  const actionUnits = analysis.actionUnits || [];
  const facsInterp = analysis.facsInterpretation;

  // Calculate tension from FACS AUs (preferred) or fall back to legacy values
  let tension =
    actionUnits.length > 0
      ? calculateTensionFromAUs(actionUnits)
      : Math.max(analysis.jawTension || 0, analysis.eyeFatigue || 0);

  // Calculate fatigue from FACS AUs
  let fatigue =
    actionUnits.length > 0 ? calculateFatigueFromAUs(actionUnits) : analysis.eyeFatigue || 0;

  let baselineApplied = false;

  // Initialize score and masking factor
  let score = 0;
  let masking = 0;

  if (baseline) {
    baselineApplied = true;
    // Apply baseline adjustment separately for tension and fatigue
    const tensionDelta = tension - (baseline.neutralTension || 0);
    tension = Math.max(0, tensionDelta);
    const fatigueDelta = fatigue - (baseline.neutralFatigue || 0);
    fatigue = Math.max(0, fatigueDelta);
  }

  // Determine smile type from FACS data
  let smileType: "genuine" | "social" | "none" = "none";
  if (facsInterp) {
    if (facsInterp.duchennSmile) {
      smileType = "genuine";
    } else if (facsInterp.socialSmile) {
      smileType = "social";
    }
  } else {
    // Fallback: Check raw AUs for smile detection (relaxed threshold)
    const hasAU6 = hasAUWithIntensity(actionUnits, "AU6", 1); // Cheek Raiser
    const hasAU12 = hasAUWithIntensity(actionUnits, "AU12", 1); // Lip Corner Puller
    if (hasAU6 && hasAU12) {
      smileType = "genuine";
    } else if (hasAU12) {
      smileType = "social";
    }
  }

  // Collect AU codes for insights
  const detectedAUs = actionUnits.map(au => au.auCode);
  const tensionAUs = actionUnits
    .filter(au => ["AU4", "AU24", "AU14", "AU17"].includes(au.auCode))
    .map(au => au.auCode);
  const fatigueAUs = actionUnits
    .filter(au => ["AU43", "AU7", "AU45"].includes(au.auCode))
    .map(au => au.auCode);

  // Default if no journal entry
  if (!journalEntry) {
    return {
      discrepancyScore: 0,
      subjectiveState: "No recent entry",
      objectiveState:
        smileType === "genuine"
          ? "Genuine expression"
          : smileType === "social"
            ? "Social smile detected"
            : "Neutral",
      insight: {
        description:
          "Log a journal entry to see how your self-perception matches your physical state.",
        confidence: analysis.confidence || 0.8,
      },
      isMaskingLikely: smileType === "social",
      baselineApplied,
      facsInsights: { detectedAUs, smileType, tensionAUs, fatigueAUs },
    };
  }

  const mood = journalEntry.mood; // 1-5

  // NEW: Enhanced masking detection using FACS
  // Social smile (AU12 without AU6) when reporting positive mood = possible masking
  if (mood >= 4 && smileType === "social") {
    score += 50;
    masking = 0.7;
  }

  // Genuine smile when reporting low mood = also discrepancy (might be masking distress)
  if (mood <= 2 && smileType === "genuine") {
    score += 30;
  }

  // High tension AUs when reporting good mood
  if (mood >= 4 && tension > 0.3) {
    score += 60;
    masking = Math.max(masking, tension);
  }

  // Fatigue indicators when reporting high energy
  if (mood >= 4 && fatigue > 0.3) {
    score += 40;
  }

  // FACS-specific masking indicators
  if (facsInterp?.maskingIndicators && facsInterp.maskingIndicators.length > 0) {
    score += facsInterp.maskingIndicators.length * 15;
    masking = Math.max(masking, 0.6);
  }

  // Build objective state string
  const subjectiveState = `${journalEntry.moodLabel} (${journalEntry.mood}/5)`;

  let objectiveStateStr =
    smileType === "genuine" ? "Genuine smile" : smileType === "social" ? "Social smile" : "Neutral";
  if (tension > 0.3) objectiveStateStr += `, Tension: ${(tension * 10).toFixed(0)}/10`;
  if (fatigue > 0.3) objectiveStateStr += `, Fatigue: ${(fatigue * 10).toFixed(0)}/10`;
  if (baselineApplied) objectiveStateStr += " (baseline-adjusted)";

  // Generate insight based on FACS findings
  let insight = "Your internal state matches your physical signals.";

  if (score > 70) {
    insight =
      "High Discrepancy. Your face shows signs of strain that don't match your reported mood. This may indicate masking or dissociation from your physical state.";
  } else if (score > 40) {
    insight =
      "Moderate Discrepancy. There's a gap between how you feel and what your face shows. Consider checking in with your body.";
  } else if (smileType === "social" && mood >= 4) {
    insight =
      "Social Smile Detected. Your smile engages AU12 (lip corners) but not AU6 (cheek raiser). This is often a 'polite' smile rather than a felt one.";
  } else if (masking > 0.6) {
    insight =
      "Masking Indicators Present. Even if your mood matches, your expression shows effort - possibly unconscious emotional regulation.";
  } else if (tensionAUs.length > 0) {
    insight = `Tension detected in ${tensionAUs.join(", ")}. Your face may be holding stress you haven't consciously noticed.`;
  }

  const discrepancyScore = Math.min(100, Math.max(0, score));

  return {
    discrepancyScore,
    subjectiveState,
    objectiveState: objectiveStateStr,
    insight: { description: insight, confidence: analysis.confidence || 0.8 },
    baselineApplied,
    isMaskingLikely: masking > 0.6 || smileType === "social",
    facsInsights: { detectedAUs, smileType, tensionAUs, fatigueAUs },
  };
};

/**
 * Quality Check: Evaluates FACS detection quality (0-100)
 * Returns quality score and suggestions for improvement
 */
export interface DetectionQuality {
  score: number; // 0-100
  level: "high" | "medium" | "low";
  suggestions: string[];
  canProceed: boolean;
}

export const checkDetectionQuality = (analysis: FacialAnalysis): DetectionQuality => {
  const actionUnits = analysis.actionUnits || [];
  const confidence = analysis.confidence || 0;

  // Critical AUs we expect to detect for meaningful analysis
  const criticalAUs = ["AU6", "AU12", "AU4", "AU24"];
  const detectedCritical = actionUnits.filter(au => criticalAUs.includes(au.auCode));
  
  let qualityScore = 0;

  // Factor 1: Confidence score (40% weight)
  qualityScore += confidence * 40;

  // Factor 2: Number of AUs detected (30% weight)
  // More AUs = better analysis, up to 8 AUs
  const auScore = Math.min(actionUnits.length / 8, 1) * 30;
  qualityScore += auScore;

  // Factor 3: Critical AUs detected (30% weight)
  // Detecting at least 2 critical AUs indicates good quality
  const criticalScore = Math.min(detectedCritical.length / 2, 1) * 30;
  qualityScore += criticalScore;

  // Determine quality level
  let level: "high" | "medium" | "low";
  let suggestions: string[] = [];
  
  // ALWAYS allow proceeding - user should see results regardless of quality
  // The quality check is informational only, not a blocker
  const canProceed = true;

  if (qualityScore >= 60) {
    level = "high";
  } else if (qualityScore >= 30) {
    level = "medium";
  } else {
    level = "low";
  }

  // Only add suggestions for low/medium quality
  // High quality should have empty suggestions
  if (level === "low" || level === "medium") {
    // Generate specific suggestions based on what's missing
    if (confidence < 0.5) {
      suggestions.push("Low confidence - image may be blurry or poorly lit");
    }
    
    if (actionUnits.length < 3) {
      suggestions.push("Few facial markers detected - try better lighting");
    }
    
    if (detectedCritical.length < 2) {
      suggestions.push("Key expression markers not detected - face the camera directly");
    }

    // Add general improvement suggestions
    suggestions.push("Ensure soft, frontal lighting on your face");
    suggestions.push("Remove glasses or hair covering your eyes/mouth");
    suggestions.push("Hold camera steady and look directly at the lens");
  }

  return {
    score: Math.round(qualityScore),
    level,
    suggestions,
    canProceed,
  };
};
