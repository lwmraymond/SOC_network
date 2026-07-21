import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P31RuntimeObjectsWorkspace } from '../components/page-specific/P31RuntimeObjectsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P31;

export default function P31RuntimeObjects() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P31RuntimeObjectsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
