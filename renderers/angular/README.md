# A2UI Angular Renderer

The `@a2ui/angular` package provides the Angular implementation for rendering A2UI surfaces, bridging the Agent-to-Agent (A2A) protocol to Angular-friendly components.

## Architecture & Versions

The package contains evolving architectures to support different A2UI specification versions:

-   **`v0_8`**: Initial approach utilizing dedicated, static Angular components for each element type (e.g., `<a2ui-button>`).
-   **`v0_9`**: Dynamic approach centering around a single generic host component (`ComponentHostComponent`) coupled with extensible `Catalog` registries. **This is the recommended architecture for modern integrations.**

---

## Getting Started (`v0_9`)

The `v0_9` model decouples rendering mechanics from static templates by binding model state dynamically through dynamic component allocation.

### 1. Register Components in a Catalog

Extend `AngularCatalog` or use preset catalogs like `MinimalCatalog`. Define your custom elements using a dynamic mapping:

```typescript
import { Injectable } from '@angular/core';
import { MinimalCatalog } from '@a2ui/angular/lib/v0_9/catalog/minimal/minimal-catalog';
import { CustomComponent } from './custom-component';

@Injectable({ providedIn: 'root' })
export class MyCatalog extends MinimalCatalog {
  constructor() {
    super();

    const customApi = {
      name: 'CustomComponent',
      schema: { ... }, // Zod schema spec
      component: CustomComponent,
    };

    const components = Array.from(this.components.values());
    components.push(customApi);

    // Merge custom registrations
    (this as any).components = new Map(components.map((c) => [c.name, c]));
  }
}
```

### 2. Provide Renderer Infrastructure

In your dashboard component or module providers tier, initialize the `A2uiRendererService` and declare the backing `AngularCatalog`:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { A2uiRendererService } from '@a2ui/angular/lib/v0_9/core/a2ui-renderer.service';
import { AngularCatalog } from '@a2ui/angular/lib/v0_9/catalog/types';
import { MyCatalog } from './my-catalog';

@Component({
  selector: 'app-dashboard',
  providers: [
    A2uiRendererService,
    { provide: AngularCatalog, useClass: MyCatalog },
  ]
})
```

### 3. Initialize Layout and Render

Prepare the service on load and supply the generic host targeting the source surface:

```typescript
export class DashboardComponent implements OnInit {
  private rendererService = inject(A2uiRendererService);
  surfaceId = 'dashboard-surface';

  ngOnInit() {
    this.rendererService.initialize();
  }

  onMessagesReceived(messages: any[]) {
    this.rendererService.processMessages(messages);
  }
}
```

Place the `<a2ui-v09-component-host>` component in your template pointing to the desired layout node:

```html
<a2ui-v09-component-host [surfaceId]="surfaceId" componentId="root">
</a2ui-v09-component-host>
```

---

## Building and Development

### Building the Package
Distributes the library bundle utilizing `ng-packagr` outputting to `./dist`:
```bash
npm run build
```

### Running the Demo
Starts a dev environment rendering local samples containing live inspectors reviewing data pipelines:
```bash
npm run demo
```

---

## Legal Notice

**Important**: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

**Developer Responsibility**: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.
