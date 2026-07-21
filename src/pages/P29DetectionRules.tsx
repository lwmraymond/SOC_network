import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P29DetectionRulesWorkspace } from '../components/page-specific/P29DetectionRulesWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P29;

export default function P29DetectionRules() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P29DetectionRulesWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
