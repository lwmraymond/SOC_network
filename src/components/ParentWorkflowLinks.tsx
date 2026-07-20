import { EuiBadge, EuiPanel, EuiTitle } from '@elastic/eui';
import { Link, useLocation } from 'react-router-dom';
export function ParentWorkflowLinks({ title = 'Parent-owned workflows', links }: { title?: string; links: readonly { label: string; to: string }[] }) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const contextualize = (to: string) => {
    const target = new URL(to, 'https://prototype.local');
    if (target.pathname === location.pathname) return `${target.pathname}${target.search}${target.hash}`;
    target.searchParams.set('returnTo', returnTo);
    return `${target.pathname}${target.search}${target.hash}`;
  };
  return <EuiPanel paddingSize="s" className="workflowLinks"><EuiTitle size="xxs"><h2>{title}</h2></EuiTitle><div>{links.map((link)=><Link key={`${link.label}-${link.to}`} to={contextualize(link.to)}><EuiBadge color="hollow">{link.label}</EuiBadge></Link>)}</div></EuiPanel>;
}
