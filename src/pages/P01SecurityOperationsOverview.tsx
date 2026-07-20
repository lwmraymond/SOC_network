import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P01SecurityOperationsWorkspace } from '../components/page-specific/P01SecurityOperationsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P01;

export default function P01SecurityOperationsOverview() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P01SecurityOperationsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
