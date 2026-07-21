import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P33KnowledgeSourcesWorkspace } from '../components/page-specific/P33KnowledgeSourcesWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P33;

export default function P33KnowledgeSources() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P33KnowledgeSourcesWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
