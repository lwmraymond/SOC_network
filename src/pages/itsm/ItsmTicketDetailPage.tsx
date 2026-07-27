import { useEffect, useMemo, useState } from 'react';
import { EuiBadge, EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiSpacer } from '@elastic/eui';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { TicketBundle } from '../../itsm/contracts';
import { itsmApi } from '../../itsm/client';
import { useItsmQuery } from '../../itsm/hooks';
import { safeItsmReturnTo } from '../../itsm/navigation';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { createDemoMutationContext } from '../../itsm/components/demoContext';
import { GovernedAction } from '../../itsm/components/GovernedAction';
import { ItsmTabs } from '../../itsm/components/ItsmTabs';
import { TicketConversation } from '../../itsm/components/TicketConversation';
import { TicketDataTab } from '../../itsm/components/TicketDataTab';
import { TicketOverview, ticketKindLabel } from '../../itsm/components/TicketOverview';

const sharedTabs = ['Overview', 'Conversation', 'Activity', 'Relations', 'Approvals', 'SLA', 'Automation', 'Audit'] as const;

export default function ItsmTicketDetailPage() {
  const { ticketId = 'INC-7001' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = useItsmQuery((signal) => itsmApi.getTicket(ticketId, signal), [ticketId]);
  const [tab, setTab] = useState('Overview');
  const [bundle, setBundle] = useState<TicketBundle>();
  const returnTo = safeItsmReturnTo(params.get('returnTo'));
  const parentLabel = params.get('parentLabel') ?? 'Parent workspace';

  useEffect(() => {
    if (query.data) setBundle(query.data);
  }, [query.data]);

  const tabs = useMemo(() => {
    if (!bundle) return [...sharedTabs];
    const specific = bundle.ticket.kind === 'request' ? ['Request form'] : bundle.ticket.kind === 'problem' ? ['RCA'] : bundle.ticket.kind === 'change' ? ['Change plan', 'Implementation', 'Rollback'] : [];
    return [...sharedTabs, ...specific];
  }, [bundle]);

  const activeBundle = bundle ?? query.data;
  return <CapabilityShell
    title={activeBundle ? `${activeBundle.ticket.key} · ${activeBundle.ticket.title}` : 'Ticket detail workspace'}
    description="Shared Request / Incident / Problem / Change workspace with governed writes and type-specific workflow tabs."
    queryState={query.state}
    errorMessage={query.error?.message}
    rightSideItems={[
      <EuiButtonEmpty key="back" iconType="arrowLeft" onClick={() => navigate(returnTo)}>{parentLabel}</EuiButtonEmpty>,
      ...(activeBundle ? [<GovernedAction
        key="update"
        label="Preview status update"
        fill
        preview={(signal) => itsmApi.previewUpdateTicket(activeBundle.ticket.id, { status: 'pending' }, signal)}
        execute={async (signal) => {
          const result = await itsmApi.updateTicket(activeBundle.ticket.id, { status: 'pending' }, createDemoMutationContext(activeBundle.ticket.etag, activeBundle.ticket.version), signal);
          return { receipt: result.receipt };
        }}
        rehydrate={(receipt, signal) => itsmApi.refreshTicket(activeBundle.ticket.id, receipt.receiptId, signal)}
        onComplete={setBundle}
      />] : []),
    ]}
  >
    {activeBundle && <>
      <EuiPanel paddingSize="m" hasBorder className="itsmTicketHeader">
        <EuiFlexGroup alignItems="center" gutterSize="m" wrap>
          <EuiFlexItem>
            <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
              <EuiFlexItem grow={false}><EuiBadge color="hollow">{ticketKindLabel(activeBundle.ticket)}</EuiBadge></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiBadge color={activeBundle.ticket.priority === 'P1' ? 'danger' : activeBundle.ticket.priority === 'P2' ? 'warning' : 'hollow'}>{activeBundle.ticket.priority}</EuiBadge></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiBadge color="primary">{activeBundle.ticket.status}</EuiBadge></EuiFlexItem>
              <EuiFlexItem grow={false}><EuiBadge color="warning">authoritative:false in fixture mode</EuiBadge></EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <strong>{activeBundle.ticket.assigneeId ?? 'Unassigned'} · {activeBundle.ticket.assignmentGroup ?? 'No assignment group'} · {activeBundle.ticket.serviceName}</strong>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <div className="itsmHeaderClock">
              <span>Resolution clock</span>
              <strong>{activeBundle.slaClocks.find((clock) => clock.state === 'running')?.remainingSeconds ? `${Math.ceil((activeBundle.slaClocks.find((clock) => clock.state === 'running')?.remainingSeconds ?? 0) / 60)}m` : 'No active clock'}</strong>
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="none" hasBorder><ItsmTabs items={tabs} active={tab} onChange={setTab} /></EuiPanel>
      <EuiSpacer size="m" />
      {tab === 'Overview' ? <TicketOverview bundle={activeBundle} /> : tab === 'Conversation' ? <TicketConversation bundle={activeBundle} onRehydrated={setBundle} /> : <TicketDataTab bundle={activeBundle} tab={tab} />}
    </>}
  </CapabilityShell>;
}
