import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P15RequestsServiceCatalogWorkspace } from '../components/page-specific/P15RequestsServiceCatalogWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P15;

export default function P15RequestsServiceCatalog() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P15RequestsServiceCatalogWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
