import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { useNavigate } from 'react-router-dom';
import type { PrototypePageFixture } from '../../types/prototype';

const incidents = [
  { id: 'NSOC-1042', title: 'RDP session after impossible travel', risk: 93, confidence: 88, owner: 'IAM response', sla: '12m', status: 'Containment review', source: 'Firewall + identity' },
  { id: 'NSOC-1039', title: 'Proxy attribution missing on beaconing host', risk: 86, confidence: 74, owner: 'L2 Network', sla: '24m', status: 'Evidence gap', source: 'Proxy + EDR' },
  { id: 'NSOC-1034', title: 'East-west scan reached protected segment', risk: 79, confidence: 81, owner: 'Network SOC', sla: '41m', status: 'Investigating', source: 'NDR + CMDB' },
  { id: 'NSOC-1028', title: 'DNS tunnel pattern on unmanaged endpoint', risk: 71, confidence: 69, owner: 'Endpoint response', sla: '58m', status: 'Owner validation', source: 'DNS + asset' },
];

const timeline = [22, 31, 28, 42, 38, 65, 51, 73, 57, 84, 63, 46, 70, 54, 36, 28];

export function P01NetworkSocWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('High and critical');
  const [selected, setSelected] = useState(incidents[0]);
  const [receipt, setReceipt] = useState<string>();
  const navigate = useNavigate();
  const visible = useMemo(() => incidents.filter((item) => {
    const matchesQuery = !query.trim() || `${item.id} ${item.title} ${item.owner} ${item.source}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesRisk = risk === 'All risk' || (risk === 'Critical only' ? item.risk >= 90 : item.risk >= 70);
    return matchesQuery && matchesRisk;
  }), [query, risk]);

  return (
    <div className="networkSocWorkspace page-p01" data-page-specific-composition="P01-network-soc-4k">
      <EuiPanel paddingSize="m" hasBorder className="networkSocScope">
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
          <EuiFlexItem grow={3}><EuiFieldSearch compressed value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incident, IP, host, owner or evidence source" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiSelect compressed value={risk} onChange={(event) => setRisk(event.target.value)} options={['High and critical', 'Critical only', 'All risk'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Last 24 hours</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Global SOC · Network</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty iconType="inspect" onClick={() => setReceipt('Network SOC fixture view refreshed.')}>Refresh</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      {receipt && <><EuiSpacer size="m" /><EuiCallOut title="Preview receipt" color="primary">{receipt}</EuiCallOut></>}

      <EuiSpacer size="m" />
      <div className="networkSocMetricGrid">
        {[
          ['Critical decisions', '4', 'danger'],
          ['Evidence gaps', '7', 'warning'],
          ['Owner validation', '3', 'primary'],
          ['Source confidence', `${Math.round(fixture.coverage * 100)}%`, 'success'],
          ['Ticket handoff lag', '17m', 'warning'],
        ].map(([label, value, color]) => <EuiPanel key={label} paddingSize="s" hasBorder><EuiStat title={value} description={label} titleColor={color as 'danger' | 'warning' | 'primary' | 'success'} titleSize="s" /></EuiPanel>)}
      </div>

      <EuiSpacer size="m" />
      <div className="networkSocCockpit">
        <EuiPanel paddingSize="m" hasBorder className="networkSocDecisionQueue">
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
            <EuiFlexItem><EuiTitle size="s"><h2>Risk decision queue</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Prioritized by correlated risk, evidence confidence, ownership and SLA.</p></EuiText></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length} visible</EuiBadge></EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <div className="networkSocQueueRows">
            {visible.map((item) => <button type="button" key={item.id} className={selected.id === item.id ? 'isSelected' : ''} onClick={() => setSelected(item)}>
              <span><EuiBadge color={item.risk >= 90 ? 'danger' : 'warning'}>{item.risk}</EuiBadge></span>
              <span><strong>{item.title}</strong><small>{item.id} · {item.source}</small></span>
              <span><strong>{item.owner}</strong><small>{item.status}</small></span>
              <span><strong>{item.sla}</strong><small>SLA</small></span>
            </button>)}
          </div>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="networkSocSelected">
          <EuiBadge color={selected.risk >= 90 ? 'danger' : 'warning'}>Risk {selected.risk}</EuiBadge>
          <EuiTitle size="s"><h2>{selected.title}</h2></EuiTitle>
          <EuiText size="xs" color="subdued"><p>{selected.id} · {selected.owner} · {selected.source}</p></EuiText>
          <EuiSpacer size="m" />
          <EuiTitle size="xs"><h3>Evidence confidence</h3></EuiTitle>
          <EuiProgress value={selected.confidence} max={100} color={selected.confidence >= 80 ? 'success' : 'warning'} size="m" label={`${selected.confidence}%`} valueText={`${selected.confidence}%`} />
          <EuiSpacer size="m" />
          <div className="networkSocEvidenceList">
            <div><EuiHealth color="success">Firewall event normalized</EuiHealth><small>Source freshness 21s</small></div>
            <div><EuiHealth color="success">Identity correlation resolved</EuiHealth><small>2 related sessions</small></div>
            <div><EuiHealth color={selected.confidence < 80 ? 'warning' : 'success'}>Proxy attribution</EuiHealth><small>{selected.confidence < 80 ? 'Needs validation' : 'Resolved'}</small></div>
          </div>
          <EuiSpacer size="m" />
          <EuiFlexGroup gutterSize="s" wrap>
            <EuiFlexItem grow={false}><EuiButton fill onClick={() => setReceipt(`TicketSystem draft prepared for ${selected.id}; no ticket was created.`)}>Create incident ticket</EuiButton></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiButton onClick={() => setReceipt(`Containment approval preview opened for ${selected.id}.`)}>Request approval</EuiButton></EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="networkSocTimeline">
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
            <EuiFlexItem><EuiTitle size="s"><h2>Correlated activity timeline</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Current window compared with the previous equal-length period.</p></EuiText></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">15 minute buckets</EuiBadge></EuiFlexItem>
          </EuiFlexGroup>
          <div className="networkSocBars" aria-label="Correlated activity histogram">
            {timeline.map((height, index) => <div key={index}><span className="prior" style={{ height: `${Math.max(12, height - 14)}%` }} /><span className="current" style={{ height: `${height}%` }} /><small>{String(index * 2).padStart(2, '0')}:00</small></div>)}
          </div>
          <div className="networkSocLegend"><span><i className="current" />Current</span><span><i className="prior" />Prior</span></div>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="networkSocOwnerLoad">
          <EuiTitle size="s"><h2>Owner load</h2></EuiTitle>
          <EuiSpacer size="s" />
          {[
            ['L2 Network', 82, '7 active'],
            ['IAM response', 68, '5 active'],
            ['Endpoint response', 54, '4 active'],
            ['Cloud security', 39, '3 active'],
          ].map(([owner, value, detail]) => <div key={String(owner)}><span><strong>{owner}</strong><small>{detail}</small></span><EuiProgress value={Number(value)} max={100} color={Number(value) > 75 ? 'warning' : 'primary'} size="s" /></div>)}
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder className="networkSocHandoff">
          <EuiTitle size="s"><h2>TicketSystem / SOAR handoff</h2></EuiTitle>
          <EuiSpacer size="s" />
          {[
            ['INC-000994', 'TicketSystem linked', 'Synced 4m ago', 'success'],
            ['SOAR-2841', 'Approval preview', 'Owner validation pending', 'warning'],
            ['NOTIFY-761', 'Notification queue', 'Queued', 'primary'],
          ].map(([id, label, detail, color]) => <div key={id}><EuiBadge color={color as 'success' | 'warning' | 'primary'}>{id}</EuiBadge><span><strong>{label}</strong><small>{detail}</small></span></div>)}
          <EuiSpacer size="m" />
          <EuiButtonEmpty iconType="document" onClick={() => navigate('/itsm/queues')}>Open ITSM work queues</EuiButtonEmpty>
        </EuiPanel>
      </div>
    </div>
  );
}
