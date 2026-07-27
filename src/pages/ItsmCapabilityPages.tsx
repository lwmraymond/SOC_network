import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiComboBox,
  EuiFieldNumber,
  EuiFieldSearch,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPageTemplate,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type {
  AutomationRule,
  ImpactPreview,
  InboundMailbox,
  MutationContext,
  NotificationProvider,
  QueuedReceipt,
  SlaPolicy,
  Ticket,
  TicketBundle,
  ViewState,
} from '../itsm/contracts';
import { isItsmFixtureMode, itsmApi } from '../itsm/client';
import { useItsmMutation, useItsmQuery } from '../itsm/hooks';

const demoContext = (etag?: string, version?: string): MutationContext => ({
  idempotencyKey: `ui-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  ifMatch: etag,
  expectedVersion: version,
  reason: 'Frontend governed-write review',
});

const stateCopy: Record<Exclude<ViewState, 'ready'>, { title: string; body: string; color: 'primary' | 'warning' | 'danger' }> = {
  loading: { title: 'Loading capability data', body: 'Resolving adapter capability, permission and source watermark before rendering business values.', color: 'primary' },
  empty: { title: 'No records are available', body: 'This is a valid empty state. The UI does not synthesize zero values or local production-looking records.', color: 'primary' },
  'filtered-empty': { title: 'No records match the active conditions', body: 'Clear one condition or widen the scope; the current query is preserved.', color: 'primary' },
  error: { title: 'Unable to load this capability', body: 'The adapter returned a classified error. No fixture fallback is attempted in production.', color: 'danger' },
  denied: { title: 'Access denied', body: 'The capability decision denied this surface without exposing hidden resource counts.', color: 'danger' },
  offline: { title: 'Offline', body: 'Cached values are not shown as authoritative. Write actions remain disabled.', color: 'warning' },
  stale: { title: 'Stale source watermark', body: 'Data remains visible for review, but writes require a fresh authoritative read.', color: 'warning' },
  partial: { title: 'Partial coverage', body: 'Some resources or adapter calls failed. Available sections preserve explicit partial-failure metadata.', color: 'warning' },
};

const viewStates: ViewState[] = ['ready','loading','empty','filtered-empty','error','denied','offline','stale','partial'];

type CapabilityShellProps = {
  title: string;
  description: string;
  queryState: ViewState;
  errorMessage?: string;
  rightSideItems?: React.ReactNode[];
  children: React.ReactNode;
};

function CapabilityShell({ title, description, queryState, errorMessage, rightSideItems, children }: CapabilityShellProps) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('state') as ViewState | null;
  const state = requested && viewStates.includes(requested) ? requested : queryState;
  const blocking = ['loading','empty','filtered-empty','error','denied','offline'].includes(state);
  const setState = (next: ViewState) => {
    const updated = new URLSearchParams(params);
    if (next === 'ready') updated.delete('state'); else updated.set('state', next);
    setParams(updated, { replace: false });
  };
  return <EuiPageTemplate restrictWidth={2800} className="itsmCapabilityPage" data-capability-state={state}>
    <EuiPageTemplate.Header pageTitle={title} description={description} paddingSize="m" bottomBorder="extended" rightSideItems={rightSideItems} />
    <EuiPageTemplate.Section paddingSize="m">
      <EuiPanel paddingSize="s" hasBorder className="itsmCapabilityContext">
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
          <EuiFlexItem><EuiBadge color={isItsmFixtureMode ? 'warning' : 'hollow'}>{isItsmFixtureMode ? 'Development fixture adapter' : 'Production adapter required'}</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Queued ≠ completed</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">ETag / version required</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Authoritative refresh required</EuiBadge></EuiFlexItem>
          {import.meta.env.DEV && <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Capability state switcher" value={state} onChange={(event) => setState(event.target.value as ViewState)} options={viewStates.map((value) => ({ value, text: value }))} /></EuiFlexItem>}
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      {state !== 'ready' && <><EuiCallOut title={stateCopy[state].title} color={stateCopy[state].color}>{errorMessage ?? stateCopy[state].body}</EuiCallOut><EuiSpacer size="m" /></>}
      {!blocking && children}
      {state === 'loading' && <div className="itsmCenteredState" role="status"><EuiLoadingSpinner size="xl" /><span>Loading permissions, capability and authoritative data…</span></div>}
    </EuiPageTemplate.Section>
  </EuiPageTemplate>;
}

type GovernedActionProps<T> = {
  label: string;
  fill?: boolean;
  color?: 'primary' | 'warning' | 'danger';
  preview: (signal: AbortSignal) => Promise<ImpactPreview>;
  execute: (signal: AbortSignal) => Promise<{ receipt: QueuedReceipt }>;
  rehydrate: (receipt: QueuedReceipt, signal: AbortSignal) => Promise<T>;
};

function GovernedAction<T>({ label, fill, color = 'primary', preview, execute, rehydrate }: GovernedActionProps<T>) {
  const [open, setOpen] = useState(false);
  const mutation = useItsmMutation<{}, T>({
    preview: (_input, signal) => preview(signal),
    execute: (_input, signal) => execute(signal),
    rehydrate: (_input, receipt, signal) => rehydrate(receipt, signal),
  });
  const start = () => { setOpen(true); void mutation.requestPreview({}); };
  return <>
    <EuiButton fill={fill} color={color} onClick={start}>{label}</EuiButton>
    {open && <EuiModal onClose={() => { setOpen(false); mutation.reset(); }} aria-labelledby="governed-action-title">
      <EuiModalHeader><EuiModalHeaderTitle id="governed-action-title">Impact preview and governed write</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody>
        {mutation.state.stage === 'previewing' && <div className="itsmCenteredState"><EuiLoadingSpinner /><span>Calculating validation, permissions and affected resources…</span></div>}
        {mutation.state.preview && <>
          <EuiCallOut title={mutation.state.preview.summary} color={mutation.state.preview.validation.some((item) => item.severity === 'error') ? 'danger' : 'warning'}>
            Preview only. No production resource has changed.
          </EuiCallOut>
          <EuiSpacer />
          <dl className="itsmDefinitionGrid">
            <div><dt>Operation</dt><dd>{mutation.state.preview.operation}</dd></div>
            <div><dt>Expires</dt><dd>{mutation.state.preview.expiresAt}</dd></div>
            <div><dt>Affected resources</dt><dd>{mutation.state.preview.affectedResources.map((item) => `${item.type}:${item.id} (${item.effect})`).join(', ')}</dd></div>
            <div><dt>Warnings</dt><dd>{mutation.state.preview.warnings.join(' ') || 'None'}</dd></div>
          </dl>
        </>}
        {['confirming','queued','rehydrating'].includes(mutation.state.stage) && <EuiCallOut title={mutation.state.stage === 'confirming' ? 'Submitting idempotent write' : mutation.state.stage === 'queued' ? 'Queued receipt received' : 'Refreshing authoritative resource'} color="warning">
          {mutation.state.receipt ? `${mutation.state.receipt.receiptId} · state ${mutation.state.receipt.state}. This is not completion.` : 'Waiting for adapter response.'}
        </EuiCallOut>}
        {mutation.state.stage === 'complete' && <EuiCallOut title="Refresh cycle completed" color={isItsmFixtureMode ? 'warning' : 'success'}>{isItsmFixtureMode ? 'Development adapter rehydration completed; the result remains non-authoritative fixture data.' : 'The resource was re-read from the authoritative adapter.'}</EuiCallOut>}
        {mutation.state.error && <EuiCallOut title="Write failed" color="danger">{mutation.state.error.message}</EuiCallOut>}
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={() => { setOpen(false); mutation.reset(); }}>Close</EuiButtonEmpty>
        {mutation.state.stage === 'preview' && <EuiButton fill onClick={() => void mutation.confirm()} isDisabled={Boolean(mutation.state.preview?.validation.some((item) => item.severity === 'error'))}>Confirm queued write</EuiButton>}
      </EuiModalFooter>
    </EuiModal>}
  </>;
}

function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (value: string) => void }) {
  return <EuiTabs size="s">{items.map((item) => <EuiTab key={item} isSelected={active === item} onClick={() => onChange(item)}>{item}</EuiTab>)}</EuiTabs>;
}

function ticketKindLabel(ticket: Ticket) {
  return ticket.kind === 'request' ? 'Service request' : ticket.kind[0].toUpperCase() + ticket.kind.slice(1);
}

function TicketOverview({ bundle }: { bundle: TicketBundle }) {
  const ticket = bundle.ticket;
  return <div className="itsmTicketColumns">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Core record</h2></EuiTitle><EuiSpacer size="s" />
      <dl className="itsmDefinitionGrid">
        <div><dt>Status</dt><dd>{ticket.status}</dd></div><div><dt>Priority</dt><dd>{ticket.priority}</dd></div>
        <div><dt>Service</dt><dd>{ticket.serviceName}</dd></div><div><dt>Assignment group</dt><dd>{ticket.assignmentGroup ?? 'Unassigned'}</dd></div>
        <div><dt>Requester</dt><dd>{ticket.requesterId}</dd></div><div><dt>Assignee</dt><dd>{ticket.assigneeId ?? 'Unassigned'}</dd></div>
        <div><dt>Source</dt><dd>{ticket.source}{ticket.sourceReference ? ` · ${ticket.sourceReference}` : ''}</dd></div><div><dt>Version</dt><dd>{ticket.version} · {ticket.etag}</dd></div>
      </dl><EuiSpacer /><EuiText size="s"><p>{ticket.description}</p></EuiText>
    </EuiPanel>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>{ticketKindLabel(ticket)} workflow</h2></EuiTitle><EuiSpacer size="s" />
      {ticket.kind === 'request' && <dl className="itsmDefinitionGrid"><div><dt>Request type</dt><dd>{ticket.requestTypeName}</dd></div><div><dt>Fulfilment stage</dt><dd>{ticket.fulfilmentStage}</dd></div><div><dt>Beneficiary</dt><dd>{ticket.beneficiaryId ?? ticket.requesterId}</dd></div><div><dt>Dynamic fields</dt><dd>{Object.entries(ticket.dynamicFields).map(([key,value]) => `${key}: ${String(value)}`).join(' · ')}</dd></div></dl>}
      {ticket.kind === 'incident' && <dl className="itsmDefinitionGrid"><div><dt>Impact</dt><dd>{ticket.impact}</dd></div><div><dt>Urgency</dt><dd>{ticket.urgency}</dd></div><div><dt>Lifecycle</dt><dd>{ticket.lifecycleStage}</dd></div><div><dt>Major incident</dt><dd>{ticket.majorIncident ? 'Yes' : 'No'}</dd></div><div><dt>Affected objects</dt><dd>{ticket.affectedObjectIds.join(', ')}</dd></div></dl>}
      {ticket.kind === 'problem' && <dl className="itsmDefinitionGrid"><div><dt>Known error</dt><dd>{ticket.knownError ? 'Yes' : 'No'}</dd></div><div><dt>RCA state</dt><dd>{ticket.rcaStatus}</dd></div><div><dt>Root cause</dt><dd>{ticket.rootCause ?? 'Not documented'}</dd></div><div><dt>Workaround</dt><dd>{ticket.workaround ?? 'Not documented'}</dd></div><div><dt>Linked incidents</dt><dd>{ticket.linkedIncidentIds.join(', ')}</dd></div></dl>}
      {ticket.kind === 'change' && <dl className="itsmDefinitionGrid"><div><dt>Change type</dt><dd>{ticket.changeType}</dd></div><div><dt>Risk</dt><dd>{ticket.riskLevel}</dd></div><div><dt>CAB required</dt><dd>{ticket.cabRequired ? 'Yes' : 'No'}</dd></div><div><dt>Window</dt><dd>{ticket.implementationWindow.startsAt} – {ticket.implementationWindow.endsAt} ({ticket.implementationWindow.timezone})</dd></div></dl>}
    </EuiPanel>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Capability &amp; integrity</h2></EuiTitle><EuiSpacer size="s" />
      {ticket.permissions.map((permission) => <div className="itsmCapabilityRow" key={permission.capability}><span>{permission.capability}</span><EuiBadge color={permission.decision === 'allow' ? 'success' : permission.decision === 'deny' ? 'danger' : 'warning'}>{permission.decision}</EuiBadge></div>)}
      <EuiSpacer /><EuiCallOut title="Authoritative concurrency">Every write includes the current ETag/version and an idempotency key, then re-reads the ticket after the receipt.</EuiCallOut>
    </EuiPanel>
  </div>;
}

function TicketConversation({ bundle }: { bundle: TicketBundle }) {
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public');
  const [body, setBody] = useState('');
  const [attachmentNotice, setAttachmentNotice] = useState<string>();
  const mutation = useItsmMutation<{ body: string; visibility: 'public' | 'internal' }, TicketBundle>({
    preview: (input, signal) => itsmApi.previewCreateComment(bundle.ticket.id, { body: input.body, visibility: input.visibility, mentions: Array.from(input.body.matchAll(/@([\w-]+)/g)).map((match) => match[1]), attachmentIds: [] }, signal),
    execute: async (input, signal) => {
      const result = await itsmApi.createComment(bundle.ticket.id, { body: input.body, visibility: input.visibility, mentions: Array.from(input.body.matchAll(/@([\w-]+)/g)).map((match) => match[1]), attachmentIds: [] }, demoContext(bundle.ticket.etag, bundle.ticket.version), signal);
      return { receipt: result.receipt };
    },
    rehydrate: (_input, receipt, signal) => itsmApi.refreshTicket(bundle.ticket.id, receipt.receiptId, signal),
  });
  const openPreview = () => { if (body.trim()) void mutation.requestPreview({ body: body.trim(), visibility }); };
  return <div className="itsmConversationLayout">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Conversation</h2></EuiTitle><EuiSpacer size="s" />
      <div className="itsmThread">{bundle.comments.length === 0 ? <EuiCallOut title="No conversation yet">Public replies and internal notes will appear in one auditable thread.</EuiCallOut> : bundle.comments.map((comment) => <article key={comment.id} className={`itsmComment ${comment.visibility}`}>
        <div><strong>{comment.authorDisplayName}</strong><EuiBadge color={comment.visibility === 'internal' ? 'warning' : 'hollow'}>{comment.visibility === 'internal' ? 'Internal note' : 'Public reply'}</EuiBadge><EuiBadge color="hollow">{comment.source}</EuiBadge></div>
        <p>{comment.body}</p><small>{comment.createdAt} · event {comment.id}{comment.sourceMessageId ? ` · ${comment.sourceMessageId}` : ''}</small>
      </article>)}</div>
    </EuiPanel>
    <EuiPanel paddingSize="m" hasBorder className="itsmComposer">
      <Tabs items={['Public reply','Internal note']} active={visibility === 'public' ? 'Public reply' : 'Internal note'} onChange={(value) => setVisibility(value === 'Public reply' ? 'public' : 'internal')} />
      <EuiSpacer size="s" /><EuiFormRow label={visibility === 'public' ? 'Reply visible to requester' : 'Internal note visible to permitted agents'} helpText="Use @mention syntax. Mentions remain contract-only until identity resolution is connected.">
        <EuiTextArea value={body} onChange={(event) => setBody(event.target.value)} rows={7} placeholder={visibility === 'public' ? 'Write a requester-visible update…' : 'Write an internal operational note…'} />
      </EuiFormRow>
      {attachmentNotice && <><EuiCallOut title="Attachment placeholder" color="warning">{attachmentNotice}</EuiCallOut><EuiSpacer size="s" /></>}
      <EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setAttachmentNotice('evidence-placeholder.txt registered in UI only. No bytes were uploaded and no attachment is available.')}>Add attachment placeholder</EuiButtonEmpty></EuiFlexItem><EuiFlexItem /><EuiFlexItem grow={false}><EuiButton fill onClick={openPreview} isDisabled={!body.trim()}>Preview before send</EuiButton></EuiFlexItem></EuiFlexGroup>
      {mutation.state.stage !== 'idle' && <><EuiSpacer /><EuiCallOut title={mutation.state.preview ? mutation.state.preview.summary : mutation.state.stage === 'complete' ? 'Refresh cycle completed' : 'Governed write in progress'} color={mutation.state.error ? 'danger' : 'warning'}>{mutation.state.error?.message ?? (mutation.state.receipt ? `${mutation.state.receipt.receiptId} · ${mutation.state.receipt.state}; not completed.` : 'Previewing permissions, validation and affected resources.')}</EuiCallOut><EuiSpacer size="s" /><EuiFlexGroup justifyContent="flexEnd" gutterSize="s"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={mutation.reset}>Reset</EuiButtonEmpty></EuiFlexItem>{mutation.state.stage === 'preview' && <EuiFlexItem grow={false}><EuiButton fill onClick={() => void mutation.confirm()}>Confirm queued send</EuiButton></EuiFlexItem>}</EuiFlexGroup></>}
    </EuiPanel>
  </div>;
}

function TicketDataTab({ bundle, tab }: { bundle: TicketBundle; tab: string }) {
  if (tab === 'Relations') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Relations</h2></EuiTitle><table><thead><tr><th>Relation</th><th>Target</th><th>Type</th></tr></thead><tbody>{bundle.relations.map((item) => <tr key={item.id}><td>{item.relationType}</td><td><Link to={`/itsm/tickets/${item.target.id}`}>{item.target.title}</Link></td><td>{item.target.kind}</td></tr>)}</tbody></table></EuiPanel>;
  if (tab === 'Approvals') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Approvals</h2></EuiTitle>{bundle.approvals.length === 0 ? <EuiCallOut title="No approval stages">This ticket type or lifecycle stage has no approval record.</EuiCallOut> : <table><thead><tr><th>Stage</th><th>Approver</th><th>Decision</th><th>Due</th></tr></thead><tbody>{bundle.approvals.map((item) => <tr key={item.id}><td>{item.stage}</td><td>{item.approverId}</td><td><EuiBadge color={item.decision === 'approved' ? 'success' : item.decision === 'rejected' ? 'danger' : 'warning'}>{item.decision}</EuiBadge></td><td>{item.dueAt ?? item.decidedAt ?? '—'}</td></tr>)}</tbody></table>}</EuiPanel>;
  if (tab === 'SLA') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>SLA clocks</h2></EuiTitle>{bundle.slaClocks.map((clock) => <div className="itsmClockRow" key={clock.id}><div><strong>{clock.policyId}</strong><span>{clock.state} · authoritative {clock.authoritativeAt}</span></div><EuiBadge color={clock.state === 'breached' ? 'danger' : clock.state === 'running' ? 'warning' : 'success'}>{clock.remainingSeconds === undefined ? clock.state : `${Math.ceil(clock.remainingSeconds / 60)}m remaining`}</EuiBadge></div>)}<EuiSpacer /><EuiButtonEmpty href="/itsm/sla">Open SLA administration</EuiButtonEmpty></EuiPanel>;
  if (tab === 'Automation') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Automation context</h2></EuiTitle><EuiCallOut title="Execution boundary">Rules may propose or queue actions. The ticket is not changed until each adapter receipt is rehydrated and audited.</EuiCallOut><EuiSpacer /><EuiButtonEmpty href="/itsm/automation">Open automation administration</EuiButtonEmpty></EuiPanel>;
  if (tab === 'Activity' || tab === 'Audit') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{tab}</h2></EuiTitle><div className="itsmAuditList">{bundle.auditEvents.map((event) => <article key={event.id}><b>{event.eventType}</b><span>{event.summary}</span><small>{event.createdAt} · {event.actorType}:{event.actorId} · {event.correlationId}</small></article>)}</div></EuiPanel>;
  if (tab === 'RCA' && bundle.ticket.kind === 'problem') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Root cause analysis</h2></EuiTitle><EuiFormRow label="Root cause"><EuiTextArea value={bundle.ticket.rootCause ?? ''} readOnly rows={5} /></EuiFormRow><EuiFormRow label="Workaround"><EuiTextArea value={bundle.ticket.workaround ?? ''} readOnly rows={5} /></EuiFormRow><EuiCallOut title="Permanent fix linkage">{bundle.ticket.permanentFixChangeId ?? 'No change linked'}</EuiCallOut></EuiPanel>;
  if (['Change plan','Implementation','Rollback'].includes(tab) && bundle.ticket.kind === 'change') {
    const value = tab === 'Change plan' ? bundle.ticket.validationPlan : tab === 'Implementation' ? bundle.ticket.implementationPlan : bundle.ticket.rollbackPlan;
    return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{tab}</h2></EuiTitle><EuiTextArea value={value} readOnly rows={8} /><EuiSpacer /><EuiCallOut title="Governed plan">Edits require impact preview, approval/CAB policy evaluation, queued receipt and authoritative refresh.</EuiCallOut></EuiPanel>;
  }
  if (tab === 'Request form' && bundle.ticket.kind === 'request') return <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Schema-driven request form</h2></EuiTitle>{Object.entries(bundle.ticket.dynamicFields).map(([key,value]) => <EuiFormRow key={key} label={key}><EuiFieldText value={String(value)} readOnly /></EuiFormRow>)}</EuiPanel>;
  return <EuiCallOut title={`${tab} is available through its contract`}>This frontend skeleton preserves the tab, loading/error states and API boundary until the corresponding backend endpoint is connected.</EuiCallOut>;
}

export function ItsmTicketDetailPage() {
  const { ticketId = 'INC-7001' } = useParams();
  const query = useItsmQuery((signal) => itsmApi.getTicket(ticketId, signal), [ticketId]);
  const [tab, setTab] = useState('Overview');
  const bundle = query.data;
  const tabs = useMemo(() => {
    if (!bundle) return ['Overview','Conversation','Activity','Relations','Approvals','SLA','Automation','Audit'];
    const specific = bundle.ticket.kind === 'request' ? ['Request form'] : bundle.ticket.kind === 'problem' ? ['RCA'] : bundle.ticket.kind === 'change' ? ['Change plan','Implementation','Rollback'] : [];
    return ['Overview','Conversation','Activity','Relations','Approvals','SLA','Automation','Audit',...specific];
  }, [bundle]);
  return <CapabilityShell title={bundle ? `${bundle.ticket.key} · ${bundle.ticket.title}` : 'Ticket detail workspace'} description="Shared Request / Incident / Problem / Change workspace with governed writes and type-specific workflow tabs." queryState={query.state} errorMessage={query.error?.message} rightSideItems={bundle ? [<GovernedAction key="update" label="Preview status update" fill preview={(signal) => itsmApi.previewUpdateTicket(bundle.ticket.id, { status: 'pending' }, signal)} execute={async (signal) => { const result = await itsmApi.updateTicket(bundle.ticket.id, { status: 'pending' }, demoContext(bundle.ticket.etag, bundle.ticket.version), signal); return { receipt: result.receipt }; }} rehydrate={(_receipt, signal) => itsmApi.refreshTicket(bundle.ticket.id, undefined, signal)} />] : undefined}>
    {bundle && <>
      <EuiPanel paddingSize="m" hasBorder className="itsmTicketHeader"><EuiFlexGroup alignItems="center" gutterSize="m" wrap><EuiFlexItem><EuiFlexGroup gutterSize="s" alignItems="center" wrap><EuiFlexItem grow={false}><EuiBadge color="hollow">{ticketKindLabel(bundle.ticket)}</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={bundle.ticket.priority === 'P1' ? 'danger' : bundle.ticket.priority === 'P2' ? 'warning' : 'hollow'}>{bundle.ticket.priority}</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="primary">{bundle.ticket.status}</EuiBadge></EuiFlexItem></EuiFlexGroup><EuiSpacer size="s" /><strong>{bundle.ticket.assigneeId ?? 'Unassigned'} · {bundle.ticket.serviceName}</strong></EuiFlexItem><EuiFlexItem grow={false}><div className="itsmHeaderClock"><span>Resolution clock</span><strong>{bundle.slaClocks.find((clock) => clock.state === 'running')?.remainingSeconds ? `${Math.ceil((bundle.slaClocks.find((clock) => clock.state === 'running')?.remainingSeconds ?? 0) / 60)}m` : 'No active clock'}</strong></div></EuiFlexItem></EuiFlexGroup></EuiPanel>
      <EuiSpacer size="m" /><EuiPanel paddingSize="none" hasBorder><Tabs items={tabs} active={tab} onChange={setTab} /></EuiPanel><EuiSpacer size="m" />
      {tab === 'Overview' ? <TicketOverview bundle={bundle} /> : tab === 'Conversation' ? <TicketConversation bundle={bundle} /> : <TicketDataTab bundle={bundle} tab={tab} />}
    </>}
  </CapabilityShell>;
}

type SlaData = { policies: SlaPolicy[]; calendars: Awaited<ReturnType<typeof itsmApi.listBusinessCalendars>>['items']; escalations: Awaited<ReturnType<typeof itsmApi.listEscalationRules>>['items']; clocks: Awaited<ReturnType<typeof itsmApi.listSlaClocks>>['items'] };

export function ItsmSlaManagementPage() {
  const query = useItsmQuery<SlaData>(async (signal) => {
    const [policies, calendars, escalations, clocks] = await Promise.all([itsmApi.listSlaPolicies({}, signal), itsmApi.listBusinessCalendars({}, signal), itsmApi.listEscalationRules({}, signal), itsmApi.listSlaClocks({}, signal)]);
    return { policies: policies.items, calendars: calendars.items, escalations: escalations.items, clocks: clocks.items };
  }, []);
  const [tab, setTab] = useState('Policies');
  const [selectedId, setSelectedId] = useState('sla-p1-response');
  const data = query.data;
  const selected = data?.policies.find((item) => item.id === selectedId) ?? data?.policies[0];
  return <CapabilityShell title="SLA administration" description="Policies, business calendars, escalation thresholds and authoritative clock monitoring." queryState={query.state} errorMessage={query.error?.message} rightSideItems={[<EuiButtonEmpty key="settings" href="/itsm/settings">Back to ITSM settings</EuiButtonEmpty>]}>
    {data && <><EuiPanel paddingSize="none" hasBorder><Tabs items={['Policies','Calendars','Escalations','Clock monitor']} active={tab} onChange={setTab} /></EuiPanel><EuiSpacer size="m" />
      {tab === 'Policies' && selected && <div className="itsmAdminGrid"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>SLA policies</h2></EuiTitle><EuiSpacer size="s" />{data.policies.map((policy) => <button type="button" className={`itsmResourceButton ${policy.id === selected.id ? 'selected' : ''}`} key={policy.id} onClick={() => setSelectedId(policy.id)}><span><strong>{policy.name}</strong><small>{policy.appliesTo.join(', ')} · {policy.priority.join(', ')}</small></span><EuiBadge color={policy.status === 'published' ? 'success' : 'warning'}>{policy.status}</EuiBadge></button>)}</EuiPanel>
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><EuiSpacer size="s" /><div className="itsmFormGrid"><EuiFormRow label="Target minutes"><EuiFieldNumber value={selected.targetMinutes} readOnly /></EuiFormRow><EuiFormRow label="Calendar"><EuiSelect value={selected.calendarId} onChange={() => undefined} options={data.calendars.map((calendar) => ({ value: calendar.id, text: `${calendar.name} · ${calendar.timezone}` }))} /></EuiFormRow><EuiFormRow label="Applies to"><EuiComboBox selectedOptions={selected.appliesTo.map((value) => ({ label: value }))} options={['request','incident','problem','change'].map((label) => ({ label }))} isClearable={false} /></EuiFormRow><EuiFormRow label="Priority"><EuiComboBox selectedOptions={selected.priority.map((value) => ({ label: value }))} options={['P1','P2','P3','P4'].map((label) => ({ label }))} isClearable={false} /></EuiFormRow></div><EuiFormRow label="Start / pause / resume / stop conditions"><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ start: selected.start, pause: selected.pause, resume: selected.resume, stop: selected.stop }, null, 2)}</EuiCodeBlock></EuiFormRow><GovernedAction label="Review and queue policy draft" fill preview={(signal) => itsmApi.previewSlaPolicy(selected, signal)} execute={async (signal) => { const result = await itsmApi.saveSlaPolicy(selected, demoContext(selected.etag, selected.version), signal); return { receipt: result.receipt }; }} rehydrate={async (_receipt, signal) => (await itsmApi.listSlaPolicies({}, signal)).items} /></EuiPanel></div>}
      {tab === 'Calendars' && <div className="itsmCardGrid">{data.calendars.map((calendar) => <EuiPanel paddingSize="m" hasBorder key={calendar.id}><EuiTitle size="xs"><h2>{calendar.name}</h2></EuiTitle><p>{calendar.timezone} · {calendar.status}</p><p>{calendar.businessHours.length} weekly windows · {calendar.holidays.length} holidays</p><EuiBadge color="hollow">{calendar.version}</EuiBadge></EuiPanel>)}</div>}
      {tab === 'Escalations' && <EuiPanel paddingSize="m" hasBorder><table><thead><tr><th>Rule</th><th>Policy</th><th>Threshold</th><th>Actions</th><th>Status</th></tr></thead><tbody>{data.escalations.map((rule) => <tr key={rule.id}><td>{rule.name}</td><td>{rule.policyId}</td><td>{rule.thresholdPercent}%</td><td>{rule.actions.map((action) => `${action.type}:${action.target}`).join(', ')}</td><td><EuiBadge>{rule.status}</EuiBadge></td></tr>)}</tbody></table></EuiPanel>}
      {tab === 'Clock monitor' && <EuiPanel paddingSize="m" hasBorder><table><thead><tr><th>Ticket</th><th>Policy</th><th>State</th><th>Due / breach</th><th>Authoritative at</th></tr></thead><tbody>{data.clocks.map((clock) => <tr key={clock.id}><td><Link to={`/itsm/tickets/${clock.ticketId}`}>{clock.ticketId}</Link></td><td>{clock.policyId}</td><td><EuiBadge color={clock.state === 'breached' ? 'danger' : 'warning'}>{clock.state}</EuiBadge></td><td>{clock.breachAt ?? clock.dueAt ?? '—'}</td><td>{clock.authoritativeAt}</td></tr>)}</tbody></table></EuiPanel>}
    </>}
  </CapabilityShell>;
}

type AutomationData = { templates: Awaited<ReturnType<typeof itsmApi.listAutomationTemplates>>['items']; rules: AutomationRule[]; runs: Awaited<ReturnType<typeof itsmApi.listAutomationRuns>>['items'] };

export function ItsmAutomationManagementPage() {
  const query = useItsmQuery<AutomationData>(async (signal) => {
    const [templates, rules, runs] = await Promise.all([itsmApi.listAutomationTemplates({}, signal), itsmApi.listAutomationRules({}, signal), itsmApi.listAutomationRuns({}, signal)]);
    return { templates: templates.items, rules: rules.items, runs: runs.items };
  }, []);
  const [tab, setTab] = useState('Rule editor');
  const [selectedId, setSelectedId] = useState('rule-major-incident');
  const data = query.data;
  const rule = data?.rules.find((item) => item.id === selectedId) ?? data?.rules[0];
  return <CapabilityShell title="Automation administration" description="Template library, versioned rule editor, dry-run trace, execution history, retry and cancel governance." queryState={query.state} errorMessage={query.error?.message} rightSideItems={[<EuiButtonEmpty key="p34" href="/knowledge/playbooks">Open P34 playbooks</EuiButtonEmpty>]}>
    {data && <><EuiPanel paddingSize="none" hasBorder><Tabs items={['Templates','Rule editor','Execution runs']} active={tab} onChange={setTab} /></EuiPanel><EuiSpacer size="m" />
      {tab === 'Templates' && <div className="itsmCardGrid">{data.templates.map((template) => <EuiPanel paddingSize="m" hasBorder key={template.id}><EuiBadge color={template.status === 'published' ? 'success' : 'warning'}>{template.status}</EuiBadge><EuiTitle size="xs"><h2>{template.name}</h2></EuiTitle><p>{template.description}</p><small>{template.category} · latest {template.latestVersionId}</small></EuiPanel>)}</div>}
      {tab === 'Rule editor' && rule && <div className="itsmAutomationGrid"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Rules</h2></EuiTitle>{data.rules.map((item) => <button type="button" className={`itsmResourceButton ${item.id === rule.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedId(item.id)}><span><strong>{item.name}</strong><small>{item.status} · {item.version}</small></span><EuiBadge color={item.status === 'published' ? 'success' : 'warning'}>{item.status}</EuiBadge></button>)}</EuiPanel><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{rule.name}</h2></EuiTitle><div className="itsmRuleCanvas"><article><b>Trigger</b><span>{rule.trigger.name}</span></article>{rule.nodes.map((node) => <article key={node.id}><b>{node.type}</b><span>{node.name}</span><small>{JSON.stringify(node.config)}</small></article>)}</div><EuiSpacer /><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><GovernedAction label="Dry-run" preview={async () => ({ operation: 'automation.rule.dry-run', summary: `Simulate ${rule.name}`, affectedResources: [{ type: 'automation-run', id: 'new', effect: 'dry-run only' }], permissions: rule.status === 'published' ? [{ capability: 'automation.run.dry', decision: 'allow' }] : [{ capability: 'automation.run.dry', decision: 'conditional' }], validation: [], warnings: ['No connector action or ticket write will execute.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })} execute={async (signal) => { const run = await itsmApi.dryRunAutomationRule(rule.id, { ticketId: 'inc-7001' }, demoContext(rule.etag, rule.version), signal); return { receipt: { receiptId: run.id, operation: 'automation.rule.dry-run', state: 'accepted', submittedAt: run.createdAt, authoritative: false } }; }} rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRuns({}, signal)).items} /></EuiFlexItem><EuiFlexItem grow={false}><GovernedAction label="Publish version" fill preview={(signal) => itsmApi.previewAutomationRule(rule, signal)} execute={async (signal) => ({ receipt: await itsmApi.publishAutomationRule(rule.id, rule.publishedVersionId ?? rule.version, demoContext(rule.etag, rule.version), signal) })} rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRules({}, signal)).items} /></EuiFlexItem></EuiFlexGroup></EuiPanel></div>}
      {tab === 'Execution runs' && <EuiPanel paddingSize="m" hasBorder><table><thead><tr><th>Run</th><th>Rule</th><th>Ticket</th><th>Mode</th><th>State</th><th>Attempts</th><th>Failure / actions</th></tr></thead><tbody>{data.runs.map((run) => <tr key={run.id}><td>{run.id}</td><td>{run.ruleId}</td><td>{run.ticketId ?? '—'}</td><td>{run.dryRun ? 'dry-run' : 'live contract'}</td><td><EuiBadge color={run.state === 'failed' || run.state === 'partial' ? 'danger' : run.state === 'succeeded' ? 'success' : 'warning'}>{run.state}</EuiBadge></td><td>{run.attempts}</td><td>{run.failure?.message ?? '—'} {run.failure?.retryable && <GovernedAction label="Retry" preview={async () => ({ operation: 'automation.run.retry', summary: `Retry ${run.id}`, affectedResources: [{ type: 'automation-run', id: run.id, effect: 'new attempt' }], permissions: [{ capability: 'automation.run.retry', decision: 'conditional' }], validation: [], warnings: ['A retry may repeat external side effects; idempotency ownership remains with the backend executor.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })} execute={async (signal) => ({ receipt: await itsmApi.retryAutomationRun(run.id, demoContext(run.etag, run.version), signal) })} rehydrate={async (_receipt, signal) => (await itsmApi.listAutomationRuns({}, signal)).items} />}</td></tr>)}</tbody></table></EuiPanel>}
    </>}
  </CapabilityShell>;
}

type MessagingData = { providers: NotificationProvider[]; templates: Awaited<ReturnType<typeof itsmApi.listNotificationTemplates>>['items']; policies: Awaited<ReturnType<typeof itsmApi.listNotificationPolicies>>['items']; deliveries: Awaited<ReturnType<typeof itsmApi.listNotificationDeliveries>>['items']; mailboxes: InboundMailbox[]; routes: Awaited<ReturnType<typeof itsmApi.listInboundRoutingRules>>['items']; events: Awaited<ReturnType<typeof itsmApi.listIngestionEvents>>['items'] };

export function ItsmMessagingManagementPage() {
  const query = useItsmQuery<MessagingData>(async (signal) => {
    const [providers, templates, policies, deliveries, mailboxes, routes, events] = await Promise.all([itsmApi.listNotificationProviders({}, signal), itsmApi.listNotificationTemplates({}, signal), itsmApi.listNotificationPolicies({}, signal), itsmApi.listNotificationDeliveries({}, signal), itsmApi.listInboundMailboxes({}, signal), itsmApi.listInboundRoutingRules({}, signal), itsmApi.listIngestionEvents({}, signal)]);
    return { providers: providers.items, templates: templates.items, policies: policies.items, deliveries: deliveries.items, mailboxes: mailboxes.items, routes: routes.items, events: events.items };
  }, []);
  const [tab, setTab] = useState('Providers');
  const [selectedProviderId, setSelectedProviderId] = useState('provider-smtp-primary');
  const [selectedMailboxId, setSelectedMailboxId] = useState('mailbox-service-desk');
  const data = query.data;
  const provider = data?.providers.find((item) => item.id === selectedProviderId) ?? data?.providers[0];
  const mailbox = data?.mailboxes.find((item) => item.id === selectedMailboxId) ?? data?.mailboxes[0];
  return <CapabilityShell title="Notifications & inbound mail" description="SMTP / Graph providers, templates, recipient policies, delivery history, IMAP / Graph mailboxes and ingestion routing." queryState={query.state} errorMessage={query.error?.message} rightSideItems={[<EuiButtonEmpty key="settings" href="/itsm/settings">Back to ITSM settings</EuiButtonEmpty>]}>
    {data && <><EuiPanel paddingSize="none" hasBorder><Tabs items={['Providers','Templates & policies','Inbound mailboxes','Delivery & ingestion']} active={tab} onChange={setTab} /></EuiPanel><EuiSpacer size="m" />
      {tab === 'Providers' && provider && <div className="itsmAdminGrid"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Notification providers</h2></EuiTitle>{data.providers.map((item) => <button type="button" className={`itsmResourceButton ${item.id === provider.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedProviderId(item.id)}><span><strong>{item.name}</strong><small>{item.kind} · secret {item.secretConfigured ? 'configured' : 'missing'}</small></span><EuiBadge color={item.status === 'enabled' ? 'success' : item.status === 'error' ? 'danger' : 'warning'}>{item.status}</EuiBadge></button>)}</EuiPanel><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{provider.name}</h2></EuiTitle><EuiFormRow label="Provider type"><EuiFieldText value={provider.kind} readOnly /></EuiFormRow><EuiFormRow label="Host / sender"><EuiFieldText value={String(provider.config.host ?? provider.config.sender ?? '')} readOnly /></EuiFormRow><EuiFormRow label="Port / tenant"><EuiFieldText value={String(provider.config.port ?? provider.config.tenantId ?? '')} readOnly /></EuiFormRow><EuiSwitch checked={provider.secretConfigured} onChange={() => undefined} label="Secret configured in backend secret store" /><EuiSpacer /><EuiCallOut title="Frontend-only boundary" color="warning">This UI never stores or tests SMTP/Graph credentials. The adapter endpoint is TBD and currently unavailable outside development fixtures.</EuiCallOut><EuiSpacer /><GovernedAction label="Test provider connection" fill preview={async () => ({ operation: 'notification.provider.test', summary: `Test ${provider.name}`, affectedResources: [{ type: 'notification-provider', id: provider.id, effect: 'connection test only' }], permissions: [{ capability: 'notification.provider.test', decision: 'conditional' }], validation: provider.secretConfigured ? [] : [{ field: 'secret', code: 'SECRET_MISSING', message: 'Backend secret is not configured.', severity: 'warning' }], warnings: ['A queued test receipt is not a successful SMTP or Graph delivery.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })} execute={async (signal) => ({ receipt: await itsmApi.testNotificationProvider(provider.id, demoContext(provider.etag, provider.version), signal) })} rehydrate={async (_receipt, signal) => (await itsmApi.listNotificationProviders({}, signal)).items} /></EuiPanel></div>}
      {tab === 'Templates & policies' && <div className="itsmTwoColumn"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Templates</h2></EuiTitle>{data.templates.map((template) => <article className="itsmResourceCard" key={template.id}><EuiBadge>{template.status}</EuiBadge><strong>{template.name}</strong><span>{template.subject}</span><small>Variables: {template.variables.join(', ')}</small></article>)}</EuiPanel><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Routing policies</h2></EuiTitle>{data.policies.map((policy) => <article className="itsmResourceCard" key={policy.id}><EuiBadge>{policy.status}</EuiBadge><strong>{policy.name}</strong><span>{policy.event}</span><small>{policy.providerId} · {policy.templateId} · recipients {policy.recipientIds.join(', ')}</small></article>)}</EuiPanel></div>}
      {tab === 'Inbound mailboxes' && mailbox && <div className="itsmAdminGrid"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Mailboxes</h2></EuiTitle>{data.mailboxes.map((item) => <button type="button" className={`itsmResourceButton ${item.id === mailbox.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedMailboxId(item.id)}><span><strong>{item.name}</strong><small>{item.address} · {item.kind}</small></span><EuiBadge color={item.status === 'enabled' ? 'success' : 'warning'}>{item.status}</EuiBadge></button>)}</EuiPanel><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>{mailbox.name}</h2></EuiTitle><div className="itsmFormGrid"><EuiFormRow label="Protocol"><EuiFieldText value={mailbox.kind} readOnly /></EuiFormRow><EuiFormRow label="Address"><EuiFieldText value={mailbox.address} readOnly /></EuiFormRow><EuiFormRow label="Folder"><EuiFieldText value={mailbox.folder ?? 'Inbox'} readOnly /></EuiFormRow><EuiFormRow label="Ingestion mode"><EuiFieldText value={mailbox.pollingMode} readOnly /></EuiFormRow></div><EuiSwitch checked={mailbox.secretConfigured} onChange={() => undefined} label="Credential / consent configured in backend" /><EuiSpacer /><EuiTitle size="xs"><h3>Routing rules</h3></EuiTitle>{data.routes.filter((route) => route.mailboxId === mailbox.id).map((route) => <article className="itsmResourceCard" key={route.id}><strong>{route.order}. {route.name}</strong><span>{route.conditions.join(' AND ')}</span><small>{route.action}{route.ticketKind ? ` → ${route.ticketKind}` : ''} · {route.status}</small></article>)}<EuiSpacer /><GovernedAction label="Test inbound connection" fill preview={async () => ({ operation: 'inbound.mailbox.test', summary: `Test ${mailbox.name}`, affectedResources: [{ type: 'inbound-mailbox', id: mailbox.id, effect: 'connectivity and permission test only' }], permissions: [{ capability: 'inbound.mailbox.test', decision: 'conditional' }], validation: mailbox.secretConfigured ? [] : [{ field: 'credential', code: 'CREDENTIAL_MISSING', message: 'Backend credential or Graph consent is not configured.', severity: 'warning' }], warnings: ['No message will be ingested and no ticket will be created by this UI test.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })} execute={async (signal) => ({ receipt: await itsmApi.testInboundMailbox(mailbox.id, demoContext(mailbox.etag, mailbox.version), signal) })} rehydrate={async (_receipt, signal) => (await itsmApi.listInboundMailboxes({}, signal)).items} /></EuiPanel></div>}
      {tab === 'Delivery & ingestion' && <div className="itsmTwoColumn"><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Delivery history</h2></EuiTitle><table><thead><tr><th>Delivery</th><th>Recipient</th><th>State</th><th>Attempts</th></tr></thead><tbody>{data.deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.id}<small>{delivery.ticketId ?? '—'}</small></td><td>{delivery.recipient}</td><td><EuiBadge color={delivery.state === 'failed' ? 'danger' : delivery.state === 'delivered' ? 'success' : 'warning'}>{delivery.state}</EuiBadge></td><td>{delivery.attempts}<small>{delivery.lastError?.message}</small></td></tr>)}</tbody></table></EuiPanel><EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Ingestion history</h2></EuiTitle><table><thead><tr><th>Message</th><th>Sender / subject</th><th>State</th><th>Ticket</th></tr></thead><tbody>{data.events.map((event) => <tr key={event.id}><td>{event.messageId}</td><td>{event.sender}<small>{event.subject}</small></td><td><EuiBadge color={event.state === 'failed' || event.state === 'quarantined' ? 'danger' : 'success'}>{event.state}</EuiBadge></td><td>{event.ticketId ? <Link to={`/itsm/tickets/${event.ticketId}`}>{event.ticketId}</Link> : '—'}<small>{event.failure?.message}</small></td></tr>)}</tbody></table></EuiPanel></div>}
    </>}
  </CapabilityShell>;
}
