import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { ParentWorkflowLinks } from '../components/ParentWorkflowLinks';
import { usePrototypePage } from '../components/usePrototypePage';
import { MetricStrip } from '../components/MetricStrip';
import { MiniChart } from '../components/MiniChart';
import { QuestionRail } from '../components/QuestionRail';
import { PrototypeGrid } from '../components/PrototypeGrid';
import { StatusStrip } from '../components/StatusStrip';
import { RelationshipMap } from '../components/RelationshipMap';

const spec = pageSpecById.P03;

export default function P03PlatformHealth() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {fixture && <div className="pageComposition page-p03"><ParentWorkflowLinks links={[{label:'H11 Service logs',to:'/dashboard/platform-health/services/service-001/logs'},{label:'H12 Runtime queues',to:'/dashboard/platform-health/queues'},{label:'H13 Connectors',to:'/dashboard/platform-health/connectors'}]} /><MetricStrip metrics={fixture.metrics} /><div className="dashboardColumns"><RelationshipMap title="Effective dependency impact" relationships={fixture.relationships} /><MiniChart title={spec.charts[0] ?? 'Operational distribution'} question={spec.questions[0] ?? spec.jobStory} points={fixture.chart} variant="line" /></div><div className="dashboardColumns"><MiniChart title={spec.charts[1] ?? 'Operational distribution'} question={spec.questions[1] ?? spec.jobStory} points={fixture.chart} variant="bars" /><QuestionRail questions={spec.questions} /></div><PrototypeGrid spec={spec} rows={fixture.rows} workflowRoute={(row) => `/dashboard/platform-health/services/${row.id}/logs`} caption="Recovery action queue" maxColumns={8} /><StatusStrip title="Affected capabilities" items={['Event search degraded','Alert projection delayed','Case write healthy','Export queue at risk']} /></div>}
  </PageFrame>;
}
