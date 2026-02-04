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

import { z } from 'zod';

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

    // Log structure for debugging
    if (data && typeof data === 'object') {
      console.log(`[${context}] Parsed successfully, structure:`, {
        keys: Object.keys(data),
        hasActionUnits: 'actionUnits' in data,
        hasObservations: 'observations' in data,
        hasConfidence: 'confidence' in data,
      });
    }

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