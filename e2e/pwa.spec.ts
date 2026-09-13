import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const minimalFixture = path.resolve('fixtures/programs/01-minimal.json');

test('manifest, maskable icons, and prescribed dark-first palette are served', async ({ page }) => {
  await page.goto('');
  const manifest = await page.evaluate(async () => {
    const response = await fetch('/fitness/manifest.webmanifest');
    return response.json() as Promise<{
      name: string;
      short_name: string;
      start_url: string;
      scope: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; purpose: string }>;
    }>;
  });
  expect(manifest).toMatchObject({
    name: 'Fieldwork Training Log',
    short_name: 'Fieldwork',
    start_url: '/fitness/',
    scope: '/fitness/',
    display: 'standalone',
    theme_color: '#14181F',
    background_color: '#14181F',
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', purpose: expect.stringContaining('maskable') }),
      expect.objectContaining({ sizes: '512x512', purpose: expect.stringContaining('maskable') }),
    ]),
  );

  await page.goto('#/settings');
  await page.selectOption('#theme', 'dark');
  await page.getByRole('button', { name: 'Save settings' }).click();
  expect(
    await page.locator('html').evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(20, 24, 31)');
  expect(await page.locator('html').evaluate((node) => getComputedStyle(node).color)).toBe(
    'rgb(232, 236, 241)',
  );
  await page.selectOption('#theme', 'light');
  await page.getByRole('button', { name: 'Save settings' }).click();
  expect(
    await page.locator('html').evaluate((node) => getComputedStyle(node).backgroundColor),
  ).toBe('rgb(247, 249, 252)');
});

test('one online load supports validation, logging, history, authoring, and export offline', async ({
  context,
  page,
}) => {
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Fieldwork' })).toBeVisible();

  await page.goto('#/programs');
  await page.locator('#program-json').fill(await readFile(minimalFixture, 'utf8'));
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('Ready to import')).toBeVisible();
  await page.getByRole('button', { name: 'Import program' }).click();
  await page.getByRole('button', { name: 'Activate' }).click();

  await page.goto('#/');
  await page.getByRole('button', { name: 'Start session' }).click();
  for (let index = 0; index < 6; index += 1) {
    const weight = page.locator('#actual-weight');
    if ((await weight.inputValue()) === '') await weight.fill('40');
    await page.getByRole('button', { name: 'Log set' }).click();
  }
  await page.getByRole('button', { name: 'Complete session' }).click();

  await page.goto('#/history');
  await expect(page.getByRole('heading', { name: 'Back Squat' })).toBeVisible();
  await page.goto('#/author');
  await expect(page.getByLabel('Full personalized authoring prompt')).toContainText(
    'barbell-back-squat',
  );
  await page.goto('#/settings');
  await expect(page.getByText('Offline shell ready')).toBeVisible();

  await page.goto('#/data');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^fitness-export-/u);

  const uncachedRequest = await page.evaluate(async () => {
    try {
      await fetch('/fitness/not-a-build-asset.txt');
      return 'unexpected response';
    } catch {
      return 'not intercepted';
    }
  });
  expect(uncachedRequest).toBe('not intercepted');
});

test('manual install guidance has no dead install button when no browser event fired', async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.addEventListener(
      'beforeinstallprompt',
      (event) => event.stopImmediatePropagation(),
      { capture: true },
    );
  });
  await page.goto('#/settings');
  await expect(page.getByText(/tap Share, then “Add to Home Screen.”/u)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Install Fieldwork' })).toHaveCount(0);
});
