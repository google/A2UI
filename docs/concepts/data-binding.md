# Data Binding

Data binding is the mechanism that connects UI components to application state. It's what makes A2UI interfaces reactive and dynamic without requiring code execution.

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
  "Text": {
    "text": {"literal": "Welcome to Our Store"}
  }
}
```

This text will always be "Welcome to Our Store".

### Data-Bound Values

Values that come from the data model:

```json
{
  "id": "username",
  "Text": {
    "text": {"path": "/user/name"}
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

## Updating the Data Model

Use the `updateDataModel` message to change data:

### Replace Operation

Replace a value at a specific path:

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/user/name",
    "value": "Charlie"
  }
}
```

**Before:**

```json
{
  "user": {
    "name": "Alice"
  }
}
```

**After:**

```json
{
  "user": {
    "name": "Charlie"
  }
}
```

### Add Operation

Add a new property or array element:

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "add",
    "path": "/user/age",
    "value": 30
  }
}
```

**Before:**

```json
{
  "user": {
    "name": "Alice"
  }
}
```

**After:**

```json
{
  "user": {
    "name": "Alice",
    "age": 30
  }
}
```

**Adding to arrays:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "add",
    "path": "/items/-",
    "value": "New Item"
  }
}
```

The `-` means "append to end of array".

### Remove Operation

Remove a property or array element:

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "remove",
    "path": "/user/age"
  }
}
```

**Before:**

```json
{
  "user": {
    "name": "Alice",
    "age": 30
  }
}
```

**After:**

```json
{
  "user": {
    "name": "Alice"
  }
}
```

## Reactive Components

When the data model changes, **all components bound to that data automatically update**.

### Example: Real-Time Updates

**Component:**

```json
{
  "id": "status",
  "Text": {
    "text": {"path": "/order/status"}
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
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/order/status",
    "value": "Shipped"
  }
}
```

**Display:** "Shipped"

**Data update 2:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/order/status",
    "value": "Delivered"
  }
}
```

**Display:** "Delivered"

No component updates needed—just data updates!

## Conditional Rendering

You can show/hide components based on data by binding the `visible` property:

```json
{
  "id": "premium-badge",
  "Icon": {
    "name": {"literal": "star"},
    "visible": {"path": "/user/premium"}
  }
}
```

**Data:**

```json
{
  "user": {
    "premium": true
  }
}
```

**Result:** Icon is visible.

If data changes to `"premium": false`, the icon hides automatically.

## Dynamic Lists

Use data binding with dynamic children to render lists:

### The Pattern

**Component:**

```json
{
  "id": "product-list",
  "Column": {
    "children": {
      "path": "/products",
      "componentId": "product-card"
    }
  }
}
```

**Template:**

```json
{
  "id": "product-card",
  "Card": {
    "children": {"array": ["product-name", "product-price"]}
  }
}
```

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

**Template:**

```json
{
  "id": "product-name",
  "Text": {
    "text": {"path": "/name"}
  }
}
```

**For the first item (`/products/0`):**

- `/name` resolves to `/products/0/name` → "Widget"

**For the second item (`/products/1`):**

- `/name` resolves to `/products/1/name` → "Gadget"

### Adding Items Dynamically

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "add",
    "path": "/products/-",
    "value": {"name": "Thingamajig", "price": 24.99}
  }
}
```

A fourth card automatically appears!

### Removing Items

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "remove",
    "path": "/products/1"
  }
}
```

The second card (Gadget) is removed from the UI.

## Input Bindings

Interactive components can update the data model when users interact with them.

### Text Input

```json
{
  "id": "name-input",
  "TextField": {
    "label": {"literal": "Your Name"},
    "value": {"path": "/form/name"}
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
  "Checkbox": {
    "label": {"literal": "I agree to the terms"},
    "checked": {"path": "/form/agreedToTerms"}
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

### Dropdown

```json
{
  "id": "country-select",
  "Dropdown": {
    "label": {"literal": "Country"},
    "value": {"path": "/form/country"},
    "options": {
      "literal": [
        {"value": "us", "label": "United States"},
        {"value": "ca", "label": "Canada"},
        {"value": "mx", "label": "Mexico"}
      ]
    }
  }
}
```

**User selects "Canada":**

```json
{
  "form": {
    "country": "ca"
  }
}
```

## Complex Example: Shopping Cart

Let's build a reactive shopping cart interface.

### Components

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "cart",
        "Card": {
          "children": {"array": ["cart-title", "item-list", "total", "checkout-btn"]}
        }
      },
      {
        "id": "cart-title",
        "Text": {
          "text": {"literal": "Your Cart"},
          "style": "headline"
        }
      },
      {
        "id": "item-list",
        "Column": {
          "children": {
            "path": "/cart/items",
            "componentId": "cart-item"
          }
        }
      },
      {
        "id": "cart-item",
        "Row": {
          "children": {"array": ["item-name", "item-quantity", "item-price"]}
        }
      },
      {
        "id": "item-name",
        "Text": {
          "text": {"path": "/name"}
        }
      },
      {
        "id": "item-quantity",
        "Text": {
          "text": {"path": "/quantity"}
        }
      },
      {
        "id": "item-price",
        "Text": {
          "text": {"path": "/price"}
        }
      },
      {
        "id": "total",
        "Text": {
          "text": {"path": "/cart/total"},
          "style": "headline"
        }
      },
      {
        "id": "checkout-btn",
        "Button": {
          "text": {"literal": "Checkout"},
          "onClick": {"actionId": "checkout"}
        }
      }
    ]
  }
}
```

### Initial Data

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/",
    "value": {
      "cart": {
        "items": [
          {"name": "Widget", "quantity": 2, "price": "$19.98"},
          {"name": "Gadget", "quantity": 1, "price": "$19.99"}
        ],
        "total": "$39.97"
      }
    }
  }
}
```

**Rendered UI:**

```
┌─────────────────────────────────┐
│ Your Cart                       │
├─────────────────────────────────┤
│ Widget      2      $19.98       │
│ Gadget      1      $19.99       │
├─────────────────────────────────┤
│ $39.97                          │
│ [Checkout]                      │
└─────────────────────────────────┘
```

### Add an Item

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "add",
    "path": "/cart/items/-",
    "value": {"name": "Doohickey", "quantity": 3, "price": "$44.97"}
  }
}
```

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/cart/total",
    "value": "$84.94"
  }
}
```

**Rendered UI (automatically updates):**

```
┌─────────────────────────────────┐
│ Your Cart                       │
├─────────────────────────────────┤
│ Widget      2      $19.98       │
│ Gadget      1      $19.99       │
│ Doohickey   3      $44.97       │
├─────────────────────────────────┤
│ $84.94                          │
│ [Checkout]                      │
└─────────────────────────────────┘
```

### Remove an Item

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "remove",
    "path": "/cart/items/0"
  }
}
```

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/cart/total",
    "value": "$64.96"
  }
}
```

**Widget is gone, total updated, UI reflects changes automatically.**

## Best Practices

### 1. Use Granular Updates

```json
// ❌ Bad: Replace entire model
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/",
    "value": {/* huge object */}
  }
}

// ✅ Good: Update only what changed
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/user/name",
    "value": "Alice"
  }
}
```

### 2. Organize Data by Domain

```json
{
  "user": {/* user data */},
  "cart": {/* cart data */},
  "products": {/* product data */},
  "ui": {/* UI state */}
}
```

Keep related data together and separate concerns.

### 3. Use UI State for Interactions

```json
{
  "ui": {
    "loading": false,
    "selectedProductId": 42,
    "modalOpen": false,
    "currentPage": 1
  }
}
```

Store UI-specific state (loading, selection, pagination) in a dedicated section.

### 4. Avoid Deep Nesting

```json
// ❌ Hard to bind to
{
  "data": {
    "entities": {
      "users": {
        "byId": {
          "123": {
            "profile": {
              "name": "Alice"
            }
          }
        }
      }
    }
  }
}

// Path: /data/entities/users/byId/123/profile/name

// ✅ Flatter is better
{
  "user": {
    "name": "Alice"
  }
}

// Path: /user/name
```

### 5. Pre-Compute Display Values

```json
// ❌ Agent has to format every time
{
  "price": 19.99
}

// ✅ Send formatted values
{
  "price": "$19.99"
}
```

Components display what they receive. Do formatting server-side.

## Next Steps

- **[Agent Development Guide](../guides/agent-development.md)**: Build agents that generate data-bound UIs
- **[Client Setup Guide](../guides/client-setup.md)**: Implement data binding in your renderer
- **[Protocol Reference](../reference/protocol.md)**: Full specification of data binding
