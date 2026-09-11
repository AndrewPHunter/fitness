import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const minimalFixture = path.resolve('fixtures/programs/01-minimal.json');

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
});

test('authoring kit copies personalized fixture content and downloads uploadable files', async ({
  page,
}) => {
  await page.goto('#/programs');
  await expect(page.getByRole('link', { name: 'Open authoring kit' })).toBeVisible();
  await page.locator('#program-file').setInputFiles(minimalFixture);
  await page.getByRole('button', { name: 'Import program' }).click();

  await page.getByRole('link', { name: 'Author', exact: true }).click();
  await expect(page).toHaveURL(/#\/author$/u);
  const primaryBox = await page
    .getByRole('button', { name: 'Copy personalized prompt' })
    .boundingBox();
  expect(primaryBox).not.toBeNull();
  expect((primaryBox?.y ?? 9999) + (primaryBox?.height ?? 0)).toBeLessThanOrEqual(
    await page.evaluate(() => globalThis.innerHeight),
  );
  await expect(page.getByLabel('Exercise IDs that will be injected')).toContainText(
    'barbell-back-squat',
  );
  await page.getByRole('button', { name: 'Copy personalized prompt' }).click();
  await expect(page.getByText('Copied the complete personalized prompt.')).toBeVisible();
  const fallback = await page.getByLabel('Full personalized authoring prompt').inputValue();
  expect(fallback).toContain('# Program Authoring Prompt Pack');
  expect(fallback).toContain(
    "## Existing exercise IDs from this user's tracker — reuse these first",
  );
  expect(fallback).toContain('- `barbell-back-squat`');
  expect(fallback).toContain('## Self-check before output');

  const schemaDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download schema' }).click();
  const schemaDownload = await schemaDownloadPromise;
  const schemaPath = test.info().outputPath('program.schema.json');
  await schemaDownload.saveAs(schemaPath);
  expect(await readFile(schemaPath, 'utf8')).toBe(
    await readFile(path.resolve('fixtures/schema/program.schema.json'), 'utf8'),
  );

  const exampleDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download worked example' }).click();
  const exampleDownload = await exampleDownloadPromise;
  const examplePath = test.info().outputPath('fitness-worked-example.json');
  await exampleDownload.saveAs(examplePath);
  expect(await readFile(examplePath, 'utf8')).toBe(
    await readFile(path.resolve('fixtures/programs/02-every-other-day-rotation.json'), 'utf8'),
  );

  await page.getByRole('link', { name: 'I have JSON — paste it into Programs' }).click();
  await page.locator('#program-file').setInputFiles(examplePath);
  await expect(page.getByText('Ready to import')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Every Other Day Strength/u })).toBeVisible();
});

test('logging values dominate and state labels remain explicit without colour', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('#/programs');
  await page.locator('#program-file').setInputFiles(minimalFixture);
  await page.getByRole('button', { name: 'Import program' }).click();
  await page.getByRole('button', { name: 'Activate' }).click();
  await page.goto('#/');
  await page.getByRole('button', { name: 'Start session' }).click();

  const inputSize = await page
    .locator('#actual-weight')
    .evaluate((element) => Number.parseFloat(globalThis.getComputedStyle(element).fontSize));
  const headingSize = await page
    .locator('h1')
    .evaluate((element) => Number.parseFloat(globalThis.getComputedStyle(element).fontSize));
  expect(inputSize).toBeGreaterThan(headingSize);
  await expect(page.locator('.unconfirmed-marker')).toContainText('Not saved');
  await expect(page.locator('#actual-weight')).toHaveCSS('border-top-style', 'solid');

  await page.locator('#actual-weight').fill('50');
  await page.getByRole('button', { name: 'Log set' }).click();
  await expect(page.locator('.saved-marker')).toContainText('Saved');
  await expect(page.locator('.unconfirmed-marker')).toContainText('Not saved');

  await page.locator('#actual-weight').fill('0');
  await page.getByRole('button', { name: 'Log set' }).click();
  await expect(page.getByRole('alert')).toContainText('Set not saved');
  expect(
    await page.evaluate(() => globalThis.document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => globalThis.innerWidth));
});
