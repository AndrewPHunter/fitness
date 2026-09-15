import type { ReactNode, Ref } from 'react';
import type { ValidationError } from '../../domain/program/types';
import { ErrorItem } from '../molecules/ErrorItem';

export function ErrorPanel({
  title,
  errors,
  actions,
  headingRef,
  headingTabIndex,
}: {
  title: string;
  errors: ValidationError[];
  actions?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  headingTabIndex?: number;
}) {
  return (
    <section className="error-panel" role="alert" aria-labelledby="error-title">
      <div className="stack">
        <p className="eyebrow">Action required</p>
        <h2 id="error-title" ref={headingRef} tabIndex={headingTabIndex}>
          {title}
        </h2>
        {actions}
      </div>
      <ul className="error-list">
        {errors.map((error, index) => (
          <ErrorItem key={`${error.code}-${error.path}-${index}`} error={error} />
        ))}
      </ul>
    </section>
  );
}
