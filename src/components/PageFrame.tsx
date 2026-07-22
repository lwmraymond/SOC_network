import { ReactNode, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiPanel,
  EuiPageTemplate,
  EuiPopover,
  EuiSelect,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import type { PageSpec } from '../catalog/pageSpecs';
import type { PrototypePageFixture } from '../types/prototype';
import type { PrototypeViewState } from './usePrototypePage';
import { PrototypeActionFlow, type PrototypeReceipt } from './PrototypeActionFlow';
import { SocText } from './SocTypography';

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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pageMode, setPageMode] = useState<'focused' | 'full'>('focused');
  const [receipt, setReceipt] = useState<PrototypeReceipt>();
  const blocked = adapterError && !fixture;
  const pending = !fixture && !adapterError;
  const empty = viewState === 'empty' || viewState === 'filtered-empty';
  const fatal = viewState === 'error' || viewState === 'denied' || viewState === 'offline';
  const stateMessage = !['ready','loading','empty','filtered-empty'].includes(viewState) ? stateCopy[viewState as keyof typeof stateCopy] : undefined;
  return (
    <EuiPageTemplate restrictWidth={1800} className="prototypePage" data-page-id={spec.id} data-fixture-ready={fixture ? 'true' : 'false'} data-page-mode={pageMode}>
      <EuiPageTemplate.Header
        data-visual-region="page-header"
        pageTitle={spec.title}
        description={spec.archetype}
        paddingSize="m"
        bottomBorder="extended"
        rightSideItems={[
          <EuiButton key="primary" fill iconType="arrowRight" iconSide="right" isDisabled={Boolean(blocked)} title={blocked ? 'Production capability and adapter are not connected' : undefined} onClick={() => setActionOpen(true)}>{spec.primaryAction}</EuiButton>,
          <EuiButtonEmpty key="page-mode" aria-pressed={pageMode === 'full'} onClick={() => setPageMode((current) => current === 'focused' ? 'full' : 'focused')}>{pageMode === 'focused' ? 'Full page' : 'Focused view'}</EuiButtonEmpty>,
        ]}
      />
      <EuiPageTemplate.Section paddingSize="m">
        <EuiPanel className="pageContextPanel" paddingSize="s" hasBorder>
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
            <EuiFlexItem><EuiHealth color="warning">Prototype data</EuiHealth></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color={fixture && fixture.coverage < 0.95 ? 'warning' : 'success'}>Coverage {fixture ? `${Math.round(fixture.coverage * 100)}%` : '—'}</EuiBadge></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">Freshness {fixture?.freshness ?? '—'}</EuiBadge></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">{pageMode === 'focused' ? 'Focused view' : 'Full page'}</EuiBadge></EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiPopover
                isOpen={detailsOpen}
                closePopover={() => setDetailsOpen(false)}
                button={<EuiButtonEmpty size="xs" iconType="info" onClick={() => setDetailsOpen((open) => !open)}>Page details</EuiButtonEmpty>}
              >
                <div className="pageDetailsPopover">
                  <EuiTitle size="xs"><h2>Page details</h2></EuiTitle>
                  <SocText role="supporting">Fixture data only. Actions do not mutate production.</SocText>
                  <dl>
                    <dt>Role</dt><dd>{spec.primaryRole}</dd>
                    <dt>Timezone</dt><dd>Asia/Taipei</dd>
                    <dt>Surface</dt><dd>{spec.id} · {spec.group}</dd>
                    <dt>Mode</dt><dd>{pageMode === 'focused' ? 'Focused view' : 'Full page'}</dd>
                  </dl>
                  {import.meta.env.DEV && <EuiSelect compressed aria-label="Prototype state switcher" value={viewState} onChange={(event) => setViewState(event.target.value as PrototypeViewState)} options={['ready','loading','empty','filtered-empty','error','denied','offline','stale','degraded','partial'].map((value) => ({ value, text: value }))} />}
                  <SocText role="metadata">API, permission and mutation ownership remain disconnected until production services are supplied.</SocText>
                </div>
              </EuiPopover>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
        <EuiSpacer size="m" />
        {pending && <EuiCallOut title="Loading prototype adapter">Resolving the isolated development adapter and its source watermark.</EuiCallOut>}
        {blocked && <EuiCallOut title="Production adapter unavailable" color="danger">{adapterError}</EuiCallOut>}
        {viewState === 'loading' && <EuiCallOut title="Loading authoritative surface">Loading identity, scope, policy and source watermark before rendering business values.</EuiCallOut>}
        {empty && <EuiCallOut title={viewState === 'filtered-empty' ? 'No results match the current conditions' : 'No records are available'} color="primary">{viewState === 'filtered-empty' ? 'Remove one active condition or widen the time range. Your query remains intact.' : 'This is a valid empty state, not a zero-filled dashboard.'}</EuiCallOut>}
        {stateMessage && <EuiCallOut title={stateMessage.title} color={stateMessage.color}>{stateMessage.body}</EuiCallOut>}
        {!blocked && viewState !== 'loading' && !empty && !fatal && <div className="pageFrameContent" data-page-mode={pageMode}>{children}</div>}
        {fatal && <EuiSpacer />}
      </EuiPageTemplate.Section>
      <PrototypeActionFlow spec={spec} open={actionOpen} onClose={() => setActionOpen(false)} onReceipt={setReceipt} />
      {receipt && <div className="receiptDock" role="status" aria-live="polite"><strong>Prototype receipt</strong><span>{receipt.receiptId}</span><span>Status: {receipt.status}</span><span>Not completed</span><button type="button" onClick={() => setReceipt(undefined)}>Close</button></div>}
    </EuiPageTemplate>
  );
}
