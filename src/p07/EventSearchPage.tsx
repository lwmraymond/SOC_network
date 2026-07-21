import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  EuiAccordion,
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHealth,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPageTemplate,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { createEnvelope, parseQuery, validateQuery, type FieldDefinition } from '../foundation/query';
import { emptyFilters, type FilterCondition, addCondition } from '../foundation/filters';
import { FixtureCursorAdapter } from '../foundation/cursor';
import { PrototypePermissionService, safeCount } from '../foundation/permissions';
import { PrototypeExportJobService, type ExportJob } from '../foundation/actions';
import { InMemorySavedViewRepository } from '../foundation/savedViews';
import { prototypeEvents, type EventRecord, isPrototypeMode } from '../prototype/events';
import { initialP07State, p07Reducer, type P07State } from './store';

const adapter = new FixtureCursorAdapter(prototypeEvents);
const policy = new PrototypePermissionService();
const exportsService = new PrototypeExportJobService();
const savedViews = new InMemorySavedViewRepository();
void savedViews;

const catalog: FieldDefinition[] = [
  { name: 'severity', operators: [':', '=', '!='], visible: true, type: 'keyword' },
  { name: 'source', operators: [':', '=', 'PREFIX'], visible: true, type: 'keyword' },
  { name: 'event_time', operators: ['>', '>=', '<', '<='], visible: true, type: 'date' },
  { name: 'user.email', operators: [':', '='], visible: false, type: 'string' },
];

const forcedStates: P07State['status'][] = ['empty', 'filtered-empty', 'error', 'denied', 'offline', 'stale', 'degraded', 'partial'];
const stateCopy: Record<Exclude<P07State['status'], 'ready' | 'loading'>, { title: string; body: string; color: 'danger' | 'warning' | 'primary' }> = {
  empty: { title: 'No records are available', body: 'This is a valid empty state, not a zero-filled result set.', color: 'primary' },
  'filtered-empty': { title: 'No results match the current conditions', body: 'Query, filters and time range remain intact so one condition can be widened safely.', color: 'primary' },
  error: { title: 'Unable to load this work surface', body: 'The adapter returned a classified error. Query, filters and navigation context are preserved.', color: 'danger' },
  denied: { title: 'Access denied', body: 'The policy decision denied this route or scope without exposing hidden result rows or counts.', color: 'danger' },
  offline: { title: 'Offline', body: 'No cached operational records are presented as authoritative data.', color: 'warning' },
  stale: { title: 'Stale authoritative state', body: 'The source watermark is outside the accepted freshness budget. Permitted stale rows remain visible and actions require refresh.', color: 'warning' },
  degraded: { title: 'Degraded coverage', body: 'One or more source regions are unavailable. Available rows remain visible with an explicit coverage warning.', color: 'warning' },
  partial: { title: 'Partial data', body: 'The adapter returned partial coverage. Grid and export retain the same warning.', color: 'warning' },
};

export function EventSearchPage() {
  const [params, setParams] = useSearchParams();
  const forcedStatus = useMemo(() => {
    const candidate = params.get('state') as P07State['status'] | null;
    return candidate && forcedStates.includes(candidate) ? candidate : undefined;
  }, [params]);
  const [state, dispatch] = useReducer(p07Reducer, {
    ...initialP07State,
    query: params.get('q') ?? '',
    status: forcedStatus ?? 'ready',
  });
  const [draft, setDraft] = useState(state.query);
  const [rows, setRows] = useState<EventRecord[]>([]);
  const [next, setNext] = useState<string>();
  const [prev, setPrev] = useState<string>();
  const [filters, setFilters] = useState(emptyFilters());
  const [errors, setErrors] = useState<ReturnType<typeof validateQuery>>([]);
  const [selected, setSelected] = useState<EventRecord>();
  const [job, setJob] = useState<ExportJob>();
  const opener = useRef<HTMLButtonElement | null>(null);
  const inspectorOpener = useRef<HTMLButtonElement | null>(null);
  const envelope = useMemo(() => createEnvelope(state.query, { cursor: state.cursor }), [state.query, state.cursor]);

  useEffect(() => {
    if (!isPrototypeMode) return;
    if (forcedStatus === 'denied' || forcedStatus === 'error' || forcedStatus === 'offline') {
      setRows([]);
      setNext(undefined);
      setPrev(undefined);
      setSelected(undefined);
      dispatch({ type: 'status', value: forcedStatus });
      return;
    }
    if (forcedStatus === 'empty' || forcedStatus === 'filtered-empty') {
      setRows([]);
      setNext(undefined);
      setPrev(undefined);
      setSelected(undefined);
      dispatch({ type: 'status', value: forcedStatus });
      return;
    }
    const controller = new AbortController();
    if (!forcedStatus) dispatch({ type: 'status', value: 'loading' });
    adapter.search({
      query: envelope,
      filters,
      cursor: state.cursor,
      limit: 12,
      sort: envelope.sort,
      signal: controller.signal,
    }).then(async (result) => {
      if (result.error) {
        dispatch({ type: 'status', value: result.error.classification === 'DENIED' ? 'denied' : 'error' });
        setRows([]);
        return;
      }
      const visible: EventRecord[] = [];
      for (const row of result.items) {
        const decision = await policy.decide({
          subject: 'analyst-01', tenant: 'demo', scope: ['security'], kind: 'row',
          capability: 'events.read', objectType: 'event', objectId: row.id,
        });
        if (decision.allowed) visible.push(row);
      }
      setRows(visible);
      setNext(result.nextCursor);
      setPrev(result.previousCursor);
      dispatch({
        type: 'status',
        value: forcedStatus ?? (result.partial ? 'partial' : result.stale ? 'stale' : visible.length ? 'ready' : state.query ? 'filtered-empty' : 'empty'),
      });
    });
    return () => controller.abort();
  }, [envelope, filters, forcedStatus, state.cursor, state.query]);

  const run = () => {
    const parsed = parseQuery(draft);
    const queryErrors = [...parsed.errors, ...validateQuery(parsed.ast, catalog, envelope.timeRange)];
    setErrors(queryErrors);
    if (queryErrors.length) return;
    dispatch({ type: 'query', value: draft });
    const nextParams = new URLSearchParams(params);
    if (draft) nextParams.set('q', draft);
    else nextParams.delete('q');
    setParams(nextParams);
  };

  const addHigh = () => setFilters((current) => addCondition(current, {
    id: crypto.randomUUID(), kind: 'condition', field: 'severity', operator: ':', value: 'high',
    valueType: 'string', exclude: false, label: 'Severity is high',
  } as FilterCondition));

  const exportNow = async () => {
    const decision = await policy.decide({
      subject: 'analyst-01', tenant: 'demo', scope: ['security'], kind: 'export',
      capability: 'events.export', objectType: 'query',
    });
    const exportJob = await exportsService.create({
      classification: 'confidential', fields: envelope.projection, filters, query: envelope,
      timeRange: envelope.timeRange, rowCountEstimate: rows.length, permissionDecision: decision,
      redactions: ['user.email'],
    }, 'analyst-01');
    setJob(exportJob);
    dispatch({ type: 'showReceipt' });
  };

  const closeInspector = () => {
    setSelected(undefined);
    requestAnimationFrame(() => inspectorOpener.current?.focus());
  };
  const statusMessage = state.status !== 'ready' && state.status !== 'loading' ? stateCopy[state.status] : undefined;
  const display = ['empty', 'filtered-empty', 'error', 'denied', 'offline'].includes(state.status) ? [] : rows;
  const selectedDecision = selected?.restricted ? 'masked' : 'visible';
  const visibleCount = safeCount(display.length, {
    decisionId: 'local', allowed: true, visible: true, reasonCode: 'ALLOWED', reason: '',
    policySource: '', freshness: '', audit: { subject: '', capability: '', scope: [] },
  }) ?? '—';

  return (
    <EuiPageTemplate restrictWidth={1800}>
      <EuiPageTemplate.Header
        iconType="search"
        pageTitle="Event Search & Hunt"
        description="Query Workbench + Event Grid"
        paddingSize="m"
        bottomBorder="extended"
        rightSideItems={[<EuiButton key="save" fill onClick={() => void 0}>Save view</EuiButton>]}
      />
      <EuiPageTemplate.Section paddingSize="m">
        <EuiPanel className="pageContextPanel" paddingSize="s" hasBorder>
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
            <EuiFlexItem><EuiHealth color="warning">Prototype data</EuiHealth></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">Discover-style hunt workspace</EuiBadge></EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
        <EuiSpacer size="l" />
        <div className="pageComposition p07Composition">
          <EuiPanel hasBorder paddingSize="m" className="p07QueryPanel" data-visual-region="hunt-query-workbench">
            <EuiFlexGroup gutterSize="s" alignItems="flexEnd" responsive={false} className="queryRow">
              <EuiFlexItem grow={2}><EuiFieldSearch value={draft} onChange={(event) => setDraft(event.target.value)} onSearch={run} aria-label="Event query" placeholder="severity:high AND source:edge-firewall" /></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiSelect aria-label="Time field" defaultValue="event_time" options={[{ value: 'event_time', text: 'Event time' }, { value: 'ingested_at', text: 'Ingested time' }]} /></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiButton fill onClick={run}>Run query</EuiButton></EuiFlexItem>
            </EuiFlexGroup>
            {errors.length > 0 && <><EuiSpacer size="s" /><EuiCallOut title="Query parse error" color="danger">{errors.map((error) => <p key={`${error.code}-${error.span.start}`}><strong>{error.token}</strong>: {error.message} {error.recoverHint}</p>)}</EuiCallOut></>}
            <EuiSpacer size="s" />
            <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
              <EuiFlexItem grow={false}><EuiButtonEmpty buttonRef={opener} onClick={() => dispatch({ type: 'toggleFilter' })}>Advanced filter builder</EuiButtonEmpty></EuiFlexItem>
              {filters.children.map((condition) => <EuiBadge key={condition.id}>{condition.kind === 'condition' ? condition.label : 'Filter group'}</EuiBadge>)}
              <EuiFlexItem />
              <EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => dispatch({ type: 'toggleExport' })}>Export results</EuiButtonEmpty></EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>

          {statusMessage && <EuiCallOut title={statusMessage.title} color={statusMessage.color}>{statusMessage.body}</EuiCallOut>}

          <EuiPanel hasBorder paddingSize="m" className="p07ResultsPanel" data-visual-region="hunt-event-grid">
            <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
              <EuiFlexItem><EuiTitle size="s"><h2>Events</h2></EuiTitle></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiBadge color="hollow">{visibleCount} visible</EuiBadge></EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            {state.status === 'loading'
              ? <EuiCallOut title="Loading query execution">Cancellation is wired through AbortSignal.</EuiCallOut>
              : <EuiBasicTable tableCaption="Event search results" items={display} itemId="id" columns={[
                { field: 'id', name: 'Event ID', render: (value: string, item: EventRecord) => <EuiButtonEmpty size="xs" onClick={(event) => { inspectorOpener.current = event.currentTarget; setSelected(item); dispatch({ type: 'select', value: item.id }); }}>{value}</EuiButtonEmpty> },
                { field: 'event_time', name: 'Event time', sortable: true },
                { field: 'severity', name: 'Severity', render: (value: string) => <EuiBadge>{value}</EuiBadge> },
                { field: 'source', name: 'Source' },
                { field: 'host', name: 'Host' },
                { field: 'user', name: 'User', render: (value: string, item: EventRecord) => item.restricted ? <span aria-label="masked field">••••••</span> : value },
                { field: 'action', name: 'Action' },
              ]} noItemsMessage={state.status === 'filtered-empty' ? 'No events match filters.' : state.status === 'denied' ? 'No authorized events are available.' : 'No events available.'} />}
            <EuiSpacer size="s" />
            <EuiFlexGroup justifyContent="spaceBetween"><EuiButtonEmpty isDisabled={!prev} onClick={() => dispatch({ type: 'cursor', value: prev })}>Previous</EuiButtonEmpty><EuiButtonEmpty isDisabled={!next} onClick={() => dispatch({ type: 'cursor', value: next })}>Next</EuiButtonEmpty></EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiAccordion id="p07-coverage-histogram" buttonContent="Coverage, freshness and histogram details" paddingSize="s">
              <EuiFlexGroup gutterSize="s" wrap>
                <EuiFlexItem grow={false}><EuiBadge color="success">Coverage 100%</EuiBadge></EuiFlexItem>
                <EuiFlexItem grow={false}><EuiBadge color="hollow">Freshness 8s</EuiBadge></EuiFlexItem>
                <EuiFlexItem grow={false}><EuiBadge color="hollow">Asia/Taipei</EuiBadge></EuiFlexItem>
              </EuiFlexGroup>
              <div className="histogram" role="img" aria-label="Event histogram. Exact data follows in the table.">{[30, 55, 42, 75, 60, 88, 45, 65, 35, 70, 52, 80].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
              <table className="chartFallback"><caption>Histogram exact-data fallback</caption><tbody><tr><th>Visible events</th><td>{display.length}</td></tr><tr><th>Coverage</th><td>100%</td></tr><tr><th>Freshness lag</th><td>8s</td></tr><tr><th>Timezone</th><td>Asia/Taipei</td></tr></tbody></table>
            </EuiAccordion>
          </EuiPanel>
        </div>
      </EuiPageTemplate.Section>

      {state.filterOpen && <EuiFlyout onClose={() => { dispatch({ type: 'toggleFilter' }); requestAnimationFrame(() => opener.current?.focus()); }} ownFocus size="s" aria-labelledby="filter-title"><EuiFlyoutHeader><EuiTitle><h2 id="filter-title">Advanced filter builder</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiText><p>Filter chips and builder share the same nested model. Stale facets never clear input.</p></EuiText><EuiButton onClick={addHigh}>Add severity:high</EuiButton></EuiFlyoutBody></EuiFlyout>}
      {selected && <EuiFlyout onClose={closeInspector} ownFocus size="m" aria-labelledby="inspector-title"><EuiFlyoutHeader><EuiTitle><h2 id="inspector-title">Event inspector</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title={selectedDecision === 'masked' ? 'Field masking applied' : 'Authorized fields'} iconType="lock">Route, row, field, action and export use one policy interface.</EuiCallOut><EuiSpacer /><dl className="detailGrid"><dt>Event ID</dt><dd>{selected.id}</dd><dt>Event time</dt><dd>{selected.event_time}</dd><dt>Ingested</dt><dd>{selected.ingested_at}</dd><dt>Source</dt><dd>{selected.source}</dd><dt>User</dt><dd>{selected.restricted ? '••••••' : selected.user}</dd><dt>Message</dt><dd>{selected.message}</dd></dl></EuiFlyoutBody></EuiFlyout>}
      {state.exportOpen && <EuiModal onClose={() => dispatch({ type: 'toggleExport' })} aria-labelledby="export-title"><EuiModalHeader><EuiModalHeaderTitle id="export-title">Create export job</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype simulation" color="warning">No production API is called. Queued does not mean completed.</EuiCallOut><EuiText><p>Classification: Confidential · masked fields: user.email · rows estimated: {rows.length}</p></EuiText></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => dispatch({ type: 'toggleExport' })}>Cancel</EuiButtonEmpty><EuiButton fill onClick={exportNow}>Queue export</EuiButton></EuiModalFooter></EuiModal>}
      {state.receiptOpen && job && <EuiFlyout onClose={() => dispatch({ type: 'showReceipt' })} ownFocus aria-labelledby="receipt-title"><EuiFlyoutHeader><EuiTitle><h2 id="receipt-title">Action receipt</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiCallOut title="Prototype simulation · queued" color="warning">Accepted and queued are not completed. Authoritative rehydration is pending.</EuiCallOut><EuiText><p>Receipt: {job.receipt.receiptId}</p><p>Request: {job.receipt.requestId}</p><p>Status: {job.receipt.status}</p></EuiText></EuiFlyoutBody></EuiFlyout>}
    </EuiPageTemplate>
  );
}