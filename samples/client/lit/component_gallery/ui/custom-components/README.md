# A2UI Custom Component Integration Guide

This directory contains custom Lit components that extend the A2UI standard catalog. They are registered in `register-components.ts` and rendered when the agent sends a matching component type.

## Components

### Chart (`chart.ts`)

Interactive chart component — the Lit counterpart to the Angular RIZZcharts Chart.

**Features:**
- Chart types: `pie`, `doughnut`, `bar`
- One-level drill-down: click a wedge/bar or legend label to view sub-data
- Back button to return to the root view
- On-wedge percentage labels (pie/doughnut only, via `chartjs-plugin-datalabels`)
- Data binding via path references or literal arrays

**Dependencies:** `chart.js`, `chartjs-plugin-datalabels`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `chartType` | `"pie" \| "doughnut" \| "bar"` | The type of chart to render |
| `chartTitle` | `StringValue` | Title displayed above the chart |
| `chartData` | `{ path } \| { literalArray }` | Array of `{ label, value, drillDown? }` items |

**Data format example:**

```json
{
  "chartType": "pie",
  "chartTitle": { "literalString": "Sales by Category" },
  "chartData": {
    "path": "myData/salesData"
  }
}
```

Where the data model contains:

```json
[
  {
    "label": "Apparel",
    "value": 41,
    "drillDown": [
      { "label": "Tops", "value": 31 },
      { "label": "Bottoms", "value": 38 }
    ]
  },
  { "label": "Health", "value": 10 }
]
```

Items without `drillDown` are leaf nodes — clicking them does nothing.

### OrgChart (`org-chart.ts`)

Displays an organizational hierarchy as a vertical chain of nodes with arrows.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `chain` | `Array<{ title, name }>` | Hierarchy nodes from top to bottom |
| `action` | `Action` | A2UI action dispatched when a node is clicked |

Clicking a node dispatches a `StateEvent` with `clickedNodeTitle` and `clickedNodeName` in the action context.

### PremiumTextField (`premium-text-field.ts`)

Demonstrates the **standard component override** pattern. Registered as `"TextField"`, it replaces the default text field with a custom-styled version that shows a "Custom" badge.

**Properties:** Same as standard `TextField` (`label`, `text`).

### WebFrame (`web-frame.ts`)

Sandboxed iframe wrapper for embedding external content.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `url` | `string` | URL to load in the iframe |
| `html` | `string` | Inline HTML to render |
| `height` | `number` | Frame height in pixels |
| `interactionMode` | `"readOnly" \| "interactive"` | Controls user interaction |
| `allowedEvents` | `string[]` | Event names allowed via postMessage bridge |

## Creating a Custom Component

Create a new Lit component file in this directory extending `Root`:

```typescript
import { html, css } from "lit";
import { property } from "lit/decorators.js";
import { Root } from "@a2ui/lit/ui";

export class MyComponent extends Root {
  @property() accessor myProp: string = "Default";

  static styles = [
    ...Root.styles, // Always inherit base styles
    css`
      :host {
        display: block;
        padding: 16px;
        border: 1px solid #ccc;
      }
    `,
  ];

  render() {
    return html`
      <div>
        <h2>My Custom Component</h2>
        <p>Prop value: ${this.myProp}</p>
      </div>
    `;
  }
}
```

**Do not** use the `@customElement()` decorator — the registry handles element definition.

### Resolving Path-Based Properties

Properties may arrive as literal values or as `{ path: "..." }` references to the data model. Detect and resolve them manually:

```typescript
render() {
  let data = this.myData;

  // If it's a path reference, resolve via the processor
  const asAny = this.myData as any;
  if (asAny && typeof asAny === 'object' && 'path' in asAny && asAny.path) {
    if (this.processor) {
      const resolved = this.processor.getData(
        this.component, asAny.path, this.surfaceId ?? 'default'
      );
      if (resolved) data = resolved;
    }
  }

  // The model processor converts nested objects to Maps — handle both
  if (data instanceof Map) {
    const entries = Array.from(data.entries());
    entries.sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
    data = entries.map(e => e[1]);
  }
}
```

## Registering the Component

Update `register-components.ts` to register your new component. You must pass a type name, the class, a tag name, and an optional JSON schema:

```typescript
import { componentRegistry } from "@a2ui/lit/ui";
import { MyComponent } from "./my-component.js";

componentRegistry.register("MyComponent", MyComponent, "my-component", {
  type: "object",
  properties: {
    myProp: {
      type: "string",
      description: "A sample property.",
    },
  },
  required: ["myProp"],
});
```

The registration function is called once at startup from `client.ts`:

```typescript
import { registerContactComponents } from "./ui/custom-components/register-components.js";
registerContactComponents();
```

When the agent sends `{ "MyComponent": { "myProp": "Hello" } }`, the renderer looks up the registry, creates a `<my-component>` element, and assigns properties.

## Overriding Standard Components

You can replace standard A2UI components (like `TextField`, `Video`, `Button`) with your own custom implementations.

1. **Create your component** extending `Root` (same as a custom component).
2. **Accept the standard properties** for that component type (e.g., `label` and `text` for `TextField`).
3. **Register it using the standard type name:**

```typescript
componentRegistry.register(
  "TextField",           // Standard type name — overrides default
  MyPremiumTextField,
  "my-premium-textfield"
);
```

When the server sends a `TextField` component, the client will now render `<my-premium-textfield>` instead of the default `<a2ui-textfield>`.

## Adding to the Gallery

To make the component appear in the Component Gallery:

1. **Agent side** (`gallery_examples.py`): Add demo data to `gallery_data_content` and a surface via `add_demo_surface()`:

    ```python
    add_demo_surface("demo-my-component", {
        "MyComponent": {
            "myProp": {"literalString": "Hello World"},
        }
    })
    ```

2. **Client side** (`component-gallery.ts`): Add an entry to the `DEMO_ITEMS` array:

    ```typescript
    { id: "demo-my-component", title: "MyComponent", description: "My custom component." },
    ```

## Verify

You can verify the component by creating a simple HTML test file (see `test/` directory for examples) or by sending a server message with the new component type.

**Server message example:**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [{
      "id": "comp-1",
      "component": {
        "MyComponent": {
          "myProp": { "literalString": "Hello World" }
        }
      }
    }]
  }
}
```

## Troubleshooting

- **`NotSupportedError: constructor has already been used`**: Remove the `@customElement()` decorator from your component class — the registry handles element definition via `customElements.define()`.
- **Component not rendering**: Check that `registerContactComponents()` is called in `client.ts`. Verify the tag name in the DOM matches what you registered.
- **Styles missing**: Ensure `static styles` includes `...Root.styles`.
- **Path data returns null**: Verify the surface has a `dataModelUpdate` with the data, and that the path matches (e.g., `galleryData/myField`). Check that `this.processor` and `this.surfaceId` are set (they are assigned by `renderCustomComponent` in the renderer).
- **Nested objects are Maps**: The model processor converts JSON objects to `Map` instances internally. Use `instanceof Map` checks and `.get(key)` instead of property access.
