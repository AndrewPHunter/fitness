import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const minimalFixture = path.resolve('fixtures/programs/01-minimal.json');
const invalidStructural = path.resolve('fixtures/programs/05-invalid-structural.json');
const invalidSemantic = path.resolve('fixtures/programs/06-invalid-semantic.json');

async function errorOutput(page: import('@playwright/test').Page) {
  return page.locator('.error-item').allTextContents();
}

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
  await page.goto('#/programs');
});

test('pasted and uploaded invalid fixtures produce identical complete rejection output', async ({
  page,
}) => {
  const pasteField = page.locator('#program-json');
  const before = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));

  for (const [fixture, expectedCount] of [
    [invalidStructural, 8],
    [invalidSemantic, 7],
  ] as const) {
    const source = await readFile(fixture, 'utf8');
    await pasteField.fill(source);
    await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
    await expect(page.locator('.error-item')).toHaveCount(expectedCount);
    const pastedErrors = await errorOutput(page);
    await expect(pasteField).toHaveValue(source);
    expect(await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'))).toBe(
      before,
    );

    await page.locator('#program-file').setInputFiles(fixture);
    await expect(page.locator('.error-item')).toHaveCount(expectedCount);
    expect(await errorOutput(page)).toEqual(pastedErrors);
    expect(await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'))).toBe(
      before,
    );
  }
});

test('empty text stops clearly before JSON parsing', async ({ page }) => {
  await page.locator('#program-json').fill(' \n\t ');
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('EMPTY_INPUT · structural')).toBeVisible();
  await expect(page.getByText(/Paste program JSON into the field/u)).toBeVisible();
  await expect(page.getByText(/PARSE_ERROR/u)).not.toBeVisible();
});

test('pasted and uploaded valid JSON produce the same preview and exercise ID report', async ({
  page,
}) => {
  const source = await readFile(minimalFixture, 'utf8');
  const preview = page.locator('.surface[aria-live="polite"]');
  await page.locator('#program-json').fill(` \n${source}\n `);
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('Ready to import')).toBeVisible();
  const pastedPreview = await preview.textContent();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.locator('#program-file').setInputFiles(minimalFixture);
  await expect(page.getByText('Ready to import')).toBeVisible();
  expect(await preview.textContent()).toBe(pastedPreview);
});

test('code fences require an explicit visible edit before validation', async ({ page }) => {
  const source = (await readFile(minimalFixture, 'utf8')).trim();
  const fenced = `\`\`\`json\n${source}\n\`\`\``;
  const pasteField = page.locator('#program-json');
  const before = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));

  await pasteField.fill(fenced);
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('CODE_FENCE · structural')).toBeVisible();
  await expect(page.getByText(/Markdown code fences are not valid JSON/u)).toBeVisible();
  await expect(pasteField).toHaveValue(fenced);
  await expect(page.getByText('Ready to import')).not.toBeVisible();

  await page.getByRole('button', { name: 'Remove code fences' }).click();
  await expect(pasteField).toHaveValue(source);
  await expect(page.getByText(/Review it, then validate again/u)).toBeVisible();
  await expect(page.getByText('Ready to import')).not.toBeVisible();
  expect(await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'))).toBe(
    before,
  );

  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('Ready to import')).toBeVisible();
});

test('authoring handoff imports by paste without a download or file picker', async ({ page }) => {
  const source = await readFile(minimalFixture, 'utf8');
  await page.goto('#/author');
  await page.getByRole('button', { name: 'Copy personalized prompt' }).click();
  await expect(page.getByText('Copied the complete personalized prompt.')).toBeVisible();
  await page.getByRole('link', { name: 'Paste it directly into Programs' }).click();
  await expect(page).toHaveURL(/#\/programs\?paste=1$/u);
  await expect(page.locator('#program-json')).toBeFocused();

  const pasteBox = await page.locator('.paste-import-primary').boundingBox();
  const fileBox = await page.locator('.file-import-secondary').boundingBox();
  expect(pasteBox).not.toBeNull();
  expect(fileBox).not.toBeNull();
  expect(pasteBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(
    fileBox?.y ?? Number.NEGATIVE_INFINITY,
  );
  expect(
    await page.evaluate(() => globalThis.document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(await page.evaluate(() => globalThis.innerWidth));

  await page.locator('#program-json').fill(source);
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('Ready to import')).toBeVisible();
  await page.getByRole('button', { name: 'Import program' }).click();
  await expect(page.getByRole('heading', { name: 'Minimal Full Body' })).toBeVisible();
  const stored = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  expect(stored).toContain('minimal-full-body');
});
