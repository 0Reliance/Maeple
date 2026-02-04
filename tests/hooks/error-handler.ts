/**
 * Playwright Error Handler Hook
 * 
 * Automatically captures screenshots and analyzes test failures
 * using Z.AI Vision MCP Server for intelligent error diagnosis.
 */

import { test } from '@playwright/test';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { errorAnalyzer } from '../visual/error-analyzer';

/**
 * Error Handler Hook Configuration
 */
interface ErrorHandlerConfig {
  enabled: boolean;
  screenshotOnFailure: boolean;
  analyzeErrors: boolean;
  saveAnalysis: boolean;
  outputDir: string;
}

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enabled: process.env.ZAI_VISION_ENABLED !== 'false',
  screenshotOnFailure: true,
  analyzeErrors: true,
  saveAnalysis: true,
  outputDir: 'test-results/errors'
};

/**
 * Get error handler configuration from environment or defaults
 */
function getConfig(): ErrorHandlerConfig {
  return {
    ...DEFAULT_CONFIG,
    enabled: process.env.ZAI_VISION_ENABLED !== 'false',
    analyzeErrors: process.env.ZAI_VISION_ANALYZE !== 'false'
  };
}

/**
 * Initialize error handler
 * 
 * This hook runs after each test to capture and analyze failures
 */
test.afterEach(async ({ page }, testInfo) => {
  const config = getConfig();
  
  // Skip if disabled or test passed
  if (!config.enabled || testInfo.status !== 'failed') {
    return;
  }

  try {
    // Ensure output directory exists
    await mkdir(config.outputDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = testInfo.title.replace(/[^a-z0-9]/gi, '_');
    const baseName = `${sanitizedTitle}-${timestamp}`;

    // Capture screenshot
    if (config.screenshotOnFailure) {
      const screenshotPath = join(config.outputDir, `${baseName}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled'
      });
      console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

      // Analyze error with Z.AI Vision
      if (config.analyzeErrors) {
        console.log(`\n🤖 Analyzing error with Z.AI Vision...`);
        
        try {
          const errorLogs = testInfo.error?.stack || 'No stack trace available';
          const analysis = await errorAnalyzer.analyzeTestError(
            testInfo.title,
            screenshotPath,
            errorLogs,
            {
              browser: testInfo.project?.name || 'unknown',
              viewport: page.viewportSize()?.toString() || 'unknown'
            }
          );

          // Generate and display report
          const report = errorAnalyzer.generateReport(analysis);
          console.error(report);

          // Save analysis to file
          if (config.saveAnalysis) {
            const analysisPath = join(config.outputDir, `${baseName}-analysis.json`);
            const reportPath = join(config.outputDir, `${baseName}-report.txt`);
            
            await writeFile(analysisPath, JSON.stringify(analysis, null, 2));
            await writeFile(reportPath, report);
            
            console.log(`\n💾 Analysis saved:`);
            console.log(`  JSON: ${analysisPath}`);
            console.log(`  Report: ${reportPath}`);
          }

          // Add custom annotations to test output
          testInfo.annotations.push({
            type: 'zai-analysis',
            description: analysis.diagnosis,
            severity: analysis.severity,
            confidence: analysis.confidence
          });

        } catch (analysisError) {
          console.error(`❌ Failed to analyze error:`, analysisError);
          console.log('⚠️  Error analysis failed. Manual review required.');
        }
      }
    }

    // Capture console logs if available
    try {
      const consoleLogs = await page.evaluate(() => {
        return (window as any).__consoleLogs || [];
      });
      
      if (consoleLogs.length > 0) {
        const logsPath = join(config.outputDir, `${baseName}-console.json`);
        await writeFile(logsPath, JSON.stringify(consoleLogs, null, 2));
        console.log(`📝 Console logs saved: ${logsPath}`);
      }
    } catch (logError) {
      // Console logs might not be available, that's okay
      console.debug('Could not capture console logs:', logError);
    }

  } catch (handlerError) {
    console.error('❌ Error in error handler:', handlerError);
    // Don't let handler errors fail the test
  }
});

/**
 * Setup hook to inject console log capture
 */
test.beforeEach(async ({ page }) => {
  const config = getConfig();
  
  if (config.enabled) {
    // Inject script to capture console logs
    await page.addInitScript(() => {
      const logs: any[] = [];
      (window as any).__consoleLogs = logs;
      
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
      };
      
      console.log = (...args: any[]) => {
        logs.push({ level: 'log', args, timestamp: Date.now() });
        originalConsole.log.apply(console, args);
      };
      
      console.warn = (...args: any[]) => {
        logs.push({ level: 'warn', args, timestamp: Date.now() });
        originalConsole.warn.apply(console, args);
      };
      
      console.error = (...args: any[]) => {
        logs.push({ level: 'error', args, timestamp: Date.now() });
        originalConsole.error.apply(console, args);
      };
      
      console.info = (...args: any[]) => {
        logs.push({ level: 'info', args, timestamp: Date.now() });
        originalConsole.info.apply(console, args);
      };
    });
  }
});

/**
 * Module-level error handler setup
 * 
 * Call this in your test files to enable Z.AI Vision error analysis
 */
export function setupErrorHandler() {
  // The hooks are already registered at the module level
  // This function exists for clarity and future extensibility
  console.log('✅ Z.AI Vision Error Handler enabled');
}

/**
 * Disable error handler for specific tests
 * 
 * @example
 * test('skip error analysis', async ({ page }) => {
 *   disableErrorHandler();
 *   // Test that shouldn't trigger error analysis
 * });
 */
export function disableErrorHandler() {
  process.env.ZAI_VISION_ENABLED = 'false';
}

/**
 * Enable error handler for specific tests
 * 
 * @example
 * test('enable error analysis', async ({ page }) => {
 *   enableErrorHandler();
 *   // Test that should trigger error analysis
 * });
 */
export function enableErrorHandler() {
  process.env.ZAI_VISION_ENABLED = 'true';
}

/**
 * Get current error handler configuration
 */
export function getErrorHandlerConfig(): ErrorHandlerConfig {
  return getConfig();
}

export default setupErrorHandler;