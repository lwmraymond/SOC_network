import { EuiPanel, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture } from '../types/prototype';
export function RelationshipMap({ title = 'Relationship context', relationships }: { title?: string; relationships: PrototypePageFixture['relationships'] }) {
  const nodes=[...new Set(relationships.flatMap((item)=>[item.source,item.target]))].slice(0,9);
  return <EuiPanel paddingSize="m" data-visual-region="relationship-map"><EuiTitle size="xs"><h2>{title}</h2></EuiTitle><div className="relationshipCanvas" role="img" aria-label={`${title}. A list fallback follows.`}>{nodes.map((node,index)=><span key={node} style={{ ['--x' as string]: `${12 + (index % 3) * 38}%`, ['--y' as string]: `${12 + Math.floor(index / 3) * 34}%` }}>{node}</span>)}</div><ul className="relationshipFallback">{relationships.map((item)=><li key={`${item.source}-${item.relation}-${item.target}`}><strong>{item.source}</strong> {item.relation} <strong>{item.target}</strong></li>)}</ul></EuiPanel>;
}
