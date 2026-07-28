import { useEffect, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { AutomationSchema, AutomationSchemaField, AutomationSchemaFieldType, ManagedAutomationTemplate } from '../contracts';

const fieldTypes: AutomationSchemaFieldType[] = ['string','number','boolean','object','array','datetime','reference','secret'];

function SchemaFields({ title, schema, editable, onChange }: { title: string; schema: AutomationSchema; editable: boolean; onChange: (schema: AutomationSchema) => void }) {
  const updateField = (id: string, patch: Partial<AutomationSchemaField>) => onChange({ ...schema, fields: schema.fields.map((field) => field.id === id ? { ...field, ...patch } : field) });
  const removeField = (id: string) => onChange({ ...schema, fields: schema.fields.filter((field) => field.id !== id) });
  const addField = () => {
    const id = `field-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onChange({ ...schema, fields: [...schema.fields, { id, name: `field${schema.fields.length + 1}`, label: `Field ${schema.fields.length + 1}`, type: 'string', required: false, secret: false, reference: false }] });
  };

  return <EuiPanel paddingSize="m" hasBorder>
    <EuiFlexGroup alignItems="center" gutterSize="s"><EuiFlexItem><EuiTitle size="s"><h2>{title}</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{schema.fields.length} fields</EuiBadge></EuiFlexItem><EuiFlexItem grow={false}><EuiButton size="s" isDisabled={!editable} onClick={addField}>Add field</EuiButton></EuiFlexItem></EuiFlexGroup>
    <EuiSpacer size="m" />
    <div className="itsmSchemaTable" role="table" aria-label={`${title} schema fields`}>
      <div className="itsmSchemaHeader" role="row"><span>Name / label</span><span>Type</span><span>Default / validation</span><span>Flags</span><span>Action</span></div>
      {schema.fields.map((field) => <div className="itsmSchemaRow" role="row" key={field.id}>
        <div><EuiFieldText compressed disabled={!editable} aria-label={`${field.name} field name`} value={field.name} onChange={(event) => updateField(field.id, { name: event.target.value })} /><EuiFieldText compressed disabled={!editable} aria-label={`${field.name} field label`} value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} /></div>
        <EuiSelect compressed disabled={!editable} aria-label={`${field.name} field type`} value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as AutomationSchemaFieldType, secret: event.target.value === 'secret', reference: event.target.value === 'reference' })} options={fieldTypes.map((value) => ({ value, text: value }))} />
        <div><EuiFieldText compressed disabled={!editable || field.secret} aria-label={`${field.name} default value`} placeholder="Default value" value={field.defaultValue === undefined ? '' : String(field.defaultValue)} onChange={(event) => updateField(field.id, { defaultValue: event.target.value || undefined })} /><EuiFieldText compressed disabled={!editable} aria-label={`${field.name} validation`} placeholder="Validation expression" value={field.validation ?? ''} onChange={(event) => updateField(field.id, { validation: event.target.value || undefined })} />{field.reference && <EuiFieldText compressed disabled={!editable} aria-label={`${field.name} reference type`} placeholder="Reference type" value={field.referenceType ?? ''} onChange={(event) => updateField(field.id, { referenceType: event.target.value || undefined })} />}</div>
        <div className="itsmSchemaFlags"><EuiSwitch label="Required" disabled={!editable} checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} /><EuiSwitch label="Secret" disabled={!editable} checked={field.secret} onChange={(event) => updateField(field.id, { secret: event.target.checked, reference: event.target.checked ? false : field.reference, type: event.target.checked ? 'secret' : field.type === 'secret' ? 'string' : field.type })} /><EuiSwitch label="Reference" disabled={!editable} checked={field.reference} onChange={(event) => updateField(field.id, { reference: event.target.checked, secret: event.target.checked ? false : field.secret, type: event.target.checked ? 'reference' : field.type === 'reference' ? 'string' : field.type })} /></div>
        <EuiButtonEmpty size="xs" color="danger" isDisabled={!editable} onClick={() => removeField(field.id)}>Remove</EuiButtonEmpty>
      </div>)}
    </div>
    <EuiSpacer size="m" />
    <EuiSwitch label="Allow additional properties" disabled={!editable} checked={schema.additionalProperties} onChange={(event) => onChange({ ...schema, additionalProperties: event.target.checked })} />
  </EuiPanel>;
}

export function SchemaEditor({ template, onChanged }: { template: ManagedAutomationTemplate; onChanged: (template: ManagedAutomationTemplate) => void }) {
  const [inputSchema, setInputSchema] = useState(template.inputSchema);
  const [outputSchema, setOutputSchema] = useState(template.outputSchema);
  useEffect(() => { setInputSchema(template.inputSchema); setOutputSchema(template.outputSchema); }, [template]);
  const editable = template.status === 'draft' || template.status === 'validating';
  const action = { action: 'save_schema' as const, templateId: template.id, inputSchema, outputSchema };
  return <>
    <EuiCallOut title="Typed schema contract">Secret and reference fields carry metadata only. The browser neither stores secrets nor resolves authoritative object references.</EuiCallOut>
    <EuiSpacer size="m" />
    <div className="itsmAutomationTwoColumn"><SchemaFields title="Input schema" schema={inputSchema} editable={editable} onChange={setInputSchema} /><SchemaFields title="Output schema" schema={outputSchema} editable={editable} onChange={setOutputSchema} /></div>
    <EuiSpacer size="m" />
    <GovernedAction label="Review schema draft" fill isDisabled={!editable} preview={(signal) => automationTemplateApi.previewTemplateAction(action, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction(action, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onChanged} />
  </>;
}
