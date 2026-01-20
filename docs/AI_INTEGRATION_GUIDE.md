# MAEPLE AI Integration Guide

**Version**: 1.0.0  
**Last Updated**: December 26, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [API Key Configuration](#api-key-configuration)
3. [Vision Capabilities Without Native Vision Tooling](#vision-capabilities-without-native-vision-tooling)
4. [Multi-Provider AI Architecture](#multi-provider-ai-architecture)
5. [Best Practices for API Integration](#best-practices-for-api-integration)
6. [Use Cases by Provider](#use-cases-by-provider)
7. [Fallback and Error Handling](#fallback-and-error-handling)

---

## Overview

MAEPLE integrates multiple AI and web service providers to provide comprehensive capabilities including vision analysis, text processing, web search, and media generation. This guide explains how to configure and use these services together, with a focus on solving the challenge of using providers like Z.ai that lack native vision tooling.

### Available Services

| Provider | Type | Key Features | Primary Use Case |
|-----------|-------|---------------|-------------------|
| **Gemini** | Multimodal AI | Vision, Text, Audio | Bio-Mirror, Live Coach |
| **Z.ai** | Code AI | Advanced code generation | Development, refactoring |
| **OpenAI** | Multimodal AI | GPT-4, DALL-E, Whisper | Advanced analysis, media generation |
| **Anthropic** | Text AI | Claude models | Nuanced reasoning |
| **Perplexity** | Search + AI | Web search with AI | Research, current information |
| **OpenRouter** | Model Router | Access to free models | Cost optimization |
| **ElevenLabs** | TTS | Natural voice synthesis | Live Coach audio |
| **Jina AI** | Reader/Search | Content extraction | Web scraping, research |
| **Brave Search** | Search | Fast web search | MCP web search |
| **Firecrawl** | Web Scraper | Advanced crawling | Research, documentation |
| **Giphy** | Media | GIFs and stickers | User engagement |
| **Resend** | Email | Email notifications | User communication |
| **GitHub** | Git | Repository access | Research, integration |

---

## API Key Configuration

### Environment Variables

All API keys are configured in `.env` file. Keys starting with `VITE_` are available to the frontend (client-side), while others are server-side only.

### Client-Side Keys (VITE_*)

```bash
# Frontend can access these via import.meta.env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:3001/api
VITE_OURA_CLIENT_ID=...
VITE_WHOOP_CLIENT_ID=...
VITE_GARMIN_CONSUMER_KEY=...
```

**Security Note**: These keys are exposed to the client. Only include keys that are designed for client-side use (like Firebase, Analytics, etc.). For MAEPLE, we use a proxy pattern for sensitive operations.

### Server-Side Keys

```bash
# Backend only - never exposed to client
DATABASE_URL=postgresql://localhost:5432/maeple
ZAI_API_KEY=your_zai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
BRAVE_API_KEY=your_brave_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
JINA_API_KEY=your_jina_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
GIFY_API_KEY=your_giphy_api_key_here
RESEND_API_KEY=your_resend_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
GITHUB_GENPOZI_TOKEN=your_github_pat_here
MOONSHOT_KIMI_API_KEY=your_moonshot_api_key_here
```

### Proxy Pattern for Client-Side Operations

For operations that require server-side AI services, use the backend as a proxy:

```typescript
// Frontend
const analysis = await fetch('/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: journalEntry })
}).then(res => res.json());

// Backend (api/routes/ai.ts)
router.post('/analyze', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.ZAI_API_KEY; // Server-side only
  const result = await zai.analyze(text, apiKey);
  res.json(result);
});
```

---

## Vision Capabilities Without Native Vision Tooling

### The Challenge

Z.ai and some other AI providers don't have native vision/image analysis capabilities, while Gemini and OpenAI do. This creates a challenge when you want to use Z.ai's advanced code generation but also need vision analysis.

### Solution: Multi-Provider Architecture

The solution is to use a **capability-based routing system** where different providers are used for different capabilities:

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Request                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Capability Router │
        └──────────┬─────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Vision  │  │   Text   │  │   Code   │
│  Tasks   │  │   Tasks  │  │  Tasks   │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │             │
      ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Gemini  │  │   Z.ai   │  │   Z.ai   │
│ OpenAI   │  │  Claude  │  │  Claude  │
└──────────┘  └──────────┘  └──────────┘
```

### Implementation Strategy

#### 1. Capability Detection

```typescript
// services/ai/capabilities.ts
export interface AICapabilities {
  vision: boolean;       // Can analyze images
  textGeneration: boolean; // Can generate text
  codeGeneration: boolean; // Excels at code generation
  audio: boolean;        // Can process audio
  search: boolean;       // Has web search access
}

export const PROVIDER_CAPABILITIES: Record<string, AICapabilities> = {
  gemini: {
    vision: true,
    textGeneration: true,
    codeGeneration: true,
    audio: true,
    search: false
  },
  zai: {
    vision: false,        // ❌ No native vision
    textGeneration: true,
    codeGeneration: true, // ✅ Excellent at code
    audio: false,
    search: false
  },
  openai: {
    vision: true,
    textGeneration: true,
    codeGeneration: true,
    audio: true,
    search: false
  },
  anthropic: {
    vision: false,
    textGeneration: true,
    codeGeneration: true,
    audio: false,
    search: false
  },
  perplexity: {
    vision: false,
    textGeneration: true,
    codeGeneration: false,
    audio: false,
    search: true // ✅ Has web search
  }
};
```

#### 2. Vision Preprocessing (The Key Solution)

When using Z.ai for code but needing vision capabilities, **preprocess the image with a vision-capable provider first**, extract the relevant information, then pass it to Z.ai:

```typescript
// services/ai/multiProviderAnalysis.ts
export async function analyzeWithVisionAndCode(
  imageData: Buffer,
  prompt: string
): Promise<string> {
  // Step 1: Use Gemini for vision analysis (it has native vision)
  const visionResult = await gemini.analyzeImage({
    image: imageData,
    prompt: "Describe this facial expression, noting any signs of fatigue, tension, or emotion."
  });

  // Step 2: Extract structured data from vision analysis
  const visionData = extractVisionData(visionResult);
  
  // Step 3: Use Z.ai for code generation/refactoring
  const codePrompt = `
    Based on this facial analysis data:
    ${JSON.stringify(visionData, null, 2)}
    
    ${prompt}
    
    Generate TypeScript code that:
    1. Processes this facial data
    2. Calculates discrepancy scores
    3. Returns structured analysis
  `;
  
  const codeResult = await zai.generateCode(codePrompt);
  
  return codeResult;
}
```

#### 3. Bio-Mirror Example: Multi-Provider Pipeline

```typescript
// services/bioMirrorAnalysis.ts
export async function analyzeBioMirror(
  imageBuffer: Buffer,
  userBaseline: FacialBaseline
): Promise<BioMirrorResult> {
  // Phase 1: Vision Analysis (Gemini - has native vision)
  const facialFeatures = await gemini.analyzeImage({
    image: imageBuffer,
    prompt: `
      Analyze this face for:
      1. Ptosis (drooping eyelids) - rate 0-1
      2. Glazed gaze - rate 0-1
      3. Lip tension - rate 0-1
      4. Jaw tension - rate 0-1
      5. Smile type (social vs authentic) - rate 0-1 for each
      
      Return structured JSON.
    `
  });

  // Phase 2: Discrepancy Calculation (Custom logic)
  const discrepancy = calculateDiscrepancy(facialFeatures, userBaseline);

  // Phase 3: Interpretation (Claude - excellent at nuance)
  const interpretation = await anthropic.analyze({
    prompt: `
      Facial Analysis Results:
      ${JSON.stringify(facialFeatures, null, 2)}
      
      Discrepancy Score: ${discrepancy}
      
      Provide a compassionate, neuro-affirming interpretation of what this discrepancy might mean.
      Consider:
      - Possibility of masking
      - Self-awareness accuracy
      - Fatigue factors
      - Contextual considerations
      
      Return in JSON format with: { interpretation, suggestions, note }
    `
  });

  // Phase 4: Code Generation (Z.ai - excellent at code)
  const storageCode = await zai.generateCode({
    prompt: `
      Generate TypeScript code to store this analysis:
      ${JSON.stringify({...facialFeatures, discrepancy, interpretation}, null, 2)}
      
      Include:
      1. Type definitions
      2. Validation functions
      3. Encryption (use our encryptionService)
      4. Error handling
    `,
    language: 'typescript',
    framework: 'react'
  });

  return {
    facialFeatures,
    discrepancy,
    interpretation,
    storageCode
  };
}
```

### Solution 2: Base64 Encoding with Text-Based Providers

For providers without vision capabilities, convert images to **base64 and describe them** using a vision-capable provider, then pass descriptions:

```typescript
export async function fallbackVisionPipeline(
  image: File,
  providerWithoutVision: 'zai' | 'anthropic',
  targetPrompt: string
): Promise<string> {
  // Step 1: Encode image
  const base64 = await fileToBase64(image);
  
  // Step 2: Get image description from vision-capable provider
  const description = await gemini.analyzeImage({
    image: base64,
    prompt: "Provide a detailed, factual description of this image."
  });

  // Step 3: Use description with target provider
  const enhancedPrompt = `
    Image Description: ${description}
    
    ${targetPrompt}
  `;

  if (providerWithoutVision === 'zai') {
    return await zai.generateCode(enhancedPrompt);
  } else {
    return await anthropic.analyze(enhancedPrompt);
  }
}
```

### Solution 3: External Vision Services

Use specialized vision services and integrate their results:

```typescript
// services/externalVision.ts
import { vision } from '@ai-sdk/google';

// Option 1: Google Cloud Vision API
export async function analyzeWithGoogleVision(image: Buffer) {
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.faceDetection(image);
  
  return {
    emotions: result.faceAnnotations[0].joyLikelihood,
    blurred: result.faceAnnotations[0].blurredLikelihood,
    underexposed: result.faceAnnotations[0].underExposedLikelihood
  };
}

// Option 2: Azure Face API
// Option 3: AWS Rekognition
// Option 4: Face++ API
```

Then integrate with Z.ai:

```typescript
const visionData = await analyzeWithGoogleVision(imageBuffer);
const code = await zai.generateCode(`
  Process this face detection data:
  ${JSON.stringify(visionData)}
  
  Generate TypeScript code for capacity estimation.
`);
```

---

## Multi-Provider AI Architecture

### AI Router Implementation

```typescript
// services/ai/router.ts
import { zai } from '@zai/sdk';
import { gemini } from '@google/genai';
import { anthropic } from '@anthropic-ai/sdk';

export class AIRouter {
  private providers = {
    gemini: new GeminiProvider(),
    zai: new ZAIProvider(),
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    perplexity: new PerplexityProvider()
  };

  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const { capability, priority } = request;

    // Determine best provider based on capability
    const provider = this.selectProvider(capability, priority);

    try {
      return await provider.execute(request);
    } catch (error) {
      // Fallback to next best provider
      return this.handleFallback(request, provider);
    }
  }

  private selectProvider(capability: string, priority: number): AIProvider {
    const providersByCapability = {
      vision: ['gemini', 'openai'],
      text: ['anthropic', 'gemini', 'zai', 'openai'],
      code: ['zai', 'anthropic', 'gemini'],
      search: ['perplexity', 'jina'],
      audio: ['elevenlabs', 'gemini', 'openai']
    };

    const providers = providersByCapability[capability as keyof typeof providersByCapability];
    return this.providers[providers[priority - 1] || providers[0]];
  }

  private async handleFallback(request: AIRequest, failedProvider: string): Promise<AIResponse> {
    // Exponential backoff
    await sleep(1000);
    
    // Try next provider
    const nextProvider = this.getNextProvider(request.capability, failedProvider);
    return await nextProvider.execute(request);
  }
}
```

### Provider Health Monitoring

```typescript
// services/ai/healthMonitor.ts
export class AIHealthMonitor {
  private providerHealth: Map<string, ProviderStatus> = new Map();

  async checkHealth(providerName: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      await this.providers[providerName].testConnection();
      const responseTime = Date.now() - startTime;
      
      this.providerHealth.set(providerName, {
        healthy: true,
        responseTime,
        lastChecked: new Date(),
        uptime: this.calculateUptime(providerName)
      });
      
      return true;
    } catch (error) {
      this.providerHealth.set(providerName, {
        healthy: false,
        error: error.message,
        lastChecked: new Date()
      });
      
      return false;
    }
  }

  getBestProvider(capability: string): string {
    const capableProviders = this.getCapableProviders(capability);
    
    return capableProviders
      .filter(p => this.providerHealth.get(p)?.healthy)
      .sort((a, b) => {
        const healthA = this.providerHealth.get(a);
        const healthB = this.providerHealth.get(b);
        
        // Prioritize by health, then response time
        if (healthA?.responseTime !== healthB?.responseTime) {
          return (healthA?.responseTime || Infinity) - (healthB?.responseTime || Infinity);
        }
        return 0;
      })[0];
  }
}
```

---

## Best Practices for API Integration

### 1. API Key Security

```typescript
// ❌ BAD: Hardcoded keys
const apiKey = "your_gemini_api_key_here";

// ✅ GOOD: Environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ BETTER: Backend proxy (for server-side keys)
const result = await fetch('/api/proxy/ai', {
  method: 'POST',
  body: JSON.stringify({ provider: 'gemini', prompt })
});
```

### 2. Rate Limiting

```typescript
// services/rateLimiter.ts
export class APIRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(apiKey: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(apiKey) || [];
    
    // Remove old requests outside window
    const recentRequests = requests.filter(r => r > now - windowMs);
    
    if (recentRequests.length >= maxRequests) {
      const retryAfter = windowMs - (recentRequests[0] - now);
      throw new RateLimitError(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    }
    
    recentRequests.push(now);
    this.requests.set(apiKey, recentRequests);
    
    return true;
  }
}
```

### 3. Error Handling

```typescript
// services/ai/errorHandler.ts
export class AIErrorHandler {
  static handle(error: unknown, provider: string): never {
    if (error instanceof RateLimitError) {
      throw new Error(`${provider} rate limit exceeded: ${error.message}`);
    }
    
    if (error instanceof AuthenticationError) {
      throw new Error(`${provider} authentication failed. Check API key.`);
    }
    
    if (error instanceof QuotaExceededError) {
      console.warn(`${provider} quota exceeded. Switching to fallback...`);
      throw new FallbackError('Quota exceeded');
    }
    
    // Log for debugging
    console.error(`${provider} error:`, error);
    
    throw new Error(`${provider} request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 4. Response Caching

```typescript
// services/cache.ts
export class AICache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 300000; // 5 minutes

  async get(key: string): Promise<AIResponse | null> {
    const entry = this.cache.get(key);
    
    if (!entry || Date.now() > entry.expiry) {
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: AIResponse): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  generateKey(prompt: string, provider: string): string {
    return `${provider}:${hashString(prompt)}`;
  }
}
```

---

## Use Cases by Provider

### Gemini (Multimodal Primary)

**Best For**:
- Vision analysis (Bio-Mirror)
- Multimodal tasks (text + image + audio)
- Live Coach (real-time voice + text)
- Image-based code generation

**Example**:
```typescript
// Bio-Mirror facial analysis
const analysis = await gemini.generate({
  model: 'gemini-2.5-flash',
  contents: [{
    role: 'user',
    parts: [
      { text: 'Analyze this face for signs of fatigue and emotion.' },
      { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
    ]
  }]
});
```

### Z.ai (Code Expert)

**Best For**:
- Code generation and refactoring
- Debugging assistance
- Code review
- Architecture suggestions

**Without Vision Pattern**:
```typescript
// 1. Get image description from Gemini
const imageDesc = await gemini.analyzeImage({ image, prompt: 'Describe this face' });

// 2. Use Z.ai for code generation
const code = await zai.generate({
  prompt: `Based on this face analysis: ${imageDesc}
  
  Generate TypeScript code to calculate capacity scores.
  Include:
  - Type definitions
  - Validation
  - Error handling`,
  language: 'typescript'
});
```

### OpenAI (All-Purpose)

**Best For**:
- Advanced text analysis
- Image generation (DALL-E)
- Speech-to-text (Whisper)
- Complex reasoning

**Example**:
```typescript
// Journal analysis with GPT-4
const analysis = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [{
    role: 'system',
    content: 'You are a neuro-affirming mental health AI assistant.'
  }, {
    role: 'user',
    content: `Analyze this journal entry: ${journalText}`
  }]
});
```

### Anthropic (Nuanced Reasoning)

**Best For**:
- Complex text analysis
- Interpretation and synthesis
- Ethical considerations
- Detailed explanations

**Example**:
```typescript
// Interpretation of facial analysis results
const interpretation = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  messages: [{
    role: 'user',
    content: `Provide a compassionate interpretation of this data:
    ${JSON.stringify(analysisData)}`
  }]
});
```

### Perplexity (Search + AI)

**Best For**:
- Web research
- Current information
- Real-time data
- Fact-checking

**Example**:
```typescript
// Research recent studies
const research = await perplexity.search({
  query: 'ADHD capacity grid research 2025',
  model: 'llama-3-sonar-small-32k-online'
});
```

### ElevenLabs (Voice Synthesis)

**Best For**:
- Live Coach audio responses
- Text-to-speech
- Natural voice generation

**Example**:
```typescript
// Generate audio for Live Coach
const audio = await elevenlabs.textToSpeech({
  text: "I understand you're feeling overwhelmed. Let's work through this together.",
  voice_id: '21m00Tcm4TlvDq8ikWAM',
  model_id: 'eleven_multilingual_v2'
});
```

### Jina AI (Content Extraction)

**Best For**:
- Web scraping
- Content reading
- Research scraping

**Example**:
```typescript
// Extract content from research paper
const content = await jina.reader('https://arxiv.org/abs/XXXX.XXXXX');
const cleanContent = jina.clean(content);
```

---

## Fallback and Error Handling

### Fallback Chain Strategy

```typescript
// services/ai/fallback.ts
export const FALLBACK_CHAINS = {
  vision: ['gemini', 'openai'],
  text: ['anthropic', 'gemini', 'zai', 'openai', 'openrouter'],
  code: ['zai', 'anthropic', 'gemini', 'openai'],
  search: ['perplexity', 'jina', 'brave'],
  audio: ['elevenlabs', 'gemini', 'openai']
};

export async function executeWithFallback<T>(
  capability: keyof typeof FALLBACK_CHAINS,
  executor: (provider: string) => Promise<T>
): Promise<T> {
  const chain = FALLBACK_CHAINS[capability];
  
  for (const provider of chain) {
    try {
      console.log(`Attempting ${provider} for ${capability}...`);
      const result = await executor(provider);
      console.log(`✓ Success with ${provider}`);
      return result;
    } catch (error) {
      console.warn(`✗ ${provider} failed:`, error.message);
      // Continue to next provider in chain
    }
  }
  
  throw new Error(`All providers failed for ${capability}`);
}

// Usage
const analysis = await executeWithFallback('vision', async (provider) => {
  if (provider === 'gemini') {
    return await gemini.analyzeImage(image, prompt);
  } else if (provider === 'openai') {
    return await openai.analyzeImage(image, prompt);
  }
});
```

### Circuit Breaker Pattern

```typescript
// services/ai/circuitBreaker.ts
export class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailure: Map<string, Date> = new Map();
  private threshold = 3;
  private timeout = 60000; // 1 minute

  async execute<T>(
    provider: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const failureCount = this.failures.get(provider) || 0;
    const lastFail = this.lastFailure.get(provider);
    
    // Check if circuit is open
    if (failureCount >= this.threshold && lastFail) {
      const timeSinceFail = Date.now() - lastFail.getTime();
      if (timeSinceFail < this.timeout) {
        throw new Error(`Circuit breaker open for ${provider}`);
      }
    }
    
    try {
      const result = await fn();
      this.failures.set(provider, 0); // Reset on success
      return result;
    } catch (error) {
      const newCount = failureCount + 1;
      this.failures.set(provider, newCount);
      this.lastFailure.set(provider, new Date());
      throw error;
    }
  }
}
```

---

## Performance Optimization

### 1. Request Batching

```typescript
// Batch multiple requests to same provider
export async function batchRequests<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(processor)
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### 2. Parallel Provider Comparison

```typescript
// Get results from multiple providers simultaneously
export async function compareProviders(
  prompt: string,
  providers: string[]
): Promise<ComparisonResult[]> {
  const results = await Promise.allSettled(
    providers.map(provider => 
      executeWithFallback('text', async () => 
        this.providers[provider].analyze(prompt)
      )
    )
  );
  
  return results.map((result, index) => ({
    provider: providers[index],
    success: result.status === 'fulfilled',
    response: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

### 3. Streaming Responses

```typescript
// Stream responses for better UX
export async function streamResponse(
  provider: string,
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const stream = await this.providers[provider].stream(prompt);
  let fullResponse = '';
  
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    onChunk(text);
    fullResponse += text;
  }
  
  return fullResponse;
}
```

---

## Monitoring and Analytics

### Usage Tracking

```typescript
// services/ai/analytics.ts
export class AIUsageTracker {
  trackUsage(provider: string, capability: string, tokens: number) {
    // Log to database
    await db.query(`
      INSERT INTO ai_usage (provider, capability, tokens, timestamp)
      VALUES ($1, $2, $3, NOW())
    `, [provider, capability, tokens]);
  }
  
  async getUsageReport(startDate: Date, endDate: Date) {
    return await db.query(`
      SELECT 
        provider,
        capability,
        COUNT(*) as request_count,
        SUM(tokens) as total_tokens,
        AVG(tokens) as avg_tokens
      FROM ai_usage
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY provider, capability
      ORDER BY total_tokens DESC
    `, [startDate, endDate]);
  }
}
```

### Cost Analysis

```typescript
// Calculate costs per provider
export const PROVIDER_COSTS = {
  gemini: { input: 0.001, output: 0.002 }, // per 1K tokens
  openai: { input: 0.003, output: 0.006 },
  anthropic: { input: 0.003, output: 0.015 },
  zai: { input: 0.002, output: 0.004 },
  perplexity: { input: 0.001, output: 0.002 }
};

export function calculateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = PROVIDER_COSTS[provider as keyof typeof PROVIDER_COSTS];
  if (!costs) return 0;
  
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  
  return inputCost + outputCost;
}
```

---

## Conclusion

By implementing a multi-provider AI architecture with capability-based routing, MAEPLE can leverage the strengths of each service while mitigating weaknesses. The key to using providers without native vision capabilities (like Z.ai) is to:

1. **Preprocess with vision-capable providers** (Gemini, OpenAI)
2. **Extract structured data** from vision analysis
3. **Pass structured data** to code-focused providers (Z.ai)
4. **Implement robust fallback chains** for reliability
5. **Monitor usage and costs** for optimization

This approach ensures MAEPLE provides the best possible user experience while maintaining flexibility, reliability, and cost-effectiveness.

---

**Document Version**: 1.0.0  
**Last Updated**: December 26, 2025  
**Maintained By**: MAEPLE Development Team
