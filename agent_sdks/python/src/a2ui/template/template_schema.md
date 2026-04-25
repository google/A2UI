# A2UI Template Schema & Data-Binding Specification

This document defines the formal schema for A2UI templates and the syntax rules
for `{{}}` dynamic placeholder expressions used in template-based inference.

## Overview

A **template** is a reusable A2UI component tree stored as a JSON file. Instead
of asking the LLM to generate a full A2UI message payload from scratch (which is
large and error-prone), the agent:

1. Presents the LLM with a **catalog of template names** and their `dataSchema`.
2. The LLM returns a compact response: a **`templateName`** + a **`data`**
   object.
3. The SDK's `A2uiTemplateManager` **inflates** the template by resolving all
   `{{}}` placeholders with the LLM-supplied data.
4. The inflated output is a standard sequence of **v0.9 A2UI messages**
   (`createSurface`, `updateComponents`, `updateDataModel`).

This pattern reduces LLM output size, improves UI consistency, and enables the
[A2UI Composer](https://a2ui-composer.ag-ui.com/) to visually manage template
libraries.

### Relationship to A2UI Data Binding

Templates use **two distinct mechanisms** for dynamic values:

| Mechanism | Syntax | When Resolved | Who Resolves | Purpose |
|-----------|--------|---------------|-------------|---------|
| **Template placeholder** | `{{path.to.field}}` | Server-side, at inflation time | `A2uiTemplateManager` | Inject LLM-provided data into the component tree before sending to client |
| **Data binding** | `{"path": "/field"}` | Client-side, at render time | A2UI renderer | Bind UI components to the live data model for interactive two-way binding |

Both can coexist in a single template. Template placeholders are resolved first,
producing standard A2UI messages that the client renders as usual.

---

## Template File Format

Templates are stored as JSON files and validated against
[`schema.json`](schema.json) in this package.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique kebab-case identifier (e.g. `restaurant-card`). This is the value the LLM returns to select the template. |
| `version` | `string` | Semantic version of this template (e.g. `1.0.0`). |
| `catalogId` | `string` | The A2UI catalog ID that this template's components belong to. Used in the generated `createSurface` message. |
| `components` | `array` | Flat, ordered list of v0.9 component descriptors. Must contain a component with `"id": "root"`. |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | Human-readable summary. Included in LLM prompts. |
| `surfaceId` | `string` | Surface ID for the generated messages. Defaults to the template `name`. |
| `theme` | `object` | Theme parameters passed to `createSurface`. |
| `dataSchema` | `object` | JSON Schema describing the data the LLM must provide. Used for prompt generation and runtime validation. |
| `dataModel` | `object` | Default data model values. May contain `{{}}` placeholders. Becomes the `updateDataModel` message value. |

### Example Structure

```json
{
  "name": "restaurant-card",
  "description": "Displays a restaurant with name, cuisine, rating, and a booking button.",
  "version": "1.0.0",
  "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json",
  "dataSchema": {
    "type": "object",
    "required": ["restaurant"],
    "properties": {
      "restaurant": {
        "type": "object",
        "required": ["name", "cuisine", "rating"],
        "properties": {
          "name": { "type": "string" },
          "cuisine": { "type": "string" },
          "rating": { "type": "number" }
        }
      }
    }
  },
  "components": [
    { "id": "root", "component": "Card", "child": "card-content" },
    { "id": "card-content", "component": "Column", "children": ["title", "cuisine-text", "rating-text", "book-btn"] },
    { "id": "title", "component": "Text", "variant": "h2", "text": "{{restaurant.name}}" },
    ...
  ],
  "dataModel": {
    "restaurantName": "{{restaurant.name}}",
    "cuisine": "{{restaurant.cuisine}}",
    "rating": "{{restaurant.rating}}"
  }
}
```

---

## Placeholder Syntax: `{{}}`

### Basic Form

Any string value inside `components` or `dataModel` may contain one or more
placeholder expressions:

```
{{path.to.value}}
```

Placeholders are delimited by double curly braces (`{{` and `}}`). The content
between the braces is a **dot-separated path** into the LLM-provided `data`
object.

### Path Resolution Rules

Note: Keys containing literal dots are not supported in path expressions; dots are always treated as delimiters.

| Rule | Placeholder | Data | Result |
|------|-------------|------|--------|
| Top-level key | `{{name}}` | `{"name": "Café Lux"}` | `"Café Lux"` |
| Nested key | `{{restaurant.cuisine}}` | `{"restaurant": {"cuisine": "French"}}` | `"French"` |
| Array index | `{{items.0.title}}` | `{"items": [{"title": "Soup"}]}` | `"Soup"` |
| Deep nesting | `{{order.items.2.name}}` | `{"order": {"items": [{}, {}, {"name": "Wine"}]}}` | `"Wine"` |

### Value Semantics

The behavior depends on how the placeholder appears in the string:

| Pattern | Example | Data | Result | Type |
|---------|---------|------|--------|------|
| **Whole-string placeholder** | `"{{rating}}"` | `{"rating": 4.7}` | `4.7` | Preserves original type (number, boolean, array, object) |
| **Inline interpolation** | `"Rating: {{rating}}/5"` | `{"rating": 4.7}` | `"Rating: 4.7/5"` | Always string (values are coerced via `str()`) |
| **Multiple placeholders** | `"{{city}}, {{country}}"` | `{"city": "Paris", "country": "France"}` | `"Paris, France"` | Always string |

#### Whole-String Placeholder (Type Preservation)

When a string value consists of **exactly one placeholder with no surrounding
text**, the placeholder resolves to the raw value from the data, preserving its
original JSON type:

```json
// Template:
{"text": "{{restaurant.name}}"}    // → "Café Lux" (string)
{"max": "{{slider.max}}"}          // → 100 (number)
{"enableDate": "{{config.dates}}"} // → true (boolean)
```

This is critical for non-string component properties like `min`, `max`,
`enableDate`, etc.

#### Inline Interpolation (String Coercion)

When the placeholder appears alongside other text, all values are coerced to
strings via `str()`:

```json
// Template:
{"text": "Rating: {{restaurant.rating}} stars"}
// Data: {"restaurant": {"rating": 4.7}}
// Result: {"text": "Rating: 4.7 stars"}
```

### Error Behavior

| Scenario | Behavior |
|----------|----------|
| Missing key | **Raises `KeyError`** — there are no silent fallbacks or empty-string defaults. |
| Wrong type at path segment | **Raises `TypeError`** — e.g. indexing into a string. |
| Malformed placeholder (unclosed `{{`) | **Treated as literal text** — no substitution occurs. |
| Empty placeholder `{{}}` | **Raises `ValueError`** — path must be non-empty. |

> **Design rationale:** Failing loudly on missing keys prevents the LLM from
> silently producing broken UIs. The `dataSchema` field allows the SDK to
> validate the LLM's data *before* attempting inflation.

### Limitations (v1)

- **No expressions:** `{{price * 1.1}}` is NOT supported. Placeholders are
  pure path lookups.
- **No filters:** `{{name | uppercase}}` is NOT supported.
- **No conditionals:** `{{#if available}}` is NOT supported.
- **No default values:** `{{name || "Unknown"}}` is NOT supported.

These may be considered for future versions if there is community demand.

---

## LLM Response Format

When an agent uses template-based inference, the LLM returns a compact JSON
response selecting a template and providing data:

```json
{
  "templateName": "restaurant-card",
  "data": {
    "restaurant": {
      "name": "The French Bistro",
      "cuisine": "French",
      "rating": 4.7
    }
  }
}
```

The SDK:
1. Looks up `"restaurant-card"` in the registered template catalog.
2. Validates `data` against the template's `dataSchema`.
3. Inflates all `{{}}` placeholders.
4. Packages the result as a standard v0.9 A2UI message sequence:
   - `createSurface` (with `catalogId` and optional `theme`)
   - `updateComponents` (the inflated component tree)
   - `updateDataModel` (the inflated data model, if present)

### Multiple Templates

The LLM may return multiple templates in a single response:

```json
[
  {
    "templateName": "restaurant-card",
    "data": { "restaurant": { "name": "Café Lux", "cuisine": "French", "rating": 4.5 } }
  },
  {
    "templateName": "booking-form",
    "data": { "booking": { "restaurantName": "Café Lux", "minDate": "2026-01-15" } }
  }
]
```

---

## Inflated Output Example

Given the `restaurant-card` template and the data above, the inflated output is:

```json
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "restaurant-card",
      "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json"
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "restaurant-card",
      "components": [
        { "id": "root", "component": "Card", "child": "card-content" },
        { "id": "card-content", "component": "Column", "children": ["title", "cuisine-text", "rating-text", "book-btn"] },
        { "id": "title", "component": "Text", "variant": "h2", "text": "The French Bistro" },
        { "id": "cuisine-text", "component": "Text", "text": "Cuisine: French" },
        { "id": "rating-text", "component": "Text", "text": "Rating: 4.7 / 5" },
        { "id": "book-btn-text", "component": "Text", "text": "Book a Table" },
        { "id": "book-btn", "component": "Button", "child": "book-btn-text", "variant": "primary", "action": { "event": { "name": "book_restaurant", "context": { "restaurantName": "The French Bistro" } } } }
      ]
    }
  },
  {
    "version": "v0.9",
    "updateDataModel": {
      "surfaceId": "restaurant-card",
      "path": "/",
      "value": {
        "restaurantName": "The French Bistro",
        "cuisine": "French",
        "rating": 4.7
      }
    }
  }
]
```

---

## Reference Templates

The [`examples/`](examples/) directory provides 5 reference templates:

| File | Template Name | Use Case |
|------|---------------|----------|
| [`restaurant_card.json`](examples/restaurant_card.json) | `restaurant-card` | Restaurant name, cuisine, rating, and booking button |
| [`contact_card.json`](examples/contact_card.json) | `contact-card` | Contact with name, email, phone, and message button |
| [`product_detail.json`](examples/product_detail.json) | `product-detail` | Product title, price, description, and add-to-cart button |
| [`weather_summary.json`](examples/weather_summary.json) | `weather-summary` | Location, temperature, condition, and forecast |
| [`booking_form.json`](examples/booking_form.json) | `booking-form` | Interactive reservation form with date, time, and party size |
