import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P04CaseInvestigationWorkspace } from '../components/page-specific/P04CaseInvestigationWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P04;

export default function P04IncidentsCases() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P04CaseInvestigationWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
