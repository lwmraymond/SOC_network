import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { GovernedAction } from '../../components/GovernedAction';
import { createDemoMutationContext } from '../../components/demoContext';
import { automationTemplateApi } from '../api';
import type { ManagedAutomationTemplate } from '../contracts';
import { automationTemplateStatuses, dependencyHealthColor, emptyTemplateFilters, filterTemplates, templateStatusColor, type TemplateFilterState } from '../model';

export function TemplateLibrary({ templates, onOpen, onMutated }: {
  templates: ManagedAutomationTemplate[];
  onOpen: (templateId: string) => void;
  onMutated: () => void;
}) {
  const [filters, setFilters] = useState<TemplateFilterState>(emptyTemplateFilters);
  const visible = useMemo(() => filterTemplates(templates, filters), [filters, templates]);
  const categories = useMemo(() => [...new Set(templates.map((item) => item.category))].sort(), [templates]);
  const owners = useMemo(() => [...new Set(templates.map((item) => item.owner))].sort(), [templates]);
  const setFilter = (key: keyof TemplateFilterState, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  return <>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Template library</h2></EuiTitle>
      <EuiText size="s" color="subdued"><p>Search and filter reusable ITSM automation definitions. Archived templates stay auditable but are excluded from normal rule creation.</p></EuiText>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s" wrap alignItems="flexEnd">
        <EuiFlexItem style={{ minWidth: 280 }}><EuiFieldSearch compressed fullWidth aria-label="Search automation templates" placeholder="Name, description, ID or tag" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by category" value={filters.category} onChange={(event) => setFilter('category', event.target.value)} options={[{ value: '', text: 'All categories' }, ...categories.map((value) => ({ value, text: value }))]} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)} options={[{ value: '', text: 'All statuses' }, ...automationTemplateStatuses.map((value) => ({ value, text: value }))]} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by owner" value={filters.owner} onChange={(event) => setFilter('owner', event.target.value)} options={[{ value: '', text: 'All owners' }, ...owners.map((value) => ({ value, text: value }))]} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by dependency health" value={filters.dependencyHealth} onChange={(event) => setFilter('dependencyHealth', event.target.value)} options={[{ value: '', text: 'All dependency states' }, ...['healthy','degraded','blocked','unknown'].map((value) => ({ value, text: value }))]} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by published version" value={filters.publishedVersion} onChange={(event) => setFilter('publishedVersion', event.target.value)} options={[{ value: '', text: 'Any publication state' }, { value: 'published', text: 'Has published version' }, { value: 'unpublished', text: 'No published version' }]} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by updated time" value={filters.updated} onChange={(event) => setFilter('updated', event.target.value)} options={[{ value: '', text: 'Any updated time' }, { value: '7', text: 'Updated in 7 days' }, { value: '30', text: 'Updated in 30 days' }, { value: '90', text: 'Updated in 90 days' }]} /></EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
    <EuiSpacer size="m" />
    <EuiPanel paddingSize="none" hasBorder>
      <EuiTable aria-label="Automation template library">
        <EuiTableHeader>
          <EuiTableHeaderCell>Template</EuiTableHeaderCell><EuiTableHeaderCell>Category / owner</EuiTableHeaderCell><EuiTableHeaderCell>Status</EuiTableHeaderCell><EuiTableHeaderCell>Dependency health</EuiTableHeaderCell><EuiTableHeaderCell>Published version</EuiTableHeaderCell><EuiTableHeaderCell>Updated</EuiTableHeaderCell><EuiTableHeaderCell>Actions</EuiTableHeaderCell>
        </EuiTableHeader>
        <EuiTableBody>
          {visible.map((template) => <EuiTableRow key={template.id}>
            <EuiTableRowCell><strong>{template.name}</strong><small>{template.id} · v{template.version}</small><small>{template.description}</small></EuiTableRowCell>
            <EuiTableRowCell>{template.category}<small>{template.owner}</small></EuiTableRowCell>
            <EuiTableRowCell><EuiBadge color={templateStatusColor(template.status)}>{template.status}</EuiBadge></EuiTableRowCell>
            <EuiTableRowCell><EuiBadge color={dependencyHealthColor(template.dependencyHealth)}>{template.dependencyHealth}</EuiBadge><small>{template.dependencySummary ?? 'No dependency finding'}</small></EuiTableRowCell>
            <EuiTableRowCell>{template.publishedVersionId ?? 'Not published'}<small>latest {template.latestVersionId}</small></EuiTableRowCell>
            <EuiTableRowCell>{new Date(template.updatedAt).toLocaleString()}<small>{template.etag ?? 'ETag unavailable'}</small></EuiTableRowCell>
            <EuiTableRowCell>
              <div className="itsmAutomationRowActions">
                <EuiButtonEmpty size="xs" onClick={() => onOpen(template.id)}>Open</EuiButtonEmpty>
                <GovernedAction label="Clone" preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'clone', sourceTemplateId: template.id, name: `${template.name} copy` }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'clone', sourceTemplateId: template.id, name: `${template.name} copy` }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={async (receipt, signal) => automationTemplateApi.refreshTemplate(receipt.requestId ?? template.id, receipt.receiptId, signal)} onComplete={onMutated} />
                <GovernedAction label="Create draft" isDisabled={template.status === 'archived'} preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'create_draft_version', templateId: template.id, releaseNotes: 'Draft created from Template Library.' }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'create_draft_version', templateId: template.id, releaseNotes: 'Draft created from Template Library.' }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onMutated} />
                <GovernedAction label="Archive preview" color="warning" isDisabled={template.status === 'archived'} preview={(signal) => automationTemplateApi.previewTemplateAction({ action: 'archive', templateId: template.id, reason: 'Archive requested from Template Library.' }, signal)} execute={(signal) => automationTemplateApi.executeTemplateAction({ action: 'archive', templateId: template.id, reason: 'Archive requested from Template Library.' }, createDemoMutationContext(template.etag, template.version), signal)} rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)} onComplete={onMutated} />
              </div>
            </EuiTableRowCell>
          </EuiTableRow>)}
        </EuiTableBody>
      </EuiTable>
      {visible.length === 0 && <div className="itsmAutomationEmpty"><EuiText color="subdued"><p>No templates match the active filters.</p></EuiText></div>}
    </EuiPanel>
  </>;
}
