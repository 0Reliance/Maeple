# POZIMIND AI Providers Test Report

Generated: 2025-12-06T17:36:35.490Z

## Summary

- Total Tests: 19
- Passed: 12
- Failed: 7
- Errors: 0
- Success Rate: 63.2%

## Provider Results

### gemini

**Capabilities:** text, vision, image_gen, search

**Tests:** 3/4 passed

❌ **text** (853ms)
  - Error: Response missing expected keywords for coaching context
✅ **vision** (504ms)
✅ **image_gen** (2940ms)
✅ **search** (548ms)

### openai

**Capabilities:** text, vision, image_gen

**Tests:** 2/3 passed

❌ **text** (1062ms)
  - Error: Response missing expected keywords for coaching context
✅ **vision** (755ms)
✅ **image_gen** (1380ms)

### openrouter

**Capabilities:** text, vision, image_gen, search

**Tests:** 3/4 passed

❌ **text** (906ms)
  - Error: Response missing expected keywords for coaching context
✅ **vision** (373ms)
✅ **image_gen** (2346ms)
✅ **search** (243ms)

### perplexity

**Capabilities:** text, vision, search

**Tests:** 2/3 passed

❌ **text** (1029ms)
  - Error: Response missing expected keywords for coaching context
✅ **vision** (733ms)
✅ **search** (755ms)

### anthropic

**Capabilities:** text, vision

**Tests:** 1/2 passed

❌ **text** (904ms)
  - Error: Response missing expected keywords for coaching context
✅ **vision** (1015ms)

### ollama

**Capabilities:** text, vision

**Tests:** 1/2 passed

❌ **text** (1483ms)
  - Error: Response missing expected keywords for coaching context
✅ **vision** (420ms)

### zai

**Capabilities:** text

**Tests:** 0/1 passed

❌ **text** (697ms)
  - Error: Response missing expected keywords for coaching context

## Recommendations

### gemini Improvements:
- Fix text implementation: Response missing expected keywords for coaching context

### openai Improvements:
- Fix text implementation: Response missing expected keywords for coaching context

### openrouter Improvements:
- Fix text implementation: Response missing expected keywords for coaching context

### perplexity Improvements:
- Fix text implementation: Response missing expected keywords for coaching context

### anthropic Improvements:
- Fix text implementation: Response missing expected keywords for coaching context

### ollama Improvements:
- Fix text implementation: Response missing expected keywords for coaching context

### zai Improvements:
- Fix text implementation: Response missing expected keywords for coaching context
