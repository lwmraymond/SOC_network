import { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiCallOut,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { AutomationTemplateVersion, ManagedAutomationTemplate } from '../contracts';

export function VersionPanel({ template, versions, onChanged }: {
  template: ManagedAutomationTemplate;
  versions: AutomationTemplateVersion[];
  onChanged: (template: ManagedAutomationTemplate) => void;
}) {
  const [selectedId, setSelectedId] = useState(versions[0]?.id ?? '');
  useEffect(() => { if (versions.length && !versions.some((item) => item.id === selectedId)) setSelectedId(versions[0].id); }, [selectedId, versions]);
  const selected = useMemo(() => versions.find((version) => version.id === selectedId) ?? versions[0], [selectedId, versions]);
  const published = versions.find((version) => version.id === template.publishedVersionId);
  const diff = selected ? {
    from: published ? { id: published.id, number: published.number, status: published.status, definition: published.definition } : null,
    to: { id: selected.id, number: selected.number, status: selected.status, definition: selected.definition },
  } : null;

  return <div className="itsmVersionWorkspace">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Version lifecycle</h2></EuiTitle><EuiSpacer size="s" />
      {versions.map((version) => <button type="button" className={`itsmResourceButton ${selected?.id === version.id ? 'selected' : ''}`} key={version.id} onClick={() => setSelectedId(version.id)}>
        <span><strong>v{version.number} · {version.releaseNotes}</strong><small>{version.id} · {version.createdBy} · {version.createdAt}</small></span><EuiBadge color={version.status === 'published' ? 'success' : version.status === 'validating' ? 'warning' : version.status === 'archived' ? 'hollow' : 'primary'}>{version.status}</EuiBadge>
      </button>)}
      <EuiSpacer size="m" />
      <GovernedAction label="Create draft version" preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'create_draft_version', templateId: template.id, releaseNotes: 'Draft created from version lifecycle panel.' }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'create_draft_version', templateId: template.id, releaseNotes: 'Draft created from version lifecycle panel.' }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} />
    </EuiPanel>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>{selected ? `Version ${selected.number}` : 'Version detail'}</h2></EuiTitle><EuiSpacer size="s" />
      {selected && <>
        <dl className="itsmDefinitionGrid">
          <div><dt>Version ID</dt><dd>{selected.id}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div>
          <div><dt>ETag</dt><dd>{selected.etag ?? 'Unavailable'}</dd></div><div><dt>Created by</dt><dd>{selected.createdBy}</dd></div>
          <div><dt>Created</dt><dd>{selected.createdAt}</dd></div><div><dt>Published</dt><dd>{selected.publishedAt ?? 'Not published'}</dd></div>
          <div><dt>Release notes</dt><dd>{selected.releaseNotes}</dd></div><div><dt>Authoritative</dt><dd>{String(selected.authoritative)}</dd></div>
        </dl>
        <EuiSpacer size="m" />
        <EuiTitle size="xs"><h3>Validation findings</h3></EuiTitle>
        {selected.validationFindings.length === 0 ? <EuiCallOut title="No validation findings" color="success">The current frontend validation contract has no findings. Backend validation remains authoritative when mapped.</EuiCallOut> : selected.validationFindings.map((finding) => <EuiCallOut key={`${finding.code}-${finding.field ?? ''}`} title={finding.code} color={finding.severity === 'error' ? 'danger' : 'warning'}>{finding.message}</EuiCallOut>)}
        <EuiSpacer size="m" />
        <EuiTitle size="xs"><h3>Version diff</h3></EuiTitle>
        <EuiCodeBlock language="json" paddingSize="s" isCopyable>{JSON.stringify(diff, null, 2)}</EuiCodeBlock>
        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" wrap>
          <EuiFlexItem grow={false}><GovernedAction label="Validate draft" isDisabled={selected.status !== 'draft'} preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'validate_version', templateId: template.id, versionId: selected.id }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'validate_version', templateId: template.id, versionId: selected.id }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} /></EuiFlexItem>
          <EuiFlexItem grow={false}><GovernedAction label="Publish preview" isDisabled={selected.status !== 'validated' || selected.validationFindings.some((finding) => finding.severity === 'error')} fill preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'publish_version', templateId: template.id, versionId: selected.id, releaseNotes: selected.releaseNotes }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'publish_version', templateId: template.id, versionId: selected.id, releaseNotes: selected.releaseNotes }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} /></EuiFlexItem>
          <EuiFlexItem grow={false}><GovernedAction label="Rollback preview" color="warning" isDisabled={selected.status !== 'published' || selected.id === template.publishedVersionId} preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'rollback_version', templateId: template.id, versionId: selected.id, reason: 'Rollback requested from version panel.' }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'rollback_version', templateId: template.id, versionId: selected.id, reason: 'Rollback requested from version panel.' }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} /></EuiFlexItem>
          <EuiFlexItem grow={false}><GovernedAction label="Deprecate" color="warning" isDisabled={template.status === 'deprecated' || template.status === 'archived'} preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'deprecate', templateId: template.id, reason: 'Lifecycle deprecation review.' }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'deprecate', templateId: template.id, reason: 'Lifecycle deprecation review.' }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} /></EuiFlexItem>
          <EuiFlexItem grow={false}><GovernedAction label="Archive" color="danger" isDisabled={template.status === 'archived'} preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'archive', templateId: template.id, reason: 'Lifecycle archive review.' }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'archive', templateId: template.id, reason: 'Lifecycle archive review.' }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} /></EuiFlexItem>
        </EuiFlexGroup>
      </>}
    </EuiPanel>
  </div>;
}
