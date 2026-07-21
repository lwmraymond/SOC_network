import { useMemo, useState } from 'react';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiFieldSearch,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiHorizontalRule,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import type { PrototypePageFixture } from '../types/prototype';

/*
 * P40 brief / difference contract
 * Archetype: Platform Settings Directory and configuration-impact inspector.
 * Hero: searchable setting directory with deployment scope, source and impact filters.
 * First viewport: category rail, settings inventory, selected setting provenance and plan impact.
 * Primary workflow: inspect effective value → edit override in contextual flyout → validate → review configuration plan.
 * Closest page: P22 ITSM Settings. P40 differs through cross-platform setting discovery, default/managed/custom
 * provenance, dynamic/static apply semantics and configuration-plan review rather than domain resource authoring.
 * Prototype writes create receipts only; no platform setting, secret, restart or deployment plan is actually changed.
 */

type SettingCategory = 'General' | 'Data & indices' | 'Security operations' | 'Alerting' | 'Observability' | 'Advanced';
type SettingScope = 'Project' | 'Deployment' | 'Space';
type ValueSource = 'Default' | 'Custom' | 'Managed';
type ApplyMode = 'Immediate' | 'New sessions' | 'Configuration plan' | 'Rolling restart';
type ChangeEvent = { target: { value: string } };

type PlatformSetting = {
  key: string;
  title: string;
  description: string;
  category: SettingCategory;
  scope: SettingScope;
  source: ValueSource;
  effectiveValue: string;
  defaultValue: string;
  draftValue: string;
  type: 'boolean' | 'number' | 'text' | 'json';
  applyMode: ApplyMode;
  owner: string;
  support: string;
  risk: 'Low' | 'Medium' | 'High';
  dependencies: string[];
  securePrerequisite?: string;
  tags: string[];
};

const settings: PlatformSetting[] = [
  {
    key: 'securitySolution:defaultIndex',
    title: 'Security solution default indices',
    description: 'Index patterns queried by the security solution when no view-specific data source is selected.',
    category: 'Security operations',
    scope: 'Project',
    source: 'Custom',
    effectiveValue: '["logs-*", "alerts-security-*", "-*.monitoring-*"]',
    defaultValue: '["logs-*", "filebeat-*", "winlogbeat-*"]',
    draftValue: '["logs-*", "alerts-security-*", "-*.monitoring-*", "cloud-audit-*"]',
    type: 'json',
    applyMode: 'Immediate',
    owner: 'Security platform',
    support: 'Supported project setting',
    risk: 'High',
    dependencies: ['Detection rules', 'Timeline', 'Event search', 'Case evidence'],
    tags: ['indices', 'security', 'query'],
  },
  {
    key: 'dateFormat:tz',
    title: 'Display time zone',
    description: 'Time zone used to render dates when a page does not provide an explicit zone.',
    category: 'General',
    scope: 'Space',
    source: 'Custom',
    effectiveValue: 'Asia/Taipei',
    defaultValue: 'Browser',
    draftValue: 'Asia/Taipei',
    type: 'text',
    applyMode: 'New sessions',
    owner: 'Platform experience',
    support: 'Supported advanced setting',
    risk: 'Low',
    dependencies: ['Dashboards', 'Investigations', 'Reports'],
    tags: ['locale', 'time', 'display'],
  },
  {
    key: 'notifications:email:defaultConnector',
    title: 'Default email connector',
    description: 'Connector selected by default for platform notification workflows.',
    category: 'Alerting',
    scope: 'Project',
    source: 'Managed',
    effectiveValue: 'connector-managed-primary',
    defaultValue: 'None',
    draftValue: 'connector-managed-primary',
    type: 'text',
    applyMode: 'Immediate',
    owner: 'Platform operations',
    support: 'Managed by connector policy',
    risk: 'Medium',
    dependencies: ['Rule actions', 'ITSM notifications', 'Scheduled reports'],
    tags: ['notification', 'connector', 'managed'],
  },
  {
    key: 'search:timeout',
    title: 'Search request timeout',
    description: 'Maximum duration before an interactive platform search is cancelled.',
    category: 'Data & indices',
    scope: 'Deployment',
    source: 'Default',
    effectiveValue: '30000',
    defaultValue: '30000',
    draftValue: '45000',
    type: 'number',
    applyMode: 'Immediate',
    owner: 'Search platform',
    support: 'Supported dynamic setting',
    risk: 'Medium',
    dependencies: ['Discover', 'Event search', 'Dashboard panels'],
    tags: ['search', 'performance', 'timeout'],
  },
  {
    key: 'xpack.encryptedSavedObjects.encryptionKey',
    title: 'Encrypted saved objects key reference',
    description: 'Secure key reference required by encrypted saved objects and dependent alerting features.',
    category: 'Advanced',
    scope: 'Deployment',
    source: 'Managed',
    effectiveValue: 'secure-ref://platform/eso-primary',
    defaultValue: 'Not configured',
    draftValue: 'secure-ref://platform/eso-rotation-2026q3',
    type: 'text',
    applyMode: 'Rolling restart',
    owner: 'Security engineering',
    support: 'Secure setting; restricted editor',
    risk: 'High',
    dependencies: ['Alerting', 'Actions', 'Cases connectors'],
    securePrerequisite: 'Create and validate the replacement secure reference before standard settings are applied.',
    tags: ['secure', 'encryption', 'restart'],
  },
  {
    key: 'task_manager.max_workers',
    title: 'Task manager workers',
    description: 'Maximum workers available for background tasks on each applicable instance.',
    category: 'Observability',
    scope: 'Deployment',
    source: 'Custom',
    effectiveValue: '10',
    defaultValue: '10',
    draftValue: '14',
    type: 'number',
    applyMode: 'Configuration plan',
    owner: 'Platform SRE',
    support: 'Deployment user setting',
    risk: 'High',
    dependencies: ['Alerting throughput', 'Reporting', 'Maintenance windows'],
    tags: ['capacity', 'tasks', 'plan'],
  },
  {
    key: 'telemetry:allowChangingOptInStatus',
    title: 'Telemetry preference control',
    description: 'Allows authorized administrators to change the platform telemetry preference.',
    category: 'General',
    scope: 'Deployment',
    source: 'Default',
    effectiveValue: 'true',
    defaultValue: 'true',
    draftValue: 'false',
    type: 'boolean',
    applyMode: 'Configuration plan',
    owner: 'Platform governance',
    support: 'Deployment user setting',
    risk: 'Low',
    dependencies: ['Usage collection', 'Privacy review'],
    tags: ['telemetry', 'governance'],
  },
  {
    key: 'observability:enableInspectEsQueries',
    title: 'Inspect observability queries',
    description: 'Exposes query inspection controls to authorized observability users.',
    category: 'Observability',
    scope: 'Space',
    source: 'Custom',
    effectiveValue: 'false',
    defaultValue: 'false',
    draftValue: 'true',
    type: 'boolean',
    applyMode: 'New sessions',
    owner: 'Observability platform',
    support: 'Supported advanced setting',
    risk: 'Medium',
    dependencies: ['APM', 'Infrastructure', 'Logs Explorer'],
    tags: ['inspect', 'queries', 'observability'],
  },
];

const categories: SettingCategory[] = ['General', 'Data & indices', 'Security operations', 'Alerting', 'Observability', 'Advanced'];
const sourceColor = (source: ValueSource): 'success' | 'warning' | 'hollow' => source === 'Custom' ? 'warning' : source === 'Managed' ? 'success' : 'hollow';
const riskColor = (risk: PlatformSetting['risk']): 'danger' | 'warning' | 'success' => risk === 'High' ? 'danger' : risk === 'Medium' ? 'warning' : 'success';

function P40PlatformSettingsDirectoryWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SettingCategory>('Security operations');
  const [scope, setScope] = useState<SettingScope | 'All scopes'>('All scopes');
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [selectedKey, setSelectedKey] = useState(settings[0].key);
  const [editOpen, setEditOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(settings[0].draftValue);
  const [changeReason, setChangeReason] = useState('Align the selected platform behavior with the approved SOC operating model.');
  const [validationState, setValidationState] = useState<'Not run' | 'Passed'>('Not run');
  const [receipt, setReceipt] = useState<string | undefined>(undefined);

  const visible = useMemo(() => settings.filter((setting) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${setting.key} ${setting.title} ${setting.description} ${setting.owner} ${setting.tags.join(' ')}`.toLowerCase().includes(term);
    const matchesCategory = setting.category === category;
    const matchesScope = scope === 'All scopes' || setting.scope === scope;
    const matchesModified = !modifiedOnly || setting.source === 'Custom';
    return matchesQuery && matchesCategory && matchesScope && matchesModified;
  }), [category, modifiedOnly, query, scope]);

  const selected = settings.find((setting) => setting.key === selectedKey) ?? visible[0] ?? settings[0];
  const categoryCounts = useMemo(() => categories.map((item) => ({
    category: item,
    total: settings.filter((setting) => setting.category === item).length,
    modified: settings.filter((setting) => setting.category === item && setting.source === 'Custom').length,
  })), []);
  const impactCounts = {
    custom: settings.filter((setting) => setting.source === 'Custom').length,
    managed: settings.filter((setting) => setting.source === 'Managed').length,
    restart: settings.filter((setting) => setting.applyMode === 'Rolling restart' || setting.applyMode === 'Configuration plan').length,
    highRisk: settings.filter((setting) => setting.risk === 'High').length,
  };

  const selectSetting = (setting: PlatformSetting) => {
    setSelectedKey(setting.key);
    setDraftValue(setting.draftValue);
    setValidationState('Not run');
  };
  const openEditor = () => {
    setDraftValue(selected.draftValue);
    setValidationState('Not run');
    setEditOpen(true);
  };
  const validateDraft = () => {
    setValidationState('Passed');
    setReceipt(`Prototype validation passed for ${selected.key}. Syntax, support boundary and dependency checks were simulated; no setting changed.`);
  };
  const reviewPlan = () => {
    if (validationState !== 'Passed') return;
    setEditOpen(false);
    setPlanOpen(true);
  };
  const queuePlan = () => {
    setReceipt(`Prototype configuration plan queued for ${selected.key}. Effective value remains ${selected.effectiveValue}; no deployment plan, restart or platform mutation occurred.`);
    setPlanOpen(false);
  };

  return <div className="pageComposition differentiatedPage p40SettingsDirectory" data-page-specific-composition="P40-settings-directory-provenance-plan-impact">
    <style>{`
      .p40SettingsDirectory{display:flex;flex-direction:column;gap:24px;min-width:0}.p40SettingsDirectory *{box-sizing:border-box}.p40SettingsDirectory p,.p40SettingsDirectory small,.p40SettingsDirectory td,.p40SettingsDirectory dd{overflow-wrap:anywhere}.p40Hero{display:grid;grid-template-columns:minmax(280px,1.5fr) minmax(170px,.7fr) auto;gap:12px;align-items:end}.p40ImpactStrip{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:1px;padding:0;overflow:hidden}.p40ImpactStrip>div{padding:15px 18px;background:var(--euiColorEmptyShade,#fff)}.p40ImpactStrip strong{display:block;font-size:22px;line-height:1.15}.p40ImpactStrip span{display:block;margin-top:5px}.p40Grid{display:grid;grid-template-columns:minmax(220px,280px) minmax(620px,1.7fr) minmax(330px,1fr);gap:24px;align-items:start;min-width:0}.p40CategoryRail{display:flex;flex-direction:column;gap:8px}.p40CategoryButton{display:grid;grid-template-columns:1fr auto;gap:4px 12px;width:100%;padding:12px;border:1px solid transparent;border-radius:6px;background:transparent;color:inherit;text-align:left}.p40CategoryButton span{font-size:12px}.p40CategoryButton.selected{border-color:var(--euiColorPrimary,#006bb4);background:var(--euiColorLightestShade,#f5f7fa)}.p40ListToolbar{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.p40TableWrap{overflow:auto;max-width:100%}.p40Table{width:100%;min-width:760px;border-collapse:collapse}.p40Table th,.p40Table td{padding:10px 12px;border-bottom:1px solid var(--euiBorderColor,#d3dae6);text-align:left;vertical-align:top}.p40Table th{font-size:12px;text-transform:uppercase;letter-spacing:.04em}.p40Table tr[aria-selected=true]{background:var(--euiColorLightestShade,#f5f7fa)}.p40SettingName{display:grid;gap:4px}.p40SettingName small{color:var(--euiTextSubduedColor,#69707d)}.p40BadgeRow{display:flex;flex-wrap:wrap;gap:6px}.p40Inspector{display:flex;flex-direction:column;gap:16px}.p40ValueCard{padding:12px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px}.p40ValueCard header{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}.p40ValueCard code{display:block;white-space:pre-wrap;overflow-wrap:anywhere}.p40Meta{display:grid;grid-template-columns:1fr auto;gap:9px 16px}.p40Meta dt{font-weight:600}.p40Meta dd{margin:0;text-align:right}.p40DependencyList{display:grid;gap:8px}.p40DependencyList article{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--euiBorderColor,#d3dae6)}.p40FlyoutForm{display:grid;gap:18px}.p40PlanSteps{display:grid;gap:10px}.p40PlanSteps article{display:grid;grid-template-columns:28px 1fr;gap:10px;padding:12px;background:var(--euiColorLightestShade,#f5f7fa);border-left:3px solid var(--euiColorPrimary,#006bb4)}.p40PlanSteps b{display:flex;width:24px;height:24px;border-radius:50%;align-items:center;justify-content:center;background:var(--euiColorEmptyShade,#fff)}@media(max-width:1500px){.p40Grid{grid-template-columns:minmax(220px,270px) 1fr}.p40Inspector{grid-column:1/-1}.p40InspectorContent{display:grid;grid-template-columns:1fr 1fr;gap:20px}}@media(max-width:1000px){.p40Hero{grid-template-columns:1fr 1fr}.p40ImpactStrip{grid-template-columns:repeat(2,1fr)}.p40Grid{grid-template-columns:1fr}.p40InspectorContent{grid-template-columns:1fr}.p40CategoryRail{display:grid;grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.p40Hero{grid-template-columns:1fr}.p40ImpactStrip,.p40CategoryRail{grid-template-columns:1fr}.p40ListToolbar{grid-template-columns:1fr}}
    `}</style>

    <EuiPanel paddingSize="m" hasBorder data-visual-region="settings-directory-search">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem>
          <EuiTitle size="s"><h2>Platform settings directory</h2></EuiTitle>
          <p>Discover effective values, provenance, support boundaries and operational impact before opening an editor.</p>
        </EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">Catalog freshness {fixture.freshness}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="p40Hero">
        <EuiFormRow label="Search settings"><EuiFieldSearch value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Setting key, description, owner or tag" /></EuiFormRow>
        <EuiFormRow label="Scope"><EuiSelect value={scope} onChange={(event: ChangeEvent) => setScope(event.target.value as SettingScope | 'All scopes')} options={['All scopes', 'Project', 'Deployment', 'Space'].map((value) => ({ value, text: value }))} /></EuiFormRow>
        <EuiSwitch checked={modifiedOnly} onChange={() => setModifiedOnly((value) => !value)} label="Custom overrides only" />
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut className="p40Receipt" title="Prototype settings receipt" color="warning">{receipt}</EuiCallOut>}

    <EuiPanel paddingSize="none" hasBorder className="p40ImpactStrip" data-visual-region="settings-governance-summary">
      <div><strong>{impactCounts.custom}</strong><span>Custom overrides</span></div>
      <div><strong>{impactCounts.managed}</strong><span>Policy-managed settings</span></div>
      <div><strong>{impactCounts.restart}</strong><span>Plan or restart impact</span></div>
      <div><strong>{impactCounts.highRisk}</strong><span>High-risk changes</span></div>
    </EuiPanel>

    <div className="p40Grid">
      <EuiPanel paddingSize="m" hasBorder className="p40CategoryRail" data-visual-region="settings-category-directory">
        <EuiTitle size="xs"><h2>Categories</h2></EuiTitle>
        {categoryCounts.map((item) => <button type="button" key={item.category} className={`p40CategoryButton ${category === item.category ? 'selected' : ''}`} onClick={() => setCategory(item.category)}>
          <strong>{item.category}</strong><EuiBadge color={item.modified ? 'warning' : 'hollow'}>{item.total}</EuiBadge>
          <span>{item.modified} custom</span><span>{settings.filter((setting) => setting.category === item.category && setting.risk === 'High').length} high risk</span>
        </button>)}
        <EuiSpacer size="s" />
        <EuiCallOut title="Configuration boundary" size="s">Authentication providers are managed in P41. Theme and accessibility are managed in P42.</EuiCallOut>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder data-visual-region="settings-inventory">
        <div className="p40ListToolbar">
          <div><EuiTitle size="s"><h2>{category}</h2></EuiTitle><small>{visible.length} settings in current scope</small></div>
          <EuiBadge color="hollow">Defaults remain visible</EuiBadge>
        </div>
        <EuiSpacer size="s" />
        {visible.length === 0 ? <EuiCallOut title="No settings match the current filters">Clear the custom-only filter, broaden scope, or choose another category.</EuiCallOut> : <div className="p40TableWrap">
          <table className="p40Table">
            <thead><tr><th>Setting</th><th>Effective value</th><th>Source</th><th>Apply mode</th><th>Risk</th></tr></thead>
            <tbody>{visible.map((setting) => <tr key={setting.key} aria-selected={selected.key === setting.key}>
              <td><div className="p40SettingName"><EuiButtonEmpty size="xs" onClick={() => selectSetting(setting)}>{setting.title}</EuiButtonEmpty><small>{setting.key}</small></div></td>
              <td>{setting.effectiveValue.length > 38 ? `${setting.effectiveValue.slice(0, 38)}…` : setting.effectiveValue}</td>
              <td><EuiBadge color={sourceColor(setting.source)}>{setting.source}</EuiBadge></td>
              <td>{setting.applyMode}</td>
              <td><EuiBadge color={riskColor(setting.risk)}>{setting.risk}</EuiBadge></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder className="p40Inspector" data-visual-region="setting-provenance-impact-inspector">
        <div>
          <div className="p40BadgeRow"><EuiBadge color={sourceColor(selected.source)}>{selected.source}</EuiBadge><EuiBadge color={riskColor(selected.risk)}>{selected.risk} risk</EuiBadge><EuiBadge color="hollow">{selected.scope}</EuiBadge></div>
          <EuiSpacer size="s" />
          <EuiTitle size="s"><h2>{selected.title}</h2></EuiTitle>
          <p>{selected.description}</p>
          <small>{selected.key}</small>
        </div>
        <div className="p40InspectorContent">
          <div>
            <div className="p40ValueCard"><header><strong>Effective value</strong><EuiBadge color={sourceColor(selected.source)}>{selected.source}</EuiBadge></header><code>{selected.effectiveValue}</code></div>
            <EuiSpacer size="s" />
            <div className="p40ValueCard"><header><strong>Default value</strong><EuiBadge color="hollow">Fallback</EuiBadge></header><code>{selected.defaultValue}</code></div>
            <EuiSpacer size="m" />
            <dl className="p40Meta"><dt>Owner</dt><dd>{selected.owner}</dd><dt>Support</dt><dd>{selected.support}</dd><dt>Apply mode</dt><dd>{selected.applyMode}</dd><dt>Value type</dt><dd>{selected.type}</dd></dl>
          </div>
          <div>
            <EuiAccordion id="p40-impact" initialIsOpen buttonContent="Dependencies and operational impact" paddingSize="m">
              <div className="p40DependencyList">{selected.dependencies.map((dependency, index) => <article key={dependency}><span>{dependency}</span><EuiBadge color={index === 0 ? 'warning' : 'hollow'}>{index === 0 ? 'Retest' : 'Review'}</EuiBadge></article>)}</div>
            </EuiAccordion>
            <EuiAccordion id="p40-precedence" buttonContent="Value precedence" paddingSize="m">
              <ol><li>Managed policy, when present</li><li>Project/deployment custom override</li><li>Space-level override</li><li>Product default</li></ol>
            </EuiAccordion>
            {selected.securePrerequisite && <EuiCallOut title="Secure setting prerequisite" color="warning">{selected.securePrerequisite}</EuiCallOut>}
          </div>
        </div>
        <EuiHorizontalRule margin="s" />
        <EuiFlexGroup gutterSize="s" wrap>
          <EuiFlexItem><EuiButton fullWidth onClick={() => setReceipt(`Prototype export created for ${selected.key}. The export contains metadata only and no secret material.`)}>Export metadata</EuiButton></EuiFlexItem>
          <EuiFlexItem><EuiButton fill fullWidth isDisabled={selected.source === 'Managed'} onClick={openEditor}>{selected.source === 'Managed' ? 'Managed by policy' : 'Edit override'}</EuiButton></EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>

    {editOpen && <EuiFlyout onClose={() => setEditOpen(false)} ownFocus size="m" aria-labelledby="p40-editor-title">
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p40-editor-title">Edit setting override</h2></EuiTitle><p>{selected.key}</p></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <div className="p40FlyoutForm">
          <EuiCallOut title="One-setting change set" color="primary">The review isolates this setting so validation failures, impact and rollback remain attributable.</EuiCallOut>
          {selected.securePrerequisite && <EuiCallOut title="Configure secure dependency first" color="warning">{selected.securePrerequisite}</EuiCallOut>}
          <div className="p40ValueCard"><header><strong>Current effective value</strong><EuiBadge color={sourceColor(selected.source)}>{selected.source}</EuiBadge></header><code>{selected.effectiveValue}</code></div>
          <EuiFormRow label="Proposed override" helpText={`Expected ${selected.type} value`}>
            {selected.type === 'json' ? <EuiTextArea value={draftValue} onChange={(event: ChangeEvent) => { setDraftValue(event.target.value); setValidationState('Not run'); }} rows={7} /> : <EuiFieldText value={draftValue} onChange={(event: ChangeEvent) => { setDraftValue(event.target.value); setValidationState('Not run'); }} />}
          </EuiFormRow>
          <EuiFormRow label="Change reason"><EuiTextArea value={changeReason} onChange={(event: ChangeEvent) => setChangeReason(event.target.value)} rows={4} /></EuiFormRow>
          <EuiAccordion id="p40-yaml-preview" buttonContent="Configuration preview" paddingSize="m">
            <EuiCodeBlock language="yaml" paddingSize="s">{`${selected.key}: ${draftValue}`}</EuiCodeBlock>
          </EuiAccordion>
          <EuiCallOut title={`Validation: ${validationState}`} color={validationState === 'Passed' ? 'success' : 'warning'}>{validationState === 'Passed' ? 'Syntax, support boundary, dependencies and permission simulation passed.' : 'Run validation before reviewing the configuration plan.'}</EuiCallOut>
        </div>
      </EuiFlyoutBody>
      <EuiFlyoutFooter><EuiFlexGroup justifyContent="spaceBetween"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setEditOpen(false)}>Cancel</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiFlexGroup gutterSize="s"><EuiFlexItem grow={false}><EuiButton onClick={validateDraft}>Validate</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill isDisabled={validationState !== 'Passed'} onClick={reviewPlan}>Review plan</EuiButton></EuiFlexItem></EuiFlexGroup></EuiFlexItem></EuiFlexGroup></EuiFlyoutFooter>
    </EuiFlyout>}

    {planOpen && <EuiModal onClose={() => setPlanOpen(false)} aria-labelledby="p40-plan-title">
      <EuiModalHeader><EuiModalHeaderTitle id="p40-plan-title">Configuration plan impact</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody>
        <EuiCallOut title="Prototype plan only" color="warning">Queueing this demo plan does not update platform settings, restart services or create an authoritative deployment activity record.</EuiCallOut>
        <EuiSpacer size="m" />
        <div className="p40PlanSteps">
          <article><b>1</b><div><strong>Validate supported setting</strong><small>{selected.support}</small></div></article>
          <article><b>2</b><div><strong>Apply one override</strong><small>{selected.key}: {draftValue}</small></div></article>
          <article><b>3</b><div><strong>{selected.applyMode}</strong><small>Impact owner: {selected.owner}; affected modules: {selected.dependencies.join(', ')}</small></div></article>
          <article><b>4</b><div><strong>Verify and retain rollback</strong><small>Rollback value: {selected.effectiveValue}</small></div></article>
        </div>
        <EuiSpacer size="m" />
        <dl className="p40Meta"><dt>Reason</dt><dd>{changeReason}</dd><dt>Risk</dt><dd>{selected.risk}</dd><dt>Validation</dt><dd>{validationState}</dd><dt>Effective value remains</dt><dd>{selected.effectiveValue}</dd></dl>
      </EuiModalBody>
      <EuiModalFooter><EuiButtonEmpty onClick={() => setPlanOpen(false)}>Back</EuiButtonEmpty><EuiButton fill color={selected.risk === 'High' ? 'warning' : 'primary'} onClick={queuePlan}>Queue prototype plan</EuiButton></EuiModalFooter>
    </EuiModal>}
  </div>;
}

const spec = pageSpecById.P40;
export default function P40PlatformSettingsDirectory() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <P40PlatformSettingsDirectoryWorkspace fixture={page.fixture} />}
  </PageFrame>;
}
