import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P17ProblemManagementWorkspace } from '../components/page-specific/P17ProblemManagementWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P17;

export default function P17ProblemManagement() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P17ProblemManagementWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
