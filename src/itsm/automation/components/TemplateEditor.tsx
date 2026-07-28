import { useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiCallOut,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { ManagedAutomationTemplate } from '../contracts';
import { dependencyHealthColor, templateStatusColor } from '../model';

export function TemplateEditor({ template, onChanged }: { template: ManagedAutomationTemplate; onChanged: (template: ManagedAutomationTemplate) => void }) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [category, setCategory] = useState(template.category);
  const [owner, setOwner] = useState(template.owner);
  const [tags, setTags] = useState(template.tags.map((label) => ({ label })));

  useEffect(() => {
    setName(template.name);
    setDescription(template.description);
    setCategory(template.category);
    setOwner(template.owner);
    setTags(template.tags.map((label) => ({ label })));
  }, [template]);

  const editable = template.status === 'draft' || template.status === 'validating';
  const action = {
    action: 'save_metadata' as const,
    templateId: template.id,
    patch: { name, description, category, owner, tags: tags.map((item) => item.label) },
  };

  return <div className="itsmAutomationEditorGrid">
    <EuiPanel paddingSize="m" hasBorder>
      <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
        <EuiFlexItem><EuiTitle size="s"><h2>Template metadata</h2></EuiTitle></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color={templateStatusColor(template.status)}>{template.status}</EuiBadge></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color={dependencyHealthColor(template.dependencyHealth)}>{template.dependencyHealth}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="itsmFormGrid">
        <EuiFormRow label="Name"><EuiFieldText value={name} disabled={!editable} onChange={(event) => setName(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Category"><EuiFieldText value={category} disabled={!editable} onChange={(event) => setCategory(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Owner"><EuiFieldText value={owner} disabled={!editable} onChange={(event) => setOwner(event.target.value)} /></EuiFormRow>
        <EuiFormRow label="Tags"><EuiComboBox selectedOptions={tags} isDisabled={!editable} onChange={setTags} onCreateOption={(label) => setTags((current) => [...current, { label }])} /></EuiFormRow>
      </div>
      <EuiFormRow label="Description"><EuiTextArea rows={6} value={description} disabled={!editable} onChange={(event) => setDescription(event.target.value)} /></EuiFormRow>
      <EuiSpacer />
      {!editable && <><EuiCallOut title="Draft version required" color="warning">Create a draft version before editing published, deprecated or archived metadata.</EuiCallOut><EuiSpacer size="m" /></>}
      <GovernedAction label="Review metadata draft" fill isDisabled={!editable} preview={(signal) => automationTemplateApi.previewTemplateAction(action, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction(action, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} />
    </EuiPanel>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Permissions &amp; dependencies</h2></EuiTitle>
      <EuiSpacer size="s" />
      {template.permissions.map((permission) => <div className="itsmCapabilityRow" key={permission.capability}><span><strong>{permission.capability}</strong><small>{permission.reason ?? permission.obligations?.join(', ') ?? 'No additional obligation'}</small></span><EuiBadge color={permission.decision === 'allow' ? 'success' : permission.decision === 'deny' ? 'danger' : 'warning'}>{permission.decision}</EuiBadge></div>)}
      <EuiSpacer />
      <EuiCallOut title={`Dependency health: ${template.dependencyHealth}`} color={template.dependencyHealth === 'blocked' ? 'danger' : template.dependencyHealth === 'degraded' ? 'warning' : 'primary'}>
        {template.dependencySummary ?? 'No dependency finding is available.'}
      </EuiCallOut>
      <EuiSpacer />
      <dl className="itsmDefinitionGrid">
        <div><dt>Version</dt><dd>{template.version}</dd></div>
        <div><dt>ETag</dt><dd>{template.etag ?? 'Unavailable'}</dd></div>
        <div><dt>Latest version</dt><dd>{template.latestVersionId}</dd></div>
        <div><dt>Published version</dt><dd>{template.publishedVersionId ?? 'Not published'}</dd></div>
        <div><dt>Updated</dt><dd>{template.updatedAt}</dd></div>
        <div><dt>Authoritative</dt><dd>{String(template.authoritative)}</dd></div>
      </dl>
    </EuiPanel>
  </div>;
}
