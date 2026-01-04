import { inputBinding } from '@angular/core';
import { Catalog, CatalogEntry, Types } from '@a2ui/nativescript';

export const NativeScriptCatalog: Catalog = {
  // Core components
  ['Button' as string]: {
    type: async () => (await import('./components/button.component')).ButtonComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  ['Text' as string]: {
    type: async () => (await import('./components/text.component')).TextComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  // Layout components
  ['Row' as string]: {
    type: async () => (await import('./components/row.component')).RowComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  ['Column' as string]: {
    type: async () => (await import('./components/column.component')).ColumnComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  // Container components
  ['Card' as string]: {
    type: async () => (await import('./components/card.component')).CardComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  ['List' as string]: {
    type: async () => (await import('./components/list.component')).ListComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  // Media components
  ['Image' as string]: {
    type: async () => (await import('./components/image.component')).ImageComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  // Form components
  ['TextField' as string]: {
    type: async () => (await import('./components/textfield.component')).TextFieldComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  // Utility components
  ['Spacer' as string]: {
    type: async () => (await import('./components/spacer.component')).SpacerComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  ['Divider' as string]: {
    type: async () => (await import('./components/divider.component')).DividerComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
  
  // Interactive components
  ['Menu' as string]: {
    type: async () => (await import('./components/menu/menu.component')).MenuComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  } as CatalogEntry<Types.AnyComponentNode>,
};
