import { ReactNode, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageTemplate,
  EuiSelect,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import type { PageSpec } from '../catalog/pageSpecs';
import type { PrototypePageFixture } from '../types/prototype';
import type { PrototypeViewState } from './usePrototypePage';
import { PrototypeActionFlow, type PrototypeReceipt } from './PrototypeActionFlow';

const stateCopy: Record<Exclude<PrototypeViewState,'ready'|'loading'|'empty'|'filtered-empty'>,{title:string;body:string;color:'danger'|'warning'|'primary'}> = {
  error: { title: 'Unable to load this work surface', body: 'The adapter returned a classified error. Query, filters and navigation context are preserved.', color: 'danger' },
  denied: { title: 'Access denied', body: 'The unified policy decision denied this route or scope without exposing hidden object counts.', color: 'danger' },
  offline: { title: 'Offline', body: 'No cached operational records are presented as authoritative data.', color: 'warning' },
  stale: { title: 'Stale authoritative state', body: 'The source watermark is outside the accepted freshness budget. Actions require refresh.', color: 'warning' },
  degraded: { title: 'Degraded coverage', body: 'One or more source regions are unavailable. Available sections remain visible with coverage labels.', color: 'warning' },
  partial: { title: 'Partial data', body: 'The adapter returned partial coverage. Grid, chart and export preserve the same warning.', color: 'warning' },
};

export function PageFrame({ spec, fixture, adapterError, viewState, setViewState, children }: {
  spec: PageSpec;
  fixture?: PrototypePageFixture;
  adapterError?: string;
  viewState: PrototypeViewState;
  setViewState(state: PrototypeViewState): void;
  children: ReactNode;
}) {
  const [actionOpen, setActionOpen] = useState(false);
  const [receipt, setReceipt] = useState<PrototypeReceipt>();
  const blocked = adapterError && !fixture;
  const pending = !fixture && !adapterError;
  const empty = viewState === 'empty' || viewState === 'filtered-empty';
  const fatal = viewState === 'error' || viewState === 'denied' || viewState === 'offline';
  const stateMessage = !['ready','loading','empty','filtered-empty'].includes(viewState) ? stateCopy[viewState as keyof typeof stateCopy] : undefined;
  return (
    <EuiPageTemplate panelled restrictWidth={1800} className="prototypePage" data-page-id={spec.id} data-fixture-ready={fixture ? 'true' : 'false'}>
      <EuiPageTemplate.Header
        data-visual-region="page-header"
        pageTitle={spec.title}
        description={`${spec.id} · ${spec.archetype}`}
        rightSideItems={[<EuiButton key="primary" fill isDisabled={Boolean(blocked)} title={blocked ? 'Production capability and adapter are not connected' : undefined} onClick={() => setActionOpen(true)}>{spec.primaryAction}</EuiButton>]}
      />
      <EuiPageTemplate.Section>
        <nav aria-label="Breadcrumb" className="breadcrumbs"><a href="/">SOC / ITSM</a><span>/</span><span>{spec.group}</span><span>/</span><strong>{spec.title}</strong></nav>
        <EuiSpacer size="s" />
        <EuiCallOut title="Prototype Mode · Fixture Data · No production mutations" color="warning">
          Visual and interaction design only. Production adapters never fall back to fixtures, and submitted/accepted/queued are never presented as completed.
        </EuiCallOut>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">{spec.primaryRole}</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Asia/Taipei</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={fixture && fixture.coverage < 0.95 ? 'warning' : 'success'}>Coverage {fixture ? `${Math.round(fixture.coverage * 100)}%` : '—'}</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Freshness {fixture?.freshness ?? '—'}</EuiBadge></EuiFlexItem>
          {import.meta.env.DEV && <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Prototype state switcher" value={viewState} onChange={(event) => setViewState(event.target.value as PrototypeViewState)} options={['ready','loading','empty','filtered-empty','error','denied','offline','stale','degraded','partial'].map((value) => ({ value, text: value }))} /></EuiFlexItem>}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        {pending && <EuiCallOut title="Loading prototype adapter">Resolving the isolated development adapter and its source watermark.</EuiCallOut>}
        {blocked && <EuiCallOut title="Production adapter unavailable" color="danger">{adapterError}</EuiCallOut>}
        {viewState === 'loading' && <EuiCallOut title="Loading authoritative surface">Loading identity, scope, policy and source watermark before rendering business values.</EuiCallOut>}
        {empty && <EuiCallOut title={viewState === 'filtered-empty' ? 'No results match the current conditions' : 'No records are available'} color="primary">{viewState === 'filtered-empty' ? 'Remove one active condition or widen the time range. Your query remains intact.' : 'This is a valid empty state, not a zero-filled dashboard.'}</EuiCallOut>}
        {stateMessage && <EuiCallOut title={stateMessage.title} color={stateMessage.color}>{stateMessage.body}</EuiCallOut>}
        {!blocked && viewState !== 'loading' && !empty && !fatal && <>{children}</>}
        {fatal && <EuiSpacer />}
        <EuiSpacer size="l" />
        <EuiText size="xs" color="subdued"><p><strong>Implementation boundary:</strong> API, schema, permission, SLA, threshold and mutation ownership remain [DISCOVER] or [BLOCKED] until production services are supplied.</p></EuiText>
      </EuiPageTemplate.Section>
      <PrototypeActionFlow spec={spec} open={actionOpen} onClose={() => setActionOpen(false)} onReceipt={setReceipt} />
      {receipt && <div className="receiptDock" role="status" aria-live="polite"><strong>Prototype receipt</strong><span>{receipt.receiptId}</span><span>Status: {receipt.status}</span><span>Not completed</span><button type="button" onClick={() => setReceipt(undefined)}>Close</button></div>}
    </EuiPageTemplate>
  );
}
