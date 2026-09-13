import { useState } from 'react';
import type { Settings } from '../../domain/program/types';
import type { AppStore } from '../../domain/state/appStore';
import type { PwaAdapter, PwaState } from '../../platform/pwa/PwaAdapter';
import { Button } from '../../ui/atoms/Button';
import { FormField } from '../../ui/molecules/FormField';
import { InstallPanel } from '../pwa/InstallPanel';

export function SettingsPage({
  store,
  pwaAdapter,
  pwaState,
}: {
  store: AppStore;
  pwaAdapter: PwaAdapter;
  pwaState: PwaState;
}) {
  const [unit, setUnit] = useState<Settings['defaultUnit']>(store.data.settings.defaultUnit);
  const [theme, setTheme] = useState<Settings['theme']>(store.data.settings.theme);
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Settings</p>
        <h1>Set the defaults, not the past.</h1>
        <p className="muted">
          Changing units only affects future input. Recorded loads are never converted or rewritten.
        </p>
      </header>
      <section className="surface stack">
        <FormField label="Default unit for new input" htmlFor="default-unit">
          <select
            className="select"
            id="default-unit"
            value={unit}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'kg' || value === 'lb') setUnit(value);
            }}
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
          </select>
        </FormField>
        <FormField label="Theme" htmlFor="theme">
          <select
            className="select"
            id="theme"
            value={theme}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'system' || value === 'light' || value === 'dark') setTheme(value);
            }}
          >
            <option value="system">Follow device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </FormField>
        <Button onClick={() => store.updateSettings({ defaultUnit: unit, theme })}>
          Save settings
        </Button>
      </section>
      <InstallPanel adapter={pwaAdapter} state={pwaState} />
    </main>
  );
}
