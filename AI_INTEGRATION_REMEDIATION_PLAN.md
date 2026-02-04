# AI Integration Remediation Plan
**Date:** February 1, 2026
**Goal:** Remedy all JSON parsing issues, prevent future instability, and ensure robust AI integration

## Executive Summary

Investigation revealed a systemic issue: **inconsistent JSON parsing across AI integrations**. While 3 critical issues have been fixed, the codebase lacks a unified approach to handle AI response variations. This plan addresses all remaining risks and establishes a resilient architecture.

---

## Phase 1: Complete Immediate Fixes ✅

### Status: COMPLETE
- ✅ Fixed JSON parsing in `geminiVisionService.ts` (3 locations)
- ✅ Fixed JSON parsing in `geminiService.ts` (2 locations)
- ✅ Fixed schema validation in `JournalEntry.tsx`
- ✅ Verified `LiveCoach.tsx` already protected

### What Was Done
Added markdown code block stripping with regex: `/```json\n|\n```|```json/g`

---

## Phase 2: Create Unified JSON Parsing Utility ⚠️ IN PROGRESS

### Problem
Currently, each component implements JSON parsing independently with slight variations:
- Some use: `replace(/```json\n|\n```/g, '')`
- Others use: `replace(/```json\n|\n```|```json/g, '')`
- No consistent error handling
- No logging of when stripping occurs
- No fallback for different markdown formats

### Solution: Create Centralized Utility

**File to Create:** `src/utils/safeParse.ts`

```typescript
/**
 * Safe JSON parsing utility for AI responses
 * 
 * Handles various response formats from AI services:
 * - Markdown code blocks: ```json\n...\n```
 * - Plain JSON: {...}
 * - Mixed content: Text with JSON embedded
 * 
 * Provides consistent error handling and logging
 */

export interface ParseResult<T = any> {
  data?: T;
  error?: string;
  raw?: string;
  stripped?: boolean;
  parseTime?: number;
}

/**
 * Safe JSON parser with markdown code block handling
 * 
 * @param response - Raw response from AI service
 * @param options - Configuration options
 * @returns ParseResult with data, error, and metadata
 */
export function safeParseAIResponse<T = any>(
  response: string,
  options: {
    context?: string;
    stripMarkdown?: boolean;
    trim?: boolean;
    logStripping?: boolean;
  } = {}
): ParseResult<T> {
  const startTime = performance.now();
  const {
    context = 'AI response',
    stripMarkdown = true,
    trim = true,
    logStripping = true,
  } = options;

  try {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response: empty or not a string');
    }

    let cleanResponse = response;

    // Step 1: Strip markdown code blocks if enabled
    if (stripMarkdown) {
      const beforeStripping = cleanResponse;
      
      // Pattern 1: ```json\n...\n```
      cleanResponse = cleanResponse.replace(/```json\n([\s\S]*?)\n```/g, '$1');
      
      // Pattern 2: ```\n...\n```
      cleanResponse = cleanResponse.replace(/```\n([\s\S]*?)\n```/g, '$1');
      
      // Pattern 3: ```json...\n```
      cleanResponse = cleanResponse.replace(/```json([\s\S]*?)\n```/g, '$1');
      
      // Pattern 4: ```...\n```
      cleanResponse = cleanResponse.replace(/```([\s\S]*?)\n```/g, '$1');
      
      // Pattern 5: ```json...```
      cleanResponse = cleanResponse.replace(/```json([\s\S]*?)```/g, '$1');
      
      // Pattern 6: ```...```
      cleanResponse = cleanResponse.replace(/```([\s\S]*?)```/g, '$1');

      if (logStripping && cleanResponse !== beforeStripping.trim()) {
        console.log(`[${context}] Markdown code blocks stripped from response`);
      }
    }

    // Step 2: Trim whitespace if enabled
    if (trim) {
      cleanResponse = cleanResponse.trim();
    }

    // Step 3: Validate JSON starts with valid character
    const firstChar = cleanResponse[0];
    if (firstChar !== '{' && firstChar !== '[' && 
        firstChar !== '"' && firstChar !== 'n' && 
        firstChar !== 't' && firstChar !== 'f' && firstChar !== '-'){
      throw new Error(
        `Response doesn't appear to be JSON (starts with: ${cleanResponse.substring(0, 20)}...)`
      );
    }

    // Step 4: Parse JSON
    const data = JSON.parse(cleanResponse);
    
    const parseTime = Math.round(performance.now() - startTime);
    
    return {
      data,
      raw: cleanResponse,
      stripped: cleanResponse !== response.trim(),
      parseTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';
    const parseTime = Math.round(performance.now() - startTime);
    
    console.error(`[${context}] JSON parse error:`, {
      error: errorMessage,
      preview: response.substring(0, 200),
      length: response.length,
      parseTime,
    });

    return {
      error: `Failed to parse JSON: ${errorMessage}`,
      raw: response,
      parseTime,
    };
  }
}

/**
 * Extract JSON from mixed content (text + JSON)
 * Useful when AI returns explanatory text followed by JSON
 */
export function extractJSONFromMixedContent<T = any>(
  content: string,
  options: { context?: string } = {}
): ParseResult<T> {
  const { context = 'Mixed content' } = options;

  try {
    // Try to find JSON using common patterns
    const patterns = [
      /\{[\s\S]*\}/,  // Object
      /\[[\s\S]*\]/,  // Array
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const jsonStr = match[0];
        const result = safeParseAIResponse<T>(jsonStr, {
          context,
          stripMarkdown: true,
          trim: true,
          logStripping: false, // Already logged in safeParseAIResponse
        });
        
        if (result.data) {
          return {
            data: result.data,
            raw: jsonStr,
            stripped: result.stripped,
            parseTime: result.parseTime,
          };
        }
      }
    }

    // If no JSON found, try parsing entire content
    return safeParseAIResponse<T>(content, {
      context,
      stripMarkdown: true,
    });
  } catch (error) {
    console.error(`[${context}] Failed to extract JSON:`, error);
    return {
      error: 'No JSON found in content',
      raw: content,
    };
  }
}

/**
 * Validate parsed data against Zod schema
 * Provides detailed error messages for debugging
 */
export function validateWithZod<T>(
  data: unknown,
  schema: z.ZodType<T>,
  context: string = 'Validation'
): { data?: T; error?: string; issues?: z.ZodIssue[] } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { data: result.data };
    } else {
      const issues = result.error.issues;
      console.error(`[${context}] Zod validation failed:`, {
        issueCount: issues.length,
        issues: issues.map(i => ({
          path: i.path.join('.'),
          code: i.code,
          message: i.message,
        })),
      });

      return {
        error: `Validation failed: ${issues[0].message}`,
        issues,
      };
    }
  } catch (error) {
    console.error(`[${context}] Validation error:`, error);
    return {
      error: error instanceof Error ? error.message : 'Validation error',
    };
  }
}
```

### Migration Plan

**Step 1:** Create utility file
**Step 2:** Update each integration point:

#### Update 1: geminiVisionService.ts
```typescript
// Replace:
const cleanJson = textResponse.replace(/```json\n|\n```|```json/g, '').trim();
result = JSON.parse(cleanJson) as FacialAnalysis;

// With:
const { data, error } = safeParseAIResponse<FacialAnalysis>(textResponse, {
  context: 'geminiVisionService',
  stripMarkdown: true,
});
if (error) throw new Error(error);
result = data;
```

#### Update 2: geminiService.ts
```typescript
// Replace (both locations):
const cleanJson = routerResult.content.replace(/```json\n|\n```|```json/g, '').trim();
const parsed = JSON.parse(cleanJson);

// With:
const { data, error } = safeParseAIResponse<ParsedResponse>(routerResult.content, {
  context: 'geminiService:router',
});
if (error) throw new Error(error);
const parsed = data;
```

#### Update 3: JournalEntry.tsx
```typescript
// Replace:
const cleanJson = response.content.replace(/```json\n|\n```/g, "").trim();
const jsonData = JSON.parse(cleanJson);
parsed = AIResponseSchema.parse(jsonData) as ParsedResponse;

// With:
const { data, error } = safeParseAIResponse(response.content, {
  context: 'JournalEntry',
});
if (error) throw new Error(error);
const { data: validated, error: validateError } = validateWithZod(
  data,
  AIResponseSchema,
  'JournalEntry:Zod'
);
if (validateError) throw new Error(validateError);
parsed = validated as ParsedResponse;
```

#### Update 4: LiveCoach.tsx
```typescript
// Replace:
const cleanJson = response.content.replace(/```json\n|\n```/g, '').trim();
parsedData = JSON.parse(cleanJson);

// With:
const { data, error } = safeParseAIResponse(response.content, {
  context: 'LiveCoach',
});
if (error) {
  console.warn("Failed to parse JSON, using raw text", error);
  parsedData = { summary: response.content };
} else {
  parsedData = data;
}
```

#### Update 5: SearchResources.tsx
```typescript
// Replace:
const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
if (jsonMatch) {
  try {
    grounding = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn("Failed to parse sources JSON", e);
  }
}

// With:
const { data, error } = extractJSONFromMixedContent<GroundingChunk[]>(text, {
  context: 'SearchResources',
});
if (data) {
  grounding = data;
}
```

---

## Phase 3: Add Response Preprocessing Middleware

### Problem
Each component is responsible for its own response processing. This leads to:
- Code duplication
- Inconsistent handling
- Difficult to maintain
- Hard to add new response format handling

### Solution: AI Response Middleware Layer

**File to Create:** `src/middleware/aiResponseMiddleware.ts`

```typescript
/**
 * AI Response Middleware
 * 
 * Provides a centralized layer for preprocessing AI responses
 * Handles markdown, formatting, and validation in one place
 */

import { safeParseAIResponse, extractJSONFromMixedContent, validateWithZod } from '@/utils/safeParse';
import { z } from 'zod';

export interface MiddlewareOptions {
  context: string;
  schema?: z.ZodType<any>;
  extractFromMixed?: boolean;
  fallback?: any;
  onParseError?: (error: string) => void;
  onValidationError?: (error: string) => void;
}

export class AIResponseMiddleware {
  private options: MiddlewareOptions;

  constructor(options: MiddlewareOptions) {
    this.options = {
      extractFromMixed: false,
      ...options,
    };
  }

  /**
   * Process AI response through middleware pipeline
   */
  process<T = any>(response: string): T | null {
    const { context, schema, extractFromMixed, fallback, onParseError, onValidationError } = this.options;

    // Step 1: Parse JSON
    let parseResult;
    if (extractFromMixed) {
      parseResult = extractJSONFromMixedContent<T>(response, { context });
    } else {
      parseResult = safeParseAIResponse<T>(response, { context });
    }

    if (parseResult.error) {
      onParseError?.(parseResult.error);
      return fallback || null;
    }

    // Step 2: Validate with schema if provided
    if (schema) {
      const validationResult = validateWithZod<T>(parseResult.data, schema, context);
      
      if (validationResult.error) {
        onValidationError?.(validationResult.error);
        return fallback || null;
      }

      return validationResult.data;
    }

    return parseResult.data;
  }

  /**
   * Process with async callback (for logging/monitoring)
   */
  async processWithMetrics<T = any>(response: string): Promise<{ data: T; metrics: any }> {
    const startTime = performance.now();
    const data = this.process<T>(response);
    const duration = performance.now() - startTime;

    return {
      data,
      metrics: {
        parseTime: duration,
        responseLength: response.length,
        hasMarkdown: response.includes('```'),
        hasError: !data,
      },
    };
  }
}

/**
 * Factory function to create middleware instances
 */
export function createMiddleware(options: MiddlewareOptions): AIResponseMiddleware {
  return new AIResponseMiddleware(options);
}
```

---

## Phase 4: Enhanced Monitoring & Logging

### Problem
Current logging is minimal and inconsistent:
- Some errors log to console
- Others silently fail
- No centralized monitoring
- Difficult to track issues in production

### Solution: Centralized Error Logger with Metrics

**File to Update:** `src/services/errorLogger.ts`

```typescript
// Add metrics tracking
interface AIParseMetrics {
  timestamp: string;
  context: string;
  success: boolean;
  parseTime: number;
  responseLength: number;
  hadMarkdown: boolean;
  error?: string;
}

class EnhancedErrorLogger {
  private parseMetrics: AIParseMetrics[] = [];
  private maxMetrics = 100;

  // Log parse metrics
  logParseMetrics(metrics: Partial<AIParseMetrics>) {
    const entry: AIParseMetrics = {
      timestamp: new Date().toISOString(),
      ...metrics,
      success: !metrics.error,
    };

    this.parseMetrics.push(entry);
    
    // Keep only recent metrics
    if (this.parseMetrics.length > this.maxMetrics) {
      this.parseMetrics.shift();
    }

    // Alert if failure rate is high
    this.checkFailureRate();
  }

  // Check failure rate and alert if needed
  private checkFailureRate() {
    if (this.parseMetrics.length < 10) return;

    const recentMetrics = this.parseMetrics.slice(-10);
    const failures = recentMetrics.filter(m => !m.success).length;
    const failureRate = failures / recentMetrics.length;

    if (failureRate > 0.3) { // 30% failure rate
      console.error('[ErrorLogger] High AI parse failure rate detected:', {
        failureRate: `${Math.round(failureRate * 100)}%`,
        recentFailures: recentMetrics.filter(m => !m.success),
      });
    }
  }

  // Get metrics for debugging
  getMetrics(): AIParseMetrics[] {
    return [...this.parseMetrics];
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      totalParses: this.parseMetrics.length,
      successRate: this.calculateSuccessRate(),
      avgParseTime: this.calculateAvgParseTime(),
      markdownRate: this.calculateMarkdownRate(),
    };
  }

  private calculateSuccessRate(): number {
    if (this.parseMetrics.length === 0) return 0;
    const successes = this.parseMetrics.filter(m => m.success).length;
    return successes / this.parseMetrics.length;
  }

  private calculateAvgParseTime(): number {
    const parseTimes = this.parseMetrics.map(m => m.parseTime).filter(t => t > 0);
    if (parseTimes.length === 0) return 0;
    return parseTimes.reduce((a, b) => a + b, 0) / parseTimes.length;
  }

  private calculateMarkdownRate(): number {
    if (this.parseMetrics.length === 0) return 0;
    const withMarkdown = this.parseMetrics.filter(m => m.hadMarkdown).length;
    return withMarkdown / this.parseMetrics.length;
  }
}
```

---

## Phase 5: Comprehensive Testing Strategy

### Problem
No automated tests for AI response parsing. Relies on manual testing.

### Solution: Multi-layered testing approach

#### Layer 1: Unit Tests
**File:** `src/utils/safeParse.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { safeParseAIResponse, extractJSONFromMixedContent } from './safeParse';

describe('safeParseAIResponse', () => {
  it('should parse plain JSON', () => {
    const result = safeParseAIResponse('{"test": "value"}');
    expect(result.data).toEqual({ test: 'value' });
    expect(result.stripped).toBe(false);
  });

  it('should strip markdown code blocks', () => {
    const jsonWithMarkdown = '```json\n{"test": "value"}\n```';
    const result = safeParseAIResponse(jsonWithMarkdown);
    expect(result.data).toEqual({ test: 'value' });
    expect(result.stripped).toBe(true);
  });

  it('should handle various markdown formats', () => {
    const formats = [
      '```json\n{"test": "value"}\n```',
      '```\n{"test": "value"}\n```',
      '```json{"test": "value"}```',
      '```{"test": "value"}```',
    ];

    formats.forEach(format => {
      const result = safeParseAIResponse(format);
      expect(result.data).toEqual({ test: 'value' });
      expect(result.stripped).toBe(true);
    });
  });

  it('should handle malformed JSON', () => {
    const result = safeParseAIResponse('not valid json');
    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it('should handle empty response', () => {
    const result = safeParseAIResponse('');
    expect(result.error).toBeDefined();
  });

  it('should log parse time', () => {
    const result = safeParseAIResponse('{"test": "value"}');
    expect(result.parseTime).toBeGreaterThanOrEqual(0);
    expect(result.parseTime).toBeLessThan(100); // Should be fast
  });
});

describe('extractJSONFromMixedContent', () => {
  it('should extract JSON from text', () => {
    const content = 'Some text\n{"test": "value"}\nMore text';
    const result = extractJSONFromMixedContent(content);
    expect(result.data).toEqual({ test: 'value' });
  });

  it('should handle JSON array in text', () => {
    const content = 'Sources:\n[{"url": "test1"}, {"url": "test2"}]';
    const result = extractJSONFromMixedContent(content);
    expect(result.data).toEqual([{ url: 'test1' }, { url: 'test2' }]);
  });

  it('should strip markdown from mixed content', () => {
    const content = '```json\n{"test": "value"}\n```';
    const result = extractJSONFromMixedContent(content);
    expect(result.data).toEqual({ test: 'value' });
    expect(result.stripped).toBe(true);
  });
});
```

#### Layer 2: Integration Tests
**File:** `src/integrations/aiParsing.integration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { aiRouter } from '../services/ai';
import { safeParseAIResponse } from '../utils/safeParse';

describe('AI Integration: JSON Parsing', () => {
  it('should handle geminiVisionService responses', async () => {
    // Mock router response with markdown
    vi.spyOn(aiRouter, 'vision').mockResolvedValue({
      content: '```json\n{"confidence": 0.9}\n```',
    });

    const result = await aiRouter.vision({
      imageData: 'base64',
      mimeType: 'image/png',
      prompt: 'test',
    });

    const parsed = safeParseAIResponse(result?.content || '');
    expect(parsed.data).toEqual({ confidence: 0.9 });
    expect(parsed.stripped).toBe(true);
  });

  it('should handle geminiService responses', async () => {
    vi.spyOn(aiRouter, 'chat').mockResolvedValue({
      content: '```json\n{"moodScore": 5}\n```',
    });

    const result = await aiRouter.chat({
      messages: [{ role: 'user', content: 'test' }],
    });

    const parsed = safeParseAIResponse(result?.content || '');
    expect(parsed.data).toEqual({ moodScore: 5 });
    expect(parsed.stripped).toBe(true);
  });
});
```

#### Layer 3: E2E Tests
**File:** `e2e/aiParsing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('AI JSON Parsing', () => {
  test('journal entry should handle markdown responses', async ({ page }) => {
    await page.goto('/');
    
    // Mock AI response with markdown
    await page.evaluate(() => {
      window.__MOCK_AI_RESPONSE__ = '```json\n{"moodScore": 5}\n```';
    });

    await page.fill('[data-testid="journal-input"]', 'Test entry');
    await page.click('[data-testid="save-entry"]');

    // Verify entry was saved
    await expect(page.locator('[data-testid="journal-entry"]')).toHaveCount(1);
  });

  test('facial analysis should handle markdown responses', async ({ page }) => {
    await page.goto('/state-check');
    
    // Mock camera and AI
    await page.evaluate(() => {
      window.__MOCK_VISION_RESPONSE__ = '```json\n{"confidence": 0.9}\n```';
    });

    await page.click('[data-testid="capture-photo"]');
    
    // Verify analysis completed
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();
  });
});
```

---

## Phase 6: Production Monitoring & Alerting

### Problem
No visibility into AI response issues in production until users report bugs.

### Solution: Metrics Dashboard

**Features:**
1. Real-time parse success rate
2. Average parse time
3. Markdown response frequency
4. Error patterns
5. Circuit breaker status
6. Provider-specific metrics

**Implementation:** Create monitoring component in Settings > Debug

---

## Implementation Timeline

### Week 1: Foundation
- Day 1-2: Create `safeParse.ts` utility
- Day 3-4: Update all 5 integration points
- Day 5: Unit tests for utility

### Week 2: Middleware & Monitoring
- Day 1-2: Create AI response middleware
- Day 3-4: Enhance error logger with metrics
- Day 5: Integration tests

### Week 3: Testing & Deployment
- Day 1-2: E2E tests
- Day 3: Manual testing of all features
- Day 4: Code review and refinement
- Day 5: Deploy to staging

### Week 4: Production
- Day 1: Deploy to production
- Day 2-4: Monitor metrics and fix issues
- Day 5: Review metrics and adjust

---

## Success Criteria

1. ✅ All AI integrations use unified parsing utility
2. ✅ 100% unit test coverage for parsing logic
3. ✅ Integration tests for all AI services
4. ✅ E2E tests for critical user flows
5. ✅ Production metrics dashboard operational
6. ✅ Parse success rate > 95%
7. ✅ Average parse time < 50ms
8. ✅ Zero silent failures

---

## Risk Mitigation

### During Implementation
- Feature flags for gradual rollout
- A/B testing with old vs new parsing
- Rollback plan ready
- Monitoring alerts configured

### After Implementation
- Continuous monitoring of parse metrics
- Automated testing in CI/CD pipeline
- Regular review of error logs
- Quick response to issues

---

## Conclusion

This plan addresses the root cause of JSON parsing instability by:
1. **Unifying** parsing logic across all AI integrations
2. **Standardizing** error handling and logging
3. **Monitoring** system health with metrics
4. **Testing** thoroughly at all layers
5. **Preventing** future issues with middleware layer

The result will be a robust, maintainable, and observable AI integration system.