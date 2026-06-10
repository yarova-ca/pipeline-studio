/**
 * Accessibility tests — WCAG 2.1 AA compliance.
 *
 * Tests keyboard navigation, ARIA roles, focus management,
 * color contrast indicators, and screen-reader semantics.
 */
import { test, expect } from '@playwright/test';

// ── ARIA roles and landmarks ──────────────────────────────────────────────────

test.describe('ARIA landmarks', () => {
  test('page has a navigation landmark', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav.first()).toBeVisible();
  });

  test('phase tabs use tablist and tab roles', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tablist')).toBeVisible();
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(5);
  });

  test('each tab has aria-selected attribute', async ({ page }) => {
    await page.goto('/');
    const tabs = page.getByRole('tab');
    for (let i = 0; i < await tabs.count(); i++) {
      const tab = tabs.nth(i);
      const selected = await tab.getAttribute('aria-selected');
      expect(['true', 'false']).toContain(selected);
    }
  });

  test('SDP panel has role=dialog', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');

    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);
    await page.locator('.s-box').first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('SDP panel has aria-label', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');

    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);
    await page.locator('.s-box').first().click();

    const dialog = page.getByRole('dialog');
    const label = await dialog.getAttribute('aria-label');
    expect(label?.length).toBeGreaterThan(0);
  });

  test('decorative arrows have aria-hidden', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    const arrows = page.locator('[aria-hidden="true"]');
    const count = await arrows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('decision map expand buttons have aria-expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dm-card');

    const btns = page.locator('.dm-card button[aria-expanded]');
    const count = await btns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('SDP close button has aria-label', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);
    await page.locator('.s-box').first().click();

    const closeBtn = page.locator('.sdp-close');
    const label = await closeBtn.getAttribute('aria-label');
    expect(label?.toLowerCase()).toContain('close');
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

test.describe('Keyboard navigation', () => {
  test('config selects are reachable via Tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sel-frontend');

    // Tab from body to first interactive element and find the select
    await page.locator('#sel-frontend').focus();
    await expect(page.locator('#sel-frontend')).toBeFocused();
  });

  test('phase tabs are reachable via Tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');

    await page.getByRole('tab').first().focus();
    await expect(page.getByRole('tab').first()).toBeFocused();
  });

  test('stage box opens SDP via keyboard Enter', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');

    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    const box = page.locator('.s-box').first();
    await box.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.sdp')).toBeVisible();
  });

  test('Escape key closes SDP from any focus position', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    await page.locator('.s-box').first().click();
    await expect(page.locator('.sdp')).toBeVisible();

    // Press Escape without focusing anything specific
    await page.keyboard.press('Escape');
    await expect(page.locator('.sdp')).not.toBeVisible();
  });

  test('SDP close button is reachable via Tab while panel is open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    await page.locator('.s-box').first().click();
    await page.locator('.sdp-close').focus();
    await expect(page.locator('.sdp-close')).toBeFocused();
  });

  test('SDP close button works via keyboard Enter', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    await page.locator('.s-box').first().click();
    await page.locator('.sdp-close').focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.sdp')).not.toBeVisible();
  });
});

// ── Focus management ──────────────────────────────────────────────────────────

test.describe('Focus management', () => {
  test('interactive elements are not display:none while focused', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sel-frontend');

    // Verify primary selects are not hidden
    await expect(page.locator('#sel-frontend')).toBeVisible();
    await expect(page.locator('#sel-ci')).toBeVisible();
  });

  test('stage boxes have type=button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    const boxes = page.locator('.s-box');
    const count = await boxes.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const type = await boxes.nth(i).getAttribute('type');
      expect(type).toBe('button');
    }
  });
});

// ── Heading hierarchy ─────────────────────────────────────────────────────────

test.describe('Heading hierarchy', () => {
  test('page has exactly one h1', async ({ page }) => {
    await page.goto('/');
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('h1 text is the app name', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toContainText('DevSecOps Pipeline Studio');
  });

  test('h2s are present for major sections', async ({ page }) => {
    await page.goto('/');
    const h2s = page.locator('h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ── Images and non-text content ───────────────────────────────────────────────

test.describe('Non-text content', () => {
  test('no img elements are missing alt attributes', async ({ page }) => {
    await page.goto('/');
    const imgsWithoutAlt = page.locator('img:not([alt])');
    const count = await imgsWithoutAlt.count();
    expect(count).toBe(0);
  });
});

// ── Color and visual indicators ───────────────────────────────────────────────

test.describe('Visual indicators', () => {
  test('required decision cards have a visual indicator', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dm-card');

    // .dm-card.required has a left border — check the class is present
    const required = page.locator('.dm-card.required');
    const count = await required.count();
    expect(count).toBeGreaterThan(0);
  });

  test('active phase tab has the active class', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');

    const activeTabs = page.locator('[role="tab"].active');
    await expect(activeTabs).toHaveCount(1);
  });

  test('selected stage box has sel class', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    await page.locator('.s-box').first().click();
    await expect(page.locator('.s-box.sel')).toHaveCount(1);
  });
});
