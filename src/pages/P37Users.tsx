import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P37UsersWorkspace } from '../components/page-specific/P37UsersWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P37;

export default function P37Users() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <P37UsersWorkspace fixture={page.fixture} />}
  </PageFrame>;
}