import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { registeredEuiIcons } from './euiIcons';

describe('EUI icon bootstrap', () => {
  it('registers every icon required by the shell and P07 overlays', () => {
    expect(Object.keys(registeredEuiIcons).sort()).toEqual([
      'arrowDown',
      'cross',
      'lock',
      'logoElastic',
      'search',
    ]);
  });

  it('renders the explicitly imported icon components synchronously', () => {
    const { container } = render(
      <>
        {Object.entries(registeredEuiIcons).map(([name, Icon]) => (
          <Icon key={name} aria-label={name} />
        ))}
      </>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(5);
    expect(container.querySelector('[data-type="logoElastic"]')).toBeInTheDocument();
  });
});
