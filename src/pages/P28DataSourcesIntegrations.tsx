import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P28DataSourcesIntegrationsWorkspace } from '../components/page-specific/P28DataSourcesIntegrationsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P28;

export default function P28DataSourcesIntegrations() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P28DataSourcesIntegrationsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
