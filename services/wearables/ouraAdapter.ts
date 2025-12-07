/**
 * Oura Ring API Adapter
 * 
 * Implements the WearableAdapter interface for Oura Ring v2 API.
 * Requires an Oura developer account and API credentials.
 * 
 * API Documentation: https://cloud.ouraring.com/v2/docs
 */

import { WearableAdapter, WearableConfig, StandardizedDailyMetric, ProviderType } from './types';

// Oura API response types
interface OuraSleepData {
  id: string;
  day: string;
  bedtime_start: string;
  bedtime_end: string;
  total_sleep_duration: number;
  deep_sleep_duration: number;
  rem_sleep_duration: number;
  efficiency: number;
  average_heart_rate: number;
  average_hrv: number;
  average_breath: number;
}

interface OuraReadinessData {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

interface OuraApiResponse<T> {
  data: T[];
  next_token?: string;
}

export class OuraAdapter implements WearableAdapter {
  provider: ProviderType = 'OURA';
  
  // These would come from environment variables in a real app
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private apiBaseUrl = 'https://api.ouraring.com/v2';
  private authBaseUrl = 'https://cloud.ouraring.com';

  constructor(config?: { clientId?: string; clientSecret?: string; redirectUri?: string }) {
    // Access Vite env variables with fallback
    const env = (import.meta as any).env || {};
    this.clientId = config?.clientId || env.VITE_OURA_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || env.VITE_OURA_CLIENT_SECRET || '';
    this.redirectUri = config?.redirectUri || `${window.location.origin}/oauth/callback/oura`;
  }

  /**
   * Generate OAuth2 authorization URL for Oura
   */
  getAuthUrl(): string {
    const scopes = ['daily', 'heartrate', 'personal', 'session', 'sleep'];
    const state = this.generateState();
    
    // Store state for CSRF protection
    sessionStorage.setItem('oura_oauth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: state,
    });

    return `${this.authBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<WearableConfig> {
    // Verify state for CSRF protection
    const storedState = sessionStorage.getItem('oura_oauth_state');
    sessionStorage.removeItem('oura_oauth_state');

    const response = await fetch(`${this.authBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Oura auth failed: ${error}`);
    }

    const data = await response.json();

    return {
      provider: 'OURA',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: Date.now() + (data.expires_in * 1000),
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(config: WearableConfig): Promise<WearableConfig> {
    if (!config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.authBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Oura token');
    }

    const data = await response.json();

    return {
      ...config,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || config.refreshToken,
      tokenExpiry: Date.now() + (data.expires_in * 1000),
    };
  }

  /**
   * Fetch daily metrics from Oura API
   */
  async fetchDailyMetrics(
    config: WearableConfig,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric[]> {
    // Check if token needs refresh
    let currentConfig = config;
    if (config.tokenExpiry && Date.now() > config.tokenExpiry - 60000) {
      currentConfig = await this.refreshAccessToken(config);
    }

    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);

    // Fetch sleep data
    const sleepData = await this.fetchSleepData(currentConfig, start, end);
    
    // Fetch readiness data (contains HRV)
    const readinessData = await this.fetchReadinessData(currentConfig, start, end);

    // Merge and standardize
    return this.mergeAndStandardize(sleepData, readinessData);
  }

  /**
   * Fetch sleep data from Oura API
   */
  private async fetchSleepData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<OuraSleepData[]> {
    const url = `${this.apiBaseUrl}/usercollection/sleep?start_date=${start}&end_date=${end}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Oura token expired');
      }
      throw new Error(`Failed to fetch Oura sleep data: ${response.statusText}`);
    }

    const data: OuraApiResponse<OuraSleepData> = await response.json();
    return data.data;
  }

  /**
   * Fetch readiness data from Oura API
   */
  private async fetchReadinessData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<OuraReadinessData[]> {
    const url = `${this.apiBaseUrl}/usercollection/daily_readiness?start_date=${start}&end_date=${end}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    });

    if (!response.ok) {
      // Readiness data is optional, don't throw
      console.warn('Could not fetch Oura readiness data');
      return [];
    }

    const data: OuraApiResponse<OuraReadinessData> = await response.json();
    return data.data;
  }

  /**
   * Merge sleep and readiness data into standardized format
   */
  private mergeAndStandardize(
    sleepData: OuraSleepData[],
    readinessData: OuraReadinessData[]
  ): StandardizedDailyMetric[] {
    // Create a map of readiness by date
    const readinessMap = new Map<string, OuraReadinessData>();
    readinessData.forEach(r => readinessMap.set(r.day, r));

    return sleepData.map(sleep => {
      const readiness = readinessMap.get(sleep.day);

      const metric: StandardizedDailyMetric = {
        date: sleep.day,
        source: 'OURA',
        sleep: {
          totalDurationSeconds: sleep.total_sleep_duration,
          deepSleepSeconds: sleep.deep_sleep_duration,
          remSleepSeconds: sleep.rem_sleep_duration,
          efficiencyScore: sleep.efficiency,
          bedtimeStart: sleep.bedtime_start,
          bedtimeEnd: sleep.bedtime_end,
        },
        biometrics: {
          restingHeartRate: sleep.average_heart_rate,
          hrvMs: sleep.average_hrv,
          respiratoryRate: sleep.average_breath,
        },
      };

      return metric;
    });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate random state for OAuth CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if the adapter has valid credentials configured
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }
}

export default OuraAdapter;
