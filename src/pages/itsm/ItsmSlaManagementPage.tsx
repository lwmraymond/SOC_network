import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiComboBox,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiProgress,
  EuiSelect,
  EuiSpacer,
  EuiStat,
  EuiTitle,
} from '@elastic/eui';
import { Link } from 'react-router-dom';
import type { BusinessCalendar, CapabilitySnapshot, EscalationRule, SlaClock, SlaPolicy } from '../../itsm/contracts';
import { itsmApi } from '../../itsm/client';
import { useItsmQuery } from '../../itsm/hooks';
import { CapabilityShell } from '../../itsm/components/CapabilityShell';
import { createDemoMutationContext } from '../../itsm/components/demoContext';
import { GovernedAction } from '../../itsm/components/GovernedAction';
import { ItsmTabs } from '../../itsm/components/ItsmTabs';

type SlaData = {
  policies: SlaPolicy[];
  calendars: BusinessCalendar[];
  escalations: EscalationRule[];
  clocks: SlaClock[];
  capabilities: CapabilitySnapshot;
};

const slaTabs = ['Policies', 'Calendars', 'Escalations', 'Clock monitor'] as const;

export default function ItsmSlaManagementPage() {
  const query = useItsmQuery<SlaData>(async (signal) => {
    const [policies, calendars, escalations, clocks, capabilities] = await Promise.all([
      itsmApi.listSlaPolicies({}, signal),
      itsmApi.listBusinessCalendars({}, signal),
      itsmApi.listEscalationRules({}, signal),
      itsmApi.listSlaClocks({}, signal),
      itsmApi.getCapabilities(signal),
    ]);
    return { policies: policies.items, calendars: calendars.items, escalations: escalations.items, clocks: clocks.items, capabilities };
  }, []);
  const [tab, setTab] = useState('Policies');
  const [selectedId, setSelectedId] = useState('sla-p1-response');
  const data = query.data;
  const selected = data?.policies.find((item) => item.id === selectedId) ?? data?.policies[0];
  const summary = useMemo(() => {
    if (!data) return undefined;
    return {
      published: data.policies.filter((item) => item.status === 'published').length,
      drafts: data.policies.filter((item) => item.status === 'draft').length,
      breached: data.clocks.filter((item) => item.state === 'breached').length,
      running: data.clocks.filter((item) => item.state === 'running').length,
      covered: new Set(data.escalations.map((item) => item.policyId)).size,
    };
  }, [data]);

  return <CapabilityShell
    title="SLA administration"
    description="Policies, business calendars, escalation thresholds and authoritative clock monitoring."
    queryState={query.state}
    errorMessage={query.error?.message}
    management
    rightSideItems={[<EuiButtonEmpty key="settings" href="/itsm/settings">Back to ITSM settings</EuiButtonEmpty>]}
  >
    {data && summary && <>
      <EuiFlexGroup gutterSize="m" wrap className="itsmKpiStrip" data-management-summary="sla">
        {[
          ['Published policies', summary.published],
          ['Draft revisions', summary.drafts],
          ['Running clocks', summary.running],
          ['Breached clocks', summary.breached],
          ['Escalated policies', `${summary.covered}/${data.policies.length}`],
        ].map(([label, value]) => <EuiFlexItem key={String(label)}><EuiPanel paddingSize="m" hasBorder><EuiStat title={String(value)} description={String(label)} titleSize="s" /></EuiPanel></EuiFlexItem>)}
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiPanel paddingSize="none" hasBorder><ItsmTabs items={slaTabs} active={tab} onChange={setTab} /></EuiPanel>
      <EuiSpacer size="m" />

      {tab === 'Policies' && selected && <div className="itsmAdminGrid itsmPrimaryAdminGrid">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="s"><h2>SLA policies</h2></EuiTitle><EuiSpacer size="s" />
          {data.policies.map((policy) => <button type="button" className={`itsmResourceButton ${policy.id === selected.id ? 'selected' : ''}`} key={policy.id} onClick={() => setSelectedId(policy.id)}>
            <span><strong>{policy.name}</strong><small>{policy.appliesTo.join(', ')} · {policy.priority.join(', ')} · {policy.targetMinutes}m</small></span>
            <EuiBadge color={policy.status === 'published' ? 'success' : 'warning'}>{policy.status}</EuiBadge>
          </button>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.name}</h2></EuiTitle><small>{selected.id} · revision {selected.version} · {selected.etag}</small></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selected.status === 'published' ? 'success' : 'warning'}>{selected.status}</EuiBadge></EuiFlexItem></EuiFlexGroup>
          <EuiSpacer size="m" />
          <div className="itsmFormGrid">
            <EuiFormRow label="Target minutes"><EuiFieldNumber value={selected.targetMinutes} readOnly /></EuiFormRow>
            <EuiFormRow label="Calendar"><EuiSelect value={selected.calendarId} onChange={() => undefined} options={data.calendars.map((calendar) => ({ value: calendar.id, text: `${calendar.name} · ${calendar.timezone}` }))} /></EuiFormRow>
            <EuiFormRow label="Applies to"><EuiComboBox isDisabled selectedOptions={selected.appliesTo.map((value) => ({ label: value }))} options={['request', 'incident', 'problem', 'change'].map((label) => ({ label }))} /></EuiFormRow>
            <EuiFormRow label="Priority"><EuiComboBox isDisabled selectedOptions={selected.priority.map((value) => ({ label: value }))} options={['P1', 'P2', 'P3', 'P4'].map((label) => ({ label }))} /></EuiFormRow>
          </div>
          <EuiFormRow label="Start / pause / resume / stop conditions"><EuiCodeBlock language="json" paddingSize="s">{JSON.stringify({ start: selected.start, pause: selected.pause, resume: selected.resume, stop: selected.stop }, null, 2)}</EuiCodeBlock></EuiFormRow>
          <GovernedAction
            label="Review and queue policy draft"
            fill
            preview={(signal) => itsmApi.previewSlaPolicy(selected, signal)}
            execute={async (signal) => {
              const result = await itsmApi.saveSlaPolicy(selected, createDemoMutationContext(selected.etag, selected.version), signal);
              return { receipt: result.receipt };
            }}
            rehydrate={async (_receipt, signal) => (await itsmApi.listSlaPolicies({}, signal)).items}
          />
        </EuiPanel>
      </div>}

      {tab === 'Calendars' && <div className="itsmCardGrid">{data.calendars.map((calendar) => <EuiPanel paddingSize="m" hasBorder key={calendar.id}><EuiTitle size="xs"><h2>{calendar.name}</h2></EuiTitle><p>{calendar.timezone} · {calendar.status}</p><p>{calendar.businessHours.length} weekly windows · {calendar.holidays.length} holidays</p><EuiBadge color="hollow">revision {calendar.version}</EuiBadge></EuiPanel>)}</div>}
      {tab === 'Escalations' && <EuiPanel paddingSize="m" hasBorder><table><thead><tr><th>Rule</th><th>Policy</th><th>Threshold</th><th>Actions</th><th>Status</th></tr></thead><tbody>{data.escalations.map((rule) => <tr key={rule.id}><td>{rule.name}</td><td>{rule.policyId}</td><td>{rule.thresholdPercent}%</td><td>{rule.actions.map((action) => `${action.type}:${action.target}`).join(', ')}</td><td><EuiBadge color={rule.status === 'published' ? 'success' : 'warning'}>{rule.status}</EuiBadge></td></tr>)}</tbody></table></EuiPanel>}
      {tab === 'Clock monitor' && <EuiPanel paddingSize="m" hasBorder><table><thead><tr><th>Ticket</th><th>Policy</th><th>State</th><th>Due / breach</th><th>Authoritative watermark</th></tr></thead><tbody>{data.clocks.map((clock) => <tr key={clock.id}><td><Link to={`/itsm/tickets/${clock.ticketId}?returnTo=%2Fitsm%2Fsla&parentLabel=SLA+administration`}>{clock.ticketId}</Link></td><td>{clock.policyId}</td><td><EuiBadge color={clock.state === 'breached' ? 'danger' : clock.state === 'running' ? 'warning' : 'success'}>{clock.state}</EuiBadge></td><td>{clock.breachAt ?? clock.dueAt ?? '—'}</td><td>{clock.authoritativeAt}</td></tr>)}</tbody></table></EuiPanel>}

      <EuiSpacer size="m" />
      <div className="itsmManagementSecondary" data-management-secondary="sla">
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Clock and breach health</h2></EuiTitle>
          {data.clocks.map((clock) => <div className="itsmHealthRow" key={clock.id}><span><strong>{clock.policyId}</strong><small>{clock.ticketId} · {clock.state}</small></span><EuiProgress value={clock.state === 'breached' ? 100 : Math.min(95, Math.round((clock.elapsedSeconds / Math.max(clock.elapsedSeconds + (clock.remainingSeconds ?? 0), 1)) * 100))} max={100} size="s" color={clock.state === 'breached' ? 'danger' : 'warning'} /><EuiBadge color={clock.state === 'breached' ? 'danger' : 'warning'}>{clock.state}</EuiBadge></div>)}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Escalation coverage</h2></EuiTitle>
          {data.policies.map((policy) => {
            const rules = data.escalations.filter((item) => item.policyId === policy.id);
            return <div className="itsmHealthRow" key={policy.id}><span><strong>{policy.name}</strong><small>{rules.length ? rules.map((rule) => `${rule.thresholdPercent}%`).join(', ') : 'No escalation threshold'}</small></span><EuiBadge color={rules.length ? 'success' : 'warning'}>{rules.length ? 'Covered' : 'Review'}</EuiBadge></div>;
          })}
        </EuiPanel>
        <EuiPanel paddingSize="m" hasBorder>
          <EuiTitle size="xs"><h2>Release and permission integrity</h2></EuiTitle>
          <EuiCallOut title={`${data.capabilities.permissions.length} capability decisions`} color="primary">Adapter {data.capabilities.adapter}; authoritative {String(data.capabilities.authoritative)}. Policy publication, scheduler activation and clock calculation remain separate backend responsibilities.</EuiCallOut>
          <EuiSpacer size="s" />
          {data.policies.map((policy) => <div className="itsmHealthRow" key={policy.id}><span><strong>{policy.name}</strong><small>revision {policy.version} · calendar {policy.calendarId}</small></span><EuiBadge color={policy.status === 'published' ? 'success' : 'warning'}>{policy.status}</EuiBadge></div>)}
        </EuiPanel>
      </div>
    </>}
  </CapabilityShell>;
}
