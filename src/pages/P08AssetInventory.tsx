import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { ParentWorkflowLinks } from '../components/ParentWorkflowLinks';
import { AssetInventoryWorkspace } from '../components/differentiated/OperationalSurfaces';
import { H15DeviceStatusViewSurface } from '../workflows/H15DeviceStatusView';

const spec = pageSpecById.P08;

export default function P08AssetInventory() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return (
    <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {fixture && <div className="pageComposition page-p08 differentiatedPage"><ParentWorkflowLinks links={[{label:'H15 Device status view',to:'/devices/inventory?view=status'}]} />{page.params.get('view') === 'status' ? <H15DeviceStatusViewSurface fixture={fixture} /> : <AssetInventoryWorkspace fixture={fixture} />}</div>}
    </PageFrame>
  );
}
