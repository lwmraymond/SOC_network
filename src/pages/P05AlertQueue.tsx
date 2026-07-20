import { useMemo, useState } from 'react';
import { EuiBadge, EuiButton, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiModal, EuiModalBody, EuiModalFooter, EuiModalHeader, EuiModalHeaderTitle, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { PrototypeGrid } from '../components/PrototypeGrid';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P05;

export default function P05AlertQueue() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  const [impactOpen, setImpactOpen] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const severityCounts = useMemo(() => fixture ? ['Critical','High','Medium','Low'].map((severity) => ({ severity, count: fixture.rows.filter((row) => row.severity === severity).length })) : [], [fixture]);
  return <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {fixture && <div className="pageComposition page-p05 differentiatedPage">
      <EuiFlexGroup gutterSize="m" alignItems="stretch">
        <EuiFlexItem grow={false}><EuiPanel paddingSize="m" style={{minWidth:230}} data-visual-region="alert-triage-rail"><EuiTitle size="xs"><h2>Triage lanes</h2></EuiTitle>{severityCounts.map((item,index)=><button key={item.severity} type="button" style={{display:'flex',width:'100%',justifyContent:'space-between',padding:'10px 0',border:0,borderBottom:'1px solid var(--border)',background:'transparent',color:'inherit'}}><span>{item.severity}</span><EuiBadge color={index===0?'danger':index===1?'warning':'hollow'}>{item.count}</EuiBadge></button>)}<EuiSpacer /><EuiCallOut title="Normalized queue scope" size="s">Alert grouping, query, filters, grid and bulk eligibility share one request envelope.</EuiCallOut></EuiPanel></EuiFlexItem>
        <EuiFlexItem><EuiPanel paddingSize="m" data-visual-region="alert-queue-primary"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Operational alert groups</h2></EuiTitle><p>Queue-first triage with ownership, risk, projection state and exact alert context.</p></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={()=>setImpactOpen(true)}>Review bulk impact</EuiButton></EuiFlexItem></EuiFlexGroup><EuiSpacer /><PrototypeGrid spec={spec} rows={fixture.rows} caption="Alert group queue" maxColumns={8} /></EuiPanel></EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel paddingSize="m" data-visual-region="alert-lifecycle"><EuiTitle size="xs"><h2>Governed action lifecycle</h2></EuiTitle><EuiFlexGroup gutterSize="s" responsive={false}>{['eligible','impact preview','approval','queued receipt','rehydration'].map((stage,index)=><EuiFlexItem key={stage}><div style={{padding:10,border:'1px solid var(--border)',borderRadius:6}}><EuiBadge color={index<2?'success':index===2?'warning':'hollow'}>{index+1}</EuiBadge><strong style={{display:'block',marginTop:6}}>{stage}</strong><small>{index<2?'Ready':index===2?'Policy dependent':'Not reached'}</small></div></EuiFlexItem>)}</EuiFlexGroup></EuiPanel>
      {receipt && <EuiCallOut title="Prototype bulk receipt · queued" color="warning">Accepted or queued is not completed. Item-level failures and authoritative rehydration remain pending.</EuiCallOut>}
      {impactOpen && <EuiModal onClose={()=>setImpactOpen(false)} aria-labelledby="p05-impact-title"><EuiModalHeader><EuiModalHeaderTitle id="p05-impact-title">Bulk impact preview</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype simulation" color="warning">Visible-page selection is not “all matching results”. Eligibility, approval, stale state and expected revision are evaluated per target.</EuiCallOut><ul><li>9 targets eligible</li><li>2 targets require approval</li><li>1 target is stale and excluded</li></ul></EuiModalBody><EuiModalFooter><EuiButton onClick={()=>setImpactOpen(false)}>Cancel</EuiButton><EuiButton fill onClick={()=>{setImpactOpen(false);setReceipt(true);}}>Queue prototype action</EuiButton></EuiModalFooter></EuiModal>}
    </div>}
  </PageFrame>;
}
