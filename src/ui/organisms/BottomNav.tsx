import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Today', glyph: '01', end: true },
  { to: '/programs', label: 'Programs', glyph: '02', end: false },
  { to: '/history', label: 'History', glyph: '03', end: false },
  { to: '/data', label: 'Data', glyph: '04', end: false },
  { to: '/settings', label: 'Settings', glyph: '05', end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className="nav-link">
          <span className="nav-glyph" aria-hidden="true">
            {link.glyph}
          </span>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
