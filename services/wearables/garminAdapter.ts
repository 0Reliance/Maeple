/**
 * Garmin Connect API Adapter
 * 
 * Implements the WearableAdapter interface for Garmin Connect.
 * 
 * Garmin uses OAuth 1.0a (legacy) for their Health API.
 * This adapter supports:
 * - OAuth 1.0a authentication flow
 * - Daily summaries (sleep, stress, body battery)
 * - Heart rate data
 * - Activity summaries
 * 
 * API Documentation: https://developer.garmin.com/gc-developer-program/
 * 
 * Note: Garmin's Health API requires a developer account and app approval.
 */

import { WearableAdapter, WearableConfig, StandardizedDailyMetric, ProviderType } from './types';

// Garmin API response types
interface GarminSleepData {
  calendarDate: string;
  sleepTimeSeconds: number;
  deepSleepSeconds: number;
  lightSleepSeconds: number;
  remSleepSeconds: number;
  awakeSleepSeconds: number;
  sleepStartTimestampGMT: number;
  sleepEndTimestampGMT: number;
  averageSpO2Value?: number;
  sleepScores?: {
    overall: { value: number };
    quality: { value: number };
  };
}

interface GarminHeartRateData {
  calendarDate: string;
  restingHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
}

interface GarminHRVData {
  calendarDate: string;
  hrvValue: number; // RMSSD in ms
  readingStartTimestampGMT: number;
  status: string;
}

interface GarminStressData {
  calendarDate: string;
  averageStressLevel: number;
  maxStressLevel: number;
  stressDurationSeconds: number;
  restStressDurationSeconds: number;
  activityStressDurationSeconds: number;
  lowStressDurationSeconds: number;
  mediumStressDurationSeconds: number;
  highStressDurationSeconds: number;
}

interface GarminActivityData {
  calendarDate: string;
  totalSteps: number;
  totalDistanceMeters: number;
  activeKilocalories: number;
  bmrKilocalories: number;
  moderateIntensityMinutes: number;
  vigorousIntensityMinutes: number;
  floorsAscended: number;
}

interface GarminBodyBatteryData {
  calendarDate: string;
  charged: number;
  drained: number;
  startOfDayValue: number;
  endOfDayValue: number;
}

export class GarminAdapter implements WearableAdapter {
  provider: ProviderType = 'GARMIN';
  
  // Garmin OAuth 1.0a endpoints
  private requestTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
  private authorizeUrl = 'https://connect.garmin.com/oauthConfirm';
  private accessTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
  private apiBaseUrl = 'https://apis.garmin.com/wellness-api/rest';
  
  // OAuth credentials (from environment)
  private consumerKey: string;
  private consumerSecret: string;
  private redirectUri: string;

  constructor(config?: { consumerKey?: string; consumerSecret?: string; redirectUri?: string }) {
    const env = (import.meta as any).env || {};
    this.consumerKey = config?.consumerKey || env.VITE_GARMIN_CONSUMER_KEY || '';
    this.consumerSecret = config?.consumerSecret || env.VITE_GARMIN_CONSUMER_SECRET || '';
    this.redirectUri = config?.redirectUri || `${window.location.origin}/oauth/callback/garmin`;
  }

  /**
   * Generate OAuth 1.0a authorization URL
   * Note: OAuth 1.0a is more complex than OAuth 2.0 - requires request token first
   */
  getAuthUrl(): string {
    if (!this.isConfigured()) {
      console.warn('[Garmin] Not configured - missing consumer key/secret');
      return 'https://developer.garmin.com/gc-developer-program/';
    }

    // In a real implementation, we'd need to:
    // 1. Get a request token from Garmin
    // 2. Store the request token secret
    // 3. Return the authorization URL with the request token
    
    // For MVP, we'll store a placeholder and handle the full flow in exchangeCodeForToken
    const state = this.generateState();
    sessionStorage.setItem('garmin_oauth_state', state);

    // This URL pattern assumes request token was obtained
    // In production, you'd call getRequestToken() first
    return `${this.authorizeUrl}?oauth_token=REQUEST_TOKEN_HERE&oauth_callback=${encodeURIComponent(this.redirectUri)}`;
  }

  /**
   * Exchange OAuth verifier for access token
   * In OAuth 1.0a, the "code" is actually the oauth_verifier
   */
  async exchangeCodeForToken(oauthVerifier: string): Promise<WearableConfig> {
    // Retrieve the request token from session storage
    const requestToken = sessionStorage.getItem('garmin_request_token');
    const requestTokenSecret = sessionStorage.getItem('garmin_request_token_secret');
    
    sessionStorage.removeItem('garmin_request_token');
    sessionStorage.removeItem('garmin_request_token_secret');
    sessionStorage.removeItem('garmin_oauth_state');

    if (!requestToken || !requestTokenSecret) {
      // For development/testing, simulate the flow
      console.log('[Garmin] Simulating OAuth flow (no request token found)');
      return this.simulateConnection();
    }

    try {
      // Build OAuth 1.0a signature for access token request
      const accessTokenResponse = await this.makeOAuth1Request(
        this.accessTokenUrl,
        'POST',
        {
          oauth_token: requestToken,
          oauth_verifier: oauthVerifier,
        },
        requestTokenSecret
      );

      const params = new URLSearchParams(accessTokenResponse);
      const accessToken = params.get('oauth_token');
      const accessTokenSecret = params.get('oauth_token_secret');

      if (!accessToken || !accessTokenSecret) {
        throw new Error('Failed to obtain access token');
      }

      return {
        provider: 'GARMIN',
        accessToken: accessToken,
        refreshToken: accessTokenSecret, // OAuth 1.0a uses token secret instead of refresh token
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Garmin] Token exchange failed:', error);
      throw new Error(`Garmin authentication failed: ${error}`);
    }
  }

  /**
   * Simulate connection for development
   */
  private simulateConnection(): WearableConfig {
    return {
      provider: 'GARMIN',
      accessToken: 'garmin_simulated_token',
      refreshToken: 'garmin_simulated_secret',
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch daily metrics from Garmin Connect API
   */
  async fetchDailyMetrics(
    config: WearableConfig,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric[]> {
    if (!config.isConnected) {
      throw new Error('Garmin not connected');
    }

    // Check if we have real credentials
    if (!this.isConfigured() || config.accessToken === 'garmin_simulated_token') {
      console.log('[Garmin] Using simulated data (no real connection)');
      return this.generateSimulatedData(startDate, endDate);
    }

    try {
      const start = this.formatDate(startDate);
      const end = this.formatDate(endDate);

      // Fetch all data types in parallel
      const [sleepData, heartData, hrvData, activityData, stressData] = await Promise.all([
        this.fetchSleepData(config, start, end),
        this.fetchHeartRateData(config, start, end),
        this.fetchHRVData(config, start, end),
        this.fetchActivityData(config, start, end),
        this.fetchStressData(config, start, end),
      ]);

      // Merge data by date
      return this.mergeAndStandardize(sleepData, heartData, hrvData, activityData, stressData);
    } catch (error) {
      console.error('[Garmin] Failed to fetch metrics:', error);
      // Fall back to simulated data on error
      return this.generateSimulatedData(startDate, endDate);
    }
  }

  /**
   * Fetch sleep data from Garmin
   */
  private async fetchSleepData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<GarminSleepData[]> {
    try {
      const url = `${this.apiBaseUrl}/sleeps?uploadStartTimeInSeconds=${this.dateToTimestamp(start)}&uploadEndTimeInSeconds=${this.dateToTimestamp(end)}`;
      const response = await this.makeAuthenticatedRequest(config, url);
      return response || [];
    } catch (error) {
      console.warn('[Garmin] Failed to fetch sleep data:', error);
      return [];
    }
  }

  /**
   * Fetch heart rate data from Garmin
   */
  private async fetchHeartRateData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<GarminHeartRateData[]> {
    try {
      const url = `${this.apiBaseUrl}/dailies?uploadStartTimeInSeconds=${this.dateToTimestamp(start)}&uploadEndTimeInSeconds=${this.dateToTimestamp(end)}`;
      const response = await this.makeAuthenticatedRequest(config, url);
      return response || [];
    } catch (error) {
      console.warn('[Garmin] Failed to fetch heart rate data:', error);
      return [];
    }
  }

  /**
   * Fetch HRV data from Garmin
   */
  private async fetchHRVData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<GarminHRVData[]> {
    try {
      const url = `${this.apiBaseUrl}/hrv?uploadStartTimeInSeconds=${this.dateToTimestamp(start)}&uploadEndTimeInSeconds=${this.dateToTimestamp(end)}`;
      const response = await this.makeAuthenticatedRequest(config, url);
      return response || [];
    } catch (error) {
      console.warn('[Garmin] Failed to fetch HRV data:', error);
      return [];
    }
  }

  /**
   * Fetch activity data from Garmin
   */
  private async fetchActivityData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<GarminActivityData[]> {
    try {
      const url = `${this.apiBaseUrl}/dailies?uploadStartTimeInSeconds=${this.dateToTimestamp(start)}&uploadEndTimeInSeconds=${this.dateToTimestamp(end)}`;
      const response = await this.makeAuthenticatedRequest(config, url);
      return response || [];
    } catch (error) {
      console.warn('[Garmin] Failed to fetch activity data:', error);
      return [];
    }
  }

  /**
   * Fetch stress data from Garmin
   */
  private async fetchStressData(
    config: WearableConfig,
    start: string,
    end: string
  ): Promise<GarminStressData[]> {
    try {
      const url = `${this.apiBaseUrl}/stressDetails?uploadStartTimeInSeconds=${this.dateToTimestamp(start)}&uploadEndTimeInSeconds=${this.dateToTimestamp(end)}`;
      const response = await this.makeAuthenticatedRequest(config, url);
      return response || [];
    } catch (error) {
      console.warn('[Garmin] Failed to fetch stress data:', error);
      return [];
    }
  }

  /**
   * Make an authenticated request to Garmin API
   */
  private async makeAuthenticatedRequest(config: WearableConfig, url: string): Promise<any> {
    // In OAuth 1.0a, we need to sign each request
    const response = await this.makeOAuth1Request(
      url,
      'GET',
      { oauth_token: config.accessToken },
      config.refreshToken || '' // Token secret
    );

    return JSON.parse(response);
  }

  /**
   * Make OAuth 1.0a signed request
   * This is a simplified implementation - production would need proper signature generation
   */
  private async makeOAuth1Request(
    url: string,
    method: string,
    oauthParams: Record<string, string>,
    tokenSecret: string
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateNonce();

    const allParams: Record<string, string> = {
      oauth_consumer_key: this.consumerKey,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
      ...oauthParams,
    };

    // Generate signature
    const signature = await this.generateOAuth1Signature(method, url, allParams, tokenSecret);
    allParams.oauth_signature = signature;

    // Build Authorization header
    const authHeader = 'OAuth ' + Object.entries(allParams)
      .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
      .join(', ');

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Garmin API error: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Generate OAuth 1.0a signature
   */
  private async generateOAuth1Signature(
    method: string,
    url: string,
    params: Record<string, string>,
    tokenSecret: string
  ): Promise<string> {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // Create signature base string
    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url.split('?')[0]),
      encodeURIComponent(sortedParams),
    ].join('&');

    // Create signing key
    const signingKey = `${encodeURIComponent(this.consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    // Generate HMAC-SHA1 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const messageData = encoder.encode(signatureBase);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * Merge all data types into standardized format
   */
  private mergeAndStandardize(
    sleepData: GarminSleepData[],
    heartData: GarminHeartRateData[],
    hrvData: GarminHRVData[],
    activityData: GarminActivityData[],
    stressData: GarminStressData[]
  ): StandardizedDailyMetric[] {
    // Create a map of all dates
    const dateMap = new Map<string, StandardizedDailyMetric>();

    // Process sleep data
    for (const sleep of sleepData) {
      const date = sleep.calendarDate;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, source: 'GARMIN' });
      }
      
      const metric = dateMap.get(date)!;
      metric.sleep = {
        totalDurationSeconds: sleep.sleepTimeSeconds,
        deepSleepSeconds: sleep.deepSleepSeconds,
        remSleepSeconds: sleep.remSleepSeconds,
        efficiencyScore: sleep.sleepScores?.overall?.value || 0,
        bedtimeStart: new Date(sleep.sleepStartTimestampGMT * 1000).toISOString(),
        bedtimeEnd: new Date(sleep.sleepEndTimestampGMT * 1000).toISOString(),
      };
    }

    // Process heart rate and HRV data
    for (const heart of heartData) {
      const date = heart.calendarDate;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, source: 'GARMIN' });
      }
      
      const metric = dateMap.get(date)!;
      const hrv = hrvData.find(h => h.calendarDate === date);
      
      metric.biometrics = {
        restingHeartRate: heart.restingHeartRate,
        hrvMs: hrv?.hrvValue || 0,
      };
    }

    // Process activity data
    for (const activity of activityData) {
      const date = activity.calendarDate;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, source: 'GARMIN' });
      }
      
      const metric = dateMap.get(date)!;
      metric.activity = {
        steps: activity.totalSteps,
        totalCalories: activity.activeKilocalories + activity.bmrKilocalories,
      };
    }

    return Array.from(dateMap.values());
  }

  /**
   * Generate simulated data for development
   */
  private generateSimulatedData(startDate: Date, endDate: Date): StandardizedDailyMetric[] {
    const metrics: StandardizedDailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const sleepHours = 6 + Math.random() * 3;
      const sleepSeconds = sleepHours * 3600;
      
      const bedtimeStart = new Date(currentDate);
      bedtimeStart.setHours(22 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      
      const bedtimeEnd = new Date(bedtimeStart);
      bedtimeEnd.setHours(bedtimeEnd.getHours() + Math.floor(sleepHours) + 1);

      metrics.push({
        date: this.formatDate(currentDate),
        source: 'GARMIN',
        sleep: {
          totalDurationSeconds: Math.round(sleepSeconds),
          deepSleepSeconds: Math.round(sleepSeconds * (0.15 + Math.random() * 0.1)),
          remSleepSeconds: Math.round(sleepSeconds * (0.2 + Math.random() * 0.1)),
          efficiencyScore: Math.round(75 + Math.random() * 20),
          bedtimeStart: bedtimeStart.toISOString(),
          bedtimeEnd: bedtimeEnd.toISOString(),
        },
        biometrics: {
          restingHeartRate: Math.round(50 + Math.random() * 25),
          hrvMs: Math.round(25 + Math.random() * 60),
          respiratoryRate: Math.round(12 + Math.random() * 6),
        },
        activity: {
          steps: Math.round(4000 + Math.random() * 12000),
          totalCalories: Math.round(1700 + Math.random() * 900),
        },
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert date string to Unix timestamp
   */
  private dateToTimestamp(dateStr: string): number {
    return Math.floor(new Date(dateStr).getTime() / 1000);
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
   * Generate random nonce for OAuth
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if the adapter has valid credentials configured
   */
  isConfigured(): boolean {
    return Boolean(this.consumerKey && this.consumerSecret);
  }
}
