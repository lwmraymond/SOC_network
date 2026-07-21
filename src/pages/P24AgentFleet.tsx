import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P24AgentFleetWorkspace } from '../components/page-specific/P24AgentFleetWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P24;

export default function P24AgentFleet() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P24AgentFleetWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
