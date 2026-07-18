type EuiSvgIconComponent = import('react').ComponentType<
  import('react').SVGProps<SVGSVGElement> & { title?: string; titleId?: string }
>;

declare module '@elastic/eui/es/components/icon/icon.js' {
  export function appendIconComponentCache(
    iconTypeToIconComponentMap: Record<string, import('react').ComponentType>,
  ): void;
}

declare module '@elastic/eui/es/components/icon/assets/arrow_down.js' {
  export const icon: EuiSvgIconComponent;
}

declare module '@elastic/eui/es/components/icon/assets/cross.js' {
  export const icon: EuiSvgIconComponent;
}

declare module '@elastic/eui/es/components/icon/assets/lock.js' {
  export const icon: EuiSvgIconComponent;
}

declare module '@elastic/eui/es/components/icon/assets/logo_elastic.js' {
  export const icon: EuiSvgIconComponent;
}

declare module '@elastic/eui/es/components/icon/assets/search.js' {
  export const icon: EuiSvgIconComponent;
}
