# Integrating A2UI into an Existing Design System

This guide walks through adding A2UI to an **existing** Angular application that already uses a component library (like Angular Material). By the end, your app will render agent-generated UI alongside your existing components.

> **Prerequisites**: An Angular 19+ application with a component library installed (this guide uses Angular Material). Familiarity with Angular components and dependency injection.

## Overview

Adding A2UI to an existing app involves four steps:

1. **Install** the A2UI Angular renderer and web_core packages
2. **Register** a component catalog (standard or custom)
3. **Wire** the A2UI renderer into your app
4. **Connect** to an A2A-compatible agent

The key insight: A2UI doesn't replace your design system — it extends it. Your existing components stay exactly as they are. A2UI adds a rendering layer that translates agent-generated JSON into Angular components from a registered catalog.

## Step 1: Install A2UI Packages

```bash
npm install @a2ui/angular @a2ui/web_core
```

The `@a2ui/angular` package provides:

- `DynamicComponent` — base class for A2UI-compatible components
- `DEFAULT_CATALOG` — the standard catalog (Text, Button, TextField, etc.)
- `Catalog` injection token — for providing your catalog to the renderer
- `configureChatCanvasFeatures()` — helper for wiring everything together

## Step 2: Register a Catalog

A **catalog** maps component names (strings the agent uses) to Angular component classes. Start with the default catalog:

```typescript
// app.config.ts
import {
  configureChatCanvasFeatures,
  usingA2aService,
  usingA2uiRenderers,
} from '@a2a_chat_canvas/config';
import { DEFAULT_CATALOG } from '@a2ui/angular';
import { theme } from './theme';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... your existing providers (Material, Router, etc.)
    configureChatCanvasFeatures(
      usingA2aService(MyA2aService),
      usingA2uiRenderers(DEFAULT_CATALOG, theme),
    ),
  ],
};
```

The `DEFAULT_CATALOG` includes all standard A2UI components: Text, Button, TextField, Image, Card, Row, Column, Tabs, Modal, Slider, CheckBox, MultipleChoice, DateTimeInput, Divider, Icon, Video, and AudioPlayer.

## Step 3: Add the Chat Canvas

The chat canvas is the container where A2UI surfaces are rendered. Add it to your layout:

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

The chat canvas handles:

- Displaying agent messages and A2UI surfaces
- User input and message sending
- Surface lifecycle (create, update, delete)

## Step 4: Connect to an Agent

Create a service that implements the A2A connection:

```typescript
// services/a2a.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MyA2aService {
  private readonly agentUrl = 'http://localhost:8000';

  async sendMessage(message: string, sessionId: string) {
    // Send message to your A2A agent
    // The agent responds with A2UI messages that the renderer handles
  }
}
```

See the [A2A JavaScript SDK](https://github.com/a2aproject/a2a-js) for the full client implementation.

## What Changes, What Doesn't

| Aspect | Before A2UI | After A2UI |
|--------|------------|------------|
| Your existing pages | Material components | Material components (unchanged) |
| Agent-generated UI | Not possible | Rendered via A2UI catalog |
| Component library | Angular Material | Angular Material + A2UI standard catalog |
| Routing | Your routes | Your routes + chat canvas overlay |
| Theming | Material theme | Material theme + A2UI theme tokens |

Your existing app is untouched. A2UI adds a parallel rendering path for agent-generated content.

## Theming

A2UI components respect your Material theme through CSS custom properties. Create a theme that maps your Material tokens to A2UI:

```typescript
// theme.ts
import { Theme } from '@a2ui/angular';

export const theme: Theme = {
  // Map your Material design tokens to A2UI
  // See the Theming guide for full details
};
```

See the [Theming Guide](theming.md) for complete theming documentation.

## Working Example

The [design-system-upgrade sample](https://github.com/google/a2ui/tree/main/samples/client/angular/projects/design-system-upgrade) demonstrates this integration end-to-end:

- Angular Material app with navigation, cards, and a carousel
- A2UI added alongside existing components
- Custom theme mapping Material tokens to A2UI
- Connected to a sample A2A agent

## Next Steps

- [Defining Your Own Catalog](defining-your-own-catalog.md) — Add your own components to the catalog (Maps, Charts, YouTube, etc.)
- [Theming Guide](theming.md) — Deep dive into theming A2UI with your design system
- [Agent Development](agent-development.md) — Build agents that generate A2UI
- [Renderer Development](renderer-development.md) — Understand the rendering architecture
