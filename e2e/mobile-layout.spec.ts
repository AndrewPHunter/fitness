import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
});

test('the installed shell keeps content outside simulated iOS safe areas', async ({ page }) => {
  await page.locator('html').evaluate((element) => {
    const root = element as HTMLElement;
    root.style.setProperty('--safe-area-top', '47px');
    root.style.setProperty('--safe-area-right', '0px');
    root.style.setProperty('--safe-area-bottom', '34px');
    root.style.setProperty('--safe-area-left', '0px');
  });

  const header = await page.locator('.app-header').boundingBox();
  const wordmark = await page.getByRole('link', { name: 'Fieldwork' }).boundingBox();
  const localOnly = await page.getByText('Local only').boundingBox();
  const navigation = await page.getByRole('navigation', { name: 'Main navigation' }).boundingBox();

  expect(header?.height).toBeGreaterThanOrEqual(107);
  expect(wordmark?.y).toBeGreaterThanOrEqual(47);
  expect(wordmark?.height).toBeGreaterThanOrEqual(44);
  expect(localOnly?.y).toBeGreaterThanOrEqual(47);
  expect(navigation?.height).toBeGreaterThanOrEqual(90);
  expect((navigation?.y ?? 0) + (navigation?.height ?? 0)).toBe(844);
});

test('the mobile shell and every primary route reflow without horizontal clipping', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });

  for (const route of ['#/', '#/author', '#/programs', '#/history', '#/data', '#/settings']) {
    await page.goto(route);
    await expect(page.locator('.route-loading')).toHaveCount(0);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    expect(
      await page.evaluate(() => globalThis.document.documentElement.scrollWidth),
      route,
    ).toBeLessThanOrEqual(320);
  }
});
