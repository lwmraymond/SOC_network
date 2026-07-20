import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { ParentWorkflowLinks } from '../components/ParentWorkflowLinks';
import { CopilotEvidenceWorkspace } from '../components/differentiated/RemainingSurfaces';
import { usePrototypePage } from '../components/usePrototypePage';
import { H16CopilotEvidenceContextSurface } from '../workflows/H16CopilotEvidenceContext';
import { H17CopilotToolApprovalSurface } from '../workflows/H17CopilotToolApproval';

const spec = pageSpecById.P23;

export default function P23CopilotWorkspace() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  const panel = page.params.get('panel');
  return <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {fixture && <><ParentWorkflowLinks links={[{label:'H16 Evidence context',to:'/copilot?panel=evidence'},{label:'H17 Tool approval',to:'/copilot?panel=approval'}]} />{panel === 'evidence' ? <H16CopilotEvidenceContextSurface fixture={fixture} /> : panel === 'approval' ? <H17CopilotToolApprovalSurface fixture={fixture} /> : <CopilotEvidenceWorkspace fixture={fixture} />}</>}
  </PageFrame>;
}
