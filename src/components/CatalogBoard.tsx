import { EuiBadge, EuiButtonEmpty, EuiPanel, EuiTitle } from '@elastic/eui';
import type { PrototypeRow } from '../types/prototype';
export function CatalogBoard({ title, rows, actionLabel = 'Open' }: { title: string; rows: PrototypeRow[]; actionLabel?: string }) {
  return <section data-visual-region="catalog"><EuiTitle size="s"><h2>{title}</h2></EuiTitle><div className="catalogGrid">{rows.slice(0,8).map((row,index)=><EuiPanel key={row.id} paddingSize="m" className="catalogCard"><div><EuiBadge color={index<2?'warning':'hollow'}>{row.status}</EuiBadge><EuiBadge color="hollow">{row.severity}</EuiBadge></div><EuiTitle size="xs"><h3>{String(row.name ?? row.title ?? row.summary ?? row.id)}</h3></EuiTitle><p>Owner: {row.owner}</p><p>Revision: {index+1} · validation {index%3===0?'requires attention':'ready'}</p><EuiButtonEmpty size="xs">{actionLabel}</EuiButtonEmpty></EuiPanel>)}</div></section>;
}
