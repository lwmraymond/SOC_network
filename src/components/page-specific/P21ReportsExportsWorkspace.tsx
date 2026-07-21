import { useMemo, useState } from 'react';
import {
  EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem,
  EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel,
  EuiProgress, EuiSelect, EuiSpacer, EuiStat, EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';

type Template={id:string;name:string;scope:string;metrics:string;classification:string;format:string};
type Job={id:string;template:string;creator:string;status:string;stage:string;progress:number;artifact:string;checksum:string;classification:string;expiry:string;delivery:string;created:string};
type ChangeEvent={target:{value:string}};
type WizardStep='Scope'|'Metrics'|'Preview'|'Delivery';
const text=(value:PrototypeValue|undefined,fallback:string)=>value===undefined?fallback:String(value);
const number=(value:PrototypeValue|undefined,fallback:number)=>Number.isFinite(Number(value))?Number(value):fallback;
const templates:Template[]=[
  {id:'RPT-T01',name:'Service operations review',scope:'ITSM work items',metrics:'SLA, backlog, MTTR',classification:'Internal',format:'PDF + CSV'},
  {id:'RPT-T02',name:'Major incident evidence pack',scope:'Major incident + timeline',metrics:'Impact, communications, recovery',classification:'Confidential',format:'PDF'},
  {id:'RPT-T03',name:'Change assurance report',scope:'Changes + approvals',metrics:'Risk, collisions, outcomes',classification:'Internal',format:'PDF + JSON'},
  {id:'RPT-T04',name:'Remediation portfolio export',scope:'Exposure + remediation',metrics:'Risk reduction, validation',classification:'Restricted',format:'CSV'},
];
const buildJobs=(rows:PrototypeRow[]):Job[]=>rows.slice(0,12).map((row,index)=>({
  id:text(row.report_job_id,`RPT-${9700+index}`),template:text(row.template,templates[index%templates.length].name),creator:text(row.creator??row.owner,`analyst-${index%4+1}`),
  status:text(row.status,['Queued','Running','Completed','Failed'][index%4]),stage:text(row.stage,['Scope snapshot','Metric evaluation','Artifact creation','Delivery'][index%4]),progress:Math.min(100,number(row.progress,[10,55,100,72][index%4])),
  artifact:text(row.artifact_uri,index%4===2?`artifact-${9700+index}.pdf`:'Pending'),checksum:text(row.checksum,index%4===2?`sha256:${String(index+11).repeat(8)}`:'—'),classification:text(row.classification,templates[index%templates.length].classification),expiry:text(row.expiry,index%4===2?'Expires in 7d':'Not available'),delivery:text(row.delivery,index%4===3?'Retry available':index%4===2?'Delivered to secure inbox':'Pending'),created:text(row.created_at,`${index+1}h ago`),
}));

export function P21ReportsExportsWorkspace({fixture}:{fixture:PrototypePageFixture}){
  const[query,setQuery]=useState('');
  const[status,setStatus]=useState('All statuses');
  const[selectedId,setSelectedId]=useState<string|undefined>(undefined);
  const[wizardOpen,setWizardOpen]=useState(false);
  const[step,setStep]=useState<WizardStep>('Scope');
  const[selectedTemplate,setSelectedTemplate]=useState<Template>(templates[0]);
  const[receipt,setReceipt]=useState<string|undefined>(undefined);
  const jobs=useMemo(()=>buildJobs(fixture.rows),[fixture.rows]);
  const visible=useMemo(()=>jobs.filter((item)=>(!query.trim()||`${item.id} ${item.template} ${item.creator} ${item.delivery}`.toLowerCase().includes(query.trim().toLowerCase()))&&(status==='All statuses'||item.status===status)),[jobs,query,status]);
  const selected=visible.find((item)=>item.id===selectedId)??visible[0]??jobs[0];
  if(!selected)return null;
  const steps:WizardStep[]=['Scope','Metrics','Preview','Delivery'];
  const queue=(label:string)=>setReceipt(`${label} queued for ${selected.id}. Artifact generation and delivery remain asynchronous and authoritative.`);
  const create=()=>{setReceipt(`${selectedTemplate.name} report job queued with a frozen query/metric revision. No artifact exists until the worker receipt completes.`);setWizardOpen(false);setStep('Scope');};
  return <div className="pageComposition page-p21 differentiatedPage" data-page-specific-composition="P21-report-jobs-wizard">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="report-job-scope"><EuiFlexGroup alignItems="center" gutterSize="s" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event:ChangeEvent)=>setQuery(event.target.value)} placeholder="Report job, template, creator, schedule or recipient"/></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={status} onChange={(event:ChangeEvent)=>setStatus(event.target.value)} options={['All statuses','Queued','Running','Completed','Failed'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={()=>setWizardOpen(true)}>Create report</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m"/>{receipt&&<><EuiCallOut title="Prototype report receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m"/></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="report-template-catalog"><EuiTitle size="s"><h2>Report templates</h2></EuiTitle>{templates.map((template)=><button type="button" key={template.id} className={selectedTemplate.id===template.id?'selected':''} onClick={()=>{setSelectedTemplate(template);setWizardOpen(true);}}><EuiBadge color="hollow">{template.classification}</EuiBadge><strong>{template.name}</strong><span>{template.scope}</span><small>{template.metrics} · {template.format}</small></button>)}</EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={5}><EuiPanel paddingSize="m" hasBorder data-visual-region="report-job-center"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Recent report jobs</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiStat title={String(jobs.filter((item)=>item.status==='Running'||item.status==='Queued').length)} description="Active jobs" titleSize="s"/></EuiFlexItem></EuiFlexGroup><EuiSpacer size="s"/><table><thead><tr><th>Job</th><th>Template</th><th>Status / stage</th><th>Progress</th><th>Classification</th><th>Created</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><EuiButtonEmpty size="xs" onClick={()=>setSelectedId(item.id)}>{item.id}</EuiButtonEmpty></td><td>{item.template}</td><td><EuiBadge color={item.status==='Completed'?'success':item.status==='Failed'?'danger':'warning'}>{item.status}</EuiBadge><small>{item.stage}</small></td><td><EuiProgress value={item.progress} max={100} size="s" color={item.status==='Failed'?'danger':'primary'}/><small>{item.progress}%</small></td><td>{item.classification}</td><td>{item.created}</td></tr>)}</tbody></table></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={3}><EuiPanel paddingSize="m" hasBorder data-visual-region="artifact-delivery-detail"><EuiTitle size="s"><h2>{selected.id}</h2></EuiTitle><p>{selected.template}</p><dl><div><dt>Status</dt><dd>{selected.status} · {selected.stage}</dd></div><div><dt>Artifact</dt><dd>{selected.artifact}</dd></div><div><dt>Checksum</dt><dd>{selected.checksum}</dd></div><div><dt>Classification</dt><dd>{selected.classification}</dd></div><div><dt>Expiry</dt><dd>{selected.expiry}</dd></div><div><dt>Delivery</dt><dd>{selected.delivery}</dd></div></dl><EuiCallOut title="Artifact access boundary">Download is available only after completion, permission evaluation and expiry validation.</EuiCallOut><EuiSpacer/><EuiButton fullWidth isDisabled={selected.status!=='Completed'} onClick={()=>queue('Secure artifact download')}>Download artifact</EuiButton><EuiSpacer size="s"/><EuiButton fullWidth isDisabled={selected.status!=='Failed'} onClick={()=>queue('Retry report job')}>Retry failed job</EuiButton><EuiSpacer size="s"/><EuiButtonEmpty onClick={()=>queue('Clone report configuration')}>Clone report</EuiButtonEmpty></EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {wizardOpen&&<EuiModal onClose={()=>setWizardOpen(false)} aria-labelledby="p21-wizard-title"><EuiModalHeader><EuiModalHeaderTitle id="p21-wizard-title">Create report · {step}</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><div className="reportWizardSteps">{steps.map((item,index)=><button type="button" key={item} className={step===item?'active':''} onClick={()=>setStep(item)}><b>{index+1}</b><span>{item}</span></button>)}</div><EuiSpacer/>
      {step==='Scope'&&<div><EuiTitle size="xs"><h3>Frozen report scope</h3></EuiTitle><p>Template: {selectedTemplate.name}</p><p>Query revision: query-itsm-42@r9</p><p>Source freshness: {fixture.freshness}</p></div>}
      {step==='Metrics'&&<div><EuiTitle size="xs"><h3>Metric revisions</h3></EuiTitle>{selectedTemplate.metrics.split(',').map((metric,index)=><div key={metric}><strong>{metric.trim()}</strong><span>metric-r{12-index}</span><EuiBadge color="success">Valid</EuiBadge></div>)}</div>}
      {step==='Preview'&&<div><EuiCallOut title="Preview is sampled">Preview uses 24 representative records; final generation runs server-side against the frozen scope.</EuiCallOut><table><tbody><tr><th>Rows estimated</th><td>2,481</td></tr><tr><th>Redacted fields</th><td>requester.email, user.name</td></tr><tr><th>Coverage</th><td>{Math.round(fixture.coverage*100)}%</td></tr></tbody></table></div>}
      {step==='Delivery'&&<div><EuiTitle size="xs"><h3>Delivery policy</h3></EuiTitle><p>Secure inbox · PDF + CSV · expires after 7 days · classification {selectedTemplate.classification}</p><EuiCallOut title="External recipient review" color="warning">External delivery requires a separate permission and classification approval.</EuiCallOut></div>}
    </EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={()=>setWizardOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={create}>Queue report job</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
