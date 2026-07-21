import { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
  type EuiBasicTableColumn,
} from '@elastic/eui';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { PageSpec } from '../catalog/pageSpecs';
import type { PrototypeRow, PrototypeValue } from '../types/prototype';

const displayValue = (value: PrototypeValue | undefined) => value === undefined || value === '' ? 'Unknown' : String(value);

export function PrototypeGrid({ spec, rows, workflowRoute, caption, maxColumns = 7 }: {
  spec: PageSpec;
  rows: PrototypeRow[];
  workflowRoute?: (row: PrototypeRow) => string;
  caption?: string;
  maxColumns?: number;
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const query = params.get('q') ?? '';
  const page = Math.max(0, Number(params.get('page') ?? 0));
  const sortField = params.get('sort') ?? 'id';
  const sortDirection = params.get('direction') === 'asc' ? 'asc' : 'desc';
  const [draft, setDraft] = useState(query);
  const [selected, setSelected] = useState<Set<string>>(() => new Set((params.get('selected') ?? '').split(',').filter(Boolean)));
  const [detail, setDetail] = useState<PrototypeRow>();
  const [density, setDensity] = useState('compact');
  const [visibleCount, setVisibleCount] = useState(maxColumns);
  const pageSize = density === 'compact' ? 10 : 7;
  const fields = useMemo(() => [...new Set(['id', ...spec.columns, ...spec.fields])].slice(0, Math.max(maxColumns, 9)), [maxColumns, spec.columns, spec.fields]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matching = normalized ? rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(normalized))) : rows;
    return [...matching].sort((a, b) => displayValue(a[sortField]).localeCompare(displayValue(b[sortField])) * (sortDirection === 'asc' ? 1 : -1));
  }, [query, rows, sortDirection, sortField]);
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const update = (changes: Record<string,string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => value === undefined ? next.delete(key) : next.set(key, value));
    setParams(next, { replace: false });
  };
  const commitSelection = (next: Set<string>) => {
    setSelected(next);
    update({ selected: next.size ? [...next].join(',') : undefined });
  };
  const workflowDestination = (row: PrototypeRow) => {
    if (!workflowRoute) return undefined;
    const target = new URL(workflowRoute(row), 'https://prototype.local');
    const parentParams = new URLSearchParams(params);
    parentParams.set('scroll', String(Math.round(window.scrollY)));
    target.searchParams.set('returnTo', `${location.pathname}?${parentParams.toString()}`);
    return `${target.pathname}${target.search}${target.hash}`;
  };
  const columns: EuiBasicTableColumn<PrototypeRow>[] = [
    {
      name: <input aria-label="Select visible page" type="checkbox" checked={pageRows.length > 0 && pageRows.every((row) => selected.has(row.id))} onChange={(event) => { const next = new Set(selected); pageRows.forEach((row) => { if (event.target.checked) next.add(row.id); else next.delete(row.id); }); commitSelection(next); }} />,
      width: '44px',
      render: (row: PrototypeRow) => <input aria-label={`Select ${row.id}`} type="checkbox" checked={selected.has(row.id)} onChange={(event) => { const next = new Set(selected); if (event.target.checked) next.add(row.id); else next.delete(row.id); commitSelection(next); }} />,
    },
    ...fields.slice(0, visibleCount).map((field): EuiBasicTableColumn<PrototypeRow> => ({
      field,
      name: field.replaceAll('_',' '),
      sortable: true,
      truncateText: true,
      render: (value: PrototypeValue, row: PrototypeRow) => {
        if (field === 'id') return <EuiButtonEmpty size="xs" onClick={() => setDetail(row)}>{row.id}</EuiButtonEmpty>;
        if (/severity|priority|status|state|approval/i.test(field)) return <EuiBadge color={String(value).match(/critical|failed|denied/i) ? 'danger' : String(value).match(/high|risk|approval/i) ? 'warning' : 'hollow'}>{displayValue(value)}</EuiBadge>;
        if (/user|email/i.test(field) && row.id.endsWith('0003')) return <span aria-label="masked field">••••••</span>;
        return displayValue(value);
      },
    })),
    ...(workflowRoute ? [{ name: 'Workspace', width: '100px', render: (row: PrototypeRow) => <Link to={workflowDestination(row) ?? workflowRoute(row)}>Open</Link> } satisfies EuiBasicTableColumn<PrototypeRow>] : []),
  ];
  return <section aria-label={`${spec.title} exact data`} data-visual-region="grid" className={`gridWorkspace density-${density}`}>
    <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
      <EuiFlexItem grow={2}><EuiFieldSearch value={draft} onChange={(event) => setDraft(event.target.value)} onSearch={() => update({ q: draft.trim() || undefined, page: undefined })} aria-label={`${spec.title} search`} placeholder={`Search ${spec.fields.slice(0,3).join(', ')}`} /></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiSelect aria-label="Grid density" value={density} onChange={(event) => setDensity(event.target.value)} options={[{value:'compact',text:'Compact density'},{value:'normal',text:'Normal density'}]} /></EuiFlexItem>
      <EuiFlexItem grow={false}><EuiSelect aria-label="Visible columns" value={visibleCount} onChange={(event) => setVisibleCount(Number(event.target.value))} options={[5,7,9].map((value) => ({value,text:`${value} columns`}))} /></EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="s" />
    <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
      {spec.filters.slice(0,5).map((filter) => <EuiBadge key={filter} color="hollow">{filter}</EuiBadge>)}
      <EuiFlexItem />
      <EuiFlexItem grow={false}><EuiText size="xs"><p>{filtered.length} matching · page {page + 1}</p></EuiText></EuiFlexItem>
    </EuiFlexGroup>
    {selected.size > 0 && <><EuiSpacer size="s" /><EuiCallOut title={`${selected.size} selected`} color="primary">Page selection is distinct from “all matching results”. Bulk write actions require eligibility, impact preview and per-item receipts.</EuiCallOut></>}
    <EuiSpacer size="s" />
    <EuiBasicTable
      tableCaption={caption ?? `${spec.title} results`}
      items={pageRows}
      itemId="id"
      columns={columns}
      sorting={{ sort: { field: sortField, direction: sortDirection }, enableAllColumns: true }}
      onChange={({ sort }) => { if (sort) update({ sort: String(sort.field), direction: sort.direction, page: undefined }); }}
      noItemsMessage="No records match the current normalized scope."
    />
    <EuiSpacer size="s" />
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiButtonEmpty isDisabled={page === 0} onClick={() => update({ page: String(page - 1) })}>Previous</EuiButtonEmpty>
      <EuiText size="xs"><p>Cursor prototype · page index is translated at the adapter boundary</p></EuiText>
      <EuiButtonEmpty isDisabled={(page + 1) * pageSize >= filtered.length} onClick={() => update({ page: String(page + 1) })}>Next</EuiButtonEmpty>
    </EuiFlexGroup>
    {detail && <EuiFlyout ownFocus size="m" onClose={() => setDetail(undefined)} aria-labelledby={`${spec.id}-detail-title`}>
      <EuiFlyoutHeader hasBorder><EuiTitle size="m"><h2 id={`${spec.id}-detail-title`}>{spec.title} detail</h2></EuiTitle><EuiText size="s"><p>{detail.id} · prototype revision 1</p></EuiText></EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut title="Authorized fixture fields" color="primary">Route, row, field, action and export decisions share one policy interface. Masked fields remain visibly distinct.</EuiCallOut>
        <EuiSpacer />
        <dl className="detailGrid">{fields.slice(0,12).map((field) => <div key={field}><dt>{field.replaceAll('_',' ')}</dt><dd>{/user|email/i.test(field) && detail.id.endsWith('0003') ? '••••••' : displayValue(detail[field])}</dd></div>)}</dl>
        {workflowRoute && <><EuiSpacer /><Link to={workflowDestination(detail) ?? workflowRoute(detail)}>Open canonical full-page workflow</Link></>}
      </EuiFlyoutBody>
    </EuiFlyout>}
  </section>;
}
