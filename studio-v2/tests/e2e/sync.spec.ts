/**
 * Sync tests — Config selection drives all panels in harmony.
 *
 * Verifies that changing any config option propagates correctly to:
 *   - FileViewer (file names + content)
 *   - PipelineView (stages visible, correct badges)
 *   - DecisionMap (chips reflect current config)
 *
 * This is the core integration test suite.
 * If these pass, the app is end-to-end functional.
 */
import { test, expect } from '@playwright/test';

// ── CI system → file names ────────────────────────────────────────────────────

test.describe('CI selection → file names update', () => {
  test('GitHub Actions: shows pr-checks.yml file', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#sel-ci');

    await page.locator('#sel-ci').selectOption('github-actions');
    await page.waitForTimeout(300);

    const names = await page.locator('.file-item').allTextContents();
    expect(names.some((n) => n.includes('pr-checks'))).toBe(true);
  });

  test('GitLab CI: shows .gitlab-ci.yml file', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#cfg-advanced-toggle');

    // Show advanced settings first
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    await page.locator('#sel-ci').selectOption('gitlab-ci');
    await page.waitForTimeout(300);

    const names = await page.locator('.file-item').allTextContents();
    expect(names.some((n) => n.includes('.gitlab-ci'))).toBe(true);
  });

  test('Jenkins: shows Jenkinsfile', async ({ page }) => {
    await page.goto('/');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    await page.locator('#sel-ci').selectOption('jenkins');
    await page.waitForTimeout(300);

    const names = await page.locator('.file-item').allTextContents();
    expect(names.some((n) => n.includes('Jenkinsfile'))).toBe(true);
  });

  test('Tekton: shows tekton/pipeline files', async ({ page }) => {
    await page.goto('/');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    await page.locator('#sel-ci').selectOption('tekton');
    await page.waitForTimeout(300);

    const names = await page.locator('.file-item').allTextContents();
    expect(names.some((n) => n.includes('tekton'))).toBe(true);
  });
});

// ── Registry selection → file content ─────────────────────────────────────────

test.describe('Registry selection → file content updates', () => {
  test('GHCR: main pipeline file references ghcr.io', async ({ page }) => {
    await page.goto('/');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    await page.locator('#sel-reg').selectOption('ghcr');
    await page.waitForTimeout(300);

    // The MAIN pipeline pushes images — find the main pipeline file
    const fileItems = page.locator('.file-item');
    const count = await fileItems.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await fileItems.nth(i).textContent();
      if (text?.includes('main') || text?.includes('pipeline') || text?.includes('main-pipeline')) {
        await fileItems.nth(i).click();
        await page.waitForTimeout(200);
        const content = await page.locator('.file-pre').first().textContent();
        if (content?.includes('ghcr.io')) { found = true; break; }
      }
    }
    // Also accept if any file in the set contains ghcr.io
    if (!found) {
      for (let i = 0; i < count; i++) {
        await fileItems.nth(i).click();
        await page.waitForTimeout(150);
        const content = await page.locator('.file-pre').first().textContent();
        if (content?.includes('ghcr.io')) { found = true; break; }
      }
    }
    expect(found).toBe(true);
  });

  test('ECR: file content references AWS ECR', async ({ page }) => {
    await page.goto('/');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    await page.locator('#sel-reg').selectOption('ecr');
    await page.waitForTimeout(300);

    // Check any file references ECR
    const fileItems = page.locator('.file-item');
    const count = await fileItems.count();
    let foundEcr = false;
    for (let i = 0; i < count; i++) {
      await fileItems.nth(i).click();
      await page.waitForTimeout(100);
      const content = await page.locator('.file-pre').first().textContent();
      if (content?.includes('ecr') || content?.includes('dkr.ecr') || content?.includes('ECR')) {
        foundEcr = true;
        break;
      }
    }
    expect(foundEcr).toBe(true);
  });
});

// ── Frontend selection → Dockerfile content ───────────────────────────────────

test.describe('Frontend selection → Dockerfile content', () => {
  test('Next.js: Dockerfile contains node build step', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-pre');

    await page.locator('#sel-frontend').selectOption('nextjs');
    await page.waitForTimeout(300);

    // Ensure Dockerfile is selected
    const fileItems = page.locator('.file-item');
    const count = await fileItems.count();
    for (let i = 0; i < count; i++) {
      const text = await fileItems.nth(i).textContent();
      if (text?.includes('Dockerfile')) {
        await fileItems.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(200);

    const content = await page.locator('.file-pre').first().textContent();
    expect(content?.toLowerCase()).toContain('node');
  });

  test('Python FastAPI: Dockerfile differs from Next.js', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-pre');

    // Get Next.js Dockerfile
    await page.locator('#sel-frontend').selectOption('nextjs');
    await page.waitForTimeout(300);
    const nextContent = await page.locator('.file-pre').first().textContent();

    // Switch backend to Python FastAPI, no frontend
    await page.locator('#sel-frontend').selectOption('none');
    await page.locator('#sel-backend').selectOption('python-fastapi');
    await page.waitForTimeout(300);
    const pyContent = await page.locator('.file-pre').first().textContent();

    expect(pyContent).not.toBe(nextContent);
  });

  test('switching between any two frameworks changes file output', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.file-pre');

    await page.locator('#sel-frontend').selectOption('nextjs');
    await page.waitForTimeout(300);
    const before = await page.locator('.file-pre').first().textContent();

    await page.locator('#sel-frontend').selectOption('angular');
    await page.waitForTimeout(300);
    const after = await page.locator('.file-pre').first().textContent();

    expect(after).not.toBe(before);
  });
});

// ── Pipeline phases in sync with config ───────────────────────────────────────

test.describe('Pipeline phases — content integrity', () => {
  test('Phase 2 PR Gate always shows S1 as first stage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    const firstBadge = await page.locator('.s-box .s-badge').first().textContent();
    expect(firstBadge?.trim()).toBe('S1');
  });

  test('Phase 2 shows parallel group (multiple .s-box in a row)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    const parallelRows = page.locator('.parallel-row');
    const count = await parallelRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Phase 3 shows image build and push stages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /Main Build/ }).click();
    await page.waitForTimeout(200);

    const badges = await page.locator('.s-box .s-badge').allTextContents();
    // Main build should have numbered stages
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => b.includes('S'))).toBe(true);
  });

  test('Phase 4 Promotions shows wide stage boxes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /Promotions/ }).click();
    await page.waitForTimeout(200);

    const wideBoxes = page.locator('.s-box.wide');
    const count = await wideBoxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Phase 0 Bootstrap shows p0-cards (not s-boxes)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="tab"]');
    // Default is Phase 2; click Phase 0 explicitly
    await page.getByRole('tab', { name: /Bootstrap/ }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.p0-card').first()).toBeVisible();
    // No s-box on phase 0
    const sboxes = page.locator('.s-box');
    await expect(sboxes).toHaveCount(0);
  });

  test('Phase 1 Local shows local-cards (not s-boxes)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /Local/ }).click();
    await page.waitForTimeout(200);

    await expect(page.locator('.local-card').first()).toBeVisible();
    const sboxes = page.locator('.s-box');
    await expect(sboxes).toHaveCount(0);
  });
});

// ── SDP panel content integrity ───────────────────────────────────────────────

test.describe('SDP panel content completeness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);
    await page.locator('.s-box').first().click();
    await page.waitForSelector('.sdp');
  });

  test('SDP shows badge, title, and at least one detail row', async ({ page }) => {
    await expect(page.locator('.sdp-badge')).toBeVisible();
    await expect(page.locator('.sdp-title')).toBeVisible();
    await expect(page.locator('.sdp-row').first()).toBeVisible();
  });

  test('SDP badge is not empty', async ({ page }) => {
    const badge = await page.locator('.sdp-badge').textContent();
    expect(badge?.trim().length).toBeGreaterThan(0);
  });

  test('SDP title is not empty', async ({ page }) => {
    const title = await page.locator('.sdp-title').textContent();
    expect(title?.trim().length).toBeGreaterThan(0);
  });

  test('SDP shows concept section', async ({ page }) => {
    await expect(page.locator('.sdp-sec').first()).toBeVisible();
    const hdr = await page.locator('.sdp-sec-hdr').first().textContent();
    expect(hdr?.trim().length).toBeGreaterThan(0);
  });

  test('selecting a different stage updates SDP content', async ({ page }) => {
    const firstTitle = await page.locator('.sdp-title').textContent();

    // Click a different stage (second .s-box in the parallel row or next sequential)
    const boxes = page.locator('.s-box');
    const count = await boxes.count();
    if (count > 1) {
      await boxes.nth(1).click();
      await page.waitForTimeout(100);
      const secondTitle = await page.locator('.sdp-title').textContent();
      expect(secondTitle).not.toBe(firstTitle);
    }
  });
});

// ── Decision map → config bar sync ───────────────────────────────────────────

test.describe('Decision map reflects config state', () => {
  test('decisions with config-bar options show a chip', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dm-card');

    // At least one decision should have a chip (showing current selection)
    const chips = page.locator('.dm-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('decisions show green chip when option is selected', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dm-card');

    // Green chips = decisions with a current selection
    const greenChips = page.locator('.dm-chip.green');
    const count = await greenChips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('decision cards with options list them when expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dm-card');

    // Find a card with options (not just cfg-bar ones)
    const cards = page.locator('.dm-card');
    const cardCount = await cards.count();

    let foundOptions = false;
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = cards.nth(i);
      await card.locator('button').first().click();
      await page.waitForTimeout(150);

      const opts = card.locator('.dm-opt');
      const optCount = await opts.count();
      if (optCount > 0) {
        foundOptions = true;
        await expect(opts.first()).toBeVisible();
        // Close it
        await card.locator('button').first().click();
        break;
      }
      // Close before moving on
      await card.locator('button').first().click();
      await page.waitForTimeout(100);
    }
    expect(foundOptions).toBe(true);
  });
});

// ── Full end-to-end sync flow ─────────────────────────────────────────────────

test.describe('Full E2E sync flow', () => {
  test('changing CI → file list updates → click file → content matches CI', async ({ page }) => {
    await page.goto('/');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    // Switch to GitLab CI
    await page.locator('#sel-ci').selectOption('gitlab-ci');
    await page.waitForTimeout(400);

    // File list must show .gitlab-ci.yml
    const names = await page.locator('.file-item').allTextContents();
    expect(names.some((n) => n.includes('.gitlab-ci'))).toBe(true);

    // Click the gitlab-ci file
    const gitlabFile = page.locator('.file-item', { hasText: '.gitlab-ci' });
    await gitlabFile.first().click();
    await page.waitForTimeout(300);

    // GitLab CI content uses "stage:" job definitions (not GitHub Actions "on:" trigger)
    const content = await page.locator('.file-pre').first().textContent();
    // GitLab YAML has job definitions with "stage:" or "script:" keywords
    const hasGitlabSyntax = content?.includes('script:') || content?.includes('image:') || content?.includes('stage:');
    expect(hasGitlabSyntax).toBe(true);
  });

  test('selecting a stage in phase 2 → SDP opens → switching to phase 3 → SDP closes → new stage opens new SDP', async ({ page }) => {
    await page.goto('/');

    // Phase 2: open SDP
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);
    await page.locator('.s-box').first().click();
    await expect(page.locator('.sdp')).toBeVisible();
    const ph2Title = await page.locator('.sdp-title').textContent();

    // Switch to Phase 3: SDP must close
    await page.getByRole('tab', { name: /Main Build/ }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('.sdp')).not.toBeVisible();

    // Open a stage on Phase 3
    await page.locator('.s-box').first().click();
    await expect(page.locator('.sdp')).toBeVisible();
    const ph3Title = await page.locator('.sdp-title').textContent();

    // Content must be different (different stage)
    expect(ph3Title).not.toBe(ph2Title);
  });

  test('complete config change cycle: frontend + CI + registry → all files update', async ({ page }) => {
    await page.goto('/');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(200);

    // Get initial state
    const initialFiles = await page.locator('.file-item').allTextContents();

    // Change all three primary settings
    await page.locator('#sel-frontend').selectOption('svelte');
    await page.locator('#sel-ci').selectOption('gitlab-ci');
    await page.locator('#sel-reg').selectOption('ecr');
    await page.waitForTimeout(500);

    // File list must update
    const newFiles = await page.locator('.file-item').allTextContents();
    expect(newFiles.join('')).not.toBe(initialFiles.join(''));

    // GitLab file must be present
    expect(newFiles.some((n) => n.includes('.gitlab-ci'))).toBe(true);

    // FileViewer content must not be empty
    const content = await page.locator('.file-pre').first().textContent();
    expect(content?.trim().length).toBeGreaterThan(50);
  });

  test('invariant badges in stage boxes are real invariant IDs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /PR Gate/ }).click();
    await page.waitForTimeout(200);

    const invBadges = await page.locator('.s-box .inv').allTextContents();
    // All invariant badges must match pattern I-N
    for (const badge of invBadges) {
      expect(badge.trim()).toMatch(/^I-\d+$/);
    }
  });

  test('compliance map shows framework acronyms in uppercase', async ({ page }) => {
    await page.goto('/');

    const frameworks = await page.locator('.comp-fw').allTextContents();
    expect(frameworks.length).toBeGreaterThan(3);

    for (const fw of frameworks) {
      // Each framework label should be uppercase
      expect(fw.trim()).toBe(fw.trim().toUpperCase());
    }
  });
});

// ── URL param sync ────────────────────────────────────────────────────────────

test.describe('URL parameter sync', () => {
  // URL params are read by the Svelte store after hydration.
  // Wait for the store to apply them by polling the select value.

  test('fe param pre-selects frontend', async ({ page }) => {
    await page.goto('/?fe=remix');
    await page.waitForSelector('#sel-frontend');
    // Poll until the store applies the URL param
    await expect(page.locator('#sel-frontend')).toHaveValue('remix', { timeout: 8000 });
  });

  test('ci param pre-selects CI system', async ({ page }) => {
    await page.goto('/?ci=gitlab-ci');
    await page.waitForSelector('#sel-frontend');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#sel-ci')).toHaveValue('gitlab-ci', { timeout: 8000 });
  });

  test('reg param pre-selects registry', async ({ page }) => {
    await page.goto('/?reg=ecr');
    await page.waitForSelector('#sel-frontend');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#sel-reg')).toHaveValue('ecr', { timeout: 8000 });
  });

  test('combined params wire all selects', async ({ page }) => {
    await page.goto('/?fe=nuxt&ci=gitlab-ci&reg=acr');
    await page.waitForSelector('#sel-frontend');
    const ciVisible = await page.locator('#sel-ci').isVisible();
    if (!ciVisible) await page.locator('#cfg-advanced-toggle').click();
    await page.waitForTimeout(300);

    await expect(page.locator('#sel-frontend')).toHaveValue('nuxt', { timeout: 8000 });
    await expect(page.locator('#sel-ci')).toHaveValue('gitlab-ci', { timeout: 8000 });
    await expect(page.locator('#sel-reg')).toHaveValue('acr', { timeout: 8000 });
  });

  test('URL params flow through to file content', async ({ page }) => {
    await page.goto('/?ci=jenkins');
    await page.waitForSelector('.file-item');
    await page.waitForTimeout(600);

    const names = await page.locator('.file-item').allTextContents();
    expect(names.some((n) => n.includes('Jenkinsfile'))).toBe(true);
  });
});
