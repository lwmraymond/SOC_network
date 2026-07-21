import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P20ItsmAnalyticsWorkspace } from '../components/page-specific/P20ItsmAnalyticsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P20;

export default function P20ItsmAnalytics() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P20ItsmAnalyticsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
