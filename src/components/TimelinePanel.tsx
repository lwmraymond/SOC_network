import { EuiBadge, EuiPanel, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture } from '../types/prototype';
export function TimelinePanel({ title = 'Activity timeline', items }: { title?: string; items: PrototypePageFixture['timeline'] }) {
  return <EuiPanel paddingSize="m" data-visual-region="timeline"><EuiTitle size="xs"><h2>{title}</h2></EuiTitle><ol className="timelineList">{items.map((item) => <li key={`${item.time}-${item.title}`}><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div><EuiBadge color="hollow">{item.status}</EuiBadge></li>)}</ol></EuiPanel>;
}
