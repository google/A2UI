# Data Binding

Data binding connects UI components to application state using JSON Pointer paths ([RFC 6901](https://tools.ietf.org/html/rfc6901)). It's what allows A2UI to efficiently define layouts for large arrays of data, or to show updated content without being regenerated from scratch.

## Structure vs. State

A2UI separates:

1. **UI Structure** (Components): What the interface looks like
2. **Application State** (Data Model): What data it displays

This enables: reactive updates, data-driven UIs, reusable templates, and bidirectional binding.

## The Data Model

Each surface has a JSON object holding state:

```json
{
  "user": {"name": "Alice", "email": "alice@example.com"},
  "cart": {
    "items": [{"name": "Widget", "price": 9.99, "quantity": 2}],
    "total": 19.98
  }
}
```

## JSON Pointer Paths

**Syntax:**

- `/user/name` - Object property
- `/cart/items/0` - Array index (zero-based)
- `/cart/items/0/price` - Nested path

**Example:**

```json
{"user": {"name": "Alice"}, "items": ["Apple", "Banana"]}
```

- `/user/name` → `"Alice"`
-   `/user/name` → `"Alice"`
-   `/items/0` → `"Apple"`

## Literal vs. Path Values

**Literal (fixed):**
```json
{"id": "title", "component": "Text", "text": "Welcome"}
```

**Data-bound (reactive):**
```json
{"id": "username", "component": "Text", "text": {"path": "/user/name"}}
```

When `/user/name` changes from "Alice" to "Bob", the text **automatically updates** to "Bob".

## Reactive Updates

Components bound to data paths automatically update when the data changes:

```json
{"id": "status", "component": "Text", "text": {"path": "/order/status"}}
```

-   **Initial:** `/order/status` = "Processing..." → displays "Processing..."
-   **Update:** Send `updateDataModel` with `status: "Shipped"` → displays "Shipped"

No component updates needed—just data updates.

## Dynamic Lists

Use templates to render arrays:

```json
{
  "id": "product-list",
  "component": "Column",
  "children": {"template": {"path": "/products", "componentId": "product-card"}}
}
```

**Data:**
```json
{"products": [{"name": "Widget", "price": 9.99}, {"name": "Gadget", "price": 19.99}]}
```

**Result:** Two cards rendered, one per product.

### Scoped Paths

Inside a template, paths are scoped to the array item:

```json
{"id": "product-name", "component": "Text", "text": {"path": "/name"}}
```

-   For `/products/0`, `/name` resolves to `/products/0/name` → "Widget"
-   For `/products/1`, `/name` resolves to `/products/1/name` → "Gadget"

Adding/removing items automatically updates the rendered components.

## Input Bindings

Interactive components update the data model bidirectionally:

| Component | Example | User Action | Data Update |
|-----------|---------|-------------|-------------|
| **TextField** | `{"value": {"path": "/form/name"}}` | Types "Alice" | `/form/name` = "Alice" |
| **CheckBox** | `{"value": {"path": "/form/agreed"}}` | Checks box | `/form/agreed` = true |
| **ChoicePicker** | `{"value": {"path": "/form/country"}}` | Selects "Canada" | `/form/country` = ["ca"] |

## Best Practices

**1. Use granular updates** - Update only changed paths:
```json
{"version": "v0.9", "updateDataModel": {"surfaceId": "main", "path": "/user", "value": {"name": "Alice"}}}
```

**2. Organize by domain** - Group related data:
```json
{"user": {...}, "cart": {...}, "ui": {...}}
```

**3. Pre-compute display values** - Agent formats data (currency, dates) before sending:
```json
{"price": "$19.99"}  // Not: {"price": 19.99}
```

**4. Use Client-Side Formatting** - For dynamic localization or complex updates, use client-side functions:
```json
{"text": {"call": "formatCurrency", "args": {"value": 19.99, "currency": "USD"}}}
```
See the **[Functions Reference](../reference/functions.md)** for a complete list of available functions.
