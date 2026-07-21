import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P34PlaybooksAutomationTemplatesWorkspace } from '../components/page-specific/P34PlaybooksAutomationTemplatesWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P34;

export default function P34PlaybooksAutomationTemplates() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P34PlaybooksAutomationTemplatesWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
