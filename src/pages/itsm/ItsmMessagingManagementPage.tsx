import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiProgress,
  EuiSpacer,
  EuiStat,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { Link } from 'react-router-dom';
import type {
  CapabilitySnapshot,
  InboundMailbox,
  InboundRoutingRule,
  IngestionEvent,
  NotificationDelivery,
  NotificationPolicy,
  NotificationProvider,
  NotificationRecipient,
  NotificationTemplate,
} from '../../itsm/contracts';
import { itsmApi } from '../../itsm/client';
import { useItsmQuery } from '../../itsm/hooks';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { createDemoMutationContext } from '../../itsm/components/demoContext';
import { GovernedAction } from '../../itsm/components/GovernedAction';
import { ItsmTabs } from '../../itsm/components/ItsmTabs';

type MessagingData = {
  providers: NotificationProvider[];
  recipients: NotificationRecipient[];
  templates: NotificationTemplate[];
  policies: NotificationPolicy[];
  deliveries: NotificationDelivery[];
  mailboxes: InboundMailbox[];
  routes: InboundRoutingRule[];
  events: IngestionEvent[];
  capabilities: CapabilitySnapshot;
};

const messagingTabs = ['Providers', 'Templates & policies', 'Inbound mailboxes', 'Delivery & ingestion'] as const;

export default function ItsmMessagingManagementPage() {
  const query = useItsmQuery<MessagingData>(async (signal) => {
    const [providers, recipients, templates, policies, deliveries, mailboxes, routes, events, capabilities] = await Promise.all([
      itsmApi.listNotificationProviders({}, signal),
      itsmApi.listNotificationRecipients({}, signal),
      itsmApi.listNotificationTemplates({}, signal),
      itsmApi.listNotificationPolicies({}, signal),
      itsmApi.listNotificationDeliveries({}, signal),
      itsmApi.listInboundMailboxes({}, signal),
      itsmApi.listInboundRoutingRules({}, signal),
      itsmApi.listIngestionEvents({}, signal),
      itsmApi.getCapabilities(signal),
    ]);
    return {
      providers: providers.items,
      recipients: recipients.items,
      templates: templates.items,
      policies: policies.items,
      deliveries: deliveries.items,
      mailboxes: mailboxes.items,
      routes: routes.items,
      events: events.items,
      capabilities,
    };
  }, []);
  const [tab, setTab] = useState('Providers');
  const [selectedProviderId, setSelectedProviderId] = useState('provider-smtp-primary');
  const [selectedMailboxId, setSelectedMailboxId] = useState('mailbox-service-desk');
  const data = query.data;
  const provider = data?.providers.find((item) => item.id === selectedProviderId) ?? data?.providers[0];
  const mailbox = data?.mailboxes.find((item) => item.id === selectedMailboxId) ?? data?.mailboxes[0];
  const summary = useMemo(() => {
    if (!data) return undefined;
    return {
      enabledProviders: data.providers.filter((item) => item.status === 'enabled').length,
      configuredSecrets: data.providers.filter((item) => item.secretConfigured).length + data.mailboxes.filter((item) => item.secretConfigured).length,
      deliveryFailures: data.deliveries.filter((item) => item.state === 'failed' || item.state === 'partial').length,
      quarantined: data.events.filter((item) => item.state === 'quarantined' || item.state === 'failed').length,
      publishedRoutes: data.routes.filter((item) => item.status === 'published').length,
    };
  }, [data]);

  return <CapabilityShell
    title="Notifications & inbound mail"
    description="SMTP / Graph providers, templates, recipient policies, delivery history, IMAP / Graph mailboxes and ingestion routing."
    queryState={query.state}
    errorMessage={query.error?.message}
    management
    rightSideItems={[<EuiButtonEmpty key="settings" href="/itsm/settings">Back to ITSM settings</EuiButtonEmpty>]}
  >
    {data && summary && <>
      <EuiFlexGroup gutterSize="m" wrap className="itsmKpiStrip" data-management-summary="messaging">
        {[
          ['Enabled providers', summary.enabledProviders],
          ['Configured credentials', summary.configuredSecrets],
          ['Delivery failures', summary.deliveryFailures],
          ['Quarantined / failed mail', summary.quarantined],
          ['Published routing rules', summary.publishedRoutes],
        ].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="m" hasBorder><EuiStat title={String(value)} description={String(label)} titleSize="s" /></EuiPanel></EuiFlexItem>)}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="none" hasBorder><ItsmTabs items={messagingTabs} active={tab} onChange={setTab} /></EuiPanel>
      <EuiSpacer size="m" />

      {tab === 'Providers' && provider && <div className="itsmAdminGrid itsmPrimaryAdminGrid">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>Notification providers</h2></EuiTitle>
          {data.providers.map((item) => <button type="button" className={`itsmResourceButton ${item.id === provider.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedProviderId(item.id)}><span><strong>{item.name}</strong><small>{item.kind} · secret {item.secretConfigured ? 'configured' : 'missing'} · revision {item.version}</small></span><EuiBadge color={item.status === 'enabled' ? 'success' : item.status === 'error' ? 'danger' : 'warning'}>{item.status}</EuiBadge></button>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>{provider.name}</h2></EuiTitle>
          <div className="itsmFormGrid">
            <EuiFormRow label="Provider type"><EuiFieldText value={provider.kind} readOnly /></EuiFormRow>
            <EuiFormRow label="Host / sender"><EuiFieldText value={String(provider.config.host ?? provider.config.sender ?? '')} readOnly /></EuiFormRow>
            <EuiFormRow label="Port / tenant"><EuiFieldText value={String(provider.config.port ?? provider.config.tenantId ?? '')} readOnly /></EuiFormRow>
            <EuiFormRow label="Last test"><EuiFieldText value={`${provider.lastTestState ?? 'unknown'}${provider.lastTestAt ? ` · ${provider.lastTestAt}` : ''}`} readOnly /></EuiFormRow>
          </div>
          <EuiSwitch checked={provider.secretConfigured} onChange={() => undefined} label="Secret configured in backend secret store" />
          <EuiSpacer />
          <EuiCallOut title="Frontend-only boundary" color="warning">This UI never stores or tests SMTP/Graph credentials directly. A queued test receipt is not a successful delivery.</EuiCallOut>
          <EuiSpacer />
          <GovernedAction
            label="Test provider connection"
            fill
            preview={async () => ({ operation: 'notification.provider.test', summary: `Test ${provider.name}`, affectedResources: [{ type: 'notification-provider', id: provider.id, effect: 'connection test only' }], permissions: [{ capability: 'notification.provider.test', decision: 'conditional' }], validation: provider.secretConfigured ? [] : [{ field: 'secret', code: 'SECRET_MISSING', message: 'Backend secret is not configured.', severity: 'warning' }], warnings: ['A queued test receipt is not a successful SMTP or Graph delivery.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })}
            execute={async (signal) => ({ receipt: await itsmApi.testNotificationProvider(provider.id, createDemoMutationContext(provider.etag, provider.version), signal) })}
            rehydrate={async (_receipt, signal) => (await itsmApi.listNotificationProviders({}, signal)).items}
          />
        </EuiPanel>
      </div>}

      {tab === 'Templates & policies' && <div className="itsmTwoColumn">
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Templates and recipients</h2></EuiTitle>{data.templates.map((template) => <article className="itsmResourceCard" key={template.id}><EuiBadge color={template.status === 'published' ? 'success' : 'warning'}>{template.status}</EuiBadge><strong>{template.name}</strong><span>{template.subject}</span><small>Variables: {template.variables.join(', ')}</small></article>)}<EuiSpacer size="s" />{data.recipients.map((recipient) => <div className="itsmHealthRow" key={recipient.id}><span><strong>{recipient.name}</strong><small>{recipient.type} · {recipient.referenceId ?? recipient.address ?? 'unresolved'}</small></span><EuiBadge color={recipient.status === 'active' ? 'success' : 'warning'}>{recipient.status}</EuiBadge></div>)}</EuiPanel>
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Routing policies</h2></EuiTitle>{data.policies.map((policy) => <article className="itsmResourceCard" key={policy.id}><EuiBadge color={policy.status === 'published' ? 'success' : 'warning'}>{policy.status}</EuiBadge><strong>{policy.name}</strong><span>{policy.event}</span><small>{policy.providerId} · {policy.templateId} · recipients {policy.recipientIds.join(', ')}</small></article>)}</EuiPanel>
      </div>}

      {tab === 'Inbound mailboxes' && mailbox && <div className="itsmAdminGrid itsmPrimaryAdminGrid">
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Mailboxes</h2></EuiTitle>{data.mailboxes.map((item) => <button type="button" className={`itsmResourceButton ${item.id === mailbox.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedMailboxId(item.id)}><span><strong>{item.name}</strong><small>{item.address} · {item.kind} · revision {item.version}</small></span><EuiBadge color={item.status === 'enabled' ? 'success' : item.status === 'error' ? 'danger' : 'warning'}>{item.status}</EuiBadge></button>)}</EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>{mailbox.name}</h2></EuiTitle>
          <div className="itsmFormGrid">
            <EuiFormRow label="Protocol"><EuiFieldText value={mailbox.kind} readOnly /></EuiFormRow>
            <EuiFormRow label="Address"><EuiFieldText value={mailbox.address} readOnly /></EuiFormRow>
            <EuiFormRow label="Folder"><EuiFieldText value={mailbox.folder ?? 'Inbox'} readOnly /></EuiFormRow>
            <EuiFormRow label="Ingestion mode"><EuiFieldText value={mailbox.pollingMode} readOnly /></EuiFormRow>
          </div>
          <EuiSwitch checked={mailbox.secretConfigured} onChange={() => undefined} label="Credential / consent configured in backend" />
          <EuiSpacer />
          <EuiTitle size="xs"><h3>Routing rules</h3></EuiTitle>
          {data.routes.filter((route) => route.mailboxId === mailbox.id).map((route) => <article className="itsmResourceCard" key={route.id}><strong>{route.order}. {route.name}</strong><span>{route.conditions.join(' AND ')}</span><small>{route.action}{route.ticketKind ? ` → ${route.ticketKind}` : ''} · {route.status}</small></article>)}
          <EuiSpacer />
          <GovernedAction
            label="Test inbound connection"
            fill
            preview={async () => ({ operation: 'inbound.mailbox.test', summary: `Test ${mailbox.name}`, affectedResources: [{ type: 'inbound-mailbox', id: mailbox.id, effect: 'connectivity and permission test only' }], permissions: [{ capability: 'inbound.mailbox.test', decision: 'conditional' }], validation: mailbox.secretConfigured ? [] : [{ field: 'credential', code: 'CREDENTIAL_MISSING', message: 'Backend credential or Graph consent is not configured.', severity: 'warning' }], warnings: ['No message will be ingested and no ticket will be created by this UI test.'], authoritative: false, expiresAt: new Date(Date.now() + 300000).toISOString() })}
            execute={async (signal) => ({ receipt: await itsmApi.testInboundMailbox(mailbox.id, createDemoMutationContext(mailbox.etag, mailbox.version), signal) })}
            rehydrate={async (_receipt, signal) => (await itsmApi.listInboundMailboxes({}, signal)).items}
          />
        </EuiPanel>
      </div>}

      {tab === 'Delivery & ingestion' && <div className="itsmTwoColumn">
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Delivery history</h2></EuiTitle><table><thead><tr><th>Delivery</th><th>Recipient</th><th>State</th><th>Attempts</th></tr></thead><tbody>{data.deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.id}<small>{delivery.ticketId ?? '—'} · {delivery.providerMessageId ?? 'no provider ID'}</small></td><td>{delivery.recipient}</td><td><EuiBadge color={delivery.state === 'failed' || delivery.state === 'partial' ? 'danger' : delivery.state === 'delivered' ? 'success' : 'warning'}>{delivery.state}</EuiBadge></td><td>{delivery.attempts}<small>{delivery.lastError?.message}</small></td></tr>)}</tbody></table></EuiPanel>
        <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Ingestion history</h2></EuiTitle><table><thead><tr><th>Message</th><th>Sender / subject</th><th>State</th><th>Ticket</th></tr></thead><tbody>{data.events.map((event) => <tr key={event.id}><td>{event.messageId}</td><td>{event.sender}<small>{event.subject}</small></td><td><EuiBadge color={event.state === 'failed' || event.state === 'quarantined' ? 'danger' : 'success'}>{event.state}</EuiBadge></td><td>{event.ticketId ? <Link to={`/itsm/tickets/${event.ticketId}?returnTo=%2Fitsm%2Fnotifications&parentLabel=Notifications+%26+inbound+mail`}>{event.ticketId}</Link> : '—'}<small>{event.failure?.message}</small></td></tr>)}</tbody></table></EuiPanel>
      </div>}

      <EuiSpacer size="m" />
      <div className="itsmManagementSecondary" data-management-secondary="messaging">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Provider and credential health</h2></EuiTitle>
          {[...data.providers, ...data.mailboxes].map((item) => <div className="itsmHealthRow" key={item.id}><span><strong>{item.name}</strong><small>{'kind' in item ? item.kind : 'provider'} · secret/consent {item.secretConfigured ? 'configured' : 'missing'} · test {item.lastTestState ?? 'unknown'}</small></span><EuiProgress value={item.secretConfigured ? 75 : 25} max={100} size="s" color={item.secretConfigured ? 'primary' : 'warning'} /><EuiBadge color={item.status === 'enabled' ? 'success' : item.status === 'error' ? 'danger' : 'warning'}>{item.status}</EuiBadge></div>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Delivery and ingestion health</h2></EuiTitle>
          {data.deliveries.map((delivery) => <div className="itsmHealthRow" key={delivery.id}><span><strong>{delivery.recipient}</strong><small>{delivery.id} · attempts {delivery.attempts} · {delivery.lastError?.message ?? 'no recorded error'}</small></span><EuiBadge color={delivery.state === 'failed' || delivery.state === 'partial' ? 'danger' : delivery.state === 'delivered' ? 'success' : 'warning'}>{delivery.state}</EuiBadge></div>)}
          {data.events.map((event) => <div className="itsmHealthRow" key={event.id}><span><strong>{event.subject}</strong><small>{event.messageId} · {event.sender}</small></span><EuiBadge color={event.state === 'failed' || event.state === 'quarantined' ? 'danger' : 'success'}>{event.state}</EuiBadge></div>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Routing, permissions and audit boundary</h2></EuiTitle>
          <EuiCallOut title={`${data.capabilities.permissions.length} capability decisions`} color="primary">Adapter {data.capabilities.adapter}; authoritative {String(data.capabilities.authoritative)}. SMTP, Graph, IMAP and ingestion execution remain backend-owned.</EuiCallOut>
          <EuiSpacer size="s" />
          {data.routes.map((route) => <div className="itsmHealthRow" key={route.id}><span><strong>{route.order}. {route.name}</strong><small>{route.conditions.join(' AND ')} · {route.action}</small></span><EuiBadge color={route.status === 'published' ? 'success' : 'warning'}>{route.status}</EuiBadge></div>)}
        </EuiPanel>
      </div>
    </>}
  </CapabilityShell>;
}
