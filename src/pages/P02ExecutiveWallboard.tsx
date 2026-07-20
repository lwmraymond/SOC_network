import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { MetricStrip } from '../components/MetricStrip';
import { MiniChart } from '../components/MiniChart';
import { QuestionRail } from '../components/QuestionRail';
import { PrototypeGrid } from '../components/PrototypeGrid';

const spec = pageSpecById.P02;

export default function P02ExecutiveWallboard() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {fixture && <div className="pageComposition page-p02"><MetricStrip metrics={fixture.metrics} /><MiniChart title={spec.charts[0] ?? 'Operational distribution'} question={spec.questions[0] ?? spec.jobStory} points={fixture.chart} variant="line" /><div className="dashboardColumns"><MiniChart title={spec.charts[1] ?? 'Operational distribution'} question={spec.questions[1] ?? spec.jobStory} points={fixture.chart} variant="heatmap" /><QuestionRail questions={spec.questions} label="Management decisions" /></div><PrototypeGrid spec={spec} rows={fixture.rows} caption="Management actions and commitments" maxColumns={7} /></div>}
  </PageFrame>;
}
