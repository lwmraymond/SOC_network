import { EuiBadge, EuiPanel, EuiTitle } from '@elastic/eui';
import type { PrototypeRow } from '../types/prototype';
export function CalendarPanel({ title, rows }: { title: string; rows: PrototypeRow[] }) {
  return <EuiPanel paddingSize="m" data-visual-region="calendar"><EuiTitle size="xs"><h2>{title}</h2></EuiTitle><div className="calendarGrid" role="grid" aria-label={title}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day,index)=><div role="gridcell" key={day}><strong>{day}</strong>{rows.slice(index,index+3).map((row)=><span key={row.id}><EuiBadge color={row.severity==='Critical'?'danger':'hollow'}>{row.id}</EuiBadge><small>{row.status}</small></span>)}</div>)}</div></EuiPanel>;
}
