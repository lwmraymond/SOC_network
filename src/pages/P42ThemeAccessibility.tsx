import { useMemo, useState, type CSSProperties } from 'react';
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
  EuiProgress,
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
import type { PrototypePageFixture } from '../types/prototype';

/*
 * P42 brief / difference contract
 * Archetype: semantic-token workbench + real component preview + accessibility validation.
 * Hero: searchable theme/revision catalog with mode, scope and validation filters plus one Create theme action.
 * First viewport: theme lifecycle, token diff, live EUI component states, failed checks and rollback readiness.
 * Primary workflow: select theme -> edit semantic token -> preview modes/states -> validate -> inspect finding -> publish/rollback review.
 * Closest pages: P40 Platform Settings Directory and H14 My Settings. P42 governs organization tokens,
 * assets, validation and override policy; it does not edit generic platform settings or personal preferences.
 * Prototype writes create receipts only; no EuiProvider, global theme, asset, user preference or published revision is changed.
 */

type ThemeLifecycle = 'Published' | 'Draft' | 'Validated' | 'Retired';
type ThemeMode = 'Light' | 'Dark' | 'High contrast';
type ThemeScope = 'System' | 'Tenant';
type ValidationState = 'Error' | 'Warning' | 'Passed';
type TokenGroup = 'Color semantics' | 'Typography' | 'Spacing' | 'Radius' | 'Focus' | 'Motion' | 'Data density';
type PreviewSurface = 'Operations page' | 'Form & modal' | 'Data grid' | 'Status palette';
type ValidationFilter = 'Errors & warnings' | 'All findings' | 'Errors' | 'Warnings' | 'Passed';
type PreferenceSource = 'System' | 'Light' | 'Dark' | 'Space default';
type PublishAction = 'Publish' | 'Rollback' | null;
type ChangeEvent = { target: { value: string } };

type ThemeRecord = {
  id: string;
  name: string;
  lifecycle: ThemeLifecycle;
  scope: ThemeScope;
  modes: ThemeMode[];
  tokenRevision: string;
  baseRevision: string;
  tokenCount: number;
  assetCount: number;
  errors: number;
  warnings: number;
  componentCoverage: number;
  stateCoverage: number;
  personalOverrides: string[];
  owner: string;
  updated: string;
  fallbackTheme: string;
};

type TokenRecord = {
  key: string;
  group: TokenGroup;
  semanticRole: string;
  published: string;
  draft: string;
  usage: string[];
  modes: string;
};

type AccessibilityFinding = {
  id: string;
  state: ValidationState;
  rule: string;
  component: string;
  componentState: string;
  token: string;
  observed: string;
  required: string;
  mode: ThemeMode;
  viewport: string;
  suggestedToken: string;
  exceptionAllowed: boolean;
};

const themes: ThemeRecord[] = [
  {
    id: 'theme-soc-borealis',
    name: 'SOC Operations Borealis',
    lifecycle: 'Published',
    scope: 'System',
    modes: ['Light', 'Dark'],
    tokenRevision: 'r28',
    baseRevision: 'eui-borealis-106',
    tokenCount: 164,
    assetCount: 5,
    errors: 0,
    warnings: 2,
    componentCoverage: 96,
    stateCoverage: 92,
    personalOverrides: ['Mode', 'High contrast', 'Text scale', 'Reduced motion'],
    owner: 'Platform design system',
    updated: '2026-07-21 18:04 +08',
    fallbackTheme: 'Elastic Borealis default',
  },
  {
    id: 'theme-soc-next',
    name: 'SOC Operations Next',
    lifecycle: 'Draft',
    scope: 'System',
    modes: ['Light', 'Dark', 'High contrast'],
    tokenRevision: 'r31-draft',
    baseRevision: 'r28',
    tokenCount: 172,
    assetCount: 6,
    errors: 1,
    warnings: 3,
    componentCoverage: 91,
    stateCoverage: 88,
    personalOverrides: ['Mode', 'High contrast', 'Text scale', 'Reduced motion'],
    owner: 'Platform design system',
    updated: '2026-07-21 17:52 +08',
    fallbackTheme: 'SOC Operations Borealis r28',
  },
  {
    id: 'theme-incident-hc',
    name: 'Incident Command High Contrast',
    lifecycle: 'Validated',
    scope: 'Tenant',
    modes: ['High contrast', 'Dark'],
    tokenRevision: 'r9-validated',
    baseRevision: 'r28',
    tokenCount: 168,
    assetCount: 4,
    errors: 0,
    warnings: 0,
    componentCoverage: 100,
    stateCoverage: 98,
    personalOverrides: ['Text scale', 'Reduced motion'],
    owner: 'Accessibility review board',
    updated: '2026-07-21 16:40 +08',
    fallbackTheme: 'SOC Operations Borealis r28',
  },
  {
    id: 'theme-legacy-brand',
    name: 'Legacy SOC Brand',
    lifecycle: 'Retired',
    scope: 'Tenant',
    modes: ['Light'],
    tokenRevision: 'r14-retired',
    baseRevision: 'eui-amsterdam-88',
    tokenCount: 141,
    assetCount: 8,
    errors: 4,
    warnings: 9,
    componentCoverage: 63,
    stateCoverage: 51,
    personalOverrides: [],
    owner: 'Brand operations',
    updated: '2026-06-02 09:12 +08',
    fallbackTheme: 'SOC Operations Borealis r28',
  },
];

const tokens: TokenRecord[] = [
  { key: 'colors.text', group: 'Color semantics', semanticRole: 'Default body text', published: '#1D1E24', draft: '#17181D', usage: ['Page copy', 'Table cells', 'Form labels'], modes: 'Light / high contrast' },
  { key: 'colors.backgroundBasePlain', group: 'Color semantics', semanticRole: 'Primary page surface', published: '#FFFFFF', draft: '#FFFFFF', usage: ['Page', 'Panel', 'Modal'], modes: 'Light' },
  { key: 'colors.primary', group: 'Color semantics', semanticRole: 'Primary interaction', published: '#0B64DD', draft: '#175CD3', usage: ['Primary button', 'Link', 'Focus support'], modes: 'All' },
  { key: 'colors.danger', group: 'Color semantics', semanticRole: 'Danger and destructive state', published: '#DA3737', draft: '#C92727', usage: ['Critical status', 'Delete action', 'Validation error'], modes: 'All' },
  { key: 'font.scale.base', group: 'Typography', semanticRole: 'Base interface text scale', published: '16px', draft: '16px', usage: ['Body', 'Form', 'Table'], modes: 'All' },
  { key: 'font.weight.heading', group: 'Typography', semanticRole: 'Heading emphasis', published: '700', draft: '650', usage: ['H1', 'H2', 'Panel title'], modes: 'All' },
  { key: 'size.base', group: 'Spacing', semanticRole: 'Base spatial unit', published: '16px', draft: '16px', usage: ['Panel padding', 'Grid gap'], modes: 'All' },
  { key: 'border.radius.medium', group: 'Radius', semanticRole: 'Standard control radius', published: '6px', draft: '8px', usage: ['Panel', 'Input', 'Button'], modes: 'All' },
  { key: 'focus.outline', group: 'Focus', semanticRole: 'Keyboard focus indicator', published: '2px solid #0B64DD', draft: '3px solid #175CD3', usage: ['Button', 'Input', 'Row action'], modes: 'All' },
  { key: 'motion.duration.normal', group: 'Motion', semanticRole: 'Standard transition duration', published: '200ms', draft: '180ms', usage: ['Flyout', 'Popover', 'Selection'], modes: 'All' },
  { key: 'density.rowHeight', group: 'Data density', semanticRole: 'Default dense table row', published: '40px', draft: '44px', usage: ['Data grid', 'Queue'], modes: 'All' },
];

const findings: AccessibilityFinding[] = [
  { id: 'A11Y-4201', state: 'Error', rule: 'Text contrast', component: 'EuiBadge', componentState: 'warning / subdued panel', token: 'colors.warningText', observed: '3.1:1', required: '4.5:1', mode: 'Light', viewport: '1920×1080', suggestedToken: 'colors.warningText', exceptionAllowed: false },
  { id: 'A11Y-4202', state: 'Warning', rule: 'Focus visibility', component: 'Theme catalog row', componentState: 'keyboard selected', token: 'focus.outline', observed: '2px outline; partially clipped', required: 'Visible around full perimeter', mode: 'Dark', viewport: '1280×720', suggestedToken: 'focus.outline', exceptionAllowed: false },
  { id: 'A11Y-4203', state: 'Warning', rule: 'Reduced motion', component: 'Finding flyout', componentState: 'open / close', token: 'motion.duration.normal', observed: 'Translate animation remains', required: 'No translation when reduced motion', mode: 'Dark', viewport: '1440×900', suggestedToken: 'motion.duration.normal', exceptionAllowed: false },
  { id: 'A11Y-4204', state: 'Warning', rule: '200% zoom reflow', component: 'Token diff', componentState: 'long semantic value', token: 'size.base', observed: 'Contained horizontal scroll', required: 'No page-level horizontal scroll', mode: 'Light', viewport: '640 CSS px', suggestedToken: 'size.base', exceptionAllowed: true },
  { id: 'A11Y-4205', state: 'Passed', rule: 'Accessible name', component: 'Primary action', componentState: 'default / disabled', token: 'N/A', observed: 'Programmatic name present', required: 'Accessible name', mode: 'Light', viewport: '1920×1080', suggestedToken: 'N/A', exceptionAllowed: false },
  { id: 'A11Y-4206', state: 'Passed', rule: 'Non-color status', component: 'Validation table', componentState: 'error / warning / passed', token: 'colors.danger', observed: 'Text + count + color', required: 'Meaning not color-only', mode: 'High contrast', viewport: '1920×1080', suggestedToken: 'N/A', exceptionAllowed: false },
  { id: 'A11Y-4207', state: 'Passed', rule: 'Keyboard order', component: 'Three-pane workbench', componentState: 'forward navigation', token: 'focus.outline', observed: 'Catalog → token → preview → findings', required: 'Logical DOM order', mode: 'Dark', viewport: '1920×1080', suggestedToken: 'N/A', exceptionAllowed: false },
  { id: 'A11Y-4208', state: 'Passed', rule: 'Chart palette alternative', component: 'Status palette', componentState: 'severity samples', token: 'colors.vis', observed: 'Shape + text + value table', required: 'Non-color alternative', mode: 'High contrast', viewport: '1920×1080', suggestedToken: 'N/A', exceptionAllowed: false },
];

const tokenGroups: TokenGroup[] = ['Color semantics', 'Typography', 'Spacing', 'Radius', 'Focus', 'Motion', 'Data density'];
const lifecycleColor = (state: ThemeLifecycle): 'success' | 'warning' | 'hollow' => state === 'Published' ? 'success' : state === 'Draft' ? 'warning' : 'hollow';
const validationColor = (state: ValidationState): 'danger' | 'warning' | 'success' => state === 'Error' ? 'danger' : state === 'Warning' ? 'warning' : 'success';

function P42ThemeAccessibilityWorkspace({ fixture }: { fixture: PrototypePageFixture }) {
  const { mode: platformMode } = usePlatformTheme();
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<ThemeMode | 'All modes'>('All modes');
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>('Errors & warnings');
  const [selectedThemeId, setSelectedThemeId] = useState('theme-soc-next');
  const [selectedGroup, setSelectedGroup] = useState<TokenGroup>('Color semantics');
  const [selectedTokenKey, setSelectedTokenKey] = useState('colors.text');
  const [draftTokenValue, setDraftTokenValue] = useState('#17181D');
  const [changeReason, setChangeReason] = useState('Improve semantic contrast while preserving the approved SOC information hierarchy.');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(platformMode);
  const [preferenceSource, setPreferenceSource] = useState<PreferenceSource>('System');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visibleFocus, setVisibleFocus] = useState(true);
  const [textScale, setTextScale] = useState(100);
  const [density, setDensity] = useState<'Comfortable' | 'Compact'>('Comfortable');
  const [previewSurface, setPreviewSurface] = useState<PreviewSurface>('Operations page');
  const [validationRun, setValidationRun] = useState<'Not run' | 'Completed'>('Not run');
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>(undefined);
  const [publishAction, setPublishAction] = useState<PublishAction>(null);
  const [effectiveTime, setEffectiveTime] = useState('Next maintenance window');
  const [fallbackTheme, setFallbackTheme] = useState('SOC Operations Borealis r28');
  const [receipt, setReceipt] = useState<string | undefined>(undefined);

  const visibleThemes = useMemo(() => themes.filter((theme) => {
    const term = query.trim().toLowerCase();
    const relatedMatch = tokens.some((token) => `${token.key} ${token.group} ${token.semanticRole} ${token.usage.join(' ')}`.toLowerCase().includes(term))
      || findings.some((finding) => `${finding.id} ${finding.rule} ${finding.component} ${finding.componentState} ${finding.token}`.toLowerCase().includes(term));
    const matchesQuery = !term || `${theme.id} ${theme.name} ${theme.lifecycle} ${theme.owner} ${theme.tokenRevision}`.toLowerCase().includes(term) || relatedMatch;
    const matchesMode = modeFilter === 'All modes' || theme.modes.includes(modeFilter);
    return matchesQuery && matchesMode;
  }), [modeFilter, query]);

  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? visibleThemes[0] ?? themes[0];
  const queryTerm = query.trim().toLowerCase();
  const visibleTokens = tokens.filter((token) => token.group === selectedGroup && (!queryTerm || `${token.key} ${token.semanticRole} ${token.usage.join(' ')}`.toLowerCase().includes(queryTerm) || `${selectedTheme.id} ${selectedTheme.name}`.toLowerCase().includes(queryTerm)));
  const selectedToken = tokens.find((token) => token.key === selectedTokenKey) ?? visibleTokens[0] ?? tokens[0];
  const visibleFindings = findings.filter((finding) => {
    const matchesSearch = !queryTerm || `${finding.id} ${finding.rule} ${finding.component} ${finding.componentState} ${finding.token} ${finding.suggestedToken}`.toLowerCase().includes(queryTerm) || `${selectedTheme.id} ${selectedTheme.name}`.toLowerCase().includes(queryTerm);
    if (!matchesSearch) return false;
    if (validationFilter === 'All findings') return true;
    if (validationFilter === 'Errors & warnings') return finding.state !== 'Passed';
    if (validationFilter === 'Errors') return finding.state === 'Error';
    if (validationFilter === 'Warnings') return finding.state === 'Warning';
    return finding.state === 'Passed';
  });
  const selectedFinding = findings.find((finding) => finding.id === selectedFindingId);
  const changedTokens = tokens.filter((token) => token.published !== token.draft).length;
  const errorCount = findings.filter((finding) => finding.state === 'Error').length;
  const warningCount = findings.filter((finding) => finding.state === 'Warning').length;
  const resolvedPreviewMode = preferenceSource === 'Light' ? 'light' : preferenceSource === 'Dark' ? 'dark' : platformMode;
  const canPublish = selectedTheme.lifecycle === 'Validated' && selectedTheme.errors === 0 && validationRun === 'Completed';

  const selectTheme = (theme: ThemeRecord) => {
    setSelectedThemeId(theme.id);
    setValidationRun('Not run');
    setFallbackTheme(theme.fallbackTheme);
  };

  const selectToken = (token: TokenRecord) => {
    setSelectedTokenKey(token.key);
    setDraftTokenValue(token.draft);
  };

  const createTheme = () => {
    const draft = themes.find((theme) => theme.lifecycle === 'Draft') ?? themes[0];
    selectTheme(draft);
    setReceipt('Prototype create-theme workspace initialized from the published Borealis revision. No draft or asset was persisted.');
  };

  const saveDraft = () => {
    setReceipt(`Prototype draft save queued for ${selectedTheme.id}: ${selectedToken.key} = ${draftTokenValue}. Effective theme and EuiProvider remain unchanged.`);
  };

  const runValidation = () => {
    setValidationRun('Completed');
    setReceipt(`Prototype accessibility validation completed across ${selectedTheme.componentCoverage}% component coverage and ${selectedTheme.stateCoverage}% state coverage. Findings remain illustrative and no theme revision changed.`);
  };

  const jumpToFindingToken = (finding: AccessibilityFinding) => {
    const token = tokens.find((item) => item.key === finding.suggestedToken || item.key === finding.token);
    if (token) {
      setSelectedGroup(token.group);
      selectToken(token);
    }
    setSelectedFindingId(undefined);
  };

  const queuePublishAction = () => {
    if (!publishAction) return;
    setReceipt(`Prototype ${publishAction.toLowerCase()} receipt queued for ${selectedTheme.id}. Effective revision, assets, personal preferences and client theme remain unchanged until authoritative rehydration.`);
    setPublishAction(null);
  };

  const importTokens = () => setReceipt('Prototype token import inspection opened. Unknown tokens, assets and classification would be validated before creating a draft; no package was uploaded.');
  const exportTokens = () => setReceipt(`Prototype export job queued for ${selectedTheme.id}; secret values and font files are excluded.`);

  return <div className={`pageComposition differentiatedPage p42ThemeAccessibility ${reducedMotion ? 'p42ReducedMotion' : ''}`} data-page-specific-composition="P42-token-workbench-live-preview-accessibility-findings">
    <style>{`
      .p42ThemeAccessibility{display:flex;flex-direction:column;gap:24px;min-width:0}.p42ThemeAccessibility *{box-sizing:border-box}.p42ThemeAccessibility p,.p42ThemeAccessibility small,.p42ThemeAccessibility td,.p42ThemeAccessibility dd{overflow-wrap:anywhere}.p42Command{display:grid;grid-template-columns:minmax(280px,1.5fr) minmax(160px,.6fr) minmax(190px,.7fr) auto;gap:12px;align-items:end}.p42Summary{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:1px;padding:0;overflow:hidden}.p42Summary>div{padding:15px 18px;background:var(--euiColorEmptyShade,#fff)}.p42Summary strong{display:block;font-size:22px}.p42Summary span{display:block;margin-top:5px}.p42Workbench{display:grid;grid-template-columns:minmax(250px,300px) minmax(560px,1.45fr) minmax(390px,.95fr);gap:24px;align-items:start;min-width:0}.p42Catalog,.p42TokenGroups{display:flex;flex-direction:column;gap:8px}.p42Catalog button,.p42TokenGroups button,.p42TokenList button{width:100%;border:1px solid transparent;border-radius:6px;background:transparent;color:inherit;text-align:left}.p42Catalog button{padding:12px}.p42Catalog button[aria-selected=true],.p42TokenGroups button[aria-pressed=true],.p42TokenList button[aria-selected=true]{border-color:var(--euiColorPrimary,#0b64dd);background:var(--euiColorLightestShade,#f5f7fa)}.p42Catalog header,.p42Catalog footer{display:flex;justify-content:space-between;gap:8px}.p42Catalog strong,.p42Catalog small{display:block}.p42Catalog small{margin-top:5px}.p42TokenWorkbench{display:grid;grid-template-columns:minmax(170px,220px) 1fr;gap:18px}.p42TokenGroups button{display:flex;justify-content:space-between;gap:8px;padding:9px 10px}.p42TokenList{display:grid;gap:8px;margin-bottom:14px}.p42TokenList button{display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:10px;border-color:var(--euiBorderColor,#d3dae6)}.p42TokenList small{grid-column:1/-1}.p42Diff{display:grid;grid-template-columns:1fr 1fr;gap:10px}.p42Diff article{padding:12px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px}.p42Diff strong,.p42Diff code{display:block}.p42Diff code{margin-top:8px;white-space:pre-wrap}.p42PreviewControls{display:grid;grid-template-columns:1fr 1fr;gap:10px}.p42PreviewShell{border:1px solid currentColor;border-radius:8px;overflow:hidden;min-width:0}.p42PreviewHeader{display:flex;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid currentColor}.p42PreviewBody{display:grid;grid-template-columns:130px 1fr;min-height:330px}.p42PreviewNav{padding:12px;border-right:1px solid currentColor}.p42PreviewNav button{display:block;width:100%;padding:8px;border:0;background:transparent;color:inherit;text-align:left}.p42PreviewMain{padding:16px;font-size:calc(1rem * var(--p42TextScale,1))}.p42PreviewActions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.p42PreviewTable{width:100%;border-collapse:collapse}.p42PreviewTable th,.p42PreviewTable td{height:var(--p42RowHeight,44px);padding:8px;border-bottom:1px solid currentColor;text-align:left}.p42FocusDemo:focus{outline:var(--p42Focus,3px solid #175CD3);outline-offset:3px}.p42Palette{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.p42Palette article{padding:10px;border:1px solid currentColor;border-radius:6px}.p42Palette span{display:block;height:20px;margin-bottom:7px;background:repeating-linear-gradient(45deg,currentColor 0,currentColor 4px,transparent 4px,transparent 8px)}.p42Findings{display:grid;gap:8px;margin-top:14px}.p42Findings button{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;padding:10px;border:1px solid var(--euiBorderColor,#d3dae6);border-radius:6px;background:transparent;color:inherit;text-align:left}.p42Findings strong,.p42Findings small{display:block}.p42FindingDetail{display:grid;grid-template-columns:1fr auto;gap:8px 16px}.p42FindingDetail dt{font-weight:600}.p42FindingDetail dd{margin:0;text-align:right}.p42OverrideList{display:flex;flex-wrap:wrap;gap:6px}.p42ActionBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.p42ActionBar>span{margin-right:auto}.p42ReducedMotion *{scroll-behavior:auto!important;transition:none!important;animation:none!important}@media(max-width:1500px){.p42Workbench{grid-template-columns:minmax(240px,290px) 1fr}.p42PreviewPane{grid-column:1/-1}.p42PreviewPane>div{display:grid;grid-template-columns:1fr 1fr;gap:18px}}@media(max-width:1050px){.p42Command{grid-template-columns:1fr 1fr}.p42Summary{grid-template-columns:repeat(2,1fr)}.p42Workbench{grid-template-columns:1fr}.p42TokenWorkbench{grid-template-columns:200px 1fr}.p42PreviewPane>div{display:block}}@media(max-width:720px){.p42Command,.p42Summary,.p42TokenWorkbench,.p42PreviewControls,.p42Diff{grid-template-columns:1fr}.p42PreviewBody{grid-template-columns:1fr}.p42PreviewNav{border-right:0;border-bottom:1px solid currentColor}.p42Palette{grid-template-columns:1fr}.p42ActionBar{align-items:stretch;flex-direction:column}.p42ActionBar>span{margin-right:0}}
    `}</style>

    <EuiPanel paddingSize="m" hasBorder data-visual-region="theme-command-bar">
      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem>
          <EuiTitle size="s"><h2>Organization theme registry</h2></EuiTitle>
          <p>Search revisions, semantic tokens, component states, assets, findings, owners, and usage.</p>
        </EuiFlexItem>
        <EuiFlexItem grow={false}><EuiBadge color="hollow">Theme registry · {fixture.freshness}</EuiBadge></EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <div className="p42Command">
        <EuiFormRow label="Search theme, token, component, finding, owner or revision"><EuiFieldSearch value={query} onChange={(event: ChangeEvent) => setQuery(event.target.value)} placeholder="theme-soc-next, focus.outline, EuiBadge…" /></EuiFormRow>
        <EuiFormRow label="Mode"><EuiSelect value={modeFilter} onChange={(event: ChangeEvent) => setModeFilter(event.target.value as ThemeMode | 'All modes')} options={['All modes', 'Light', 'Dark', 'High contrast'].map((value) => ({ value, text: value }))} /></EuiFormRow>
        <EuiFormRow label="Accessibility validation"><EuiSelect value={validationFilter} onChange={(event: ChangeEvent) => setValidationFilter(event.target.value as ValidationFilter)} options={['Errors & warnings', 'All findings', 'Errors', 'Warnings', 'Passed'].map((value) => ({ value, text: value }))} /></EuiFormRow>
        <EuiButton fill onClick={createTheme}>Create theme</EuiButton>
      </div>
    </EuiPanel>

    {receipt && <EuiCallOut className="p42Receipt" title="Prototype theme receipt" color="warning">{receipt}</EuiCallOut>}

    <EuiPanel paddingSize="none" hasBorder className="p42Summary" aria-label="Theme validation status summary">
      <div><strong>{changedTokens}</strong><span>Draft token differences</span></div>
      <div><strong>{errorCount} error</strong><span>Blocking accessibility checks</span></div>
      <div><strong>{warningCount} warnings</strong><span>Review before publication</span></div>
      <div><strong>{selectedTheme.fallbackTheme}</strong><span>Fallback / rollback target</span></div>
    </EuiPanel>

    <div className="p42Workbench">
      <EuiPanel paddingSize="m" hasBorder data-visual-region="theme-catalog">
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem><EuiTitle size="s"><h2>Theme catalog</h2></EuiTitle></EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color="hollow">{visibleThemes.length} visible</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <div className="p42Catalog" role="listbox" aria-label="Theme revisions">
          {visibleThemes.map((theme) => <button type="button" role="option" aria-selected={theme.id === selectedTheme.id} key={theme.id} onClick={() => selectTheme(theme)}>
            <header><EuiBadge color={lifecycleColor(theme.lifecycle)}>{theme.lifecycle}</EuiBadge><small>{theme.tokenRevision}</small></header>
            <strong>{theme.name}</strong>
            <small>{theme.id} · {theme.scope} · {theme.modes.join(' / ')}</small>
            <footer><span>{theme.errors} errors · {theme.warnings} warnings</span><span>{theme.componentCoverage}% components</span></footer>
          </button>)}
        </div>
        <EuiSpacer size="m" />
        <EuiCallOut title="Personal override boundary" size="s">Users select only policy-approved mode, contrast, text scale, and reduced motion in My Settings. Organization tokens and assets remain governed here.</EuiCallOut>
        <EuiSpacer size="m" />
        <EuiTitle size="xs"><h3>Allowed personal overrides</h3></EuiTitle>
        <div className="p42OverrideList">{selectedTheme.personalOverrides.length ? selectedTheme.personalOverrides.map((item) => <EuiBadge key={item} color="hollow">{item}</EuiBadge>) : <span>None</span>}</div>
      </EuiPanel>

      <EuiPanel paddingSize="m" hasBorder data-visual-region="semantic-token-workbench">
        <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
          <EuiFlexItem>
            <EuiTitle size="s"><h2>{selectedTheme.name}</h2></EuiTitle>
            <p>{selectedTheme.id} · {selectedTheme.lifecycle} · owner {selectedTheme.owner} · updated {selectedTheme.updated}</p>
          </EuiFlexItem>
          <EuiFlexItem grow={false}><EuiBadge color={selectedTheme.errors ? 'danger' : selectedTheme.warnings ? 'warning' : 'success'}>{selectedTheme.errors} errors · {selectedTheme.warnings} warnings</EuiBadge></EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <div className="p42TokenWorkbench">
          <div className="p42TokenGroups" aria-label="Token groups">
            <EuiTitle size="xs"><h3>Semantic token groups</h3></EuiTitle>
            {tokenGroups.map((group) => <button type="button" aria-pressed={group === selectedGroup} key={group} onClick={() => { setSelectedGroup(group); const first = tokens.find((token) => token.group === group); if (first) selectToken(first); }}><span>{group}</span><span>{tokens.filter((token) => token.group === group).length}</span></button>)}
          </div>
          <div>
            <EuiTitle size="xs"><h3>Token editor and semantic diff</h3></EuiTitle>
            <EuiSpacer size="s" />
            <div className="p42TokenList" role="listbox" aria-label={`${selectedGroup} tokens`}>
              {visibleTokens.map((token) => <button type="button" role="option" aria-selected={token.key === selectedToken.key} key={token.key} onClick={() => selectToken(token)}><strong>{token.key}</strong><EuiBadge color={token.published === token.draft ? 'hollow' : 'warning'}>{token.published === token.draft ? 'Unchanged' : 'Modified'}</EuiBadge><small>{token.semanticRole}</small></button>)}
            </div>
            <EuiFormRow label="Draft semantic value" helpText={`Used by ${selectedToken.usage.join(', ')} · modes: ${selectedToken.modes}`}><EuiFieldText value={draftTokenValue} onChange={(event: ChangeEvent) => setDraftTokenValue(event.target.value)} /></EuiFormRow>
            <EuiFormRow label="Change reason"><EuiTextArea value={changeReason} onChange={(event: ChangeEvent) => setChangeReason(event.target.value)} rows={3} /></EuiFormRow>
            <div className="p42Diff" aria-label="Published and draft token comparison">
              <article><strong>Published · {selectedTheme.baseRevision}</strong><code>{selectedToken.key}: {selectedToken.published}</code></article>
              <article><strong>Draft · {selectedTheme.tokenRevision}</strong><code>{selectedToken.key}: {draftTokenValue}</code></article>
            </div>
            <EuiSpacer size="m" />
            <EuiAccordion id="p42-token-usage" buttonContent="Usage, assets and revision provenance" paddingSize="s">
              <dl className="p42FindingDetail"><dt>Semantic role</dt><dd>{selectedToken.semanticRole}</dd><dt>Component usage</dt><dd>{selectedToken.usage.join(', ')}</dd><dt>Token count</dt><dd>{selectedTheme.tokenCount}</dd><dt>Asset references</dt><dd>{selectedTheme.assetCount}</dd><dt>Base revision</dt><dd>{selectedTheme.baseRevision}</dd></dl>
            </EuiAccordion>
            <EuiSpacer size="m" />
            <div className="p42ActionBar"><span>Draft changes do not alter the application theme until a validated publication receipt is rehydrated.</span><EuiButtonEmpty onClick={importTokens}>Import tokens</EuiButtonEmpty><EuiButtonEmpty onClick={exportTokens}>Export tokens</EuiButtonEmpty><EuiButton onClick={saveDraft}>Save prototype draft</EuiButton></div>
          </div>
        </div>
      </EuiPanel>

      <div className="p42PreviewPane">
        <EuiPanel paddingSize="m" hasBorder data-visual-region="live-eui-component-preview">
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
            <EuiFlexItem><EuiTitle size="s"><h2>Live component preview</h2></EuiTitle></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiBadge color="hollow">Nested EuiThemeProvider only</EuiBadge></EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <div className="p42PreviewControls">
            <EuiFormRow label="Preview surface"><EuiSelect value={previewSurface} onChange={(event: ChangeEvent) => setPreviewSurface(event.target.value as PreviewSurface)} options={['Operations page', 'Form & modal', 'Data grid', 'Status palette'].map((value) => ({ value, text: value }))} /></EuiFormRow>
            <EuiFormRow label="Preference source"><EuiSelect value={preferenceSource} onChange={(event: ChangeEvent) => { const value = event.target.value as PreferenceSource; setPreferenceSource(value); const next = value === 'Light' ? 'light' : value === 'Dark' ? 'dark' : platformMode; setPreviewMode(next); }} options={['System', 'Light', 'Dark', 'Space default'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          </div>
          <EuiSwitch checked={highContrast} onChange={() => setHighContrast((value) => !value)} label="High contrast preview" />
          <EuiSwitch checked={reducedMotion} onChange={() => setReducedMotion((value) => !value)} label="Reduce optional motion" />
          <EuiSwitch checked={visibleFocus} onChange={() => setVisibleFocus((value) => !value)} label="Emphasize keyboard focus demonstration" />
          <EuiSpacer size="s" />
          <EuiFormRow label={`Text scale ${textScale}%`}><input type="range" min="100" max="200" step="25" value={textScale} onChange={(event: ChangeEvent) => setTextScale(Number(event.target.value))} /></EuiFormRow>
          <EuiFormRow label="Data density"><EuiSelect value={density} onChange={(event: ChangeEvent) => setDensity(event.target.value as 'Comfortable' | 'Compact')} options={['Comfortable', 'Compact'].map((value) => ({ value, text: value }))} /></EuiFormRow>
          <EuiSpacer size="m" />
          <EuiThemeProvider colorMode={previewMode} highContrastMode={highContrast}>
            <div className="p42PreviewShell" style={{ '--p42TextScale': textScale / 100, '--p42RowHeight': density === 'Compact' ? '36px' : '44px', '--p42Focus': visibleFocus ? draftTokenValue.includes('#') ? `3px solid ${draftTokenValue}` : '3px solid currentColor' : 'none' } as CSSProperties}>
              <div className="p42PreviewHeader"><strong>SOC Operations</strong><span>{preferenceSource} → resolved {resolvedPreviewMode}{highContrast ? ' / high contrast' : ''}</span></div>
              <div className="p42PreviewBody">
                <nav className="p42PreviewNav" aria-label="Preview navigation"><button type="button">Overview</button><button type="button">Alerts</button><button type="button">Cases</button><button type="button">Settings</button></nav>
                <main className="p42PreviewMain">
                  <EuiTitle size="xs"><h3>{previewSurface}</h3></EuiTitle>
                  <p>Real component states retain the existing information hierarchy while tokens, contrast, focus, scale, motion, and density change.</p>
                  <div className="p42PreviewActions"><EuiButton fill className="p42FocusDemo">Primary action</EuiButton><EuiButton className="p42FocusDemo">Secondary action</EuiButton><EuiBadge color="danger">Critical · text label</EuiBadge><EuiBadge color="warning">Warning · text label</EuiBadge></div>
                  {previewSurface === 'Operations page' && <><EuiCallOut title="Data source degraded" color="warning">Status includes a text label and recovery guidance rather than color alone.</EuiCallOut><EuiSpacer size="s" /><table className="p42PreviewTable"><thead><tr><th>Case</th><th>Severity</th><th>Owner</th></tr></thead><tbody><tr><td>CASE-2026-447</td><td>Critical</td><td>SOC Tier 2</td></tr><tr><td>CASE-2026-448</td><td>Medium</td><td>Identity Ops</td></tr></tbody></table></>}
                  {previewSurface === 'Form & modal' && <><EuiFormRow label="Accessible field label"><EuiFieldText value="Theme preview" readOnly /></EuiFormRow><EuiSwitch checked label="Enabled state" onChange={() => undefined} /><EuiCallOut title="Focus return test">Open and close overlays in the full page to verify focus restoration.</EuiCallOut></>}
                  {previewSurface === 'Data grid' && <table className="p42PreviewTable"><thead><tr><th scope="col">Status</th><th scope="col">Object</th><th scope="col">Updated</th></tr></thead><tbody><tr><td>Investigating</td><td>alert-0027</td><td>18:04 +08</td></tr><tr><td>Queued</td><td>action-0012</td><td>18:03 +08</td></tr><tr><td>Validated</td><td>rule-0041</td><td>17:58 +08</td></tr></tbody></table>}
                  {previewSurface === 'Status palette' && <div className="p42Palette" aria-label="Severity palette with pattern and text alternatives"><article><span aria-hidden="true" /><strong>Critical</strong><small>Priority 1 · immediate</small></article><article><span aria-hidden="true" /><strong>Warning</strong><small>Priority 2 · review</small></article><article><span aria-hidden="true" /><strong>Healthy</strong><small>Normal operation</small></article></div>}
                </main>
              </div>
            </div>
          </EuiThemeProvider>
        </EuiPanel>

        <EuiPanel paddingSize="m" hasBorder data-visual-region="accessibility-validation-results">
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
            <EuiFlexItem><EuiTitle size="s"><h2>Accessibility validation</h2></EuiTitle><p>{validationRun === 'Completed' ? 'Last prototype run completed for the selected revision.' : 'Run validation after token or preview changes.'}</p></EuiFlexItem>
            <EuiFlexItem grow={false}><EuiButton fill onClick={runValidation}>Run validation</EuiButton></EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <EuiProgress value={selectedTheme.componentCoverage} max={100} size="s" color={selectedTheme.componentCoverage === 100 ? 'success' : 'warning'} label={`${selectedTheme.componentCoverage}% component coverage`} valueText={`${selectedTheme.stateCoverage}% state coverage`} />
          <div className="p42Findings" aria-label="Accessibility findings">
            {visibleFindings.map((finding) => <button type="button" key={finding.id} onClick={() => setSelectedFindingId(finding.id)}><EuiBadge color={validationColor(finding.state)}>{finding.state}</EuiBadge><span><strong>{finding.rule} · {finding.component}</strong><small>{finding.componentState} · {finding.mode} · {finding.observed}</small></span><span>{finding.id}</span></button>)}
          </div>
          <EuiSpacer size="m" />
          <EuiAccordion id="p42-keyboard-path" buttonContent="Keyboard, zoom and assistive-technology acceptance path" paddingSize="s">
            <ol><li>Page heading → search and filters → theme catalog.</li><li>Selected theme → token group → token value and reason.</li><li>Live preview controls → real EUI states → validation findings.</li><li>Finding flyout closes to its trigger; modal closes to Publish/Rollback trigger.</li><li>Verify 200% zoom/reflow, forced colors, reduced motion, accessible names, and non-color status.</li></ol>
          </EuiAccordion>
          <EuiSpacer size="m" />
          <div className="p42ActionBar"><span>{canPublish ? 'Required checks are complete; publish review is available.' : 'Publish requires a validated revision, zero blocking errors, and a completed validation run.'}</span><EuiButtonEmpty onClick={() => setPublishAction('Rollback')} isDisabled={selectedTheme.lifecycle !== 'Published'}>Review rollback</EuiButtonEmpty><EuiButton fill onClick={() => setPublishAction('Publish')} isDisabled={!canPublish}>Review publish</EuiButton></div>
        </EuiPanel>
      </div>
    </div>

    {selectedFinding && <EuiFlyout onClose={() => setSelectedFindingId(undefined)} size="m" aria-labelledby="p42-finding-title">
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id="p42-finding-title">{selectedFinding.id} · {selectedFinding.rule}</h2></EuiTitle><p>{selectedFinding.component} / {selectedFinding.componentState}</p></EuiFlyoutHeader>
      <EuiFlyoutBody><EuiCallOut title={`${selectedFinding.state} finding`} color={validationColor(selectedFinding.state)}>Finding state is represented by text and detail, not color alone.</EuiCallOut><EuiSpacer size="m" /><dl className="p42FindingDetail"><dt>Token</dt><dd>{selectedFinding.token}</dd><dt>Observed</dt><dd>{selectedFinding.observed}</dd><dt>Required</dt><dd>{selectedFinding.required}</dd><dt>Mode</dt><dd>{selectedFinding.mode}</dd><dt>Viewport</dt><dd>{selectedFinding.viewport}</dd><dt>Suggested semantic token</dt><dd>{selectedFinding.suggestedToken}</dd></dl><EuiSpacer size="m" /><EuiCodeBlock language="text" paddingSize="s">component={selectedFinding.component}\nstate={selectedFinding.componentState}\nmode={selectedFinding.mode}\nobserved={selectedFinding.observed}\nrequired={selectedFinding.required}</EuiCodeBlock><EuiSpacer size="m" /><EuiCallOut title="Exception governance" color="warning">Accessibility exceptions require a reason, expiry, owner, approval, affected component states, and an audit receipt. An exception never converts a failed check into a pass.</EuiCallOut></EuiFlyoutBody>
      <EuiFlyoutFooter><EuiFlexGroup justifyContent="spaceBetween"><EuiFlexItem grow={false}><EuiButtonEmpty onClick={() => setSelectedFindingId(undefined)}>Close</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiFlexGroup gutterSize="s"><EuiFlexItem grow={false}><EuiButtonEmpty isDisabled={!selectedFinding.exceptionAllowed} onClick={() => setReceipt(`Prototype exception request opened for ${selectedFinding.id}; finding remains ${selectedFinding.state}.`)}>Request exception</EuiButtonEmpty></EuiFlexItem><EuiFlexItem grow={false}><EuiButton fill onClick={() => jumpToFindingToken(selectedFinding)}>Jump to token</EuiButton></EuiFlexItem></EuiFlexGroup></EuiFlexItem></EuiFlexGroup></EuiFlyoutFooter>
    </EuiFlyout>}

    {publishAction && <EuiModal onClose={() => setPublishAction(null)} aria-labelledby="p42-publish-title">
      <EuiModalHeader><EuiModalHeaderTitle id="p42-publish-title">{publishAction} theme revision and impact</EuiModalHeaderTitle></EuiModalHeader>
      <EuiModalBody><EuiCallOut title="Governed theme change" color="warning">This demo creates a queued receipt only. It does not change the global EuiProvider, organization tokens, assets, personal preferences, or client sessions.</EuiCallOut><EuiSpacer size="m" /><EuiFormRow label="Effective time"><EuiSelect value={effectiveTime} onChange={(event: ChangeEvent) => setEffectiveTime(event.target.value)} options={['Next maintenance window', 'After approval', 'Scheduled 2026-07-22 02:00 +08'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiFormRow label="Fallback theme"><EuiSelect value={fallbackTheme} onChange={(event: ChangeEvent) => setFallbackTheme(event.target.value)} options={['SOC Operations Borealis r28', 'Elastic Borealis default', 'Incident Command High Contrast r9'].map((value) => ({ value, text: value }))} /></EuiFormRow><EuiFormRow label="Reason"><EuiTextArea value={changeReason} onChange={(event: ChangeEvent) => setChangeReason(event.target.value)} rows={3} /></EuiFormRow><dl className="p42FindingDetail"><dt>Target</dt><dd>{selectedTheme.id} · {selectedTheme.tokenRevision}</dd><dt>Scope</dt><dd>{selectedTheme.scope}</dd><dt>Modes</dt><dd>{selectedTheme.modes.join(', ')}</dd><dt>Components / states</dt><dd>{selectedTheme.componentCoverage}% / {selectedTheme.stateCoverage}%</dd><dt>Assets</dt><dd>{selectedTheme.assetCount} references</dd><dt>Blocking errors</dt><dd>{selectedTheme.errors}</dd><dt>Personal overrides</dt><dd>{selectedTheme.personalOverrides.join(', ') || 'None'}</dd><dt>Rollback target</dt><dd>{fallbackTheme}</dd></dl></EuiModalBody>
      <EuiModalFooter><EuiButtonEmpty onClick={() => setPublishAction(null)}>Cancel</EuiButtonEmpty><EuiButton fill onClick={queuePublishAction}>Queue {publishAction.toLowerCase()}</EuiButton></EuiModalFooter>
    </EuiModal>}
  </div>;
}

const spec = pageSpecById.P42;

export default function P42ThemeAccessibility() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <P42ThemeAccessibilityWorkspace fixture={page.fixture} />}
  </PageFrame>;
}
