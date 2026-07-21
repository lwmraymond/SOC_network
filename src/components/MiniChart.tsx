import { EuiPanel, EuiTitle } from '@elastic/eui';
import type { PrototypeChartPoint } from '../types/prototype';

export function MiniChart({ title, question, points, variant = 'bars' }: { title: string; question: string; points: PrototypeChartPoint[]; variant?: 'bars'|'line'|'heatmap'|'flow' }) {
  return <EuiPanel paddingSize="m" data-visual-region="chart" className={`miniChart chart-${variant}`}>
    <EuiTitle size="xs"><h2>{title}</h2></EuiTitle>
    <p className="panelQuestion">{question}</p>
    <div className="chartCanvas" role="img" aria-label={`${title}. Exact values are in the table immediately after the chart.`}>
      {points.map((point, index) => <span key={`${point.label}-${index}`} className="chartMark" style={{ ['--value' as string]: `${point.value}%`, ['--secondary' as string]: `${point.secondary ?? 0}%` }}><i /><b>{point.label}</b></span>)}
    </div>
    <table className="chartDataTable"><caption>{title} exact-data fallback</caption><thead><tr><th>Bucket</th><th>Primary</th><th>Secondary</th></tr></thead><tbody>{points.slice(0,6).map((point) => <tr key={point.label}><td>{point.label}</td><td>{point.value}</td><td>{point.secondary ?? 'N/A'}</td></tr>)}</tbody></table>
  </EuiPanel>;
}
