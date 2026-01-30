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
      console.log("[AISettings] Loading settings...");
      await this.loadSettings();
      console.log("[AISettings] Settings loaded successfully");
      console.log("[AISettings] Configuration:", {
        providerCount: this.settings?.providers.length || 0,
        providers: this.settings?.providers.map(p => ({
          id: p.providerId,
          enabled: p.enabled,
          hasKey: !!p.apiKey
        })) || []
      });
    } catch (error) {
      console.error('[AISettings] Failed to initialize AI settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
    this.initialized = true;
    console.log("[AISettings] ===== INITIALIZE END =====");
  }

  private async loadSettings(): Promise<void> {
    console.log("[AISettings] ===== LOAD SETTINGS START =====");
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      console.log("[AISettings] localStorage check:", {
        hasStoredSettings: !!stored,
        storageKey: SETTINGS_KEY
      });

      // CRITICAL FIX: Always check environment variable FIRST
      const envKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("[AISettings] Environment variable check:", {
        hasImportMeta: typeof import.meta !== "undefined",
        hasViteEnv: !!envKey,
        envKeyLength: envKey ? envKey.length : 0,
        envKeyFormat: envKey ? (envKey.startsWith("AIza") ? "Valid Gemini format" : "Unknown format") : "Not found"
      });

      // PRIORITY 1: Use environment variable if available and better than stored
      if (envKey) {
        let useEnvKey = false;
        
        if (!stored) {
          // No stored settings - use env key
          console.log("[AISettings] No stored settings, using environment API key");
          useEnvKey = true;
        } else {
          // Have stored settings - check if env key is different/better
          try {
            const parsed = JSON.parse(stored) as AISettings;
            const geminiProvider = parsed.providers.find(p => p.providerId === 'gemini');
            
            if (!geminiProvider || !geminiProvider.apiKey) {
              // No Gemini provider or no key in storage - use env key
              console.log("[AISettings] Stored settings missing Gemini API key, using environment");
              useEnvKey = true;
            } else if (envKey !== geminiProvider.apiKey) {
              // Environment key differs from stored - use env key (more recent)
              console.log("[AISettings] Environment API key differs from stored, updating");
              useEnvKey = true;
            } else {
              console.log("[AISettings] Using stored settings (API key matches environment)");
            }
          } catch (e) {
            console.error("[AISettings] Error parsing stored settings:", e);
            useEnvKey = true;
          }
        }

        if (useEnvKey) {
          console.log("[AISettings] Found API key in environment, creating/updating Gemini provider");
          console.log("[AISettings] API key length:", envKey.length, "(showing first 4 chars:", envKey.substring(0, 4) + "...)");
          this.settings = {
            ...DEFAULT_SETTINGS,
            providers: [{
              providerId: 'gemini',
              enabled: true,
              apiKey: envKey,
            }],
          };
          console.log("[AISettings] Created settings object:", {
            providerCount: this.settings.providers.length,
            geminiEnabled: this.settings.providers[0].enabled,
            geminiHasKey: !!this.settings.providers[0].apiKey
          });
          
          await this.saveSettings();
          console.log("[AISettings] Settings saved successfully with", this.settings.providers.length, "provider(s)");
          console.log("[AISettings] ===== LOAD SETTINGS END =====");
          return;
        }
      } else {
        console.error("[AISettings] CRITICAL: No VITE_GEMINI_API_KEY found in environment!");
        console.error("[AISettings] Available env keys:", Object.keys(import.meta.env));
      }

      // PRIORITY 2: Use stored settings if no env key or stored is valid
      if (stored) {
        console.log("[AISettings] Loading settings from localStorage");
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