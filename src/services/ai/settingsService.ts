/**
 * AI Settings Service
 * 
 * Manages AI provider configuration.
 * Note: MAEPLE is codenamed POZIMIND and is part of the Poziverse.
 */

import { encryptData, decryptData } from '../encryptionService';
import {
  AIProviderType,
  AIProviderConfig,
  AISettings,
  AI_PROVIDERS,
} from './types';

const SETTINGS_KEY = 'maeple_ai_settings';
const ENCRYPTED_KEYS_PREFIX = 'maeple_ai_key_';

const DEFAULT_SETTINGS: AISettings = {
  providers: [],
  offlineMode: false,
};

class AISettingsService {
  private settings: AISettings | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    console.log("[AISettings] ===== INITIALIZE START =====");
    if (this.initialized) {
      console.log("[AISettings] Already initialized, skipping");
      return;
    }

    try {
      await this.loadSettings();
    } catch (error) {
      console.error('[AISettings] Failed to initialize AI settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
    this.initialized = true;
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);

      // CRITICAL FIX: Always check environment variable FIRST
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;

      // PRIORITY 1: Use environment variable if available and better than stored
      if (envKey) {
        let useEnvKey = false;
        
        if (!stored) {
          useEnvKey = true;
        } else {
          // Have stored settings - check if env key is different/better
          try {
            const parsed = JSON.parse(stored) as AISettings;
            const geminiProvider = parsed.providers.find(p => p.providerId === 'gemini');
            
            if (!geminiProvider || !geminiProvider.apiKey) {
              useEnvKey = true;
            } else if (envKey !== geminiProvider.apiKey) {
              useEnvKey = true;
            }
          } catch (e) {
            console.error("[AISettings] Error parsing stored settings:", e);
            useEnvKey = true;
          }
        }

        if (useEnvKey) {
          this.settings = {
            ...DEFAULT_SETTINGS,
            providers: [{
              providerId: 'gemini',
              enabled: true,
              apiKey: envKey,
            }],
          };
          
          await this.saveSettings();
          return;
        }
      } else {
        console.error("[AISettings] CRITICAL: No VITE_GEMINI_API_KEY found in environment!");
      }

      // PRIORITY 2: Use stored settings if no env key or stored is valid
      if (stored) {
        const parsed = JSON.parse(stored) as AISettings;
      
        // Decrypt API keys
        for (const provider of parsed.providers) {
          if (provider.apiKey === '__encrypted__') {
            const decrypted = await this.decryptApiKey(provider.providerId);
            provider.apiKey = decrypted || undefined;
          }
        }

        this.settings = parsed;
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings(): Promise<void> {
    if (!this.settings) return;

    try {
      const providers: AIProviderConfig[] = [];
      
      for (const provider of this.settings.providers) {
        const storedProvider = { ...provider };
        if (provider.apiKey && provider.apiKey !== '__encrypted__') {
          await this.encryptApiKey(provider.providerId, provider.apiKey);
          storedProvider.apiKey = '__encrypted__';
        }
        providers.push(storedProvider);
      }

      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        ...this.settings,
        providers,
      }));
    } catch (error) {
      console.error('Error saving AI settings:', error);
    }
  }

  private async encryptApiKey(providerId: AIProviderType, apiKey: string): Promise<void> {
    try {
      const encrypted = await encryptData({ apiKey });
      localStorage.setItem(`${ENCRYPTED_KEYS_PREFIX}${providerId}`, JSON.stringify(encrypted));
    } catch (error) {
      sessionStorage.setItem(`${ENCRYPTED_KEYS_PREFIX}${providerId}`, apiKey);
    }
  }

  private async decryptApiKey(providerId: AIProviderType): Promise<string | null> {
    try {
      const stored = localStorage.getItem(`${ENCRYPTED_KEYS_PREFIX}${providerId}`);
      if (!stored) {
        return sessionStorage.getItem(`${ENCRYPTED_KEYS_PREFIX}${providerId}`);
      }
      const { cipher, iv } = JSON.parse(stored);
      const decrypted = await decryptData(cipher, iv);
      if (decrypted && typeof decrypted === 'object' && 'apiKey' in decrypted) {
        return (decrypted as { apiKey: string }).apiKey || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  getSettings(): AISettings {
    return this.settings || { ...DEFAULT_SETTINGS };
  }

  async updateProvider(config: AIProviderConfig): Promise<void> {
    if (!this.settings) {
      this.settings = { ...DEFAULT_SETTINGS };
    }

    const index = this.settings.providers.findIndex(p => p.providerId === config.providerId);
    if (index >= 0) {
      this.settings.providers[index] = config;
    } else {
      this.settings.providers.push(config);
    }

    await this.saveSettings();
  }

  async removeProvider(providerId: AIProviderType): Promise<void> {
    if (!this.settings) return;

    this.settings.providers = this.settings.providers.filter(p => p.providerId !== providerId);
    localStorage.removeItem(`${ENCRYPTED_KEYS_PREFIX}${providerId}`);
    sessionStorage.removeItem(`${ENCRYPTED_KEYS_PREFIX}${providerId}`);

    await this.saveSettings();
  }

  getProviderConfig(providerId: AIProviderType): AIProviderConfig | null {
    return this.settings?.providers.find(p => p.providerId === providerId) || null;
  }

  hasAnyProvider(): boolean {
    return this.settings?.providers.some(p => p.enabled && p.apiKey) ?? false;
  }

  getConfiguredProviders(): AIProviderType[] {
    return this.settings?.providers
      .filter(p => p.enabled && p.apiKey)
      .map(p => p.providerId) || [];
  }
}

export const aiSettingsService = new AISettingsService();