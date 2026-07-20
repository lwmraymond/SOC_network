import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon.js';
import { icon as arrowDown } from '@elastic/eui/es/components/icon/assets/arrow_down.js';
import { icon as arrowLeft } from '@elastic/eui/es/components/icon/assets/arrow_left.js';
import { icon as arrowRight } from '@elastic/eui/es/components/icon/assets/arrow_right.js';
import { icon as arrowUp } from '@elastic/eui/es/components/icon/assets/arrow_up.js';
import { icon as check } from '@elastic/eui/es/components/icon/assets/check.js';
import { icon as checkInCircleFilled } from '@elastic/eui/es/components/icon/assets/checkInCircleFilled.js';
import { icon as cross } from '@elastic/eui/es/components/icon/assets/cross.js';
import { icon as error } from '@elastic/eui/es/components/icon/assets/error.js';
import { icon as info } from '@elastic/eui/es/components/icon/assets/info.js';
import { icon as lock } from '@elastic/eui/es/components/icon/assets/lock.js';
import { icon as logoElastic } from '@elastic/eui/es/components/icon/assets/logo_elastic.js';
import { icon as search } from '@elastic/eui/es/components/icon/assets/search.js';
import { icon as sortAscending } from '@elastic/eui/es/components/icon/assets/sortAscending.js';
import { icon as sortDescending } from '@elastic/eui/es/components/icon/assets/sortDescending.js';
import { icon as sortDown } from '@elastic/eui/es/components/icon/assets/sort_down.js';
import { icon as sortUp } from '@elastic/eui/es/components/icon/assets/sort_up.js';
import { icon as sortable } from '@elastic/eui/es/components/icon/assets/sortable.js';
import { icon as warning } from '@elastic/eui/es/components/icon/assets/warning.js';

export const registeredEuiIcons = {
  arrowDown,
  arrowLeft,
  arrowRight,
  arrowUp,
  check,
  checkInCircleFilled,
  cross,
  error,
  info,
  lock,
  logoElastic,
  search,
  sortAscending,
  sortDescending,
  sortDown,
  sortUp,
  sortable,
  warning,
} as const;

appendIconComponentCache(registeredEuiIcons);
