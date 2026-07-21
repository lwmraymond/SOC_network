import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P25TaskDispatchWorkspace } from '../components/page-specific/P25TaskDispatchWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P25;

export default function P25TaskDispatch() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P25TaskDispatchWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
