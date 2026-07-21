import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P27RuntimeCatalogOverviewWorkspace } from '../components/page-specific/P27RuntimeCatalogOverviewWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P27;

export default function P27RuntimeCatalogOverview() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P27RuntimeCatalogOverviewWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
