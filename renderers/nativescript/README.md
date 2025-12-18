# @a2ui/nativescript

This is a NativeScript renderer for A2UI.

## Usage

1.  Install the package (once published or linked).
2.  Implement the `Catalog` abstract class to map A2UI components to NativeScript Angular components.
3.  Provide the `Catalog` implementation in your application.
4.  Use the `a2ui-renderer` directive to render components.

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { Renderer } from '@a2ui/nativescript';

@Component({
  selector: 'ns-app',
  template: `
    <ng-container a2ui-renderer [surfaceId]="surfaceId" [component]="component"></ng-container>
  `,
  imports: [Renderer],
})
export class AppComponent {
  // ...
}
```
