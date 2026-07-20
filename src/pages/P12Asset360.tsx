import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { usePrototypePage } from '../components/usePrototypePage';
import { H01AssetDetailSurface } from '../workflows/H01AssetDetail';

const spec = pageSpecById.P12;

export default function P12Asset360() {
  const page = usePrototypePage(spec.id);
  const fixture = page.fixture;
  return <PageFrame spec={spec} fixture={fixture} adapterError={page.adapterError} viewState={page.viewState} setViewState={page.setViewState}>
    {fixture && <H01AssetDetailSurface fixture={fixture} />}
  </PageFrame>;
}
