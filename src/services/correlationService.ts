/**
 * Correlation Service
 * 
 * Analyzes relationships between subjective self-reports and objective observations.
 * Provides real-time correlation analysis, pattern detection, and insights.
 */

import { ObjectiveObservation, HealthEntry, CapacityProfile, Observation } from '../types';
import { StoredObservation } from '../contexts/ObservationContext';

export interface CorrelationAnalysis {
  score: number; // 0-1: How well do subjective and objective align?
  alignment: 'high' | 'moderate' | 'low' | 'mismatch';
  subjectiveVsObjective: {
    subjectiveCapacity: number; // Self-reported (1-10)
    objectiveIndicators: string[]; // What observations show
    discrepancy: number; // Difference between perception and reality
  };
  patterns: CorrelationPattern[];
  insights: CorrelationInsight[];
  masking: {
    detected: boolean;
    confidence: number; // 0-1
    indicators: string[];
  };
  recommendations: CorrelationRecommendation[];
}

export interface CorrelationPattern {
  dimension: string; // e.g., "Sensory Load", "Social Fatigue"
  frequency: number; // How often observed (0-1)
  consistency: number; // How consistent is the pattern (0-1)
  examples: string[];
}

export interface CorrelationInsight {
  title: string;
  description: string;
  confidence: number; // 0-1
  basedonObservations: string[]; // Which observations led to this
}

export interface CorrelationRecommendation {
  area: string;
  action: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high';
  basedOn: string[];
}

class CorrelationService {
  /**
   * Analyze correlation between subjective entry and objective observations
   */
  analyzeEntry(
    entry: HealthEntry,
    observations: StoredObservation[]
  ): CorrelationAnalysis {
    const recentObservations = this.getRecentObservations(observations, 24);
    
    const subjectiveVsObjective = this.compareSubjectiveObjective(
      entry,
      recentObservations
    );

    const patterns = this.detectPatterns(entry, recentObservations);
    const insights = this.generateInsights(entry, patterns, recentObservations);
    const masking = this.detectMasking(entry, recentObservations);
    const recommendations = this.generateRecommendations(
      entry,
      patterns,
      insights,
      masking
    );

    const alignment = this.calculateAlignment(subjectiveVsObjective.discrepancy);

    return {
      score: 1 - (subjectiveVsObjective.discrepancy / 10),
      alignment,
      subjectiveVsObjective,
      patterns,
      insights,
      masking,
      recommendations,
    };
  }

  /**
   * Compare subjective self-report with objective observations
   */
  private compareSubjectiveObjective(
    entry: HealthEntry,
    observations: StoredObservation[]
  ) {
    const subjectiveCapacity = entry.neuroMetrics?.spoonLevel ?? 5;
    
    // Extract objective indicators from observations
    const objectiveIndicators: string[] = [];
    let fatigueScore = 0;
    let tensionScore = 0;

    observations.forEach(obs => {
      obs.observations.forEach(item => {
        if (item.category === 'fatigue') {
          fatigueScore += item.severity === 'high' ? 1 : item.severity === 'moderate' ? 0.5 : 0.25;
          objectiveIndicators.push(`Fatigue observed: ${item.value}`);
        } else if (item.category === 'tension') {
          tensionScore += item.severity === 'high' ? 1 : item.severity === 'moderate' ? 0.5 : 0.25;
          objectiveIndicators.push(`Tension observed: ${item.value}`);
        }
      });
    });

    // Convert to 1-10 scale
    const objectiveLoad = Math.min(10, (fatigueScore + tensionScore) * 2);
    
    // Calculate discrepancy
    // If person reports high capacity but shows fatigue, that's a mismatch
    const discrepancy = Math.abs(subjectiveCapacity - (10 - objectiveLoad));

    return {
      subjectiveCapacity,
      objectiveIndicators,
      discrepancy,
    };
  }

  /**
   * Detect recurring patterns in behavior and observations
   */
  private detectPatterns(
    entry: HealthEntry,
    observations: StoredObservation[]
  ): CorrelationPattern[] {
    const patterns: CorrelationPattern[] = [];

    // Pattern: Tension with specific activities
    if (entry.activityTypes?.includes('#Meeting') && 
        this.hasObservation(observations, 'tension')) {
      patterns.push({
        dimension: 'Meeting Stress',
        frequency: 0.7,
        consistency: 0.8,
        examples: ['Jaw tension during meetings', 'Post-meeting fatigue'],
      });
    }

    // Pattern: Sensory sensitivity
    if (entry.notes?.toLowerCase().includes('bright') || 
        entry.notes?.toLowerCase().includes('loud')) {
      const lightingObs = observations.filter(o => 
        o.observations.some(item => item.category === 'lighting')
      );
      if (lightingObs.length > 0) {
        patterns.push({
          dimension: 'Sensory Overload',
          frequency: 0.6,
          consistency: 0.7,
          examples: ['Bright lighting sensitivity', 'Seeks quiet environments'],
        });
      }
    }

    // Pattern: Time-of-day capacity decline
    const entryHour = new Date(entry.timestamp).getHours();
    const spoonLevel = entry.neuroMetrics?.spoonLevel ?? 5;
    if (entryHour >= 17 && spoonLevel < 4) {
      patterns.push({
        dimension: 'End-of-Day Fatigue',
        frequency: 0.5,
        consistency: 0.6,
        examples: ['Energy drops after 5 PM', 'Decision fatigue evident'],
      });
    }

    return patterns;
  }

  /**
   * Generate actionable insights from data
   */
  private generateInsights(
    entry: HealthEntry,
    patterns: CorrelationPattern[],
    observations: StoredObservation[]
  ): CorrelationInsight[] {
    const insights: CorrelationInsight[] = [];

    // Insight: Masking detection
    const maskingScore = entry.neuroMetrics?.maskingScore ?? 0;
    if (maskingScore > 6 && this.hasObservation(observations, 'tension')) {
      insights.push({
        title: 'Possible Masking Detected',
        description: 'High self-reported masking effort combined with visible jaw tension suggests you may be suppressing authentic responses.',
        confidence: 0.7,
        basedonObservations: ['jaw tension', 'masking score'],
      });
    }

    // Insight: Capacity alignment
    patterns.forEach(p => {
      insights.push({
        title: `Pattern Detected: ${p.dimension}`,
        description: `This pattern occurs consistently (${Math.round(p.consistency * 100)}% of the time).`,
        confidence: p.consistency,
        basedonObservations: p.examples,
      });
    });

    // Insight: Strengths
    if (entry.strengths && entry.strengths.length > 0) {
      insights.push({
        title: 'Strengths Observed',
        description: `You're leveraging ${entry.strengths.join(', ')}. These character strengths are well-aligned with your activities today.`,
        confidence: 0.8,
        basedonObservations: entry.strengths,
      });
    }

    return insights;
  }

  /**
   * Detect signs of masking (suppressing authentic self)
   */
  private detectMasking(
    entry: HealthEntry,
    observations: StoredObservation[]
  ) {
    const maskingScore = entry.neuroMetrics?.maskingScore ?? 0;
    let indicators: string[] = [];
    let confidence = 0;

    // Check for discrepancy between reported mood and facial tension
    if (entry.mood >= 4 && this.hasObservation(observations, 'tension')) {
      indicators.push('Reports positive mood but shows facial tension');
      confidence += 0.3;
    }

    // Check for over-extension in activities
    if ((entry.activityTypes?.length ?? 0) > 5) {
      indicators.push('Scheduled more activities than capacity suggests');
      confidence += 0.2;
    }

    // High masking self-report
    if (maskingScore > 6) {
      indicators.push('Self-reports high social masking effort');
      confidence += 0.4;
    }

    // Speech/tone analysis (if available)
    const voiceObs = observations.filter(o => o.source === 'voice');
    if (voiceObs.length > 0) {
      const fastSpeech = voiceObs.some(o =>
        o.observations.some(item => item.category === 'speech-pace')
      );
      if (fastSpeech) {
        indicators.push('Speech pace indicates anxiety or pressure');
        confidence += 0.2;
      }
    }

    return {
      detected: confidence > 0.4,
      confidence: Math.min(1, confidence),
      indicators,
    };
  }

  /**
   * Generate targeted recommendations
   */
  private generateRecommendations(
    entry: HealthEntry,
    patterns: CorrelationPattern[],
    insights: CorrelationInsight[],
    masking: { detected: boolean; confidence: number; indicators: string[] }
  ): CorrelationRecommendation[] {
    const recommendations: CorrelationRecommendation[] = [];

    // Masking-related recommendation
    if (masking.detected) {
      recommendations.push({
        area: 'Self-Authenticity',
        action: 'Schedule a 15-minute break to check in with yourself without external demands.',
        rationale: 'Signs suggest you may be suppressing your authentic needs. Even brief self-connection helps.',
        priority: 'high',
        basedOn: masking.indicators,
      });
    }

    // Pattern-based recommendations
    patterns.forEach(pattern => {
      if (pattern.dimension === 'Meeting Stress') {
        recommendations.push({
          area: 'Social Energy',
          action: 'Consider shorter meetings or async alternatives when possible.',
          rationale: 'Tension patterns show meetings are particularly draining.',
          priority: 'medium',
          basedOn: pattern.examples,
        });
      }

      if (pattern.dimension === 'Sensory Overload') {
        recommendations.push({
          area: 'Environment',
          action: 'Adjust lighting (reduce brightness), use noise-canceling if available.',
          rationale: 'Sensory sensitivity is driving fatigue.',
          priority: 'medium',
          basedOn: pattern.examples,
        });
      }

      if (pattern.dimension === 'End-of-Day Fatigue') {
        recommendations.push({
          area: 'Energy Management',
          action: 'Front-load demanding tasks earlier in the day.',
          rationale: 'Capacity consistently drops after 5 PM.',
          priority: 'low',
          basedOn: pattern.examples,
        });
      }
    });

    // Capacity-based recommendations
    if ((entry.neuroMetrics?.spoonLevel ?? 5) < 3) {
      recommendations.push({
        area: 'Recovery',
        action: 'Prioritize rest today. Skip non-essential activities.',
        rationale: 'Capacity is critically low. Recovery is more important than productivity.',
        priority: 'high',
        basedOn: ['Low spoon level'],
      });
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Calculate alignment quality
   */
  private calculateAlignment(
    discrepancy: number
  ): 'high' | 'moderate' | 'low' | 'mismatch' {
    if (discrepancy < 1.5) return 'high';
    if (discrepancy < 3) return 'moderate';
    if (discrepancy < 5) return 'low';
    return 'mismatch';
  }

  /**
   * Get observations from the last N hours
   */
  private getRecentObservations(
    observations: StoredObservation[],
    hoursAgo: number
  ): StoredObservation[] {
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return observations.filter(
      o => new Date(o.timestamp) > cutoff
    );
  }

  /**
   * Check if observations contain a specific category
   */
  private hasObservation(
    observations: StoredObservation[],
    category: Observation['category']
  ): boolean {
    return observations.some(o =>
      o.observations.some(item => item.category === category)
    );
  }
}

// Singleton instance
export const correlationService = new CorrelationService();

/**
 * Hook for using correlation service in React components
 */
import { useCallback } from 'react';

export const useCorrelationAnalysis = () => {
  const analyze = useCallback(
    (entry: HealthEntry, observations: StoredObservation[]) => {
      return correlationService.analyzeEntry(entry, observations);
    },
    []
  );

  return { analyze };
};
