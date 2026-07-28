import { describe, expect, it } from 'vitest';
import { createAutomationTemplateManagementAdapter } from './adapter';
import { emptyTemplateFilters, filterTemplates } from './model';
import type { ItsmApiAdapter } from '../contracts';

const base = { listAutomationRuns: async () => ({ items: [], authoritativeAt: new Date().toISOString() }) } as unknown as ItsmApiAdapter;

describe('Automation Template library filtering', () => {
  it('filters by search, category, owner, lifecycle and dependency health', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const templates = (await adapter.listTemplates({ limit: 100 })).items;
    expect(filterTemplates(templates, { ...emptyTemplateFilters, search: 'email', category: 'Messaging', status: 'validating', owner: 'Service desk automation', dependencyHealth: 'blocked' })).toHaveLength(1);
    expect(filterTemplates(templates, { ...emptyTemplateFilters, publishedVersion: 'published' }).every((item) => item.publishedVersionId)).toBe(true);
  });
});
