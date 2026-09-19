import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AppStore } from '../domain/state/appStore';
import { ActionFeedback } from './App';

function feedbackStore(overrides: Partial<AppStore> = {}): AppStore {
  return {
    notice: 'Set 1 logged · 100 kg × 5',
    failure: null,
    clearMessages: vi.fn(),
    ...overrides,
  } as AppStore;
}

describe('action feedback', () => {
  afterEach(() => vi.useRealTimers());

  it('can be dismissed explicitly with a short exit transition', () => {
    vi.useFakeTimers();
    const store = feedbackStore();
    render(
      <MemoryRouter>
        <ActionFeedback store={store} />
      </MemoryRouter>,
    );

    const dismiss = screen.getByRole('button', { name: 'Dismiss notification' });
    fireEvent.click(dismiss);
    expect(dismiss.closest('aside')).toHaveClass('global-feedback-exiting');
    expect(store.clearMessages).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(180));
    expect(store.clearMessages).toHaveBeenCalledOnce();
  });

  it('persists beyond four seconds, then fades and clears', () => {
    vi.useFakeTimers();
    const store = feedbackStore();
    render(
      <MemoryRouter>
        <ActionFeedback store={store} />
      </MemoryRouter>,
    );

    const feedback = screen.getByRole('button', { name: 'Dismiss notification' }).closest('aside');
    act(() => vi.advanceTimersByTime(5000));
    expect(feedback).not.toHaveClass('global-feedback-exiting');
    expect(store.clearMessages).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(feedback).toHaveClass('global-feedback-exiting');
    act(() => vi.advanceTimersByTime(300));
    expect(store.clearMessages).toHaveBeenCalledOnce();
  });
});
