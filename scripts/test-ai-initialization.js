/**
 * Test AI Initialization
 * 
 * Run this script to verify AI initialization is working correctly.
 * Usage: node scripts/test-ai-initialization.js
 */

console.log('=== AI Initialization Test ===\n');

// Test 1: Check environment variable
console.log('Test 1: Environment Variable Check');
console.log('----------------------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_GEMINI_API_KEY exists:', !!process.env.VITE_GEMINI_API_KEY);
console.log('API_KEY exists:', !!process.env.API_KEY);

if (process.env.VITE_GEMINI_API_KEY) {
  const keyLength = process.env.VITE_GEMINI_API_KEY.length;
  console.log('API Key length:', keyLength);
  console.log('API Key preview:', process.env.VITE_GEMINI_API_KEY.substring(0, 4) + '...');
} else {
  console.log('❌ No API key found in environment');
  console.log('\nTo fix this, add to Maeple/.env:');
  console.log('  VITE_GEMINI_API_KEY=your_actual_api_key_here');
}

// Test 2: Check if settings service can load
console.log('\nTest 2: Settings Service Loading');
console.log('----------------------------------');
console.log('This test requires running in browser context');
console.log('Open browser console and run:');
console.log('  import { aiSettingsService } from "./src/services/ai/settingsService"');
console.log('  await aiSettingsService.initialize()');
console.log('  console.log(aiSettingsService.getSettings())');

// Test 3: Expected initialization flow
console.log('\nTest 3: Expected Initialization Flow');
console.log('-------------------------------------');
console.log('When app starts, should see these logs in browser console:');
console.log('');
console.log('[AISettings] Environment variable check: {');
console.log('  hasImportMeta: true,');
console.log('  hasViteEnv: true,  // or false if no key');
console.log('  hasProcessEnv: false,');
console.log('  foundKey: true  // or false if no key');
console.log('}');
console.log('[AISettings] Found API key in environment, creating Gemini provider');
console.log('[AISettings] API key length: 39 (showing first 4 chars: abcd...)');
console.log('[AISettings] Settings saved successfully with 1 provider(s)');
console.log('[AIRouter] Initializing with settings: {...}');
console.log('[AIRouter] Initializing adapter for gemini');
console.log('[AIRouter] Successfully initialized gemini adapter');
console.log('[AIRouter] Initialization complete: 1 adapters ready');

// Test 4: Verification steps
console.log('\nTest 4: Verification Steps');
console.log('-------------------------');
console.log('1. Start the dev server: npm run dev');
console.log('2. Open browser to http://localhost:5173');
console.log('3. Open browser console (F12)');
console.log('4. Look for the logs shown in Test 3');
console.log('5. Try capturing a photo');
console.log('6. Check for FACS analysis results');
console.log('');
console.log('Expected FACS result:');
console.log('  - confidence: number > 0.5');
console.log('  - actionUnits: non-empty array');
console.log('  - observations: non-empty array');

console.log('\n=== Test Complete ===');
console.log('\nSee FACS_DEBUGGING_GUIDE.md for more details');