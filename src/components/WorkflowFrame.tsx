import { ReactNode, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPageTemplate,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
} from '@elastic/eui';
import type { PageSpec } from '../catalog/pageSpecs';
import type { WorkflowSpec } from '../catalog/workflowSpecs';
import type { PrototypePageFixture } from '../types/prototype';

export function WorkflowFrame({ workflow, parent, fixture, children }: { workflow: WorkflowSpec; parent: PageSpec; fixture?: PrototypePageFixture; children: ReactNode }) {
  const [params,setParams]=useSearchParams();
  const tab=params.get('tab')??'overview';
  const fallbackParent = parent.route.replace(':assetId','asset-001');
  const parentDestination = params.get('returnTo') ?? fallbackParent;
  const [dirty,setDirty]=useState(false);
  const [actionOpen,setActionOpen]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const [receipt,setReceipt]=useState<string>();
  useEffect(()=>{const before=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before);},[dirty]);
  const setTab=(next:string)=>{const p=new URLSearchParams(params);p.set('tab',next);setParams(p);};
  const submit=()=>{setReceipt(`prototype-${workflow.id.toLowerCase()}-receipt`);setActionOpen(false);setConfirmed(false);};
  return <EuiPageTemplate panelled restrictWidth={1800} className="workflowPage" data-workflow-id={workflow.id} data-fixture-ready={fixture ? 'true' : 'false'}>
    <EuiPageTemplate.Header data-visual-region="workflow-header" pageTitle={workflow.title} description={`${workflow.id} · ${workflow.surface}`} rightSideItems={[<EuiButton key="primary" fill isDisabled={!fixture} title={!fixture ? 'Production workflow adapter is not connected' : undefined} onClick={()=>setActionOpen(true)}>{workflow.actions[0]??'Review workflow'}</EuiButton>]}/>
    <EuiPageTemplate.Section>
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to={parentDestination} onClick={(event)=>{if(dirty&&!window.confirm('Discard the prototype draft and return to the parent view?'))event.preventDefault();}}>{parent.title}</Link><span>/</span><strong>{workflow.title}</strong></nav>
      <EuiSpacer size="s" />
      <EuiCallOut title="Parent-owned workflow · Prototype Mode · Fixture Data" color="warning">This route is canonical and refreshable, but it is not a sidebar destination. No production mutation is performed.</EuiCallOut>
      <EuiSpacer size="s" />
      <div className="workflowIdentity"><div><strong>{workflow.id.toLowerCase()}-demo-001</strong><p>{workflow.objective}</p></div><div><EuiBadge color="warning">Revision 7</EuiBadge><EuiBadge color="hollow">{fixture?.freshness??'—'} freshness</EuiBadge><EuiBadge color={dirty?'warning':'success'}>{dirty?'Unsaved draft':'No dirty state'}</EuiBadge></div></div>
      <EuiTabs>{['overview','activity','evidence','work','audit'].map((item)=><EuiTab key={item} isSelected={tab===item} onClick={()=>setTab(item)}>{item}</EuiTab>)}</EuiTabs>
      <EuiSpacer />
      {children}
      <EuiSpacer />
      <EuiCheckbox id={`${workflow.id}-dirty`} label="Simulate unsaved draft and route-leave confirmation" checked={dirty} onChange={(event)=>setDirty(event.target.checked)} />
      <EuiSpacer />
      <div className="stickyWorkflowBar"><div><strong>Current action eligibility</strong><span>Capability prototype · revision current · approval depends on policy</span></div><EuiButtonEmpty onClick={()=>setActionOpen(true)}>Open impact preview</EuiButtonEmpty></div>
      {receipt&&<div className="inlineReceipt" role="status"><strong>Prototype receipt · queued</strong><span>{receipt}</span><span>Approval or queue acceptance is not completion.</span><button type="button" onClick={()=>setReceipt(undefined)}>Dismiss</button></div>}
      <EuiSpacer /><EuiText size="xs" color="subdued"><p>{workflow.boundary}</p></EuiText>
    </EuiPageTemplate.Section>
    {actionOpen&&<EuiModal data-overlay-semantic="workflow-primary-action" onClose={()=>setActionOpen(false)} aria-labelledby={`${workflow.id}-action-title`}><EuiModalHeader><EuiModalHeaderTitle id={`${workflow.id}-action-title`}>{workflow.actions[0]??'Workflow action'}</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype impact preview" color="warning">Targets, before/after, policy, approval, rollback and receipt would be authoritative service results.</EuiCallOut><ul>{workflow.actions.slice(0,6).map((action)=><li key={action}>{action}</li>)}</ul><EuiCheckbox id={`${workflow.id}-confirm`} label="Confirm prototype simulation" checked={confirmed} onChange={(event)=>setConfirmed(event.target.checked)} /></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={()=>setActionOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill isDisabled={!confirmed} onClick={submit}>Create prototype receipt</EuiButton></EuiModalFooter></EuiModal>}
  </EuiPageTemplate>;
}
