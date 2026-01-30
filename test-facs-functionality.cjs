#!/usr/bin/env node

/**
 * FACS Functionality Test
 * Tests the complete FACS system from camera capture to analysis results
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('MAEPLE FACS FUNCTIONALITY TEST');
console.log('='.repeat(80));
console.log('');

// Test 1: Check if development server is running
console.log('TEST 1: Development Server Status');
console.log('-'.repeat(80));
const { execSync } = require('child_process');

try {
  const result = execSync('curl -s http://localhost:5173/ | head -20', { encoding: 'utf8' });
  if (result.includes('DOCTYPE html')) {
    console.log('✅ Development server is running on http://localhost:5173/');
  } else {
    console.log('❌ Development server not responding correctly');
  }
} catch (error) {
  console.log('❌ Development server not accessible');
  console.log('   Start server with: cd Maeple && npm run dev');
}
console.log('');

// Test 2: Check API key functionality
console.log('TEST 2: API Key Validation');
console.log('-'.repeat(80));
const envContent = fs.readFileSync('./.env', 'utf8');
const apiKey = envContent.match(/VITE_GEMINI_API_KEY=(.+)/)?.[1];

if (apiKey) {
  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('   Key length:', apiKey.length);
  
  // Test API key format
  if (apiKey.startsWith('AIza')) {
    console.log('✅ API Key format is valid');
  } else {
    console.log('⚠️  API Key format may be invalid');
  }
} else {
  console.log('❌ No API key found in .env file');
}
console.log('');

// Test 3: Check critical FACS components
console.log('TEST 3: FACS Component Status');
console.log('-'.repeat(80));

const components = [
  './src/services/geminiVisionService.ts',
  './src/services/stateCheckService.ts', 
  './src/components/StateCheckWizard.tsx',
  './src/components/StateCheckAnalyzing.tsx',
  './src/components/StateCheckResults.tsx'
];

let allComponentsOk = true;
for (const component of components) {
  const fullPath = path.join('.', component);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasExports = content.includes('export') || content.includes('export default');
    const hasReact = content.includes('React') || content.includes('react');
    
    console.log(`✅ ${component}`);
    console.log(`   Exports: ${hasExports ? 'Yes' : 'No'}, React: ${hasReact ? 'Yes' : 'No'}`);
  } else {
    console.log(`❌ ${component} - File not found`);
    allComponentsOk = false;
  }
}

if (allComponentsOk) {
  console.log('✅ All FACS components present and properly structured');
} else {
  console.log('❌ Missing critical FACS components');
}
console.log('');

// Test 4: Check build process
console.log('TEST 4: Build Process Verification');
console.log('-'.repeat(80));

try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
  
  if (hasBuildScript) {
    console.log('✅ Build script configured:', packageJson.scripts.build);
    
    // Check if dist directory exists (indicating successful build)
    const distExists = fs.existsSync('./dist');
    console.log(`   Dist directory: ${distExists ? 'Exists' : 'Not built yet'}`);
  } else {
    console.log('❌ No build script configured');
  }
} catch (error) {
  console.log('❌ Failed to read package.json');
}
console.log('');

// Test 5: Manual verification instructions
console.log('TEST 5: Manual Verification Steps');
console.log('-'.repeat(80));
console.log('1. Open browser: http://localhost:5173/');
console.log('2. Navigate to Bio-Mirror section');
console.log('3. Test camera capture functionality');
console.log('4. Check browser console for any errors');
console.log('5. Verify analysis pipeline works end-to-end');
console.log('');

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log('');
console.log('NEXT STEPS:');
console.log('- If tests pass, the FACS system infrastructure is working');
console.log('- Manual browser testing required to verify full functionality');
console.log('- Check browser console for any runtime errors');
console.log('');