import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PwaAdapter, PwaState } from '../../platform/pwa/PwaAdapter';
import { PwaUpdateNotice } from './PwaUpdateNotice';

const waiting: PwaState = {
  serviceWorkerStatus: 'waiting',
  installed: false,
  installPromptAvailable: false,
  detail: 'A new version is ready to install.',
};

function fakeAdapter() {
  return {
    getState: vi.fn(() => waiting),
    subscribe: vi.fn(() => () => undefined),
    register: vi.fn(async () => undefined),
    requestInstall: vi.fn(async () => ({ ok: true }) as const),
    activateWaitingUpdate: vi.fn(() => ({ ok: true }) as const),
    reload: vi.fn(),
  } satisfies PwaAdapter;
}

it('keeps a waiting update visible and blocked throughout an in-progress session', async () => {
  const adapter = fakeAdapter();
  const { rerender } = render(
    <PwaUpdateNotice adapter={adapter} state={waiting} sessionInProgress />,
  );
  expect(screen.getByText('New version available')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Update after session' })).toBeDisabled();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Update after session' }));
  expect(adapter.activateWaitingUpdate).not.toHaveBeenCalled();

  rerender(
    <PwaUpdateNotice
      adapter={adapter}
      state={{ ...waiting, serviceWorkerStatus: 'reload-ready' }}
      sessionInProgress
    />,
  );
  expect(screen.getByRole('button', { name: 'Reload after session' })).toBeDisabled();
  expect(adapter.reload).not.toHaveBeenCalled();
});

it('requires separate user actions to activate and reload an update', async () => {
  const user = userEvent.setup();
  const adapter = fakeAdapter();
  const { rerender } = render(
    <PwaUpdateNotice adapter={adapter} state={waiting} sessionInProgress={false} />,
  );
  await user.click(screen.getByRole('button', { name: 'Install new version' }));
  expect(adapter.activateWaitingUpdate).toHaveBeenCalledOnce();
  expect(adapter.reload).not.toHaveBeenCalled();

  rerender(
    <PwaUpdateNotice
      adapter={adapter}
      state={{ ...waiting, serviceWorkerStatus: 'reload-ready' }}
      sessionInProgress={false}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Reload into new version' }));
  expect(adapter.reload).toHaveBeenCalledOnce();
});
