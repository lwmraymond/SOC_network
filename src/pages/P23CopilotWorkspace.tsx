import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P23CopilotWorkspace as CopilotWorkspace } from '../components/page-specific/P23CopilotWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P23;

export default function P23CopilotWorkspace() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <CopilotWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
