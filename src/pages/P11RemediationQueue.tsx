import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P11RemediationQueueWorkspace } from '../components/page-specific/P11RemediationQueueWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P11;

export default function P11RemediationQueue() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P11RemediationQueueWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
