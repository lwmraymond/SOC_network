import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { ParentWorkflowLinks } from '../components/ParentWorkflowLinks';
import { CaseInvestigationWorkbench } from '../components/differentiated/OperationalSurfaces';

const spec = pageSpecById.P04;

export default function P04IncidentsCases() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return (
    <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {fixture && <div className="pageComposition page-p04 differentiatedPage"><ParentWorkflowLinks links={[{label:'Open case investigation workflow',to:'/analyzer/cases?case=p04-0001'}]} /><CaseInvestigationWorkbench fixture={fixture} /></div>}
    </PageFrame>
  );
}
