import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P03PlatformHealthWorkspace } from '../components/page-specific/P03PlatformHealthWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P03;

export default function P03PlatformHealth() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P03PlatformHealthWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
