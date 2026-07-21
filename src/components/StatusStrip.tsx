import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiTitle } from '@elastic/eui';
export function StatusStrip({ title, items }: { title: string; items: readonly string[] }) {
  return <EuiPanel paddingSize="s" data-visual-region="status-strip"><EuiTitle size="xxs"><h2>{title}</h2></EuiTitle><EuiFlexGroup gutterSize="s" wrap>{items.map((item,index)=><EuiFlexItem grow={false} key={item}><EuiBadge color={index===0?'danger':index===1?'warning':'hollow'}>{item}</EuiBadge></EuiFlexItem>)}</EuiFlexGroup></EuiPanel>;
}
