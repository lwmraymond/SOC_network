import {
  EuiBadge,
  EuiCallOut,
  EuiFieldSearch,
  EuiHeader,
  EuiHeaderLogo,
  EuiHeaderSectionItem,
  EuiPageTemplate,
} from '@elastic/eui';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { EventSearchPage } from './p07/EventSearchPage';

const nav = [
  ['Dashboard', '/dashboard/soc'],
  ['Cases', '/analyzer/cases'],
  ['Alerts', '/analyzer/alerts'],
  ['Event Search', '/analyzer/search'],
  ['Assets', '/devices/inventory'],
  ['ITSM', '/itsm/overview'],
  ['Runtime', '/runtime'],
  ['Settings', '/settings'],
] as const;

function Shell() {
  const location = useLocation();

  return (
    <div className="appShell">
      <header aria-label="Application header">
        <EuiHeader position="fixed">
          <EuiHeaderSectionItem>
            <EuiHeaderLogo iconType="logoElastic">SOC Operations</EuiHeaderLogo>
          </EuiHeaderSectionItem>
          <EuiHeaderSectionItem>
            <EuiFieldSearch
              compressed
              placeholder="Global search (prototype)"
              aria-label="Global search"
            />
          </EuiHeaderSectionItem>
          <EuiHeaderSectionItem>
            <EuiBadge color="hollow">{location.pathname}</EuiBadge>
          </EuiHeaderSectionItem>
        </EuiHeader>
      </header>

      <aside className="sidebar" aria-label="Primary navigation">
        {nav.map(([label, href]) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) => (isActive ? 'navItem active' : 'navItem')}
          >
            {label}
          </NavLink>
        ))}
      </aside>

      <div className="content">
        <Routes>
          <Route path="/analyzer/search" element={<EventSearchPage />} />
          <Route
            path="*"
            element={
              <EuiPageTemplate>
                <EuiPageTemplate.Section>
                  <EuiCallOut title="Implementation-gated route">
                    No page expansion is included in the P07 Gate wave.
                  </EuiCallOut>
                </EuiPageTemplate.Section>
              </EuiPageTemplate>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export function App() {
  return <Shell />;
}
