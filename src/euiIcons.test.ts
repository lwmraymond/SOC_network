import { describe, expect, it } from 'vitest';
import { registeredEuiIcons } from './euiIcons';

describe('EUI icon cache', () => {
  it('registers the responsive side-navigation apps icon', () => {
    expect(registeredEuiIcons.apps).toBeDefined();
  });
});
