import { pageSpecById } from '../catalog/pageSpecs';
import type { PrototypeMetric, PrototypePageFixture, PrototypeRow, PrototypeValue } from '../types/prototype';

export const FIXTURE_SENTINEL_SOC_UI = 'FIXTURE_SENTINEL_SOC_UI';

const statuses = ['Ready', 'Investigating', 'Approval required', 'Queued', 'At risk', 'Validated'];
const severities = ['Critical', 'High', 'Medium', 'Low'];
const owners = ['SOC Tier 2', 'Identity Ops', 'Network Response', 'Platform SRE', 'Change Control', 'Unassigned'];

const stableHash = (value: string) => [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 17);
const numberFor = (seed: string, min: number, max: number) => min + (stableHash(seed) % Math.max(1, max - min + 1));
const pick = <T,>(items: readonly T[], seed: string) => items[stableHash(seed) % items.length];

function sampleFor(field: string, pageId: string, row: number): PrototypeValue {
  const seed = `${pageId}:${field}:${row}`;
  const normalized = field.toLowerCase();
  if (/(_at|time|date|window|seen|heartbeat|signin|update|due)/.test(normalized)) return `2026-07-${String(18 - (row % 5)).padStart(2, '0')} ${String(8 + row).padStart(2, '0')}:${String(12 + row * 3).padStart(2, '0')} +08`;
  if (/(risk|score|count|coverage|rate|age|duration|lag|progress|value|cvss|epss)/.test(normalized)) return numberFor(seed, 4, 97);
  if (/(status|state|phase|lifecycle|validation|approval)/.test(normalized)) return pick(statuses, seed);
  if (/(owner|assignee|team|group|requester|approver|actor)/.test(normalized)) return pick(owners, seed);
  if (/(severity|priority|impact|urgency|criticality)/.test(normalized)) return pick(severities, seed);
  if (/(host|asset|device|ci|component|service|target)/.test(normalized)) return `asset-${String(numberFor(seed, 1, 89)).padStart(3, '0')}`;
  if (/(user|identity|principal)/.test(normalized)) return row === 2 ? '••••••' : `analyst${row + 1}@example.test`;
  if (/(source|vendor|provider|connector|dataset)/.test(normalized)) return pick(['endpoint-agent', 'identity-gateway', 'edge-firewall', 'cloud-audit', 'itsm-connector'], seed);
  if (/(id|ref|key)$/.test(normalized) || normalized.endsWith('_id')) return `${pageId.toLowerCase()}-${String(row + 1).padStart(4, '0')}`;
  if (/(title|summary|name|description|message|reason|objective)/.test(normalized)) return `${pageSpecById[pageId].title} review item ${row + 1}`;
  return `${field.replaceAll('_', ' ')} ${row + 1}`;
}

function makeMetrics(pageId: string): PrototypeMetric[] {
  const spec = pageSpecById[pageId];
  return spec.kpis.map((label, index) => {
    const value = label.toLowerCase().includes('coverage') ? `${numberFor(`${pageId}:${label}`, 82, 99)}%` : String(numberFor(`${pageId}:${label}`, 3, 94));
    return { label, value, trend: `${index % 2 === 0 ? '+' : '-'}${numberFor(`${label}:trend`, 1, 12)}%`, status: index === 0 ? 'danger' : index === 1 ? 'warning' : index === 2 ? 'good' : 'neutral' };
  });
}

export function getPrototypeFixture(pageId: string): PrototypePageFixture {
  const spec = pageSpecById[pageId];
  if (!spec) throw new Error(`Unknown prototype page: ${pageId}`);
  const fields = [...new Set(['id', ...spec.fields, ...spec.columns])].slice(0, 10);
  const rows: PrototypeRow[] = Array.from({ length: 18 }, (_, rowIndex) => {
    const row: PrototypeRow = {
      id: `${pageId.toLowerCase()}-${String(rowIndex + 1).padStart(4, '0')}`,
      status: pick(statuses, `${pageId}:status:${rowIndex}`),
      severity: pick(severities, `${pageId}:severity:${rowIndex}`),
      owner: pick(owners, `${pageId}:owner:${rowIndex}`),
    };
    fields.forEach((field) => { row[field] = sampleFor(field, pageId, rowIndex); });
    return row;
  });
  return {
    pageId,
    generatedAt: '2026-07-18T12:00:00+08:00',
    freshness: `${numberFor(`${pageId}:freshness`, 2, 28)}s`,
    coverage: numberFor(`${pageId}:coverage`, 84, 100) / 100,
    metrics: makeMetrics(pageId),
    chart: Array.from({ length: 12 }, (_, index) => ({ label: `${String(index * 2).padStart(2, '0')}:00`, value: numberFor(`${pageId}:chart:${index}`, 12, 92), secondary: numberFor(`${pageId}:chart2:${index}`, 5, 65) })),
    rows,
    timeline: Array.from({ length: 7 }, (_, index) => ({ time: `${12 - index}:0${index}`, title: `${spec.title} activity ${index + 1}`, detail: spec.actions[index % Math.max(spec.actions.length, 1)] ?? 'Reviewed context', status: pick(statuses, `${pageId}:timeline:${index}`) })),
    relationships: Array.from({ length: 6 }, (_, index) => ({ source: rows[index].id, relation: ['observed on', 'linked to', 'depends on', 'owned by'][index % 4], target: `object-${numberFor(`${pageId}:rel:${index}`, 10, 99)}` })),
  };
}
