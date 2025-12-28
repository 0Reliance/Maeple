/**
 * Whoop API Adapter
 *
 * Implements the WearableAdapter interface for Whoop.
 *
 * API Documentation: https://developer.whoop.com/docs/
 */

import {
  WearableAdapter,
  WearableConfig,
  StandardizedDailyMetric,
  ProviderType,
} from "./types";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";

// Replace with actual client ID from environment variables
// @ts-ignore
const CLIENT_ID = import.meta.env.VITE_WHOOP_CLIENT_ID || "mock_client_id";
const REDIRECT_URI =
  window.location.origin + "/settings/wearables/callback/whoop";

export class WhoopAdapter implements WearableAdapter {
  provider: ProviderType = "WHOOP";

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: "read:recovery read:cycles read:sleep read:workout",
      state: "whoop_auth_state",
    });
    return `${WHOOP_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<WearableConfig> {
    // In a real implementation, this would call the backend to exchange code for token
    // to avoid exposing client secret. For this client-side demo, we'll simulate it.

    console.log("[Whoop] Exchanging code for token:", code);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      provider: "WHOOP",
      accessToken: "mock_whoop_access_token",
      refreshToken: "mock_whoop_refresh_token",
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async fetchDailyMetrics(
    config: WearableConfig,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric[]> {
    if (!config.isConnected) {
      throw new Error("Whoop not connected");
    }

    // In a real implementation, we would fetch from Whoop API
    // For now, we'll generate mock data that looks like Whoop data
    return this.generateMockData(startDate, endDate);
  }

  private generateMockData(
    startDate: Date,
    endDate: Date
  ): StandardizedDailyMetric[] {
    const metrics: StandardizedDailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Whoop specific characteristics:
      // - High focus on Recovery (0-100%)
      // - Strain (0-21)
      // - Sleep Performance

      const _recovery = Math.round(30 + Math.random() * 65); // 30-95%
      const _strain = 8 + Math.random() * 10; // 8-18

      const bedtimeStart = new Date(currentDate);
      bedtimeStart.setHours(22, 0, 0, 0);
      const bedtimeEnd = new Date(currentDate);
      bedtimeEnd.setDate(bedtimeEnd.getDate() + 1);
      bedtimeEnd.setHours(7, 0, 0, 0);

      metrics.push({
        date: currentDate.toISOString().split("T")[0],
        source: "WHOOP",
        biometrics: {
          restingHeartRate: Math.round(45 + Math.random() * 15), // Whoop users often have lower RHR
          hrvMs: Math.round(40 + Math.random() * 80), // Higher HRV
          respiratoryRate: 12 + Math.random() * 4,
        },
        sleep: {
          totalDurationSeconds: Math.round((6 + Math.random() * 3) * 3600),
          efficiencyScore: Math.round(85 + Math.random() * 10),
          deepSleepSeconds: Math.round((1 + Math.random()) * 3600),
          remSleepSeconds: Math.round((1.5 + Math.random()) * 3600),
          bedtimeStart: bedtimeStart.toISOString(),
          bedtimeEnd: bedtimeEnd.toISOString(),
        },
        activity: {
          steps: Math.round(6000 + Math.random() * 8000),
          totalCalories: Math.round(2000 + Math.random() * 1000),
        },
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }
}