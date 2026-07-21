import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P14WorkQueuesWorkspace } from '../components/page-specific/P14WorkQueuesWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P14;

export default function P14WorkQueues() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P14WorkQueuesWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
