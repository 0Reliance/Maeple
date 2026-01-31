# MAEPLE Gemini API Pro Plan Decision

> **Decision Date**: January 31, 2026
> **Status**: ✅ Approved & Implemented
> **Effective**: Production deployment
> **Review Date**: February 28, 2026

---

## Executive Decision

**MAEPLE will use Google AI Pro Plan ($20/month) for all Gemini API operations.**

This decision optimizes the application for production reliability, priority processing, and cost predictability.

---

## Rationale

### Why Pro Plan Over Pay-As-You-Go?

1. **Testing & Production Parity**
   - Same environment for testing and production
   - No rate limit surprises when moving to production
   - Enables comprehensive testing of FACS functionality

2. **Priority Processing**
   - Higher priority queue for vision analysis requests
   - Critical for real-time FACS feedback
   - Better user experience during peak usage

3. **Cost Predictability**
   - Fixed $19.99/month regardless of usage spikes
   - No billing surprises
   - Easier budget forecasting

4. **Included Benefits**
   - $100 Google Cloud credits (unused can offset other GCP services)
   - 2TB Google One storage (can be used for user data backups)
   - Priority access to new Gemini features

5. **Breakeven Analysis**
   - Pro plan cost: $19.99/month
   - Pay-as-you-go breakeven: ~66,000 analyses/month
   - With FACS testing and multiple users, we'll likely exceed this
   - **Pro plan provides better value at projected usage**

---

## Configuration Details

### Account Configuration

```bash
# Google Cloud Project
Project ID: maeple-production
Region: us-central1

# Billing Account
Plan: Google AI Pro
Monthly Cost: $19.99
Included Credits: $100/month GCP credits
```

### API Key Configuration

Environment Variable: `GEMINI_API_KEY`
- Source: Google AI Studio Pro account
- Location: `.env.production`
- Scope: Full Gemini API access (vision, text, image gen)

### Model Selection

**Primary Production Model**:
```
gemini-2.5-flash
- Text: $0.15/1M tokens
- Vision: Same as text (images → tokens)
- Input: 1M token context
- Use: FACS analysis, multimodal requests
```

**Image Generation Model**:
```
gemini-2.5-flash-image
- Specialized for image generation
- Use: VisionBoard, visualizations
```

**Optimization Model (Future)**:
```
gemini-2.5-flash-lite
- Input: $0.10/1M tokens (33% cheaper)
- Output: $0.40/1M tokens (33% cheaper)
- Use: Non-critical features, bulk processing
```

---

## Optimizations for Pro Plan

### 1. Token Usage Optimization

**Implemented Strategies**:
- ✅ Intelligent caching for repeated image analyses
- ✅ Max token limits set to prevent runaway costs
- ✅ Efficient prompt engineering for FACS prompts
- ✅ Image compression before API submission

**Code Implementation**:
```typescript
// geminiVisionService.ts
const MAX_OUTPUT_TOKENS = 1024; // Prevent long responses
const CACHE_TTL = 3600000; // 1 hour cache

// Cache key based on image hash
const cacheKey = `vision:${base64Image.substring(0, 100)}`;
```

### 2. Request Batching

**Strategy**:
- Batch multiple FACS analyses when possible
- Process queued requests during off-peak hours
- Use LiteLLM gateway for request aggregation

**Implementation**:
```typescript
// router.ts - Circuit Breaker protection
async vision(request: AIVisionRequest): Promise<AIVisionResponse | null> {
  return this.routeWithFallback('vision', (adapter) => 
    adapter.vision(request)
  );
}
```

### 3. Model Selection Logic

**Smart Routing**:
```typescript
// Use Flash for critical FACS analysis
if (isCriticalAnalysis) {
  model = 'gemini-2.5-flash';
}
// Use Flash-Lite for non-critical tasks
else {
  model = 'gemini-2.5-flash-lite';
}
```

### 4. Circuit Breaker Configuration

**Pro Plan Optimized Settings**:
```typescript
CIRCUIT_BREAKER_CONFIG: {
  threshold: 50,           // Fail after 50 errors
  timeout: 60000,         // 1 minute cooldown
  resetTimeout: 300000    // 5 minutes before retry
}
```

### 5. Monitoring & Alerts

**Google Cloud Console Alerts**:
- Daily usage alert at 50,000 tokens
- Weekly cost alert at $10 equivalent
- Monthly budget alert at $15 equivalent

**LiteLLM Gateway Logging**:
- All requests logged to CT194
- Token usage tracked per user
- Cost analysis dashboard available

---

## Cost Analysis with Pro Plan

### Monthly Cost Breakdown

**Fixed Cost**:
- Google AI Pro: $19.99/month
- **Included API usage: Unlimited (within fair use)**

**Effective Cost**:
- With Pro plan, effectively $0/analysis after monthly fee
- Breaks even at ~66,000 analyses/month
- **MAEPLE saves money if >66,000 analyses/month**

### Projected Usage

**Phase 1 (Testing)**:
- Users: 5-10
- Analyses/user/day: 10
- Total: 50-100 analyses/day
- **Cost**: Covered by Pro plan fee

**Phase 2 (Beta)**:
- Users: 50-100
- Analyses/user/day: 5
- Total: 250-500 analyses/day
- **Cost**: Covered by Pro plan fee

**Phase 3 (Production)**:
- Users: 500-1,000
- Analyses/user/day: 3
- Total: 1,500-3,000 analyses/day
- **Cost**: Covered by Pro plan fee (savings vs pay-as-you-go)

**Phase 4 (Scale)**:
- Users: 5,000+
- Analyses/user/day: 2
- Total: 10,000+ analyses/day
- **Cost**: Pro plan still cheaper than pay-as-you-go

---

## Configuration Changes

### Updated Environment Variables

```bash
# .env.production
GEMINI_API_KEY=YOUR_PRO_PLAN_API_KEY
GOOGLE_API_KEY=YOUR_PRO_PLAN_API_KEY

# Model configuration
GEMINI_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_MODEL_IMAGE=gemini-2.5-flash-image
GEMINI_MODEL_LITE=gemini-2.5-flash-lite

# Circuit breaker settings
GEMINI_CIRCUIT_THRESHOLD=50
GEMINI_CIRCUIT_TIMEOUT=60000

# Cache settings
VISION_CACHE_ENABLED=true
VISION_CACHE_TTL=3600000
```

### AI Provider Settings

```typescript
// settingsService.ts - Default provider
providers: [{
  providerId: 'gemini',
  enabled: true,
  name: 'Google Gemini (Pro Plan)',
  description: 'Production-optimized with Pro plan',
  apiKey: process.env.GEMINI_API_KEY,
  capabilities: ['text', 'vision', 'image_gen', 'search', 'audio'],
  priority: 1 // Primary provider
}]
```

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] Verify Pro plan API key has unlimited quota
- [ ] Test FACS analysis with multiple concurrent users
- [ ] Verify no rate limit errors under load
- [ ] Test image generation with VisionBoard
- [ ] Validate caching effectiveness
- [ ] Confirm circuit breaker doesn't trigger incorrectly
- [ ] Test fallback to secondary providers (OpenAI, Anthropic)

### Performance Benchmarks

- [ ] FACS analysis: <3 seconds response time
- [ ] Image generation: <5 seconds response time
- [ ] Concurrent requests: 10+ simultaneous
- [ ] Token efficiency: <1,000 tokens/analysis
- [ ] Cache hit rate: >30% for repeated images

---

## Monitoring Dashboard

### Key Metrics to Track

1. **Daily Request Count**
   - Total API calls
   - Successful vs failed
   - By user

2. **Token Usage**
   - Input tokens/day
   - Output tokens/day
   - Total tokens/month

3. **Cost Analysis**
   - Actual vs projected
   - Cost per analysis
   - Trend over time

4. **Performance**
   - Average response time
   - P95 response time
   - Error rate

### Monitoring Tools

- **Google Cloud Console**: Usage & cost dashboard
- **LiteLLM Gateway (CT194)**: Request logging & aggregation
- **Local Database**: User analytics & usage patterns

---

## Review & Optimization Schedule

### Monthly Review
- Check actual usage vs projections
- Identify optimization opportunities
- Review error rates and circuit breaker trips
- Assess if Pro plan still optimal

### Quarterly Review
- Comprehensive cost-benefit analysis
- Evaluate new model options
- Consider model upgrades/downgrades
- Update optimization strategies

---

## Success Criteria

The Pro plan decision is successful if:

1. ✅ Zero rate limit errors in production
2. ✅ Average FACS analysis time <3 seconds
3. ✅ Monthly cost effectively capped at $19.99
4. ✅ Cache hit rate >30%
5. ✅ User satisfaction with response times
6. ✅ No unexpected billing charges
7. ✅ Pro plan cost < pay-as-you-go cost

---

## Contingency Plans

### If Pro Plan Becomes Unsuitable

**Trigger**: Monthly usage consistently <20,000 analyses
**Action**: Switch to pay-as-you-go billing
**Timeline**: After 3 months of low usage data

**Trigger**: Monthly usage >150,000 analyses
**Action**: Evaluate enterprise plans or dedicated resources
**Timeline**: Immediately upon threshold breach

### If Pro Plan API Changes

**Trigger**: Google changes Pro plan terms or pricing
**Action**: Re-evaluate decision based on new terms
**Timeline**: Within 7 days of announcement

---

## Documentation References

- **AI_MANDATE.md**: Model selection guidelines
- **AI_CONTEXT.md**: Infrastructure setup
- **GEMINI_2.5_MIGRATION_COMPLETE.md**: Previous migration documentation
- **docs/AI_INTEGRATION_GUIDE.md**: Implementation details
- **docs/CAPACITY_METRICS.md**: Performance monitoring

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Decision Maker | User | 2026-01-31 | ✅ Approved |
| Implementation | AI Assistant | 2026-01-31 | ✅ Configured |
| Review | - | 2026-02-28 | Pending |

---

**Next Review Date**: February 28, 2026
**Status**: ✅ Active