# Custom Components

Extend A2UI with your own components — maps, charts, video players, or anything your application needs.

## Why Custom Components?

The A2UI Standard Catalog covers common UI elements (text, buttons, inputs, layout), but real applications need specialized components:

- **Maps**: Google Maps, Mapbox, Leaflet
- **Charts**: Chart.js, D3, Recharts
- **Media**: YouTube embeds, audio visualizers, 3D viewers
- **Domain-specific**: Stock tickers, medical imaging, CAD viewers

Custom components let agents generate UI that includes **any** component your app supports — not just what's in the standard catalog.

!!! tip "Already have a component library?"
    If you're adding A2UI to an existing app with its own design system (Material, Ant Design, PrimeNG, etc.), start with the [Design System Integration](design-system-integration.md) guide first — it walks through wiring A2UI into your app before adding custom components.

## How It Works

```
Agent ──generates──> A2UI JSON ──references──> "GoogleMap" component
                                                    │
Client ──registers──> Catalog { GoogleMap: ... } ───┘
                                                    │
Angular ──renders──> <a2ui-map [zoom]="..." />  <───┘
```

1. You **implement** an Angular component that extends `DynamicComponent`
2. You **register** it in a catalog alongside standard components
3. The agent **references** it by name in `updateComponents` messages
4. The A2UI renderer **instantiates** your component with the agent's properties

## Step-by-Step: Adding a YouTube Component

Let's add a YouTube video player as a custom A2UI component.

### 1. Create the Component

Custom components extend `DynamicComponent<Types.CustomNode>` from `@a2ui/angular`:

```typescript
// a2ui-catalog/youtube.ts
import { DynamicComponent } from '@a2ui/angular';
import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Types from '@a2ui/web_core/types/types';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'a2ui-youtube',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    :host {
      display: block;
      flex: var(--weight);
      padding: 8px;
    }
    .video-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      border-radius: 8px;
      overflow: hidden;
    }
    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
    h3 {
      margin: 8px 0 4px;
      color: var(--mat-sys-on-surface);
    }
  `,
  template: `
    @if (resolvedVideoId()) {
      @if (resolvedTitle()) {
        <h3>{{ resolvedTitle() }}</h3>
      }
      <div class="video-container">
        <iframe
          [src]="safeUrl()"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    }
  `,
})
export class YouTube extends DynamicComponent<Types.CustomNode> {
  readonly videoId = input.required<Primitives.StringValue | null>();
  protected readonly resolvedVideoId = computed(() =>
    this.resolvePrimitive(this.videoId()),
  );

  readonly title = input<Primitives.StringValue | null>();
  protected readonly resolvedTitle = computed(() =>
    this.resolvePrimitive(this.title() ?? null),
  );

  protected readonly safeUrl = computed(() => {
    const id = this.resolvedVideoId();
    if (!id) return null;
    const url = `https://www.youtube.com/embed/${id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  constructor(private sanitizer: DomSanitizer) {
    super();
  }
}
```

**Key patterns:**

- Extend `DynamicComponent<Types.CustomNode>` for custom component types
- Use `input()` for properties the agent will set
- Use `resolvePrimitive()` to resolve values that may be literals or data-bound paths
- Use `computed()` for reactive derivations

### 2. Register in the Catalog

Add your component to the catalog alongside standard components:

```typescript
// a2ui-catalog/catalog.ts
import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular';
import { inputBinding } from '@angular/core';

export const MY_CATALOG = {
  ...DEFAULT_CATALOG,  // Optionally include A2UI basic catalog components

  YouTube: {
    type: () => import('./youtube').then((r) => r.YouTube),
    bindings: ({ properties }) => [
      inputBinding('videoId', () =>
        ('videoId' in properties && properties['videoId']) || undefined
      ),
      inputBinding('title', () =>
        ('title' in properties && properties['title']) || undefined
      ),
    ],
  },
} as Catalog;
```

**What's happening:**

- `...DEFAULT_CATALOG` — spread the standard catalog so agents can use standard components too
- `type` — lazy-loaded import of your component class
- `bindings` — maps properties from the A2UI JSON to Angular `@Input()` values

### 3. Use the Custom Catalog

Update your app config to use your custom catalog instead of the default:

```typescript
// app.config.ts
import { MY_CATALOG } from './a2ui-catalog/catalog';

export const appConfig: ApplicationConfig = {
  providers: [
    configureChatCanvasFeatures(
      usingA2aService(MyA2aService),
      usingA2uiRenderers(MY_CATALOG, theme),
    ),
  ],
};
```

### 4. Agent-Side: Using the Custom Component

The agent references your component by name in `updateComponents`:

```json
{
  "type": "updateComponents",
  "surfaceId": "main",
  "components": {
    "root": {
      "component": "Column",
      "properties": {},
      "childIds": ["vid1"]
    },
    "vid1": {
      "component": "YouTube",
      "properties": {
        "videoId": "dQw4w9WgXcQ",
        "title": "Check out this video"
      }
    }
  }
}
```

The agent knows about your custom components through the catalog configuration in its prompt or system instructions.

## More Examples

### Google Maps Component

A map component that displays pins from the agent's data model:

```typescript
// a2ui-catalog/google-map.ts
@Component({
  selector: 'a2ui-map',
  imports: [GoogleMapsModule],
  template: `
    <google-map [center]="resolvedCenter()" [zoom]="resolvedZoom()">
      @for (pin of resolvedPins(); track pin) {
        <map-advanced-marker [position]="pin" [title]="pin.name" />
      }
    </google-map>
  `,
})
export class GoogleMap extends DynamicComponent<Types.CustomNode> {
  readonly zoom = input.required<Primitives.NumberValue | null>();
  readonly center = input.required<{ path: string } | null>();
  readonly pins = input<{ path: string }>();

  protected resolvedZoom = computed(() => this.resolvePrimitive(this.zoom()));
  protected resolvedCenter = computed(() => this.resolveLatLng(this.center()));
  protected resolvedPins = computed(() => this.resolveLocations(this.pins()));
  // ... (resolve helpers iterate over data model paths)
}
```

**Catalog entry:**

```typescript
GoogleMap: {
  type: () => import('./google-map').then((r) => r.GoogleMap),
  bindings: ({ properties }) => [
    inputBinding('zoom', () => properties['zoom'] || 8),
    inputBinding('center', () => properties['center'] || undefined),
    inputBinding('pins', () => properties['pins'] || undefined),
    inputBinding('title', () => properties['title'] || undefined),
  ],
},
```

**Agent JSON:**

```json
{
  "component": "GoogleMap",
  "properties": {
    "zoom": 12,
    "center": { "path": "/mapCenter" },
    "pins": { "path": "/restaurants" },
    "title": "Nearby Restaurants"
  }
}
```

Maps uses **data binding** — the `center` and `pins` reference paths in the data model, so the agent can update locations dynamically via `updateDataModel`.

### Chart Component

A chart component using Chart.js:

```typescript
// a2ui-catalog/chart.ts
@Component({
  selector: 'a2ui-chart',
  imports: [BaseChartDirective],
  template: `
    <div class="chart-container">
      <h2>{{ resolvedTitle() }}</h2>
      <canvas
        baseChart
        [data]="currentData()"
        [type]="chartType()"
        [options]="chartOptions"
      ></canvas>
    </div>
  `,
})
export class Chart extends DynamicComponent<Types.CustomNode> {
  readonly type = input.required<string>();
  readonly title = input<Primitives.StringValue | null>();
  readonly chartData = input.required<Primitives.StringValue | null>();

  protected chartType = computed(() => this.type() as ChartType);
  protected resolvedTitle = computed(() => this.resolvePrimitive(this.title() ?? null));
  // ... (resolve chart data from data model paths)
}
```

**Catalog entry:**

```typescript
Chart: {
  type: () => import('./chart').then((r) => r.Chart),
  bindings: ({ properties }) => [
    inputBinding('type', () => properties['type'] || undefined),
    inputBinding('title', () => properties['title'] || undefined),
    inputBinding('chartData', () => properties['chartData'] || undefined),
  ],
},
```

### Any Component

The same pattern works for **any Angular component**. If you can build it as an Angular component, you can make it an A2UI custom component:

- **Carousel**: Wrap your carousel library, bind slides via data model paths
- **Code editor**: Monaco editor with syntax highlighting
- **3D viewer**: Three.js scene driven by agent data
- **Payment form**: Stripe Elements with A2UI event callbacks
- **PDF viewer**: Display documents the agent references

The pattern is always:

1. Extend `DynamicComponent<Types.CustomNode>`
2. Declare `input()` properties
3. Use `resolvePrimitive()` for data binding
4. Register in catalog with `inputBinding()` mappings

## Data Binding with Custom Components

Custom components can use A2UI's data binding system. Instead of literal values, properties can reference paths in the data model:

```json
{
  "component": "Chart",
  "properties": {
    "type": "pie",
    "title": "Sales by Region",
    "chartData": { "path": "/salesData" }
  }
}
```

The agent updates data separately via `updateDataModel`:

```json
{
  "type": "updateDataModel",
  "surfaceId": "main",
  "data": {
    "salesData": [
      { "label": "North America", "value": 45 },
      { "label": "Europe", "value": 30 },
      { "label": "Asia", "value": 25 }
    ]
  }
}
```

This separation means the agent can update chart data without re-sending the entire component tree.

## Agent Configuration

For agents to use your custom components, include the component definitions in the agent's prompt or catalog configuration:

```python
# Agent-side catalog config
catalog = CatalogConfig(
    catalog_id="my-custom-catalog",
    components={
        # Standard components are inherited
        "YouTube": {
            "description": "Embedded YouTube video player",
            "properties": {
                "videoId": "YouTube video ID (e.g., 'dQw4w9WgXcQ')",
                "title": "Optional title displayed above the video",
            },
        },
        "GoogleMap": {
            "description": "Interactive Google Map with pins",
            "properties": {
                "zoom": "Map zoom level (1-20)",
                "center": "Center coordinates (data model path)",
                "pins": "Array of pin locations (data model path)",
            },
        },
        "Chart": {
            "description": "Chart.js chart (pie, bar, line, doughnut)",
            "properties": {
                "type": "Chart type: pie, bar, line, doughnut",
                "title": "Chart title",
                "chartData": "Chart data (data model path)",
            },
        },
    },
)
```

## Working Examples

- [**rizzcharts**](https://github.com/google/a2ui/tree/main/samples/client/angular/projects/rizzcharts) — Chart.js + Google Maps custom components
- [**custom-components**](https://github.com/google/a2ui/tree/main/samples/client/angular/projects/custom-components) — YouTube + Maps + Charts starter sample

## Next Steps

- [Design System Integration](design-system-integration.md) — Add A2UI to an existing Material app
- [Theming Guide](theming.md) — Style custom components with your design system
- [Agent Development](agent-development.md) — Build agents that use custom components
