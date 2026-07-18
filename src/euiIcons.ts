import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon.js';
import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down.js';
import { icon as cross } from '@elastic/eui/es/components/icon/assets/cross.js';
import { icon as lock } from '@elastic/eui/es/components/icon/assets/lock.js';
import { icon as logoElastic } from '@elastic/eui/es/components/icon/assets/logo_elastic.js';
import { icon as search } from '@elastic/eui/es/components/icon/assets/search.js';

/**
 * EUI 106 dynamically imports icons using extensionless paths. Vite dependency
 * pre-bundling generates a map whose keys include `.js`, so runtime lookups can
 * miss and reject. Pre-register every icon required by the shell and P07 gate
 * before React renders. Add future page icons here as explicit dependencies.
 */
export const registeredEuiIcons = {
  arrowDown,
  cross,
  lock,
  logoElastic,
  search,
} as const;

appendIconComponentCache(registeredEuiIcons);
