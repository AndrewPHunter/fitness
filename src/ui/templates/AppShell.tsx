import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../organisms/BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="app-header">
        <Link className="wordmark" to="/">
          <span className="status-dot" />
          Fieldwork
        </Link>
        <span className="eyebrow">Local only</span>
      </header>
      {children}
      <BottomNav />
    </>
  );
}
