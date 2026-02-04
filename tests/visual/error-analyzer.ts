/**
 * Z.AI Vision Error Analyzer
 * 
 * This service uses Z.AI Vision MCP Server to automatically analyze
 * test error screenshots and provide actionable fix suggestions.
 */

import { getMCPClient } from './mcp-client';

interface ErrorAnalysis {
  diagnosis: string;
  proposedFixes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedComponents: string[];
  confidence: number;
  errorType?: string;
  reproductionSteps?: string[];
}

interface AnalysisContext {
  testName: string;
  errorLogs: string;
  timestamp: string;
  browser?: string;
  viewport?: string;
}

/**
 * ErrorAnalyzer Service
 * 
 * Wraps Z.AI Vision MCP Server's diagnose_error_screenshot tool
 * to provide automated error analysis capabilities.
 */
export class ErrorAnalyzer {
  private mcpClient: any;

  constructor() {
    // Initialize with global MCP client
    this.mcpClient = getMCPClient();
  }

  /**
   * Set MCP client instance
   */
  setMCPClient(client: any): void {
    this.mcpClient = client;
  }

  /**
   * Analyze a test error screenshot
   * 
   * @param testName - Name of the failing test
   * @param screenshotPath - Path to the error screenshot
   * @param errorLogs - Stack trace or error logs
   * @param context - Additional context (optional)
   * @returns Detailed error analysis
   */
  async analyzeTestError(
    testName: string,
    screenshotPath: string,
    errorLogs: string,
    context?: Partial<AnalysisContext>
  ): Promise<ErrorAnalysis> {
    const fullContext: AnalysisContext = {
      testName,
      errorLogs,
      timestamp: new Date().toISOString(),
      ...context
    };

    try {
      // Call Z.AI Vision's diagnose_error_screenshot tool
      const analysis: any = await this.mcpClient.callTool('diagnose_error_screenshot', {
        imagePath: screenshotPath,
        context: fullContext
      });

      // Normalize and structure the response
      return {
        diagnosis: analysis.diagnosis || 'Unable to determine error cause',
        proposedFixes: this.normalizeFixes(analysis.fixes || []),
        severity: this.normalizeSeverity(analysis.severity || 'medium'),
        affectedComponents: analysis.components || [],
        confidence: analysis.confidence || 0.5,
        errorType: analysis.errorType,
        reproductionSteps: analysis.reproductionSteps
      };
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      
      // Return fallback analysis
      return {
        diagnosis: 'Error analysis failed. Manual review required.',
        proposedFixes: ['Review error logs manually', 'Inspect screenshot visually'],
        severity: 'low',
        affectedComponents: [],
        confidence: 0,
        errorType: 'analysis_failure'
      };
    }
  }

  /**
   * Normalize fixes array to ensure consistent format
   */
  private normalizeFixes(fixes: any[]): string[] {
    if (Array.isArray(fixes)) {
      return fixes
        .filter(fix => typeof fix === 'string' || (typeof fix === 'object' && fix.fix))
        .map(fix => typeof fix === 'string' ? fix : fix.fix);
    }
    return [];
  }

  /**
   * Normalize severity value
   */
  private normalizeSeverity(severity: any): ErrorAnalysis['severity'] {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (validSeverities.includes(severity)) {
      return severity;
    }
    
    // Map numeric severity to string
    if (typeof severity === 'number') {
      if (severity >= 0.8) return 'critical';
      if (severity >= 0.6) return 'high';
      if (severity >= 0.4) return 'medium';
      return 'low';
    }
    
    return 'medium'; // Default
  }

  /**
   * Generate a human-readable report from analysis
   */
  generateReport(analysis: ErrorAnalysis): string {
    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };

    const lines: string[] = [
      `\n${'='.repeat(80)}`,
      `🔍 Z.AI Vision Error Analysis Report`,
      `${'='.repeat(80)}`,
      `\n${severityEmoji[analysis.severity]} Severity: ${analysis.severity.toUpperCase()}`,
      `📊 Confidence: ${(analysis.confidence * 100).toFixed(0)}%`,
      `\n📋 Diagnosis:`,
      `  ${analysis.diagnosis}`,
    ];

    if (analysis.errorType) {
      lines.push(`\n🔖 Error Type: ${analysis.errorType}`);
    }

    if (analysis.affectedComponents.length > 0) {
      lines.push(`\n🧩 Affected Components:`);
      analysis.affectedComponents.forEach(comp => {
        lines.push(`  - ${comp}`);
      });
    }

    if (analysis.proposedFixes.length > 0) {
      lines.push(`\n💡 Proposed Fixes:`);
      analysis.proposedFixes.forEach((fix, index) => {
        lines.push(`  ${index + 1}. ${fix}`);
      });
    }

    if (analysis.reproductionSteps && analysis.reproductionSteps.length > 0) {
      lines.push(`\n🔄 Reproduction Steps:`);
      analysis.reproductionSteps.forEach((step, index) => {
        lines.push(`  ${index + 1}. ${step}`);
      });
    }

    lines.push(`${'='.repeat(80)}\n`);

    return lines.join('\n');
  }

  /**
   * Batch analyze multiple errors
   */
  async analyzeBatchErrors(
    errors: Array<{
      testName: string;
      screenshotPath: string;
      errorLogs: string;
      context?: Partial<AnalysisContext>;
    }>
  ): Promise<Map<string, ErrorAnalysis>> {
    const results = new Map<string, ErrorAnalysis>();

    for (const error of errors) {
      try {
        const analysis = await this.analyzeTestError(
          error.testName,
          error.screenshotPath,
          error.errorLogs,
          error.context
        );
        results.set(error.testName, analysis);
      } catch (err) {
        console.error(`Failed to analyze ${error.testName}:`, err);
      }
    }

    return results;
  }
}

// Export singleton instance for convenience
export const errorAnalyzer = new ErrorAnalyzer();