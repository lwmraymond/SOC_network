import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiProgress, EuiTitle } from '@elastic/eui';
import type { PrototypePageFixture } from '../types/prototype';

export function H15DeviceStatusViewSurface({ fixture }: { fixture: PrototypePageFixture }) {
  const asset = fixture.rows[0];
  return <section aria-label="Device status view" className="deviceStatusView">
    <EuiTitle size="m"><h2>Device status</h2></EuiTitle>
    <p>{String(asset?.display_name ?? asset?.id ?? 'Selected asset')} · contextual prototype view</p>
    <EuiFlexGroup wrap>
      <EuiFlexItem><EuiPanel><strong>Health</strong><p>{String(asset?.status ?? 'Unknown')}</p></EuiPanel></EuiFlexItem>
      <EuiFlexItem><EuiPanel><strong>Freshness</strong><p>{fixture.freshness}</p></EuiPanel></EuiFlexItem>
      <EuiFlexItem><EuiPanel><strong>Coverage</strong><EuiProgress value={Math.round(fixture.coverage * 100)} max={100} size="m" /></EuiPanel></EuiFlexItem>
      <EuiFlexItem><EuiPanel><strong>Authority</strong><p><EuiBadge color="warning">Fixture only</EuiBadge></p></EuiPanel></EuiFlexItem>
    </EuiFlexGroup>
  </section>;
}
