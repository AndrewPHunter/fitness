import { expect, test } from '@playwright/test';
import path from 'node:path';

const rotationFixture = path.resolve('fixtures/programs/02-every-other-day-rotation.json');
const minimalFixture = path.resolve('fixtures/programs/01-minimal.json');
const invalidStructural = path.resolve('fixtures/programs/05-invalid-structural.json');
const invalidSemantic = path.resolve('fixtures/programs/06-invalid-semantic.json');

async function uploadAndActivate(page: import('@playwright/test').Page, fixture: string) {
  await page.goto('#/programs');
  await page.locator('#program-file').setInputFiles(fixture);
  await expect(page.getByText('Ready to import')).toBeVisible();
  await page.getByRole('button', { name: 'Import program' }).click();
  await page.getByRole('button', { name: 'Activate' }).click();
}

async function logEverySet(
  page: import('@playwright/test').Page,
  weight: string,
  setCount: number,
) {
  await page.goto('#/');
  await page.getByRole('button', { name: 'Start session' }).click();
  for (let index = 0; index < setCount; index += 1) {
    await expect(page.getByRole('button', { name: 'Log set' })).toBeVisible();
    const input = page.locator('#actual-weight');
    if ((await input.inputValue()) === '') await input.fill(weight);
    await page.getByRole('button', { name: 'Log set' }).click();
  }
  await page.getByRole('button', { name: 'Complete session' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
});

test('reference program uploads and a full session survives reload', async ({ page }) => {
  await uploadAndActivate(page, rotationFixture);
  await logEverySet(page, '25', 12);
  const before = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  expect(before).not.toBeNull();
  const beforeData: unknown = before ? JSON.parse(before) : null;
  expect(beforeData).toMatchObject({
    sessionLogs: [{ completedAt: expect.any(String), setLogs: expect.any(Array) }],
  });
  await page.reload();
  const after = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  expect(after).toBe(before);
  await page.goto('#/history');
  await expect(page.getByRole('heading', { name: 'Back Squat' })).toBeVisible();
});

test('both invalid fixtures report every error without writing storage', async ({ page }) => {
  await page.goto('#/programs');
  const before = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  await page.locator('#program-file').setInputFiles(invalidStructural);
  await expect(page.getByRole('listitem')).toHaveCount(8);
  expect(await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'))).toBe(
    before,
  );
  await page.locator('#program-file').setInputFiles(invalidSemantic);
  await expect(page.getByRole('listitem')).toHaveCount(7);
  expect(await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'))).toBe(
    before,
  );
});

test('JSON download, clear, and explicit merge restore are deeply identical', async ({ page }) => {
  await uploadAndActivate(page, minimalFixture);
  await logEverySet(page, '42.5', 6);
  const originalRaw = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  expect(originalRaw).not.toBeNull();
  const original: unknown = originalRaw ? JSON.parse(originalRaw) : null;

  await page.goto('#/data');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const download = await downloadPromise;
  const backupPath = test.info().outputPath('backup.json');
  await download.saveAs(backupPath);
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
  await page.goto('#/data');
  await page.locator('#backup-file').setInputFiles(backupPath);
  await expect(page.getByText(/Validated backup from/u)).toBeVisible();
  await page.getByRole('button', { name: 'Replace current data' }).click();
  await page.getByRole('button', { name: 'Replace all local data' }).click();
  const restoredRaw = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  const restored: unknown = restoredRaw ? JSON.parse(restoredRaw) : null;
  expect(restored).toEqual(original);
});
