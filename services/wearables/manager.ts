
import { WearableConfig, ProviderType, WearableAdapter } from './types';
import { MockWearableAdapter } from './mockAdapter';
import { OuraAdapter } from './ouraAdapter';
import { WearableDataPoint } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = "maeple_wearable_config";

class WearableManager {
  private adapters: Map<ProviderType, WearableAdapter> = new Map();
  private useMockData: boolean = true;

  constructor() {
    // Check if real Oura credentials are configured
    const ouraAdapter = new OuraAdapter();
    
    if (ouraAdapter.isConfigured()) {
      this.adapters.set('OURA', ouraAdapter);
      this.useMockData = false;
      console.log('[Wearables] Using real Oura API');
    } else {
      // Fall back to mock adapter for development
      this.adapters.set('OURA', new MockWearableAdapter());
      console.log('[Wearables] Using mock adapter (no API credentials found)');
    }
    
    // Future: this.adapters.set('GOOGLE_FIT', new GoogleFitAdapter());
  }

  /**
   * Check if we're using mock data
   */
  isMockMode(): boolean {
    return this.useMockData;
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
  async connectProvider(provider: ProviderType): Promise<WearableConfig> {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Provider ${provider} not supported`);

    // In a real app, this would involve window.location.href redirect
    // For MVP, we simulate the code exchange immediately
    const mockCode = "auth_code_from_callback"; 
    const config = await adapter.exchangeCodeForToken(mockCode);
    
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
}

export const wearableManager = new WearableManager();
