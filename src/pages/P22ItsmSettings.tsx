import { pageSpecById } from '../catalog/pageSpecs';
import { PageFrame } from '../components/PageFrame';
import { P22ItsmSettingsWorkspace } from '../components/page-specific/P22ItsmSettingsWorkspace';
import { usePrototypePage } from '../components/usePrototypePage';

const spec = pageSpecById.P22;

export default function P22ItsmSettings() {
  const page = usePrototypePage(spec.id);
  return (
    <PageFrame
      spec={spec}
      fixture={page.fixture}
      adapterError={page.adapterError}
      viewState={page.viewState}
      setViewState={page.setViewState}
    >
      {page.fixture && <P22ItsmSettingsWorkspace fixture={page.fixture} />}
    </PageFrame>
  );
}
