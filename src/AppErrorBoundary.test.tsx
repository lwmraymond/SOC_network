import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

afterEach(() => {
  vi.restoreAllMocks();
});

function BrokenComponent(): never {
  throw new Error('synthetic render failure');
}

describe('AppErrorBoundary', () => {
  it('shows an accessible non-EUI fallback instead of an empty root', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Application failed to render');
    expect(screen.getByRole('button', { name: 'Reload application' })).toBeEnabled();
  });
});
