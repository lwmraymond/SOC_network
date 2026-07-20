import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { ResponseActionCommand } from '../components/differentiated/OperationalSurfaces';

const spec = pageSpecById.P06;

export default function P06ResponseActions() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return (
    <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
      {fixture && <div className="pageComposition page-p06 differentiatedPage"><ResponseActionCommand fixture={fixture} /></div>}
    </PageFrame>
  );
}
