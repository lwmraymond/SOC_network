import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { SecurityCommandCanvas } from '../components/differentiated/DashboardSurfaces';

const spec = pageSpecById.P01;

export default function P01SecurityOperationsOverview() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return (
    <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {fixture && <div className="pageComposition page-p01 differentiatedPage"><SecurityCommandCanvas fixture={fixture} /></div>}
    </PageFrame>
  );
}
