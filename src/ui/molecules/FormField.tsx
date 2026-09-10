import type { ReactNode } from 'react';

export function FormField({
  label,
  htmlFor,
  hint,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
