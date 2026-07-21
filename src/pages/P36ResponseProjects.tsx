import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P36ResponseProjectsWorkspace } from '../components/page-specific/P36ResponseProjectsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P36;

export default function P36ResponseProjects() {
  const page = usePrototypePage(spec.id);
  return <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {page.fixture && <P36ResponseProjectsWorkspace fixture={page.fixture} />}
  </PageFrame>;
}