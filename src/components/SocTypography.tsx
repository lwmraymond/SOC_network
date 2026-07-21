import { EuiText } from '@elastic/eui';
import type { ReactNode } from 'react';

export type SocTextRole = 'body' | 'supporting' | 'label' | 'metadata' | 'eyebrow';

const rolePresentation: Record<SocTextRole, { size: 's' | 'xs'; color?: 'subdued' }> = {
  body: { size: 's' },
  supporting: { size: 's', color: 'subdued' },
  label: { size: 'xs' },
  metadata: { size: 'xs', color: 'subdued' },
  eyebrow: { size: 'xs', color: 'subdued' },
};

export function SocText({ role = 'body', children, className }: {
  role?: SocTextRole;
  children: ReactNode;
  className?: string;
}) {
  const presentation = rolePresentation[role];
  return (
    <EuiText
      className={['socText', `socText--${role}`, className].filter(Boolean).join(' ')}
      size={presentation.size}
      color={presentation.color}
    >
      <p>{children}</p>
    </EuiText>
  );
}
