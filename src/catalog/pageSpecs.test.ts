import { describe, expect, it } from 'vitest';
import { pageGroups, pageSpecs, routeForNavigation } from './pageSpecs';

describe('canonical page catalog', () => {
  it('contains exactly 42 unique pages and routes', () => {
    expect(pageSpecs).toHaveLength(42);
    expect(new Set(pageSpecs.map(({ id }) => id)).size).toBe(42);
    expect(new Set(pageSpecs.map(({ route }) => route)).size).toBe(42);
  });

  it('keeps every page in a declared group with one primary task', () => {
    for (const page of pageSpecs) {
      expect(pageGroups).toContain(page.group);
      expect(page.primaryAction.trim()).not.toBe('');
      expect(page.primaryRole.trim()).not.toBe('');
      expect(page.title.trim()).not.toBe('');
    }
  });

  it('produces a navigable concrete route for parameterized pages', () => {
    const assetRoute = pageSpecs.find(({ id }) => id === 'P12')?.route;
    expect(assetRoute).toBe('/devices/assets/:assetId');
    expect(routeForNavigation(assetRoute ?? '')).toBe('/devices/assets/asset-demo');
  });
});