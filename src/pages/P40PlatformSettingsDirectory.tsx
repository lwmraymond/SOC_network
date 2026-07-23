import { useMemo, useRef, useState } from 'react';
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

const spec = pageSpecById.P40;
type Category = 'All categories' | 'General' | 'Data & indices' | 'Security operations' | 'Alerting' | 'Observability' | 'Advanced';
type Scope = 'Project' | 'Deployment' | 'Space';
type Source = 'Default' | 'Custom' | 'Managed';
type ChangeEvent = { target: { value: string } };
type Setting = { key: string; title: string; description: string; category: Category; scope: Scope; source: Source; effective: string; defaultValue: string; draft: string; apply: string; owner: string; risk: string; dependencies: string[]; secure?: string };

const settings: Setting[] = [
  { key: 'securitySolution:defaultIndex', title: 'Security solution default indices', description: 'Index patterns queried by the security solution when no view-specific source is selected.', category: 'Security operations', scope: 'Project', source: 'Custom', effective: '["logs-*", "alerts-security-*"]', defaultValue: '["logs-*", "filebeat-*"]', draft: '["logs-*", "alerts-security-*", "cloud-audit-*"]', apply: 'Immediate', owner: 'Security platform', risk: 'High', dependencies: ['Detection rules','Timeline','Event search','Case evidence'] },
  { key: 'dateFormat:tz', title: 'Display time zone', description: 'Time zone used to render dates when a page does not provide an explicit zone.', category: 'General', scope: 'Space', source: 'Custom', effective: 'Asia/Taipei', defaultValue: 'Browser', draft: 'Asia/Taipei', apply: 'New sessions', owner: 'Platform experience', risk: 'Low', dependencies: ['Dashboards','Investigations','Reports'] },
  { key: 'notifications:email:defaultConnector', title: 'Default email connector', description: 'Connector selected by default for platform notification workflows.', category: 'Alerting', scope: 'Project', source: 'Managed', effective: 'connector-managed-primary', defaultValue: 'None', draft: 'connector-managed-primary', apply: 'Immediate', owner: 'Platform operations', risk: 'Medium', dependencies: ['Rule actions','ITSM notifications','Scheduled reports'] },
  { key: 'search:timeout', title: 'Search request timeout', description: 'Maximum duration before an interactive platform search is cancelled.', category: 'Data & indices', scope: 'Deployment', source: 'Default', effective: '30000', defaultValue: '30000', draft: '45000', apply: 'Immediate', owner: 'Search platform', risk: 'Medium', dependencies: ['Discover','Event search','Dashboard panels'] },
  { key: 'xpack.encryptedSavedObjects.encryptionKey', title: 'Encrypted saved objects key reference', description: 'Secure key reference required by encrypted saved objects and dependent alerting features.', category: 'Advanced', scope: 'Deployment', source: 'Managed', effective: 'secure-ref://platform/eso-primary', defaultValue: 'Not configured', draft: 'secure-ref://platform/eso-rotation-2026q3', apply: 'Rolling restart', owner: 'Security engineering', risk: 'High', dependencies: ['Alerting','Actions','Cases connectors'], secure: 'Validate the replacement secure reference before applying standard settings.' },
  { key: 'task_manager.max_workers', title: 'Task manager workers', description: 'Maximum workers available for background tasks on each applicable instance.', category: 'Observability', scope: 'Deployment', source: 'Custom', effective: '10', defaultValue: '10', draft: '14', apply: 'Configuration plan', owner: 'Platform SRE', risk: 'High', dependencies: ['Alerting throughput','Reporting','Maintenance windows'] },
];
const categories: Category[] = ['All categories','General','Data & indices','Security operations','Alerting','Observability','Advanced'];
const sourceColor = (source: Source): 'warning' | 'success' | 'hollow' => source === 'Custom' ? 'warning' : source === 'Managed' ? 'success' : 'hollow';

function P40Workspace() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All categories');
  const [scope, setScope] = useState<Scope | 'All scopes'>('All scopes');
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [selectedKey, setSelectedKey] = useState(settings[0].key);
  const [editOpen, setEditOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(settings[0].draft);
  const [reason, setReason] = useState('Align the selected platform behavior with the approved SOC operating model.');
  const [validated, setValidated] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const editOpener = useRef<HTMLButtonElement | null>(null);
  const visible = useMemo(() => settings.filter((setting) => {
    const term = query.trim().toLowerCase();
    return (!term || `${setting.key} ${setting.title} ${setting.description} ${setting.owner}`.toLowerCase().includes(term))
      && (category === 'All categories' || setting.category === category)
      && (scope === 'All scopes' || setting.scope === scope)
      && (!modifiedOnly || setting.source === 'Custom');
  }), [category, modifiedOnly, query, scope]);
  const selected = settings.find((setting) => setting.key === selectedKey) ?? visible[0] ?? settings[0];
  const selectSetting = (setting: Setting) => { setSelectedKey(setting.key); setDraftValue(setting.draft); setValidated(false); };
  const closeEditor = () => { setEditOpen(false); requestAnimationFrame(() => editOpener.current?.focus()); };
  const validate = () => { setValidated(true); setReceipt(`Prototype validation passed for ${selected.key}; syntax, support and dependency checks were simulated.`); };
  const queuePlan = () => { setReceipt(`Prototype configuration plan queued for ${selected.key}. Effective value remains ${selected.effective}; no restart or platform mutation occurred.`); setPlanOpen(false); };

  return <div className="pageComposition differentiatedPage p40Directory" data-page-specific-composition="P40-setting-directory-provenance-plan">
    <style>{`.p40Directory{display:flex;flex-direction:column;gap:24px;min-width:0}.p40Directory *{box-sizing:border-box}.p40Command{display:grid;grid-template-columns:minmax(280px,1fr) minmax(160px,auto) auto;gap:10px;align-items:end}.p40Grid{display:grid;grid-template-columns:minmax(210px,260px) minmax(560px,1.4fr) minmax(300px,.8fr);gap:24px;align-items:start;min-width:0}.p40Categories{display:grid;gap:6px}.p40Categories button{display:flex;justify-content:space-between;width:100%;padding:9px;border:1px solid transparent;border-radius:4px;background:transparent;color:inherit;text-align:left}.p40Categories button[aria-pressed=true]{border-color:var(--euiColorPrimary,#006bb4);background:var(--euiColorLightestShade,#f5f7fa)}.p40TableWrap{overflow:auto}.p40Table{width:100%;min-width:760px;border-collapse:collapse}.p40Table th,.p40Table td{padding:10px;border-bottom:1px solid var(--euiBorderColor,#d3dae6);text-align:left;vertical-align:top}.p40Table small{display:block;margin-top:4px;color:var(--euiTextSubduedColor,#69707d)}.p40Definition{display:grid;gap:8px}.p40Definition>div{display:grid;grid-template-columns:120px 1fr;gap:10px}.p40Definition dd{margin:0}.p40Diff{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p40Diff article{padding:10px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:4px}.p40Diff code{display:block;margin-top:6px;white-space:pre-wrap}@media(max-width:1250px){.p40Grid{grid-template-columns:230px 1fr}.p40Inspector{grid-column:1/-1}}@media(max-width:820px){.p40Command,.p40Grid,.p40Diff{grid-template-columns:1fr}}`}</style>
    <EuiPanel paddingSize="m" hasBorder><div className="p40Command"><EuiFormRow label="Search settings"><EuiFieldSearch value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Setting key, title, owner or dependency" /></EuiFormRow><EuiFormRow label="Scope"><EuiSelect value={scope} onChange={(event: ChangeEvent) => setScope(event.target.value as Scope | 'All scopes')} options={['All scopes','Project','Deployment','Space'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiSwitch checked={modifiedOnly} onChange={() => setModifiedOnly((value) => !value)} label="Custom overrides only" /></div></EuiPanel>
    {receipt && <EuiCallOut title="Prototype settings receipt" color="warning">{receipt}</EuiCallOut>}
    <div className="p40Grid">
      <EuiPanel paddingSize="m" hasBorder><EuiTitle size="s"><h2>Settings categories</h2></EuiTitle><EuiSpacer size="s" /><div className="p40Categories">{categories.map((item) => <button type="button" aria-pressed={category === item} key={item} onClick={() => setCategory(item)}><span>{item}</span><span>{item === 'All categories' ? settings.length : settings.filter((setting) => setting.category === item).length}</span></button>)}</div></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{category}</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visible.length} settings</EuiBadge></EuiFlexItem></EuiFlexGroup><div className="p40TableWrap"><table className="p40Table"><thead><tr><th>Setting</th><th>Scope</th><th>Source</th><th>Effective value</th><th>Apply mode</th><th>Risk</th></tr></thead><tbody>{visible.map((setting) => <tr key={setting.key}><td><EuiButtonEmpty size="xs" onClick={() => selectSetting(setting)}>{setting.title}</EuiButtonEmpty><small>{setting.key}</small></td><td>{setting.scope}</td><td><EuiBadge color={sourceColor(setting.source)}>{setting.source}</EuiBadge></td><td>{setting.effective}</td><td>{setting.apply}</td><td>{setting.risk}</td></tr>)}</tbody></table></div>{visible.length === 0 && <EuiCallOut title="No settings match">Choose another category or clear one filter.</EuiCallOut>}</EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p40Inspector"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>{selected.title}</h2></EuiTitle><p>{selected.key}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={sourceColor(selected.source)}>{selected.source}</EuiBadge></EuiFlexItem></EuiFlexGroup><p>{selected.description}</p><dl className="p40Definition"><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Scope</dt><dd>{selected.scope}</dd></div><div><dt>Apply mode</dt><dd>{selected.apply}</dd></div><div><dt>Risk</dt><dd>{selected.risk}</dd></div></dl><EuiAccordion id={`p40-deps-${selected.key}`} buttonContent="Dependencies and precedence" paddingSize="s"><ul>{selected.dependencies.map((item) => <li key={item}>{item}</li>)}</ul><p>Managed value → custom override → default fallback.</p></EuiAccordion><EuiSpacer /><EuiButton buttonRef={editOpener} fill isDisabled={selected.source === 'Managed'} onClick={() => setEditOpen(true)}>Edit override</EuiButton>{selected.source === 'Managed' && <EuiCallOut title="Managed setting" size="s">This value must be changed in its controlling policy.</EuiCallOut>}</EuiPanel>
    </div>
    {editOpen && <EuiFlyout onClose={closeEditor} ownFocus size="m" aria-labelledby="p40-edit-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p40-edit-title">Edit setting override</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody>{selected.secure && <EuiCallOut title="Configure secure dependency first" color="warning">{selected.secure}</EuiCallOut>}<EuiFormRow label="Setting"><EuiFieldText value={selected.key} readOnly /></EuiFormRow><EuiFormRow label="Draft value"><EuiTextArea value={draftValue} onChange={(event: ChangeEvent) => { setDraftValue(event.target.value); setValidated(false); }} rows={4} /></EuiFormRow><EuiFormRow label="Change reason"><EuiTextArea value={reason} onChange={(event: ChangeEvent) => setReason(event.target.value)} rows={3} /></EuiFormRow><div className="p40Diff"><article><strong>Effective</strong><code>{selected.effective}</code></article><article><strong>Draft</strong><code>{draftValue}</code></article></div><EuiAccordion id="p40-preview" buttonContent="Configuration preview" paddingSize="s"><EuiCodeBlock language="yaml" paddingSize="s">{`${selected.key}: ${draftValue}`}</EuiCodeBlock></EuiAccordion><EuiSpacer /><EuiCallOut title={validated ? 'Validation passed' : 'Validation required'} color={validated ? 'success' : 'warning'}>Review support boundary, syntax and dependent features before creating a plan.</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={closeEditor}>Cancel</EuiButtonEmpty><EuiButton onClick={validate}>Validate</EuiButton><EuiButton fill isDisabled={!validated} onClick={() => { closeEditor(); setPlanOpen(true); }}>Review plan</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {planOpen && <EuiModal onClose={() => setPlanOpen(false)} aria-labelledby="p40-plan-title"><EuiModalHeader><EuiModalHeaderTitle id="p40-plan-title">Configuration plan impact</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype plan only" color="warning">No setting, secure value, deployment plan or restart is changed.</EuiCallOut><ul><li>Setting: {selected.key}</li><li>Apply mode: {selected.apply}</li><li>Dependencies: {selected.dependencies.join(', ')}</li><li>Rollback value: {selected.effective}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setPlanOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queuePlan}>Queue plan</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}

export default function P40PlatformSettingsDirectory() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>{page.fixture && <P40Workspace />}</PageFrame>;
}
