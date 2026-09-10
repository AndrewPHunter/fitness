import { render, screen } from '@testing-library/react';
import type { ValidationError } from '../../domain/program/types';
import { ErrorPanel } from './ErrorPanel';

it('renders every validation problem with code, path, and message', () => {
  const errors: ValidationError[] = [
    { layer: 'structural', code: 'ONE', path: '/a', message: 'Expected a number.' },
    { layer: 'semantic', code: 'TWO', path: '/b', message: 'Expected a declared exercise.' },
  ];
  render(<ErrorPanel title="Rejected" errors={errors} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('/a')).toBeVisible();
  expect(screen.getByText('Expected a declared exercise.')).toBeVisible();
});
