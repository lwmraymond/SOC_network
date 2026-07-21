import type { PrototypePageFixture } from '../types/prototype';

export const isPrototypeMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_FIXTURES === 'true';

export class PrototypeAdapterUnavailable extends Error {
  constructor() {
    super('No production adapter is configured. Enable fixtures only in development review mode.');
    this.name = 'PrototypeAdapterUnavailable';
  }
}

export async function loadPrototypePage(pageId: string): Promise<PrototypePageFixture> {
  if (!isPrototypeMode) throw new PrototypeAdapterUnavailable();
  const module = await import('./pageFixtures');
  return module.getPrototypeFixture(pageId);
}
