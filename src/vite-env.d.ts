/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly SSR: boolean;
  
  // AI Provider Keys
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  
  // Feature Flags
  readonly VITE_ENABLE_BIOMIRROR: string;
  readonly VITE_ENABLE_VOICE_JOURNAL: string;
  readonly VITE_ENABLE_WEARABLES: string;
  readonly VITE_ENABLE_CLOUD_SYNC: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}