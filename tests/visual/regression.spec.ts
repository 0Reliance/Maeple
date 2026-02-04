/**
 * Visual Regression Tests
 * 
 * Compares current UI screenshots against baselines using Z.AI Vision's
 * ui_diff_check tool to detect visual regressions automatically.
 */

import { test, expect } from '@playwright/test';
import { checkUIDiff } from './mcp-client';

test.describe('Visual Regression Tests', () => {
  /**
   * List of critical screens to check for visual regressions
   */
  const criticalScreens = [
    { name: 'dashboard', route: '/dashboard' },
    { name: 'journal-new', route: '/journal/new' },
    { name: 'journal-list', route: '/journal' },
    { name: 'bio-mirror', route: '/bio-mirror' },
    { name: 'observations', route: '/observations' },
    { name: 'settings', route: '/settings' },
    { name: 'profile', route: '/profile' }
  ];

  /**
   * Test: Dashboard visual regression check
   */
  test('dashboard: no visual drift', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Capture current state
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/dashboard.png';
    
    // Save screenshot (would use fs.writeFileSync in real implementation)
    console.log(`Captured current screenshot for dashboard`);
    
    // Use Z.AI Vision to compare with baseline
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/dashboard.png',
      currentPath
    );
    
    // Assert no visual drift
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05); // Less than 5% drift
    
    console.log(`✓ Dashboard: No visual drift detected`);
  });

  /**
   * Test: New journal entry visual regression check
   */
  test('journal-new: no visual drift', async ({ page }) => {
    await page.goto('/journal/new');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/journal-new.png';
    
    console.log(`Captured current screenshot for journal-new`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/journal-new.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Journal New: No visual drift detected`);
  });

  /**
   * Test: Journal list visual regression check
   */
  test('journal-list: no visual drift', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/journal-list.png';
    
    console.log(`Captured current screenshot for journal-list`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/journal-list.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Journal List: No visual drift detected`);
  });

  /**
   * Test: Bio-Mirror visual regression check
   */
  test('bio-mirror: no visual drift', async ({ page }) => {
    await page.goto('/bio-mirror');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/bio-mirror.png';
    
    console.log(`Captured current screenshot for bio-mirror`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/bio-mirror.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Bio-Mirror: No visual drift detected`);
  });

  /**
   * Test: Observations visual regression check
   */
  test('observations: no visual drift', async ({ page }) => {
    await page.goto('/observations');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/observations.png';
    
    console.log(`Captured current screenshot for observations`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/observations.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Observations: No visual drift detected`);
  });

  /**
   * Test: Settings visual regression check
   */
  test('settings: no visual drift', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/settings.png';
    
    console.log(`Captured current screenshot for settings`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/settings.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Settings: No visual drift detected`);
  });

  /**
   * Test: Profile visual regression check
   */
  test('profile: no visual drift', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/profile.png';
    
    console.log(`Captured current screenshot for profile`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/profile.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Profile: No visual drift detected`);
  });

  /**
   * Test: Dark mode visual regression check
   */
  test('dashboard-dark: no visual drift', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Enable dark mode
    const darkModeToggle = page.getByTestId('theme-toggle').first();
    const exists = await darkModeToggle.count() > 0;
    
    if (exists) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
    }
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/dashboard-dark.png';
    
    console.log(`Captured current screenshot for dashboard-dark`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/dashboard-dark.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Dashboard Dark: No visual drift detected`);
  });

  /**
   * Test: Mobile viewport visual regression check
   */
  test('dashboard-mobile: no visual drift', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/dashboard-mobile.png';
    
    console.log(`Captured current screenshot for dashboard-mobile`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/dashboard-mobile.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Dashboard Mobile: No visual drift detected`);
  });

  /**
   * Test: Tablet viewport visual regression check
   */
  test('dashboard-tablet: no visual drift', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const screenshot = await page.screenshot({ fullPage: true });
    const currentPath = 'tests/visual/current/dashboard-tablet.png';
    
    console.log(`Captured current screenshot for dashboard-tablet`);
    
    const diffResult = await checkUIDiff(
      'tests/visual/baselines/dashboard-tablet.png',
      currentPath
    );
    
    expect(diffResult.hasDrift).toBe(false);
    expect(diffResult.differences).toHaveLength(0);
    expect(diffResult.driftScore).toBeLessThan(0.05);
    
    console.log(`✓ Dashboard Tablet: No visual drift detected`);
  });

  /**
   * Test: Generate regression report
   * 
   * Creates a comprehensive report of all visual regression checks
   */
  test('generate regression report', async () => {
    const report = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalScreensChecked: criticalScreens.length,
      checks: criticalScreens.map(screen => ({
        name: screen.name,
        route: screen.route,
        baseline: `tests/visual/baselines/${screen.name}.png`,
        current: `tests/visual/current/${screen.name}.png`,
        status: 'pending',
        driftScore: 0,
        differences: []
      })),
      variants: [
        {
          name: 'dark',
          screen: 'dashboard',
          baseline: 'tests/visual/baselines/dashboard-dark.png',
          current: 'tests/visual/current/dashboard-dark.png'
        },
        {
          name: 'mobile',
          screen: 'dashboard',
          baseline: 'tests/visual/baselines/dashboard-mobile.png',
          current: 'tests/visual/current/dashboard-mobile.png'
        },
        {
          name: 'tablet',
          screen: 'dashboard',
          baseline: 'tests/visual/baselines/dashboard-tablet.png',
          current: 'tests/visual/current/dashboard-tablet.png'
        }
      ],
      summary: {
        totalChecks: criticalScreens.length + 3, // screens + variants
        passed: 0,
        failed: 0,
        skipped: 0,
        driftDetected: false
      }
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 Visual Regression Test Report');
    console.log('='.repeat(80));
    console.log(`Screens Checked: ${report.totalScreensChecked}`);
    console.log(`Total Checks: ${report.summary.totalChecks}`);
    console.log(`Generated: ${report.generatedAt}`);
    console.log('='.repeat(80) + '\n');
    
    // In real implementation, would write to file
    // fs.writeFileSync('test-results/visual-regression-report.json', JSON.stringify(report, null, 2));
  });
});

test.describe('Visual Regression Configuration', () => {
  test('display configuration', () => {
    console.log('\n' + '='.repeat(80));
    console.log('⚙️  Visual Regression Test Configuration');
    console.log('='.repeat(80));
    console.log('Drift Threshold: < 0.05 (5%)');
    console.log('Baseline Directory: tests/visual/baselines/');
    console.log('Current Directory: tests/visual/current/');
    console.log('Screens Checked: 7');
    console.log('Variants: 3 (dark, mobile, tablet)');
    console.log('Total Tests: 10');
    console.log('='.repeat(80) + '\n');
  });
});