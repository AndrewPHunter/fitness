import { readFile } from 'node:fs/promises';

const tokenSource = await readFile(
  new globalThis.URL('../src/ui/tokens/tokens.css', import.meta.url),
  'utf8',
);
const requiredTokens = [
  'bg',
  'surface',
  'text',
  'muted',
  'accent',
  'border-strong',
  'danger',
  'success',
];
const schemes = { light: {}, dark: {} };

for (const token of requiredTokens) {
  const expression = new RegExp(
    `--${token}:\\s*light-dark\\((#[0-9a-f]{6}),\\s*(#[0-9a-f]{6})\\)`,
    'iu',
  );
  const match = expression.exec(tokenSource);
  if (!match?.[1] || !match[2])
    throw new Error(`Could not read both scheme values for --${token}.`);
  schemes.light[token] = match[1];
  schemes.dark[token] = match[2];
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const [red, green, blue] = channels.map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

const textTokens = ['text', 'muted', 'accent', 'danger', 'success'];
const backgrounds = ['bg', 'surface'];
const failures = [];
const measured = [];

for (const [scheme, tokens] of Object.entries(schemes)) {
  for (const foreground of textTokens) {
    for (const background of backgrounds) {
      const ratio = contrast(tokens[foreground], tokens[background]);
      measured.push(`${scheme} --${foreground} on --${background}: ${ratio.toFixed(2)}:1`);
      if (ratio < 4.5) {
        failures.push(
          `${scheme} --${foreground} on --${background} is ${ratio.toFixed(2)}:1; expected at least 4.5:1.`,
        );
      }
    }
  }
  for (const background of backgrounds) {
    const ratio = contrast(tokens['border-strong'], tokens[background]);
    measured.push(`${scheme} --border-strong on --${background}: ${ratio.toFixed(2)}:1`);
    if (ratio < 3) {
      failures.push(
        `${scheme} --border-strong on --${background} is ${ratio.toFixed(2)}:1; expected at least 3:1.`,
      );
    }
  }
}

globalThis.console.log(measured.join('\n'));
if (failures.length > 0) throw new Error(`Contrast check failed:\n${failures.join('\n')}`);
