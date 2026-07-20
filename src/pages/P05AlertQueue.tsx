import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHealth,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
  type EuiBasicTableColumn,
} from '@elastic/eui';
import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { createIdempotencyKey, type Receipt } from '../foundation/actions';
import { FixtureCursorAdapter } from '../foundation/cursor';
import { addCondition, emptyFilters, type FilterCondition, type FilterGroup } from '../foundation/filters';
import { PrototypePermissionService } from '../foundation/permissions';
import { createEnvelope, parseQuery, validateQuery, type FieldDefinition } from '../foundation/query';
import { InMemorySavedViewRepository } from '../foundation/savedViews';
import type { PrototypeRow, PrototypeValue } from '../types/prototype';

const spec = pageSpecById.P05;
const permissionService = new PrototypePermissionService();
const savedViewRepository = new InMemorySavedViewRepository();

const fieldCatalog: FieldDefinition[] = [
  { name: 'severity', operators: [':', '=', '!='], visible: true, type: 'keyword' },
  { name: 'status', operators: [':', '=', '!='], visible: true, type: 'keyword' },
  { name: 'source', operators: [':', '=', 'PREFIX'], visible: true, type: 'keyword' },
  { name: 'owner', operators: [':', '=', '!='], visible: true, type: 'keyword' },
  { name: 'user.email', operators: [':', '='], visible: false, type: 'string' },
];

const asText = (value: PrototypeValue | undefined) => value === undefined ? 'Unknown' : String(value);
const isHigh = (row: PrototypeRow) => /high|critical/i.test(asText(row.severity));
const isProjectionFailure = (row: PrototypeRow) => /fail|error/i.test(asText(row.projection_state ?? row.status));

function evidenceItems(row: PrototypeRow) {
  return [
    { label: 'Rule / revision', value: asText(row.rule_ref ?? row.rule ?? 'network-anomaly@r12'), state: 'Matched' },
    { label: 'Network / entity context', value: asText(row.network_tuple ?? row.primary_entity ?? row.source), state: 'Correlated' },
    { label: 'Grouped events', value: asText(row.event_count ?? row.count ?? 6), state: 'Deduplicated' },
    { label: 'Projection', value: asText(row.projection_state ?? 'Ready'), state: isProjectionFailure(row) ? 'Review' : 'Ready' },
  ];
}

export default function P05AlertQueue() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  const query = page.params.get('q') ?? '';
  const cursor = page.params.get('cursor') ?? undefined;
  const [draft, setDraft] = useState(query);
  const [filters, setFilters] = useState<FilterGroup>(emptyFilters());
  const [rows, setRows] = useState<PrototypeRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string>();
  const [previousCursor, setPreviousCursor] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<PrototypeRow>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('Assign owner');
  const [classification, setClassification] = useState('Needs investigation');
  const [assignment, setAssignment] = useState('SOC Tier 1');
  const [confirmed, setConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<Receipt>();
  const [savedMessage, setSavedMessage] = useState<string>();
  const [queryErrors, setQueryErrors] = useState<ReturnType<typeof validateQuery>>([]);
  const filterOpener = useRef<HTMLButtonElement | null>(null);
  const adapter = useMemo(() => fixture ? new FixtureCursorAdapter(fixture.rows) : undefined, [fixture]);
  const envelope = useMemo(() => createEnvelope(query, {
    cursor,
    limit: 12,
    projection: ['id', 'severity', 'status', 'owner', 'source', 'event_time_first', 'risk_score', 'projection_state'],
  }), [cursor, query]);

  useEffect(() => {
    if (!adapter || ['loading', 'empty', 'filtered-empty', 'error', 'denied', 'offline'].includes(page.viewState)) return;
    const controller = new AbortController();
    adapter.search({ query: envelope, filters, cursor, limit: 12, sort: envelope.sort, signal: controller.signal }).then(async (response) => {
      if (response.error) {
        page.setViewState(response.error.classification === 'DENIED' ? 'denied' : 'error');
        setRows([]);
        return;
      }
      const visibleRows: PrototypeRow[] = [];
      for (const row of response.items) {
        const decision = await permissionService.decide({
          subject: 'analyst-01', tenant: 'prototype', scope: ['alerts'], kind: 'row', capability: 'alerts.read', objectType: 'alert', objectId: row.id,
        });
        if (decision.allowed) visibleRows.push(row);
      }
      setRows(visibleRows);
      setNextCursor(response.nextCursor);
      setPreviousCursor(response.previousCursor);
      setSelectedIds((current) => new Set([...current].filter((id) => visibleRows.some((row) => row.id === id))));
      setDetail((current) => current && visibleRows.some((row) => row.id === current.id) ? current : visibleRows[0]);
    });
    return () => controller.abort();
  }, [adapter, cursor, envelope, filters, page]);

  const updateParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(page.params);
    Object.entries(changes).forEach(([key, value]) => value === undefined ? next.delete(key) : next.set(key, value));
    page.setParams(next, { replace: false });
  };

  const runQuery = () => {
    const parsed = parseQuery(draft);
    const errors = [...parsed.errors, ...validateQuery(parsed.ast, fieldCatalog, envelope.timeRange)];
    setQueryErrors(errors);
    if (errors.length === 0) updateParams({ q: draft.trim() || undefined, cursor: undefined, state: undefined });
  };

  const addHighSeverity = () => setFilters((current) => addCondition(current, {
    id: crypto.randomUUID(), kind: 'condition', field: 'severity', operator: ':', value: 'High', valueType: 'string', exclude: false, label: 'Severity is high',
  } as FilterCondition));

  const saveView = async () => {
    const created = await savedViewRepository.create({
      name: `Alert Queue · ${query || 'All operational alerts'}`,
      owner: 'analyst-01',
      visibility: 'private',
      schemaVersion: 1,
      pageId: spec.id,
      query: envelope,
      filters,
      timeRange: envelope.timeRange,
      sort: envelope.sort,
      columns: envelope.projection,
      density: 'compact',
      pinnedColumns: ['severity', 'id'],
      pageSize: 12,
      isDefault: false,
      permission: { canEdit: true, canDelete: true, canShare: true },
    }, 'analyst-01');
    setSavedMessage(`Saved View ${created.id} · revision ${created.revision}`);
  };

  const createBulkReceipt = async () => {
    const capability = bulkAction === 'Suppress future matches' ? 'alerts.suppress' : bulkAction === 'Close as expected' ? 'alerts.close' : 'alerts.bulk.assign';
    const decision = await permissionService.decide({
      subject: 'analyst-01', tenant: 'prototype', scope: ['alerts'], kind: 'action', capability, objectType: 'alert-group', preconditionsMet: selectedIds.size > 0,
    });
    if (!decision.allowed) return;
    const now = new Date().toISOString();
    const requestId = `request-${crypto.randomUUID()}`;
    setReceipt({
      receiptId: `receipt-${crypto.randomUUID()}`,
      requestId,
      actionId: capability,
      actor: 'analyst-01',
      target: { type: 'alert-selection', id: [...selectedIds].join(',') },
      submittedAt: now,
      acceptedAt: now,
      queuedAt: now,
      externalReferences: [],
      status: 'queued',
      partialSuccess: selectedIds.size > 2,
      failureItems: selectedIds.size > 2 ? [{ id: [...selectedIds][0], reason: 'Prototype eligibility conflict' }] : [],
      retryable: true,
      rollbackAvailable: false,
      auditLink: `audit/${requestId}`,
      rehydration: 'pending',
      prototypeSimulation: true,
    });
    createIdempotencyKey(capability, [...selectedIds].join(','));
    setBulkOpen(false);
    setConfirmed(false);
  };

  const selectedAll = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const highCount = rows.filter(isHigh).length;
  const failureCount = rows.filter(isProjectionFailure).length;
  const activeDetail = detail ?? rows[0];
  const selectedDetail = activeDetail ? evidenceItems(activeDetail) : [];
  const selectedCount = activeDetail ? Number(activeDetail.event_count ?? activeDetail.count ?? 6) : 0;
  const selectedRisk = activeDetail ? Number(activeDetail.risk_score ?? 72) : 0;

  const columns: EuiBasicTableColumn<PrototypeRow>[] = [
    {
      name: <EuiCheckbox id="p05-select-page" aria-label="Select visible alert page" checked={selectedAll} onChange={(event) => setSelectedIds((current) => {
        const next = new Set(current);
        rows.forEach((row) => event.target.checked ? next.add(row.id) : next.delete(row.id));
        return next;
      })} />,
      width: '44px',
      render: (row: PrototypeRow) => <EuiCheckbox id={`p05-select-${row.id}`} aria-label={`Select ${row.id}`} checked={selectedIds.has(row.id)} onChange={(event) => setSelectedIds((current) => {
        const next = new Set(current);
        if (event.target.checked) next.add(row.id); else next.delete(row.id);
        return next;
      })} />,
    },
    { field: 'id', name: 'Alert group', render: (value: PrototypeValue, row: PrototypeRow) => <EuiButtonEmpty size="xs" onClick={() => setDetail(row)}>{asText(value)}</EuiButtonEmpty> },
    { field: 'severity', name: 'Severity', render: (value: PrototypeValue) => <EuiBadge color={/critical/i.test(asText(value)) ? 'danger' : /high/i.test(asText(value)) ? 'warning' : 'hollow'}>{asText(value)}</EuiBadge> },
    { field: 'risk_score', name: 'Risk' },
    { field: 'source', name: 'Source' },
    { field: 'event_count', name: 'Events', render: (value: PrototypeValue) => asText(value ?? 6) },
    { field: 'status', name: 'Status' },
    { field: 'owner', name: 'Owner' },
  ];

  return <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {fixture && <div className="pageComposition page-p05 differentiatedPage" data-page-specific-composition="P05-alert-group-triage">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="alert-query-and-saved-views">
        <EuiFlexGroup gutterSize="s" alignItems="flexEnd" responsive={false}>
          <EuiFlexItem grow={2}><EuiFieldSearch value={draft} onChange={(event) => setDraft(event.target.value)} onSearch={runQuery} aria-label="Alert query" placeholder="severity:high AND source:edge-firewall" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButton fill onClick={runQuery}>Run triage query</EuiButton></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty onClick={saveView}>Save queue view</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
        {queryErrors.length > 0 && <><EuiSpacer size="s" /><EuiCallOut title="Query validation error" color="danger">{queryErrors.map((error) => <p key={`${error.code}-${error.span.start}`}><strong>{error.token}</strong>: {error.message} {error.recoverHint}</p>)}</EuiCallOut></>}
        {savedMessage && <><EuiSpacer size="s" /><EuiCallOut title="Prototype Saved View repository" color="success">{savedMessage}. URL state remains the temporary override.</EuiCallOut></>}
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
          <EuiFlexItem grow={false}><EuiButtonEmpty buttonRef={filterOpener} onClick={() => setFilterOpen(true)}>Advanced filter builder</EuiButtonEmpty></EuiFlexItem>
          {filters.children.map((filter) => <EuiBadge key={filter.id} color="hollow">{filter.kind === 'condition' ? filter.label : 'Filter group'}</EuiBadge>)}
          <EuiFlexItem />
          <EuiFlexItem grow={false}><EuiButton isDisabled={selectedIds.size === 0} onClick={() => setBulkOpen(true)}>Triage selected ({selectedIds.size})</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="m" />

      <EuiPanel paddingSize="m" hasBorder data-visual-region="alert-pressure-summary">
        <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
          <EuiFlexItem><EuiText size="xs" color="subdued"><p>Visible alert groups</p></EuiText><EuiTitle size="m"><h2>{rows.length}</h2></EuiTitle><small>same normalized scope</small></EuiFlexItem>
          <EuiFlexItem><EuiText size="xs" color="subdued"><p>High / critical</p></EuiText><EuiTitle size="m"><h2>{highCount}</h2></EuiTitle><EuiHealth color={highCount ? 'danger' : 'success'}>{highCount ? 'Triage now' : 'Within queue target'}</EuiHealth></EuiFlexItem>
          <EuiFlexItem><EuiText size="xs" color="subdued"><p>Dedup projection</p></EuiText><EuiTitle size="m"><h2>68%</h2></EuiTitle><small>events collapsed into groups</small></EuiFlexItem>
          <EuiFlexItem><EuiText size="xs" color="subdued"><p>Projection failures</p></EuiText><EuiTitle size="m"><h2>{failureCount}</h2></EuiTitle><EuiHealth color={failureCount ? 'warning' : 'success'}>{failureCount ? 'Inspect source' : 'Projection healthy'}</EuiHealth></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>

      <EuiSpacer size="m" />

      {selectedIds.size > 0 && <><EuiCallOut title={`${selectedIds.size} alert groups selected`} color="primary">Eligibility is evaluated through the shared permission boundary. This Demo never mutates the browser fixture array.</EuiCallOut><EuiSpacer size="m" /></>}

      <EuiFlexGroup gutterSize="m" alignItems="stretch" responsive={false}>
        <EuiFlexItem grow={5}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="alert-group-triage-queue">
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}><EuiFlexItem><EuiTitle size="s"><h2>Alert group triage queue</h2></EuiTitle><EuiText size="xs" color="subdued"><p>Grouped alerts are ranked by risk, projection health and case readiness—not raw event volume.</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">Page selection ≠ all matching</EuiBadge></EuiFlexItem></EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiBasicTable tableCaption="Alert group triage queue" items={rows} itemId="id" columns={columns} noItemsMessage="No alert groups match the normalized query and filters." rowHeader="id" />
            <EuiSpacer size="s" />
            <EuiFlexGroup justifyContent="spaceBetween"><EuiButtonEmpty isDisabled={!previousCursor} onClick={() => updateParams({ cursor: previousCursor })}>Previous</EuiButtonEmpty><EuiText size="xs"><p>Opaque cursor · queue, preview and impact use one envelope</p></EuiText><EuiButtonEmpty isDisabled={!nextCursor} onClick={() => updateParams({ cursor: nextCursor })}>Next</EuiButtonEmpty></EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem grow={4}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="alert-evidence-preview">
            {activeDetail ? <>
              <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart" responsive={false}><EuiFlexItem><EuiBadge color={isHigh(activeDetail) ? 'danger' : 'warning'}>{asText(activeDetail.severity)} · Risk {selectedRisk}</EuiBadge><EuiSpacer size="s" /><EuiTitle size="s"><h2>{asText(activeDetail.title ?? activeDetail.id)}</h2></EuiTitle><EuiText size="xs" color="subdued"><p>{activeDetail.id} · {asText(activeDetail.status)} · {asText(activeDetail.owner)}</p></EuiText></EuiFlexItem><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setDetail(activeDetail)}>Open full detail</EuiButtonEmpty></EuiFlexItem></EuiFlexGroup>
              <EuiSpacer size="m" />
              <EuiCallOut title="Why this rule matched" color="primary">{asText(activeDetail.rule_explanation ?? 'A high-risk network action matched the active rule revision and was grouped with related events from the same entity context.')}</EuiCallOut>
              <EuiSpacer size="m" />
              {selectedDetail.map((item) => <EuiPanel key={item.label} paddingSize="s" hasBorder style={{ marginBottom: 10 }}><EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}><EuiFlexItem><EuiText size="xs" color="subdued"><p>{item.label}</p></EuiText><strong>{item.value}</strong></EuiFlexItem><EuiFlexItem grow={false}><EuiHealth color={item.state === 'Review' ? 'warning' : 'success'}>{item.state}</EuiHealth></EuiFlexItem></EuiFlexGroup></EuiPanel>)}
              <EuiSpacer size="m" />
              <EuiTitle size="xs"><h3>Group compression and outcome</h3></EuiTitle><EuiSpacer size="s" /><EuiProgress value={Math.min(selectedCount, 20)} max={20} size="m" color="primary" /><EuiText size="xs" color="subdued"><p>{selectedCount} exact events are represented by this group. Closing or suppressing requires impact preview because future matching may change detection coverage.</p></EuiText>
            </> : <EuiCallOut title="Select an alert group">Choose a row to inspect grouped evidence and rule outcome.</EuiCallOut>}
          </EuiPanel>
        </EuiFlexItem>

        <EuiFlexItem grow={3}>
          <EuiPanel paddingSize="m" hasBorder data-visual-region="alert-triage-decision">
            <EuiTitle size="s"><h2>Triage decision</h2></EuiTitle><EuiSpacer size="s" />
            <label><EuiText size="xs" color="subdued"><p>Classification</p></EuiText><EuiSelect compressed aria-label="Alert classification" value={classification} onChange={(event) => setClassification(event.target.value)} options={['Needs investigation', 'Expected behavior', 'Benign true positive', 'Confirmed malicious'].map((value) => ({ value, text: value }))} /></label>
            <EuiSpacer size="m" />
            <label><EuiText size="xs" color="subdued"><p>Assignment</p></EuiText><EuiSelect compressed aria-label="Alert assignment" value={assignment} onChange={(event) => setAssignment(event.target.value)} options={['SOC Tier 1', 'SOC Tier 2', 'Threat hunt', 'Identity response', 'Network response'].map((value) => ({ value, text: value }))} /></label>
            <EuiSpacer size="m" />
            <EuiPanel paddingSize="s" hasBorder><EuiText size="xs" color="subdued"><p>Case linkage</p></EuiText><strong>{asText(activeDetail?.case_links ?? 'No active case')}</strong><EuiSpacer size="s" /><EuiButtonEmpty size="xs">Prepare case context</EuiButtonEmpty></EuiPanel>
            <EuiSpacer size="m" />
            <EuiPanel paddingSize="s" hasBorder><EuiText size="xs" color="subdued"><p>Suppression impact</p></EuiText><strong>{activeDetail ? '3 related rules · 2 data sources' : 'Select a group'}</strong><EuiSpacer size="s" /><EuiButtonEmpty size="xs" isDisabled={!activeDetail} onClick={() => { if (activeDetail && selectedIds.size === 0) setSelectedIds(new Set([activeDetail.id])); setBulkAction('Suppress future matches'); setBulkOpen(true); }}>Preview future coverage</EuiButtonEmpty></EuiPanel>
            <EuiSpacer size="m" />
            <EuiCallOut title="Action semantics" color="warning">Assignment, close, suppression and case creation are prototype submissions. Queued or accepted is never displayed as completed.</EuiCallOut>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      {filterOpen && <EuiFlyout ownFocus size="s" onClose={() => { setFilterOpen(false); filterOpener.current?.focus(); }} aria-labelledby="p05-filter-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p05-filter-title">Alert Filter Builder</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiText><p>Event time, dataset/source, severity, alert state, rule revision, entity/network context and projection state use the shared nested FilterGroup model.</p></EuiText><EuiButton onClick={addHighSeverity}>Add severity:high</EuiButton></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={() => { setFilterOpen(false); filterOpener.current?.focus(); }}>Close filters</EuiButtonEmpty></EuiFlyoutFooter></EuiFlyout>}

      {detail && <EuiFlyout ownFocus size="m" onClose={() => setDetail(undefined)} aria-labelledby="p05-detail-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p05-detail-title">Alert group evidence and rule outcome</h2></EuiTitle><EuiText size="s"><p>{detail.id} · selected queue and normalized scope preserved</p></EuiText></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Unified permission decision">Route, row, field and action decisions use the same permission service boundary.</EuiCallOut><EuiSpacer /><EuiTitle size="xs"><h3>Grouped evidence</h3></EuiTitle><dl className="detailGrid">{spec.fields.slice(0, 12).map((field) => <div key={field}><dt>{field}</dt><dd>{/user/i.test(field) && detail.id.endsWith('0003') ? '••••••' : asText(detail[field])}</dd></div>)}</dl><EuiSpacer /><EuiCallOut title="Rule outcome" color={isProjectionFailure(detail) ? 'warning' : 'success'}>{isProjectionFailure(detail) ? 'Projection requires review before classification or suppression.' : 'Rule projection is available. The analyst still must validate raw evidence and future coverage impact.'}</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={() => setDetail(undefined)}>Close detail</EuiButtonEmpty><EuiButton fill onClick={() => { setSelectedIds(new Set([detail.id])); setBulkAction('Assign owner'); setBulkOpen(true); }}>Triage this group</EuiButton></EuiFlyoutFooter></EuiFlyout>}

      {bulkOpen && <EuiModal onClose={() => setBulkOpen(false)} aria-labelledby="p05-bulk-title"><EuiModalHeader><EuiModalHeaderTitle id="p05-bulk-title">Alert triage impact preview</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiSelect aria-label="Bulk alert action" value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} options={['Assign owner', 'Close as expected', 'Suppress future matches'].map((value) => ({ value, text: value }))} /><EuiSpacer /><EuiCallOut title="Prototype simulation · no production mutation" color="warning">Selected groups: {selectedIds.size}. Action: {bulkAction}. Preconditions, expected revisions, approval and idempotency are modeled; queued is not completed.</EuiCallOut><EuiSpacer />{bulkAction === 'Suppress future matches' && <><EuiTitle size="xs"><h3>Future coverage impact</h3></EuiTitle><ul><li>3 related rule revisions are affected</li><li>2 data sources contribute matching events</li><li>Estimated 14 future groups per day may be hidden</li><li>Critical-severity suppression requires approval</li></ul><EuiCallOut title="Coverage decision required" color="danger">Suppression is not equivalent to closing the selected groups. It changes future detection behavior.</EuiCallOut><EuiSpacer /></>}<EuiCheckbox id="p05-bulk-confirm" label="Confirm prototype queue submission" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setBulkOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill isDisabled={!confirmed || selectedIds.size === 0} onClick={createBulkReceipt}>Queue prototype action</EuiButton></EuiModalFooter></EuiModal>}

      {receipt && <div className="inlineReceipt" role="status"><strong>Prototype receipt · {receipt.status}</strong><span>{receipt.receiptId}</span><span>{receipt.partialSuccess ? 'Partial success: retry failed only' : `${bulkAction} queued for execution`}</span><span>Authoritative rehydration: {receipt.rehydration}</span><button type="button" onClick={() => setReceipt(undefined)}>Dismiss</button></div>}
    </div>}
  </PageFrame>;
}
