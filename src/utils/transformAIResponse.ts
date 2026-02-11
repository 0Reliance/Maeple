import { FacialAnalysis } from "../types";

/**
 * Transforms AI response from various formats to standardized FacialAnalysis
 * Handles both camelCase and snake_case AI responses
 */
export const transformAIResponse = (aiResponse: any): FacialAnalysis => {
  console.log('[transformAIResponse] Input:', JSON.stringify(aiResponse, null, 2).substring(0, 500));
  
  // Handle facs_analysis wrapper (AI sometimes wraps response)
  let data = aiResponse;
  if (data.facs_analysis && typeof data.facs_analysis === 'object') {
    console.log('[transformAIResponse] Unwrapping facs_analysis wrapper');
    data = data.facs_analysis;
  }
  
  // Transform action units
  let actionUnits: any[] = [];
  if (data.action_units_detected && Array.isArray(data.action_units_detected)) {
    // AI returned snake_case with action_units_detected array
    actionUnits = data.action_units_detected.map((au: any) => ({
      auCode: au.au || au.auCode,
      name: au.name,
      intensity: au.intensity || 'C',
      intensityNumeric: au.intensity_numeric || au.intensityNumeric || 3,
      confidence: au.confidence || 0.5,
    }));
    console.log(`[transformAIResponse] Mapped ${actionUnits.length} AUs from action_units_detected`);
  } else if (data.actionUnits && Array.isArray(data.actionUnits)) {
    // AI already returned camelCase format
    actionUnits = data.actionUnits;
    console.log(`[transformAIResponse] Using ${actionUnits.length} AUs from actionUnits`);
  }
  
  // Transform FACS interpretation
  let facsInterpretation;
  if (data.interpretation_rules) {
    // AI returned snake_case interpretation_rules
    const rules = data.interpretation_rules;
    facsInterpretation = {
      duchennSmile: rules.duchenne_smile || rules.duchennSmile || false,
      socialSmile: rules.social_posed_smile || rules.socialSmile || false,
      maskingIndicators: rules.masking_indicators || rules.maskingIndicators || [],
      fatigueIndicators: rules.fatigue_cluster ? ['Fatigue detected'] : (rules.fatigue_indicators || rules.fatigueIndicators || []),
      tensionIndicators: rules.tension_cluster ? ['Tension detected'] : (rules.tension_indicators || rules.tensionIndicators || []),
    };
    console.log('[transformAIResponse] Mapped interpretation_rules to facsInterpretation');
  } else if (data.facsInterpretation) {
    // AI already returned camelCase format
    facsInterpretation = data.facsInterpretation;
    console.log('[transformAIResponse] Using existing facsInterpretation');
  } else {
    // Default interpretation
    facsInterpretation = {
      duchennSmile: false,
      socialSmile: false,
      maskingIndicators: [],
      fatigueIndicators: [],
      tensionIndicators: [],
    };
  }
  
  // Transform observations
  let observations: any[] = [];
  if (data.additional_observations) {
    const obs = data.additional_observations;
    observations = [
      ...(obs.lighting_conditions ? [{
        category: 'lighting',
        value: obs.lighting_conditions,
        evidence: 'Visual analysis',
        severity: obs.lighting_severity || 'moderate'
      }] : []),
      ...(obs.environmental_elements_visible ? obs.environmental_elements_visible.map((el: string) => ({
        category: 'environmental' as const,
        value: el,
        evidence: 'Visual detection',
        severity: 'low'
      })) : [])
    ];
  } else if (data.observations) {
    observations = data.observations;
  }
  
  // Extract jaw tension and eye fatigue
  let jawTension = data.jaw_tension || data.jawTension || 0;
  let eyeFatigue = data.eye_fatigue || data.eyeFatigue || 0;
  
  // Handle additional_observations jaw_tension and eye_fatigue
  if (data.additional_observations) {
    jawTension = data.additional_observations.jaw_tension ?? jawTension;
    eyeFatigue = data.additional_observations.eye_fatigue ?? eyeFatigue;
  }
  
  const result: FacialAnalysis = {
    confidence: data.confidence || 0.5,
    actionUnits,
    facsInterpretation,
    observations,
    lighting: data.lighting || (data.additional_observations?.lighting_conditions) || 'moderate',
    lightingSeverity: data.lightingSeverity || (data.additional_observations?.lighting_severity) || 'moderate',
    environmentalClues: data.environmental_clues || data.environmentalClues || (data.additional_observations?.environmental_elements_visible || []),
    jawTension,
    eyeFatigue,
    primaryEmotion: data.primary_emotion || data.primaryEmotion,
    signs: data.signs || [],
  };
  
  console.log('[transformAIResponse] Output:', {
    actionUnitsCount: result.actionUnits.length,
    hasFacsInterpretation: !!result.facsInterpretation,
    confidence: result.confidence,
    jawTension: result.jawTension,
    eyeFatigue: result.eyeFatigue
  });
  
  return result;
};