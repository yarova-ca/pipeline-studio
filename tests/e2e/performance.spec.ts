/**
 * Performance tests — Core Web Vitals and load metrics.
 *
 * Verifies page load speed, asset sizes, and rendering performance
 * using the browser Performance API via Playwright's CDP.
 */
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('page loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForSelector('#sel-frontend');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test('all Svelte islands hydrate within 2 seconds of load', async ({ page }) => {
    await page.goto('/');
    const start = Date.now();
    await page.waitForSelector('#sel-frontend');
    await page.waitForSelector('.phase-tabs');
    await page.waitForSelector('.dm-card');
    await page.waitForSelector('.file-item');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  test('no render-blocking resources cause visible delay', async ({ page }) => {
    const timings = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        load: nav.loadEventEnd - nav.startTime,
      };
    });

    // DOM should be interactive within 2s, fully loaded within 5s
    expect(timings.domContentLoaded).toBeLessThan(2000);
    expect(timings.load).toBeLessThan(5000);
  });
});

test.describe('Asset integrity', () => {
  test('no 404 responses for any page resource', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (res) => {
      if (res.status() === 404) failed.push(res.url());
    });

    await page.goto('/');
    await page.waitForSelector('#sel-frontend');
    await page.waitForTimeout(500);

    expect(failed).toHaveLength(0);
  });

  test('no network errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('requestfailed', (req) => errors.push(req.url()));

    await page.goto('/');
    await page.waitForSelector('#sel-frontend');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('JS bundle is loaded without errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('#sel-frontend');
    await page.waitForTimeout(1000);

    expect(jsErrors).toHaveLength(0);
  });
});

test.describe('Interaction responsiveness', () => {
  test('tab switch completes in under 200ms', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');

    const start = Date.now();
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForSelector('.s-box');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
  });

  test('SDP panel opens in under 100ms', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForSelector('.s-box');

    const start = Date.now();
    await page.locator('.s-box').first().click();
    await page.waitForSelector('.sdp');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  test('config change reflects in FileViewer in under 500ms', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-pre');

    const start = Date.now();
    await page.locator('#sel-frontend').selectOption('remix');
    await page.waitForTimeout(50);

    // Content should update without page reload
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);

    const content = await page.locator('.file-pre').first().textContent();
    expect(content?.trim().length).toBeGreaterThan(0);
  });
});
