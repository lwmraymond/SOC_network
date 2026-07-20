import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiLink,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { useNavigate } from 'react-router-dom';
import type { PrototypePageFixture, PrototypeRow } from '../../types/prototype';
import { ParentWorkflowLinks } from '../ParentWorkflowLinks';

const dependencyStages = [
  { label: 'Source', detail: 'edge-firewall', state: 'Ready', color: 'success' as const },
  { label: 'Pipeline', detail: 'network-normalize', state: 'Degraded', color: 'warning' as const },
  { label: 'Queue', detail: 'events.network', state: 'At risk', color: 'danger' as const },
  { label: 'Service', detail: 'event-search', state: 'Degraded', color: 'warning' as const },
  { label: 'Capability', detail: 'network detection', state: 'Partial', color: 'warning' as const },
];

function healthIssues(rows: PrototypeRow[]) {
  return rows.slice(0, 6).map((row, index) => ({
    ...row,
    component: String(row.component_ref ?? row.id),
    domain: String(row.domain ?? ['Ingestion', 'Queue', 'Search', 'Detection'][index % 4]),
    impact: String(row.impact ?? (index < 2 ? 'High' : 'Medium')),
    lag: Number(row.freshness_lag_ms ?? 2400 + index * 900),
    burn: Number(row.slo_burn_rate ?? 1.2 + index * 0.4),
    recovery: String(row.active_recovery ?? ['Investigating', 'Scaling workers', 'Rollback ready'][index % 3]),
    change: String(row.related_change ?? `CHG-${String(1042 + index).padStart(5, '0')}`),
  }));
}

export function P03PlatformHealthWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [environment, setEnvironment] = useState('Production');
  const [domain, setDomain] = useState('All health domains');
  const [query, setQuery] = useState('');
  const [changeRelated, setChangeRelated] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ReturnType<typeof healthIssues>[number] | null>(null);
  const navigate = useNavigate();

  const issues = useMemo(() => healthIssues(fixture.rows).filter((issue) => {
    const matchesDomain = domain === 'All health domains' || issue.domain === domain;
    const matchesQuery = !query.trim() || `${issue.component} ${issue.domain} ${issue.status} ${issue.owner}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesDomain && matchesQuery;
  }), [domain, fixture.rows, query]);

  const maxLag = Math.max(...issues.map((issue) => issue.lag), 0);
  const oldestQueueMinutes = 19 + issues.length * 3;
  const errorRate = 2.4 + issues.length * 0.3;

  return (
    <div className="pageComposition page-p03 differentiatedPage" data-page-specific-composition="P03-platform-health">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="platform-health-scope">
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
          <EuiFlexItem grow={false} style={{ minWidth: 150 }}><EuiSelect compressed aria-label="Environment" value={environment} onChange={(event) => setEnvironment(event.target.value)} options={['Production', 'Disaster recovery', 'Staging'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
          <EuiFlexItem grow={false} style={{ minWidth: 190 }}><EuiSelect compressed aria-label="Health domain" value={domain} onChange={(event) => setDomain(event.target.value)} options={['All health domains', 'Ingestion', 'Queue', 'Search', 'Detection'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
          <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search service, queue or connector" aria-label="Search platform health components" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiFilterGroup><EuiFilterButton hasActiveFilters={changeRelated} numActiveFilters={changeRelated ? 1 : 0} onClick={() => setChangeRelated((value) => !value)}>Related to change</EuiFilterButton></EuiFilterGroup></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Last 60 minutes</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      <ParentWorkflowLinks links={[{ label: 'H11 Service logs', to: '/dashboard/platform-health/services/service-001/logs' }, { label: 'H12 Runtime queues', to: '/dashboard/platform-health/queues' }, { label: 'H13 Connectors', to: '/dashboard/platform-health/connectors' }]} />
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
        <EuiFlexItem grow={4}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="active-degradation-chain">
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}><EuiFlexItem><EuiBadge color="danger">Active degradation</EuiBadge><EuiTitle size="s"><h2>Network telemetry dependency path</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Trace the first unhealthy stage and downstream capability impact before choosing a recovery action.</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{environment}</EuiBadge></EuiFlexItem></EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>{dependencyStages.map((stage, index) => <EuiFlexItem key={stage.label} grow={1}><EuiPanel paddingSize="s" hasBorder color={index === 2 ? 'subdued' : 'plain'}><EuiText size="xs" color="subdued"><p>{stage.label}</p></EuiText><strong>{stage.detail}</strong><EuiSpacer size="s" /><EuiHealth color={stage.color}>{stage.state}</EuiHealth></EuiPanel>{index < dependencyStages.length - 1 && <div aria-hidden="true" style={{ textAlign: 'right', margin: '-42px -14px 0 0', position: 'relative', zIndex: 2 }}>→</div>}</EuiFlexItem>)}</EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiCallOut title="Likely failure origin" color="warning">Queue consumer lag began seven minutes after change CHG-01042. Network detections and event search freshness are affected; case writes remain healthy.</EuiCallOut>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="recovery-decision">
            <EuiTitle size="s"><h2>Recovery decision</h2></EuiTitle><EuiSpacer size="s" /><EuiText size="s"><p><strong>Recommended:</strong> scale queue workers, validate recovery, then decide whether rollback is still required.</p></EuiText><EuiSpacer size="m" />
            <EuiButtonEmpty iconType="inspect" onClick={() => navigate('/dashboard/platform-health/queues')}>Inspect queue health</EuiButtonEmpty>
            <EuiButtonEmpty iconType="document" onClick={() => navigate('/dashboard/platform-health/services/service-001/logs')}>Review service logs</EuiButtonEmpty>
            <EuiButtonEmpty iconType="merge" onClick={() => navigate('/dashboard/platform-health/connectors')}>Test connectors</EuiButtonEmpty>
            <EuiSpacer size="m" /><EuiCallOut title="Simulation only" color="primary">Pause, restart, scale and rollback actions require governed production services. This Demo does not execute them.</EuiCallOut>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <section aria-labelledby="p03-telemetry" data-visual-region="platform-telemetry"><EuiTitle size="xs"><h2 id="p03-telemetry">Queue and source telemetry</h2></EuiTitle><EuiSpacer size="s" /><EuiFlexGroup gutterSize="m" responsive={false}>
        <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Maximum ingestion lag</p></EuiText><EuiTitle size="m"><h3>{Math.round(maxLag / 1000)}s</h3></EuiTitle><EuiProgress value={Math.min(maxLag, 12000)} max={12000} color={maxLag > 6000 ? 'danger' : 'warning'} size="s" /><EuiText size="xs"><p>Network pipeline is outside the 5s budget.</p></EuiText></EuiPanel></EuiFlexItem>
        <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Oldest queued work</p></EuiText><EuiTitle size="m"><h3>{oldestQueueMinutes}m</h3></EuiTitle><EuiProgress value={oldestQueueMinutes} max={60} color={oldestQueueMinutes > 30 ? 'danger' : 'warning'} size="s" /><EuiText size="xs"><p>Retry volume is increasing faster than consumption.</p></EuiText></EuiPanel></EuiFlexItem>
        <EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Error rate</p></EuiText><EuiTitle size="m"><h3>{errorRate.toFixed(1)}%</h3></EuiTitle><EuiProgress value={errorRate} max={10} color={errorRate > 5 ? 'danger' : 'warning'} size="s" /><EuiText size="xs"><p>Most failures are classified as consumer timeouts.</p></EuiText></EuiPanel></EuiFlexItem>
      </EuiFlexGroup></section>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
        <EuiFlexItem grow={3}><EuiPanel paddingSize="m" hasBorder data-visual-region="health-issue-queue"><EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}><EuiFlexItem><EuiTitle size="s"><h2>Recovery action queue</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Issues are ordered by dependency impact and recovery readiness.</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{issues.length} visible</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="s" /><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left' }}>Impact</th><th style={{ textAlign: 'left' }}>Domain / component</th><th>Status</th><th>Freshness</th><th>SLO burn</th><th style={{ textAlign: 'left' }}>Owner</th><th style={{ textAlign: 'left' }}>Recovery</th><th>Detail</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.id}><td><EuiBadge color={issue.impact === 'High' ? 'danger' : 'warning'}>{issue.impact}</EuiBadge></td><td><strong>{issue.domain}</strong><br /><small>{issue.component}</small></td><td style={{ textAlign: 'center' }}>{String(issue.status)}</td><td style={{ textAlign: 'center' }}>{Math.round(issue.lag / 1000)}s</td><td style={{ textAlign: 'center' }}>{issue.burn.toFixed(1)}×</td><td>{String(issue.owner)}</td><td>{issue.recovery}</td><td style={{ textAlign: 'center' }}><EuiLink onClick={() => setSelectedIssue(issue)}>Inspect</EuiLink></td></tr>)}</tbody></table></div></EuiPanel></EuiFlexItem>
        <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="affected-capabilities"><EuiTitle size="s"><h2>Affected security capabilities</h2></EuiTitle><EuiSpacer size="s" />{[['Event search freshness', 'Degraded', 'warning'], ['Network detection coverage', 'Partial', 'warning'], ['Alert projection latency', 'At risk', 'danger'], ['Case write path', 'Healthy', 'success']].map(([capability, status, color]) => <EuiPanel key={capability} paddingSize="s" hasBorder style={{ marginBottom: 10 }}><EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}><EuiFlexItem><strong>{capability}</strong></EuiFlexItem><EuiFlexItem grow={false}><EuiHealth color={color}>{status}</EuiHealth></EuiFlexItem></EuiFlexGroup></EuiPanel>)}</EuiPanel></EuiFlexItem>
      </EuiFlexGroup>
      {selectedIssue && <EuiFlyout ownFocus size="m" onClose={() => setSelectedIssue(null)} aria-labelledby="p03-health-issue-title"><EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p03-health-issue-title">{selectedIssue.component}</h2></EuiTitle><EuiText size="s" color="subdued"><p>{selectedIssue.domain} health issue · {selectedIssue.change}</p></EuiText></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Diagnostic context" color="warning">This flyout presents fixture diagnostics only. Test, restart, pause and rollback require production validation and receipts.</EuiCallOut><EuiSpacer size="m" /><EuiFlexGroup gutterSize="m" responsive={false}><EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>Freshness lag</p></EuiText><EuiTitle size="s"><h3>{Math.round(selectedIssue.lag / 1000)}s</h3></EuiTitle></EuiPanel></EuiFlexItem><EuiFlexItem><EuiPanel paddingSize="m" hasBorder><EuiText size="xs" color="subdued"><p>SLO burn</p></EuiText><EuiTitle size="s"><h3>{selectedIssue.burn.toFixed(1)}×</h3></EuiTitle></EuiPanel></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m" /><EuiTitle size="xs"><h3>Recovery evidence</h3></EuiTitle><ul><li>Change correlation: {selectedIssue.change}</li><li>Active recovery: {selectedIssue.recovery}</li><li>Owner: {String(selectedIssue.owner)}</li><li>Current state: {String(selectedIssue.status)}</li></ul></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={() => setSelectedIssue(null)}>Close diagnostic context</EuiButtonEmpty></EuiFlyoutFooter></EuiFlyout>}
    </div>
  );
}
