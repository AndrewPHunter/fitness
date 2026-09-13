import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rangeAndPerSetFixture = path.resolve('fixtures/programs/07-ranges-and-per-set.json');

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
});

test('the authoring format imports and every set shows its governing prescription', async ({
  page,
}) => {
  await page.goto('#/author');
  const prompt = page.getByLabel('Full personalized authoring prompt');
  await expect(prompt).toContainText('## Rep ranges and per-set prescription');
  await expect(prompt).toContainText('"sets": [');
  await expect(prompt).toContainText('"repsMax": 8');
  await page.getByRole('button', { name: 'Copy personalized prompt' }).click();
  await expect(page.getByText('Copied the complete personalized prompt.')).toBeVisible();

  const source = await readFile(rangeAndPerSetFixture, 'utf8');
  await page.goto('#/programs?paste=1');
  await page.locator('#program-json').fill(source);
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(page.getByText('Ready to import')).toBeVisible();
  await page.getByRole('button', { name: 'Import program' }).click();
  await page.getByRole('button', { name: 'Activate' }).click();

  await page.goto('#/programs/range-and-top-set/1');
  await expect(page.getByText('3 sets · 5 / 6 / 6 reps')).toBeVisible();
  await expect(page.getByText('3 × 8–12', { exact: true })).toHaveCount(2);

  await page.goto('#/');
  await expect(page.getByText('3 sets · 5 / 6 / 6 reps')).toBeVisible();
  await expect(page.getByText('3 × 8–12', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start session' }).click();

  const expectedSets = [
    ['Back Squat', 'Set 1 of 3 · 5 reps'],
    ['Back Squat', 'Set 2 of 3 · 6 reps'],
    ['Back Squat', 'Set 3 of 3 · 6 reps'],
    ['Bench Press', '3 sets × 8–12 reps'],
    ['Bench Press', '3 sets × 8–12 reps'],
    ['Bench Press', '3 sets × 8–12 reps'],
    ['Barbell Row', '3 sets × 8–12 reps'],
    ['Face Pull', '3 sets × 12–20 reps'],
    ['Barbell Row', '3 sets × 8–12 reps'],
    ['Face Pull', '3 sets × 12–20 reps'],
    ['Barbell Row', '3 sets × 8–12 reps'],
    ['Face Pull', '3 sets × 12–20 reps'],
  ] as const;

  for (const [index, [exerciseName, prescription]] of expectedSets.entries()) {
    await expect(page.getByRole('heading', { name: exerciseName })).toBeVisible();
    await expect(page.locator('.prescribed-band')).toContainText(prescription);
    if (index === 0) {
      await expect(page.locator('.prescribed-band')).toContainText('140 kg');
      await expect(page.locator('.prescribed-band')).toContainText('RPE 9.5');
      await expect(page.locator('.prescribed-band')).toContainText('Rest 300s');
      await expect(page.locator('.prescribed-band')).toContainText(
        'Top set. Only this one goes near failure.',
      );
    }
    if (index === 1) {
      await expect(page.locator('.prescribed-band')).toContainText('120 kg');
      await expect(page.locator('.prescribed-band')).toContainText('RPE 8');
      await expect(page.locator('.prescribed-band')).toContainText('Rest 180s');
    }
    if (index === 3) await page.locator('#actual-reps').fill('12');
    const weight = page.locator('#actual-weight');
    if ((await weight.inputValue()) === '') await weight.fill('50');
    await page.getByRole('button', { name: 'Log set' }).click();
    await expect(page.getByText(/ready to progress|add weight/iu)).toHaveCount(0);
  }

  await page.getByRole('button', { name: 'Complete session' }).click();
  await page.goto('#/history');
  await expect(page.getByRole('heading', { name: 'Back Squat' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Face Pull' })).toBeVisible();
});
