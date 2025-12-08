
import { HealthEntry, CapacityProfile, StrategyRecommendation, BurnoutForecast, WearableDataPoint, UserSettings, CyclePhaseContext } from "../types";

export interface Insight {
  type: 'CORRELATION' | 'WARNING' | 'STRENGTH' | 'BIO-LINK';
  title: string;
  description: string;
  score?: number; // Confidence or impact score
}

export interface CognitiveLoadMetrics {
  switches: number;
  efficiencyLoss: number; // percentage 0-100
  state: 'FLOW' | 'MODERATE' | 'FRAGMENTED';
  advice: string;
}

/**
 * The Pattern Engine
 * Analyzes health entries to find causal links between Capacity, Context, and Mood.
 * Phase 6 Update: Now correlates Wearable Data (Sleep/HRV) with Capacity.
 */
export const generateInsights = (entries: HealthEntry[], wearableData: WearableDataPoint[] = []): Insight[] => {
  if (entries.length < 3) return []; // Need data to find patterns

  const insights: Insight[] = [];

  // Helper: Map dates to entries for O(1) lookup
  const entryMap = new Map<string, HealthEntry>();
  entries.forEach(e => {
      const date = new Date(e.timestamp).toISOString().split('T')[0] ?? '';
      // Store the latest entry for that day for simplicity in MVP
      entryMap.set(date, e);
  });

  // 1. Analyze Capacity vs Mood Correlations
  const profiles = ['focus', 'social', 'sensory', 'structure', 'emotional', 'physical', 'executive'] as const;
  
  profiles.forEach(dimension => {
    // Split entries into High vs Low capacity for this dimension
    const highCap = entries.filter(e => e.neuroMetrics.capacity[dimension] >= 7);
    const lowCap = entries.filter(e => e.neuroMetrics.capacity[dimension] <= 4);

    if (highCap.length > 0 && lowCap.length > 0) {
      const avgMoodHigh = highCap.reduce((a, b) => a + b.mood, 0) / highCap.length;
      const avgMoodLow = lowCap.reduce((a, b) => a + b.mood, 0) / lowCap.length;
      const diff = avgMoodHigh - avgMoodLow;

      if (Math.abs(diff) > 0.5) {
        const direction = diff > 0 ? 'better' : 'worse';
        insights.push({
          type: 'CORRELATION',
          title: `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} Capacity Link`,
          description: `You feel ${Math.abs(diff).toFixed(1)} points ${direction} when your ${dimension} capacity is high.`,
          score: Math.abs(diff)
        });
      }
    }
  });

  // 2. Sensory Load Impact
  const highSensory = entries.filter(e => e.neuroMetrics.sensoryLoad >= 7);
  if (highSensory.length > 2) {
    const avgFocus = highSensory.reduce((a, b) => a + b.neuroMetrics.capacity.focus, 0) / highSensory.length;
    // Compare to overall average focus
    const overallFocus = entries.reduce((a, b) => a + b.neuroMetrics.capacity.focus, 0) / entries.length;
    
    if (avgFocus < overallFocus - 1) {
       insights.push({
         type: 'WARNING',
         title: 'Sensory Drain Detected',
         description: `High sensory load environments drop your Focus Capacity by ${(overallFocus - avgFocus).toFixed(1)} points.`,
         score: 8
       });
    }
  }

  // 3. Masking Cost
  const highMasking = entries.filter(e => (e.neuroMetrics.maskingScore || 0) >= 7);
  if (highMasking.length > 0) {
      const avgSpoons = highMasking.reduce((a, b) => a + b.neuroMetrics.spoonLevel, 0) / highMasking.length;
      const overallSpoons = entries.reduce((a, b) => a + b.neuroMetrics.spoonLevel, 0) / entries.length;

      if (avgSpoons < overallSpoons - 1) {
          insights.push({
              type: 'WARNING',
              title: 'The Cost of Masking',
              description: `Days with high masking effort cost you ${(overallSpoons - avgSpoons).toFixed(1)} extra spoons on average.`,
              score: 9
          });
      }
  }

  // 4. Phase 6: Wearable Correlations (Sleep/HRV vs Capacity)
  if (wearableData.length > 2) {
      const poorSleepDays: HealthEntry[] = [];
      const goodSleepDays: HealthEntry[] = [];

      wearableData.forEach(w => {
          const entry = entryMap.get(w.date);
          if (entry && w.metrics.sleep) {
             const hours = w.metrics.sleep.totalDurationSeconds / 3600;
             if (hours < 6.5) poorSleepDays.push(entry);
             if (hours > 7.5) goodSleepDays.push(entry);
          }
      });

      if (poorSleepDays.length > 0 && goodSleepDays.length > 0) {
          const avgFocusPoor = poorSleepDays.reduce((a, b) => a + b.neuroMetrics.capacity.focus, 0) / poorSleepDays.length;
          const avgFocusGood = goodSleepDays.reduce((a, b) => a + b.neuroMetrics.capacity.focus, 0) / goodSleepDays.length;
          
          if (avgFocusGood - avgFocusPoor > 1.5) {
               insights.push({
                  type: 'BIO-LINK',
                  title: 'Biological Capacity Link',
                  description: `Your Oura data confirms: Getting <6.5h sleep kills your Focus Capacity by ${(avgFocusGood - avgFocusPoor).toFixed(1)} points.`,
                  score: 10
              });
          }
      }
      
      // HRV vs Sensory Tolerance
      const lowHRVDays: HealthEntry[] = [];
      const highHRVDays: HealthEntry[] = [];
       wearableData.forEach(w => {
          const entry = entryMap.get(w.date);
          if (entry && w.metrics.biometrics) {
             const hrv = w.metrics.biometrics.hrvMs;
             if (hrv < 40) lowHRVDays.push(entry); // Heuristic threshold
             if (hrv > 55) highHRVDays.push(entry);
          }
      });
      
      if (lowHRVDays.length > 0 && highHRVDays.length > 0) {
           const avgSensoryLow = lowHRVDays.reduce((a,b) => a + b.neuroMetrics.capacity.sensory, 0) / lowHRVDays.length;
           const avgSensoryHigh = highHRVDays.reduce((a,b) => a + b.neuroMetrics.capacity.sensory, 0) / highHRVDays.length;

           if (avgSensoryHigh - avgSensoryLow > 1) {
               insights.push({
                   type: 'BIO-LINK',
                   title: 'Physiological Stress',
                   description: `Low HRV (Stress) predicts a ${(avgSensoryHigh - avgSensoryLow).toFixed(1)} point drop in your Sensory Tolerance.`,
                   score: 9.5
               });
           }
      }
  }

  return insights.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
};

/**
 * Strategy Generator
 * Returns AI-generated strategies if available, otherwise falls back to logic.
 */
export const generateDailyStrategy = (latestEntry: HealthEntry): StrategyRecommendation[] => {
    // 1. Prefer AI generated strategies from the entry
    if (latestEntry.aiStrategies && latestEntry.aiStrategies.length > 0) {
        return latestEntry.aiStrategies;
    }

    // 2. Fallback Logic (Legacy)
    const strategies: StrategyRecommendation[] = [];
    const metrics = latestEntry.neuroMetrics;
    const capacity = metrics.capacity;

    // Social Battery Check
    if (capacity.social <= 3) {
        strategies.push({
            id: 'social-low',
            title: 'Social Permission Slip',
            action: 'Your social bandwidth is critical. It is okay to cancel non-essential plans or switch to text-only communication.',
            type: 'SOCIAL',
            relevanceScore: 10
        });
    } else if (capacity.social >= 8) {
         strategies.push({
            id: 'social-high',
            title: 'Connection Opportunity',
            action: 'High social energy detected. Reach out to a friend you have missed.',
            type: 'SOCIAL',
            relevanceScore: 5
        });
    }

    // Sensory Management
    if (capacity.sensory <= 3 || metrics.sensoryLoad >= 7) {
        strategies.push({
            id: 'sensory-rescue',
            title: 'Sensory Rescue Protocol',
            action: 'High load / Low tolerance detected. Dim lights, wear headphones, and avoid supermarkets/crowds for 3 hours.',
            type: 'SENSORY',
            relevanceScore: 9
        });
    }

    // Focus & Flow
    if (capacity.focus >= 8 && capacity.sensory > 4) {
        strategies.push({
            id: 'hyperfocus-greenlight',
            title: 'Hyperfocus Greenlight',
            action: 'Conditions are perfect for deep work. Block notifications and dive into your special interest.',
            type: 'FOCUS',
            relevanceScore: 8
        });
    } else if (capacity.focus <= 3 && metrics.contextSwitches > 4) {
         strategies.push({
            id: 'scatter-brain',
            title: 'Executive Function Reset',
            action: 'Too many context switches. Stop multi-tasking. Pick ONE tiny task (5 mins) to complete.',
            type: 'FOCUS',
            relevanceScore: 8
        });
    }

    // Luteal/Cycle support
    if (metrics.cycleDay && metrics.cycleDay >= 22) {
         strategies.push({
            id: 'luteal-grace',
            title: 'Luteal Phase Grace',
            action: 'Hormones may be lowering your baseline today. Reduce demands by 30%. Do not make big decisions.',
            type: 'REST',
            relevanceScore: 9
        });
    }

    // General Low Spoons
    if (metrics.spoonLevel <= 3) {
         strategies.push({
            id: 'crash-prevention',
            title: 'Crash Prevention Mode',
            action: 'Capacity is critically low. Engage in "Passive Rest" (no screens, just rest) for 20 mins.',
            type: 'REST',
            relevanceScore: 10
        });
    }

    return strategies.sort((a,b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
};

/**
 * Predictive Engine
 * Calculates Burnout Trajectory based on 7-day Load vs Capacity ratio.
 */
export const calculateBurnoutTrajectory = (entries: HealthEntry[]): BurnoutForecast => {
    // 1. Get last 7 days of entries, sorted by date asc
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const recent = entries.filter(e => new Date(e.timestamp) >= sevenDaysAgo)
                          .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (recent.length < 3) {
        return {
            riskLevel: 'SUSTAINABLE',
            score: 0,
            daysUntilCrash: null,
            recoveryDaysNeeded: 0,
            accumulatedDeficit: 0,
            trend: 'STABLE',
            description: "Not enough data (need 3+ days) to predict trajectory."
        };
    }

    let totalLoadRatio = 0;
    let accumulatedDeficit = 0;
    let daysOverCapacity = 0;
    let recentTrend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
    
    // Analyze daily deltas
    recent.forEach(e => {
        const metrics = e.neuroMetrics;
        
        // Calculate Demand (0-10 scale approx)
        // Weighted: Sensory is heavy drain. Masking is heavy drain. Context switches add friction.
        const demandScore = (metrics.sensoryLoad * 1.2) + (metrics.maskingScore || 0) + ((metrics.contextSwitches || 0) * 0.5);
        
        // Calculate Capacity (0-10 scale approx)
        // SpoonLevel is the user's self-reported "available energy"
        // We assume 1 spoon ~= 1 unit of demand handling
        const capacityScore = Math.max(metrics.spoonLevel * 1.5, 1); // scaling factor to normalize scales
        
        const loadRatio = demandScore / capacityScore;
        totalLoadRatio += loadRatio;

        if (loadRatio > 1.1) {
            daysOverCapacity++;
            accumulatedDeficit += (demandScore - capacityScore);
        } else if (loadRatio < 0.8) {
            // Recovery day
            accumulatedDeficit = Math.max(0, accumulatedDeficit - (capacityScore - demandScore));
        }
    });

    const avgLoadRatio = totalLoadRatio / recent.length;

    // Determine Risk
    let riskLevel: 'SUSTAINABLE' | 'MODERATE' | 'CRITICAL' = 'SUSTAINABLE';
    let daysUntilCrash: number | null = null;
    let description = "Your capacity matches your demand. You are pacing well.";
    let recoveryDaysNeeded = 0;

    if (avgLoadRatio > 1.3 || daysOverCapacity >= 4) {
        riskLevel = 'CRITICAL';
        recoveryDaysNeeded = Math.ceil(accumulatedDeficit / 5) + 1; // Heuristic
        daysUntilCrash = Math.max(1, 3 - (daysOverCapacity - 4)); 
        description = `You are running at ${Math.round(avgLoadRatio * 100)}% capacity. You have exceeded limits for ${daysOverCapacity} days recently.`;
    } else if (avgLoadRatio > 1.0 || daysOverCapacity >= 2) {
        riskLevel = 'MODERATE';
        recoveryDaysNeeded = 1;
        daysUntilCrash = 5;
        description = "You are operating slightly above capacity. A crash is possible if you don't schedule rest soon.";
    }

    // Determine Trend
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const avgFirst = firstHalf.reduce((a,b) => a + (b.neuroMetrics.spoonLevel), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a,b) => a + (b.neuroMetrics.spoonLevel), 0) / secondHalf.length;
    
    if (avgSecond < avgFirst - 1) recentTrend = 'FALLING'; // Capacity is dropping
    else if (avgSecond > avgFirst + 1) recentTrend = 'RISING'; // Capacity is improving

    return {
        riskLevel,
        score: Math.min(100, avgLoadRatio * 50),
        daysUntilCrash,
        recoveryDaysNeeded,
        accumulatedDeficit,
        trend: recentTrend,
        description
    };
};

/**
 * Phase 5: Cognitive Load Calculator
 * Quantifies the "tax" of context switching.
 */
export const calculateCognitiveLoad = (entry: HealthEntry): CognitiveLoadMetrics => {
  const switches = entry.neuroMetrics.contextSwitches || 0;
  
  // Rule of thumb: Each switch costs ~5% efficiency due to "residue"
  // Cap at 60% loss
  const loss = Math.min(switches * 5, 60); 

  let state: 'FLOW' | 'MODERATE' | 'FRAGMENTED' = 'FLOW';
  let advice = "You found your flow today. Great pacing.";

  if (switches > 8) {
    state = 'FRAGMENTED';
    advice = "High fragmentation detected. Your brain paid a heavy tax on role-switching today. Prioritize single-tasking tomorrow.";
  } else if (switches > 4) {
    state = 'MODERATE';
    advice = "Moderate switching. Try clustering similar tasks (e.g. all admin in one block) to reduce cognitive drag.";
  }

  return {
    switches,
    efficiencyLoss: loss,
    state,
    advice
  };
};

/**
 * Phase 7: Hormonal Sync 2.0
 * Calculates cycle phase and predictive cognitive weather.
 */
export const calculateCyclePhase = (settings: UserSettings): CyclePhaseContext | null => {
    if (!settings.cycleStartDate) return null;

    const start = new Date(settings.cycleStartDate);
    const now = new Date();
    const length = settings.avgCycleLength || 28;
    
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const day = (daysSinceStart % length) + 1;
    
    let phase: CyclePhaseContext['phase'] = 'FOLLICULAR';
    let impact = "Neutral";
    let energy = "Moderate";
    let advice = "Track your patterns.";

    if (day >= 1 && day <= 5) {
        phase = 'MENSTRUAL';
        impact = "Restoration Needed";
        energy = "Low Physical / High Intuition";
        advice = "Low executive function is normal here. Prioritize passive rest and avoid heavy social demands.";
    } else if (day >= 6 && day <= 13) {
        phase = 'FOLLICULAR';
        impact = "High Focus & Creativity";
        energy = "Rising";
        advice = "Estrogen is rising. This is your best week for deep work, complex problem solving, and starting new projects.";
    } else if (day >= 14 && day <= 17) {
        phase = 'OVULATORY';
        impact = "Peak Social Bandwidth";
        energy = "High / Outward";
        advice = "Your social capacity is at its peak. Schedule meetings, difficult conversations, and social events now.";
    } else if (day >= 18 && day <= length) {
        phase = 'LUTEAL';
        impact = "Brain Fog & Sensory Risk";
        energy = "Waning / Inward";
        advice = "Progesterone rises. Expect lower executive function and higher sensory sensitivity. Do not blame yourself for 'laziness'—it is biology.";
    }

    return {
        phase,
        day,
        length,
        cognitiveImpact: impact,
        energyPrediction: energy,
        advice
    };
};
