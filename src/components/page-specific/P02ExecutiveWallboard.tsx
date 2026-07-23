import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow } from '../../types/prototype';

const businessUnits = ['All business units', 'Identity services', 'Network services', 'Endpoint operations', 'Cloud platform'];
const comparisonOptions = ['Prior period', 'Quarter target', 'Risk appetite'];

function numericMetric(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function managementRows(rows: PrototypeRow[]) {
  return rows.slice(0, 5).map((row, index) => ({
    id: row.id,
    priority: index < 2 ? 'Board attention' : index < 4 ? 'Executive watch' : 'Track',
    businessUnit: String(row.business_unit ?? businessUnits[(index % (businessUnits.length - 1)) + 1]),
    issue: String(row.management_action ?? row.title ?? `Management commitment ${index + 1}`),
    actual: `${64 + index * 5}%`,
    target: `${78 + index * 3}%`,
    owner: String(row.owner),
    targetDate: String(row.target_date ?? `2026-08-${String(8 + index * 3).padStart(2, '0')}`),
    status: String(row.status),
  }));
}

export function P02ExecutiveWallboard({ fixture }: { fixture: PrototypePageFixture }) {
  const [period, setPeriod] = useState('Current quarter');
  const [businessUnit, setBusinessUnit] = useState(businessUnits[0]);
  const [comparison, setComparison] = useState(comparisonOptions[0]);
  const [search, setSearch] = useState('');
  const [definitionOpen, setDefinitionOpen] = useState(false);

  const rows = useMemo(() => managementRows(fixture.rows).filter((row) => {
    if (!search.trim()) return true;
    const haystack = `${row.businessUnit} ${row.issue} ${row.owner} ${row.status}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  }), [fixture.rows, search]);

  const kpis = fixture.metrics.slice(0, 6);
  const riskValue = numericMetric(kpis[0]?.value ?? '68');
  const responseValue = numericMetric(kpis[2]?.value ?? '54');
  const coverageValue = Math.round(fixture.coverage * 100);
  const chartPoints = fixture.chart.slice(0, 10);
  const polylinePoints = chartPoints.map((point, index) => {
    const x = 24 + index * 68;
    const y = 158 - Math.max(10, Math.min(135, point.value * 1.35));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="pageComposition page-p02 differentiatedPage" data-page-specific-composition="P02-executive-wallboard">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="executive-scope-bar">
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
          <EuiFlexItem grow={false} style={{ minWidth: 170 }}>
            <EuiSelect compressed aria-label="Executive report period" value={period} onChange={(event) => setPeriod(event.target.value)} options={['Current quarter', 'Prior quarter', 'Year to date'].map((value) => ({ value, text: value }))} />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 190 }}>
            <EuiSelect compressed aria-label="Business unit scope" value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)} options={businessUnits.map((value) => ({ value, text: value }))} />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 160 }}>
            <EuiSelect compressed aria-label="Comparison baseline" value={comparison} onChange={(event) => setComparison(event.target.value)} options={comparisonOptions.map((value) => ({ value, text: value }))} />
          </EuiFlexItem>
          <EuiFlexItem grow={2}><EuiFieldSearch compressed value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter management commitments" aria-label="Filter management commitments" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Confidence ≥ 85%</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty size="s" onClick={() => setDefinitionOpen(true)}>Metric definitions</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="m" />

      <section aria-labelledby="p02-executive-posture" data-visual-region="executive-posture-hero">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiFlexGroup className="p02PostureLayout" alignItems="flexStart" gutterSize="l" responsive={false}>
            <EuiFlexItem grow={3}>
              <EuiBadge color={riskValue > 70 ? 'warning' : 'success'}>Executive posture · {period}</EuiBadge>
              <EuiSpacer size="s" />
              <EuiTitle size="m"><h2 id="p02-executive-posture">Risk is easing; identity and network remain above appetite.</h2></EuiTitle>
              <EuiSpacer size="s" />
              <EuiText size="s" color="subdued"><p>{businessUnit} · critical-case pressure is down; two cross-functional commitments remain overdue.</p></EuiText>
              <EuiSpacer size="m" />
              <EuiFlexGroup className="p02KpiStrip" gutterSize="m" wrap responsive={false}>
                <EuiFlexItem style={{ minWidth: 190 }}><EuiStat title={`${riskValue}`} description="Business risk index" titleColor={riskValue > 70 ? 'warning' : 'primary'} /></EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 190 }}><EuiStat title={`${responseValue}m`} description="Median response outcome" titleColor={responseValue > 60 ? 'warning' : 'success'} /></EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 190 }}><EuiStat title={`${coverageValue}%`} description="Critical-source confidence" titleColor={coverageValue < 90 ? 'warning' : 'success'} /></EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem className="p02DecisionRail" grow={1} style={{ minWidth: 260 }}>
              <EuiCallOut title="Decision needed" color="warning">Add identity-response coverage, then remediate or accept the remaining network exposure before the next review.</EuiCallOut>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </section>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
        <EuiFlexItem grow={3}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="business-risk-trend">
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
              <EuiFlexItem><EuiTitle size="s"><h2>Business risk trend</h2></EuiTitle><EuiText size="xs" color="subdued"><p>One executive trend with exact values below.</p></EuiText></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiBadge color="success">Improving 8%</EuiBadge></EuiFlexItem>
            </EuiFlexGroup>
            <svg viewBox="0 0 660 190" role="img" aria-label="Quarterly business risk trend" style={{ width: '100%', minHeight: 210 }}>
              <line x1="20" y1="160" x2="650" y2="160" stroke="currentColor" opacity="0.24" />
              <line x1="20" y1="75" x2="650" y2="75" stroke="currentColor" opacity="0.15" strokeDasharray="5 6" />
              <polyline points={polylinePoints} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
              {chartPoints.map((point, index) => {
                const [x, y] = polylinePoints.split(' ')[index].split(',');
                return <g key={`${point.label}-${index}`}><circle cx={x} cy={y} r="5" fill="currentColor" /><text x={x} y="181" textAnchor="middle" fontSize="10" fill="currentColor">{point.label}</text></g>;
              })}
            </svg>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Period</th><th style={{ textAlign: 'right' }}>Risk index</th><th style={{ textAlign: 'right' }}>Prior</th></tr></thead>
              <tbody>{chartPoints.slice(-5).map((point) => <tr key={point.label}><td>{point.label}</td><td style={{ textAlign: 'right' }}>{point.value}</td><td style={{ textAlign: 'right' }}>{point.secondary ?? '—'}</td></tr>)}</tbody>
            </table>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem grow={2}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="business-unit-risk-heatmap">
            <EuiTitle size="s"><h2>Business-unit pressure</h2></EuiTitle>
            <EuiSpacer size="s" />
            {businessUnits.slice(1).map((unit, index) => {
              const risk = 82 - index * 11;
              return <div key={unit} style={{ marginBottom: 16 }}>
                <EuiFlexGroup justifyContent="spaceBetween" responsive={false} gutterSize="s"><EuiFlexItem><strong>{unit}</strong></EuiFlexItem><EuiFlexItem grow={false}><EuiHealth color={risk > 70 ? 'danger' : risk > 55 ? 'warning' : 'success'}>{risk > 70 ? 'Above appetite' : risk > 55 ? 'Watch' : 'Within appetite'}</EuiHealth></EuiFlexItem></EuiFlexGroup>
                <EuiProgress value={risk} max={100} color={risk > 70 ? 'danger' : risk > 55 ? 'warning' : 'success'} size="s" />
              </div>;
            })}
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiPanel paddingSize="m" hasBorder data-visual-region="management-commitments">
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
          <EuiFlexItem><EuiTitle size="s"><h2>Management commitments</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Only actions requiring executive ownership or risk acceptance are shown.</p></EuiText></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">{rows.length} visible</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'left' }}>Priority</th><th style={{ textAlign: 'left' }}>Business unit</th><th style={{ textAlign: 'left' }}>Issue / action</th><th>Actual / target</th><th style={{ textAlign: 'left' }}>Owner</th><th>Target date</th><th>Status</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><td><EuiBadge color={row.priority === 'Board attention' ? 'danger' : row.priority === 'Executive watch' ? 'warning' : 'hollow'}>{row.priority}</EuiBadge></td><td>{row.businessUnit}</td><td>{row.issue}</td><td style={{ textAlign: 'center' }}>{row.actual} / {row.target}</td><td>{row.owner}</td><td style={{ textAlign: 'center' }}>{row.targetDate}</td><td style={{ textAlign: 'center' }}>{row.status}</td></tr>)}</tbody>
          </table>
        </div>
      </EuiPanel>

      {definitionOpen && <EuiFlyout ownFocus onClose={() => setDefinitionOpen(false)} aria-labelledby="p02-metric-definition-title" size="s">
        <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p02-metric-definition-title">Executive metric definitions</h2></EuiTitle></EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiCallOut title="Prototype definition boundary" color="warning">Definitions are design fixtures. Production metric ownership, exclusions and source contracts remain blocked.</EuiCallOut>
          <EuiSpacer size="m" />
          {['Business risk index', 'Median response outcome', 'Critical-source confidence'].map((metric, index) => <EuiPanel key={metric} paddingSize="m" hasBorder style={{ marginBottom: 12 }}><EuiTitle size="xs"><h3>{metric}</h3></EuiTitle><EuiText size="s"><p>{['Weighted exposure, major-case pressure and business criticality compared with risk appetite.', 'Elapsed time from qualified detection to risk-contained outcome; cancelled work is excluded.', 'Coverage of mandatory endpoint, identity, network and cloud sources after late-data exclusions.'][index]}</p></EuiText><EuiBadge color="hollow">Owner: {['Risk governance', 'SOC operations', 'Platform data quality'][index]}</EuiBadge></EuiPanel>)}
        </EuiFlyoutBody>
        <EuiFlyoutFooter><EuiButtonEmpty onClick={() => setDefinitionOpen(false)}>Close definitions</EuiButtonEmpty></EuiFlyoutFooter>
      </EuiFlyout>}
    </div>
  );
}
