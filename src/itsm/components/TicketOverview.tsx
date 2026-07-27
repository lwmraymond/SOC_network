import { EuiBadge, EuiCallOut, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import type { Ticket, TicketBundle } from '../contracts';

export function ticketKindLabel(ticket: Ticket): string {
  return ticket.kind === 'request' ? 'Service request' : `${ticket.kind[0].toUpperCase()}${ticket.kind.slice(1)}`;
}

export function TicketOverview({ bundle }: { bundle: TicketBundle }) {
  const ticket = bundle.ticket;
  return <div className="itsmTicketColumns">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Core record</h2></EuiTitle><EuiSpacer size="s" />
      <dl className="itsmDefinitionGrid">
        <div><dt>Status</dt><dd>{ticket.status}</dd></div>
        <div><dt>Priority</dt><dd>{ticket.priority}</dd></div>
        <div><dt>Service</dt><dd>{ticket.serviceName}</dd></div>
        <div><dt>Assignment group</dt><dd>{ticket.assignmentGroup ?? 'Unassigned'}</dd></div>
        <div><dt>Requester</dt><dd>{ticket.requesterId}</dd></div>
        <div><dt>Assignee</dt><dd>{ticket.assigneeId ?? 'Unassigned'}</dd></div>
        <div><dt>Source</dt><dd>{ticket.source}{ticket.sourceReference ? ` · ${ticket.sourceReference}` : ''}</dd></div>
        <div><dt>Version</dt><dd>{ticket.version} · {ticket.etag ?? 'No ETag'}</dd></div>
      </dl>
      <EuiSpacer /><EuiText size="s"><p>{ticket.description}</p></EuiText>
    </EuiPanel>

    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>{ticketKindLabel(ticket)} workflow</h2></EuiTitle><EuiSpacer size="s" />
      {ticket.kind === 'request' && <dl className="itsmDefinitionGrid">
        <div><dt>Request type</dt><dd>{ticket.requestTypeName}</dd></div>
        <div><dt>Fulfilment stage</dt><dd>{ticket.fulfilmentStage}</dd></div>
        <div><dt>Beneficiary</dt><dd>{ticket.beneficiaryId ?? ticket.requesterId}</dd></div>
        <div><dt>Dynamic fields</dt><dd>{Object.entries(ticket.dynamicFields).map(([key, value]) => `${key}: ${String(value)}`).join(' · ')}</dd></div>
      </dl>}
      {ticket.kind === 'incident' && <dl className="itsmDefinitionGrid">
        <div><dt>Impact</dt><dd>{ticket.impact}</dd></div>
        <div><dt>Urgency</dt><dd>{ticket.urgency}</dd></div>
        <div><dt>Lifecycle</dt><dd>{ticket.lifecycleStage}</dd></div>
        <div><dt>Major incident</dt><dd>{ticket.majorIncident ? 'Yes' : 'No'}</dd></div>
        <div><dt>Affected objects</dt><dd>{ticket.affectedObjectIds.join(', ')}</dd></div>
      </dl>}
      {ticket.kind === 'problem' && <dl className="itsmDefinitionGrid">
        <div><dt>Known error</dt><dd>{ticket.knownError ? 'Yes' : 'No'}</dd></div>
        <div><dt>RCA state</dt><dd>{ticket.rcaStatus}</dd></div>
        <div><dt>Root cause</dt><dd>{ticket.rootCause ?? 'Not documented'}</dd></div>
        <div><dt>Workaround</dt><dd>{ticket.workaround ?? 'Not documented'}</dd></div>
        <div><dt>Linked incidents</dt><dd>{ticket.linkedIncidentIds.join(', ')}</dd></div>
      </dl>}
      {ticket.kind === 'change' && <dl className="itsmDefinitionGrid">
        <div><dt>Change type</dt><dd>{ticket.changeType}</dd></div>
        <div><dt>Risk</dt><dd>{ticket.riskLevel}</dd></div>
        <div><dt>CAB required</dt><dd>{ticket.cabRequired ? 'Yes' : 'No'}</dd></div>
        <div><dt>Window</dt><dd>{ticket.implementationWindow.startsAt} – {ticket.implementationWindow.endsAt} ({ticket.implementationWindow.timezone})</dd></div>
      </dl>}
    </EuiPanel>

    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Capability &amp; integrity</h2></EuiTitle><EuiSpacer size="s" />
      {ticket.permissions.map((permission) => <div className="itsmCapabilityRow" key={permission.capability}><span>{permission.capability}</span><EuiBadge color={permission.decision === 'allow' ? 'success' : permission.decision === 'deny' ? 'danger' : 'warning'}>{permission.decision}</EuiBadge></div>)}
      <EuiSpacer /><EuiCallOut title="Authoritative concurrency">Every write includes the current ETag/version and an idempotency key, then re-reads the ticket after the receipt.</EuiCallOut>
    </EuiPanel>
  </div>;
}
