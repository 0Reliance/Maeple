
import { WearableAdapter, WearableConfig, StandardizedDailyMetric, ProviderType } from './types';

/**
 * MockWearableAdapter
 * 
 * Simulates connecting to an Oura Ring or similar device.
 * Generates realistic-looking data that correlates slightly with random noise
 * to simulate health patterns.
 */
export class MockWearableAdapter implements WearableAdapter {
  provider: ProviderType = 'OURA';

  getAuthUrl(): string {
    return 'https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=mock_client_id';
  }

  async exchangeCodeForToken(_code: string): Promise<WearableConfig> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      provider: 'OURA',
      accessToken: 'mock_access_token_' + Math.random().toString(36).substring(7),
      isConnected: true,
      lastSyncedAt: new Date().toISOString()
    };
  }

  async fetchDailyMetrics(
    _config: WearableConfig, 
    startDate: Date, 
    endDate: Date
  ): Promise<StandardizedDailyMetric[]> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API latency

    const metrics: StandardizedDailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Generate realistic data
      // HRV typically ranges 20-100ms. Lower often correlates with stress.
      const baseHRV = 45;
      const hrvVariance = Math.floor(Math.random() * 30) - 15;
      
      // Sleep typically 5-9 hours
      const baseSleepHours = 7.5;
      const sleepVariance = (Math.random() * 3) - 1.5; // +/- 1.5 hours
      const totalSleepSeconds = (baseSleepHours + sleepVariance) * 3600;

      metrics.push({
        date: dateStr,
        source: 'OURA',
        sleep: {
          totalDurationSeconds: totalSleepSeconds,
          deepSleepSeconds: totalSleepSeconds * 0.2, // ~20% deep
          remSleepSeconds: totalSleepSeconds * 0.25, // ~25% REM
          efficiencyScore: 85 + Math.floor(Math.random() * 10),
          bedtimeStart: new Date(currentDate.setHours(23, 0, 0, 0)).toISOString(),
          bedtimeEnd: new Date(currentDate.setHours(7, 0, 0, 0)).toISOString(),
        },
        biometrics: {
          restingHeartRate: 60 + Math.floor(Math.random() * 10),
          hrvMs: baseHRV + hrvVariance, 
          respiratoryRate: 14 + Math.random() * 2
        },
        activity: {
          steps: 5000 + Math.floor(Math.random() * 8000),
          totalCalories: 2200 + Math.floor(Math.random() * 500)
        }
      });

      // Next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }
}