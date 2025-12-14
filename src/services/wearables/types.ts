export type ProviderType =
  | "OURA"
  | "GOOGLE_FIT"
  | "APPLE_HEALTH"
  | "GARMIN"
  | "WHOOP";

export interface WearableConfig {
  provider: ProviderType;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: number;
  isConnected: boolean;
  lastSyncedAt?: string;
}

// Normalized output that the app consumes
export interface StandardizedDailyMetric {
  date: string; // YYYY-MM-DD
  source: ProviderType;
  sleep?: {
    totalDurationSeconds: number;
    deepSleepSeconds: number;
    remSleepSeconds: number;
    efficiencyScore: number; // 0-100
    bedtimeStart: string; // ISO
    bedtimeEnd: string; // ISO
  };
  biometrics?: {
    restingHeartRate: number;
    hrvMs: number; // Heart Rate Variability (rMSSD) - Key metric for stress/mood
    respiratoryRate?: number;
  };
  activity?: {
    steps: number;
    totalCalories: number;
  };
}

// The Contract that all adapters must implement
export interface WearableAdapter {
  provider: ProviderType;

  // Auth Flow
  getAuthUrl(): string;
  exchangeCodeForToken(code: string): Promise<WearableConfig>;

  // Data Fetching
  fetchDailyMetrics(
    config: WearableConfig,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric[]>;
}
