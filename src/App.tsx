import { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHeader,
  EuiHeaderLogo,
  EuiHeaderSectionItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPageTemplate,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { isPrototypeMode, searchPrototypeEvents, type EventRecord } from './prototype/events';

type ViewState = 'ready' | 'loading' | 'empty' | 'filtered-empty' | 'error' | 'denied' | 'offline' | 'stale' | 'degraded' | 'partial';

const nav = [
  ['Dashboard', '/dashboard/soc'],
  ['Cases', '/analyzer/cases'],
  ['Alerts', '/analyzer/alerts'],
  ['Event Search', '/analyzer/search'],
  ['Assets', '/devices/inventory'],
  ['ITSM', '/itsm/overview'],
  ['Runtime', '/runtime'],
  ['Settings', '/settings'],
] as const;

function PrototypeBanner() {
  return (
    <EuiCallOut title="Prototype Mode · Fixture Data · No production mutations" color="warning" iconType="beaker">
      The fixture adapter is development-only. Production builds do not fall back to local data, and all mutation controls remain disabled.
    </EuiCallOut>
  );
}

function Shell() {
  const location = useLocation();
  return (
    <div className="appShell">
      <EuiHeader position="fixed">
        <EuiHeaderSectionItem border="right"><EuiHeaderLogo iconType="logoElastic">SOC Operations</EuiHeaderLogo></EuiHeaderSectionItem>
        <EuiHeaderSectionItem><EuiFieldSearch compressed placeholder="Global search (prototype)" aria-label="Global search" /></EuiHeaderSectionItem>
        <EuiHeaderSectionItem><EuiBadge color="hollow">{location.pathname}</EuiBadge></EuiHeaderSectionItem>
      </EuiHeader>
      <aside className="sidebar" aria-label="Primary navigation">
        {nav.map(([label, href]) => <NavLink key={href} to={href} className={({ isActive }) => isActive ? 'navItem active' : 'navItem'}>{label}</NavLink>)}
      </aside>
      <main className="content"><Routes><Route path="/analyzer/search" element={<EventSearchPage />} /><Route path="*" element={<Placeholder />} /></Routes></main>
    </div>
  );
}

function Placeholder() {
  return <EuiPageTemplate panelled><EuiPageTemplate.Section><PrototypeBanner /><EuiSpacer /><EuiCallOut title="Implementation-gated route" iconType="iInCircle">This canonical route is registered for IA validation but does not yet claim a finished page implementation.</EuiCallOut></EuiPageTemplate.Section></EuiPageTemplate>;
}

function EventSearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get('q') ?? '';
  const [draft, setDraft] = useState(query);
  const [state, setState] = useState<ViewState>((params.get('state') as ViewState) || 'ready');
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isPrototypeMode) {
      setError('No production event-search adapter is configured. Enable VITE_ENABLE_FIXTURES=true only for development review.');
      setEvents([]);
      return;
    }
    if (state === 'loading') return;
    searchPrototypeEvents(query).then((rows) => { if (!cancelled) setEvents(rows); }).catch((reason) => { if (!cancelled) setError(String(reason)); });
    return () => { cancelled = true; };
  }, [query, state]);

  const visibleEvents = useMemo(() => state === 'empty' || state === 'filtered-empty' ? [] : events, [events, state]);
  const runQuery = () => {
    const next = new URLSearchParams(params);
    if (draft.trim()) next.set('q', draft.trim()); else next.delete('q');
    setParams(next, { replace: false });
  };

  const stateMessage: Partial<Record<ViewState, { title: string; body: string; color: 'danger' | 'warning' | 'primary' }>> = {
    error: { title: 'Query failed', body: 'The query service returned an error. Your query and filters are preserved.', color: 'danger' },
    denied: { title: 'Access denied', body: 'The current policy decision does not allow this dataset or field scope.', color: 'danger' },
    offline: { title: 'Offline', body: 'Network connectivity is unavailable. No cached operational data is shown.', color: 'warning' },
    stale: { title: 'Stale results', body: 'Results are older than the accepted freshness threshold.', color: 'warning' },
    degraded: { title: 'Degraded coverage', body: 'One or more datasets are unavailable; remaining results are shown.', color: 'warning' },
    partial: { title: 'Partial data', body: 'The query reached a service limit. Export and totals must preserve this coverage warning.', color: 'warning' },
  };
  const message = stateMessage[state];

  const columns = [
    { field: 'eventTime', name: 'Event time', sortable: true },
    { field: 'ingestedAt', name: 'Ingested', sortable: true },
    { field: 'severity', name: 'Severity', render: (value: string) => <EuiBadge color={value === 'critical' ? 'danger' : value === 'high' ? 'warning' : 'hollow'}>{value}</EuiBadge> },
    { field: 'category', name: 'Category' },
    { field: 'source', name: 'Source' },
    { field: 'host', name: 'Host' },
    { field: 'user', name: 'User', render: (value: string, item: EventRecord) => item.masked ? <span aria-label="masked field">••••••</span> : value },
    { field: 'action', name: 'Action' },
  ];

  return (
    <EuiPageTemplate panelled restrictWidth={false}>
      <EuiPageTemplate.Header pageTitle="Event Search & Hunt" description="P07 · Query workbench + exact event grid" rightSideItems={[<EuiButton key="save" isDisabled title="Production saved-query service is not connected">Save query</EuiButton>]} />
      <EuiPageTemplate.Section>
        <PrototypeBanner />
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" alignItems="flexEnd" responsive={false} className="queryRow">
          <EuiFlexItem grow={2}><EuiFieldSearch value={draft} onChange={(e) => setDraft(e.target.value)} onSearch={runQuery} prepend="Query" placeholder={'user:"a.chen" AND severity:high'} aria-label="Event query" /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiSelect aria-label="Time field" options={[{ value: 'event_time', text: 'Event time' }, { value: 'ingested_at', text: 'Ingested time' }]} /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiSelect aria-label="Time range" options={[{ value: '24h', text: 'Last 24 hours' }, { value: '7d', text: 'Last 7 days' }]} /></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButton fill onClick={runQuery} iconType="play">Run query</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" wrap>
          {['dataset: security-*', 'timezone: Asia/Taipei', 'freshness < 5m'].map((chip) => <EuiBadge key={chip} color="hollow">{chip}</EuiBadge>)}
          <EuiButtonEmpty size="xs" iconType="filter">Advanced filter builder</EuiButtonEmpty>
          <EuiButtonEmpty size="xs" iconType="save">Saved views</EuiButtonEmpty>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiPanel paddingSize="m">
          <EuiFlexGroup>
            <EuiFlexItem><EuiStat title={visibleEvents.length} description="Results" /></EuiFlexItem>
            <EuiFlexItem><EuiStat title="4.2 MB" description="Scanned (fixture)" /></EuiFlexItem>
            <EuiFlexItem><EuiStat title="180 ms" description="Duration" /></EuiFlexItem>
            <EuiFlexItem><EuiStat title="3" description="Datasets" /></EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="m" />
          <div className="histogram" role="img" aria-label="Event histogram table fallback: 4 events across the selected period">
            {[36, 58, 42, 75, 48, 88, 63, 30, 54, 70, 45, 62].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
          </div>
          <EuiText size="xs"><p>Histogram is illustrative fixture data. Exact records remain authoritative in the grid below.</p></EuiText>
        </EuiPanel>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}><EuiSelect value={state} onChange={(e) => { const next = e.target.value as ViewState; setState(next); const p = new URLSearchParams(params); p.set('state', next); setParams(p); }} aria-label="Prototype state switcher" options={['ready','loading','empty','filtered-empty','error','denied','offline','stale','degraded','partial'].map((value) => ({ value, text: value }))} /></EuiFlexItem>
          <EuiFlexItem><EuiText size="s"><p>Development-only state switcher</p></EuiText></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiButtonEmpty iconType="exportAction" isDisabled title="Async export job service is not connected">Export results</EuiButtonEmpty></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        {error && !isPrototypeMode && <EuiCallOut title="Production adapter unavailable" color="danger">{error}</EuiCallOut>}
        {message && <EuiCallOut title={message.title} color={message.color}>{message.body}</EuiCallOut>}
        {state === 'loading' ? <EuiCallOut title="Loading query job">The query is running. Cancellation and execution ID will be supplied by the real adapter.</EuiCallOut> : (
          <EuiBasicTable tableCaption="Event search results" items={visibleEvents} columns={columns} itemId="id" onRowClick={(item) => { setSelected(item); const p = new URLSearchParams(params); p.set('event', item.id); navigate({ search: p.toString() }); }} noItemsMessage={state === 'filtered-empty' ? 'No events match the current filters. Remove a filter or widen the time range.' : 'No events are available for this scope.'} />
        )}
      </EuiPageTemplate.Section>
      {selected && <EuiFlyout onClose={() => { setSelected(null); const p = new URLSearchParams(params); p.delete('event'); setParams(p); }} ownFocus aria-labelledby="event-inspector-title" size="m">
        <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="event-inspector-title">Event inspector</h2></EuiTitle><EuiText size="s"><p>{selected.id} · schema revision prototype-1</p></EuiText></EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiCallOut title={selected.masked ? 'Field masking applied' : 'Authorized fixture fields'} color={selected.masked ? 'warning' : 'primary'} iconType="lock">Route, row and field decisions use the same future policy adapter boundary.</EuiCallOut>
          <EuiSpacer />
          <EuiCodeBlock language="json" isCopyable>{JSON.stringify(selected, null, 2)}</EuiCodeBlock>
          <EuiSpacer />
          <EuiButton isDisabled title="Production case service is not connected">Add event to case</EuiButton>
        </EuiFlyoutBody>
      </EuiFlyout>}
    </EuiPageTemplate>
  );
}

export function App() { return <Shell />; }
