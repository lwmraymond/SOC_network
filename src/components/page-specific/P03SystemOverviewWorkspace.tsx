import { useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiPanel,
  EuiProgress,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { useNavigate } from 'react-router-dom';
import type { PrototypePageFixture } from '../../types/prototype';

const modules = [
  ['Gateway', 'Healthy', 54, 38, 'success'],
  ['Analyzer', 'Degraded', 72, 66, 'warning'],
  ['Queue service', 'At risk', 91, 78, 'danger'],
  ['TicketSystem sync', 'Lagging', 63, 84, 'warning'],
  ['Object runtime', 'Healthy', 47, 31, 'success'],
  ['Connectors', 'Partial', 68, 52, 'warning'],
];

export function P03SystemOverviewWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [receipt, setReceipt] = useState<string>();
  const navigate = useNavigate();
  const visibleModules = modules.filter(([name, state]) => !query.trim() || `${name} ${state}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="systemOverviewWorkspace page-p03" data-page-specific-composition="P03-system-overview-4k">
      <EuiPanel paddingSize="m" hasBorder>
        <EuiFlexGroup alignItems="center" gutterSize="s" wrap>
          <EuiFlexItem grow={3}><EuiFieldSearch compressed value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search service, queue, connector or runtime resource" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Production</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Last 60 minutes</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty iconType="inspect" onClick={() => setReceipt('System overview fixture metrics refreshed.')}>Refresh metrics</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      {receipt && <><EuiSpacer size="m" /><EuiCallOut title="Preview receipt" color="primary">{receipt}</EuiCallOut></>}
      <EuiSpacer size="m" />

      <div className="systemOverviewMetrics">
        {[
          ['Services healthy', '18 / 22', 'success'],
          ['Queue backlog', '18.4k', 'danger'],
          ['Oldest queued', '23m', 'warning'],
          ['Ticket sync lag', '17m', 'warning'],
          ['Source coverage', `${Math.round(fixture.coverage * 100)}%`, 'primary'],
        ].map(([label, value, color]) => <EuiPanel key={label} paddingSize="s" hasBorder><EuiStat title={value} description={label} titleColor={color as 'success' | 'danger' | 'warning' | 'primary'} titleSize="s" /></EuiPanel>)}
      </div>

      <EuiSpacer size="m" />
      <div className="systemOverviewGrid">
        <EuiPanel paddingSize="m" hasBorder className="systemModuleConsumption">
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
            <EuiFlexItem><EuiTitle size="s"><h2>Module resource consumption</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Operational saturation and freshness across service boundaries.</p></EuiText></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">{visibleModules.length} modules</EuiBadge></EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <div className="systemModuleTable">
            <div className="systemModuleHeader"><span>Module</span><span>State</span><span>CPU</span><span>Memory / pressure</span></div>
            {visibleModules.map(([name, state, cpu, memory, color]) => <button type="button" key={String(name)} onClick={() => setReceipt(`Resource explorer opened for ${name}.`)}>
              <strong>{name}</strong>
              <EuiHealth color={color as 'success' | 'warning' | 'danger'}>{state}</EuiHealth>
              <span><EuiProgress value={Number(cpu)} max={100} color={Number(cpu) > 85 ? 'danger' : Number(cpu) > 65 ? 'warning' : 'primary'} size="s" /><small>{cpu}%</small></span>
              <span><EuiProgress value={Number(memory)} max={100} color={Number(memory) > 80 ? 'danger' : Number(memory) > 60 ? 'warning' : 'primary'} size="s" /><small>{memory}%</small></span>
            </button>)}
          </div>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="systemQueuePressure">
          <EuiTitle size="s"><h2>Worker runtime queue</h2></EuiTitle>
          <EuiSpacer size="s" />
          <EuiCallOut title="Degraded queue drain" color="danger">Queue drain exceeded 10 minutes; retry volume is above baseline.</EuiCallOut>
          <EuiSpacer size="m" />
          {[
            ['ingest-events', 92, '18.4k queued'],
            ['detection-runs', 71, '4.1k queued'],
            ['ticket-writeback', 64, '641 queued'],
            ['notification', 38, '118 queued'],
          ].map(([name, value, detail]) => <div className="systemQueueRow" key={String(name)}><span><strong>{name}</strong><small>{detail}</small></span><EuiProgress value={Number(value)} max={100} color={Number(value) > 85 ? 'danger' : Number(value) > 60 ? 'warning' : 'primary'} size="s" /></div>)}
          <EuiSpacer size="m" />
          <EuiButtonEmpty iconType="inspect" onClick={() => navigate('/dashboard/platform-health/queues')}>Open queue diagnostics</EuiButtonEmpty>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="systemEventStream">
          <EuiTitle size="s"><h2>System events</h2></EuiTitle>
          <EuiText size="xs" color="subdued"><p>Severity-ranked operational signals with owner and correlated resource.</p></EuiText>
          <EuiSpacer size="s" />
          {[
            ['Critical', 'Queue drain exceeded 10m', 'queue-worker-07 · 2m', 'danger'],
            ['High', 'TicketSystem writeback retry pending', 'ticket-sync · 4m', 'warning'],
            ['High', 'Fortigate east source freshness', 'connector-elk · 7m', 'warning'],
            ['Info', 'Resource allocation reconciled', 'object-runtime · 11m', 'primary'],
          ].map(([severity, title, meta, color]) => <button type="button" key={String(title)} onClick={() => setReceipt(`Event detail opened: ${title}.`)}><EuiBadge color={color as 'danger' | 'warning' | 'primary'}>{severity}</EuiBadge><span><strong>{title}</strong><small>{meta}</small></span></button>)}
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="systemTopology">
          <EuiTitle size="s"><h2>Runtime dependency path</h2></EuiTitle>
          <EuiSpacer size="m" />
          <div className="systemTopologyPath">
            {[
              ['Source', 'Fortigate east', 'warning'],
              ['Ingest', 'network-normalize', 'warning'],
              ['Queue', 'events.network', 'danger'],
              ['Consumer', 'analyzer', 'warning'],
              ['Ticket sync', 'Zammad adapter', 'warning'],
            ].map(([kind, name, color]) => <div key={String(kind)}><small>{kind}</small><strong>{name}</strong><EuiHealth color={color as 'warning' | 'danger'}>{color === 'danger' ? 'At risk' : 'Degraded'}</EuiHealth></div>)}
          </div>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="systemTicketSync">
          <EuiTitle size="s"><h2>TicketSystem sync</h2></EuiTitle>
          <EuiSpacer size="s" />
          <dl>
            <div><dt>Read projection</dt><dd><EuiHealth color="success">Healthy</EuiHealth></dd></div>
            <div><dt>Writeback</dt><dd><EuiHealth color="warning">17m lag</EuiHealth></dd></div>
            <div><dt>Recovery queue</dt><dd><EuiHealth color="warning">12 pending</EuiHealth></dd></div>
            <div><dt>Evidence sync</dt><dd><EuiHealth color="success">Fresh</EuiHealth></dd></div>
          </dl>
          <EuiSpacer size="m" />
          <EuiButtonEmpty iconType="document" onClick={() => navigate('/itsm/overview')}>Open ITSM overview</EuiButtonEmpty>
        </EuiPanel>
      </div>
    </div>
  );
}
