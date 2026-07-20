import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { RemediationExecutionWorkspace } from '../components/differentiated/RemainingSurfaces';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P11;

export default function P11RemediationQueue() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <RemediationExecutionWorkspace fixture={page.fixture} />}
  </PageFrame>;
}
