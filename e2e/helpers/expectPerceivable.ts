import { expect, type Locator } from '@playwright/test';

interface PerceivabilityMeasurement {
  bottom: number;
  height: number;
  hiddenReasons: string[];
  left: number;
  right: number;
  top: number;
  usableBottom: number;
  viewportWidth: number;
  width: number;
}

export async function expectPerceivable(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible({ timeout: 300 });
  const measurement = await locator.evaluate<PerceivabilityMeasurement>((element) => {
    const rect = element.getBoundingClientRect();
    const navigation = document.querySelector('.bottom-nav');
    const navigationRect = navigation?.getBoundingClientRect();
    const hiddenReasons: string[] = [];

    for (let current: Element | null = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (current.classList.contains('visually-hidden')) hiddenReasons.push('visually-hidden');
      if (Number.parseFloat(style.opacity) === 0) hiddenReasons.push('zero opacity');
      if (style.clip !== 'auto') hiddenReasons.push(`clip: ${style.clip}`);
      if (style.clipPath !== 'none') hiddenReasons.push(`clip-path: ${style.clipPath}`);
    }

    return {
      bottom: rect.bottom,
      height: rect.height,
      hiddenReasons,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      usableBottom: navigationRect?.top ?? window.innerHeight,
      viewportWidth: window.innerWidth,
      width: rect.width,
    };
  });

  const violations: string[] = [];
  if (measurement.top < 0) violations.push(`top ${measurement.top}px is above the viewport`);
  if (measurement.left < 0) violations.push(`left ${measurement.left}px is outside the viewport`);
  if (measurement.right > measurement.viewportWidth) {
    violations.push(
      `right ${measurement.right}px is outside viewport width ${measurement.viewportWidth}px`,
    );
  }
  if (measurement.bottom > measurement.usableBottom) {
    violations.push(
      `bottom ${measurement.bottom}px is below usable viewport bottom ${measurement.usableBottom}px`,
    );
  }
  if (measurement.width < 40) violations.push(`width ${measurement.width}px is less than 40px`);
  if (measurement.height < 16) violations.push(`height ${measurement.height}px is less than 16px`);
  violations.push(...measurement.hiddenReasons);

  expect(
    violations,
    'Expected the element to be entirely perceivable without the helper scrolling it',
  ).toEqual([]);
}
