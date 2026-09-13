import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PwaAdapter, PwaState } from '../../platform/pwa/PwaAdapter';
import { InstallPanel } from './InstallPanel';

const manual: PwaState = {
  serviceWorkerStatus: 'ready',
  installed: false,
  installPromptAvailable: false,
  detail: 'The offline app shell is ready.',
};

const adapter = {
  getState: vi.fn(() => manual),
  subscribe: vi.fn(() => () => undefined),
  register: vi.fn(async () => undefined),
  requestInstall: vi.fn(async () => ({ ok: true }) as const),
  activateWaitingUpdate: vi.fn(() => ({ ok: true }) as const),
  reload: vi.fn(),
} satisfies PwaAdapter;

it('shows real manual instructions and no inert install button without a browser prompt', () => {
  render(<InstallPanel adapter={adapter} state={manual} />);
  expect(screen.getByText(/tap Share, then “Add to Home Screen.”/u)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Install Fieldwork' })).not.toBeInTheDocument();
});

it('stops giving install instructions when already running installed', () => {
  render(<InstallPanel adapter={adapter} state={{ ...manual, installed: true }} />);
  expect(screen.getByText(/running as an installed app/u)).toBeVisible();
  expect(screen.queryByText(/tap Share/u)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Install Fieldwork' })).not.toBeInTheDocument();
});

it('renders a working one-tap action only when the browser supplied its install prompt', async () => {
  adapter.requestInstall.mockClear();
  render(<InstallPanel adapter={adapter} state={{ ...manual, installPromptAvailable: true }} />);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Install Fieldwork' }));
  expect(adapter.requestInstall).toHaveBeenCalledOnce();
});
