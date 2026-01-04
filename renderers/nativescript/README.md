# @a2ui/nativescript

A NativeScript Angular renderer for A2UI (Agent-to-User Interface). This package provides the core rendering infrastructure for displaying A2UI component trees in NativeScript applications.

## Installation

```bash
npm install @a2ui/nativescript
```

## Usage

### 1. Create a Component Catalog

Create a catalog that maps A2UI component types to your NativeScript Angular components:

```typescript
// catalog.ts
import { inputBinding } from '@angular/core';
import { Catalog, CatalogEntry } from '@a2ui/nativescript';

export const AppCatalog: Catalog = {
  ['Button']: {
    type: async () => (await import('./components/button.component')).ButtonComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  },
  ['Text']: {
    type: async () => (await import('./components/text.component')).TextComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  },
  ['Column']: {
    type: async () => (await import('./components/column.component')).ColumnComponent,
    bindings: (component) => [
      inputBinding('node', () => component),
    ],
  },
  // Add more component mappings as needed...
};
```

### 2. Provide the Catalog and Theme

In your application bootstrap, provide the `Catalog`, `Theme`, and `MessageProcessor`:

```typescript
// main.ts
import { bootstrapApplication } from '@nativescript/angular';
import { Catalog, Theme, MessageProcessor } from '@a2ui/nativescript';
import { AppCatalog } from './app/catalog';
import { appTheme } from './app/theme';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: Catalog, useValue: AppCatalog },
    { provide: Theme, useValue: appTheme },
    MessageProcessor,
  ],
});
```

### 3. Use the Renderer Directive

Use the `a2ui-renderer` directive to render A2UI component trees:

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { Renderer } from '@a2ui/nativescript';

@Component({
  selector: 'ns-app',
  template: `
    <ng-container 
      a2ui-renderer 
      [surfaceId]="surfaceId" 
      [component]="rootComponent">
    </ng-container>
  `,
  imports: [Renderer],
})
export class AppComponent {
  surfaceId = 'main';
  rootComponent = {
    type: 'Column',
    id: 'root',
    children: [
      { type: 'Text', id: 'hello', text: 'Hello from A2UI!' },
    ],
  };
}
```

## Exports

The package exports the following:

### Rendering
- `Renderer` - The main directive for rendering A2UI components
- `Catalog` - Injection token for providing component mappings
- `CatalogEntry` - Type for catalog entries
- `DynamicComponent` - Base class for A2UI-compatible components
- `Theme` - Injection token for theming

### Data
- `MessageProcessor` - Service for processing A2UI messages and managing surface state

## Creating Components

Components should extend `DynamicComponent` and accept standard inputs:

```typescript
import { Component, input } from '@angular/core';
import { DynamicComponent } from '@a2ui/nativescript';
import { Types } from '@a2ui/lit/0.8';

@Component({
  selector: 'app-text',
  template: `<Label [text]="node().text"></Label>`,
})
export class TextComponent extends DynamicComponent<Types.TextNode> {
  readonly node = input.required<Types.TextNode>();
}
```
