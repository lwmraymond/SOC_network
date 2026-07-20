import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture } from '../../types/prototype';
import { SecurityCommandCanvas } from '../differentiated/DashboardSurfaces';

const decisionMetrics = [
  { key: 'confirmed', label: 'Confirmed attacks', status: 'danger' as const },
  { key: 'unassigned', label: 'High-risk unassigned', status: 'warning' as const },
  { key: 'sla', label: 'SLA at risk', status: 'warning' as const },
  { key: 'entities', label: 'High-risk entities', status: 'primary' as const },
  { key: 'coverage', label: 'Required-source coverage', status: 'success' as const },
];

export function P01SecurityOperationsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(true);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const filteredRows = useMemo(() => fixture.rows.filter((row) => {
    const searchable = [row.id, row.title, row.primary_entity, row.classification, row.owner]
      .map((value) => String(value ?? ''))
      .join(' ')
      .toLowerCase();
    const matchesQuery = query.trim().length === 0 || searchable.includes(query.trim().toLowerCase());
    const matchesCritical = !criticalOnly || ['Critical', 'High'].includes(String(row.severity));
    const matchesUnassigned = !unassignedOnly || String(row.owner).toLowerCase() === 'unassigned';
    return matchesQuery && matchesCritical && matchesUnassigned;
  }), [criticalOnly, fixture.rows, query, unassignedOnly]);

  const filteredFixture = useMemo(() => ({ ...fixture, rows: filteredRows }), [filteredRows, fixture]);
  const values = {
    confirmed: Math.max(1, fixture.rows.filter((row) => String(row.classification).toLowerCase().includes('confirm')).length),
    unassigned: fixture.rows.filter((row) => ['Critical', 'High'].includes(String(row.severity)) && String(row.owner).toLowerCase() === 'unassigned').length,
    sla: fixture.rows.filter((row) => String(row.status).toLowerCase().includes('risk')).length,
    entities: new Set(fixture.rows.map((row) => String(row.primary_entity ?? row.id))).size,
    coverage: `${Math.round(fixture.coverage * 100)}%`,
  };

  return (
    <div className="pageComposition page-p01 differentiatedPage" data-page-specific-composition="P01-security-operations">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="soc-scope-command-bar">
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
          <EuiFlexItem grow={3}>
            <EuiFieldSearch
              compressed
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search case, alert, asset, user or IOC"
              aria-label="Search security work items"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFilterGroup>
              <EuiFilterButton
                withNext
                hasActiveFilters={criticalOnly}
                numActiveFilters={criticalOnly ? 1 : 0}
                onClick={() => setCriticalOnly((current) => !current)}
              >
                Critical / High
              </EuiFilterButton>
              <EuiFilterButton
                hasActiveFilters={unassignedOnly}
                numActiveFilters={unassignedOnly ? 1 : 0}
                onClick={() => setUnassignedOnly((current) => !current)}
              >
                Unassigned
              </EuiFilterButton>
            </EuiFilterGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Last 24 hours</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Tenant + permitted sites</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty size="s">More filters</EuiButtonEmpty></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButton size="s" fill>Apply scope</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued">
          <p>{filteredRows.length} of {fixture.rows.length} work items in the current normalized scope. Demo filters never mutate production data.</p>
        </EuiText>
      </EuiPanel>

      <EuiSpacer size="m" />

      <section aria-labelledby="p01-decision-summary" data-visual-region="soc-decision-summary">
        <EuiTitle size="xs"><h2 id="p01-decision-summary">Shift decision summary</h2></EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" wrap responsive={false}>
          {decisionMetrics.map((metric) => (
            <EuiFlexItem key={metric.key} grow={1} style={{ minWidth: 180 }}>
              <EuiPanel paddingSize="s" hasBorder>
                <EuiStat
                  title={String(values[metric.key as keyof typeof values])}
                  description={metric.label}
                  titleColor={metric.status}
                  textAlign="left"
                />
              </EuiPanel>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </section>

      <EuiSpacer size="m" />
      <SecurityCommandCanvas fixture={filteredFixture} />
    </div>
  );
}
