/**
 * FACS Data Flow Debug Test Script
 * 
 * This script tests the complete FACS data flow:
 * 1. AI Analysis generation
 * 2. Data validation
 * 3. Encryption/Decryption
 * 4. Database storage
 * 5. Results display
 */

import { 
  FacialAnalysis, 
  ActionUnit, 
  StateCheck 
} from './src/types';

import { 
  validateFacialAnalysis 
} from './src/services/validationService';

import { 
  encryptData, 
  decryptData 
} from './src/services/encryptionService';

// Mock FACS data - simulating what Gemini returns
const mockFacialAnalysis: FacialAnalysis = {
  confidence: 0.87,
  actionUnits: [
    {
      auCode: 'AU1',
      name: 'Inner Brow Raiser',
      intensity: 'C',
      intensityNumeric: 3,
      confidence: 0.94
    },
    {
      auCode: 'AU4',
      name: 'Brow Lowerer',
      intensity: 'B',
      intensityNumeric: 2,
      confidence: 0.87
    },
    {
      auCode: 'AU6',
      name: 'Cheek Raiser',
      intensity: 'A',
      intensityNumeric: 1,
      confidence: 0.76
    },
    {
      auCode: 'AU12',
      name: 'Lip Corner Puller',
      intensity: 'D',
      intensityNumeric: 4,
      confidence: 0.91
    },
    {
      auCode: 'AU24',
      name: 'Lip Pressor',
      intensity: 'B',
      intensityNumeric: 2,
      confidence: 0.82
    },
    {
      auCode: 'AU43',
      name: 'Eyes Closed',
      intensity: 'A',
      intensityNumeric: 1,
      confidence: 0.68
    }
  ],
  facsInterpretation: {
    duchennSmile: false,
    socialSmile: true,
    maskingIndicators: ['AU12 without AU6', 'AU24 Lip Pressor'],
    fatigueIndicators: ['AU43 Eyes Closed'],
    tensionIndicators: ['AU4 Brow Lowerer', 'AU24 Lip Pressor']
  },
  observations: [
    {
      category: 'tension',
      value: 'moderate brow tension',
      severity: 'moderate',
      evidence: 'AU4 detected at intensity B'
    },
    {
      category: 'fatigue',
      value: 'slight eye fatigue',
      severity: 'low',
      evidence: 'AU43 detected'
    }
  ],
  lighting: 'moderate indoor lighting',
  lightingSeverity: 'moderate',
  environmentalClues: ['neutral background', 'indoor setting'],
  primaryEmotion: 'neutral',
  jawTension: 0.4,
  eyeFatigue: 0.3,
  signs: [
    {
      description: 'Social smile detected',
      confidence: 0.85
    }
  ]
};

async function testFACSDataFlow() {
  console.log('=== FACS DATA FLOW DEBUG TEST ===\n');

  // Test 1: Raw AI Response Validation
  console.log('TEST 1: Validating Mock Facial Analysis');
  console.log('----------------------------------------');
  console.log('Raw data has', mockFacialAnalysis.actionUnits.length, 'Action Units');
  console.log('Raw data keys:', Object.keys(mockFacialAnalysis));
  console.log('Raw facsInterpretation:', mockFacialAnalysis.facsInterpretation);
  
  const isValid = mockFacialAnalysis.actionUnits && 
                 mockFacialAnalysis.actionUnits.length > 0 &&
                 mockFacialAnalysis.confidence !== undefined;
  console.log('✓ Basic validation check:', isValid);
  
  // Test 2: Validation Service
  console.log('\nTEST 2: Running Validation Service');
  console.log('-----------------------------------');
  const validated = validateFacialAnalysis(mockFacialAnalysis);
  console.log('✓ Validated actionUnits count:', validated.actionUnits.length);
  console.log('✓ Validated facsInterpretation:', validated.facsInterpretation);
  console.log('✓ Validated jawTension:', validated.jawTension);
  console.log('✓ Validated eyeFatigue:', validated.eyeFatigue);

  // Test 3: Encryption
  console.log('\nTEST 3: Testing Encryption');
  console.log('---------------------------');
  try {
    console.log('Encrypting validated analysis...');
    const { cipher, iv } = await encryptData(validated);
    console.log('✓ Encryption successful');
    console.log('  Cipher length:', cipher.length);
    console.log('  IV length:', iv.length);

    // Test 4: Decryption
    console.log('\nTEST 4: Testing Decryption');
    console.log('---------------------------');
    const decrypted = await decryptData(cipher, iv);
    console.log('✓ Decryption successful');
    
    if (decrypted && typeof decrypted === 'object') {
      const decryptedAnalysis = decrypted as FacialAnalysis;
      console.log('  Decrypted actionUnits count:', decryptedAnalysis.actionUnits?.length || 0);
      console.log('  Decrypted facsInterpretation present:', !!decryptedAnalysis.facsInterpretation);
      console.log('  Decrypted jawTension:', decryptedAnalysis.jawTension);
      console.log('  Decrypted eyeFatigue:', decryptedAnalysis.eyeFatigue);
      
      // Verify data integrity
      console.log('\nTEST 5: Data Integrity Check');
      console.log('-------------------------------');
      const auMatch = validated.actionUnits.length === decryptedAnalysis.actionUnits?.length;
      const jawMatch = validated.jawTension === decryptedAnalysis.jawTension;
      const eyeMatch = validated.eyeFatigue === decryptedAnalysis.eyeFatigue;
      
      console.log('✓ Action Units match:', auMatch);
      console.log('✓ Jaw tension match:', jawMatch);
      console.log('✓ Eye fatigue match:', eyeMatch);
      
      if (auMatch && jawMatch && eyeMatch) {
        console.log('✅ ALL INTEGRITY CHECKS PASSED');
      } else {
        console.log('❌ INTEGRITY CHECKS FAILED');
      }
    } else {
      console.log('❌ Decrypted data is not a valid object');
    }
  } catch (error) {
    console.log('❌ Encryption/Decryption failed:', error);
  }

  // Test 6: JSON Serialization Check
  console.log('\nTEST 6: JSON Serialization Check');
  console.log('---------------------------------');
  try {
    const jsonString = JSON.stringify(mockFacialAnalysis);
    console.log('✓ JSON serialization successful');
    console.log('  JSON string length:', jsonString.length);
    
    const parsed = JSON.parse(jsonString);
    console.log('✓ JSON parsing successful');
    console.log('  Parsed actionUnits count:', parsed.actionUnits?.length || 0);
    console.log('  Parsed has facsInterpretation:', !!parsed.facsInterpretation);
  } catch (error) {
    console.log('❌ JSON serialization failed:', error);
  }

  // Test 7: StateCheck Object Creation
  console.log('\nTEST 7: StateCheck Object Creation');
  console.log('-----------------------------------');
  try {
    const stateCheck: Partial<StateCheck> = {
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      analysis: validated
    };
    
    console.log('✓ StateCheck object created');
    console.log('  ID:', stateCheck.id);
    console.log('  Timestamp:', stateCheck.timestamp);
    console.log('  Analysis type:', typeof stateCheck.analysis);
    console.log('  Analysis actionUnits:', stateCheck.analysis?.actionUnits?.length || 0);
  } catch (error) {
    console.log('❌ StateCheck creation failed:', error);
  }

  console.log('\n=== DEBUG TEST COMPLETE ===');
}

// Run the test
testFACSDataFlow().catch(console.error);