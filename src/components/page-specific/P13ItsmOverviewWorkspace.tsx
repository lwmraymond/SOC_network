import { useMemo, useState } from 'react';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiProgress, EuiSelect, EuiSpacer, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import { ItsmCreateTicketModal } from '../itsm/ItsmCreateTicketModal';

type Work = { id: string; type: string; summary: string; service: string; priority: string; status: string; queue: string; sla: string; soc: string; sync: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const buildWork = (rows: PrototypeRow[]): Work[] => rows.slice(0, 10).map((row, index) => ({
  id: text(row.work_item_id, `${['INC','REQ','CHG','PRB'][index % 4]}-${4200 + index}`),
  type: text(row.work_item_type, ['Incident','Request','Change','Problem'][index % 4]),
  summary: text(row.summary ?? row.title, ['Identity login degradation','Privileged access request','Endpoint policy rollout','Recurring token timeout'][index % 4]),
  service: text(row.service_ci, ['Identity','Endpoint','Customer API','Network'][index % 4]),
  priority: text(row.priority, index < 2 ? 'P1' : index < 5 ? 'P2' : 'P3'),
  status: text(row.status, ['Investigating','Awaiting owner','Approval pending','In progress'][index % 4]),
  queue: text(row.owner_queue ?? row.owner, ['Major incident','Service desk','CAB','Problem management'][index % 4]),
  sla: text(row.next_sla, index % 3 === 0 ? '18m to breach' : index % 3 === 1 ? 'At risk' : 'Within target'),
  soc: text(row.soc_links, index % 2 ? 'Case linked' : 'No SOC link'),
  sync: text(row.sync_health, index % 5 === 0 ? 'Conflict' : 'Healthy'),
}));

export function P13ItsmOverviewWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All objects');
  const [service, setService] = useState('All services');
  const [createOpen, setCreateOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const work = useMemo(() => buildWork(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => work.filter((item) => (!query.trim() || `${item.id} ${item.summary} ${item.service} ${item.queue}`.toLowerCase().includes(query.trim().toLowerCase())) && (type === 'All objects' || item.type === type) && (service === 'All services' || item.service === service)), [query, service, type, work]);
  const metrics = { critical: work.filter((item)=>['P1','P2'].includes(item.priority)&&item.type==='Incident').length, sla: work.filter((item)=>/breach|risk/i.test(item.sla)).length, unassigned: work.filter((item)=>/awaiting owner/i.test(item.status)).length, blockedChanges: work.filter((item)=>item.type==='Change'&&/pending/i.test(item.status)).length, sync: work.filter((item)=>item.sync==='Conflict').length };
  return <div className="pageComposition page-p13 differentiatedPage" data-page-specific-composition="P13-service-operations-command">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="itsm-scope-bar"><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent)=>setQuery(event.target.value)} placeholder="Work item, service, queue or SOC link" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={type} onChange={(event: ChangeEvent)=>setType(event.target.value)} options={['All objects','Incident','Request','Change','Problem'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={service} onChange={(event: ChangeEvent)=>setService(event.target.value)} options={['All services','Identity','Endpoint','Customer API','Network'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={()=>setCreateOpen(true)}>Create work item</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt&&<><EuiCallOut title="Prototype work-item receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={5}><EuiPanel paddingSize="m" hasBorder data-visual-region="service-health-command"><EuiTitle size="s"><h2>Business service health</h2></EuiTitle>{['Identity','Endpoint','Customer API','Network'].map((name,index)=><article key={name}><div className={`servicePulse pulse-${index}`} /><div><strong>{name}</strong><small>{index<2?'Degraded':'Stable'} · {3+index} active work items</small></div><div><b>{18+index*7}m</b><small>{index<2?'to SLA breach':'next checkpoint'}</small></div><EuiBadge color={index<2?'danger':'success'}>{index<2?'At risk':'Stable'}</EuiBadge></article>)}</EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="sla-pressure-lane"><EuiTitle size="xs"><h2>SLA pressure</h2></EuiTitle>{['Incident response','Request fulfilment','Change approval','Problem review'].map((label,index)=><div key={label}><span>{label}</span><EuiProgress value={82-index*14} max={100} size="s" color={index<2?'warning':'primary'} /><small>{6+index*3} items</small></div>)}</EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="typed-object-summary"><EuiTitle size="xs"><h2>Typed work objects</h2></EuiTitle>{[['P1/P2 incidents',metrics.critical],['SLA at risk',metrics.sla],['Unassigned',metrics.unassigned],['Blocked changes',metrics.blockedChanges],['Sync conflicts',metrics.sync]].map(([label,value],index)=><div key={String(label)}><strong>{String(value)}</strong><span>{String(label)}</span><EuiBadge color={index===4&&Number(value)>0?'danger':'hollow'}>{index===4?'Reconcile':'Open queue'}</EuiBadge></div>)}</EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="m" /><EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={6}><EuiPanel paddingSize="m" hasBorder data-visual-region="itsm-attention-queue"><EuiTitle size="s"><h2>Attention queue</h2></EuiTitle><table><thead><tr><th>Priority/type</th><th>ID/summary</th><th>Service</th><th>Status/queue</th><th>Next SLA</th><th>SOC/sync</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><EuiBadge color={item.priority==='P1'?'danger':item.priority==='P2'?'warning':'hollow'}>{item.priority}</EuiBadge><small>{item.type}</small></td><td><EuiButtonEmpty size="xs">{item.id}</EuiButtonEmpty><small>{item.summary}</small></td><td>{item.service}</td><td>{item.status}<small>{item.queue}</small></td><td>{item.sla}</td><td>{item.soc}<small>{item.sync}</small></td></tr>)}</tbody></table></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="change-window-collisions"><EuiTitle size="xs"><h2>Change window</h2></EuiTitle><div className="changeTimeline"><span style={{left:'8%',width:'24%'}}>Identity</span><span style={{left:'40%',width:'30%'}}>Endpoint</span><span style={{left:'66%',width:'18%'}}>Network</span></div><EuiCallOut title="2 collision risks" color="warning">Active incidents overlap planned Changes.</EuiCallOut></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="soc-itsm-sync-conflicts"><EuiTitle size="xs"><h2>SOC / ITSM sync</h2></EuiTitle>{['Owner mapping','State transition','CI identity'].map((label,index)=><div key={label}><strong>{label}</strong><span>{index+1} conflicts</span><EuiBadge color={index===0?'danger':'warning'}>Review</EuiBadge></div>)}</EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    <ItsmCreateTicketModal open={createOpen} onClose={()=>setCreateOpen(false)} onCreated={setReceipt} />
  </div>;
}
