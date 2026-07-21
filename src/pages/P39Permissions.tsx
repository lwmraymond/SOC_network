import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiHorizontalRule,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../types/prototype';

/*
 * P39 brief / difference contract
 * Archetype: Effective Access Explorer.
 * Hero: principal × capability × resource × context query builder with one Evaluate access action.
 * First viewport: decision summary, attention queue, selected decision trace, and governed access actions.
 * Primary surface: access-review records, not a role matrix or policy editor.
 * Closest page: P26 Agent Runtime Access. P39 differs through a principal-centric query hero,
 * an exception/review queue, and receipt-driven request/grant/revoke workflows rather than policy authoring.
 * Prototype writes are simulations only and never claim production mutation or immediate authorization change.
 */

type Decision = 'Allow' | 'Deny' | 'Conditional';
type ReviewFilter = 'Needs attention' | 'All records' | 'Conflicts' | 'Expiring' | 'Unused';
type Overlay = 'decision' | 'request' | null;
type ChangeMode = 'Grant' | 'Revoke';
type ChangeEvent = { target: { value: string } };

type AccessRecord = {
  id: string;
  principal: string;
  principalType: string;
  capability: string;
  resource: string;
  scope: string;
  decision: Decision;
  origin: string;
  grantState: string;
  risk: string;
  conflict: string;
  expiry: string;
  hits: number;
  lastDecision: string;
  receipt: string;
};

const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const count = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const normalizeDecision = (value: PrototypeValue | undefined, index: number): Decision => {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('deny')) return 'Deny';
  if (normalized.includes('conditional') || normalized.includes('approval')) return 'Conditional';
  if (normalized.includes('allow')) return 'Allow';
  return index % 5 === 0 ? 'Deny' : index % 3 === 0 ? 'Conditional' : 'Allow';
};

const buildAccessRecords = (rows: PrototypeRow[]): AccessRecord[] => rows.slice(0, 14).map((row, index) => ({
  id: text(row.grant_id ?? row.policy_id, `GRANT-${7400 + index}`),
  principal: text(row.principal ?? row.user_id, index % 4 === 0 ? `service:soc-automation-${index + 1}` : `analyst${index + 1}@example.test`),
  principalType: text(row.principal_type, index % 4 === 0 ? 'Service account' : index % 3 === 0 ? 'Group' : 'User'),
  capability: text(row.capability ?? row.capability_resource, ['cases:update', 'response:execute', 'alerts:read', 'rules:publish'][index % 4]),
  resource: text(row.resource ?? row.resource_scope, [`case:CASE-2026-${447 + index}`, `site:${index % 2 ? 'taipei' : 'prod'}`, `dataset:security-${index % 3}`][index % 3]),
  scope: text(row.scope_context ?? row.scope, index % 2 ? 'tenant:apac / site:taipei' : 'tenant:global / environment:prod'),
  decision: normalizeDecision(row.decision, index),
  origin: text(row.matching_rules ?? row.source, index % 4 === 0 ? 'Direct grant' : index % 3 === 0 ? 'Group + role' : 'Role assignment'),
  grantState: text(row.grant_state ?? row.status, index % 6 === 0 ? 'Expiring' : index % 5 === 0 ? 'Pending approval' : 'Active'),
  risk: text(row.risk ?? row.severity, index < 3 ? 'Critical' : index < 7 ? 'High' : 'Medium'),
  conflict: text(row.conflicts ?? row.conflict, index % 5 === 0 ? 'SoD conflict' : index % 7 === 0 ? 'Shadowed allow' : 'None'),
  expiry: text(row.expires_at ?? row.expiry, index % 4 === 0 ? `2026-07-${24 + index} 18:00 +08` : 'None'),
  hits: count(row.hit_count ?? row.decision_usage, index % 6 === 0 ? 0 : 8 + index * 7),
  lastDecision: text(row.last_decision_at ?? row.updated_at, `2026-07-21 ${String(8 + index).padStart(2, '0')}:14 +08`),
  receipt: text(row.receipt ?? row.audit, index % 4 === 0 ? `receipt-${202607210100 + index}` : 'No recent mutation receipt'),
}));

const decisionColor = (decision: Decision): 'success' | 'danger' | 'warning' => decision === 'Allow' ? 'success' : decision === 'Deny' ? 'danger' : 'warning';
const attentionFor = (record: AccessRecord) => record.conflict !== 'None' || record.expiry !== 'None' || record.hits === 0 || record.grantState === 'Pending approval';

function P39PermissionsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const records = useMemo(() => buildAccessRecords(fixture.rows), [fixture.rows]);
  const [query, setQuery] = useState('');
  const [principal, setPrincipal] = useState('analyst1@example.test');
  const [capability, setCapability] = useState('cases:update');
  const [resource, setResource] = useState('case:CASE-2026-447');
  const [context, setContext] = useState('tenant:apac / site:taipei / severity:high');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('Needs attention');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [evaluated, setEvaluated] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [includeDraft, setIncludeDraft] = useState(false);
  const [requestReason, setRequestReason] = useState('Investigate and coordinate response for the linked high-severity case.');
  const [sponsor, setSponsor] = useState('SOC duty manager');
  const [requestedExpiry, setRequestedExpiry] = useState('8 hours');
  const [changeMode, setChangeMode] = useState<ChangeMode>('Grant');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);

  const visible = useMemo(() => records.filter((record) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${record.id} ${record.principal} ${record.capability} ${record.resource} ${record.scope} ${record.origin} ${record.conflict}`.toLowerCase().includes(term);
    const matchesReview = reviewFilter === 'All records'
      || (reviewFilter === 'Needs attention' && attentionFor(record))
      || (reviewFilter === 'Conflicts' && record.conflict !== 'None')
      || (reviewFilter === 'Expiring' && record.expiry !== 'None')
      || (reviewFilter === 'Unused' && record.hits === 0);
    return matchesQuery && matchesReview;
  }), [query, records, reviewFilter]);

  const selected = visible.find((record) => record.id === selectedId) ?? visible[0] ?? records[0];
  if (!selected) return null;

  const summary = {
    direct: records.filter((record) => record.origin.toLowerCase().includes('direct')).length,
    conflicts: records.filter((record) => record.conflict !== 'None').length,
    expiring: records.filter((record) => record.expiry !== 'None').length,
    unused: records.filter((record) => record.hits === 0).length,
  };

  const evaluatedDecision: Decision = resource.includes('prod') || context.includes('severity:high') ? 'Conditional' : 'Allow';
  const evaluate = () => {
    setEvaluated(true);
    setOverlay('decision');
  };
  const queueRequest = () => {
    setReceipt(`Prototype simulation: access request queued for ${principal} → ${capability} on ${resource}. No production mutation. Approval, grant receipt, and authoritative re-evaluation remain pending.`);
    setOverlay(null);
  };
  const queueChange = () => {
    setReceipt(`Prototype simulation: ${changeMode.toLowerCase()} review queued for ${selected.id}. No production mutation. Effective access remains ${selected.decision.toUpperCase()} until a real authorization receipt is rehydrated.`);
    setConfirmOpen(false);
  };

  return <div className="pageComposition differentiatedPage p39Permissions" data-page-specific-composition="P39-principal-capability-resource-decision-trace">
    <style>{`
      .p39Permissions{display:flex;flex-direction:column;gap:24px;min-width:0}.p39Permissions *{box-sizing:border-box}.p39Permissions p,.p39Permissions small,.p39Permissions td,.p39Permissions dd{overflow-wrap:anywhere}.p39QueryGrid{display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(180px,1fr) minmax(210px,1.2fr) minmax(260px,1.5fr) auto;gap:12px;align-items:end}.p39Summary{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:1px;padding:0;overflow:hidden}.p39Summary>div{padding:16px 18px;background:var(--euiColorEmptyShade,#fff)}.p39Summary strong{display:block;font-size:24px;line-height:1.1}.p39Summary span{display:block;margin-top:6px}.p39Workspace{display:grid;grid-template-columns:minmax(680px,2fr) minmax(330px,1fr);gap:24px;align-items:start;min-width:0}.p39Toolbar{display:flex;gap:12px;align-items:center;margin-bottom:12px}.p39Toolbar>div:first-child{flex:1}.p39TableWrap{overflow:auto;max-width:100%}.p39Table{width:100%;min-width:880px;border-collapse:collapse}.p39Table th,.p39Table td{padding:10px 12px;border-bottom:1px solid var(--euiBorderColor,#d3dae6);text-align:left;vertical-align:top}.p39Table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em}.p39Table tr[aria-selected=true]{background:var(--euiColorLightestShade,#f5f7fa)}.p39Identity{display:grid;gap:3px}.p39Identity small{color:var(--euiTextSubduedColor,#69707d)}.p39Attention{display:flex;flex-wrap:wrap;gap:6px}.p39Trace{display:grid;gap:10px;margin:16px 0}.p39Trace article{display:grid;grid-template-columns:28px 1fr;gap:10px;padding:11px;border-left:3px solid var(--euiBorderColor,#d3dae6);background:var(--euiColorLightestShade,#f5f7fa)}.p39Trace article.matched{border-left-color:var(--euiColorWarning,#f5a700)}.p39Trace b{display:flex;width:24px;height:24px;border-radius:50%;align-items:center;justify-content:center;background:var(--euiColorEmptyShade,#fff)}.p39Trace strong,.p39Trace small{display:block}.p39DecisionMeta{display:grid;grid-template-columns:1fr auto;gap:9px 16px}.p39DecisionMeta dt{font-weight:600}.p39DecisionMeta dd{margin:0;text-align:right}.p39ActionStack{display:grid;gap:10px}.p39Receipt{scroll-margin-top:80px}.p39FlyoutQuery{display:grid;grid-template-columns:1fr 1fr;gap:12px}.p39RuleList{display:grid;gap:12px}.p39RuleList article{padding:14px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px}.p39RuleList header{display:flex;justify-content:space-between;gap:12px;margin-bottom:6px}@media(max-width:1500px){.p39QueryGrid{grid-template-columns:repeat(2,minmax(220px,1fr))}.p39QueryGrid>button{width:max-content}.p39Workspace{grid-template-columns:minmax(600px,1.7fr) minmax(320px,1fr)}}@media(max-width:1050px){.p39Summary{grid-template-columns:repeat(2,1fr)}.p39Workspace{grid-template-columns:1fr}.p39QueryGrid{grid-template-columns:1fr 1fr}.p39FlyoutQuery{grid-template-columns:1fr}}@media(max-width:720px){.p39QueryGrid{grid-template-columns:1fr}.p39Summary{grid-template-columns:1fr}.p39Toolbar{align-items:stretch;flex-direction:column}}
    `}</style>

    <EuiPanel paddingSize="m" hasBorder data-visual-region="effective-access-query-builder">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem>
          <EuiTitle size="s"><h2>Effective access query</h2></EuiTitle>
          <p>Evaluate the final decision across principal, capability, resource, and request context.</p>
        </EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">Source: authorization decision service · {fixture.freshness}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="p39QueryGrid">
        <EuiFormRow label="Principal"><EuiFieldText value={principal} onChange={(event: ChangeEvent) => setPrincipal(event.target.value)} aria-label="Principal" /></EuiFormRow>
        <EuiFormRow label="Capability"><EuiFieldText value={capability} onChange={(event: ChangeEvent) => setCapability(event.target.value)} aria-label="Capability" /></EuiFormRow>
        <EuiFormRow label="Resource"><EuiFieldText value={resource} onChange={(event: ChangeEvent) => setResource(event.target.value)} aria-label="Resource" /></EuiFormRow>
        <EuiFormRow label="Scope and context"><EuiFieldText value={context} onChange={(event: ChangeEvent) => setContext(event.target.value)} aria-label="Scope and context" /></EuiFormRow>
        <EuiButton fill onClick={evaluate}>Evaluate access</EuiButton>
      </div>
      <EuiSpacer size="s" />
      <EuiSwitch checked={includeDraft} onChange={() => setIncludeDraft((value) => !value)} label="Include approved pending changes in the simulation" />
    </EuiPanel>

    {receipt && <EuiCallOut className="p39Receipt" title="Prototype authorization receipt" color="warning" aria-live="polite">{receipt}</EuiCallOut>}

    <EuiPanel paddingSize="none" hasBorder className="p39Summary" data-visual-region="access-review-summary">
      <div><strong>{summary.direct}</strong><span>Direct grants</span></div>
      <div><strong>{summary.conflicts}</strong><span>Conflicts requiring review</span></div>
      <div><strong>{summary.expiring}</strong><span>Expiring grants</span></div>
      <div><strong>{summary.unused}</strong><span>Unused privileges</span></div>
    </EuiPanel>

    <div className="p39Workspace">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="grant-attention-queue">
        <EuiFlexGroup alignItems="center" wrap>
          <EuiFlexItem><EuiTitle size="s"><h2>Access review queue</h2></EuiTitle><p>Direct grants, conflicts, expiry, and unused privilege share the current normalized query scope.</p></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setReceipt('Prototype simulation: access review export queued with field masking. No production mutation or completed export is claimed.')}>Export review</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <div className="p39Toolbar">
          <div><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Principal, grant, capability, resource, source or conflict" aria-label="Search access review records" /></div>
          <EuiSelect compressed value={reviewFilter} onChange={(event: ChangeEvent) => setReviewFilter(event.target.value as ReviewFilter)} options={['Needs attention','All records','Conflicts','Expiring','Unused'].map((value) => ({ value, text: value }))} aria-label="Review filter" />
        </div>
        <div className="p39TableWrap">
          <table className="p39Table">
            <thead><tr><th>Principal</th><th>Capability / resource</th><th>Decision</th><th>Grant source</th><th>Attention</th><th>Last decision</th></tr></thead>
            <tbody>{visible.map((record) => <tr key={record.id} aria-selected={record.id === selected.id}>
              <td><div className="p39Identity"><EuiButtonEmpty size="xs" onClick={() => setSelectedId(record.id)}>{record.principal}</EuiButtonEmpty><small>{record.principalType} · {record.id}</small></div></td>
              <td><div className="p39Identity"><strong>{record.capability}</strong><small>{record.resource}<br />{record.scope}</small></div></td>
              <td><EuiBadge color={decisionColor(record.decision)}>{record.decision}</EuiBadge></td>
              <td>{record.origin}<br /><small>{record.grantState}</small></td>
              <td><div className="p39Attention">{record.conflict !== 'None' && <EuiBadge color="danger">{record.conflict}</EuiBadge>}{record.expiry !== 'None' && <EuiBadge color="warning">Expiring</EuiBadge>}{record.hits === 0 && <EuiBadge color="hollow">Unused</EuiBadge>}{!attentionFor(record) && <EuiBadge color="success">Clear</EuiBadge>}</div></td>
              <td>{record.lastDecision}<br /><small>{record.hits} decision hits</small></td>
            </tr>)}</tbody>
          </table>
        </div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder data-visual-region="selected-decision-trace">
        <EuiFlexGroup alignItems="center" wrap>
          <EuiFlexItem><EuiTitle size="s"><h2>Why this decision?</h2></EuiTitle><p>{selected.principal}</p></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={decisionColor(selected.decision)}>{selected.decision}</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <div className="p39Trace" aria-label="Decision precedence trace">
          <article className="matched"><b>1</b><div><strong>Explicit deny and conflict rules</strong><small>{selected.conflict === 'None' ? 'No explicit deny matched.' : `${selected.conflict} requires resolution before privilege expansion.`}</small></div></article>
          <article className="matched"><b>2</b><div><strong>{selected.origin}</strong><small>{selected.capability} on {selected.resource} · {selected.grantState}</small></div></article>
          <article><b>3</b><div><strong>Context conditions</strong><small>{selected.scope}; current decision evaluated with expiry and approval conditions.</small></div></article>
        </div>
        <dl className="p39DecisionMeta"><dt>Risk</dt><dd>{selected.risk}</dd><dt>Expiry</dt><dd>{selected.expiry}</dd><dt>Latest receipt</dt><dd>{selected.receipt}</dd></dl>
        <EuiHorizontalRule margin="m" />
        <div className="p39ActionStack">
          <EuiButton fill fullWidth onClick={() => setOverlay('decision')}>Open full decision trace</EuiButton>
          <EuiButton fullWidth onClick={() => setOverlay('request')}>Request access change</EuiButton>
          <EuiButtonEmpty onClick={() => { setChangeMode(selected.decision === 'Allow' ? 'Revoke' : 'Grant'); setConfirmOpen(true); }}>Review direct grant / revoke</EuiButtonEmpty>
        </div>
      </EuiPanel>
    </div>

    {overlay === 'decision' && <EuiFlyout onClose={() => setOverlay(null)} size="l" aria-labelledby="p39-decision-title">
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p39-decision-title">Effective access decision trace</h2></EuiTitle><p>Query ID access-eval-20260721-039 · prototype simulation</p></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title={`${evaluated ? evaluatedDecision : selected.decision} — final simulated decision`} color={decisionColor(evaluated ? evaluatedDecision : selected.decision)}>No production mutation. This trace explains precedence and does not grant access.</EuiCallOut>
        <EuiSpacer size="m" />
        <div className="p39FlyoutQuery"><EuiPanel paddingSize="s" hasBorder><strong>Principal</strong><p>{evaluated ? principal : selected.principal}</p></EuiPanel><EuiPanel paddingSize="s" hasBorder><strong>Capability / resource</strong><p>{evaluated ? capability : selected.capability}<br />{evaluated ? resource : selected.resource}</p></EuiPanel></div>
        <EuiSpacer size="m" />
        <EuiTitle size="s"><h3>Matching rules and precedence</h3></EuiTitle><EuiSpacer size="s" />
        <div className="p39RuleList">
          <article><header><strong>1 · Explicit deny / SoD guard</strong><EuiBadge color="danger">Highest precedence</EuiBadge></header><p>{selected.conflict === 'None' ? 'No blocking deny matched the selected record.' : `${selected.conflict} matched the principal and target scope.`}</p></article>
          <article><header><strong>2 · Direct and inherited grants</strong><EuiBadge color="warning">Matched</EuiBadge></header><p>{selected.origin}: {selected.capability} on {selected.resource}. Grants are additive and cannot override an explicit deny.</p></article>
          <article><header><strong>3 · Context and expiry</strong><EuiBadge color="hollow">Evaluated</EuiBadge></header><p>{evaluated ? context : selected.scope}; expiry {selected.expiry}; pending changes {includeDraft ? 'included' : 'excluded'}.</p></article>
          <article><header><strong>4 · Default authorization policy</strong><EuiBadge color={decisionColor(evaluated ? evaluatedDecision : selected.decision)}>{evaluated ? evaluatedDecision : selected.decision}</EuiBadge></header><p>The final result remains provisional until the authoritative service returns a signed decision receipt.</p></article>
        </div>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiFlexGroup justifyContent="spaceBetween" alignItems="center"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setOverlay(null)}>Close</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => setOverlay('request')}>Request change</EuiButton></EuiFlexItem></EuiFlexGroup></EuiFlyoutFooter>
    </EuiFlyout>}

    {overlay === 'request' && <EuiFlyout onClose={() => setOverlay(null)} size="m" aria-labelledby="p39-request-title">
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p39-request-title">Request least-privilege access</h2></EuiTitle><p>Creates a prototype request only; it does not create a grant.</p></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Prototype simulation / No production mutation" color="warning">Approval completion is not grant completion. The page must rehydrate a real authorization receipt before showing access as effective.</EuiCallOut>
        <EuiSpacer size="m" />
        <EuiFormRow label="Principal"><EuiFieldText value={principal} onChange={(event: ChangeEvent) => setPrincipal(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Capability"><EuiFieldText value={capability} onChange={(event: ChangeEvent) => setCapability(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Resource and scope"><EuiFieldText value={`${resource} · ${context}`} readOnly /></EuiFormRow>
        <EuiFormRow label="Requested expiry"><EuiSelect value={requestedExpiry} onChange={(event: ChangeEvent) => setRequestedExpiry(event.target.value)} options={['1 hour','8 hours','24 hours','7 days'].map((value) => ({ value, text: value }))} /></EuiFormRow>
        <EuiFormRow label="Business reason"><EuiTextArea value={requestReason} onChange={(event: ChangeEvent) => setRequestReason(event.target.value)} rows={4} /></EuiFormRow>
        <EuiFormRow label="Sponsor"><EuiFieldText value={sponsor} onChange={(event: ChangeEvent) => setSponsor(event.target.value)} /></EuiFormRow>
        <EuiCallOut title="Approval and separation of duties" color="warning">Security governance approval is required. Self-approval is blocked and the existing conflict remains visible.</EuiCallOut>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiFlexGroup justifyContent="spaceBetween"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setOverlay(null)}>Cancel</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={queueRequest} isDisabled={!requestReason.trim() || !sponsor.trim()}>Queue request</EuiButton></EuiFlexItem></EuiFlexGroup></EuiFlyoutFooter>
    </EuiFlyout>}

    {confirmOpen && <EuiModal onClose={() => setConfirmOpen(false)} aria-labelledby="p39-change-title">
      <EuiModalHeader><EuiModalHeaderTitle id="p39-change-title">Review {changeMode.toLowerCase()} impact</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody><EuiCallOut title="Prototype simulation / No production mutation" color="warning">This action queues governance review. Effective access remains unchanged until receipt rehydration.</EuiCallOut><EuiSpacer size="m" /><EuiFormRow label="Change"><EuiSelect value={changeMode} onChange={(event: ChangeEvent) => setChangeMode(event.target.value as ChangeMode)} options={['Grant','Revoke'].map((value) => ({ value, text: value }))} /></EuiFormRow><ul><li>Principal: {selected.principal}</li><li>Capability: {selected.capability}</li><li>Resource: {selected.resource}</li><li>Current decision: {selected.decision}</li><li>Conflict: {selected.conflict}</li><li>Rollback / recovery: create a new governed grant revision</li></ul></EuiModalBody>
      <EuiModalFooter><EuiButtonEmpty onClick={() => setConfirmOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill color={changeMode === 'Revoke' ? 'danger' : 'primary'} onClick={queueChange}>Queue governance review</EuiButton></EuiModalFooter>
    </EuiModal>}
  </div>;
}

const spec = pageSpecById.P39;

export default function P39Permissions() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <P39PermissionsWorkspace fixture={page.fixture} />}
  </PageFrame>;
}
