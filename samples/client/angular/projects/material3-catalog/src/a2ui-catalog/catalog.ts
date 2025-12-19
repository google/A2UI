import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular';

export const MATERIAL3_CATALOG = {
  ...DEFAULT_CATALOG,
  Hello: () => import('./hello').then((c) => c.Hello),
  MdIcon: () => import('./md-icon').then(c => c.MdIcon),
  MdCheckbox: () => import('./md-checkbox').then(c => c.MdCheckbox),
  MdFilledButton: () => import('./md-filled-button').then(c => c.MdFilledButton),
} as Catalog;
