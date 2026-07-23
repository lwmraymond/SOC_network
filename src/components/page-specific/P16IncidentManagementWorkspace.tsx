import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiModal, EuiModalBody,
  EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiProgress, EuiSelect,
  EuiSpacer, EuiStat, EuiText, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import { ItsmCreateTicketModal } from '../itsm/ItsmCreateTicketModal';

type Incident = {
  id: string; summary: string; service: string; ci: string; priority: string; impact: string;
  owner: string; status: string; sla: string; communication: string; restoration: string;
  major: boolean; socLink: string; updated: string;
};
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const normalizePriority = (value: PrototypeValue | undefined, index: number) => {
  const candidate = text(value, index < 2 ? 'P1' : index < 6 ? 'P2' : 'P3').trim().toUpperCase();
  if (['P1', 'CRITICAL', 'SEV1'].includes(candidate)) return 'P1';
  if (['P2', 'HIGH', 'SEV2'].includes(candidate)) return 'P2';
  if (['P3', 'MEDIUM', 'SEV3'].includes(candidate)) return 'P3';
  return index < 2 ? 'P1' : index < 6 ? 'P2' : 'P3';
};
const buildIncidents = (rows: PrototypeRow[]): Incident[] => rows.slice(0, 12).map((row, index) => ({
  id: text(row.incident_id, `INC-${7000 + index}`),
  summary: text(row.summary ?? row.title, ['Identity login outage','Endpoint policy failure','Customer API latency','Network path degradation'][index % 4]),
  service: text(row.service_ci, ['Identity','Endpoint','Customer API','Network'][index % 4]),
  ci: text(row.ci_ref, `CI-${420 + index}`),
  priority: normalizePriority(row.priority, index),
  impact: text(row.impact, index < 2 ? 'Enterprise' : index < 6 ? 'Multiple teams' : 'Limited'),
  owner: text(row.assignment_group ?? row.owner, ['Major incident','Identity ops','Platform','Network ops'][index % 4]),
  status: text(row.status, ['Investigating','Restoring','Monitoring','Awaiting owner'][index % 4]),
  sla: text(row.next_sla, index % 4 === 0 ? '14m to breach' : index % 4 === 1 ? 'At risk' : 'Within target'),
  communication: text(row.communication_state, index % 3 === 0 ? 'Update due' : 'Current'),
  restoration: text(row.restoration_step, ['Contain blast radius','Fail over provider','Validate service','Confirm user recovery'][index % 4]),
  major: index < 2,
  socLink: text(row.soc_case_ref, index % 2 === 0 ? `CASE-${810 + index}` : 'No SOC link'),
  updated: text(row.updated_at, `${4 + index * 3}m ago`),
}));

export function P16IncidentManagementWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('P1/P2 active');
  const [service, setService] = useState('All services');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [majorOpen, setMajorOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const incidents = useMemo(() => buildIncidents(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => incidents.filter((item) => {
    const haystack = `${item.id} ${item.summary} ${item.service} ${item.ci} ${item.owner} ${item.socLink}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (priority === 'All priorities' || (priority === 'P1/P2 active' ? ['P1','P2'].includes(item.priority) : item.priority === priority))
      && (service === 'All services' || item.service === service);
  }), [incidents, priority, query, service]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? incidents[0];
  if (!selected) return null;
  const queueAction = (label: string) => setReceipt(`${label} accepted for prototype review on ${selected.id}. Authoritative Incident state is unchanged.`);
  const metrics = {
    unrestored: incidents.filter((item) => ['P1','P2'].includes(item.priority) && item.status !== 'Monitoring').length,
    unowned: incidents.filter((item) => /awaiting owner/i.test(item.status)).length,
    slaRisk: incidents.filter((item) => /risk|breach/i.test(item.sla)).length,
    commsDue: incidents.filter((item) => item.communication === 'Update due').length,
    major: incidents.filter((item) => item.major).length,
  };

  return <div className="pageComposition page-p16 differentiatedPage" data-page-specific-composition="P16-incident-command-workspace">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="incident-scope-bar"><EuiFlexGroup gutterSize="s" alignItems="center" wrap>
      <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Incident, service, CI, owner, requester or SOC case" /></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiSelect compressed value={priority} onChange={(event: ChangeEvent) => setPriority(event.target.value)} options={['P1/P2 active','All priorities','P1','P2','P3'].map((value)=>({value,text:value}))}/></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiSelect compressed value={service} onChange={(event: ChangeEvent) => setService(event.target.value)} options={['All services','Identity','Endpoint','Customer API','Network'].map((value)=>({value,text:value}))}/></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiButton fill onClick={() => setCreateOpen(true)}>Create incident</EuiButton></EuiFlexItem>
    </EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />
    {receipt && <><EuiCallOut title="Prototype incident receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="s" wrap data-visual-region="incident-decision-summary">
      {[['P1/P2 not restored',metrics.unrestored],['Unowned',metrics.unowned],['SLA at risk',metrics.slaRisk],['Comms due',metrics.commsDue],['Major incidents',metrics.major]].map(([label,value])=><EuiFlexItem key={String(label)} style={{minWidth:170}}><EuiPanel paddingSize="s" hasBorder><EuiStat title={String(value)} description={label} titleSize="s" /></EuiPanel></EuiFlexItem>)}
    </EuiFlexGroup>
    <EuiSpacer size="m" />
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={4}><EuiPanel paddingSize="m" hasBorder data-visual-region="incident-queue"><EuiTitle size="s"><h2>Incident queue</h2></EuiTitle><EuiText size="s" color="subdued"><p>Priority, service impact, ownership, SLA and communication readiness.</p></EuiText><EuiSpacer size="s" />
        <table><thead><tr><th>Priority</th><th>Incident</th><th>Service / CI</th><th>Owner</th><th>SLA</th><th>Status</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><EuiBadge color={item.priority==='P1'?'danger':item.priority==='P2'?'warning':'hollow'}>{item.priority}</EuiBadge></td><td><EuiButtonEmpty size="xs" onClick={()=>setSelectedId(item.id)}>{item.id}</EuiButtonEmpty><small>{item.summary}</small></td><td>{item.service}<small>{item.ci}</small></td><td>{item.owner}</td><td>{item.sla}</td><td>{item.status}</td></tr>)}</tbody></table>
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={5}><EuiPanel paddingSize="m" hasBorder data-visual-region="incident-command-center"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiBadge color={selected.major?'danger':'warning'}>{selected.major?'Major incident':'Incident command'}</EuiBadge><EuiTitle size="s"><h2>{selected.summary}</h2></EuiTitle><p>{selected.id} · {selected.service} · {selected.ci}</p></EuiFlexItem><EuiFlexItem grow={false}><div className="slaClock"><strong>{selected.sla}</strong><span>{selected.communication}</span></div></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer size="m" /><div className="serviceImpactMap"><span className="impactCore">{selected.service}</span>{['Affected users','Dependent API','Support queue','SOC case'].map((label,index)=><span key={label} className={`impactNode node-${index}`}>{label}<small>{index===0?selected.impact:index===3?selected.socLink:index===1?'Degraded':'Rising'}</small></span>)}</div>
        <EuiSpacer size="m" /><EuiTitle size="xs"><h3>Restoration plan</h3></EuiTitle>{['Confirm blast radius',selected.restoration,'Validate service recovery','Obtain user confirmation'].map((step,index)=><div key={step} className="restorationStep"><b>{index+1}</b><span>{step}</span><EuiProgress value={index<2?100:index===2?55:10} max={100} size="s" color={index<2?'success':'primary'} /><EuiBadge color={index<2?'success':index===2?'warning':'hollow'}>{index<2?'Done':index===2?'Running':'Pending'}</EuiBadge></div>)}
        <EuiSpacer size="m" /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton fill onClick={()=>setMajorOpen(true)}>Declare / manage major</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButton onClick={()=>queueAction('Send stakeholder communication')}>Send communication</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={()=>setDetailOpen(true)}>Open command detail</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup>
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="incident-readiness"><EuiTitle size="xs"><h2>Command readiness</h2></EuiTitle>{[['Owner assigned',selected.owner],['SOC evidence',selected.socLink],['Communication',selected.communication],['Recovery validation','Pending'],['Problem / Change','Not linked']].map(([label,value],index)=><div key={label}><strong>{label}</strong><span>{value}</span><EuiBadge color={index<3?'success':'warning'}>{index<3?'Ready':'Review'}</EuiBadge></div>)}</EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {detailOpen && <EuiFlyout onClose={()=>setDetailOpen(false)} ownFocus size="m" aria-labelledby="p16-detail-title"><EuiFlyoutHeader><EuiTitle><h2 id="p16-detail-title">Incident command detail</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Restore is not resolve">Resolution remains blocked until service recovery, monitoring and authoritative validation are complete.</EuiCallOut><EuiSpacer/><dl><div><dt>Impact</dt><dd>{selected.impact}</dd></div><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Next SLA</dt><dd>{selected.sla}</dd></div><div><dt>Last update</dt><dd>{selected.updated}</dd></div></dl></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={()=>setDetailOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {majorOpen && <EuiModal onClose={()=>setMajorOpen(false)} aria-labelledby="p16-major-title"><EuiModalHeader><EuiModalHeaderTitle id="p16-major-title">Major incident impact review</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="High-risk prototype decision" color="warning">Declaring a major incident changes communication and command obligations; this demo only creates a queued decision receipt.</EuiCallOut><ul><li>Service: {selected.service}</li><li>Impact: {selected.impact}</li><li>Owner: {selected.owner}</li><li>Communication: {selected.communication}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={()=>setMajorOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill color="danger" onClick={()=>{queueAction('Major incident declaration');setMajorOpen(false);}}>Queue declaration</EuiButton></EuiModalFooter></EuiModal>}
    <ItsmCreateTicketModal open={createOpen} onClose={()=>setCreateOpen(false)} initialType="Incident" onCreated={setReceipt} />
  </div>;
}
