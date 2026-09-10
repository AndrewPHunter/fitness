import type { Settings } from '../../domain/program/types';

export function applyTheme(theme: Settings['theme']): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = theme;
}
