/**
 * Apple HealthKit Adapter
 * 
 * Implements the WearableAdapter interface for Apple HealthKit.
 * 
 * IMPORTANT: Apple HealthKit is only available on iOS devices and requires:
 * 1. A native iOS app wrapper (e.g., Capacitor, React Native)
 * 2. HealthKit entitlements in the app
 * 3. User permission to access health data
 * 
 * This adapter provides:
 * - Web-based simulation for development/testing
 * - Real HealthKit integration when running in a native iOS wrapper
 * 
 * For production, this would integrate with a native bridge like:
 * - @capacitor-community/health-kit
 * - react-native-health
 */

import { WearableAdapter, WearableConfig, StandardizedDailyMetric, ProviderType } from './types';

// Check if running in a native iOS environment with HealthKit bridge
const hasNativeHealthKit = (): boolean => {
  return typeof (window as any).HealthKit !== 'undefined' || 
         typeof (window as any).Capacitor?.Plugins?.HealthKit !== 'undefined';
};

// HealthKit data types we request
const HEALTHKIT_READ_PERMISSIONS = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRespiratoryRate',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKCategoryTypeIdentifierSleepAnalysis',
];

export class AppleHealthAdapter implements WearableAdapter {
  provider: ProviderType = 'APPLE_HEALTH';
  
  private isNative: boolean;

  constructor() {
    this.isNative = hasNativeHealthKit();
    
    if (this.isNative) {
      console.log('[AppleHealth] Native HealthKit bridge detected');
    } else {
      console.log('[AppleHealth] Running in web mode (simulation only)');
    }
  }

  /**
   * Apple HealthKit doesn't use OAuth - it uses native iOS permissions
   * This URL would trigger the native permission dialog in a real app
   */
  getAuthUrl(): string {
    if (this.isNative) {
      // In native mode, return a deep link that triggers permission request
      return 'maeple://healthkit/authorize';
    }
    
    // In web mode, return info about requirements
    return 'https://developer.apple.com/documentation/healthkit';
  }

  /**
   * Request HealthKit permissions
   * In native mode, this triggers the iOS permission dialog
   */
  async exchangeCodeForToken(code: string): Promise<WearableConfig> {
    if (this.isNative) {
      return this.requestNativePermissions();
    }
    
    // Web simulation - return mock connected state
    console.log('[AppleHealth] Simulating connection (web mode)');
    return {
      provider: 'APPLE_HEALTH',
      accessToken: 'healthkit_authorized',
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  /**
   * Request native HealthKit permissions via Capacitor/native bridge
   */
  private async requestNativePermissions(): Promise<WearableConfig> {
    try {
      const HealthKit = (window as any).Capacitor?.Plugins?.HealthKit || (window as any).HealthKit;
      
      if (!HealthKit) {
        throw new Error('HealthKit bridge not available');
      }

      // Request authorization
      const result = await HealthKit.requestAuthorization({
        read: HEALTHKIT_READ_PERMISSIONS,
        write: [], // We don't write to HealthKit
      });

      if (!result.authorized) {
        throw new Error('HealthKit authorization denied');
      }

      return {
        provider: 'APPLE_HEALTH',
        accessToken: 'healthkit_authorized',
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[AppleHealth] Permission request failed:', error);
      throw new Error(`HealthKit authorization failed: ${error}`);
    }
  }

  /**
   * Fetch daily metrics from HealthKit
   */
  async fetchDailyMetrics(
    config: WearableConfig,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric[]> {
    if (!config.isConnected) {
      throw new Error('Apple Health not connected');
    }

    if (this.isNative) {
      return this.fetchNativeMetrics(startDate, endDate);
    }

    // Web simulation - return mock data
    return this.generateSimulatedData(startDate, endDate);
  }

  /**
   * Fetch real data from native HealthKit
   */
  private async fetchNativeMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric[]> {
    const HealthKit = (window as any).Capacitor?.Plugins?.HealthKit || (window as any).HealthKit;
    
    if (!HealthKit) {
      console.warn('[AppleHealth] Native bridge not available, falling back to simulation');
      return this.generateSimulatedData(startDate, endDate);
    }

    const metrics: StandardizedDailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      try {
        // Fetch sleep data
        const sleepData = await this.fetchSleepData(HealthKit, dayStart, dayEnd);
        
        // Fetch heart rate data
        const heartData = await this.fetchHeartData(HealthKit, dayStart, dayEnd);
        
        // Fetch activity data
        const activityData = await this.fetchActivityData(HealthKit, dayStart, dayEnd);

        const metric: StandardizedDailyMetric = {
          date: this.formatDate(currentDate),
          source: 'APPLE_HEALTH',
        };

        if (sleepData) {
          metric.sleep = sleepData;
        }

        if (heartData) {
          metric.biometrics = heartData;
        }

        if (activityData) {
          metric.activity = activityData;
        }

        // Only add if we have some data
        if (metric.sleep || metric.biometrics || metric.activity) {
          metrics.push(metric);
        }
      } catch (error) {
        console.warn(`[AppleHealth] Failed to fetch data for ${this.formatDate(currentDate)}:`, error);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Fetch sleep analysis from HealthKit
   */
  private async fetchSleepData(
    HealthKit: any,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric['sleep'] | null> {
    try {
      const result = await HealthKit.querySleepAnalysis({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (!result.samples || result.samples.length === 0) {
        return null;
      }

      // Process sleep samples
      let totalSleep = 0;
      let deepSleep = 0;
      let remSleep = 0;
      let bedtimeStart = '';
      let bedtimeEnd = '';

      for (const sample of result.samples) {
        const duration = (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()) / 1000;
        
        if (!bedtimeStart || sample.startDate < bedtimeStart) {
          bedtimeStart = sample.startDate;
        }
        if (!bedtimeEnd || sample.endDate > bedtimeEnd) {
          bedtimeEnd = sample.endDate;
        }

        // Apple HealthKit sleep stages
        switch (sample.value) {
          case 'HKCategoryValueSleepAnalysisAsleepDeep':
            deepSleep += duration;
            totalSleep += duration;
            break;
          case 'HKCategoryValueSleepAnalysisAsleepREM':
            remSleep += duration;
            totalSleep += duration;
            break;
          case 'HKCategoryValueSleepAnalysisAsleepCore':
          case 'HKCategoryValueSleepAnalysisAsleep':
            totalSleep += duration;
            break;
        }
      }

      if (totalSleep === 0) {
        return null;
      }

      // Calculate efficiency (time asleep / time in bed)
      const timeInBed = (new Date(bedtimeEnd).getTime() - new Date(bedtimeStart).getTime()) / 1000;
      const efficiency = timeInBed > 0 ? Math.round((totalSleep / timeInBed) * 100) : 0;

      return {
        totalDurationSeconds: Math.round(totalSleep),
        deepSleepSeconds: Math.round(deepSleep),
        remSleepSeconds: Math.round(remSleep),
        efficiencyScore: Math.min(100, efficiency),
        bedtimeStart,
        bedtimeEnd,
      };
    } catch (error) {
      console.warn('[AppleHealth] Failed to fetch sleep data:', error);
      return null;
    }
  }

  /**
   * Fetch heart rate metrics from HealthKit
   */
  private async fetchHeartData(
    HealthKit: any,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric['biometrics'] | null> {
    try {
      // Get resting heart rate
      const restingHR = await HealthKit.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierRestingHeartRate',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        unit: 'count/min',
      });

      // Get HRV
      const hrv = await HealthKit.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        unit: 'ms',
      });

      // Get respiratory rate
      const respRate = await HealthKit.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierRespiratoryRate',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        unit: 'count/min',
      });

      const avgRestingHR = this.calculateAverage(restingHR?.samples);
      const avgHRV = this.calculateAverage(hrv?.samples);
      const avgRespRate = this.calculateAverage(respRate?.samples);

      if (!avgRestingHR && !avgHRV) {
        return null;
      }

      return {
        restingHeartRate: avgRestingHR || 0,
        hrvMs: avgHRV || 0,
        respiratoryRate: avgRespRate || undefined,
      };
    } catch (error) {
      console.warn('[AppleHealth] Failed to fetch heart data:', error);
      return null;
    }
  }

  /**
   * Fetch activity metrics from HealthKit
   */
  private async fetchActivityData(
    HealthKit: any,
    startDate: Date,
    endDate: Date
  ): Promise<StandardizedDailyMetric['activity'] | null> {
    try {
      // Get steps
      const steps = await HealthKit.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierStepCount',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        unit: 'count',
      });

      // Get active calories
      const activeCalories = await HealthKit.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierActiveEnergyBurned',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        unit: 'kcal',
      });

      // Get basal calories
      const basalCalories = await HealthKit.queryQuantitySamples({
        sampleType: 'HKQuantityTypeIdentifierBasalEnergyBurned',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        unit: 'kcal',
      });

      const totalSteps = this.calculateSum(steps?.samples);
      const totalActive = this.calculateSum(activeCalories?.samples);
      const totalBasal = this.calculateSum(basalCalories?.samples);

      if (totalSteps === 0 && totalActive === 0) {
        return null;
      }

      return {
        steps: Math.round(totalSteps),
        totalCalories: Math.round(totalActive + totalBasal),
      };
    } catch (error) {
      console.warn('[AppleHealth] Failed to fetch activity data:', error);
      return null;
    }
  }

  /**
   * Generate simulated data for web development/testing
   */
  private generateSimulatedData(startDate: Date, endDate: Date): StandardizedDailyMetric[] {
    const metrics: StandardizedDailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Generate realistic-looking random data
      const sleepHours = 6 + Math.random() * 3; // 6-9 hours
      const sleepSeconds = sleepHours * 3600;
      
      const bedtimeStart = new Date(currentDate);
      bedtimeStart.setHours(22 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
      
      const bedtimeEnd = new Date(bedtimeStart);
      bedtimeEnd.setHours(bedtimeEnd.getHours() + Math.floor(sleepHours) + 1);

      metrics.push({
        date: this.formatDate(currentDate),
        source: 'APPLE_HEALTH',
        sleep: {
          totalDurationSeconds: Math.round(sleepSeconds),
          deepSleepSeconds: Math.round(sleepSeconds * (0.15 + Math.random() * 0.1)), // 15-25%
          remSleepSeconds: Math.round(sleepSeconds * (0.2 + Math.random() * 0.1)), // 20-30%
          efficiencyScore: Math.round(80 + Math.random() * 15), // 80-95%
          bedtimeStart: bedtimeStart.toISOString(),
          bedtimeEnd: bedtimeEnd.toISOString(),
        },
        biometrics: {
          restingHeartRate: Math.round(55 + Math.random() * 20), // 55-75 bpm
          hrvMs: Math.round(30 + Math.random() * 50), // 30-80 ms
          respiratoryRate: Math.round(12 + Math.random() * 6), // 12-18 breaths/min
        },
        activity: {
          steps: Math.round(5000 + Math.random() * 10000), // 5000-15000 steps
          totalCalories: Math.round(1800 + Math.random() * 800), // 1800-2600 kcal
        },
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Calculate average from HealthKit samples
   */
  private calculateAverage(samples: Array<{ quantity: number }> | undefined): number {
    if (!samples || samples.length === 0) return 0;
    const sum = samples.reduce((acc, s) => acc + s.quantity, 0);
    return Math.round(sum / samples.length);
  }

  /**
   * Calculate sum from HealthKit samples
   */
  private calculateSum(samples: Array<{ quantity: number }> | undefined): number {
    if (!samples || samples.length === 0) return 0;
    return samples.reduce((acc, s) => acc + s.quantity, 0);
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if the adapter is available (iOS only or web simulation)
   */
  isAvailable(): boolean {
    // Apple Health adapter is always "available" - native mode for iOS, simulation for web
    return true;
  }

  /**
   * Check if running in native mode with real HealthKit access
   */
  isNativeMode(): boolean {
    return this.isNative;
  }
}
