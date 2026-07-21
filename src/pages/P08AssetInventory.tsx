import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P08AssetInventoryWorkspace } from '../components/page-specific/P08AssetInventoryWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';
import { H15DeviceStatusViewSurface } from '../workflows/H15DeviceStatusView';

const spec = pageSpecById.P08;

export default function P08AssetInventory() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  const openDeviceStatus = () => {
    const next = new URLSearchParams(page.params);
    next.set('view', 'status');
    page.setParams(next, { replace: false });
  };

  return (
    <PageFrame
      spec={spec}
      fixture={fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {fixture && (page.params.get('view') === 'status'
        ? <H15DeviceStatusViewSurface fixture={fixture} />
        : <P08AssetInventoryWorkspace fixture={fixture} onOpenDeviceStatus={openDeviceStatus} />)}
    </PageFrame>
  );
}
