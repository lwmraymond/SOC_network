import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiPopover,
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
import type { AutomationTemplateAction, ManagedAutomationTemplate } from '../contracts';
import { automationTemplateStatuses, dependencyHealthColor, emptyTemplateFilters, filterTemplates, templateStatusColor, type TemplateFilterState } from '../model';

type RowAction = 'clone' | 'draft' | 'archive';

function TemplateRowActions({ template, onMutated }: { template: ManagedAutomationTemplate; onMutated: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<RowAction>();
  const launch = (action: RowAction) => {
    setMenuOpen(false);
    setActiveAction(action);
  };
  const actionInput: AutomationTemplateAction | undefined = activeAction === 'clone'
    ? { action: 'clone', sourceTemplateId: template.id, name: `${template.name} copy` }
    : activeAction === 'draft'
      ? { action: 'create_draft_version', templateId: template.id, releaseNotes: 'Draft created from Template Library.' }
      : activeAction === 'archive'
        ? { action: 'archive', templateId: template.id, reason: 'Archive requested from Template Library.' }
        : undefined;

  return <>
    <EuiPopover
      button={<EuiButtonEmpty size="xs" iconType="arrowDown" iconSide="right" onClick={() => setMenuOpen((open) => !open)} aria-label={`Open actions for ${template.name}`}>Actions</EuiButtonEmpty>}
      isOpen={menuOpen}
      closePopover={() => setMenuOpen(false)}
      anchorPosition="downRight"
      panelPaddingSize="s"
    >
      <div className="itsmAutomationActionMenu" role="menu" aria-label={`${template.name} actions`}>
        <EuiButtonEmpty size="s" flush="left" onClick={() => launch('clone')}>Clone</EuiButtonEmpty>
        <EuiButtonEmpty size="s" flush="left" isDisabled={template.status === 'archived'} onClick={() => launch('draft')}>Create draft version</EuiButtonEmpty>
        <EuiButtonEmpty size="s" flush="left" color="warning" isDisabled={template.status === 'archived'} onClick={() => launch('archive')}>Archive preview</EuiButtonEmpty>
      </div>
    </EuiPopover>
    {actionInput && <GovernedAction
      label={activeAction === 'clone' ? 'Clone' : activeAction === 'draft' ? 'Create draft version' : 'Archive preview'}
      color={activeAction === 'archive' ? 'warning' : 'primary'}
      autoOpen
      preview={(signal) => automationTemplateApi.previewTemplateAction(actionInput, signal)}
      execute={(signal) => automationTemplateApi.executeTemplateAction(actionInput, createDemoMutationContext(template.etag, template.version), signal)}
      rehydrate={(receipt, signal) => automationTemplateApi.refreshTemplate(template.id, receipt.receiptId, signal)}
      onComplete={onMutated}
      onClose={() => setActiveAction(undefined)}
    />}
  </>;
}

export function TemplateLibrary({ templates, onOpen, onMutated }: {
  templates: ManagedAutomationTemplate[];
  onOpen: (templateId: string) => void;
  onMutated: () => void;
}) {
  const [filters, setFilters] = useState<TemplateFilterState>(emptyTemplateFilters);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const visible = useMemo(() => filterTemplates(templates, filters), [filters, templates]);
  const categories = useMemo(() => [...new Set(templates.map((item) => item.category))].sort(), [templates]);
  const owners = useMemo(() => [...new Set(templates.map((item) => item.owner))].sort(), [templates]);
  const setFilter = (key: keyof TemplateFilterState, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const advancedFilterCount = [filters.owner, filters.dependencyHealth, filters.publishedVersion, filters.updated].filter(Boolean).length;
  const hasFilters = Object.values(filters).some(Boolean);

  return <>
    <EuiPanel paddingSize="m" hasBorder>
      <EuiTitle size="s"><h2>Template library</h2></EuiTitle>
      <EuiText size="s" color="subdued"><p>Search and filter reusable ITSM automation definitions. Archived templates stay auditable but are excluded from normal rule creation.</p></EuiText>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s" wrap alignItems="center" className="itsmAutomationLibraryToolbar">
        <EuiFlexItem className="itsmAutomationPrimarySearch"><EuiFieldSearch compressed fullWidth aria-label="Search automation templates" placeholder="Name, description, ID or tag" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by category" value={filters.category} onChange={(event) => setFilter('category', event.target.value)} options={[{ value: '', text: 'All categories' }, ...categories.map((value) => ({ value, text: value }))]} /></EuiFlexItem>
        <EuiFlexItem grow={false}><EuiSelect compressed aria-label="Filter by status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)} options={[{ value: '', text: 'All statuses' }, ...automationTemplateStatuses.map((value) => ({ value, text: value }))]} /></EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPopover
            button={<EuiButtonEmpty size="xs" iconType="arrowDown" iconSide="right" onClick={() => setFilterPopoverOpen((open) => !open)}>More filters{advancedFilterCount ? ` (${advancedFilterCount})` : ''}</EuiButtonEmpty>}
            isOpen={filterPopoverOpen}
            closePopover={() => setFilterPopoverOpen(false)}
            anchorPosition="downRight"
          >
            <div className="itsmAutomationFilterPopover">
              <EuiFormRow label="Owner"><EuiSelect compressed aria-label="Filter by owner" value={filters.owner} onChange={(event) => setFilter('owner', event.target.value)} options={[{ value: '', text: 'All owners' }, ...owners.map((value) => ({ value, text: value }))]} /></EuiFormRow>
              <EuiFormRow label="Dependency health"><EuiSelect compressed aria-label="Filter by dependency health" value={filters.dependencyHealth} onChange={(event) => setFilter('dependencyHealth', event.target.value)} options={[{ value: '', text: 'All dependency states' }, ...['healthy','degraded','blocked','unknown'].map((value) => ({ value, text: value }))]} /></EuiFormRow>
              <EuiFormRow label="Publication"><EuiSelect compressed aria-label="Filter by published version" value={filters.publishedVersion} onChange={(event) => setFilter('publishedVersion', event.target.value)} options={[{ value: '', text: 'Any publication state' }, { value: 'published', text: 'Has published version' }, { value: 'unpublished', text: 'No published version' }]} /></EuiFormRow>
              <EuiFormRow label="Updated"><EuiSelect compressed aria-label="Filter by updated time" value={filters.updated} onChange={(event) => setFilter('updated', event.target.value)} options={[{ value: '', text: 'Any updated time' }, { value: '7', text: 'Updated in 7 days' }, { value: '30', text: 'Updated in 30 days' }, { value: '90', text: 'Updated in 90 days' }]} /></EuiFormRow>
            </div>
          </EuiPopover>
        </EuiFlexItem>
        {hasFilters && <EuiFlexItem grow={false}><EuiButtonEmpty size="xs" onClick={() => setFilters(emptyTemplateFilters)}>Clear</EuiButtonEmpty></EuiFlexItem>}
        <EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length} / {templates.length}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
    <EuiSpacer size="m" />
    <EuiPanel paddingSize="none" hasBorder className="itsmAutomationTemplateTablePanel">
      <EuiTable responsiveBreakpoint={false} className="itsmAutomationTemplateTable" aria-label="Automation template library">
        <EuiTableHeader>
          <EuiTableHeaderCell>Template</EuiTableHeaderCell><EuiTableHeaderCell>Category / owner</EuiTableHeaderCell><EuiTableHeaderCell>Status</EuiTableHeaderCell><EuiTableHeaderCell>Dependency</EuiTableHeaderCell><EuiTableHeaderCell>Version</EuiTableHeaderCell><EuiTableHeaderCell>Updated</EuiTableHeaderCell><EuiTableHeaderCell>Actions</EuiTableHeaderCell>
        </EuiTableHeader>
        <EuiTableBody>
          {visible.map((template) => <EuiTableRow key={template.id}>
            <EuiTableRowCell><strong>{template.name}</strong><small>{template.id} · v{template.version}</small><small className="itsmAutomationTemplateDescription">{template.description}</small></EuiTableRowCell>
            <EuiTableRowCell>{template.category}<small>{template.owner}</small></EuiTableRowCell>
            <EuiTableRowCell><EuiBadge color={templateStatusColor(template.status)}>{template.status}</EuiBadge></EuiTableRowCell>
            <EuiTableRowCell><EuiBadge color={dependencyHealthColor(template.dependencyHealth)}>{template.dependencyHealth}</EuiBadge><small>{template.dependencySummary ?? 'No finding'}</small></EuiTableRowCell>
            <EuiTableRowCell>{template.publishedVersionId ?? 'Not published'}<small>latest {template.latestVersionId}</small></EuiTableRowCell>
            <EuiTableRowCell>{new Date(template.updatedAt).toLocaleDateString()}<small>{template.etag ?? 'ETag unavailable'}</small></EuiTableRowCell>
            <EuiTableRowCell><div className="itsmAutomationRowActions"><EuiButtonEmpty size="xs" onClick={() => onOpen(template.id)}>Open</EuiButtonEmpty><TemplateRowActions template={template} onMutated={onMutated} /></div></EuiTableRowCell>
          </EuiTableRow>)}
        </EuiTableBody>
      </EuiTable>
      {visible.length === 0 && <div className="itsmAutomationEmpty"><EuiText color="subdued"><p>No templates match the active filters.</p></EuiText></div>}
    </EuiPanel>
  </>;
}
