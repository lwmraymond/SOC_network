import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P03PlatformHealthWorkspace } from '../components/page-specific/P03PlatformHealthWorkspace';
import { P03SystemOverviewWorkspace } from '../components/page-specific/P03SystemOverviewWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';
import { useLocation } from 'react-router-dom';

const spec = pageSpecById.P03;

export default function P03PlatformHealth() {
  const page = usePrototypePage(spec.id);
  const location = useLocation();
  const systemView = location.pathname === '/dashboard/system-overview';
  const activeSpec = systemView ? {
    ...spec,
    title: 'System Overview',
    route: '/dashboard/system-overview',
    archetype: 'System Resources + Queues + Runtime Dependencies',
    primaryAction: 'Open resource explorer',
  } : spec;
  return (
    <PageFrame
      spec={activeSpec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && (systemView ? <P03SystemOverviewWorkspace fixture={page.fixture} /> : <P03PlatformHealthWorkspace fixture={page.fixture} />)}
    </PageFrame>
  );
}
