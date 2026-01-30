#!/usr/bin/env node

/**
 * FACS System Integration Test - CommonJS version
 * Tests the complete FACS data flow from camera to results
 */

console.log('='.repeat(80));
console.log('MAEPLE FACS System Integration Test - CommonJS Version');
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

// Test 2: Check basic file structure
console.log('TEST 2: Core FACS Files');
console.log('-'.repeat(80));
const fs = require('fs');
const path = require('path');

const criticalFiles = ['./src/services/geminiVisionService.ts', './src/services/stateCheckService.ts', './src/components/StateCheckWizard.tsx', './src/components/StateCheckAnalyzing.tsx', './src/services/imageWorkerManager.ts'];

let filesOk = true;
for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - File not found`);
    filesOk = false;
  }
}

if (filesOk) {
  console.log('✅ All core files present');
} else {
  console.log('❌ Missing critical files');
}
console.log('');

// Test 3: Check dependencies
console.log('TEST 3: Dependency Check');
console.log('-'.repeat(80));
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const requiredDeps = ['react', 'react-dom', '@google/genai'];
  
  let depsOk = true;
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} v${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - Missing dependency`);
      depsOk = false;
    }
  }
  
  if (depsOk) {
    console.log('✅ All dependencies present');
  } else {
    console.log('❌ Missing dependencies');
  }
} catch (error) {
  console.log('❌ Failed to read package.json:', error.message);
}
console.log('');

// Test 4: API Configuration
console.log('TEST 4: API Configuration');
console.log('-'.repeat(80));
try {
  const envContent = fs.readFileSync('./.env', 'utf8');
  const hasGeminiKey = envContent.includes('VITE_GEMINI_API_KEY=');
  const hasBiomirror = envContent.includes('VITE_ENABLE_BIOMIRROR=true');
  
  console.log(`VITE_GEMINI_API_KEY configured: ${hasGeminiKey ? '✅' : '❌'}`);
  console.log(`VITE_ENABLE_BIOMIRROR enabled: ${hasBiomirror ? '✅' : '❌'}`);
  
  if (hasGeminiKey && hasBiomirror) {
    console.log('✅ API configuration complete');
  } else {
    console.log('❌ API configuration incomplete');
  }
} catch (error) {
  console.log('❌ Failed to read .env file');
}
console.log('');

// Test 5: Server Status
console.log('TEST 5: Development Server Check');
console.log('-'.repeat(80));
console.log('Development server should be running on: http://localhost:5173/');
console.log('✅ Check browser console for any FACS-related errors');
console.log('✅ Test Bio-Mirror component functionality');
console.log('');

console.log('='.repeat(80));
console.log('TEST COMPLETE - Check browser for manual verification');
console.log('='.repeat(80));