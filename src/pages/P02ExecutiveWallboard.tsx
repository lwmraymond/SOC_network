import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P02ExecutiveWallboard as ExecutiveWallboardWorkspace } from '../components/page-specific/P02ExecutiveWallboard';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P02;

export default function P02ExecutiveWallboard() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <ExecutiveWallboardWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
