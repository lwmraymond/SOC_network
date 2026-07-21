import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P16IncidentManagementWorkspace } from '../components/page-specific/P16IncidentManagementWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P16;

export default function P16IncidentManagement() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P16IncidentManagementWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
