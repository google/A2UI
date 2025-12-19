import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular';
import { inputBinding } from '@angular/core';

export const MATERIAL3_CATALOG = {
  ...DEFAULT_CATALOG,
  Hello: () => import('./hello').then((c) => c.Hello),
  MdIcon: {
    type: () => import('./md-icon').then(c => c.MdIcon),
    bindings: ({ properties }) => [
      inputBinding('fontSet', () => ('fontSet' in properties && properties['fontSet']) || undefined),
      inputBinding('fontIcon', () => ('fontIcon' in properties && properties['fontIcon']) || undefined),
    ],
  },
  MdCheckbox: {
    type: () => import('./md-checkbox').then(c => c.MdCheckbox),
    bindings: ({ properties }) => [
      inputBinding('label', () => ('label' in properties && properties['label']) || undefined),
      inputBinding('checked', () => ('checked' in properties && properties['checked']) ?? undefined),
      inputBinding('indeterminate', () => ('indeterminate' in properties && properties['indeterminate']) ?? undefined),
      inputBinding('required', () => ('required' in properties && properties['required']) ?? undefined),
      inputBinding('value', () => ('value' in properties && properties['value']) || undefined),
      inputBinding('disabled', () => ('disabled' in properties && properties['disabled']) ?? undefined),
    ],
  },
  MdFilledButton: {
    type: () => import('./md-filled-button').then(c => c.MdFilledButton),
    bindings: ({ properties }) => [
      inputBinding('label', () => ('label' in properties && properties['label']) || undefined),
      inputBinding('disabled', () => ('disabled' in properties && properties['disabled']) ?? undefined),
      inputBinding('softDisabled', () => ('softDisabled' in properties && properties['softDisabled']) ?? undefined),
      inputBinding('href', () => ('href' in properties && properties['href']) || undefined),
      inputBinding('target', () => ('target' in properties && properties['target']) || undefined),
      inputBinding('trailingIcon', () => ('trailingIcon' in properties && properties['trailingIcon']) ?? undefined),
      inputBinding('hasIcon', () => ('hasIcon' in properties && properties['hasIcon']) ?? undefined),
      inputBinding('type', () => ('type' in properties && properties['type']) || undefined),
    ],
  },
} as Catalog;
