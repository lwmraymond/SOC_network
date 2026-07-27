import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiCheckbox, EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiSelect, EuiSpacer, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import { ItsmCreateTicketModal } from '../itsm/ItsmCreateTicketModal';
import { ticketDetailHref, ticketKeyForDetail, ticketKindFromLabel } from '../../itsm/navigation';

type QueueItem = { id: string; type: string; priority: string; sla: string; summary: string; service: string; status: string; owner: string; age: string; eligible: boolean; sync: string };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const buildItems = (rows: PrototypeRow[]): QueueItem[] => rows.slice(0, 14).map((row, index) => ({
  id: text(row.work_item_id, `${['INC','REQ','CHG','PRB'][index % 4]}-${5200 + index}`), type: text(row.type, ['Incident','Request','Change','Problem'][index % 4]),
  priority: text(row.priority, index < 2 ? 'P1' : index < 6 ? 'P2' : 'P3'), sla: text(row.sla_clocks, index % 4 === 0 ? '12m to breach' : index % 4 === 1 ? 'At risk' : 'Within target'),
  summary: text(row.summary ?? row.title, ['Identity outage','Access request','Endpoint rollout','Recurring service timeout'][index % 4]), service: text(row.service_ci, ['Identity','Endpoint','Customer API','Network'][index % 4]),
  status: text(row.status, ['New','In progress','Pending','Assigned'][index % 4]), owner: text(row.owner_queue ?? row.owner, ['Service desk','Major incident','CAB','Problem team'][index % 4]),
  age: text(row.age_last_update, `${12 + index * 8}m`), eligible: index % 4 !== 0, sync: text(row.sync_health, index % 6 === 0 ? 'Conflict' : 'Healthy'),
}));

export function P14WorkQueuesWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState('My urgent work');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All types');
  const [sla, setSla] = useState('All SLA');
  const [selected, setSelected] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | undefined>(undefined);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const opener = useRef<HTMLButtonElement | null>(null);
  const items = useMemo(() => buildItems(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => items.filter((item) => (!query.trim() || `${item.id} ${item.summary} ${item.service} ${item.owner}`.toLowerCase().includes(query.trim().toLowerCase())) && (type === 'All types' || item.type === type) && (sla === 'All SLA' || (sla === 'At risk' ? /risk|breach/.test(item.sla) : !/risk|breach/.test(item.sla)))), [items, query, sla, type]);
  const preview = items.find((item) => item.id === previewId) ?? visible[0] ?? items[0];
  const eligible = selected.filter((id) => items.find((item) => item.id === id)?.eligible);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const queueBulk = () => { setReceipt(`Bulk assignment queued for ${eligible.length} eligible items; ${selected.length - eligible.length} ineligible items were excluded.`); setBulkOpen(false); };
  const openDetail = (item: QueueItem) => navigate(ticketDetailHref(ticketKeyForDetail(ticketKindFromLabel(item.type), item.id), `${location.pathname}${location.search}`, 'Work Queues'));
  return <div className="pageComposition page-p14 differentiatedPage" data-page-specific-composition="P14-saved-view-queue-workbench">
    {receipt&&<><EuiCallOut title="Prototype bulk receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="saved-view-rail"><EuiTitle size="xs"><h2>Saved views</h2></EuiTitle>{['My urgent work','Unassigned P1/P2','SLA at risk','Waiting on customer','Sync conflicts'].map((name,index)=><button type="button" key={name} className={view===name?'selected':''} onClick={()=>setView(name)}><strong>{name}</strong><span>{4+index*3}</span></button>)}<EuiSpacer/><EuiButtonEmpty onClick={()=>setReceipt(`Saved view ${view} updated in prototype memory only.`)}>Save current view</EuiButtonEmpty></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={8}><EuiPanel paddingSize="m" hasBorder data-visual-region="queue-command-and-grid"><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent)=>setQuery(event.target.value)} placeholder="Work item, service, owner or summary" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={type} onChange={(event: ChangeEvent)=>setType(event.target.value)} options={['All types','Incident','Request','Change','Problem'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={sla} onChange={(event: ChangeEvent)=>setSla(event.target.value)} options={['All SLA','At risk','Within target'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={()=>setConditionOpen(true)}>Condition builder</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill iconType="document" onClick={()=>setCreateOpen(true)}>Create ticket</EuiButton></EuiFlexItem></EuiFlexGroup><EuiSpacer size="s" />
        {selected.length>0&&<EuiCallOut title={`${selected.length} selected · ${eligible.length} eligible`} color={selected.length===eligible.length?'primary':'warning'}><EuiButton size="s" fill onClick={()=>setBulkOpen(true)}>Review bulk action</EuiButton></EuiCallOut>}
        <EuiSpacer size="s" /><table><thead><tr><th>Select</th><th>Priority/SLA</th><th>Type/ID</th><th>Summary</th><th>Service</th><th>Status</th><th>Owner/queue</th><th>Age/sync</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><EuiCheckbox id={`queue-${item.id}`} checked={selected.includes(item.id)} onChange={()=>toggle(item.id)} aria-label={`Select ${item.id}`} /></td><td><EuiBadge color={item.priority==='P1'?'danger':item.priority==='P2'?'warning':'hollow'}>{item.priority}</EuiBadge><small>{item.sla}</small></td><td><EuiButtonEmpty size="xs" buttonRef={item.id===preview?.id?opener:undefined} onClick={()=>openDetail(item)}>{item.id}</EuiButtonEmpty><small>{item.type} · <button type="button" className="itsmInlinePreview" onClick={()=>setPreviewId(item.id)}>Preview</button></small></td><td>{item.summary}</td><td>{item.service}</td><td>{item.status}</td><td>{item.owner}<small>{item.eligible?'Bulk eligible':'Individual only'}</small></td><td>{item.age}<small>{item.sync}</small></td></tr>)}</tbody></table>
      </EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {previewId&&preview&&<EuiFlyout onClose={()=>{setPreviewId(undefined);requestAnimationFrame(()=>opener.current?.focus());}} ownFocus size="m" aria-labelledby="p14-preview-title"><EuiFlyoutHeader><EuiTitle><h2 id="p14-preview-title">{preview.id} · {preview.type}</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Why next?" color={/risk|breach/.test(preview.sla)?'warning':'primary'}>{preview.priority} · {preview.sla} · owner {preview.owner}</EuiCallOut><EuiSpacer/><dl><div><dt>Summary</dt><dd>{preview.summary}</dd></div><div><dt>Service</dt><dd>{preview.service}</dd></div><div><dt>Status</dt><dd>{preview.status}</dd></div><div><dt>Sync</dt><dd>{preview.sync}</dd></div></dl></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={()=>{openDetail(preview);setPreviewId(undefined);}}>Open shared ticket detail</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {conditionOpen&&<EuiFlyout onClose={()=>setConditionOpen(false)} ownFocus size="s" aria-labelledby="p14-condition-title"><EuiFlyoutHeader><EuiTitle><h2 id="p14-condition-title">Condition builder</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><p>Combine typed fields with nested AND/OR conditions. Hidden fields do not reveal counts.</p><ul><li>Priority is P1 or P2</li><li>SLA is at risk</li><li>Queue is current user team</li></ul></EuiFlyoutBody><EuiFlyoutFooter><EuiButton fill onClick={()=>setConditionOpen(false)}>Apply prototype condition</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {bulkOpen&&<EuiModal onClose={()=>setBulkOpen(false)} aria-labelledby="p14-bulk-title"><EuiModalHeader><EuiModalHeaderTitle id="p14-bulk-title">Bulk assignment impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Per-target eligibility" color="warning">Visible-page selection is not all matching results. Each item retains type-specific state and permission rules.</EuiCallOut><p>{eligible.length} eligible · {selected.length-eligible.length} excluded</p></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={()=>setBulkOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queueBulk}>Queue eligible assignments</EuiButton></EuiModalFooter></EuiModal>}
    <ItsmCreateTicketModal open={createOpen} onClose={()=>setCreateOpen(false)} onCreated={setReceipt} />
  </div>;
}
