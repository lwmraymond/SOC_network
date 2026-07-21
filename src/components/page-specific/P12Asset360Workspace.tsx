import { useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiCodeBlock,
  EuiFieldSearch,
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
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { PrototypePageFixture, PrototypeRow, PrototypeValue } from '../../types/prototype';
import './P12Asset360Workspace.css';

/*
 * H01 Asset Detail / P12 shared-route workflow contract
 * - Canonical route: /devices/assets/:assetId; no duplicate H01 page is created.
 * - Identity, revision, active tab and scoped filters are URL-restorable.
 * - Asset, ITSM CI and business service remain separate object identities.
 * - Evidence/provenance opens in a Flyout; governed actions use an impact Modal.
 * - Every write-like action produces a prototype queued receipt only.
 */

type Tab = 'Overview' | 'Timeline' | 'Security' | 'Vulnerabilities' | 'Software' | 'Relationships' | 'Audit';
type DecisionAction = 'Request response action' | 'Create or attach Case' | 'Create ITSM Incident' | 'Create Change' | 'Submit identity / CMDB correction';
type ChangeEvent = { target: { value: string } };
type SourceEvidence = { source: string; role: string; confidence: number; state: string; field: string; value: string; revision: string };
type Relationship = { type: string; target: string; objectType: 'CI' | 'Service' | 'Security object' | 'Owner'; state: string; impact: string };

type AssetIdentity = {
  id: string;
  name: string;
  aliases: string[];
  owner: string;
  criticality: string;
  lifecycle: string;
  health: string;
  lastSeen: string;
  risk: number;
  revision: string;
  ciRef: string;
  serviceRef: string;
};

const tabs: Tab[] = ['Overview', 'Timeline', 'Security', 'Vulnerabilities', 'Software', 'Relationships', 'Audit'];
const text = (value: PrototypeValue | undefined, fallback: string) => value === undefined ? fallback : String(value);
const number = (value: PrototypeValue | undefined, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeInternalReturn = (value: string | null) => value && value.startsWith('/devices/') && !value.startsWith('//') ? value : '/devices/inventory';

function rowIdentity(row: PrototypeRow) {
  return String(row.asset_id ?? row.id);
}

export function P12Asset360Workspace({ fixture }: { fixture: PrototypePageFixture }) {
  const navigate = useNavigate();
  const { assetId: routeAssetId = 'asset-demo' } = useParams<{ assetId: string }>();
  const [params, setParams] = useSearchParams();
  const [evidence, setEvidence] = useState<SourceEvidence | undefined>(undefined);
  const [decision, setDecision] = useState<DecisionAction | undefined>(undefined);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionConfirmed, setDecisionConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);
  const overlayOpener = useRef<HTMLButtonElement | null>(null);

  const routeRow = useMemo(
    () => fixture.rows.find((row) => rowIdentity(row) === routeAssetId) ?? fixture.rows[0],
    [fixture.rows, routeAssetId],
  );
  const identity = useMemo<AssetIdentity>(() => ({
    id: routeAssetId,
    name: text(routeRow?.canonical_name ?? routeRow?.host ?? routeRow?.title, routeAssetId.replaceAll('-', ' ')),
    aliases: [text(routeRow?.hostname, `${routeAssetId}.example.internal`), text(routeRow?.cloud_instance_id, `i-${routeAssetId.slice(-8)}`)],
    owner: text(routeRow?.owner, 'Platform identity'),
    criticality: text(routeRow?.criticality, 'Critical'),
    lifecycle: text(routeRow?.lifecycle, 'Active'),
    health: text(routeRow?.health, 'Degraded'),
    lastSeen: text(routeRow?.last_seen ?? routeRow?.last_seen_at, '3m ago'),
    risk: number(routeRow?.risk_score, 86),
    revision: params.get('revision') ?? text(routeRow?.revision, 'asset-r18'),
    ciRef: text(routeRow?.itsm_ci_ref, 'CI-00421'),
    serviceRef: text(routeRow?.service_ref, 'SVC-IDENTITY-API'),
  }), [params, routeAssetId, routeRow]);

  const activeTab = tabs.includes(params.get('tab') as Tab) ? params.get('tab') as Tab : 'Overview';
  const returnTo = safeInternalReturn(params.get('returnTo'));
  const timelineRange = params.get('time') ?? '24h';
  const eventCategory = params.get('category') ?? 'All activity';
  const sourceFilter = params.get('source') ?? 'All sources';
  const relationshipFilter = params.get('relationship') ?? 'All relationship types';
  const vulnerabilityFilter = params.get('vulnerability') ?? 'Open';
  const search = params.get('q') ?? '';

  const sourceEvidence = useMemo<SourceEvidence[]>(() => [
    { source: 'Endpoint agent', role: 'Telemetry observation', confidence: 98, state: 'Fresh', field: 'telemetry_health', value: identity.health, revision: 'agent-policy@r42' },
    { source: 'ITSM CMDB', role: 'CI-owned configuration', confidence: 96, state: 'Authoritative', field: 'itsm_ci_ref', value: identity.ciRef, revision: 'cmdb-sync@r31' },
    { source: 'Cloud inventory', role: 'Infrastructure observation', confidence: 78, state: 'Hostname conflict', field: 'canonical_name', value: identity.name, revision: 'cloud-map@r12' },
    { source: 'Identity graph', role: 'Relationship enrichment', confidence: 91, state: 'Correlated', field: 'owner', value: identity.owner, revision: 'identity-graph@r27' },
  ], [identity]);

  const relationships = useMemo<Relationship[]>(() => [
    { type: 'configured_as', target: identity.ciRef, objectType: 'CI', state: 'Synchronized', impact: 'CMDB owns configuration fields' },
    { type: 'supports', target: identity.serviceRef, objectType: 'Service', state: 'Critical path', impact: 'Customer identity traffic' },
    { type: 'linked_to', target: 'CASE-1024', objectType: 'Security object', state: 'Active', impact: 'Credential misuse investigation' },
    { type: 'affected_by', target: 'CHG-718', objectType: 'Security object', state: 'Scheduled', impact: 'Authentication library upgrade' },
    { type: 'owned_by', target: identity.owner, objectType: 'Owner', state: 'Confirmed', impact: 'Operational accountability' },
  ], [identity]);

  const visibleTimeline = useMemo(() => fixture.timeline.filter((item) => {
    const haystack = `${item.title} ${item.detail} ${item.status}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase()))
      && (eventCategory === 'All activity' || haystack.includes(eventCategory.toLowerCase().split(' ')[0]))
      && (sourceFilter === 'All sources' || haystack.includes(sourceFilter.toLowerCase().split(' ')[0]));
  }).slice(0, timelineRange === '7d' ? 12 : 8), [eventCategory, fixture.timeline, search, sourceFilter, timelineRange]);

  const setUrlValue = (key: string, value: string | undefined) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (!value) next.delete(key); else next.set(key, value);
    return next;
  }, { replace: true });

  const selectTab = (tab: Tab) => setUrlValue('tab', tab === 'Overview' ? undefined : tab);
  const openEvidence = (item: SourceEvidence, event: MouseEvent<HTMLButtonElement>) => {
    overlayOpener.current = event.currentTarget;
    setEvidence(item);
  };
  const closeEvidence = () => {
    setEvidence(undefined);
    requestAnimationFrame(() => overlayOpener.current?.focus());
  };
  const openDecision = (action: DecisionAction, event: MouseEvent<HTMLButtonElement>) => {
    overlayOpener.current = event.currentTarget;
    setDecision(action);
    setDecisionReason('');
    setDecisionConfirmed(false);
  };
  const closeDecision = () => {
    setDecision(undefined);
    setDecisionReason('');
    setDecisionConfirmed(false);
    requestAnimationFrame(() => overlayOpener.current?.focus());
  };
  const queueDecision = () => {
    if (!decision) return;
    const requestId = `request-${crypto.randomUUID()}`;
    setReceipt(`${decision} queued · ${requestId} · target ${identity.id} @ ${identity.revision} · authoritative rehydration pending. No production asset, CI, service, Case, Incident, Change or response state changed.`);
    closeDecision();
  };

  const decisionBoundary = decision === 'Submit identity / CMDB correction'
    ? `The proposal targets ${identity.ciRef}; ITSM CMDB remains authoritative for CI-owned fields.`
    : decision === 'Create ITSM Incident' || decision === 'Create Change'
      ? 'The ITSM object is only requested from asset context. A queued receipt is not an ITSM record.'
      : 'Eligibility, permission and target snapshot must be revalidated by the authoritative service.';

  const matchingRelationships = relationships.filter((item) => relationshipFilter === 'All relationship types' || item.objectType === relationshipFilter);
  const vulnerabilityRows = fixture.rows.slice(0, 8).filter((_, index) => vulnerabilityFilter === 'All states' || (vulnerabilityFilter === 'Open' ? index < 6 : index >= 6));

  return <div className="pageComposition differentiatedPage h01AssetDetail" data-page-specific-composition="H01-asset-detail-identity-provenance-action">
    {receipt && <EuiCallOut title="Prototype asset workflow receipt · queued" color="warning" className="h01Receipt">{receipt}</EuiCallOut>}

    <EuiPanel paddingSize="m" hasBorder data-visual-region="h01-asset-identity-header">
      <EuiFlexGroup alignItems="center" gutterSize="m" wrap>
        <EuiFlexItem grow={false}><div className="h01IdentityGlyph" aria-hidden="true">A</div></EuiFlexItem>
        <EuiFlexItem>
          <EuiButtonEmpty size="xs" iconType="arrowLeft" onClick={() => navigate(returnTo)}>Back to asset inventory</EuiButtonEmpty>
          <EuiTitle size="l"><h2>{identity.name}</h2></EuiTitle>
          <p>{identity.id} · {identity.owner} · last seen {identity.lastSeen}</p>
          <div className="h01BadgeRow"><EuiBadge color="danger">{identity.criticality}</EuiBadge><EuiBadge color="success">{identity.lifecycle}</EuiBadge><EuiBadge color="warning">{identity.health}</EuiBadge><EuiBadge color="hollow">Revision {identity.revision}</EuiBadge><EuiBadge color="hollow">asset.read</EuiBadge></div>
        </EuiFlexItem>
        <EuiFlexItem grow={false}><div className="h01Risk"><strong>{identity.risk}</strong><span>Asset risk</span></div></EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>

    <div className="h01WorkflowLayout">
      <EuiPanel paddingSize="m" hasBorder className="h01Provenance" data-visual-region="h01-source-provenance">
        <EuiTitle size="s"><h2>Identity and provenance</h2></EuiTitle>
        <p className="h01Supporting">Compare source authority before acting on the canonical asset.</p>
        <div className="h01SourceList">{sourceEvidence.map((item) => <button type="button" key={item.source} onClick={(event) => openEvidence(item, event)}>
          <span><strong>{item.source}</strong><EuiBadge color={item.state.includes('conflict') ? 'warning' : item.state === 'Fresh' || item.state === 'Authoritative' ? 'success' : 'hollow'}>{item.state}</EuiBadge></span>
          <small>{item.role}</small><EuiProgress value={item.confidence} max={100} size="s" color={item.confidence < 85 ? 'warning' : 'primary'} /><small>{item.confidence}% confidence · {item.revision}</small>
        </button>)}</div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="h01Workspace" data-visual-region="h01-asset-tabbed-workspace">
        <div className="h01Tabs" role="tablist" aria-label="Asset detail views">{tabs.map((item) => <button key={item} type="button" role="tab" aria-selected={activeTab === item} onClick={() => selectTab(item)}>{item}</button>)}</div>
        <EuiSpacer size="m" />

        {activeTab === 'Overview' && <>
          <EuiCallOut title="Asset, CI and service are separate objects" color="primary">This workflow uses the Asset as the investigation anchor. {identity.ciRef} remains the ITSM configuration record, while {identity.serviceRef} supplies service-impact context.</EuiCallOut>
          <EuiSpacer size="m" />
          <dl className="h01DefinitionGrid">
            <div><dt>Canonical asset</dt><dd>{identity.id}<small>Security and telemetry entity</small></dd></div>
            <div><dt>Aliases</dt><dd>{identity.aliases.join(' · ')}</dd></div>
            <div><dt>ITSM CI</dt><dd>{identity.ciRef}<small>Configuration source of truth</small></dd></div>
            <div><dt>Business service</dt><dd>{identity.serviceRef}<small>Impact and ownership context</small></dd></div>
            <div><dt>Telemetry</dt><dd>{identity.health}<small>Endpoint agent · {identity.lastSeen}</small></dd></div>
            <div><dt>Current security work</dt><dd>4 alerts · CASE-1024<small>Case closure does not change CI state</small></dd></div>
          </dl>
          <EuiSpacer size="m" />
          <EuiTitle size="xs"><h3>Decision summary</h3></EuiTitle>
          <div className="h01DecisionSummary"><article><strong>2</strong><span>Source conflicts</span></article><article><strong>3 critical</strong><span>Open exposures</span></article><article><strong>1 Change</strong><span>Scheduled impact</span></article></div>
        </>}

        {activeTab === 'Timeline' && <>
          <div className="h01FilterRow"><EuiFieldSearch compressed aria-label="Search asset activity" value={search} onChange={(event: ChangeEvent) => setUrlValue('q', event.target.value || undefined)} placeholder="Activity, source, status or evidence" /><EuiSelect compressed aria-label="Timeline range" value={timelineRange} onChange={(event: ChangeEvent) => setUrlValue('time', event.target.value)} options={['24h', '7d'].map((value) => ({ value, text: value }))} /><EuiSelect compressed aria-label="Event category" value={eventCategory} onChange={(event: ChangeEvent) => setUrlValue('category', event.target.value === 'All activity' ? undefined : event.target.value)} options={['All activity', 'Security', 'Vulnerability', 'Response', 'ITSM'].map((value) => ({ value, text: value }))} /><EuiSelect compressed aria-label="Activity source" value={sourceFilter} onChange={(event: ChangeEvent) => setUrlValue('source', event.target.value === 'All sources' ? undefined : event.target.value)} options={['All sources', 'Security', 'Vulnerability', 'Response', 'ITSM'].map((value) => ({ value, text: value }))} /></div>
          <div className="h01Timeline">{visibleTimeline.map((item, index) => <button type="button" key={`${item.time}-${item.title}-${index}`} onClick={(event) => openEvidence({ source: item.status, role: 'Timeline evidence', confidence: 88, state: item.status, field: 'activity', value: item.detail, revision: identity.revision }, event)}><time>{item.time}</time><span><strong>{item.title}</strong><small>{item.detail}</small></span><EuiBadge color="hollow">{item.status}</EuiBadge></button>)}</div>
        </>}

        {activeTab === 'Security' && <div className="h01TableWrap"><table><thead><tr><th>Security object</th><th>Type</th><th>Severity</th><th>Status</th><th>Owner</th><th>Last activity</th></tr></thead><tbody>{fixture.rows.slice(0, 7).map((row, index) => <tr key={`${row.id}-${index}`}><td>{text(row.case_ref ?? row.id, `ALERT-${index + 1}`)}</td><td>{index % 2 ? 'Alert' : 'Case'}</td><td><EuiBadge color={/critical|high/i.test(row.severity) ? 'danger' : 'warning'}>{row.severity}</EuiBadge></td><td>{row.status}</td><td>{row.owner}</td><td>{text(row.updated_at, `${index + 1}h ago`)}</td></tr>)}</tbody></table></div>}

        {activeTab === 'Vulnerabilities' && <><div className="h01FilterRow compact"><EuiSelect compressed aria-label="Vulnerability state" value={vulnerabilityFilter} onChange={(event: ChangeEvent) => setUrlValue('vulnerability', event.target.value === 'Open' ? undefined : event.target.value)} options={['Open', 'Remediated', 'All states'].map((value) => ({ value, text: value }))} /></div><div className="h01TableWrap"><table><thead><tr><th>Vulnerability</th><th>Component</th><th>Severity</th><th>State</th><th>Evidence</th></tr></thead><tbody>{vulnerabilityRows.map((row, index) => <tr key={`${row.id}-vuln-${index}`}><td>CVE-2026-{6100 + index}</td><td>{['openssl', 'kernel', 'spring', 'chrome'][index % 4]}</td><td><EuiBadge color={index < 3 ? 'danger' : 'warning'}>{index < 3 ? 'Critical' : 'High'}</EuiBadge></td><td>{index < 6 ? 'Open' : 'Remediated'}</td><td>{2 + index} sources</td></tr>)}</tbody></table></div></>}

        {activeTab === 'Software' && <div className="h01TableWrap"><table><thead><tr><th>Package</th><th>Version</th><th>Observation</th><th>Sources</th><th>Last observed</th></tr></thead><tbody>{[['openssl', '3.0.8', 'Affected'], ['linux kernel', '6.1.0', 'Observed'], ['nginx', '1.26.1', 'Approved'], ['java', '21.0.2', 'Observed']].map(([name, version, state], index) => <tr key={name}><td>{name}</td><td>{version}</td><td>{state}</td><td>{2 + index}</td><td>{index + 1}h ago</td></tr>)}</tbody></table></div>}

        {activeTab === 'Relationships' && <><div className="h01FilterRow compact"><EuiSelect compressed aria-label="Relationship type" value={relationshipFilter} onChange={(event: ChangeEvent) => setUrlValue('relationship', event.target.value === 'All relationship types' ? undefined : event.target.value)} options={['All relationship types', 'CI', 'Service', 'Security object', 'Owner'].map((value) => ({ value, text: value }))} /></div><div className="h01RelationshipList">{matchingRelationships.map((item) => <article key={`${item.type}-${item.target}`}><span><EuiBadge color={item.objectType === 'Service' ? 'warning' : item.objectType === 'CI' ? 'primary' : 'hollow'}>{item.objectType}</EuiBadge><strong>{item.target}</strong></span><small>{identity.id} {item.type} {item.target}</small><p>{item.impact}</p><EuiBadge color="hollow">{item.state}</EuiBadge></article>)}</div></>}

        {activeTab === 'Audit' && <div className="h01Audit">{fixture.timeline.slice(0, 8).map((item, index) => <article key={`${item.time}-audit-${index}`}><time>{item.time}</time><span><strong>{index % 2 ? 'Field reconciliation' : 'Action request'}</strong><small>{item.title}</small></span><code>audit-{identity.id}-{String(index + 1).padStart(3, '0')}</code></article>)}</div>}
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="h01ActionRail" data-visual-region="h01-context-actions">
        <EuiTitle size="s"><h2>Context actions</h2></EuiTitle><p className="h01Supporting">Actions use a revisioned target snapshot and produce a queued prototype receipt.</p>
        <EuiButton fill fullWidth onClick={(event) => openDecision('Request response action', event)}>Request response action</EuiButton>
        <EuiButton fullWidth onClick={(event) => openDecision('Create or attach Case', event)}>Create or attach Case</EuiButton>
        <EuiButton fullWidth onClick={(event) => openDecision('Create ITSM Incident', event)}>Create ITSM Incident</EuiButton>
        <EuiButton fullWidth onClick={(event) => openDecision('Create Change', event)}>Create Change</EuiButton>
        <EuiButtonEmpty onClick={(event) => openDecision('Submit identity / CMDB correction', event)}>Suggest identity correction</EuiButtonEmpty>
        <EuiSpacer size="m" />
        <EuiCallOut title="Authority boundary" size="s">CMDB owns CI fields. Security telemetry and Case evidence remain separate. Service restoration does not automatically close a SOC Case.</EuiCallOut>
      </EuiPanel>
    </div>

    {evidence && <EuiFlyout onClose={closeEvidence} ownFocus size="m" aria-labelledby="h01-evidence-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="h01-evidence-title">Evidence and source-field inspector</h2></EuiTitle><p>{identity.id} · {identity.revision}</p></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Provenance preserved">This view explains one observation; it does not change canonical Asset, CI or Service data.</EuiCallOut><EuiSpacer size="m" /><dl className="h01FlyoutDetails"><div><dt>Source</dt><dd>{evidence.source}</dd></div><div><dt>Source role</dt><dd>{evidence.role}</dd></div><div><dt>Field</dt><dd>{evidence.field}</dd></div><div><dt>Observed value</dt><dd>{evidence.value}</dd></div><div><dt>Confidence</dt><dd>{evidence.confidence}%</dd></div><div><dt>Revision</dt><dd>{evidence.revision}</dd></div></dl><EuiSpacer size="m" /><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ assetId: identity.id, source: evidence.source, sourceRole: evidence.role, field: evidence.field, observedValue: evidence.value, confidence: evidence.confidence, state: evidence.state, revision: evidence.revision, authoritativeMutation: false }, null, 2)}</EuiCodeBlock></EuiFlyoutBody><EuiFlyoutFooter><EuiButton onClick={closeEvidence}>Close evidence</EuiButton></EuiFlyoutFooter></EuiFlyout>}

    {decision && <EuiModal onClose={closeDecision} aria-labelledby="h01-decision-title"><EuiModalHeader><EuiModalHeaderTitle id="h01-decision-title">{decision} impact review</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype simulation · no production mutation" color="warning">{decisionBoundary}</EuiCallOut><EuiSpacer size="m" /><dl className="h01ModalDetails"><div><dt>Asset</dt><dd>{identity.id}</dd></div><div><dt>Expected revision</dt><dd>{identity.revision}</dd></div><div><dt>ITSM CI</dt><dd>{identity.ciRef}</dd></div><div><dt>Service</dt><dd>{identity.serviceRef}</dd></div><div><dt>Rehydration</dt><dd>Pending after queue acceptance</dd></div></dl><EuiFormRow label="Decision reason" helpText="Required for the prototype receipt; no secret or sensitive raw evidence."><EuiTextArea value={decisionReason} onChange={(event: ChangeEvent) => setDecisionReason(event.target.value)} rows={4} /></EuiFormRow><EuiCheckbox id="h01-confirm-decision" checked={decisionConfirmed} onChange={(event) => setDecisionConfirmed(event.target.checked)} label="Confirm the target snapshot and prototype-only boundary" /></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={closeDecision}>Cancel</EuiButtonEmpty><EuiButton fill isDisabled={decisionReason.trim().length < 10 || !decisionConfirmed} onClick={queueDecision}>Queue prototype request</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}
