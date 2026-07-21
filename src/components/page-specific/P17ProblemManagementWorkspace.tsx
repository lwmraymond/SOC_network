import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiModal, EuiModalBody,
  EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiProgress, EuiSelect,
  EuiSpacer, EuiText, EuiTextArea, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';

type Problem = {
  id: string; title: string; service: string; phase: string; recurrence: number; incidents: number;
  confidence: number; rootCause: string; workaround: string; knownError: string; change: string; owner: string;
};
type ChangeEvent = { target: { value: string } };
type Tab = 'Incidents' | 'RCA' | 'Workaround' | 'Permanent fix' | 'Review' | 'Audit';
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const number = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildProblems = (rows: PrototypeRow[]): Problem[] => rows.slice(0, 10).map((row,index)=>({
  id:text(row.problem_id,`PRB-${3300+index}`), title:text(row.title ?? row.summary,['Recurring token timeout','Intermittent DNS failure','Endpoint policy drift','API connection exhaustion'][index%4]),
  service:text(row.service_ci,['Identity','Network','Endpoint','Customer API'][index%4]), phase:text(row.problem_phase,['Investigation','RCA review','Known error','Permanent fix'][index%4]),
  recurrence:Math.max(2,number(row.recurrence_count,8-index)), incidents:Math.max(2,number(row.linked_incidents,12-index)), confidence:Math.min(98,number(row.cluster_confidence,88-index*5)),
  rootCause:text(row.root_cause,index%3===0?'Token cache race under provider failover':'Under investigation'), workaround:text(row.workaround,index%3===0?'Flush cache and pin provider pool':'Draft'),
  knownError:text(row.known_error,index%3===0?`KE-${180+index}`:'Not published'), change:text(row.change_ref,index%2===0?`CHG-${810+index}`:'No Change linked'), owner:text(row.owner,'Problem management'),
}));

export function P17ProblemManagementWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query,setQuery]=useState('');
  const [phase,setPhase]=useState('All phases');
  const [selectedId,setSelectedId]=useState<string|undefined>(undefined);
  const [tab,setTab]=useState<Tab>('RCA');
  const [evidenceOpen,setEvidenceOpen]=useState(false);
  const [publishOpen,setPublishOpen]=useState(false);
  const [workaround,setWorkaround]=useState('Flush the token cache and pin the provider pool while monitoring authentication error rate.');
  const [receipt,setReceipt]=useState<string|undefined>(undefined);
  const problems=useMemo(()=>buildProblems(fixture.rows),[fixture.rows]);
  const visible=useMemo(()=>problems.filter((item)=>(!query.trim()||`${item.id} ${item.title} ${item.service} ${item.rootCause} ${item.knownError}`.toLowerCase().includes(query.trim().toLowerCase()))&&(phase==='All phases'||item.phase===phase)),[phase,problems,query]);
  const selected=visible.find((item)=>item.id===selectedId)??visible[0]??problems[0];
  if(!selected)return null;
  const queue=(label:string)=>setReceipt(`${label} queued for ${selected.id}. Problem, Known Error and Change state remain authoritative elsewhere.`);
  const tabs:Tab[]=['Incidents','RCA','Workaround','Permanent fix','Review','Audit'];
  return <div className="pageComposition page-p17 differentiatedPage" data-page-specific-composition="P17-problem-known-error-workbench">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="problem-scope-bar"><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event:ChangeEvent)=>setQuery(event.target.value)} placeholder="Problem, known error, symptom, root cause, service or incident" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={phase} onChange={(event:ChangeEvent)=>setPhase(event.target.value)} options={['All phases','Investigation','RCA review','Known error','Permanent fix'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={()=>queue('Create problem from cluster')}>Create problem</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt&&<><EuiCallOut title="Prototype problem receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={3}><EuiPanel paddingSize="m" hasBorder data-visual-region="recurrence-cluster-candidates"><EuiTitle size="s"><h2>Recurrence clusters</h2></EuiTitle><EuiText size="s" color="subdued"><p>Algorithmic suggestions remain candidates until a problem manager accepts the evidence.</p></EuiText><EuiSpacer size="s" />{visible.map((item)=><button type="button" key={item.id} className={selected.id===item.id?'selected':''} onClick={()=>{setSelectedId(item.id);setTab('RCA');}}><div><EuiBadge color={item.confidence>=80?'warning':'hollow'}>{item.confidence}% cluster</EuiBadge><strong>{item.title}</strong><small>{item.service} · {item.incidents} incidents</small></div><div><b>{item.recurrence}×</b><span>{item.phase}</span></div></button>)}</EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={6}><EuiPanel paddingSize="m" hasBorder data-visual-region="problem-evidence-workbench"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.title}</h2></EuiTitle><p>{selected.id} · {selected.service} · owner {selected.owner}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="warning">{selected.phase}</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="s"/><div className="problemTabs" role="tablist">{tabs.map((item)=><button type="button" role="tab" aria-selected={tab===item} key={item} onClick={()=>setTab(item)}>{item}</button>)}</div><EuiSpacer size="m"/>
        {tab==='Incidents'&&<table><thead><tr><th>Incident</th><th>Observed symptom</th><th>Service</th><th>Resolved</th></tr></thead><tbody>{fixture.rows.slice(0,6).map((row,index)=><tr key={row.id}><td>INC-{7200+index}</td><td>{text(row.title,'Authentication timeout')}</td><td>{selected.service}</td><td>{index%2?'Yes':'Monitoring'}</td></tr>)}</tbody></table>}
        {tab==='RCA'&&<div className="rcaCanvas"><section><EuiTitle size="xs"><h3>Leading hypothesis</h3></EuiTitle><strong>{selected.rootCause}</strong><p>{selected.confidence}% evidence confidence · 3 supporting signals · 1 contradiction.</p><EuiProgress value={selected.confidence} max={100} size="s" color="warning" /></section><section><EuiTitle size="xs"><h3>Evidence chain</h3></EuiTitle>{['Incident recurrence fingerprint','Provider timeout telemetry','Cache-state divergence','Change correlation'].map((item,index)=><div key={item}><b>{index+1}</b><span>{item}</span><EuiBadge color={index<3?'success':'warning'}>{index<3?'Supports':'Review'}</EuiBadge></div>)}</section><EuiButtonEmpty onClick={()=>setEvidenceOpen(true)}>Open RCA evidence</EuiButtonEmpty></div>}
        {tab==='Workaround'&&<div><EuiCallOut title="Applicability boundary">A workaround must state scope, limitations, validation and expiry. Publication does not resolve the underlying Problem.</EuiCallOut><EuiSpacer/><EuiTextArea value={workaround} onChange={(event:ChangeEvent)=>setWorkaround(event.target.value)} rows={6}/><EuiSpacer/><EuiButton fill onClick={()=>setPublishOpen(true)}>Review known error publication</EuiButton></div>}
        {tab==='Permanent fix'&&<div className="fixLane"><article><strong>{selected.change}</strong><span>Permanent fix Change</span><EuiBadge color={selected.change.startsWith('CHG')?'primary':'warning'}>{selected.change.startsWith('CHG')?'Linked':'Missing'}</EuiBadge></article>{['Design fix','CAB approval','Implementation','Post-change validation'].map((item,index)=><div key={item}><b>{index+1}</b><span>{item}</span><EuiBadge color={index===0?'success':index===1?'warning':'hollow'}>{index===0?'Done':index===1?'Pending':'Not started'}</EuiBadge></div>)}<EuiButton onClick={()=>queue('Create permanent-fix Change')}>Create / link Change</EuiButton></div>}
        {tab==='Review'&&<div className="problemReview"><dl><div><dt>Known error</dt><dd>{selected.knownError}</dd></div><div><dt>Workaround validated</dt><dd>{selected.knownError.startsWith('KE')?'Yes':'No'}</dd></div><div><dt>Residual risk</dt><dd>Medium</dd></div><div><dt>Resolution gate</dt><dd>Permanent fix + recurrence validation</dd></div></dl><EuiButton color="danger" onClick={()=>queue('Resolve Problem review')}>Review resolution gate</EuiButton></div>}
        {tab==='Audit'&&<div>{fixture.timeline.slice(0,7).map((item)=><div key={`${item.time}-${item.title}`}><time>{item.time}</time><strong>{item.title}</strong><span>{item.detail}</span></div>)}</div>}
      </EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="known-error-governance"><EuiTitle size="xs"><h2>Known error governance</h2></EuiTitle>{[['Known error',selected.knownError],['Workaround',selected.workaround],['Permanent fix',selected.change],['Recurrence review','7 days after fix']].map(([label,value],index)=><div key={label}><strong>{label}</strong><span>{value}</span><EuiBadge color={index===0&&selected.knownError==='Not published'?'warning':'hollow'}>{index===0&&selected.knownError==='Not published'?'Pending':'Tracked'}</EuiBadge></div>)}</EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {evidenceOpen&&<EuiFlyout onClose={()=>setEvidenceOpen(false)} ownFocus size="m" aria-labelledby="p17-evidence-title"><EuiFlyoutHeader><EuiTitle><h2 id="p17-evidence-title">RCA evidence ledger</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Evidence, not certainty">Cluster confidence and hypotheses are explicitly separated from confirmed root cause.</EuiCallOut><EuiSpacer/><table><tbody>{['Telemetry trace','Incident notes','Configuration diff','Vendor advisory'].map((item,index)=><tr key={item}><td>{item}</td><td>{index<3?'Supports':'Neutral'}</td><td>rev-{8-index}</td></tr>)}</tbody></table></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={()=>setEvidenceOpen(false)}>Close</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {publishOpen&&<EuiModal onClose={()=>setPublishOpen(false)} aria-labelledby="p17-publish-title"><EuiModalHeader><EuiModalHeaderTitle id="p17-publish-title">Publish workaround / known error</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="High-impact knowledge publication" color="warning">Publication is queued only. Scope, limitations, expiry and approval remain authoritative service responsibilities.</EuiCallOut><p>{workaround}</p></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={()=>setPublishOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={()=>{queue('Known error publication');setPublishOpen(false);}}>Queue publication</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
