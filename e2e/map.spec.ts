import { expect, test } from '@playwright/test';

test('warning gate is the first screen', async ({ page }) => {
  await page.goto('/');
  const gate = page.getByRole('dialog', { name: 'Warning' });
  await expect(gate).toBeVisible();
  await expect(page.locator('[data-warning="deceased"]')).toContainText(/died/);
  await expect(page.locator('body')).not.toContainText(/no deceased persons are named/i);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(gate).toBeHidden();
  await expect(page.locator('#app')).toHaveAttribute('data-warning-open', '0');
});

test.describe('published site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('#app')).toHaveAttribute('data-ready', 'true');
  });

  test('lists nations, the timeline, and people with life status', async ({ page }) => {
    await expect(page.locator('[data-page="nations"] [data-entry="g1"]')).toBeVisible();
    await expect(page.locator('[data-entry="g19"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Timeline' }).click();
    await expect(page.locator('[data-year="2019"]')).toBeVisible();
    await page.locator('[data-year="2019"] button').click();
    await expect(page.locator('[data-page="timeline-entry"]')).toContainText(/Budj Bim/);
    await page.getByRole('button', { name: 'People' }).click();
    await expect(page.locator('[data-entry="pp1"]')).toHaveAttribute('data-life', 'living');
    await expect(page.locator('[data-entry="pp2"]')).toHaveAttribute('data-life', 'deceased');
    await page.locator('[data-entry="pp5"]').click();
    await expect(page.locator('[data-deceased-warning="person"]')).toBeVisible();
  });

  test('shows the Emily Gap photography note and no Kata Tjuta story', async ({ page }) => {
    await page.getByRole('button', { name: 'Places' }).click();
    await page.getByRole('button', { name: /Anthwerrke/ }).click();
    await expect(page.locator('[data-note="no-photography"]')).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.locator('[data-entry="p3"]').click();
    await expect(page.locator('[data-page="place"]')).toHaveAttribute('data-stories', 'none');
    await expect(page.locator('[data-links="stories"]')).toHaveCount(0);
  });

  test('keeps Djang\'kawu designs and link-only retellings off the page', async ({ page }) => {
    await page.getByRole('button', { name: 'Stories' }).click();
    await page.getByRole('button', { name: /Djang/ }).click();
    await expect(page.locator('[data-note="no-designs"]')).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('button', { name: /Kuniya/ }).click();
    const kuniya = page.locator('[data-page="story"]');
    await expect(kuniya).toHaveAttribute('data-publish', 'link-only');
    await expect(kuniya.locator('[data-summary]')).toHaveCount(0);
    await expect(kuniya).not.toContainText(/woma python/i);
    await expect(kuniya).not.toContainText(/poisonous brown snake/i);
    await expect(kuniya.locator('a').first()).toBeVisible();
    await page.getByRole('button', { name: 'Stories' }).click();
    await page.getByRole('button', { name: /Seven Sisters/ }).click();
    await expect(page.locator('[data-page="story"]')).not.toContainText(/pursuit and escape/i);
  });

  test('draws the single sourced marker', async ({ page }) => {
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('#app')).toHaveAttribute('data-points', '1');
    await expect(page.locator('.pin')).toHaveCount(1);
    await page.locator('.pin').click();
    await expect(page.locator('[data-page="place"]')).toBeVisible();
  });

  test('searches, filters, compares, and opens the glossary', async ({ page }) => {
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Uluru');
    await page.getByRole('button', { name: /Uluru/ }).first().click();
    await expect(page.locator('[data-entry="p1"], [data-entry="g1"]')).toBeVisible();

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('button', { name: 'Historic' }).click();
    await page.getByRole('button', { name: 'Nations', exact: true }).click();
    await expect(page.locator('[data-empty="nations"]')).toBeVisible();
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('button', { name: 'Present' }).click();

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('button', { name: 'Compare nations' }).click();
    await page.locator('[data-page="compare"] [data-entry="g1"]').click();
    await page.locator('[data-page="compare"] [data-entry="g2"]').click();
    await expect(page.locator('[data-compare="g1"]')).toBeVisible();
    await expect(page.locator('[data-compare="g2"]')).toContainText(/Budj Bim/);

    await page.getByRole('button', { name: 'Glossary' }).click();
    await page.getByRole('button', { name: 'Tjukurpa' }).click();
    await expect(page.locator('[data-page="knowledge-entry"]')).toContainText(/Tjukurpa/);
  });

  test('uses a bottom sheet on a phone and a side sheet on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.event-sheet')).toHaveAttribute('data-placement', 'bottom');
    const phone = await page.locator('.event-sheet').boundingBox();
    expect(phone).toBeTruthy();
    expect(phone!.x).toBeGreaterThanOrEqual(0);
    expect(phone!.width).toBeLessThanOrEqual(390);
    expect(phone!.y + phone!.height).toBeLessThanOrEqual(844);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.event-sheet')).toHaveAttribute('data-placement', 'side');
  });

  test('icon controls have labels and no visible text', async ({ page }) => {
    const icons = page.locator('button.icon-button');
    const count = await icons.count();
    expect(count).toBeGreaterThan(8);
    for (let index = 0; index < count; index += 1) {
      const button = icons.nth(index);
      expect((await button.getAttribute('aria-label'))?.length).toBeGreaterThan(0);
      expect((await button.innerText()).trim()).toBe('');
    }
  });
});
