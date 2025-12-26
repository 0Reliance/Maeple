/**
 * MAEPLE AI Provider Types
 * 
 * Simple type system for multi-provider LLM support.
 * Part of MAEPLE (Mental And Emotional Pattern Literacy Engine), codenamed by Pozi, part of Poziverse.
 */

// Supported AI Providers
export type AIProviderType = 
  | 'gemini'
  | 'openrouter'
  | 'perplexity'
  | 'openai'
  | 'ollama'
  | 'zai'
  | 'anthropic';

// AI Capabilities
export type AICapability = 
  | 'text'
  | 'vision'
  | 'image_gen'
  | 'search'
  | 'audio';

// Provider metadata
export interface AIProviderInfo {
  id: AIProviderType;
  name: string;
  description: string;
  docsUrl: string;
  capabilities: AICapability[];
  isLocal: boolean;
  defaultBaseUrl?: string;
}

// User's configuration for a provider
export interface AIProviderConfig {
  providerId: AIProviderType;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
}

// Complete AI settings
export interface AISettings {
  providers: AIProviderConfig[];
  offlineMode?: boolean;
}

// Request/Response Types
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AITextRequest {
  messages: AIMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface AITextResponse {
  content: string;
  model: string;
  provider: AIProviderType;
}

export interface AIVisionRequest {
  imageData: string;
  mimeType: string;
  prompt: string;
}

export interface AIVisionResponse {
  content: string;
  provider: AIProviderType;
  model: string;
}

export interface AIImageRequest {
  prompt: string;
  inputImage?: string;
  size?: string;
}

export interface AIImageResponse {
  imageUrl: string;
  provider: AIProviderType;
  model: string;
}

export interface AISearchRequest {
  query: string;
  maxResults?: number;
}

export interface AISearchResponse {
  content: string;
  sources?: Array<{
    title: string;
    url: string;
  }>;
  provider: AIProviderType;
}

export interface AIAudioAnalysisRequest {
  audioData: string; // base64
  mimeType: string;
  prompt: string;
}

export interface AIAudioAnalysisResponse {
  content: string;
  provider: AIProviderType;
  model: string;
}

// Live/Audio Types
export interface AILiveConfig {
  systemInstruction?: string;
  voice?: string;
  callbacks: {
    onOpen?: () => void;
    onAudioData?: (data: Uint8Array) => void;
    onTextData?: (text: string) => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
  };
}

export interface AILiveSession {
  sendAudio(base64Data: string): Promise<void>;
  disconnect(): Promise<void>;
}

// Error classes
export class AIError extends Error {
  constructor(
    message: string,
    public readonly provider?: AIProviderType
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIAuthenticationError extends AIError {
  constructor(provider: AIProviderType) {
    super(`Authentication failed for ${provider}. Check your API key.`, provider);
    this.name = 'AIAuthenticationError';
  }
}

export class AIRateLimitError extends AIError {
  constructor(provider: AIProviderType) {
    super(`Rate limit exceeded for ${provider}.`, provider);
    this.name = 'AIRateLimitError';
  }
}

// Provider Registry
export const AI_PROVIDERS: Record<AIProviderType, AIProviderInfo> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI with native search',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    isLocal: false,
    capabilities: ['text', 'vision', 'image_gen', 'search', 'audio'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access 100+ AI models through one API',
    docsUrl: 'https://openrouter.ai/keys',
    isLocal: false,
    capabilities: ['text', 'vision'],
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'AI search with real-time web grounding',
    docsUrl: 'https://perplexity.ai/settings/api',
    isLocal: false,
    capabilities: ['text', 'search'],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, and real-time audio',
    docsUrl: 'https://platform.openai.com/api-keys',
    isLocal: false,
    capabilities: ['text', 'vision', 'image_gen'],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run AI models locally - free & private',
    docsUrl: 'https://ollama.ai/download',
    isLocal: true,
    defaultBaseUrl: 'http://localhost:11434',
    capabilities: ['text', 'vision'],
  },
  zai: {
    id: 'zai',
    name: 'Z.ai',
    description: 'Z.ai conversational AI platform',
    docsUrl: 'https://z.ai',
    isLocal: false,
    capabilities: ['text'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Advanced reasoning with constitutional AI',
    docsUrl: 'https://console.anthropic.com',
    isLocal: false,
    capabilities: ['text', 'vision'],
  },
};
