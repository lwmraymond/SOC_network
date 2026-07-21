import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P13ItsmOverviewWorkspace } from '../components/page-specific/P13ItsmOverviewWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P13;

export default function P13ItsmOverview() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P13ItsmOverviewWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
