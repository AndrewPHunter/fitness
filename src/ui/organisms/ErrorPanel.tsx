import type { ReactNode } from 'react';
import type { ValidationError } from '../../domain/program/types';
import { ErrorItem } from '../molecules/ErrorItem';

export function ErrorPanel({
  title,
  errors,
  actions,
}: {
  title: string;
  errors: ValidationError[];
  actions?: ReactNode;
}) {
  return (
    <section className="error-panel" role="alert" aria-labelledby="error-title">
      <div className="stack">
        <p className="eyebrow">Action required</p>
        <h2 id="error-title">{title}</h2>
      </div>
      <ul className="error-list">
        {errors.map((error, index) => (
          <ErrorItem key={`${error.code}-${error.path}-${index}`} error={error} />
        ))}
      </ul>
      {actions}
    </section>
  );
}
