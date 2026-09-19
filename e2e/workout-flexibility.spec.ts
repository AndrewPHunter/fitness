import { expect, test } from '@playwright/test';
import path from 'node:path';
import { expectPerceivable } from './helpers/expectPerceivable';

const complexFixture = path.resolve('fixtures/programs/04-complex-multiblock.json');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
});

test('a workout can change order, skip exercises, complete, and remain intelligible in history', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Import a program' }).click();
  await page.locator('#program-file').setInputFiles(complexFixture);
  await page.getByRole('button', { name: 'Import program' }).click();
  await page.getByRole('button', { name: 'Activate' }).click();
  await page.getByRole('button', { name: 'Start Lower — Heavy' }).click();

  await page.getByRole('button', { name: 'Switch' }).click();
  const chooser = page.getByRole('dialog', { name: 'Choose an exercise' });
  await expect(chooser).toBeVisible();
  const moveSupersetUp = chooser.getByRole('button', { name: 'Move Leg Curl + Face Pull up' });
  await moveSupersetUp.click();
  await moveSupersetUp.click();
  await expect(chooser.getByText('Leg Curl + Face Pull is now 1 of 3. Order saved.')).toBeVisible();
  await chooser.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Leg Curl' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'Leg Curl' })).toBeVisible();
  expect(
    await page.evaluate(() => {
      const raw = globalThis.localStorage.getItem('fitness.v1.root');
      return raw ? (JSON.parse(raw) as { workoutOrders: { blockOrder: number[] }[] }) : null;
    }),
  ).toMatchObject({ workoutOrders: [{ blockOrder: [2, 0, 1] }] });
  await page.getByRole('button', { name: 'Switch' }).click();
  await page
    .getByRole('dialog', { name: 'Choose an exercise' })
    .getByRole('button', { name: /Leg Curl.*Current/u })
    .click();
  await page.locator('#actual-weight').fill('45');
  await page.locator('#actual-rpe').fill('8');
  await page.getByRole('button', { name: 'Log set' }).click();
  await expectPerceivable(
    page
      .locator('.global-feedback-success')
      .filter({ hasText: 'Set 1 logged · 45 kg × 12 · RPE 8' }),
  );
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.locator('.global-feedback-success')).toHaveCount(0);

  await page.getByRole('button', { name: 'Skip Leg Curl for this workout' }).click();
  await expectPerceivable(
    page
      .locator('.global-feedback-success')
      .filter({ hasText: 'Leg Curl skipped for this workout · 1 logged set kept.' }),
  );
  await expect(page.getByRole('heading', { level: 2, name: 'Face Pull' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip Face Pull for this workout' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Back Squat' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip Back Squat for this workout' }).click();
  await page.getByRole('button', { name: 'Skip Romanian Deadlift for this workout' }).click();

  await expect(page.getByRole('heading', { name: 'Session ready to complete' })).toBeVisible();
  await page.getByRole('button', { name: 'Complete session' }).click();
  await expectPerceivable(
    page
      .locator('.global-feedback-success')
      .filter({ hasText: 'Lower — Heavy completed · 1 set logged · 4 exercises skipped.' }),
  );

  await page.getByRole('link', { name: 'History', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lower — Heavy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Leg Curl' })).toBeVisible();
  await expect(page.getByText('45 kg × 12')).toBeVisible();
  await expect(page.getByText('No sets logged · skipped for this workout')).toHaveCount(3);

  await page.getByRole('button', { name: 'Exercises' }).click();
  await page.getByRole('link', { name: /Leg Curl.*Last: 45 kg × 12/u }).click();
  await expect(page.getByRole('heading', { name: 'Lower — Heavy' })).toBeVisible();
  await expect(page.getByText('45 kg × 12')).toBeVisible();

  await page.getByRole('link', { name: 'Backup', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Protect your training history.' })).toBeVisible();

  const before = await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'));
  await page.reload();
  expect(await page.evaluate(() => globalThis.localStorage.getItem('fitness.v1.root'))).toBe(
    before,
  );
});

test('the exercise switcher stays one-hand reachable without horizontal overflow at 320 px', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Import a program' }).click();
  await page.locator('#program-file').setInputFiles(complexFixture);
  await page.getByRole('button', { name: 'Import program' }).click();
  await page.getByRole('button', { name: 'Activate' }).click();
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole('button', { name: 'Start Lower — Heavy' }).click();
  await page.getByRole('button', { name: 'Switch' }).click();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const chooser = page.getByRole('dialog', { name: 'Choose an exercise' });
  const chooserTitle = chooser.getByRole('heading', { name: 'Choose an exercise' });
  await expect(chooserTitle).toBeFocused();
  expect(await chooser.evaluate((element) => element.scrollTop)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(chooser).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Switch' })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.getByRole('button', { name: 'Switch' }).click();

  const reopened = page.getByRole('dialog', { name: 'Choose an exercise' });
  await expect(reopened.getByRole('heading', { name: 'Choose an exercise' })).toBeFocused();
  expect(await reopened.evaluate((element) => element.scrollTop)).toBe(0);
  const titleBox = await reopened
    .getByRole('heading', { name: 'Choose an exercise' })
    .boundingBox();
  const navigationBox = await page
    .getByRole('navigation', { name: 'Main navigation' })
    .boundingBox();
  expect(titleBox?.y).toBeGreaterThanOrEqual(0);
  expect((titleBox?.y ?? 0) + (titleBox?.height ?? 0)).toBeLessThan(navigationBox?.y ?? 0);
  const targets = reopened.getByRole('button');
  for (let index = 0; index < (await targets.count()); index += 1) {
    const box = await targets.nth(index).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await reopened.getByRole('button', { name: /Face Pull.*Choose/u }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Face Pull' })).toBeVisible();
});
