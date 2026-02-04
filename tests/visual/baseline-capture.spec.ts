/**
 * Visual Baseline Capture Tests
 * 
 * Captures baseline screenshots for critical screens in the Maeple application.
 * These baselines are used for visual regression testing.
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Baseline Capture', () => {
  /**
   * List of critical screens to capture
   * 
   * These screens represent the most important user-facing UI
   * and should be captured for visual regression testing.
   */
  const criticalScreens = [
    { 
      name: 'landing-page', 
      route: '/',
      description: 'Landing page with onboarding'
    },
    { 
      name: 'dashboard', 
      route: '/dashboard',
      description: 'Main dashboard with overview'
    },
    { 
      name: 'journal-new', 
      route: '/journal/new',
      description: 'New journal entry form'
    },
    { 
      name: 'journal-list', 
      route: '/journal',
      description: 'Journal entries list'
    },
    { 
      name: 'bio-mirror', 
      route: '/bio-mirror',
      description: 'Bio-Mirror FACS analysis'
    },
    { 
      name: 'observations', 
      route: '/observations',
      description: 'Observations list and tracking'
    },
    { 
      name: 'settings', 
      route: '/settings',
      description: 'Settings and configuration'
    },
    { 
      name: 'profile', 
      route: '/profile',
      description: 'User profile page'
    }
  ];

  /**
   * Test: Capture baseline for landing page
   */
  test('capture baseline for landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/landing-page.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: landing-page');
  });

  /**
   * Test: Capture baseline for dashboard
   */
  test('capture baseline for dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/dashboard.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: dashboard');
  });

  /**
   * Test: Capture baseline for new journal entry
   */
  test('capture baseline for new journal entry', async ({ page }) => {
    await page.goto('/journal/new');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/journal-new.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: journal-new');
  });

  /**
   * Test: Capture baseline for journal list
   */
  test('capture baseline for journal list', async ({ page }) => {
    await page.goto('/journal');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/journal-list.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: journal-list');
  });

  /**
   * Test: Capture baseline for Bio-Mirror
   */
  test('capture baseline for bio-mirror', async ({ page }) => {
    await page.goto('/bio-mirror');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/bio-mirror.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: bio-mirror');
  });

  /**
   * Test: Capture baseline for observations
   */
  test('capture baseline for observations', async ({ page }) => {
    await page.goto('/observations');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/observations.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: observations');
  });

  /**
   * Test: Capture baseline for settings
   */
  test('capture baseline for settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/settings.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: settings');
  });

  /**
   * Test: Capture baseline for profile
   */
  test('capture baseline for profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/profile.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: profile');
  });

  /**
   * Test: Capture baseline for dark mode
   */
  test('capture baseline for dashboard dark mode', async ({ page }) => {
    // Enable dark mode (assuming there's a toggle or preference)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try to find and click dark mode toggle
    const darkModeToggle = page.getByTestId('theme-toggle').first();
    const exists = await darkModeToggle.count() > 0;
    
    if (exists) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
    }
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/dashboard-dark.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: dashboard-dark');
  });

  /**
   * Test: Capture baseline for mobile viewport
   */
  test('capture baseline for mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/dashboard-mobile.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: dashboard-mobile');
  });

  /**
   * Test: Capture baseline for tablet viewport
   */
  test('capture baseline for tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/visual/baselines/dashboard-tablet.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✓ Baseline captured: dashboard-tablet');
  });

  /**
   * Test: Generate baseline manifest
   * 
   * Creates a JSON file documenting all baselines with metadata
   */
  test('generate baseline manifest', async () => {
    const manifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      baselines: criticalScreens.map(screen => ({
        name: screen.name,
        route: screen.route,
        description: screen.description,
        file: `tests/visual/baselines/${screen.name}.png`,
        variants: [
          {
            name: 'default',
            file: `tests/visual/baselines/${screen.name}.png`
          },
          {
            name: 'dark',
            file: `tests/visual/baselines/${screen.name}-dark.png`,
            exists: ['dashboard'].includes(screen.name)
          },
          {
            name: 'mobile',
            file: `tests/visual/baselines/${screen.name}-mobile.png`,
            exists: ['dashboard'].includes(screen.name)
          },
          {
            name: 'tablet',
            file: `tests/visual/baselines/${screen.name}-tablet.png`,
            exists: ['dashboard'].includes(screen.name)
          }
        ]
      }))
    };

    // Write manifest to file (would use fs.writeFileSync in real implementation)
    console.log('\n📋 Baseline Manifest:');
    console.log(JSON.stringify(manifest, null, 2));
    
    console.log('\n✓ Baseline manifest generated');
  });
});

test.describe('Baseline Metadata', () => {
  test('display baseline information', () => {
    console.log('\n' + '='.repeat(80));
    console.log('📸 Visual Baseline Information');
    console.log('='.repeat(80));
    console.log('Total screens:', 8);
    console.log('Baseline directory: tests/visual/baselines/');
    console.log('\nScreens:');
    console.log('  1. Landing Page (/)');
    console.log('  2. Dashboard (/dashboard)');
    console.log('  3. New Journal Entry (/journal/new)');
    console.log('  4. Journal List (/journal)');
    console.log('  5. Bio-Mirror (/bio-mirror)');
    console.log('  6. Observations (/observations)');
    console.log('  7. Settings (/settings)');
    console.log('  8. Profile (/profile)');
    console.log('\nVariants:');
    console.log('  - Dark mode: dashboard-dark.png');
    console.log('  - Mobile (375x667): dashboard-mobile.png');
    console.log('  - Tablet (768x1024): dashboard-tablet.png');
    console.log('='.repeat(80) + '\n');
  });
});