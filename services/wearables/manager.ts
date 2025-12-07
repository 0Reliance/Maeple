
import { WearableConfig, ProviderType, WearableAdapter } from './types';
import { MockWearableAdapter } from './mockAdapter';
import { OuraAdapter } from './ouraAdapter';
import { AppleHealthAdapter } from './appleHealthAdapter';
import { GarminAdapter } from './garminAdapter';
import { WearableDataPoint } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = "maeple_wearable_config";

class WearableManager {
  private adapters: Map<ProviderType, WearableAdapter> = new Map();
  private useMockData: boolean = true;

  constructor() {
    this.initializeAdapters();
  }

  /**
   * Initialize all wearable adapters
   */
  private initializeAdapters() {
    // Oura Ring adapter
    const ouraAdapter = new OuraAdapter();
    if (ouraAdapter.isConfigured()) {
      this.adapters.set('OURA', ouraAdapter);
      this.useMockData = false;
      console.log('[Wearables] Oura: Using real API');
    } else {
      this.adapters.set('OURA', new MockWearableAdapter());
      console.log('[Wearables] Oura: Using mock adapter');
    }

    // Apple Health adapter (always available - simulation in web, real on iOS)
    const appleHealthAdapter = new AppleHealthAdapter();
    this.adapters.set('APPLE_HEALTH', appleHealthAdapter);
    console.log(`[Wearables] Apple Health: ${appleHealthAdapter.isNativeMode() ? 'Native HealthKit' : 'Web simulation'}`);

    // Garmin adapter
    const garminAdapter = new GarminAdapter();
    if (garminAdapter.isConfigured()) {
      this.adapters.set('GARMIN', garminAdapter);
      console.log('[Wearables] Garmin: Using real API');
    } else {
      // Garmin can still work in simulation mode
      this.adapters.set('GARMIN', garminAdapter);
      console.log('[Wearables] Garmin: Simulation mode (no credentials)');
    }

    // Log available providers
    console.log(`[Wearables] Available providers: ${Array.from(this.adapters.keys()).join(', ')}`);
  }

  /**
   * Check if we're using mock data for any provider
   */
  isMockMode(): boolean {
    return this.useMockData;
  }

  /**
   * Get list of all supported providers
   */
  getSupportedProviders(): ProviderType[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: ProviderType): boolean {
    return this.adapters.has(provider);
  }

  /**
   * Get provider-specific information
   */
  getProviderInfo(provider: ProviderType): {
    name: string;
    description: string;
    isConfigured: boolean;
    requiresNative: boolean;
  } {
    const providerInfo: Record<ProviderType, { name: string; description: string; requiresNative: boolean }> = {
      'OURA': {
        name: 'Oura Ring',
        description: 'Sleep, HRV, readiness scores',
        requiresNative: false,
      },
      'APPLE_HEALTH': {
        name: 'Apple Health',
        description: 'Sleep, heart rate, activity from iPhone/Apple Watch',
        requiresNative: true,
      },
      'GARMIN': {
        name: 'Garmin Connect',
        description: 'Sleep, stress, body battery, activity',
        requiresNative: false,
      },
      'GOOGLE_FIT': {
        name: 'Google Fit',
        description: 'Activity, sleep, heart rate',
        requiresNative: false,
      },
    };

    const info = providerInfo[provider] || { name: provider, description: '', requiresNative: false };
    const adapter = this.adapters.get(provider);
    
    return {
      ...info,
      isConfigured: adapter ? this.isAdapterConfigured(adapter) : false,
    };
  }

  /**
   * Check if an adapter is configured with real credentials
   */
  private isAdapterConfigured(adapter: WearableAdapter): boolean {
    if ('isConfigured' in adapter && typeof (adapter as any).isConfigured === 'function') {
      return (adapter as any).isConfigured();
    }
    return true;
  }

  // Configuration Management
  getConfig(provider: ProviderType): WearableConfig | null {
    const allConfigs = this.getAllConfigs();
    return allConfigs[provider] || null;
  }

  getAllConfigs(): Record<string, WearableConfig> {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  saveConfig(config: WearableConfig) {
    const configs = this.getAllConfigs();
    configs[config.provider] = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }

  // Auth Flow
  getAuthUrl(provider: ProviderType): string {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Provider ${provider} not supported`);
    return adapter.getAuthUrl();
  }

  async connectProvider(provider: ProviderType, authCode?: string): Promise<WearableConfig> {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Provider ${provider} not supported`);

    // Use provided auth code or simulate for development
    const code = authCode || "auth_code_from_callback";
    const config = await adapter.exchangeCodeForToken(code);
    
    this.saveConfig(config);
    return config;
  }

  async disconnectProvider(provider: ProviderType) {
    const configs = this.getAllConfigs();
    delete configs[provider];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }

  // Sync Flow
  async syncRecentData(provider: ProviderType, daysBack = 7): Promise<WearableDataPoint[]> {
    const config = this.getConfig(provider);
    if (!config || !config.isConnected) throw new Error("Provider not connected");

    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error("Adapter not found");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const metrics = await adapter.fetchDailyMetrics(config, startDate, endDate);

    // Convert to application entity
    const points: WearableDataPoint[] = metrics.map(m => ({
      id: uuidv4(),
      date: m.date,
      provider: m.source,
      syncedAt: new Date().toISOString(),
      metrics: m
    }));

    // Update last sync time
    config.lastSyncedAt = new Date().toISOString();
    this.saveConfig(config);

    return points;
  }

  /**
   * Sync all connected providers
   */
  async syncAllProviders(daysBack = 7): Promise<WearableDataPoint[]> {
    const allPoints: WearableDataPoint[] = [];
    const configs = this.getAllConfigs();

    for (const [provider, config] of Object.entries(configs)) {
      if (config.isConnected) {
        try {
          const points = await this.syncRecentData(provider as ProviderType, daysBack);
          allPoints.push(...points);
        } catch (error) {
          console.error(`[Wearables] Failed to sync ${provider}:`, error);
        }
      }
    }

    return allPoints;
  }
}

export const wearableManager = new WearableManager();
