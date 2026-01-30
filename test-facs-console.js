/**
 * MAEPLE FACS System - Browser Console Test Script
 * 
 * Run this script in the browser console after opening http://localhost:5173
 * to verify that all FACS fixes are working correctly.
 * 
 * Usage:
 * 1. Open http://localhost:5173 in browser
 * 2. Press F12 to open DevTools
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run tests
 */

console.log("=".repeat(70));
console.log("MAEPLE FACS SYSTEM - VERIFICATION TESTS");
console.log("=".repeat(70));

const testResults = [];

function logTest(name, passed, details = "") {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  testResults.push({ name, passed, details });
  console.log(`${status} - ${name}${details ? `: ${details}` : ""}`);
}

function logSection(title) {
  console.log("\n" + "─".repeat(70));
  console.log(title);
  console.log("─".repeat(70));
}

// Test 1: Check if aiRouter exists
logSection("Test 1: AI Router Existence");
try {
  const hasRouter = typeof window !== "undefined" && window.aiRouter;
  logTest("aiRouter is accessible", hasRouter, hasRouter ? "window.aiRouter available" : "window.aiRouter not found");
} catch (error) {
  logTest("aiRouter is accessible", false, error.message);
}

// Test 2: Check router initialization
logSection("Test 2: Router Initialization");
try {
  if (window.aiRouter) {
    const isInit = window.aiRouter.isInitialized;
    logTest("Router is initialized", isInit, isInit ? "initialized flag is true" : "initialized flag is false");
  } else {
    logTest("Router is initialized", false, "aiRouter not available");
  }
} catch (error) {
  logTest("Router is initialized", false, error.message);
}

// Test 3: Check router availability
logSection("Test 3: Router Availability");
try {
  if (window.aiRouter) {
    const isAvailable = window.aiRouter.isAIAvailable();
    logTest("Router is available", isAvailable, isAvailable ? "isAIAvailable() returns true" : "isAIAvailable() returns false");
    
    if (!isAvailable) {
      console.warn("⚠️  WARNING: Router is not available!");
      console.warn("This will cause FACS analysis to fail with empty results");
      console.warn("Check console logs above for initialization errors");
    }
  } else {
    logTest("Router is available", false, "aiRouter not available");
  }
} catch (error) {
  logTest("Router is available", false, error.message);
}

// Test 4: Check settings service
logSection("Test 4: AI Settings Service");
try {
  if (window.aiSettingsService) {
    const settings = window.aiSettingsService.getSettings();
    const hasProviders = settings && settings.providers && settings.providers.length > 0;
    logTest("Settings service has providers", hasProviders, hasProviders ? `${settings.providers.length} provider(s)` : "No providers");
    
    if (hasProviders) {
      const geminiProvider = settings.providers.find(p => p.providerId === 'gemini');
      const hasGemini = !!geminiProvider;
      logTest("Gemini provider configured", hasGemini, hasGemini ? "Gemini found in settings" : "Gemini not found");
      
      if (geminiProvider) {
        const isEnabled = geminiProvider.enabled;
        const hasKey = !!geminiProvider.apiKey;
        logTest("Gemini provider enabled", isEnabled, isEnabled ? "enabled=true" : "enabled=false");
        logTest("Gemini provider has API key", hasKey, hasKey ? `API key present (${geminiProvider.apiKey.length} chars)` : "No API key");
        
        if (hasKey) {
          const isValidKey = geminiProvider.apiKey.startsWith('AIza');
          logTest("Gemini API key format valid", isValidKey, isValidKey ? "Starts with 'AIza'" : "Invalid format");
        }
      }
    }
  } else {
    logTest("Settings service accessible", false, "aiSettingsService not found");
  }
} catch (error) {
  logTest("Settings service accessible", false, error.message);
}

// Test 5: Check capabilities
logSection("Test 5: AI Capabilities");
try {
  if (window.aiRouter) {
    const capabilities = {
      text: window.aiRouter.hasCapability('text'),
      vision: window.aiRouter.hasCapability('vision'),
      image_gen: window.aiRouter.hasCapability('image_gen'),
      search: window.aiRouter.hasCapability('search'),
      audio: window.aiRouter.hasCapability('audio'),
    };
    
    for (const [cap, hasCap] of Object.entries(capabilities)) {
      logTest(`Capability: ${cap}`, hasCap, hasCap ? "Available" : "Not available");
    }
  } else {
    logTest("Capabilities check", false, "aiRouter not available");
  }
} catch (error) {
  logTest("Capabilities check", false, error.message);
}

// Test 6: Check environment variable
logSection("Test 6: Environment Variable");
try {
  const envKey = typeof import !== "undefined" && import.meta && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY;
  const hasEnvKey = !!envKey;
  logTest("VITE_GEMINI_API_KEY exists", hasEnvKey, hasEnvKey ? `Found (${envKey.length} chars)` : "Not found");
  
  if (hasEnvKey) {
    const isValidFormat = envKey.startsWith('AIza');
    const isValidLength = envKey.length >= 30;
    logTest("API key format valid", isValidFormat, isValidFormat ? "Starts with 'AIza'" : "Invalid format");
    logTest("API key length valid", isValidLength, isValidLength ? `${envKey.length} characters` : "Too short");
  }
} catch (error) {
  logTest("Environment variable check", false, error.message);
}

// Test 7: Check for initialization logs
logSection("Test 7: Initialization Logs");
try {
  // Check if initialization logs are in console (look for specific log markers)
  console.log("Checking for initialization log markers...");
  console.log("Look for these logs in the console above:");
  console.log("  - [App] ===== APP INITIALIZATION START =====");
  console.log("  - [AI] ===== INITIALIZE AI SERVICES START =====");
  console.log("  - [AISettings] ===== INITIALIZE START =====");
  console.log("  - [AIRouter] ===== INITIALIZE START =====");
  console.log("  - [AI] ✓ Router available: true");
  console.log("  - [App] ✓ AI services are operational");
  console.log("  - [App] ===== APP INITIALIZATION COMPLETE =====");
  console.log("\n✓ If you see all these markers, initialization is successful");
} catch (error) {
  logTest("Initialization logs check", false, error.message);
}

// Summary
logSection("TEST SUMMARY");
const passed = testResults.filter(r => r.passed).length;
const total = testResults.length;
const percentage = Math.round((passed / total) * 100);

console.log(`\nTotal Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Success Rate: ${percentage}%`);

if (percentage === 100) {
  console.log("\n🎉 ALL TESTS PASSED! FACS system should be working correctly.");
  console.log("\nNext steps:");
  console.log("1. Navigate to /bio-mirror");
  console.log("2. Click 'Capture State Check'");
  console.log("3. Allow camera access");
  console.log("4. Take a photo");
  console.log("5. Verify FACS results display");
} else if (percentage >= 70) {
  console.log("\n⚠️  MOSTLY PASSED - Some tests failed.");
  console.log("\nFailed tests:");
  testResults.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.details}`);
  });
  console.log("\nCommon issues:");
  console.log("1. API key not in .env file");
  console.log("2. API key has wrong format");
  console.log("3. Router initialization failed");
  console.log("4. Check console for initialization errors above");
} else {
  console.log("\n❌ MAJOR ISSUES - Multiple tests failed.");
  console.log("\nAction required:");
  console.log("1. Check .env file exists in Maeple directory");
  console.log("2. Verify VITE_GEMINI_API_KEY is set");
  console.log("3. Ensure API key starts with 'AIza'");
  console.log("4. Restart development server: npm run dev");
  console.log("5. Reload page and run tests again");
}

// Diagnostic commands
logSection("DIAGNOSTIC COMMANDS");
console.log("\nRun these commands in console for debugging:");
console.log("\n1. Check router availability:");
console.log("   window.aiRouter.isAIAvailable()");
console.log("\n2. Get AI settings:");
console.log("   window.aiSettingsService.getSettings()");
console.log("\n3. Check API key:");
console.log("   import.meta.env.VITE_GEMINI_API_KEY");
console.log("\n4. Test health check:");
console.log("   window.aiRouter.checkHealth().then(r => console.log(r))");
console.log("\n5. Get provider stats:");
console.log("   window.aiRouter.getProviderStats()");

console.log("\n" + "=".repeat(70));
console.log("END OF VERIFICATION TESTS");
console.log("=".repeat(70));