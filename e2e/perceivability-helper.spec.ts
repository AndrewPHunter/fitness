import { expect, test, type Locator } from '@playwright/test';
import { expectPerceivable } from './helpers/expectPerceivable';

async function expectRejected(locator: Locator, reason: RegExp) {
  let message = '';
  try {
    await expectPerceivable(locator);
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : String(error);
  }
  expect(message).toMatch(reason);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(`
    <style>
      body { margin: 0; }
      .bottom-nav { position: fixed; inset: auto 0 0; height: 65px; }
      .visually-hidden {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        width: 1px;
      }
    </style>
    <nav class="bottom-nav">Navigation</nav>
  `);
});

test('rejects a screen-reader-only confirmation inside the viewport', async ({ page }) => {
  await page.locator('body').evaluate((body) => {
    body.insertAdjacentHTML(
      'beforeend',
      '<p class="visually-hidden" id="confirmation">Program imported</p>',
    );
  });
  await expectRejected(page.locator('#confirmation'), /visually-hidden|less than 40px/u);
});

test('rejects visible text behind the fixed bottom navigation', async ({ page }) => {
  await page.locator('body').evaluate((body) => {
    body.insertAdjacentHTML(
      'beforeend',
      '<p id="confirmation" style="position:fixed;top:800px;left:10px;width:200px;height:20px">Program imported</p>',
    );
  });
  await expect(page.locator('#confirmation')).toBeInViewport();
  await expectRejected(page.locator('#confirmation'), /below usable viewport bottom/u);
});

test('rejects visible text below the fold', async ({ page }) => {
  await page.locator('body').evaluate((body) => {
    body.insertAdjacentHTML(
      'beforeend',
      '<p id="confirmation" style="position:absolute;top:900px;left:10px;width:200px;height:20px">Program imported</p>',
    );
  });
  await expectRejected(page.locator('#confirmation'), /below usable viewport bottom/u);
});
