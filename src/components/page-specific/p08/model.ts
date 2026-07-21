import type { PrototypeRow, PrototypeValue } from '../../../types/prototype';

export type AssetRecord = {
  id: string;
  name: string;
  type: 'Endpoint' | 'Server' | 'Cloud workload' | 'Network device';
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  identifiers: string[];
  lifecycle: 'Active' | 'Discovered' | 'Retiring';
  health: 'Healthy' | 'Degraded' | 'Stale' | 'Unknown';
  site: string;
  owner: string;
  sources: string[];
  reconciliation: 'Canonical' | 'Conflict' | 'Unmatched';
  lastSeen: string;
  risk: number;
  exposure: string;
  observationCount: number;
};

export const assetTypes: AssetRecord['type'][] = ['Endpoint', 'Server', 'Cloud workload', 'Network device'];
export const criticalities: AssetRecord['criticality'][] = ['Critical', 'High', 'Medium', 'Low'];
export const lifecycles: AssetRecord['lifecycle'][] = ['Active', 'Active', 'Discovered', 'Retiring'];
export const healthStates: AssetRecord['health'][] = ['Healthy', 'Degraded', 'Stale', 'Unknown'];
export const sourceCoverage = [
  { source: 'Endpoint agent', canonical: 94, unmatched: 3, stale: 3 },
  { source: 'CMDB', canonical: 88, unmatched: 8, stale: 4 },
  { source: 'Cloud inventory', canonical: 91, unmatched: 4, stale: 5 },
  { source: 'Network discovery', canonical: 79, unmatched: 14, stale: 7 },
];
export const lifecycleHealth = [
  ['Active / Healthy', 6], ['Active / Degraded', 3], ['Discovered / Unknown', 2],
  ['Active / Stale', 2], ['Retiring / Healthy', 1], ['Retiring / Stale', 0],
] as const;

const sites = ['Taipei HQ', 'APAC cloud', 'Singapore DC', 'Remote estate'];
const sourceSets = [
  ['Endpoint agent', 'CMDB', 'Identity'], ['CMDB', 'Cloud inventory'],
  ['Endpoint agent'], ['Network discovery', 'CMDB'],
];
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const numeric = (value: PrototypeValue | undefined, fallback: number) => typeof value === 'number' ? value : fallback;

export function buildAssets(rows: PrototypeRow[]): AssetRecord[] {
  return rows.slice(0, 14).map((row, index) => {
    const type = assetTypes[index % assetTypes.length];
    const reconciliation: AssetRecord['reconciliation'] = index % 6 === 1 ? 'Conflict' : index % 7 === 2 ? 'Unmatched' : 'Canonical';
    const owner = index % 6 === 4 ? 'Unassigned' : text(row.owner, 'Unassigned');
    const risk = numeric(row.risk_exposure, 88 - index * 4);
    const suffix = String(index + 11).padStart(3, '0');
    return {
      id: text(row.asset_id, row.id),
      name: text(row.display_name, `${type.toLowerCase().replaceAll(' ', '-')}-${suffix}`),
      type,
      criticality: criticalities[index % criticalities.length],
      identifiers: [`host-${suffix}`, `10.24.${Math.floor(index / 4) + 1}.${20 + index}`, type === 'Cloud workload' ? `i-0a7${suffix}` : `SN-${20260 + index}`],
      lifecycle: lifecycles[index % lifecycles.length],
      health: healthStates[index % healthStates.length],
      site: sites[index % sites.length],
      owner,
      sources: sourceSets[index % sourceSets.length],
      reconciliation,
      lastSeen: text(row.last_seen_at, `2026-07-18 ${String(11 - (index % 5)).padStart(2, '0')}:${String(42 - index).padStart(2, '0')} +08`),
      risk,
      exposure: risk >= 75 ? 'High exposure' : risk >= 50 ? 'Review exposure' : 'Low exposure',
      observationCount: 2 + (index % 4),
    };
  });
}

export const badgeForHealth = (health: AssetRecord['health']) => health === 'Healthy' ? 'success' : health === 'Degraded' ? 'warning' : health === 'Stale' ? 'danger' : 'hollow';
export const badgeForCriticality = (value: AssetRecord['criticality']) => value === 'Critical' ? 'danger' : value === 'High' ? 'warning' : 'hollow';
export const badgeForReconciliation = (value: AssetRecord['reconciliation']) => value === 'Canonical' ? 'success' : value === 'Conflict' ? 'danger' : 'warning';
