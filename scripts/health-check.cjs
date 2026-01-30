#!/usr/bin/env node
/**
 * MAEPLE Health Check Script
 * Validates environment and dependencies before running the app
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 MAEPLE Health Check');
console.log('='.repeat(50));
console.log('');

let hasErrors = false;
let hasWarnings = false;

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
const minVersion = 18;

console.log('📦 Environment:');
if (majorVersion >= minVersion) {
  console.log(`  ✅ Node.js: ${nodeVersion}`);
} else {
  console.log(`  ❌ Node.js: ${nodeVersion} (v${minVersion}+ required)`);
  hasErrors = true;
}

// Check npm version
try {
  const { execSync } = require('child_process');
  const npmVersion = execSync('npm -v', { encoding: 'utf-8' }).trim();
  console.log(`  ✅ npm: v${npmVersion}`);
} catch (e) {
  console.log(`  ⚠️  npm: Unable to detect version`);
  hasWarnings = true;
}

console.log('');

// Check for node_modules
console.log('📚 Dependencies:');
const modulesExist = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
if (modulesExist) {
  console.log('  ✅ node_modules directory exists');
  
  // Check package count
  try {
    const packageJson = require('../package.json');
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    console.log(`  ✅ ${depCount} dependencies, ${devDepCount} dev dependencies`);
  } catch (e) {
    console.log('  ⚠️  Unable to read package.json');
  }
} else {
  console.log('  ❌ node_modules not found');
  console.log('     Run: npm install');
  hasErrors = true;
}

console.log('');

// Check .env file
console.log('⚙️  Configuration:');
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('  ✅ .env file exists');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Check Gemini API Key
    if (envContent.includes('VITE_GEMINI_API_KEY=')) {
      if (envContent.includes('your_gemini_api_key_here')) {
        console.log('  ⚠️  Gemini API Key: Using placeholder');
        console.log('     Update in .env for AI features to work');
        console.log('     Get key at: https://aistudio.google.com/app/apikey');
        hasWarnings = true;
      } else if (envContent.match(/VITE_GEMINI_API_KEY=\s*$/m)) {
        console.log('  ⚠️  Gemini API Key: Empty');
        hasWarnings = true;
      } else {
        console.log('  ✅ Gemini API Key: Configured');
      }
    } else {
      console.log('  ❌ Gemini API Key: Missing from .env');
      hasWarnings = true;
    }
    
    // Check optional Supabase
    if (envContent.includes('VITE_SUPABASE_URL=') && 
        !envContent.includes('your-project.supabase.co')) {
      console.log('  ✅ Supabase: Configured (cloud sync enabled)');
    } else {
      console.log('  ℹ️  Supabase: Not configured (optional)');
    }
    
    // Check optional Oura
    if (envContent.includes('VITE_OURA_CLIENT_ID=') && 
        !envContent.includes('your_oura_client_id')) {
      console.log('  ✅ Oura Ring: Configured');
    } else {
      console.log('  ℹ️  Oura Ring: Not configured (optional)');
    }
  } catch (e) {
    console.log('  ⚠️  Unable to read .env file');
    hasWarnings = true;
  }
} else {
  console.log('  ⚠️  .env file not found');
  console.log('     Run: cp .env.example .env');
  hasWarnings = true;
}

console.log('');

// Check important files
console.log('📄 Project Files:');
const criticalFiles = [
  'package.json',
  'vite.config.ts',
  'index.html',
  'src/App.tsx'
];

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} missing`);
    hasErrors = true;
  }
});

console.log('');
console.log('='.repeat(50));

// Summary
if (hasErrors) {
  console.log('❌ Health check failed - please fix errors above');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Health check passed with warnings');
  console.log('   App will run but some features may not work');
  process.exit(0);
} else {
  console.log('✅ All checks passed! Ready to run.');
  process.exit(0);
}
