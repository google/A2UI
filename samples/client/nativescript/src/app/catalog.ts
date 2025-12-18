import { inputBinding } from '@angular/core';
import { Catalog, CatalogEntry } from '@a2ui/nativescript';
import { Types } from '@a2ui/lit/0.8';

export const NativeScriptCatalog: Catalog = {
  [Types.ComponentType.BUTTON]: {
    type: async () => (await import('./components/button.component')).ButtonComponent,
    bindings: (component) => [
      inputBinding('component', () => component),
      inputBinding('weight', () => component.weight ?? 'initial'),
    ],
  },
  // Add other components here
};
