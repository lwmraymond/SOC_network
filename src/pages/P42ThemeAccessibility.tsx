import { useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
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
  EuiThemeProvider,
  EuiTitle,
} from '@elastic/eui';
import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { usePlatformTheme } from '../theme';
import './P42ThemeAccessibility.css';

const spec = pageSpecById.P42;
type Stage = 'Preview' | 'Token workbench' | 'Validation';
type ThemeMode = 'Light' | 'Dark' | 'High contrast';
type PreviewCategory = 'Operations page' | 'Form & modal' | 'Data grid' | 'Status palette';
type TokenGroup = 'Color semantics' | 'Typography' | 'Spacing' | 'Radius' | 'Focus' | 'Motion' | 'Data density';
type FindingState = 'Error' | 'Warning' | 'Passed';
type ChangeEvent = { target: { value: string } };
type ThemeRecord = { id: string; name: string; lifecycle: string; scope: string; modes: ThemeMode[]; revision: string; base: string; errors: number; warnings: number; coverage: number; stateCoverage: number; fallback: string; owner: string };
type TokenRecord = { key: string; group: TokenGroup; role: string; published: string; draft: string; usage: string[] };
type Finding = { id: string; state: FindingState; rule: string; component: string; componentState: string; token: string; observed: string; required: string; mode: ThemeMode; viewport: string; suggested: string };

const themes: ThemeRecord[] = [
  { id: 'theme-soc-borealis', name: 'SOC Operations Borealis', lifecycle: 'Published', scope: 'System', modes: ['Light','Dark'], revision: 'r28', base: 'eui-borealis-106', errors: 0, warnings: 2, coverage: 96, stateCoverage: 92, fallback: 'Elastic Borealis default', owner: 'Platform design system' },
  { id: 'theme-soc-next', name: 'SOC Operations Next', lifecycle: 'Draft', scope: 'System', modes: ['Light','Dark','High contrast'], revision: 'r31-draft', base: 'r28', errors: 1, warnings: 3, coverage: 91, stateCoverage: 88, fallback: 'SOC Operations Borealis r28', owner: 'Platform design system' },
  { id: 'theme-incident-hc', name: 'Incident Command High Contrast', lifecycle: 'Validated', scope: 'Tenant', modes: ['High contrast','Dark'], revision: 'r9-validated', base: 'r28', errors: 0, warnings: 0, coverage: 100, stateCoverage: 98, fallback: 'SOC Operations Borealis r28', owner: 'Accessibility review board' },
  { id: 'theme-legacy-brand', name: 'Legacy SOC Brand', lifecycle: 'Retired', scope: 'Tenant', modes: ['Light'], revision: 'r14-retired', base: 'eui-amsterdam-88', errors: 4, warnings: 9, coverage: 63, stateCoverage: 51, fallback: 'SOC Operations Borealis r28', owner: 'Brand operations' },
];
const tokens: TokenRecord[] = [
  { key: 'colors.text', group: 'Color semantics', role: 'Default body text', published: '#1D1E24', draft: '#17181D', usage: ['Page copy','Table cells','Form labels'] },
  { key: 'colors.primary', group: 'Color semantics', role: 'Primary interaction', published: '#0B64DD', draft: '#175CD3', usage: ['Button','Link','Focus support'] },
  { key: 'colors.danger', group: 'Color semantics', role: 'Danger state', published: '#DA3737', draft: '#C92727', usage: ['Critical status','Delete action','Validation error'] },
  { key: 'font.scale.base', group: 'Typography', role: 'Base interface text scale', published: '16px', draft: '16px', usage: ['Body','Form','Table'] },
  { key: 'size.base', group: 'Spacing', role: 'Base spatial unit', published: '16px', draft: '16px', usage: ['Panel padding','Grid gap'] },
  { key: 'border.radius.medium', group: 'Radius', role: 'Standard control radius', published: '6px', draft: '8px', usage: ['Panel','Input','Button'] },
  { key: 'focus.outline', group: 'Focus', role: 'Keyboard focus indicator', published: '2px solid #0B64DD', draft: '3px solid #175CD3', usage: ['Button','Input','Row action'] },
  { key: 'motion.duration.normal', group: 'Motion', role: 'Standard transition duration', published: '200ms', draft: '180ms', usage: ['Flyout','Popover','Selection'] },
  { key: 'density.rowHeight', group: 'Data density', role: 'Default table row', published: '40px', draft: '44px', usage: ['Data grid','Queue'] },
];
const findings: Finding[] = [
  { id: 'A11Y-4201', state: 'Error', rule: 'Text contrast', component: 'EuiBadge', componentState: 'warning / subdued panel', token: 'colors.warningText', observed: '3.1:1', required: '4.5:1', mode: 'Light', viewport: '1920×1080', suggested: 'colors.warningText' },
  { id: 'A11Y-4202', state: 'Warning', rule: 'Focus visibility', component: 'Theme catalog row', componentState: 'keyboard selected', token: 'focus.outline', observed: '2px outline; partially clipped', required: 'Visible around full perimeter', mode: 'Dark', viewport: '1280×720', suggested: 'focus.outline' },
  { id: 'A11Y-4203', state: 'Warning', rule: 'Reduced motion', component: 'Finding flyout', componentState: 'open / close', token: 'motion.duration.normal', observed: 'Translate animation remains', required: 'No translation when reduced motion', mode: 'Dark', viewport: '1440×900', suggested: 'motion.duration.normal' },
  { id: 'A11Y-4204', state: 'Warning', rule: '200% zoom reflow', component: 'Token diff', componentState: 'long semantic value', token: 'size.base', observed: 'Contained horizontal scroll', required: 'No page-level horizontal scroll', mode: 'Light', viewport: '640 CSS px', suggested: 'size.base' },
  { id: 'A11Y-4205', state: 'Passed', rule: 'Accessible name', component: 'Primary action', componentState: 'default / disabled', token: 'N/A', observed: 'Programmatic name present', required: 'Accessible name', mode: 'Light', viewport: '1920×1080', suggested: 'N/A' },
];
const tokenGroups: TokenGroup[] = ['Color semantics','Typography','Spacing','Radius','Focus','Motion','Data density'];
const findingColor = (state: FindingState): 'danger' | 'warning' | 'success' => state === 'Error' ? 'danger' : state === 'Warning' ? 'warning' : 'success';

function P42Workspace() {
  const { mode: platformMode } = usePlatformTheme();
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<ThemeMode | 'All modes'>('All modes');
  const [selectedThemeId, setSelectedThemeId] = useState('theme-soc-next');
  const [stage, setStage] = useState<Stage>('Preview');
  const [previewCategory, setPreviewCategory] = useState<PreviewCategory>('Operations page');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(platformMode);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visibleFocus, setVisibleFocus] = useState(true);
  const [textScale, setTextScale] = useState('100');
  const [selectedGroup, setSelectedGroup] = useState<TokenGroup>('Color semantics');
  const [selectedTokenKey, setSelectedTokenKey] = useState('colors.text');
  const [draftValue, setDraftValue] = useState('#17181D');
  const [reason, setReason] = useState('Improve semantic contrast while preserving the SOC information hierarchy.');
  const [selectedFindingId, setSelectedFindingId] = useState<string>();
  const [publishOpen, setPublishOpen] = useState(false);
  const [validated, setValidated] = useState(false);
  const [receipt, setReceipt] = useState<string>();
  const findingOpener = useRef<HTMLButtonElement | null>(null);
  const visibleThemes = useMemo(() => themes.filter((theme) => (!query.trim() || `${theme.id} ${theme.name} ${theme.owner} ${theme.revision}`.toLowerCase().includes(query.trim().toLowerCase())) && (modeFilter === 'All modes' || theme.modes.includes(modeFilter))), [modeFilter, query]);
  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? visibleThemes[0] ?? themes[0];
  const visibleTokens = tokens.filter((token) => token.group === selectedGroup);
  const selectedToken = tokens.find((token) => token.key === selectedTokenKey) ?? visibleTokens[0] ?? tokens[0];
  const selectedFinding = findings.find((finding) => finding.id === selectedFindingId);
  const selectTheme = (theme: ThemeRecord) => { setSelectedThemeId(theme.id); setStage('Preview'); setValidated(false); };
  const selectToken = (token: TokenRecord) => { setSelectedTokenKey(token.key); setDraftValue(token.draft); };
  const runValidation = () => { setValidated(true); setStage('Validation'); setReceipt(`Prototype validation completed for ${selectedTheme.id}; no theme revision or provider changed.`); };
  const closeFinding = () => { setSelectedFindingId(undefined); requestAnimationFrame(() => findingOpener.current?.focus()); };
  const queuePublish = () => { setReceipt(`Prototype publish receipt queued for ${selectedTheme.id}. Effective theme, assets and personal preferences remain unchanged.`); setPublishOpen(false); };
  const previewStyle = {
    '--p42TextScale': Number(textScale) / 100,
    '--p42Focus': visibleFocus ? '3px solid #175CD3' : 'none',
    backgroundColor: previewMode === 'dark' ? '#07101f' : '#ffffff',
    borderColor: previewMode === 'dark' ? '#2b394f' : '#d3dae6',
    color: previewMode === 'dark' ? '#cad3e2' : '#1d1e24',
  } as CSSProperties;

  return <div className={`pageComposition differentiatedPage p42Theme ${reducedMotion ? 'p42ReducedMotion' : ''}`} data-page-specific-composition="P42-catalog-edit-preview-validation-flow">
    <EuiPanel paddingSize="m" hasBorder data-visual-region="theme-command">
      <div className="p42Command"><EuiFormRow label="Search themes"><EuiFieldSearch value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="Theme, revision or owner" /></EuiFormRow><EuiFormRow label="Supported mode"><EuiSelect value={modeFilter} onChange={(event: ChangeEvent) => setModeFilter(event.target.value as ThemeMode | 'All modes')} options={['All modes','Light','Dark','High contrast'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiButton fill onClick={() => setReceipt('Prototype create-theme workspace initialized from the published revision; no draft was persisted.')}>Create theme</EuiButton></div>
      <div className="p42StatusStrip"><span><strong>{selectedTheme.revision}</strong> selected revision</span><span><strong>{selectedTheme.errors}</strong> errors</span><span><strong>{selectedTheme.warnings}</strong> warnings</span><span><strong>{selectedTheme.fallback}</strong> fallback</span></div>
    </EuiPanel>
    {receipt && <EuiCallOut title="Prototype theme receipt" color="warning">{receipt}</EuiCallOut>}
    <div className="p42Workspace">
      <EuiPanel paddingSize="m" hasBorder className="p42CatalogPane" data-visual-region="theme-catalog"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="s"><h2>Theme catalog</h2></EuiTitle></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color="hollow">{visibleThemes.length}</EuiBadge></EuiFlexItem></EuiFlexGroup><div className="p42Catalog" role="listbox" aria-label="Theme revisions">{visibleThemes.map((theme) => <button type="button" role="option" aria-selected={theme.id === selectedTheme.id} key={theme.id} onClick={() => selectTheme(theme)}><header><EuiBadge color={theme.lifecycle === 'Published' ? 'success' : theme.lifecycle === 'Draft' ? 'warning' : 'hollow'}>{theme.lifecycle}</EuiBadge><small>{theme.revision}</small></header><strong>{theme.name}</strong><small>{theme.scope} · {theme.modes.join(' / ')}</small><footer><span>{theme.errors} errors · {theme.warnings} warnings</span><span>{theme.coverage}% coverage</span></footer></button>)}</div><EuiSpacer /><EuiCallOut title="Personal override boundary" size="s">Users may choose only approved mode, contrast, text scale and reduced motion. Organization tokens remain governed here.</EuiCallOut></EuiPanel>
      <EuiPanel paddingSize="m" hasBorder className="p42TaskPane" data-visual-region={`theme-${stage.toLowerCase().replace(' ','-')}`}>
        <EuiFlexGroup alignItems="center" wrap><EuiFlexItem><EuiTitle size="s"><h2>{selectedTheme.name}</h2></EuiTitle><p>{selectedTheme.id} · {selectedTheme.lifecycle} · base {selectedTheme.base}</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={selectedTheme.errors ? 'danger' : selectedTheme.warnings ? 'warning' : 'success'}>{selectedTheme.errors} errors · {selectedTheme.warnings} warnings</EuiBadge></EuiFlexItem></EuiFlexGroup>
        <div className="p42Stages" role="tablist" aria-label="Theme workflow">{(['Preview','Token workbench','Validation'] as Stage[]).map((item) => <button type="button" role="tab" aria-selected={stage === item} key={item} onClick={() => setStage(item)}>{item}</button>)}</div>
        {stage === 'Preview' && <div className="p42PreviewStage"><div className="p42PreviewControls"><EuiFormRow label="Preview category"><EuiSelect value={previewCategory} onChange={(event: ChangeEvent) => setPreviewCategory(event.target.value as PreviewCategory)} options={['Operations page','Form & modal','Data grid','Status palette'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiFormRow label="Color mode"><EuiSelect value={previewMode} onChange={(event: ChangeEvent) => setPreviewMode(event.target.value as 'light' | 'dark')} options={[{ value: 'light', text: 'Light' },{ value: 'dark', text: 'Dark' }]} /></EuiFormRow><EuiFormRow label="Text scale"><EuiSelect value={textScale} onChange={(event: ChangeEvent) => setTextScale(event.target.value)} options={['100','125','150','200'].map((value) => ({ value, text: `${value}%` }))} /></EuiFormRow><EuiSwitch checked={highContrast} onChange={() => setHighContrast((value) => !value)} label="High contrast" /><EuiSwitch checked={reducedMotion} onChange={() => setReducedMotion((value) => !value)} label="Reduced motion" /><EuiSwitch checked={visibleFocus} onChange={() => setVisibleFocus((value) => !value)} label="Visible focus" /></div><EuiThemeProvider colorMode={previewMode}><div className={`p42PreviewShell ${highContrast ? 'p42HighContrast' : ''}`} style={previewStyle}><header><strong>{previewCategory}</strong><EuiBadge color="success">Ready</EuiBadge></header><main>{previewCategory === 'Operations page' && <><EuiCallOut title="Response attention" color="warning">2 projects require a decision.</EuiCallOut><div className="p42PreviewActions"><EuiButton className="p42FocusDemo" fill>Open project</EuiButton><EuiButtonEmpty>Review evidence</EuiButtonEmpty></div></>}{previewCategory === 'Form & modal' && <><EuiFormRow label="Case owner"><EuiFieldText value="SOC Tier 2" readOnly /></EuiFormRow><EuiButton className="p42FocusDemo" fill>Review submit</EuiButton></>}{previewCategory === 'Data grid' && <table><thead><tr><th>Status</th><th>Owner</th><th>Risk</th></tr></thead><tbody><tr><td><EuiBadge color="danger">At risk</EuiBadge></td><td>Response programme</td><td>High</td></tr><tr><td><EuiBadge color="success">Ready</EuiBadge></td><td>Cloud security</td><td>Low</td></tr></tbody></table>}{previewCategory === 'Status palette' && <div className="p42Palette">{[['Critical','danger'],['Warning','warning'],['Healthy','success']].map(([label, color]) => <article key={label}><EuiBadge color={color as 'danger' | 'warning' | 'success'}>{label}</EuiBadge><span>{label} state includes text and pattern</span></article>)}</div>}</main></div></EuiThemeProvider><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => setStage('Token workbench')}>Edit tokens</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={runValidation}>Validate theme</EuiButton></EuiFlexItem></EuiFlexGroup></div>}
        {stage === 'Token workbench' && <div className="p42TokenStage"><div className="p42TokenGroups">{tokenGroups.map((group) => <button type="button" aria-pressed={selectedGroup === group} key={group} onClick={() => { setSelectedGroup(group); const first = tokens.find((token) => token.group === group); if (first) selectToken(first); }}><span>{group}</span><span>{tokens.filter((token) => token.group === group).length}</span></button>)}</div><div><div className="p42TokenList" role="listbox" aria-label={`${selectedGroup} tokens`}>{visibleTokens.map((token) => <button type="button" role="option" aria-selected={token.key === selectedToken.key} key={token.key} onClick={() => selectToken(token)}><strong>{token.key}</strong><EuiBadge color={token.published === token.draft ? 'hollow' : 'warning'}>{token.published === token.draft ? 'Unchanged' : 'Modified'}</EuiBadge><small>{token.role}</small></button>)}</div><EuiFormRow label="Draft semantic value" helpText={`Used by ${selectedToken.usage.join(', ')}`}><EuiFieldText value={draftValue} onChange={(event: ChangeEvent) => { setDraftValue(event.target.value); setValidated(false); }} /></EuiFormRow><EuiFormRow label="Change reason"><EuiTextArea value={reason} onChange={(event: ChangeEvent) => setReason(event.target.value)} rows={3} /></EuiFormRow><div className="p42Diff"><article><strong>Published</strong><code>{selectedToken.key}: {selectedToken.published}</code></article><article><strong>Draft</strong><code>{selectedToken.key}: {draftValue}</code></article></div><EuiAccordion id="p42-token-provenance" buttonContent="Usage, assets and revision provenance" paddingSize="s"><ul>{selectedToken.usage.map((item) => <li key={item}>{item}</li>)}</ul><p>Base: {selectedTheme.base} · draft: {selectedTheme.revision}</p></EuiAccordion><EuiFlexGroup gutterSize="s" wrap><EuiFlexItem grow={false}><EuiButton onClick={() => setReceipt(`Prototype draft save queued for ${selectedTheme.id}: ${selectedToken.key} = ${draftValue}.`)}>Save draft</EuiButton></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={runValidation}>Validate changes</EuiButton></EuiFlexItem></EuiFlexGroup></div></div>}
        {stage === 'Validation' && <div className="p42ValidationStage"><EuiFlexGroup alignItems="center"><EuiFlexItem><EuiTitle size="xs"><h3>Accessibility findings</h3></EuiTitle><p>Open one finding to inspect evidence and jump to its semantic token.</p></EuiFlexItem><EuiFlexItem grow={false}><EuiBadge color={validated ? 'success' : 'warning'}>{validated ? 'Validation run complete' : 'Existing results'}</EuiBadge></EuiFlexItem></EuiFlexGroup><div className="p42Findings">{findings.map((finding) => <button type="button" key={finding.id} onClick={(event) => { findingOpener.current = event.currentTarget; setSelectedFindingId(finding.id); }}><EuiBadge color={findingColor(finding.state)}>{finding.state}</EuiBadge><div><strong>{finding.rule}</strong><small>{finding.component} · {finding.componentState}</small></div><span>{finding.observed}</span></button>)}</div><EuiAccordion id="p42-keyboard-at" buttonContent="Keyboard and assistive-technology acceptance path" paddingSize="s"><ol><li>Navigate catalog, workflow tabs and preview controls in logical DOM order.</li><li>Open and close the finding Flyout; focus returns to its trigger.</li><li>At 200% text scale, no document-level horizontal overflow is expected.</li><li>Statuses use text and semantic structure in addition to color.</li></ol></EuiAccordion><EuiSpacer /><EuiButton fill isDisabled={selectedTheme.errors > 0} onClick={() => setPublishOpen(true)}>Review publish</EuiButton></div>}
      </EuiPanel>
    </div>
    {selectedFinding && <EuiFlyout onClose={closeFinding} ownFocus size="m" aria-labelledby="p42-finding-title"><EuiFlyoutHeader hasBorder><EuiTitle><h2 id="p42-finding-title">{selectedFinding.rule}</h2></EuiTitle></EuiFlyoutHeader><EuiFlyoutBody><EuiBadge color={findingColor(selectedFinding.state)}>{selectedFinding.state}</EuiBadge><dl className="p42FindingDetail"><div><dt>Component</dt><dd>{selectedFinding.component}</dd></div><div><dt>State</dt><dd>{selectedFinding.componentState}</dd></div><div><dt>Observed</dt><dd>{selectedFinding.observed}</dd></div><div><dt>Required</dt><dd>{selectedFinding.required}</dd></div><div><dt>Mode</dt><dd>{selectedFinding.mode}</dd></div><div><dt>Viewport</dt><dd>{selectedFinding.viewport}</dd></div><div><dt>Suggested token</dt><dd>{selectedFinding.suggested}</dd></div></dl><EuiCallOut title="Evidence before exception" color="warning">Blocking findings require a token fix or an approved, expiring exception with an owner.</EuiCallOut></EuiFlyoutBody><EuiFlyoutFooter><EuiButtonEmpty onClick={closeFinding}>Close finding</EuiButtonEmpty><EuiButton onClick={() => { const token = tokens.find((item) => item.key === selectedFinding.suggested); if (token) { setSelectedGroup(token.group); selectToken(token); setStage('Token workbench'); } closeFinding(); }}>Open suggested token</EuiButton></EuiFlyoutFooter></EuiFlyout>}
    {publishOpen && <EuiModal onClose={() => setPublishOpen(false)} aria-labelledby="p42-publish-title"><EuiModalHeader><EuiModalHeaderTitle id="p42-publish-title">Theme publication and rollback</EuiModalHeaderTitle></EuiModalHeader><EuiModalBody><EuiCallOut title="Prototype publish only" color="warning">No root EuiProvider, organization theme, asset or personal preference is changed.</EuiCallOut><ul><li>Theme: {selectedTheme.id}</li><li>Revision: {selectedTheme.revision}</li><li>Component coverage: {selectedTheme.coverage}%</li><li>State coverage: {selectedTheme.stateCoverage}%</li><li>Fallback: {selectedTheme.fallback}</li></ul></EuiModalBody><EuiModalFooter><EuiButtonEmpty onClick={() => setPublishOpen(false)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queuePublish}>Queue publish</EuiButton></EuiModalFooter></EuiModal>}
  </div>;
}

export default function P42ThemeAccessibility() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>{page.fixture && <P42Workspace />}</PageFrame>;
}
