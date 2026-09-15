import { useEffect, useRef } from 'react';
import { Button } from '../atoms/Button';

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm(): void;
  onCancel(): void;
}) {
  const dialog = useRef<HTMLElement>(null);

  useEffect(() => {
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = dialog.current;
    const focusable = () =>
      node
        ? [
            ...node.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]',
            ),
          ].filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0)
        : [];
    focusable()[0]?.focus();
    const keepFocusInside = (event: FocusEvent) => {
      if (node && event.target instanceof Node && !node.contains(event.target)) {
        focusable()[0]?.focus();
      }
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('focusin', keepFocusInside);
    node?.addEventListener('keydown', trapTab);
    return () => {
      document.removeEventListener('focusin', keepFocusInside);
      node?.removeEventListener('keydown', trapTab);
      if (invoker?.isConnected) invoker.focus();
    };
  }, []);

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={dialog}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="stack">
          <h2 id="dialog-title">{title}</h2>
          <p id="dialog-description">{description}</p>
        </div>
        <div className="cluster">
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </section>
    </div>
  );
}
