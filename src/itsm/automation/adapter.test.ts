import { describe, expect, it, vi } from 'vitest';
import type { AutomationRun, CursorPage, ItsmApiAdapter, MutationContext, QueuedReceipt } from '../contracts';
import { createAutomationTemplateManagementAdapter } from './adapter';

const run: AutomationRun = {
  id: 'run-1', version: '1', etag: 'W/"run-1"', createdAt: '2026-07-27T00:00:00.000Z', updatedAt: '2026-07-27T00:00:00.000Z',
  ruleId: 'rule-1', versionId: 'version-1', state: 'partial', dryRun: false, attempts: 2, auditCorrelationId: 'corr-1',
  failure: { kind: 'partial', message: 'Notification accepted; task unavailable.', retryable: true },
};

const page = <T>(items: T[]): CursorPage<T> => ({ items, total: items.length, authoritativeAt: '2026-07-27T00:00:00.000Z' });
const receipt = (operation: string): QueuedReceipt => ({ receiptId: `receipt-${operation}`, operation, state: 'queued', submittedAt: '2026-07-27T00:00:00.000Z', authoritative: false });

const base = {
  listAutomationTemplates: vi.fn(async () => page([])),
  listAutomationRuns: vi.fn(async () => page([run])),
  retryAutomationRun: vi.fn(async (runId: string) => receipt(`retry:${runId}`)),
  cancelAutomationRun: vi.fn(async (runId: string) => receipt(`cancel:${runId}`)),
} as unknown as ItsmApiAdapter;

const contextFor = (resource: { etag?: string; version: string }): MutationContext => ({
  idempotencyKey: `test-${resource.version}`,
  ifMatch: resource.etag,
  expectedVersion: resource.version,
});

describe('Automation Template management adapter', () => {
  it('lists and filters the complete template lifecycle in fixture mode', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const all = await adapter.listTemplates({ limit: 100 });
    expect(new Set(all.items.map((item) => item.status))).toEqual(new Set(['draft', 'validating', 'published', 'deprecated', 'archived']));
    expect(all.items.every((item) => item.authoritative === false)).toBe(true);
    const archived = await adapter.listTemplates({ filters: { status: 'archived' } });
    expect(archived.items).toHaveLength(1);
    expect(archived.items[0].publishedVersionId).toBeDefined();
  });

  it('uses preview, receipt and non-authoritative rehydration for a draft and validation lifecycle', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const before = await adapter.getTemplate('template-major-incident');
    const createDraft = { action: 'create_draft_version' as const, templateId: before.id, releaseNotes: 'Fixture test draft.' };
    const preview = await adapter.previewTemplateAction(createDraft);
    expect(preview.authoritative).toBe(false);
    expect(preview.operation).toBe('automation.template.create_draft_version');

    const { receipt: draftReceipt } = await adapter.executeTemplateAction(createDraft, contextFor(before));
    const draft = await adapter.refreshTemplate(before.id, draftReceipt.receiptId);
    expect(draft.status).toBe('draft');
    expect(draft.authoritative).toBe(false);

    const validate = { action: 'validate_version' as const, templateId: draft.id, versionId: draft.latestVersionId };
    const { receipt: validateReceipt } = await adapter.executeTemplateAction(validate, contextFor(draft));
    const validating = await adapter.refreshTemplate(draft.id, validateReceipt.receiptId);
    const versions = await adapter.listTemplateVersions(draft.id, { sort: [{ field: 'number', direction: 'desc' }] });
    expect(validating.status).toBe('validating');
    expect(versions.items.find((item) => item.id === draft.latestVersionId)?.status).toBe('validated');
  });

  it('requires a draft before metadata/schema/workflow writes and rejects stale ETags', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const published = await adapter.getTemplate('template-major-incident');
    const action = { action: 'save_metadata' as const, templateId: published.id, patch: { name: published.name, description: published.description, category: published.category, owner: published.owner, tags: published.tags } };
    expect((await adapter.previewTemplateAction(action)).validation).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'DRAFT_REQUIRED' })]));
    await expect(adapter.executeTemplateAction(action, contextFor(published))).rejects.toMatchObject({ normalized: { kind: 'validation' } });

    await expect(adapter.executeTemplateAction(
      { action: 'create_draft_version', templateId: published.id, releaseNotes: 'stale' },
      { idempotencyKey: 'stale', ifMatch: 'W/"stale"', expectedVersion: published.version },
    )).rejects.toMatchObject({ normalized: { kind: 'conflict' } });
  });

  it('models all six workflow node types and simulates without executing a connector', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const template = await adapter.getTemplate('template-major-incident');
    expect(new Set(template.workflow.map((node) => node.type))).toEqual(new Set(['trigger', 'condition', 'action', 'approval', 'wait', 'notification']));
    const result = await adapter.simulateTemplate({ templateId: template.id, sampleInput: { ticketId: 'INC-7001' } }, contextFor(template));
    expect(result.connectorExecuted).toBe(false);
    expect(result.authoritative).toBe(false);
    expect(result.steps.some((step) => step.nodeType === 'approval' && step.approvalGate)).toBe(true);
    expect(result.steps.some((step) => step.nodeType === 'action' && step.expectedReceipt)).toBe(true);
    expect(result.expectedReceipts.length).toBeGreaterThan(0);
    expect(result.warnings.join(' ')).toMatch(/no connector executed/i);
  });

  it('preserves unavailable runtime fields and governs mapped changes', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const before = await adapter.getRuntimeSettings();
    const unavailable = before.settings.find((setting) => setting.source === 'TBD' && setting.available === false);
    expect(unavailable).toBeDefined();
    if (unavailable) {
      const blockedPatch = { [unavailable.key]: unavailable.effectiveValue };
      expect((await adapter.previewRuntimeSettings(blockedPatch)).validation[0]?.code).toBe('BACKEND_MAPPING_TBD');
      await expect(adapter.saveRuntimeSettings(blockedPatch, contextFor(before))).rejects.toMatchObject({ normalized: { kind: 'validation' } });
    }

    const patch = { 'queue.maxConcurrency': 32 } as const;
    expect((await adapter.previewRuntimeSettings(patch)).validation).toEqual([]);
    const { receipt: queued } = await adapter.saveRuntimeSettings(patch, contextFor(before));
    const after = await adapter.refreshRuntimeSettings(queued.receiptId);
    expect(after.settings.find((setting) => setting.key === 'queue.maxConcurrency')?.effectiveValue).toBe(32);
    expect(after.authoritative).toBe(false);
  });

  it('fails closed for unmapped production template mutations and runtime settings', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: false });
    await expect(adapter.previewTemplateAction({ action: 'archive', templateId: 'template-1', reason: 'test' })).rejects.toMatchObject({ normalized: { kind: 'unavailable' } });
    await expect(adapter.getRuntimeSettings()).rejects.toMatchObject({ normalized: { kind: 'unavailable' } });
  });

  it('adds template, trigger, contract mode, duration and step trace to runs', async () => {
    const adapter = createAutomationTemplateManagementAdapter(base, { fixtureMode: true });
    const result = await adapter.listRuns({});
    expect(result.items[0]).toMatchObject({ contractMode: 'live', triggerSource: 'manual' });
    expect(result.items[0].steps.length).toBeGreaterThan(0);
    expect(result.items[0].auditCorrelationId).toBe('corr-1');
    expect(result.items[0].durationMs).toBeUndefined();
  });
});
