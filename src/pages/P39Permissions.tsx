import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P39PermissionsWorkspace } from '../components/page-specific/P39PermissionsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P39;

export default function P39Permissions() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <P39PermissionsWorkspace fixture={page.fixture} />}
  </PageFrame>;
}