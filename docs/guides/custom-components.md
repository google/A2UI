# Custom Components

Extend A2UI with your own custom components. This guide shows you how to register custom widgets in your client application and use them from agents.

## Why Custom Components?

The A2UI Standard Catalog provides common UI elements (buttons, text fields, cards, etc.), but your application might need specialized components:

- **Domain-specific widgets**: Stock tickers, medical charts, CAD viewers
- **Third-party integrations**: Google Maps, payment forms, chat widgets
- **Brand-specific components**: Custom date pickers, product cards, dashboards

Custom components let you extend A2UI while maintaining security and type safety.

## How Custom Components Work

```
┌─────────────────────────────────────────────────────┐
│              Agent (Server Side)                    │
│                                                     │
│  Generates:                                         │
│  {                                                  │
│    "id": "map",                                     │
│    "CustomComponent": {                            │
│      "name": "GoogleMap",                          │
│      "properties": {                               │
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
│  Widget Registry:                                   │
│  {                                                  │
│    "GoogleMap": GoogleMapComponent ← Your code     │
│  }                                                  │
│                                                     │
│  Renderer looks up "GoogleMap" and instantiates    │
│  your GoogleMapComponent with the properties       │
└─────────────────────────────────────────────────────┘
```

## Registering Custom Components (Web)

### Lit / Web Components

```typescript
import { A2UIRenderer } from '@a2ui/renderer-lit';
import { LitElement, html, css } from 'lit';

// 1. Define your custom component
class GoogleMapComponent extends LitElement {
  static properties = {
    center: { type: Object },
    zoom: { type: Number }
  };

  constructor() {
    super();
    this.center = { lat: 0, lng: 0 };
    this.zoom = 10;
  }

  render() {
    return html`
      <div id="map"></div>
    `;
  }

  firstUpdated() {
    // Initialize Google Maps
    new google.maps.Map(this.shadowRoot.getElementById('map'), {
      center: this.center,
      zoom: this.zoom
    });
  }
}

// 2. Register the custom component
customElements.define('google-map', GoogleMapComponent);

// 3. Register with A2UI renderer
const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  customComponents: new Map([
    ['GoogleMap', 'google-map']
  ])
});
```

### Angular

```typescript
// google-map.component.ts
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-google-map',
  template: `<div #mapContainer style="width: 100%; height: 400px;"></div>`,
})
export class GoogleMapComponent implements OnInit {
  @Input() center: { lat: number; lng: number };
  @Input() zoom: number = 10;
  @ViewChild('mapContainer') mapContainer: ElementRef;

  ngOnInit() {
    new google.maps.Map(this.mapContainer.nativeElement, {
      center: this.center,
      zoom: this.zoom
    });
  }
}

// app.module.ts
import { A2UIModule } from '@a2ui/renderer-angular';

@NgModule({
  declarations: [GoogleMapComponent],
  imports: [
    A2UIModule.forRoot({
      customComponents: [
        { name: 'GoogleMap', component: GoogleMapComponent }
      ]
    })
  ]
})
export class AppModule {}
```

### Flutter

```dart
import 'package:flutter/material.dart';
import 'package:flutter_genui/flutter_genui.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

// 1. Define custom widget
class GoogleMapWidget extends StatelessWidget {
  final Map<String, dynamic> properties;

  GoogleMapWidget({required this.properties});

  @override
  Widget build(BuildContext context) {
    final lat = properties['center']['lat'] as double;
    final lng = properties['center']['lng'] as double;
    final zoom = properties['zoom'] as double? ?? 10.0;

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: LatLng(lat, lng),
        zoom: zoom,
      ),
    );
  }
}

// 2. Register with GenUI
GenUIRenderer(
  customComponents: {
    'GoogleMap': (props) => GoogleMapWidget(properties: props),
  },
)
```

## Agent-Side: Using Custom Components

Once registered on the client, agents can use custom components:

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "location-map",
        "CustomComponent": {
          "name": "GoogleMap",
          "properties": {
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
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "stock-ticker",
        "CustomComponent": {
          "name": "StockTicker",
          "properties": {
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
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/stock",
    "value": {
      "symbol": "GOOGL",
      "price": 142.50,
      "change": 2.3
    }
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
            "updateComponents": {
                "surfaceId": action['surfaceId'],
                "components": [{
                    "id": "confirmation",
                    "Text": {"text": {"literal": "Payment successful!"}}
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
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "sales-chart",
        "CustomComponent": {
          "name": "Chart",
          "properties": {
            "type": {"literal": "line"},
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
