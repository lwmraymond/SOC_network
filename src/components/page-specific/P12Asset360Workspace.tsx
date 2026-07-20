import { useMemo, useState } from 'react';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiPanel, EuiProgress, EuiSpacer, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';

type Tab = 'Overview' | 'Timeline' | 'Security' | 'Vulnerabilities' | 'Software' | 'Relationships' | 'Audit';
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const first = (rows: PrototypeRow[]) => rows[0];

export function P12Asset360Workspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [tab, setTab] = useState<Tab>('Overview');
  const [activityOpen, setActivityOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const asset = first(fixture.rows);
  const identity = useMemo(() => ({
    id: text(asset?.asset_id ?? asset?.id, 'asset-021'), name: text(asset?.canonical_name ?? asset?.host, 'identity-api-01'), owner: text(asset?.owner, 'Platform identity'),
    criticality: text(asset?.criticality, 'Critical'), lifecycle: text(asset?.lifecycle, 'Active'), health: text(asset?.health, 'Degraded'), lastSeen: text(asset?.last_seen, '3m ago'), risk: 86,
  }), [asset]);
  const action = (label: string) => setReceipt(`${label} submitted as a prototype request for ${identity.id}; authoritative asset state is unchanged.`);
  const tabs: Tab[] = ['Overview','Timeline','Security','Vulnerabilities','Software','Relationships','Audit'];
  return <div className="pageComposition page-p12 differentiatedPage" data-page-specific-composition="P12-asset-360-entity-detail">
    {receipt && <><EuiCallOut title="Prototype asset action" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiPanel paddingSize="m" hasBorder data-visual-region="asset-identity-header"><EuiFlexGroup alignItems="center" gutterSize="m"><EuiFlexItem grow={false}><div className="assetIdentityGlyph">A</div></EuiFlexItem><EuiFlexItem><EuiTitle size="l"><h2>{identity.name}</h2></EuiTitle><p>{identity.id} · {identity.owner} · last seen {identity.lastSeen}</p><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiBadge color="danger">{identity.criticality}</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="success">{identity.lifecycle}</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="warning">{identity.health}</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">Canonical identity</EuiBadge></EuiFlexItem></EuiFlexGroup></EuiFlexItem><EuiFlexItem grow={false}><div className="assetRiskDial"><strong>{identity.risk}</strong><span>asset risk</span></div></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" /><EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="asset-source-confidence"><EuiTitle size="xs"><h2>Identity confidence</h2></EuiTitle>{['Endpoint agent','CMDB','Cloud inventory','Identity graph'].map((source,index)=><div key={source}><span>{source}</span><EuiProgress value={96-index*9} max={100} size="s" color={index===2?'warning':'primary'} /><small>{index===2?'Hostname conflict':'Authoritative'}</small></div>)}</EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={6}><EuiPanel paddingSize="m" hasBorder data-visual-region="asset-tabbed-workspace"><div className="assetTabs" role="tablist">{tabs.map((item)=><button key={item} type="button" role="tab" aria-selected={tab===item} onClick={()=>setTab(item)}>{item}</button>)}</div><EuiSpacer size="m" />
        {tab==='Overview'&&<div className="assetOverviewGrid"><article><strong>Network context</strong><span>10.24.8.31 · prod-segment-4</span><small>2 destinations under review</small></article><article><strong>Security activity</strong><span>4 alerts · 1 active case</span><small>Latest: credential misuse</small></article><article><strong>Exposure</strong><span>3 critical · 7 total</span><small>2 remediation plans</small></article><article><strong>ITSM CI</strong><span>CI-00421 · Identity API</span><small>1 active Change</small></article></div>}
        {tab==='Timeline'&&<div className="assetUnifiedTimeline">{fixture.timeline.slice(0,8).map((item)=><button type="button" key={`${item.time}-${item.title}`} onClick={()=>setActivityOpen(true)}><time>{item.time}</time><strong>{item.title}</strong><span>{item.detail}</span><EuiBadge color="hollow">{item.status}</EuiBadge></button>)}</div>}
        {tab==='Security'&&<table><thead><tr><th>Alert/case</th><th>Severity</th><th>Status</th><th>Owner</th></tr></thead><tbody>{fixture.rows.slice(0,6).map((row)=><tr key={row.id}><td>{row.id}</td><td>{row.severity}</td><td>{row.status}</td><td>{row.owner}</td></tr>)}</tbody></table>}
        {tab==='Vulnerabilities'&&<div className="assetVulnerabilityCards">{fixture.rows.slice(0,6).map((row,index)=><article key={row.id}><strong>CVE-2026-{6100+index}</strong><span>{['openssl','kernel','spring','chrome'][index%4]}</span><EuiBadge color={index<2?'danger':'warning'}>{index<2?'Critical':'High'}</EuiBadge></article>)}</div>}
        {tab==='Software'&&<table><tbody>{['openssl 3.0.8','linux kernel 6.1','nginx 1.26','java 21'].map((item,index)=><tr key={item}><td>{item}</td><td>{index===0?'Affected':'Observed'}</td><td>{2+index} sources</td></tr>)}</tbody></table>}
        {tab==='Relationships'&&<div className="assetRelationshipMap"><span className="center">{identity.name}</span>{['Identity service','VPN','Case-1024','CHG-718','Owner team','Cloud account'].map((item,index)=><span key={item} style={{left:`${10+(index%3)*36}%`,top:`${18+Math.floor(index/3)*55}%`}}>{item}</span>)}</div>}
        {tab==='Audit'&&<div className="assetAuditLedger">{fixture.timeline.slice(0,6).map((item,index)=><div key={`${item.time}-${index}`}><time>{item.time}</time><strong>{index%2?'Field reconciliation':'Action request'}</strong><span>{item.title}</span></div>)}</div>}
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="asset-context-actions"><EuiTitle size="xs"><h2>Context actions</h2></EuiTitle><EuiButton fill fullWidth onClick={()=>action('Request response action')}>Request response action</EuiButton><EuiSpacer size="s"/><EuiButton fullWidth onClick={()=>action('Create case')}>Create case</EuiButton><EuiSpacer size="s"/><EuiButton fullWidth onClick={()=>action('Create ITSM work item')}>Create ITSM work item</EuiButton><EuiSpacer size="s"/><EuiButtonEmpty onClick={()=>setEditOpen(true)}>Suggest identity correction</EuiButtonEmpty></EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {activityOpen&&<EuiFlyout onClose={()=>setActivityOpen(false)} ownFocus size="m" aria-labelledby="p12-activity-title"><EuiFlyoutHeader><EuiTitle><h2 id="p12-activity-title">Activity detail</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Unified context">Security, vulnerability, response and ITSM events retain source provenance and timestamps.</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={()=>setActivityOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {editOpen&&<EuiFlyout onClose={()=>setEditOpen(false)} ownFocus size="s" aria-labelledby="p12-edit-title"><EuiFlyoutHeader><EuiTitle><h2 id="p12-edit-title">Suggest identity correction</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><p>Submit a field-level proposal with evidence; this prototype does not mutate CMDB or canonical identity.</p></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={()=>setEditOpen(false)}>Cancel</EuiButton><EuiButton fill onClick={()=>{setEditOpen(false);action('Identity correction');}}>Queue proposal</EuiButton></EuiFlyoutFooter></EuiFlyout>}
  </div>;
}
