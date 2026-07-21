declare module '@elastic/eui/es/components/icon/icon.js' {
  import type { ComponentType, SVGProps } from 'react';
  export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
  export function appendIconComponentCache(icons: Record<string, IconComponent>): void;
}
declare module '@elastic/eui/es/components/icon/assets/*.js' {
  import type { ComponentType, SVGProps } from 'react';
  export const icon: ComponentType<SVGProps<SVGSVGElement>>;
}
