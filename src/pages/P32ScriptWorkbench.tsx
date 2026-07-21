import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P32ScriptWorkbenchWorkspace } from '../components/page-specific/P32ScriptWorkbenchWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P32;

export default function P32ScriptWorkbench() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P32ScriptWorkbenchWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
