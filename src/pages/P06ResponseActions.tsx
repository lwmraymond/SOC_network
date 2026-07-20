import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P06ResponseActionsWorkspace } from '../components/page-specific/P06ResponseActionsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P06;

export default function P06ResponseActions() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P06ResponseActionsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
