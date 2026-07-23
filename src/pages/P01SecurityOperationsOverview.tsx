import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P01SecurityOperationsWorkspace } from '../components/page-specific/P01SecurityOperationsWorkspace';
import { P01NetworkSocWorkspace } from '../components/page-specific/P01NetworkSocWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';
import { useLocation } from 'react-router-dom';

const spec = pageSpecById.P01;

export default function P01SecurityOperationsOverview() {
  const page = usePrototypePage(spec.id);
  const location = useLocation();
  const networkView = location.pathname === '/dashboard/network-soc';
  const activeSpec = networkView ? {
    ...spec,
    title: 'Network SOC',
    route: '/dashboard/network-soc',
    archetype: 'Network Risk Decisions + Evidence Handoff',
    primaryAction: 'Create incident ticket',
  } : spec;
  return (
    <PageFrame
      spec={activeSpec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && (networkView ? <P01NetworkSocWorkspace fixture={page.fixture} /> : <P01SecurityOperationsWorkspace fixture={page.fixture} />)}
    </PageFrame>
  );
}
