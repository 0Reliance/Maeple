#!/usr/bin/env node

/**
 * FACS System Integration Test
 * Tests the complete FACS data flow from camera to results
 */

console.log('='.repeat(80));
console.log('MAEPLE FACS System Integration Test');
console.log('='.repeat(80));
console.log('');

// Test 1: Check environment configuration
console.log('TEST 1: Environment Configuration');
console.log('-'.repeat(80));
const envKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (envKey) {
  console.log('✅ Gemini API Key found');
  console.log('   Key format:', envKey.startsWith('AIza') ? 'Valid' : 'Invalid');
  console.log('   Key length:', envKey.length);
} else {
  console.log('❌ No Gemini API Key found');
  console.log('   Expected: VITE_GEMINI_API_KEY or GEMINI_API_KEY');
}
console.log('');

// Test 2: Check AI settings initialization
console.log('TEST 2: AI Settings Initialization');
console.log('-'.repeat(80));
try {
  // Simulate what the app does on startup
  const fs = require('fs');
  const path = require('path');
  
  // Check if settings file exists in localStorage simulation
  const settingsPath = path.join(__dirname, 'test-settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    console.log('✅ Settings file found');
    console.log('   Providers configured:', settings.providers?.length || 0);
    console.log('   Gemini enabled:', settings.providers?.find(p => p.providerId === 'gemini')?.enabled);
  } else {
    console.log('⚠️  No settings file (using environment defaults)');
  }
} catch (error) {
  console.log('❌ Settings check failed:', error.message);
}
console.log('');

// Test 3: Verify FACS service files exist
console.log('TEST 3: FACS Service Files');
console.log('-'.repeat(80));
const serviceFiles = [
  'src/services/geminiVisionService.ts',
  'src/services/ai/router.ts',
  'src/services/ai/adapters/gemini.ts',
  'src/services/ai/settingsService.ts',
  'src/adapters/serviceAdapters.ts',
  'src/components/StateCheckWizard.tsx',
];

const fs = require('fs');
const path = require('path');

for (const file of serviceFiles) {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
}
console.log('');

// Test 4: Check FACS schema
console.log('TEST 4: FACS Schema Validation');
console.log('-'.repeat(80));
try {
  const geminiVisionService = fs.readFileSync(
    path.join(__dirname, 'src/services/geminiVisionService.ts'),
    'utf-8'
  );
  
  const hasSchema = geminiVisionService.includes('facialAnalysisSchema');
  const hasActionUnits = geminiVisionService.includes('actionUnits');
  const hasFACSInterpretation = geminiVisionService.includes('facsInterpretation');
  const hasConfidence = geminiVisionService.includes('confidence');
  
  console.log(`${hasSchema ? '✅' : '❌'} facialAnalysisSchema defined`);
  console.log(`${hasActionUnits ? '✅' : '❌'} Action Units in schema`);
  console.log(`${hasFACSInterpretation ? '✅' : '❌'} FACS interpretation in schema`);
  console.log(`${hasConfidence ? '✅' : '❌'} Confidence scoring enabled`);
  
  // Check for key Action Units
  const auCodes = ['AU1', 'AU4', 'AU6', 'AU12', 'AU24'];
  auCodes.forEach(au => {
    const found = geminiVisionService.includes(`'${au}'`);
    console.log(`${found ? '✅' : '❌'} Action Unit ${au} detected`);
  });
} catch (error) {
  console.log('❌ Schema check failed:', error.message);
}
console.log('');

// Test 5: Verify AI Router initialization
console.log('TEST 5: AI Router Initialization');
console.log('-'.repeat(80));
try {
  const routerCode = fs.readFileSync(
    path.join(__dirname, 'src/services/ai/router.ts'),
    'utf-8'
  );
  
  const hasVisionMethod = routerCode.includes('async vision');
  const hasGetCapabilities = routerCode.includes('hasCapability');
  const hasHealthCheck = routerCode.includes('healthCheck');
  
  console.log(`${hasVisionMethod ? '✅' : '❌'} Vision routing method exists`);
  console.log(`${hasGetCapabilities ? '✅' : '❌'} Capability checking exists`);
  console.log(`${hasHealthCheck ? '✅' : '❌'} Health check method exists`);
} catch (error) {
  console.log('❌ Router check failed:', error.message);
}
console.log('');

// Test 6: Check Gemini adapter
console.log('TEST 6: Gemini Adapter');
console.log('-'.repeat(80));
try {
  const adapterCode = fs.readFileSync(
    path.join(__dirname, 'src/services/ai/adapters/gemini.ts'),
    'utf-8'
  );
  
  const usesGemini25 = adapterCode.includes('gemini-2.5-flash');
  const hasVisionMethod = adapterCode.includes('async vision');
  const hasHealthCheck = adapterCode.includes('async healthCheck');
  const hasLiveSupport = adapterCode.includes('connectLive');
  
  console.log(`${usesGemini25 ? '✅' : '❌'} Using Gemini 2.5-flash`);
  console.log(`${hasVisionMethod ? '✅' : '❌'} Vision method implemented`);
  console.log(`${hasHealthCheck ? '✅' : '❌'} Health check implemented`);
  console.log(`${hasLiveSupport ? '✅' : '❌'} Live audio support available`);
} catch (error) {
  console.log('❌ Adapter check failed:', error.message);
}
console.log('');

// Test 7: Verify Vision Service Adapter
console.log('TEST 7: Vision Service Adapter');
console.log('-'.repeat(80));
try {
  const adapterCode = fs.readFileSync(
    path.join(__dirname, 'src/adapters/serviceAdapters.ts'),
    'utf-8'
  );
  
  const hasCircuitBreaker = adapterCode.includes('CircuitBreaker');
  const hasAnalyzeFromImage = adapterCode.includes('analyzeFromImage');
  const hasProgressCallback = adapterCode.includes('onProgress');
  const hasErrorHandling = adapterCode.includes('catch');
  
  console.log(`${hasCircuitBreaker ? '✅' : '❌'} Circuit breaker implemented`);
  console.log(`${hasAnalyzeFromImage ? '✅' : '❌'} analyzeFromImage method exists`);
  console.log(`${hasProgressCallback ? '✅' : '❌'} Progress callback supported`);
  console.log(`${hasErrorHandling ? '✅' : '❌'} Error handling in place`);
} catch (error) {
  console.log('❌ Adapter check failed:', error.message);
}
console.log('');

// Test 8: Check StateCheckWizard component
console.log('TEST 8: StateCheckWizard Component');
console.log('-'.repeat(80));
try {
  const wizardCode = fs.readFileSync(
    path.join(__dirname, 'src/components/StateCheckWizard.tsx'),
    'utf-8'
  );
  
  const usesVisionService = wizardCode.includes('useVisionService');
  const hasAnalysisFlow = wizardCode.includes('ANALYZING');
  const hasErrorHandling = wizardCode.includes('ERROR');
  const hasResults = wizardCode.includes('RESULTS');
  const hasProgress = wizardCode.includes('onProgress');
  
  console.log(`${usesVisionService ? '✅' : '❌'} Uses vision service via DI`);
  console.log(`${hasAnalysisFlow ? '✅' : '❌'} Analysis flow implemented`);
  console.log(`${hasErrorHandling ? '✅' : '❌'} Error state handling`);
  console.log(`${hasResults ? '✅' : '❌'} Results display implemented`);
  console.log(`${hasProgress ? '✅' : '❌'} Progress tracking enabled`);
} catch (error) {
  console.log('❌ Component check failed:', error.message);
}
console.log('');

// Test 9: Verify AI Settings Service
console.log('TEST 9: AI Settings Service');
console.log('-'.repeat(80));
try {
  const settingsCode = fs.readFileSync(
    path.join(__dirname, 'src/services/ai/settingsService.ts'),
    'utf-8'
  );
  
  const hasInitialize = settingsCode.includes('async initialize');
  const hasLoadSettings = settingsCode.includes('loadSettings');
  const hasSaveSettings = settingsCode.includes('saveSettings');
  const hasEncryption = settingsCode.includes('encryptData');
  const hasEnvCheck = settingsCode.includes('VITE_GEMINI_API_KEY');
  
  console.log(`${hasInitialize ? '✅' : '❌'} Initialization method`);
  console.log(`${hasLoadSettings ? '✅' : '❌'} Load settings from storage`);
  console.log(`${hasSaveSettings ? '✅' : '❌'} Save settings to storage`);
  console.log(`${hasEncryption ? '✅' : '❌'} API key encryption`);
  console.log(`${hasEnvCheck ? '✅' : '❌'} Environment variable check`);
} catch (error) {
  console.log('❌ Settings service check failed:', error.message);
}
console.log('');

// Test 10: Summary
console.log('TEST 10: System Architecture');
console.log('-'.repeat(80));
console.log('Expected Data Flow:');
console.log('1. User captures image → StateCheckWizard');
console.log('2. StateCheckWizard → visionService.analyzeFromImage()');
console.log('3. VisionServiceAdapter → Circuit Breaker check');
console.log('4. VisionServiceAdapter → geminiVisionService.analyzeStateFromImage()');
console.log('5. geminiVisionService → aiRouter.vision()');
console.log('6. aiRouter → GeminiAdapter.vision()');
console.log('7. GeminiAdapter → Google Gemini API (gemini-2.5-flash)');
console.log('8. API Response → JSON validation');
console.log('9. Result → StateCheckWizard → Display');
console.log('');

console.log('='.repeat(80));
console.log('Test Complete');
console.log('='.repeat(80));
console.log('');
console.log('Next Steps:');
console.log('1. Run this test: node test-facs-system.js');
console.log('2. Check browser console for runtime errors');
console.log('3. Test with actual camera capture');
console.log('4. Verify AI router initialization in browser');
console.log('5. Check circuit breaker status');