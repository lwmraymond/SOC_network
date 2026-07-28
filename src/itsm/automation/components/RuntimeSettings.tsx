import { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiCallOut,
  EuiFieldNumber,
  EuiFieldText,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { AutomationRuntimeSetting, AutomationRuntimeSettingKey, AutomationRuntimeSettingsSnapshot } from '../contracts';

function SettingControl({ setting, value, onChange }: { setting: AutomationRuntimeSetting; value: AutomationRuntimeSetting['effectiveValue']; onChange: (value: AutomationRuntimeSetting['effectiveValue']) => void }) {
  if (typeof setting.effectiveValue === 'boolean') return <EuiSwitch label={String(value)} checked={Boolean(value)} disabled={!setting.available} onChange={(event) => onChange(event.target.checked)} />;
  if (typeof setting.effectiveValue === 'number') return <EuiFieldNumber compressed aria-label={`${setting.label} value`} value={Number(value)} disabled={!setting.available} onChange={(event) => onChange(Number(event.target.value))} />;
  if (setting.key === 'retry.backoff') return <EuiSelect compressed aria-label={`${setting.label} value`} value={String(value)} disabled={!setting.available} onChange={(event) => onChange(event.target.value)} options={['none','fixed','exponential'].map((option) => ({ value: option, text: option }))} />;
  if (setting.key === 'compensation.defaultPolicy') return <EuiSelect compressed aria-label={`${setting.label} value`} value={String(value)} disabled={!setting.available} onChange={(event) => onChange(event.target.value)} options={['none','best_effort','required','manual'].map((option) => ({ value: option, text: option }))} />;
  return <EuiFieldText compressed aria-label={`${setting.label} value`} value={String(value)} disabled={!setting.available} onChange={(event) => onChange(event.target.value)} />;
}

export function RuntimeSettings({ snapshot, onChanged }: { snapshot: AutomationRuntimeSettingsSnapshot; onChanged: (snapshot: AutomationRuntimeSettingsSnapshot) => void }) {
  const [draft, setDraft] = useState<Partial<Record<AutomationRuntimeSettingKey, AutomationRuntimeSetting['effectiveValue']>>>({});
  useEffect(() => setDraft({}), [snapshot]);
  const changed = useMemo(() => Object.fromEntries(Object.entries(draft).filter(([key, value]) => snapshot.settings.find((setting) => setting.key === key)?.effectiveValue !== value)) as typeof draft, [draft, snapshot.settings]);
  const changedCount = Object.keys(changed).length;

  return <>
    <EuiCallOut title="Execution engine configuration boundary" color="warning">These controls model configuration contracts only. The browser does not restart, redeploy or directly configure an executor. Unmapped fields remain TBD/unavailable.</EuiCallOut>
    <EuiSpacer size="m" />
    <EuiPanel paddingSize="none" hasBorder>
      <EuiTable aria-label="Automation execution runtime settings">
        <EuiTableHeader><EuiTableHeaderCell>Setting</EuiTableHeaderCell><EuiTableHeaderCell>Source</EuiTableHeaderCell><EuiTableHeaderCell>Effective / draft value</EuiTableHeaderCell><EuiTableHeaderCell>Validation</EuiTableHeaderCell><EuiTableHeaderCell>Permission</EuiTableHeaderCell><EuiTableHeaderCell>Apply requirement</EuiTableHeaderCell></EuiTableHeader>
        <EuiTableBody>{snapshot.settings.map((setting) => {
          const value = draft[setting.key] ?? setting.effectiveValue;
          return <EuiTableRow key={setting.key}><EuiTableRowCell><strong>{setting.label}</strong><small>{setting.key}</small><small>{setting.description}</small></EuiTableRowCell><EuiTableRowCell><EuiBadge color={setting.source === 'TBD' ? 'warning' : 'hollow'}>{setting.source}</EuiBadge></EuiTableRowCell><EuiTableRowCell><SettingControl setting={setting} value={value} onChange={(next) => setDraft((current) => ({ ...current, [setting.key]: next }))} /><small>effective: {String(setting.effectiveValue)}</small></EuiTableRowCell><EuiTableRowCell>{setting.validation.length === 0 ? <EuiBadge color="success">valid</EuiBadge> : setting.validation.map((issue) => <span key={issue.code}><EuiBadge color={issue.severity === 'error' ? 'danger' : 'warning'}>{issue.code}</EuiBadge><small>{issue.message}</small></span>)}</EuiTableRowCell><EuiTableRowCell><EuiBadge color={setting.permission.decision === 'allow' ? 'success' : setting.permission.decision === 'unknown' ? 'hollow' : 'warning'}>{setting.permission.decision}</EuiBadge><small>{setting.permission.capability}</small></EuiTableRowCell><EuiTableRowCell><EuiBadge color={setting.requirement === 'none' ? 'success' : setting.requirement === 'TBD' ? 'warning' : 'primary'}>{setting.requirement}</EuiBadge></EuiTableRowCell></EuiTableRow>;
        })}</EuiTableBody>
      </EuiTable>
    </EuiPanel>
    <EuiSpacer size="m" />
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Governed settings change</h2></EuiTitle><EuiSpacer size="s" />
      <dl className="itsmDefinitionGrid"><div><dt>Version</dt><dd>{snapshot.version}</dd></div><div><dt>ETag</dt><dd>{snapshot.etag ?? 'Unavailable'}</dd></div><div><dt>Adapter</dt><dd>{snapshot.adapter}</dd></div><div><dt>Authoritative</dt><dd>{String(snapshot.authoritative)}</dd></div><div><dt>Changed fields</dt><dd>{changedCount}</dd></div></dl>
      <EuiSpacer size="m" />
      <GovernedAction label="Review runtime settings" fill isDisabled={changedCount === 0} preview={(signal) => automationTemplateApi.previewRuntimeSettings(changed, signal)} execute={(signal) => automationTemplateApi.saveRuntimeSettings(changed, createDemoMutationContext(snapshot.etag, snapshot.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshRuntimeSettings(receipt.receiptId, signal)} onComplete={onChanged} />
    </EuiPanel>
  </>;
}
