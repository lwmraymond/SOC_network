import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P30EventSchemasContractsWorkspace } from '../components/page-specific/P30EventSchemasContractsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P30;

export default function P30EventSchemasContracts() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame spec={spec} fixture={page.fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {page.fixture && <P30EventSchemasContractsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
