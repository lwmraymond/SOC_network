import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P26AgentRuntimeAccessWorkspace } from '../components/page-specific/P26AgentRuntimeAccessWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P26;

export default function P26AgentRuntimeAccess() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P26AgentRuntimeAccessWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
