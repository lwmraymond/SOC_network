import { useMemo, useState } from 'react';
import { EuiBadge, EuiButton, EuiButtonEmpty, EuiCallOut, EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiFlyout, EuiFlyoutBody, EuiFlyoutFooter, EuiFlyoutHeader, EuiPanel, EuiProgress, EuiSelect, EuiSpacer, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';

type Plan = { id: string; strategy: string; scope: string; reduction: number; stage: string; owner: string; due: string; change: string; blocker: string; validation: string; residual: number };
type ChangeEvent = { target: { value: string } };
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const number = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const buildPlans = (rows: PrototypeRow[]): Plan[] => rows.slice(0, 12).map((row, index) => ({
  id: text(row.remediation_id, `REM-${240 + index}`), strategy: text(row.strategy, ['Patch package', 'Upgrade runtime', 'Compensating control', 'Configuration hardening'][index % 4]),
  scope: text(row.scope, `${4 + index * 2} assets · ${['Identity', 'Payments', 'Endpoint', 'Customer API'][index % 4]}`), reduction: Math.min(95, number(row.risk_reduction, 88 - index * 4)),
  stage: text(row.stage, ['Planning', 'Change approval', 'Implementation', 'Validation', 'Blocked'][index % 5]), owner: text(row.owner_team ?? row.owner, ['Platform', 'Endpoint', 'Network', 'SecOps'][index % 4]),
  due: text(row.due_at, index % 4 === 0 ? 'Overdue' : index % 4 === 1 ? 'Due in 2d' : 'On track'), change: text(row.change_ref, index % 3 === 0 ? 'No change linked' : `CHG-${710 + index}`),
  blocker: text(row.dependencies, index % 5 === 4 ? 'Vendor maintenance window' : index % 3 === 0 ? 'CAB evidence pending' : 'None'), validation: text(row.validation_state, ['Not started', 'Pending', 'Running', 'Passed', 'Failed'][index % 5]),
  residual: Math.max(4, number(row.residual_risk, 42 - index * 3)),
}));

export function P11RemediationQueueWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('All stages');
  const [due, setDue] = useState('All due states');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [planOpen, setPlanOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const plans = useMemo(() => buildPlans(fixture.rows), [fixture.rows]);
  const visible = useMemo(() => plans.filter((item) => (!query.trim() || `${item.id} ${item.strategy} ${item.scope} ${item.owner} ${item.change}`.toLowerCase().includes(query.trim().toLowerCase())) && (stage === 'All stages' || item.stage === stage) && (due === 'All due states' || item.due === due)), [due, plans, query, stage]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? plans[0];
  if (!selected) return null;
  const queue = (action: string) => setReceipt(`${action} queued for ${selected.id}. No authoritative Change or validation state changed.`);

  return <div className="pageComposition page-p11 differentiatedPage" data-page-specific-composition="P11-remediation-portfolio-execution">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="remediation-scope-bar"><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Remediation, service, asset scope, owner or Change" /></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={stage} onChange={(event: ChangeEvent) => setStage(event.target.value)} options={['All stages','Planning','Change approval','Implementation','Validation','Blocked'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiSelect compressed value={due} onChange={(event: ChangeEvent) => setDue(event.target.value)} options={['All due states','Overdue','Due in 2d','On track'].map((value)=>({value,text:value}))}/></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={()=>setPlanOpen(true)}>Plan remediation</EuiButton></EuiFlexItem></EuiFlexGroup></EuiPanel>
    <EuiSpacer size="m" />{receipt && <><EuiCallOut title="Prototype remediation receipt" color="warning">{receipt}</EuiCallOut><EuiSpacer size="m" /></>}
    <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
      <EuiFlexItem grow={5}><EuiPanel paddingSize="m" hasBorder data-visual-region="remediation-portfolio"><EuiTitle size="s"><h2>Risk-reduction portfolio</h2></EuiTitle><div className="remediationStageFlow">{['Planning','Change approval','Implementation','Validation','Verified'].map((label,index)=><article key={label}><strong>{plans.filter((item)=>index===4?item.validation==='Passed':item.stage===label).length}</strong><span>{label}</span><EuiProgress value={[22,38,55,72,91][index]} max={100} size="s" /></article>)}</div><EuiSpacer size="s" /><table><thead><tr><th>Plan</th><th>Strategy / scope</th><th>Stage</th><th>Owner / due</th><th>Change</th><th>Validation</th></tr></thead><tbody>{visible.map((item)=><tr key={item.id}><td><EuiButtonEmpty size="xs" onClick={()=>setSelectedId(item.id)}>{item.id}</EuiButtonEmpty></td><td><strong>{item.strategy}</strong><small>{item.scope}</small></td><td><EuiBadge color={item.stage==='Blocked'?'danger':item.stage==='Validation'?'warning':'hollow'}>{item.stage}</EuiBadge></td><td>{item.owner}<small>{item.due}</small></td><td>{item.change}</td><td>{item.validation}</td></tr>)}</tbody></table></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={3}><EuiPanel paddingSize="m" hasBorder data-visual-region="remediation-plan-inspector"><EuiTitle size="s"><h2>{selected.id}</h2></EuiTitle><p>{selected.strategy} · {selected.scope}</p><EuiSpacer size="s" /><div className="riskReductionDial"><strong>{selected.reduction}%</strong><span>projected reduction</span><small>{selected.residual}% residual risk</small></div><dl><div><dt>Stage</dt><dd>{selected.stage}</dd></div><div><dt>Change</dt><dd>{selected.change}</dd></div><div><dt>Blocker</dt><dd>{selected.blocker}</dd></div><div><dt>Validation</dt><dd>{selected.validation}</dd></div></dl><EuiSpacer /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton fill onClick={()=>queue('Create/link Change')}>Create/link Change</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={()=>queue('Run validation')}>Run validation</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={()=>queue('Reopen remediation')}>Reopen</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup></EuiPanel></EuiFlexItem>
      <EuiFlexItem grow={2}><EuiPanel paddingSize="m" hasBorder data-visual-region="change-window-and-blockers"><EuiTitle size="xs"><h2>Change windows & blockers</h2></EuiTitle>{plans.filter((item)=>item.blocker!=='None'||item.change==='No change linked').slice(0,6).map((item)=><div key={item.id}><strong>{item.id}</strong><span>{item.blocker}</span><EuiBadge color={item.due==='Overdue'?'danger':'warning'}>{item.due}</EuiBadge></div>)}</EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
    {planOpen&&<EuiFlyout onClose={()=>setPlanOpen(false)} ownFocus size="m" aria-labelledby="p11-plan-title"><EuiFlyoutHeader><EuiTitle><h2 id="p11-plan-title">Plan remediation</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Prototype planning only">Strategy, target scope, dependencies, Change window and validation must be confirmed by production services.</EuiCallOut><EuiSpacer/><ol><li>Select confirmed exposure scope</li><li>Choose strategy and owner</li><li>Link Change window and dependencies</li><li>Define validation evidence and residual-risk threshold</li></ol></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={()=>setPlanOpen(false)}>Cancel</EuiButton><EuiButton fill onClick={()=>{setPlanOpen(false);queue('Remediation plan');}}>Queue plan</EuiButton></EuiFlyoutFooter></EuiFlyout>}
  </div>;
}
