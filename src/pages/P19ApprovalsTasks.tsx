import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P19ApprovalsTasksWorkspace } from '../components/page-specific/P19ApprovalsTasksWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P19;

export default function P19ApprovalsTasks() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P19ApprovalsTasksWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
