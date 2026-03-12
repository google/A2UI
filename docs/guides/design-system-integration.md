---
render_macros: false
---

# Integrating A2UI into an Existing Design System

This guide walks through adding A2UI to an **existing** Angular application that already uses a component library (like Angular Material). Instead of using the A2UI basic catalog, you'll wrap your own Material components as A2UI components — so agents generate UI that matches your design system.

> **Prerequisites**: An Angular 19+ application with a component library installed (this guide uses Angular Material). Familiarity with Angular components and dependency injection.

## Overview

Adding A2UI to an existing app involves four steps:

1. **Install** the A2UI Angular renderer and web_core packages
2. **Wrap** your existing components as A2UI custom components
3. **Register** them in a custom catalog
4. **Connect** to an A2A-compatible agent

The key insight: A2UI doesn't replace your design system — it wraps it. Your existing components become the rendering targets for agent-generated UI. Agents compose your Material buttons, cards, and inputs — not generic A2UI ones.

## Step 1: Install A2UI Packages

```bash
npm install @a2ui/angular @a2ui/web_core
```

The `@a2ui/angular` package provides:

- `DynamicComponent` — base class for wrapping your components as A2UI-compatible
- `Catalog` injection token — for providing your catalog to the renderer
- `configureChatCanvasFeatures()` — helper for wiring everything together

## Step 2: Wrap Your Components

Create A2UI wrappers around your existing Material components. Each wrapper extends `DynamicComponent` and delegates rendering to your Material component:

```typescript
// a2ui-catalog/material-button.ts
import { DynamicComponent } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { Component, computed, input } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'a2ui-mat-button',
  imports: [MatButton],
  template: `
    <button mat-raised-button [color]="resolvedColor()">
      {{ resolvedLabel() }}
    </button>
  `,
})
export class MaterialButton extends DynamicComponent<Types.CustomNode> {
  readonly label = input.required<any>();
  readonly color = input<any>();

  protected resolvedLabel = computed(() => this.resolvePrimitive(this.label()));
  protected resolvedColor = computed(() =>
    this.resolvePrimitive(this.color() ?? null) || 'primary'
  );
}
```

The wrapper is thin — it just maps A2UI properties to your Material component's API.

## Step 3: Register a Custom Catalog

Build a catalog from your wrapped components. You do **not** need to include the A2UI basic catalog — your design system provides the components:

```typescript
// a2ui-catalog/catalog.ts
import { Catalog } from '@a2ui/angular';
import { inputBinding } from '@angular/core';

// No DEFAULT_CATALOG spread — your Material components ARE the catalog
export const MATERIAL_CATALOG = {
  Button: {
    type: () => import('./material-button').then((r) => r.MaterialButton),
    bindings: ({ properties }) => [
      inputBinding('label', () => properties['label'] || ''),
      inputBinding('color', () => properties['color'] || undefined),
    ],
  },
  Card: {
    type: () => import('./material-card').then((r) => r.MaterialCard),
    bindings: ({ properties }) => [
      inputBinding('title', () => properties['title'] || undefined),
      inputBinding('subtitle', () => properties['subtitle'] || undefined),
    ],
  },
  // ... wrap more of your Material components
} as Catalog;
```

You can also mix approaches — use some basic catalog components alongside your custom ones:

```typescript
import { DEFAULT_CATALOG } from '@a2ui/angular';

export const MIXED_CATALOG = {
  ...DEFAULT_CATALOG,          // A2UI basic components as fallback
  Button: /* your Material button overrides the basic one */,
  Card: /* your Material card */,
} as Catalog;
```

The basic components are entirely optional. If your design system already covers what you need, expose only your own components.

## Step 4: Wire It Up

```typescript
// app.config.ts
import {
  configureChatCanvasFeatures,
  usingA2aService,
  usingA2uiRenderers,
} from '@a2a_chat_canvas/config';
import { MATERIAL_CATALOG } from './a2ui-catalog/catalog';
import { theme } from './theme';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... your existing providers (Material, Router, etc.)
    configureChatCanvasFeatures(
      usingA2aService(MyA2aService),
      usingA2uiRenderers(MATERIAL_CATALOG, theme),
    ),
  ],
};
```

## Step 5: Add the Chat Canvas

The chat canvas is the container where A2UI surfaces are rendered. Add it alongside your existing layout:

```html
<!-- app.component.html -->
<div class="app-layout">
  <!-- Your existing app content -->
  <mat-sidenav-container>
    <mat-sidenav>...</mat-sidenav>
    <mat-sidenav-content>
      <router-outlet />
    </mat-sidenav-content>
  </mat-sidenav-container>

  <!-- A2UI chat canvas -->
  <a2a-chat-canvas />
</div>
```

## What Changes, What Doesn't

| Aspect | Before A2UI | After A2UI |
|--------|------------|------------|
| Your existing pages | Material components | Material components (unchanged) |
| Agent-generated UI | Not possible | Rendered via your Material wrappers |
| Component library | Angular Material | Angular Material (unchanged) |
| Design consistency | Your theme | Your theme (agents use your components) |

Your existing app is untouched. A2UI adds a rendering layer where agents compose **your** components.

## Theming

Because agents render your Material components, theming is automatic — your existing Material theme applies. You can optionally map tokens for any A2UI basic components you include:

```typescript
// theme.ts
import { Theme } from '@a2ui/angular';

export const theme: Theme = {
  // Map your Material design tokens to A2UI
  // See the Theming guide for full details
};
```

See the [Theming Guide](theming.md) for complete theming documentation.

## Next Steps

- [Defining Your Own Catalog](defining-your-own-catalog.md) — Add specialized components to your catalog (Maps, Charts, YouTube, etc.)
- [Theming Guide](theming.md) — Deep dive into theming
- [Agent Development](agent-development.md) — Build agents that generate A2UI using your catalog
