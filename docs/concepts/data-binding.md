# Data Binding

Data binding is the mechanism that connects UI components to application state. It's what allows A2UI to efficiently define layouts for large arrays of data, or to show updated content without being regenerated from scratch.

## The Separation of Structure and State

A2UI cleanly separates two concerns:

1. **UI Structure** (Components): What the interface looks like
2. **Application State** (Data Model): What data the interface displays

This separation enables powerful features:

- **Update data without changing UI structure**
- **Reuse UI templates with different data**
- **Reactive updates**: When data changes, UI automatically updates
- **Bidirectional binding**: UI inputs can update the data model

## The Data Model

Each surface has its own **data model**—a JSON object that holds state.

### Example Data Model

```json
{
  "user": {
    "name": "Alice",
    "email": "alice@example.com",
    "premium": true
  },
  "cart": {
    "items": [
      {"id": 1, "name": "Widget", "price": 9.99, "quantity": 2},
      {"id": 2, "name": "Gadget", "price": 19.99, "quantity": 1}
    ],
    "total": 39.97
  },
  "ui": {
    "loading": false,
    "selectedTab": "products"
  }
}
```

This model can store:

- User information
- Application data (cart, products, messages, etc.)
- UI state (loading indicators, selected items, etc.)

## JSON Pointer Paths

A2UI uses **JSON Pointer** ([RFC 6901](https://tools.ietf.org/html/rfc6901)) to reference locations in the data model.

### Basic Syntax

- `/` - Root of the data model
- `/user` - The "user" object
- `/user/name` - The "name" property of the "user" object
- `/cart/items` - The "items" array in the "cart" object
- `/cart/items/0` - The first item in the array (zero-indexed)
- `/cart/items/0/price` - The "price" of the first cart item

### Examples

Given this data model:

```json
{
  "user": {
    "name": "Alice",
    "address": {
      "city": "San Francisco"
    }
  },
  "items": ["Apple", "Banana", "Cherry"]
}
```

**Paths:**

- `/user/name` → `"Alice"`
- `/user/address/city` → `"San Francisco"`
- `/items` → `["Apple", "Banana", "Cherry"]`
- `/items/0` → `"Apple"`
- `/items/2` → `"Cherry"`

## Literal vs. Path Values

Component properties can be either **literal** values or **data-bound** paths.

### Literal Values

Fixed values that never change:

```json
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome to Our Store"}
    }
  }
}
```

This text will always be "Welcome to Our Store".

### Data-Bound Values

Values that come from the data model:

```json
{
  "id": "username",
  "component": {
    "Text": {
      "text": {"path": "/user/name"}
    }
  }
}
```

If the data model is:

```json
{
  "user": {
    "name": "Alice"
  }
}
```

Then the text displays "Alice".

If the data model updates to:

```json
{
  "user": {
    "name": "Bob"
  }
}
```

The text **automatically updates** to "Bob".

## Reactive Components

When the data model changes, **all components bound to that data automatically update**.

### Example: Real-Time Updates

**Component:**

```json
{
  "id": "status",
  "component": {
    "Text": {
      "text": {"path": "/order/status"}
    }
  }
}
```

**Initial data:**

```json
{
  "order": {
    "status": "Processing..."
  }
}
```

**Display:** "Processing..."

**Data update 1:**

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "/order",
    "contents": [
      { "key": "status", "valueString": "Shipped" }
    ]
  }
}
```

**Display:** "Shipped"

**Data update 2:**

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "/order",
    "contents": [
      { "key": "status", "valueString": "Delivered" }
    ]
  }
}
```

**Display:** "Delivered"

No component updates needed—just data updates!

## Dynamic Lists

Use data binding with dynamic children to render lists:

### The Pattern

**Component:**

```json
{
  "id": "product-list",
  "component": {
    "Column": {
      "children": {
        "template": {
          "dataBinding": "/products",
          "componentId": "product-card"
        }
      }
    }
  }
}
```

**Template:**

```json
{
  "id": "product-card",
  "component": {
    "Card": {
      "child": "product-content"
    }
  }
}
```
*Note: The content of the card is omitted for brevity.*

**Data:**

```json
{
  "products": [
    {"name": "Widget", "price": 9.99},
    {"name": "Gadget", "price": 19.99},
    {"name": "Doohickey", "price": 14.99}
  ]
}
```

**Result:** Three cards are rendered, one per product.

### Scoped Data Paths

When a template is instantiated for an array item, paths are **scoped** to that item.

**Template's Text Child:**

```json
{
  "id": "product-name",
  "component": {
    "Text": {
      "text": {"path": "/name"}
    }
  }
}
```

**For the first item (`/products/0`):**

- `/name` resolves to `/products/0/name` → "Widget"

**For the second item (`/products/1`):**

- `/name` resolves to `/products/1/name` → "Gadget"

*Note: Adding or removing items from the `/products` array in the data model will automatically cause the client to render or remove the corresponding components.*

## Input Bindings

Interactive components can update the data model when users interact with them.

### Text Input

```json
{
  "id": "name-input",
  "component": {
    "TextField": {
      "label": {"literalString": "Your Name"},
      "text": {"path": "/form/name"}
    }
  }
}
```

When the user types in this field, the value at `/form/name` is automatically updated.

**User types:** "Alice"

**Data model updates:**

```json
{
  "form": {
    "name": "Alice"
  }
}
```

### Checkbox

```json
{
  "id": "terms-checkbox",
  "component": {
    "CheckBox": {
      "label": {"literalString": "I agree to the terms"},
      "value": {"path": "/form/agreedToTerms"}
    }
  }
}
```

**User checks the box:**

```json
{
  "form": {
    "agreedToTerms": true
  }
}
```

### Multiple Choice

```json
{
  "id": "country-select",
  "component": {
    "MultipleChoice": {
      "selections": {"path": "/form/country"},
      "options": {
        "literalArray": [
          {"value": "us", "label": "United States"},
          {"value": "ca", "label": "Canada"},
          {"value": "mx", "label": "Mexico"}
        ]
      },
      "maxAllowedSelections": 1
    }
  }
}
```

**User selects "Canada":**

```json
{
  "form": {
    "country": ["ca"]
  }
}
```

## Complex Example: Shopping Cart

Let's build a reactive shopping cart interface.

### 1. Define the UI Structure

First, the agent sends the component structure for the cart.

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "cart",
        "component": {
          "Card": { "child": "cart-content" }
        }
      },
      {
        "id": "cart-content",
        "component": {
          "Column": {
            "children": {"explicitList": ["cart-title", "item-list", "total", "checkout-btn-text", "checkout-btn"]}
          }
        }
      },
      {
        "id": "cart-title",
        "component": {
          "Text": {
            "text": {"literalString": "Your Cart"},
            "usageHint": "h1"
          }
        }
      },
      {
        "id": "item-list",
        "component": {
          "Column": {
            "children": {
              "template": {
                "dataBinding": "/cart/items",
                "componentId": "cart-item"
              }
            }
          }
        }
      },
      {
        "id": "cart-item",
        "component": {
          "Row": {
            "children": {"explicitList": ["item-name", "item-quantity", "item-price"]}
          }
        }
      },
      {
        "id": "item-name",
        "component": { "Text": { "text": {"path": "/name"} } }
      },
      {
        "id": "item-quantity",
        "component": { "Text": { "text": {"path": "/quantity"} } }
      },
      {
        "id": "item-price",
        "component": { "Text": { "text": {"path": "/price"} } }
      },
      {
        "id": "total",
        "component": {
          "Text": {
            "text": {"path": "/cart/total"},
            "usageHint": "h1"
          }
        }
      },
      {
        "id": "checkout-btn-text",
        "component": { "Text": { "text": {"literalString": "Checkout"} } }
      },
      {
        "id": "checkout-btn",
        "component": {
          "Button": {
            "child": "checkout-btn-text",
            "action": {"name": "checkout"}
          }
        }
      }
    ]
  }
}
```

### 2. Populate with Initial Data

Next, the agent sends the initial data for the cart.

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "contents": [
      {
        "key": "cart",
        "valueMap": [
          {
            "key": "items",
            "valueString": "[{\"name\": \"Widget\", \"quantity\": 2, \"price\": \"$19.98\"}, {\"name\": \"Gadget\", \"quantity\": 1, \"price\": \"$19.99\"}]"
          },
          {
            "key": "total",
            "valueString": "$39.97"
          }
        ]
      }
    ]
  }
}
```
*(Note: For dynamic lists, the data for the list itself is often sent as a stringified JSON array that the client then parses.)*

**Rendered UI:**
A card is displayed showing the two items and the total, all driven by the data model.

### 3. Update the Data

To add a new item, the agent only needs to send a `dataModelUpdate` message with the new list of items and the new total. The UI will automatically update to show the new item because the `item-list` component is bound to `/cart/items`.

## Best Practices

### 1. Use Granular Updates

When possible, update only the part of the data model that changed, rather than replacing the entire object.

```json
// ✅ Good: Update only the user's name
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "/user",
    "contents": [
      { "key": "name", "valueString": "Alice" }
    ]
  }
}
```

### 2. Organize Data by Domain

```json
{
  "user": {/* user data */},
  "cart": {/* cart data */},
  "ui": {/* UI state */}
}
```
Keeping related data together makes the model easier to manage.

### 3. Pre-Compute Display Values

It's often better for the agent to format data (like currency) before sending it.

```json
// ✅ Send formatted values
{
  "price": "$19.99"
}
```
Components should focus on displaying data, not transforming it.
