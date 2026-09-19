import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expectPerceivable } from './helpers/expectPerceivable';

const minimalFixture = path.resolve('fixtures/programs/01-minimal.json');

async function openPrograms(page: Page) {
  await page.getByRole('link', { name: 'Programs', exact: true }).click();
}

async function pasteImportAndActivate(page: Page) {
  await openPrograms(page);
  await page.locator('#program-json').fill(await readFile(minimalFixture, 'utf8'));
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expectPerceivable(page.getByRole('heading', { name: /Minimal Full Body/u }));
  await expectPerceivable(page.getByRole('button', { name: 'Import program' }));
  await page.getByRole('button', { name: 'Import program' }).click();
  await expectPerceivable(page.getByRole('heading', { name: 'Minimal Full Body v1 imported' }));
  await page.getByRole('button', { name: 'Activate Minimal Full Body' }).click();
  await expectPerceivable(page.getByRole('button', { name: 'Start Full Body' }));
}

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('');
  await page.evaluate(() => globalThis.localStorage.clear());
  await page.reload();
});

test('the empty-storage core loop keeps every outcome and next step perceivable', async ({
  page,
}) => {
  const author = page.getByRole('link', { name: 'Get the authoring prompt' });
  const importSecondary = page.getByRole('link', { name: 'Import a program' });
  await expectPerceivable(author);
  await expectPerceivable(importSecondary);

  await author.click();
  await page.getByRole('button', { name: 'Copy personalized prompt' }).click();
  await expectPerceivable(page.getByText('Copied the complete personalized prompt.'));
  const pasteNext = page.getByRole('link', { name: 'Paste JSON in Programs' });
  await expectPerceivable(pasteNext);
  await pasteNext.click();

  const source = await readFile(minimalFixture, 'utf8');
  const pasteField = page.locator('#program-json');
  await pasteField.fill(source);
  await expectPerceivable(page.getByRole('button', { name: 'Clear pasted JSON' }));
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();

  const previewHeading = page.getByRole('heading', { name: /Minimal Full Body/u });
  await expect(previewHeading).toBeFocused();
  await expectPerceivable(previewHeading);
  await expectPerceivable(page.getByRole('button', { name: 'Import program' }));
  await page.getByRole('button', { name: 'Import program' }).click();

  const importedHeading = page.getByRole('heading', { name: 'Minimal Full Body v1 imported' });
  await expect(importedHeading).toBeFocused();
  await expectPerceivable(importedHeading);
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Minimal Full Body v1 imported.' }),
  );
  await expectPerceivable(page.getByRole('button', { name: 'Clear pasted JSON' }));
  await expect(page.locator('.visually-hidden[aria-live="polite"]')).toContainText(
    'Minimal Full Body v1 imported.',
  );
  const activate = page.getByRole('button', { name: 'Activate Minimal Full Body' });
  await expectPerceivable(activate);
  await activate.click();

  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Minimal Full Body v1 is active.' }),
  );
  const start = page.getByRole('button', { name: 'Start Full Body' });
  await expectPerceivable(start);
  await start.click();
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Full Body started.' }),
  );

  await page.locator('#actual-weight').fill('0');
  await page.getByRole('button', { name: 'Log set' }).click();
  const failedLog = page.getByRole('alert').filter({ hasText: 'Set not saved.' });
  await expectPerceivable(failedLog);
  await expect(failedLog.locator('.state-symbol')).toHaveText('!');

  await page.locator('#actual-weight').fill('100');
  await page.locator('#actual-rpe').fill('8');
  await page.getByRole('button', { name: 'Log set' }).click();
  await expectPerceivable(
    page
      .locator('.global-feedback-success')
      .filter({ hasText: 'Set 1 logged · 100 kg × 5 · RPE 8' }),
  );
  await expect(page.locator('.prescribed-band')).toContainText('Set 2 of 3 · 5 reps');

  for (const set of [2, 3, 1, 2, 3]) {
    const weight = page.locator('#actual-weight');
    if ((await weight.inputValue()) === '') await weight.fill('100');
    await page.getByRole('button', { name: 'Log set' }).click();
    await expectPerceivable(
      page.locator('.global-feedback-success').filter({ hasText: `Set ${set} logged` }),
    );
  }
  await page.getByRole('button', { name: 'Complete session' }).click();
  await expectPerceivable(
    page
      .locator('.global-feedback-success')
      .filter({ hasText: 'Full Body completed · 6 sets logged.' }),
  );
});

test('validation failure stays editable and Clear offers persistent exact-text Undo', async ({
  page,
}) => {
  await openPrograms(page);
  const source = '{"programId":';
  const pasteField = page.locator('#program-json');
  await pasteField.fill(source);
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();

  const heading = page.getByRole('heading', { name: '1 problem found — program rejected' });
  await expect(heading).toBeFocused();
  await expectPerceivable(heading);
  await expect(pasteField).toHaveValue(source);
  const clear = page.getByRole('button', { name: 'Clear pasted JSON' });
  await expectPerceivable(clear);
  await clear.click();

  const confirmation = page.locator('.clear-feedback');
  await expect(confirmation).toBeFocused();
  await expectPerceivable(confirmation);
  await expect(confirmation).toContainText('Pasted JSON cleared');
  await expect(pasteField).toHaveValue('');
  await expect(page.locator('.error-panel')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForTimeout(4100);
  await expectPerceivable(confirmation);

  await confirmation.getByRole('button', { name: 'Undo' }).click();
  await expect(pasteField).toHaveValue(source);
  await expect(page.locator('.error-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Validate pasted JSON' }).click();
  await expect(pasteField).toHaveValue(source);
});

test('empty sessions discard, while logged sessions only leave and keep their set', async ({
  page,
}) => {
  await pasteImportAndActivate(page);
  await page.getByRole('button', { name: 'Start Full Body' }).click();
  const discard = page.getByRole('button', { name: 'Discard', exact: true });
  await expectPerceivable(discard);
  await expect(page.getByRole('button', { name: 'Leave', exact: true })).toHaveCount(0);
  await discard.click();

  const discardConfirm = page.getByRole('button', { name: 'Discard empty session' });
  await expect(discardConfirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(discardConfirm).toBeFocused();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(discard).toBeFocused();
  await discard.click();
  await expect(discardConfirm).toBeFocused();
  await discardConfirm.click();
  await expectPerceivable(
    page
      .locator('.global-feedback-success')
      .filter({ hasText: 'Full Body discarded · no sets were logged.' }),
  );
  expect(
    await page.evaluate(() => {
      const raw = globalThis.localStorage.getItem('fitness.v1.root');
      return raw ? JSON.parse(raw).sessionLogs.length : -1;
    }),
  ).toBe(0);

  await page.getByRole('button', { name: 'Start session' }).click();
  await page.locator('#actual-weight').fill('80');
  await page.getByRole('button', { name: 'Log set' }).click();
  await expect(page.getByRole('button', { name: 'Discard', exact: true })).toHaveCount(0);
  const leave = page.getByRole('button', { name: 'Leave', exact: true });
  await expectPerceivable(leave);
  await leave.click();
  const leaveConfirm = page.getByRole('button', { name: 'Leave and keep sets' });
  await expect(leaveConfirm).toBeFocused();
  await leaveConfirm.click();
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: '1 logged set kept.' }),
  );

  await page.getByRole('link', { name: /Resume · 1 set/u }).click();
  await page.getByRole('button', { name: 'Correct' }).click();
  const editor = page.locator('.surface').filter({ hasText: 'Correct logged set' });
  await editor.locator('input').first().fill('82.5');
  await editor.getByRole('button', { name: 'Save correction' }).click();
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Set corrected · 82.5 kg × 5' }),
  );

  await page.getByRole('link', { name: 'History', exact: true }).click();
  await page.getByRole('button', { name: 'Exercises' }).click();
  const historyLink = page.getByRole('link', {
    name: /Back Squat.*Last: 82\.5 kg × 5, /u,
  });
  await historyLink.click();
  await page.getByRole('button', { name: 'Delete set' }).click();
  const deleteConfirm = page.getByRole('button', { name: 'Delete this set' });
  await expect(deleteConfirm).toBeFocused();
  await deleteConfirm.click();
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Set deleted · 82.5 kg × 5' }),
  );
});

test('the active program detail offers its named next session', async ({ page }) => {
  await pasteImportAndActivate(page);
  await page.getByRole('link', { name: 'View 1 sessions' }).click();
  await expect(page).toHaveURL(/#\/programs\/minimal-full-body\/1$/u);
  await expect(
    page.getByRole('heading', { level: 1, name: /Minimal Full Body v1/u }),
  ).toBeVisible();
  await expectPerceivable(page.getByRole('button', { name: 'Start Full Body' }));
});

test('a rejected write produces pinned, non-colour-only failure feedback', async ({ page }) => {
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.evaluate(() => {
    globalThis.Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Save settings' }).click();
  const failure = page.locator('.global-feedback-failure');
  await expectPerceivable(failure);
  await expect(failure).toContainText(
    'Settings · kg · system theme were not updated. Browser storage is full.',
  );
  await expect(failure.locator('.state-symbol')).toHaveText('!');
});

test('settings, exports, restore and merge confirm honestly and clear on navigation', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.selectOption('#default-unit', 'lb');
  await page.getByRole('button', { name: 'Save settings' }).click();
  const settingsNotice = page
    .locator('.global-feedback-success')
    .filter({ hasText: 'Settings updated · lb · system theme.' });
  await expectPerceivable(settingsNotice);
  await page.waitForTimeout(4100);
  await expectPerceivable(settingsNotice);

  await page.getByRole('link', { name: 'Backup', exact: true }).click();
  await expect(page.locator('.global-feedback-success')).toHaveCount(0);
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON backup' }).click();
  const json = await jsonDownload;
  const jsonPath = test.info().outputPath('perceivable-backup.json');
  await json.saveAs(jsonPath);
  const jsonNotice = page
    .locator('.global-feedback-success')
    .filter({ hasText: /Prepared fitness-export-/u });
  await expectPerceivable(jsonNotice);
  await expect(jsonNotice).toContainText('— check that it saved.');
  await expect(jsonNotice).not.toContainText(/downloaded|backup saved/iu);

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await csvDownload;
  const csvNotice = page
    .locator('.global-feedback-success')
    .filter({ hasText: /Prepared fitness-history-/u });
  await expectPerceivable(csvNotice);
  await expect(csvNotice).toContainText('— check that it saved.');

  await page.locator('#backup-file').setInputFiles(jsonPath);
  await page.getByRole('button', { name: 'Merge' }).click();
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Backup merged' }),
  );

  await page.locator('#backup-file').setInputFiles(jsonPath);
  await page.getByRole('button', { name: 'Replace current data' }).click();
  const replace = page.getByRole('button', { name: 'Replace all local data' });
  await expect(replace).toBeFocused();
  await replace.click();
  await expectPerceivable(
    page.locator('.global-feedback-success').filter({ hasText: 'Backup restored' }),
  );
});

test('Log set stays beneath the inputs and reachable in the keyboard-height proxy', async ({
  page,
}) => {
  await pasteImportAndActivate(page);
  await page.getByRole('button', { name: 'Start Full Body' }).click();
  const started = page
    .locator('.global-feedback-success')
    .filter({ hasText: 'Full Body started.' });
  await page.waitForTimeout(4100);
  await expectPerceivable(started);
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await page.getByRole('link', { name: /Resume/u }).click();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.locator('#actual-weight').focus();
  await page.waitForTimeout(400);
  const weight = page.locator('#actual-weight');
  const logSet = page.getByRole('button', { name: 'Log set' });
  const skip = page.getByRole('button', { name: /Skip .* for this workout/u });
  await expectPerceivable(logSet);
  const weightBox = await weight.boundingBox();
  const logBox = await logSet.boundingBox();
  const skipBox = await skip.boundingBox();
  expect(logBox?.y).toBeGreaterThanOrEqual((weightBox?.y ?? 0) + (weightBox?.height ?? 0));
  expect(skipBox?.y).toBeLessThan(weightBox?.y ?? 0);
});
