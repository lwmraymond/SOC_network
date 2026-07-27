import type { ReactNode } from 'react';
import { EuiBadge, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiPageTemplate, EuiPanel, EuiSelect, EuiSpacer } from '@elastic/eui';
import { useSearchParams } from 'react-router-dom';
import type { ViewState } from '../contracts';
import { getItsmAdapterMode } from '../client';

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

const viewStates: ViewState[] = ['ready', 'loading', 'empty', 'filtered-empty', 'error', 'denied', 'offline', 'stale', 'partial'];

export function CapabilityShell({ title, description, queryState, errorMessage, rightSideItems, children, management = false }: {
  title: string;
  description: string;
  queryState: ViewState;
  errorMessage?: string;
  rightSideItems?: ReactNode[];
  children: ReactNode;
  management?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const requested = params.get('state') as ViewState | null;
  const state = requested && viewStates.includes(requested) ? requested : queryState;
  const blocking = ['loading', 'empty', 'filtered-empty', 'error', 'denied', 'offline'].includes(state);
  const adapterMode = getItsmAdapterMode();
  const setState = (next: ViewState) => {
    const updated = new URLSearchParams(params);
    if (next === 'ready') updated.delete('state'); else updated.set('state', next);
    setParams(updated, { replace: false });
  };

  return <EuiPageTemplate restrictWidth={false} className={`itsmCapabilityPage${management ? ' itsmManagementPage' : ''}`} data-capability-state={state} data-adapter-mode={adapterMode}>
    <EuiPageTemplate.Header pageTitle={title} description={description} paddingSize="m" bottomBorder="extended" rightSideItems={rightSideItems} />
    <EuiPageTemplate.Section paddingSize="m">
      <EuiPanel paddingSize="s" hasBorder className="itsmCapabilityContext">
        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
          <EuiFlexItem grow={false}><EuiBadge color={adapterMode === 'development-fixture' ? 'warning' : 'hollow'}>{adapterMode === 'development-fixture' ? 'Development fixture adapter · non-authoritative' : adapterMode === 'production' ? 'Injected production adapter' : 'Production adapter required'}</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Queued ≠ completed</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">ETag / version required</EuiBadge></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">Authoritative refresh required</EuiBadge></EuiFlexItem>
          {import.meta.env.DEV && <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Capability state switcher" value={state} onChange={(event) => setState(event.target.value as ViewState)} options={viewStates.map((value) => ({ value, text: value }))} /></EuiFlexItem>}
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      {state !== 'ready' && <><EuiCallOut title={stateCopy[state].title} color={stateCopy[state].color}>{errorMessage ?? stateCopy[state].body}</EuiCallOut><EuiSpacer size="m" /></>}
      {!blocking && <div className={management ? 'itsmManagementContent' : undefined}>{children}</div>}
      {state === 'loading' && <div className="itsmCenteredState" role="status"><EuiLoadingSpinner size="xl" /><span>Loading permissions, capability and authoritative data…</span></div>}
    </EuiPageTemplate.Section>
  </EuiPageTemplate>;
}
