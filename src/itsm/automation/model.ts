import type { AutomationTemplateLifecycle, ManagedAutomationRun, ManagedAutomationTemplate } from './contracts';

export const automationTemplateStatuses: AutomationTemplateLifecycle[] = ['draft', 'validating', 'published', 'deprecated', 'archived'];

export function templateStatusColor(status: AutomationTemplateLifecycle): 'success' | 'warning' | 'danger' | 'hollow' | 'primary' {
  if (status === 'published') return 'success';
  if (status === 'validating') return 'warning';
  if (status === 'deprecated') return 'danger';
  if (status === 'archived') return 'hollow';
  return 'primary';
}

export function dependencyHealthColor(health: ManagedAutomationTemplate['dependencyHealth']): 'success' | 'warning' | 'danger' | 'hollow' {
  if (health === 'healthy') return 'success';
  if (health === 'degraded') return 'warning';
  if (health === 'blocked') return 'danger';
  return 'hollow';
}

export function runStateColor(state: ManagedAutomationRun['state']): 'success' | 'warning' | 'danger' | 'hollow' | 'primary' {
  if (state === 'succeeded') return 'success';
  if (state === 'failed' || state === 'partial') return 'danger';
  if (state === 'running') return 'primary';
  if (state === 'queued') return 'warning';
  return 'hollow';
}

export type TemplateFilterState = {
  search: string;
  category: string;
  status: string;
  owner: string;
  dependencyHealth: string;
  publishedVersion: string;
  updated: string;
};

export const emptyTemplateFilters: TemplateFilterState = {
  search: '', category: '', status: '', owner: '', dependencyHealth: '', publishedVersion: '', updated: '',
};

export function filterTemplates(items: ManagedAutomationTemplate[], filters: TemplateFilterState): ManagedAutomationTemplate[] {
  const search = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    if (search && !`${item.id} ${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(search)) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.owner && item.owner !== filters.owner) return false;
    if (filters.dependencyHealth && item.dependencyHealth !== filters.dependencyHealth) return false;
    if (filters.publishedVersion && (filters.publishedVersion === 'published' ? !item.publishedVersionId : Boolean(item.publishedVersionId))) return false;
    if (filters.updated) {
      const ageMs = Date.now() - Date.parse(item.updatedAt);
      const limitMs = Number(filters.updated) * 86_400_000;
      if (!Number.isFinite(ageMs) || ageMs > limitMs) return false;
    }
    return true;
  });
}

export function formatDuration(durationMs?: number): string {
  if (durationMs === undefined) return '—';
  if (durationMs < 1000) return `${durationMs} ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(1)} s`;
  return `${(durationMs / 60_000).toFixed(1)} min`;
}
