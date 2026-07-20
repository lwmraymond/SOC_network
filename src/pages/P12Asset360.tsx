import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P12Asset360Workspace } from '../components/page-specific/P12Asset360Workspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P12;

export default function P12Asset360() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P12Asset360Workspace fixture={page.fixture} />}
    </PageFrame>
  );
}
