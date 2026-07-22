import { useMemo, useRef, useState } from 'react';
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
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P39PermissionsWorkspace.css';

type Decision = 'Allow' | 'Deny' | 'Conditional';
type WorkMode = 'Results' | 'Review queue';
type ChangeMode = 'Grant' | 'Revoke';
type ChangeEvent = { target: { value: string } };
type AccessRecord = {
  key: string;
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
const buildRecords = (rows: PrototypeRow[]): AccessRecord[] => rows.slice(0, 14).map((row, index) => ({
  key: `${row.id}:${index}`,
  id: text(row.grant_id ?? row.policy_id, `GRANT-${7400 + index}`),
  principal: text(row.principal ?? row.user_id, index % 4 === 0 ? `service:soc-automation-${index + 1}` : `analyst${index + 1}@example.test`),
  principalType: text(row.principal_type, index % 4 === 0 ? 'Service account' : index % 3 === 0 ? 'Group' : 'User'),
  capability: text(row.capability ?? row.capability_resource, ['cases:update','response:execute','alerts:read','rules:publish'][index % 4]),
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
}));
const needsAttention = (record: AccessRecord) => record.conflict !== 'None' || record.expiry !== 'None' || record.hits === 0 || record.grantState === 'Pending approval';
const decisionColor = (decision: Decision): 'success' | 'danger' | 'warning' => decision === 'Allow' ? 'success' : decision === 'Deny' ? 'danger' : 'warning';

export function P39PermissionsWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const records = useMemo(() => buildRecords(fixture.rows), [fixture.rows]);
  const [principal, setPrincipal] = useState('analyst1@example.test');
  const [capability, setCapability] = useState('cases:update');
  const [resource, setResource] = useState('case:CASE-2026-447');
  const [context, setContext] = useState('tenant:apac / site:taipei / severity:high');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<WorkMode>('Results');
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [changeMode, setChangeMode] = useState<ChangeMode>('Grant');
  const [changeOpen, setChangeOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('Investigate and coordinate response for the linked high-severity case.');
  const [requestedExpiry, setRequestedExpiry] = useState('8 hours');
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const decisionOpener = useRef<HTMLButtonElement | null>(null);
  const requestOpener = useRef<HTMLButtonElement | null>(null);
  const changeOpener = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(() => records.filter((record) => {
    const term = query.trim().toLowerCase();
    const matches = !term || `${record.id} ${record.principal} ${record.capability} ${record.resource} ${record.scope} ${record.origin} ${record.conflict}`.toLowerCase().includes(term);
    return matches && (mode === 'Results' || needsAttention(record));
  }), [mode, query, records]);
  const selected = records.find((record) => record.key === selectedKey);
  const evaluatedDecision: Decision = resource.includes('prod') || context.includes('severity:high') ? 'Conditional' : 'Allow';

  const evaluate = () => {
    setMode('Results');
    setSelectedKey(records[0]?.key);
    setReceipt(`Prototype evaluation completed for ${principal} → ${capability} on ${resource}. Result: ${evaluatedDecision.toUpperCase()}. No authorization state changed.`);
  };
  const closeDecision = () => {
    setDecisionOpen(false);
    requestAnimationFrame(() => decisionOpener.current?.focus());
  };
  const closeRequest = () => {
    setRequestOpen(false);
    requestAnimationFrame(() => requestOpener.current?.focus());
  };
  const closeChange = () => {
    setChangeOpen(false);
    requestAnimationFrame(() => changeOpener.current?.focus());
  };
  const queueRequest = () => {
    setReceipt(`Prototype access request queued for ${principal} → ${capability} on ${resource} for ${requestedExpiry}. Approval and authoritative re-evaluation remain pending.`);
    closeRequest();
  };
  const queueChange = () => {
    if (!selected) return;
    setReceipt(`Prototype ${changeMode.toLowerCase()} review queued for ${selected.id}. Effective access remains ${selected.decision.toUpperCase()} until an authoritative receipt is rehydrated.`);
    closeChange();
  };

  return <div className="pageComposition differentiatedPage p39Permissions" data-page-specific-composition="P39-query-results-review-trace-flyout">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="effective-access-query">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem><EuiTitle size="s"><h2>Effective access query</h2></EuiTitle><p>Evaluate one principal, capability, resource and context tuple.</p></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">Decision source · {fixture.freshness}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="p39QueryGrid">
        <EuiFormRow label="Principal"><EuiFieldText value={principal} onChange={(event: ChangeEvent) => setPrincipal(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Capability"><EuiFieldText value={capability} onChange={(event: ChangeEvent) => setCapability(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Resource"><EuiFieldText value={resource} onChange={(event: ChangeEvent) => setResource(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Context"><EuiFieldText value={context} onChange={(event: ChangeEvent) => setContext(event.target.value)} /></EuiFormRow>
        <EuiButton fill onClick={evaluate}>Evaluate access</EuiButton>
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut title="Prototype access receipt" color="warning">{receipt}</EuiCallOut>}

    <EuiPanel paddingSize="m" hasBorder data-visual-region="permission-results-workspace">
      <EuiFlexGroup alignItems="center" gutterSize="m" wrap>
        <EuiFlexItem><div className="p39Tabs" role="tablist" aria-label="Permission work mode">{(['Results','Review queue'] as WorkMode[]).map((item) => <button type="button" role="tab" aria-selected={mode === item} key={item} onClick={() => setMode(item)}>{item}</button>)}</div></EuiFlexItem>
        <EuiFlexItem grow={2}><EuiFieldSearch compressed value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Principal, capability, resource, origin or conflict" aria-label="Filter permission records" /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiButtonEmpty buttonRef={requestOpener} onClick={() => setRequestOpen(true)}>Request access</EuiButtonEmpty></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="p39TableWrap">
        <table className="p39Table"><thead><tr><th>Principal</th><th>Capability / resource</th><th>Decision</th><th>Origin</th><th>Attention</th><th>Last decision</th></tr></thead><tbody>{visible.map((record) => <tr key={record.key} aria-selected={record.key === selectedKey}><td><EuiButtonEmpty size="xs" onClick={() => setSelectedKey(record.key)}>{record.principal}</EuiButtonEmpty><small>{record.principalType} · {record.id}</small></td><td><strong>{record.capability}</strong><small>{record.resource} · {record.scope}</small></td><td><EuiBadge color={decisionColor(record.decision)}>{record.decision}</EuiBadge></td><td>{record.origin}<small>{record.grantState}</small></td><td><div className="p39StatusCell">{record.conflict !== 'None' && <EuiBadge color="danger">Conflict</EuiBadge>}{record.expiry !== 'None' && <EuiBadge color="warning">Expiring</EuiBadge>}{record.hits === 0 && <EuiBadge color="hollow">Unused</EuiBadge>}{!needsAttention(record) && <EuiBadge color="success">Clear</EuiBadge>}</div></td><td>{record.lastDecision}<small>{record.hits} uses</small></td></tr>)}</tbody></table>
      </div>
      {visible.length === 0 && <EuiCallOut title="No permission records match">Clear one filter or switch work mode. Query context remains intact.</EuiCallOut>}
      <EuiSpacer size="m" />
      <div className="p39SelectionBar">
        {selected ? <><span><strong>{selected.principal}</strong> · {selected.capability} on {selected.resource}</span><EuiButton buttonRef={decisionOpener} onClick={() => setDecisionOpen(true)}>Why this decision?</EuiButton><EuiButtonEmpty buttonRef={changeOpener} onClick={() => { setChangeMode(selected.decision === 'Allow' ? 'Revoke' : 'Grant'); setChangeOpen(true); }}>Review {selected.decision === 'Allow' ? 'revoke' : 'grant'}</EuiButtonEmpty></> : <span>Select one result to inspect decision evidence or review a governed access change.</span>}
      </div>
    </EuiPanel>

    {decisionOpen && selected && <EuiFlyout onClose={closeDecision} ownFocus size="m" aria-labelledby="p39-decision-title">
      <EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p39-decision-title">Why this decision?</h2></EuiTitle></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h3>{selected.principal}</h3></EuiTitle><p>{selected.capability} on {selected.resource}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={decisionColor(selected.decision)}>{selected.decision}</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <EuiSpacer />
        <div className="p39Trace">
          <article><b>1</b><div><strong>Explicit deny</strong><small>{selected.decision === 'Deny' ? 'Matched resource restriction' : 'No matching explicit deny'}</small></div></article>
          <article><b>2</b><div><strong>Direct and group grants</strong><small>{selected.origin} · {selected.grantState}</small></div></article>
          <article><b>3</b><div><strong>Context conditions</strong><small>{selected.scope} · risk {selected.risk}</small></div></article>
          <article><b>4</b><div><strong>Final precedence</strong><small>{selected.decision} · evaluated {selected.lastDecision}</small></div></article>
        </div>
        <EuiCallOut title="Evidence, not mutation" color="warning">This trace explains the recorded decision. Opening it does not grant, revoke or refresh access.</EuiCallOut>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiButton onClick={closeDecision}>Close trace</EuiButton></EuiFlyoutFooter>
    </EuiFlyout>}

    {requestOpen && <EuiFlyout onClose={closeRequest} ownFocus size="s" aria-labelledby="p39-request-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p39-request-title">Request access</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiFormRow label="Principal"><EuiFieldText value={principal} readOnly /></EuiFormRow><EuiFormRow label="Capability"><EuiFieldText value={capability} readOnly /></EuiFormRow><EuiFormRow label="Resource"><EuiFieldText value={resource} readOnly /></EuiFormRow><EuiFormRow label="Reason"><EuiTextArea value={requestReason} onChange={(event: ChangeEvent) => setRequestReason(event.target.value)} rows={4} /></EuiFormRow><EuiFormRow label="Requested expiry"><EuiSelect value={requestedExpiry} onChange={(event: ChangeEvent) => setRequestedExpiry(event.target.value)} options={['1 hour','8 hours','24 hours','7 days'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiCallOut title="Approval is not access" color="warning">A queued or approved request does not change effective access until an authorization receipt is rehydrated.</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={closeRequest}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queueRequest}>Queue request</EuiButton></EuiFlyoutFooter></EuiFlyout>}

    {changeOpen && selected && <EuiModal onClose={closeChange} aria-labelledby="p39-change-title"><EuiModalHeader><EuiModalHeaderTitle id="p39-change-title">{changeMode} access impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Governed authorization change" color="warning">The prototype creates a review receipt only. Effective access remains unchanged until authoritative evaluation completes.</EuiCallOut><ul><li>Grant record: {selected.id}</li><li>Principal: {selected.principal}</li><li>Capability: {selected.capability}</li><li>Resource: {selected.resource}</li><li>Current decision: {selected.decision}</li><li>Conflict: {selected.conflict}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={closeChange}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queueChange}>Queue {changeMode.toLowerCase()} review</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}