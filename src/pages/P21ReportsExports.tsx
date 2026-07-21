import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P21ReportsExportsWorkspace } from '../components/page-specific/P21ReportsExportsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P21;

export default function P21ReportsExports() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P21ReportsExportsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
