import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P18ChangeManagementWorkspace } from '../components/page-specific/P18ChangeManagementWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P18;

export default function P18ChangeManagement() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P18ChangeManagementWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
