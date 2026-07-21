import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { registeredEuiIcons } from './euiIcons';

describe('EUI icon bootstrap', () => {
  it('registers every icon required by the shell and P07 overlays', () => {
    expect(Object.keys(registeredEuiIcons).sort()).toEqual([
      'arrowDown',
      'arrowLeft',
      'arrowRight',
      'arrowUp',
      'check',
      'checkInCircleFilled',
      'cross',
      'document',
      'dot',
      'empty',
      'error',
      'info',
      'inspect',
      'lock',
      'logoElastic',
      'merge',
      'search',
      'sortAscending',
      'sortDescending',
      'sortDown',
      'sortUp',
      'sortable',
      'warning',
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

    expect(container.querySelectorAll('svg')).toHaveLength(Object.keys(registeredEuiIcons).length);
    expect(container.querySelector('[data-type="logoElastic"]')).toBeInTheDocument();
  });
});
