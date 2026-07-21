import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P35DetectionNotesWorkspace } from '../components/page-specific/P35DetectionNotesWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P35;

export default function P35DetectionNotes() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P35DetectionNotesWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
