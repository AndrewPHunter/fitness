import type { ValidationError } from '../../domain/program/types';

export function ErrorItem({ error }: { error: ValidationError }) {
  return (
    <li className="error-item">
      <span className="error-code">
        {error.code} · {error.layer}
      </span>
      <code className="error-path">{error.path || '(document root)'}</code>
      <span>{error.message}</span>
    </li>
  );
}
