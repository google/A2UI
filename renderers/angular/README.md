# A2UI Angular Renderer

The Angular implementation of the A2UI framework, providing seamless integration of agent-generated UI into Angular applications.

## Getting Started

### Installation

```bash
npm install @a2ui/angular @a2ui/web_core
```

### Protocol Versioning

A2UI supports multiple protocol versions. To use a specific version, use the versioned import path:

```typescript
// Use the v0.9 implementation
import { A2uiRendererService, A2UI_RENDERER_CONFIG } from '@a2ui/angular/v0_9';
import { minimalCatalog } from '@a2ui/angular/v0_9';
```

## Basic Setup

Configure the renderer in your `app.config.ts` using the `A2UI_RENDERER_CONFIG` injection token:

```typescript
import { ApplicationConfig } from '@angular/core';
import { A2UI_RENDERER_CONFIG, A2uiRendererService, minimalCatalog } from '@a2ui/angular/v0_9';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: A2UI_RENDERER_CONFIG,
      useValue: {
        catalogs: [minimalCatalog],
        actionHandler: (action) => {
          console.log('Action received:', action);
        }
      }
    },
    A2uiRendererService
  ]
};
```

## Rendering Surfaces

Use the `a2ui-v09-component-host` component to render individual A2UI components within your application:

```typescript
import { Component } from '@angular/core';
import { ComponentHostComponent } from '@a2ui/angular/v0_9';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    <a2ui-v09-component-host
      surfaceId="my-surface-id"
      componentId="my-component-id"
    />
  `
})
export class AppComponent {}
```

## Core Concepts

- **A2uiRendererService**: The central service that manages the connection to the A2UI Message Processor and tracks surface state.
- **ComponentHostComponent**: A wrapper component that dynamically renders A2UI components based on the current surface model.
- **Catalogs**: Collections of Angular components mapped to A2UI component types.

## Security

> [!IMPORTANT]
> The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

**Developer Responsibility**: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.
