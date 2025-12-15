# Custom Component Catalogs

Extend A2UI by defining **custom catalogs** that include your own components. This guide shows you how to register custom widgets in your client application and have agents use them by referencing your catalog.

## Why Custom Catalogs?

The A2UI Standard Catalog provides common UI elements (buttons, text fields, etc.), but your application might need specialized components:

- **Domain-specific widgets**: Stock tickers, medical charts, CAD viewers
- **Third-party integrations**: Google Maps, payment forms, chat widgets
- **Brand-specific components**: Custom date pickers, product cards, dashboards

Custom catalogs allow agents and clients to agree on a shared, extended set of components while maintaining security and type safety.

## How Custom Catalogs Work

1.  **Client Defines Catalog**: You create a catalog definition and register the corresponding component implementations in your client app.
2.  **Client Announces Support**: The client informs the agent which catalogs it supports, including your custom one.
3.  **Agent Selects Catalog**: The agent chooses your custom catalog for a given UI surface.
4.  **Agent Generates UI**: The agent generates `surfaceUpdate` messages using components from your catalog *by name*.

```
┌─────────────────────────────────────────────────────┐
│              Agent (Server Side)                    │
│                                                     │
│  1. Chooses "my-company-catalog"                    │
│  2. Generates a component from that catalog:        │
│  {                                                  │
│    "id": "map",                                     │
│    "component": {                                  │
│      "GoogleMap": {                                │
│        "center": {"lat": 37.7749, "lng": -122.43}, │
│        "zoom": 12                                  │
│      }                                             │
│    }                                               │
│  }                                                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ A2UI Message
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Client Application                     │
│                                                     │
│  Widget Registry knows how to render components     │
│  from "my-company-catalog":                         │
│  {                                                  │
│    "GoogleMap": GoogleMapComponent ← Your code     │
│  }                                                  │
│                                                     │
│  Renderer sees the "GoogleMap" component and       │
│  instantiates your implementation.                 │
└─────────────────────────────────────────────────────┘
```

## Registering Custom Components (Web)

### Lit / Web Components

```typescript
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { componentRegistry, registerCustomComponents } from '@a2ui/web-lib/ui';

// 1. Define your custom component class.
//    The component name (e.g., 'GoogleMap') is inferred from the registration.
class GoogleMapComponent extends LitElement {
  @property({ type: Object }) center = { lat: 0, lng: 0 };
  @property({ type: Number }) zoom = 10;

  static styles = css`
    :host { display: block; width: 100%; height: 400px; background-color: #f0f0f0; }
    #map { width: 100%; height: 100%; }
  `;

  render() {
    return html`<div id="map"></div>`;
  }

  firstUpdated() {
    // Initialize Google Maps (placeholder logic)
    console.log(`Initializing GoogleMap at ${this.center.lat},${this.center.lng} with zoom ${this.zoom}`);
    // new google.maps.Map(this.shadowRoot.getElementById('map'), { center: this.center, zoom: this.zoom });
  }
}

// 2. Register the custom component with A2UI.
//    The string key 'GoogleMap' is the name the agent will use in A2UI messages.
registerCustomComponents({
  GoogleMap: GoogleMapComponent,
});

// You can also access the registry directly if needed, but registerCustomComponents is preferred.
// console.log(componentRegistry.get('GoogleMap'));
```
### Angular

```typescript
// google-map.component.ts
import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-google-map',
  standalone: true,
  template: `<div #mapContainer style="width: 100%; height: 400px;"></div>`,
})
export class GoogleMapComponent implements OnInit {
  @Input() center: { lat: number; lng: number } = { lat: 0, lng: 0 };
  @Input() zoom: number = 10;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  ngOnInit() {
    // Initialize Google Maps (placeholder logic)
    console.log(`Initializing GoogleMap at ${
      this.center.lat
    },${this.center.lng} with zoom ${this.zoom}`);
    // new google.maps.Map(this.mapContainer.nativeElement, { center: this.center, zoom: this.zoom });
  }
}

// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideA2UI } from '@a2ui/angular';
import { GoogleMapComponent } from './google-map.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideA2UI({
      customComponents: [{ name: 'GoogleMap', type: GoogleMapComponent }]
    }),
  ],
};
```
### Flutter

```dart
import 'package:flutter/material.dart';
import 'package:flutter_genui/flutter_genui.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

// 1. Define your custom widget.
class GoogleMapWidget extends StatelessWidget {
  final Map<String, dynamic> properties;

  const GoogleMapWidget({super.key, required this.properties});

  @override
  Widget build(BuildContext context) {
    final lat = properties['center']['lat'] as double;
    final lng = properties['center']['lng'] as double;
    final zoom = (properties['zoom'] as num?)?.toDouble() ?? 10.0;

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: LatLng(lat, lng),
        zoom: zoom,
      ),
      // Other GoogleMap properties as needed
    );
  }
}

// 2. Register with GenUI by providing a customComponentRenderers map
//    to your GenUIScreen.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: GenUIScreen(
        agentUrl: 'https://your-agent-endpoint.com', // Your agent URL
        customComponentRenderers: {
          // The string key 'GoogleMap' is the name the agent will use.
          'GoogleMap': (context, properties) =>
              GoogleMapWidget(properties: properties),
        },
      ),
    );
  }
}
```

## Agent-Side: Using Components from a Custom Catalog

Once registered on the client, agents can use components from your custom catalog directly in `surfaceUpdate` messages. The agent will specify the `catalogId` in the `beginRendering` message to indicate which catalog its components belong to.

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "location-map",
        "component": {
          "GoogleMap": {
            "center": {"lat": 37.7749, "lng": -122.4194},
            "zoom": 13,
            "markers": [
              {
                "lat": 37.7749,
                "lng": -122.4194,
                "label": "Restaurant Location"
              }
            ]
          }
        }
      }
    ]
  }
}
```

## Data Binding in Custom Components

Custom components can use data binding just like standard components:

### Client (Web):

```typescript
class StockTickerComponent extends LitElement {
  static properties = {
    symbol: { type: String },    // Can be data-bound
    price: { type: Number },      // Can be data-bound
    change: { type: Number }      // Can be data-bound
  };

  render() {
    const color = this.change >= 0 ? 'green' : 'red';
    return html`
      <div class="ticker">
        <span class="symbol">${this.symbol}</span>
        <span class="price">$${this.price.toFixed(2)}</span>
        <span class="change" style="color: ${color}">
          ${this.change >= 0 ? '+' : ''}${this.change.toFixed(2)}%
        </span>
      </div>
    `;
  }
}
```

### Agent:

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "stock-ticker",
        "component": {
          "StockTicker": {
            "symbol": {"path": "/stock/symbol"},
            "price": {"path": "/stock/price"},
            "change": {"path": "/stock/change"}
          }
        }
      }
    ]
  }
}
```

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "/stock",
    "contents": [
      { "key": "symbol", "valueString": "GOOGL" },
      { "key": "price", "valueNumber": 142.50 },
      { "key": "change", "valueNumber": 2.3 }
    ]
  }
}
```

The ticker updates automatically when the data model changes!

## Handling User Actions

Custom components can emit actions:

### Client (Web):

```typescript
class PaymentFormComponent extends LitElement {
  handleSubmit(event) {
    event.preventDefault();

    // Emit A2UI action
    this.dispatchEvent(new CustomEvent('a2ui-action', {
      detail: {
        actionId: 'submit_payment',
        data: {
          amount: this.amount,
          cardNumber: this.cardNumber,
          // ... other fields
        }
      },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <form @submit=${this.handleSubmit}>
        <input type="text" .value=${this.cardNumber} />
        <button type="submit">Pay $${this.amount}</button>
      </form>
    `;
  }
}
```

### Agent receives:

```python
@agent.handle_action
async def handle_action(action: dict, context):
    if action['actionId'] == 'submit_payment':
        # Process payment
        payment_data = action['data']
        result = process_payment(payment_data)

        # Show confirmation
        yield {
            "surfaceUpdate": {
                "surfaceId": action['surfaceId'],
                "components": [{
                    "id": "confirmation",
                    "component": {
                        "Text": {
                            "text": {"literalString": "Payment successful!"}
                        }
                    }
                }]
            }
        }
```

## Security Considerations

### 1. Whitelist Components

Only register components you trust:

```typescript
// ✅ Good: Explicit whitelist
const customComponents = new Map([
  ['GoogleMap', GoogleMapComponent],
  ['StockTicker', StockTickerComponent],
  ['PaymentForm', PaymentFormComponent]
]);

// ❌ Bad: Dynamic registration from agent
// NEVER let agents register arbitrary components
```

### 2. Validate Properties

Always validate properties from agents:

```typescript
class GoogleMapComponent extends LitElement {
  set center(value) {
    // Validate
    if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number') {
      console.error('Invalid center:', value);
      this._center = { lat: 0, lng: 0 };
    } else {
      this._center = value;
    }
  }

  get center() {
    return this._center;
  }
}
```

### 3. Sanitize User Input

If your custom component accepts user input, sanitize it:

```typescript
class RichTextEditorComponent extends LitElement {
  handleInput(html: string) {
    // Sanitize HTML before using
    const sanitized = DOMPurify.sanitize(html);
    this.value = sanitized;
  }
}
```

### 4. Limit API Access

Don't expose sensitive APIs to custom components:

```typescript
// ❌ Bad: Exposing full API client
class CustomComponent extends LitElement {
  @property() apiClient; // Full access to backend!
}

// ✅ Good: Expose only necessary actions
class CustomComponent extends LitElement {
  @property() onSubmit; // Callback function only
}
```

## Best Practices

### 1. Keep Components Focused

```typescript
// ✅ Good: Single responsibility
class DateRangePicker extends LitElement { ... }
class TimezonePicker extends LitElement { ... }

// ❌ Bad: Too much responsibility
class MegaFormComponent extends LitElement {
  // Handles dates, times, locations, payments, etc.
}
```

### 2. Document Properties

Provide clear documentation for your custom components:

```typescript
/**
 * A stock ticker component that displays real-time stock data.
 *
 * @property {string} symbol - Stock ticker symbol (e.g., "GOOGL")
 * @property {number} price - Current stock price
 * @property {number} change - Percentage change
 * @property {boolean} showChart - Whether to show price chart
 *
 * @fires price-alert - Fired when price crosses threshold
 */
class StockTickerComponent extends LitElement { ... }
```

### 3. Use TypeScript/Types

```typescript
interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers?: Array<{
    lat: number;
    lng: number;
    label: string;
  }>;
}

class GoogleMapComponent extends LitElement {
  @property({ type: Object }) center: GoogleMapProps['center'];
  @property({ type: Number }) zoom: GoogleMapProps['zoom'];
  @property({ type: Array }) markers?: GoogleMapProps['markers'];
}
```

### 4. Handle Loading States

```typescript
class GoogleMapComponent extends LitElement {
  @state() private loading = true;
  @state() private error = null;

  async firstUpdated() {
    try {
      await this.loadGoogleMaps();
      this.initializeMap();
      this.loading = false;
    } catch (err) {
      this.error = err.message;
      this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div>Loading map...</div>`;
    if (this.error) return html`<div>Error: ${this.error}</div>`;
    return html`<div id="map"></div>`;
  }
}
```

## Example: Complete Custom Component

Here's a complete example of a custom chart component:

```typescript
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import Chart from 'chart.js/auto';

class ChartComponent extends LitElement {
  @property({ type: String }) type = 'bar';
  @property({ type: Object }) data = { labels: [], datasets: [] };
  @property({ type: Object }) options = {};

  private chart: Chart | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  `;

  render() {
    return html`<canvas></canvas>`;
  }

  updated(changedProperties) {
    if (changedProperties.has('data') || changedProperties.has('type')) {
      this.updateChart();
    }
  }

  private updateChart() {
    const canvas = this.shadowRoot.querySelector('canvas');
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: this.type,
      data: this.data,
      options: this.options
    });
  }
}

customElements.define('a2ui-chart', ChartComponent);
```

**Usage from agent:**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "sales-chart",
        "component": {
          "Chart": {
            "type": {"literalString": "line"},
            "data": {
              "path": "/chartData"
            }
          }
        }
      }
    ]
  }
}
```

## Next Steps

- **[Theming & Styling](theming.md)**: Customize the look and feel of components
- **[Component Gallery](../reference/components.md)**: See all standard components
- **[Agent Development](agent-development.md)**: Build agents that use custom components
