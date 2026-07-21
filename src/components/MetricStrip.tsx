import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiStat } from '@elastic/eui';
import type { PrototypeMetric } from '../types/prototype';

export function MetricStrip({ metrics }: { metrics: PrototypeMetric[] }) {
  if (!metrics.length) return null;
  return <EuiFlexGroup gutterSize="s" responsive={false} className="metricStrip" role="list" data-visual-region="metric-strip" aria-label="Decision metrics">{metrics.map((metric) => <EuiFlexItem key={metric.label} role="listitem"><EuiPanel paddingSize="s" hasShadow={false} className={`metricCard metric-${metric.status}`}><EuiStat title={metric.value} description={metric.label} titleSize="s" /><small>{metric.trend} vs prior</small></EuiPanel></EuiFlexItem>)}</EuiFlexGroup>;
}
