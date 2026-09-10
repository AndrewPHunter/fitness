import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  children,
  variant = 'primary',
  wide = false,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  wide?: boolean;
}) {
  return (
    <button
      className={`button button-${variant}${wide ? ' button-wide' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
