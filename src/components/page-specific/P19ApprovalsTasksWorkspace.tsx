import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel,
  EuiSelect, EuiSpacer, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';

type Tab='My approvals'|'My tasks'|'Team'|'History';
type Decision={key:string;id:string;kind:string;source:string;summary:string;risk:string;dueAt:string;dueState:string;requester:string;policy:string;sod:string;impact:string;nextState:string;status:string};
type ChangeEvent={target:{value:string}};
const text=(value:PrototypeValue|undefined,fallback:string)=>value===undefined?fallback:String(value);
const buildDecisions=(rows:PrototypeRow[]):Decision[]=>rows.slice(0,14).map((row,index)=>({
  key:`${row.id}:${index}`,id:text(row.approval_id??row.task_id,`${index%2?'TASK':'APR'}-${9100+index}`),kind:text(row.decision_type,['Change approval','Response action approval','Access approval','Fulfilment task'][index%4]),
  source:text(row.source_ref,[`CHG-${840+index}`,`ACT-${260+index}`,`REQ-${6400+index}`,`TASK-${9100+index}`][index%4]),summary:text(row.summary??row.title,['Approve high-risk identity rollout','Authorize endpoint isolation','Approve privileged access','Validate request fulfilment'][index%4]),
  risk:text(row.risk,index<3?'High':index<8?'Medium':'Low'),
  dueAt:text(row.due_at,`2026-07-${String(18-index%7).padStart(2,'0')} ${String(8+index).padStart(2,'0')}:00 +08`),
  dueState:text(row.due_state,index%4===0?'Overdue':index%4===1?'Due soon':'On track'),
  requester:text(row.requester,`requester-${index+1}`),
  policy:text(row.policy_ref,`policy-${12+(index%4)}@r${8+(index%3)}`),sod:text(row.sod_state,index%5===0?'Conflict':index%5===1?'Quorum required':'Clear'),impact:text(row.impact,['Production service change','Host isolation','Privileged role grant','Fulfilment completion'][index%4]),nextState:text(row.next_state,['Approved only','Queued for execution','Pending provisioning','Completed task'][index%4]),status:text(row.status,index%4===0?'Pending':index%4===1?'Claimed':'Ready'),
}));

export function P19ApprovalsTasksWorkspace({fixture}:{fixture:PrototypePageFixture}){
  const[tab,setTab]=useState<Tab>('My approvals');
  const[query,setQuery]=useState('');
  const[risk,setRisk]=useState('All risk');
  const[selectedKey,setSelectedKey]=useState<string|undefined>(undefined);
  const[decisionOpen,setDecisionOpen]=useState(false);
  const[decision,setDecision]=useState('Approve');
  const[reason,setReason]=useState('Reviewed source snapshot, policy requirements and downstream impact.');
  const[receipt,setReceipt]=useState<string|undefined>(undefined);
  const decisions=useMemo(()=>buildDecisions(fixture.rows),[fixture.rows]);
  const visible=useMemo(()=>decisions.filter((item)=>(!query.trim()||`${item.id} ${item.source} ${item.summary} ${item.requester}`.toLowerCase().includes(query.trim().toLowerCase()))&&(risk==='All risk'||item.risk===risk)&&(tab==='History'?item.status!=='Pending':true)),[decisions,query,risk,tab]);
  const selected=visible.find((item)=>item.key===selectedKey)??visible[0]??decisions[0];
  if(!selected)return null;
  const submit=()=>{setReceipt(`${decision} decision queued for ${selected.id}. The source object and any downstream execution remain authoritative and incomplete.`);setDecisionOpen(false);};
  const tabs:Tab[]=['My approvals','My tasks','Team','History'];
  return <div className="pageComposition page-p19 differentiatedPage" data-page-specific-composition="P19-governed-approval-task-queue">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="approval-tabs-scope"><EuiFlexGroup alignItems="center" gutterSize="m"><EuiFlexItem><div className="approvalTabs" role="tablist">{tabs.map((item)=><button type="button" role="tab" aria-selected={tab===item} key={item} onClick={()=>setTab(item)}>{item}</button>)}</div></EuiFlexItem><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event:ChangeEvent)=>setQuery(event.target.value)} placeholder="Decision, task, source object, requester or policy"/></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={risk} onChange={(event:ChangeEvent)=>setRisk(event.target.value)} options={['All risk','High','Medium','Low'].map((value)=>({value,text:value}))}/></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m"/>{receipt&&<><EuiCallOut title="Prototype decision receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m"/></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={4}><EuiPanel paddingSize="m" hasBorder data-visual-region="approval-task-queue"><EuiTitle size="s"><h2>{tab}</h2></EuiTitle><EuiSpacer size="s"/><div className="p19QueueTableWrap"><table><thead><tr><th>Due</th><th>Decision / task</th><th>Source</th><th>Risk</th><th>Status</th></tr></thead><tbody>{visible.map((item)=><tr key={item.key}><td><div className="p19DueCell"><time>{item.dueAt}</time><EuiBadge color={item.dueState==='Overdue'?'danger':item.dueState.startsWith('Due')?'warning':'hollow'}>{item.dueState}</EuiBadge></div></td><td><EuiButtonEmpty size="xs" onClick={()=>setSelectedKey(item.key)}>{item.id}</EuiButtonEmpty><small>{item.summary}</small></td><td>{item.source}</td><td>{item.risk}</td><td>{item.status}</td></tr>)}</tbody></table></div></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={5}><EuiPanel paddingSize="m" hasBorder data-visual-region="decision-context"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.summary}</h2></EuiTitle><p>{selected.id} · source {selected.source}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.risk==='High'?'danger':'warning'}>{selected.risk} risk</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="m"/>
        <div className="sourceSnapshot"><EuiTitle size="xs"><h3>Source snapshot</h3></EuiTitle><dl><div><dt>Requester</dt><dd>{selected.requester}</dd></div><div><dt>Requested action</dt><dd>{selected.kind}</dd></div><div><dt>Impact</dt><dd>{selected.impact}</dd></div><div><dt>Resulting state</dt><dd>{selected.nextState}</dd></div></dl></div>
        <EuiSpacer size="m"/><EuiCallOut title="Approval does not equal execution">A decision may authorize a downstream action, but completion requires a separate execution receipt and rehydration.</EuiCallOut><EuiSpacer size="m"/>
        <EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton fill onClick={()=>{setDecision('Approve');setDecisionOpen(true);}}>Review approval</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButton color="danger" onClick={()=>{setDecision('Reject');setDecisionOpen(true);}}>Review rejection</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={()=>{setDecision('Request changes');setDecisionOpen(true);}}>Request changes</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={()=>{setDecision('Delegate');setDecisionOpen(true);}}>Delegate</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup>
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="policy-sod-inspector"><EuiTitle size="xs"><h2>Policy & SoD</h2></EuiTitle>{[['Policy',selected.policy],['Separation of duties',selected.sod],['Quorum',selected.sod==='Quorum required'?'1 of 2':'Satisfied'],['Evidence freshness','4m'],['Permission','Allowed']].map(([label,value],index)=><div key={label}><strong>{label}</strong><span>{value}</span><EuiBadge color={index===1&&value==='Conflict'?'danger':index<2?'warning':'success'}>{index===1&&value==='Conflict'?'Blocked':'Checked'}</EuiBadge></div>)}</EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {decisionOpen&&<EuiModal onClose={()=>setDecisionOpen(false)} aria-labelledby="p19-decision-title"><EuiModalHeader><EuiModalHeaderTitle id="p19-decision-title">{decision} impact confirmation</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Governed prototype decision" color="warning">The demo records a decision receipt only. It cannot change the source object or execute downstream work.</EuiCallOut><ul><li>Source: {selected.source}</li><li>Impact: {selected.impact}</li><li>Policy: {selected.policy}</li><li>SoD: {selected.sod}</li></ul><EuiTextArea value={reason} onChange={(event:ChangeEvent)=>setReason(event.target.value)} rows={4}/></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={()=>setDecisionOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill color={decision==='Reject'?'danger':'primary'} isDisabled={selected.sod==='Conflict'&&decision==='Approve'} onClick={submit}>Queue {decision.toLowerCase()}</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
