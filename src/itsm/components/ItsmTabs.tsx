import { EuiTab, EuiTabs } from '@elastic/eui';

export function ItsmTabs({ items, active, onChange }: { items: readonly string[]; active: string; onChange: (value: string) => void }) {
  return <EuiTabs size="s">{items.map((item) => <EuiTab key={item} isSelected={active === item} onClick={() => onChange(item)}>{item}</EuiTab>)}</EuiTabs>;
}
