import { EuiBadge, EuiPanel, EuiTitle } from '@elastic/eui';
import type { PageSpec } from '../catalog/pageSpecs';
import type { PrototypeRow } from '../types/prototype';
export function EntityIdentity({ spec, row }: { spec: PageSpec; row: PrototypeRow }) {
  return <EuiPanel paddingSize="m" className="entityIdentity" data-visual-region="identity"><div><EuiTitle size="m"><h2>{String(row.display_name??row.name??row.id)}</h2></EuiTitle><p>{row.id} · canonical identity · prototype revision 1</p></div><div className="entityBadges"><EuiBadge color="danger">Risk {String(row.risk_score??72)}</EuiBadge><EuiBadge color="warning">{row.status}</EuiBadge><EuiBadge color="hollow">Owner {row.owner}</EuiBadge><EuiBadge color="hollow">Source confidence 94%</EuiBadge></div><dl>{spec.fields.slice(0,8).map((field)=><div key={field}><dt>{field.replaceAll('_',' ')}</dt><dd>{String(row[field]??'Unknown')}</dd></div>)}</dl></EuiPanel>;
}
