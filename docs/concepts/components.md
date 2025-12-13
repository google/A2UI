# Components & Structure

A2UI uses a unique **adjacency list** model for representing component hierarchies. This design makes it easy for LLMs to generate and update UIs incrementally while maintaining a clear structure.

## The Adjacency List Model

Instead of deeply nested JSON trees, A2UI represents components as a **flat list** where children are referenced by ID.

### Traditional Tree Structure (❌ Not A2UI)

```json
{
  "component": "Column",
  "children": [
    {
      "component": "Text",
      "text": "Hello"
    },
    {
      "component": "Row",
      "children": [
        {
          "component": "Button",
          "text": "Cancel"
        },
        {
          "component": "Button",
          "text": "OK"
        }
      ]
    }
  ]
}
```

**Problems with this approach:**

- LLM must generate perfect nesting in one pass
- Hard to update a deeply nested component
- Can't reference the same component multiple times
- Difficult to stream incrementally

### A2UI Adjacency List (✅ The Right Way)

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "Column": {
          "children": {"array": ["greeting", "button-row"]}
        }
      },
      {
        "id": "greeting",
        "Text": {
          "text": {"literal": "Hello"}
        }
      },
      {
        "id": "button-row",
        "Row": {
          "children": {"array": ["cancel-btn", "ok-btn"]}
        }
      },
      {
        "id": "cancel-btn",
        "Button": {
          "text": {"literal": "Cancel"}
        }
      },
      {
        "id": "ok-btn",
        "Button": {
          "text": {"literal": "OK"}
        }
      }
    ]
  }
}
```

**Benefits:**

- ✅ Flat structure is easy for LLMs to generate
- ✅ Can send components incrementally
- ✅ Can update any component by ID
- ✅ Can reuse components by referencing the same ID
- ✅ Clear separation of structure and data

## Component Anatomy

Every component has:

1. **ID**: Unique identifier within the surface
2. **Type**: The component type (e.g., `Text`, `Button`, `Card`)
3. **Properties**: Configuration for that component type

### Basic Example

```json
{
  "id": "welcome-message",
  "Text": {
    "text": {"literal": "Welcome to A2UI"},
    "style": "headline"
  }
}
```

- **id**: `"welcome-message"` - Unique identifier
- **Type**: `Text` - This is a text component
- **Properties**: `text` and `style` - Configuration

### Component Types

A2UI defines a **Standard Catalog** of component types:

#### Layout Components

- **Row**: Horizontal layout container
- **Column**: Vertical layout container
- **Stack**: Layered layout (z-axis stacking)
- **Spacer**: Empty space for layout control

#### Display Components

- **Text**: Display text content
- **Image**: Display images
- **Icon**: Display icons
- **Divider**: Visual separator line
- **ProgressIndicator**: Loading or progress display

#### Interactive Components

- **Button**: Clickable button
- **IconButton**: Icon-based button
- **TextField**: Text input field
- **NumberInput**: Numeric input
- **Checkbox**: Boolean toggle
- **RadioGroup**: Multiple choice selection
- **Dropdown**: Dropdown/select menu
- **DatePicker**: Date selection
- **TimePicker**: Time selection

#### Container Components

- **Card**: Container with elevation/border
- **Modal**: Overlay dialog
- **ExpansionPanel**: Collapsible section
- **Tabs**: Tabbed interface

#### Specialized Components

- **Timeline**: Event timeline display
- **DataTable**: Table for structured data
- **List**: Scrollable list
- **CustomComponent**: For client-defined components

## Children: Static vs. Dynamic

Components can contain children in two ways:

### 1. Static Children (Array)

A fixed list of child component IDs:

```json
{
  "id": "toolbar",
  "Row": {
    "children": {"array": ["back-btn", "title", "menu-btn"]}
  }
}
```

**Use when:** You know exactly what children to show.

### 2. Dynamic Children (Template)

Generate children from a data array using a template:

```json
{
  "id": "item-list",
  "Column": {
    "children": {
      "path": "/items",
      "componentId": "item-template"
    }
  }
}
```

This says: "For each item in the data at `/items`, render the `item-template` component."

**Data model:**

```json
{
  "items": [
    {"name": "Apple", "price": 1.50},
    {"name": "Banana", "price": 0.75},
    {"name": "Orange", "price": 1.25}
  ]
}
```

**Template component:**

```json
{
  "id": "item-template",
  "Card": {
    "children": {"array": ["item-name", "item-price"]}
  }
}
```

**Result:** Three cards are rendered, one for each item in the array.

**Use when:** You have a dynamic list from data (search results, cart items, messages, etc.).

## Component Properties

Properties can be **literal values** or **data bindings**.

### Literal Values

```json
{
  "id": "title",
  "Text": {
    "text": {"literal": "Welcome"}
  }
}
```

The text will always be "Welcome".

### Data Bindings

```json
{
  "id": "username",
  "Text": {
    "text": {"path": "/user/name"}
  }
}
```

The text comes from the data model at `/user/name`.

**Data model:**

```json
{
  "user": {
    "name": "Alice"
  }
}
```

**Rendered text:** "Alice"

See [Data Binding](data-binding.md) for more details.

## Layout Properties

Components that are direct children of `Row` or `Column` can have a **weight** property:

```json
{
  "id": "main-row",
  "Row": {
    "children": {"array": ["sidebar", "content"]}
  }
}
```

```json
{
  "id": "sidebar",
  "Card": {
    "weight": {"literal": 1}
  }
}
```

```json
{
  "id": "content",
  "Card": {
    "weight": {"literal": 3}
  }
}
```

This creates a layout where `sidebar` takes 25% of the width and `content` takes 75% (ratio of 1:3).

**Weight corresponds to CSS `flex-grow`.**

## Incremental Updates

The adjacency list model shines when updating UIs:

### Adding Components

Send a new `updateComponents` message with additional components:

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "new-button",
        "Button": {
          "text": {"literal": "Click Me"}
        }
      }
    ]
  }
}
```

### Updating Existing Components

Send an `updateComponents` message with the same ID but new properties:

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "existing-button",
        "Button": {
          "text": {"literal": "Updated Text"},
          "disabled": {"literal": true}
        }
      }
    ]
  }
}
```

The client merges the new properties into the existing component.

### Removing Components

Update a parent to remove a child from its `children` array:

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "container",
        "Column": {
          "children": {"array": ["child1", "child3"]}
        }
      }
    ]
  }
}
```

This removes "child2" from the container (it was previously `["child1", "child2", "child3"]`).

## Component Lifecycle

```
┌─────────────────┐
│ Component       │
│ Defined         │ ← updateComponents with new ID
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component       │
│ Rendered        │ ← Client creates native widget
└────────┬────────┘
         │
         │ (Component is visible and interactive)
         │
         │ updateComponents with same ID
         ▼
┌─────────────────┐
│ Component       │
│ Updated         │ ← Client updates widget properties
└────────┬────────┘
         │
         │ Removed from parent's children
         ▼
┌─────────────────┐
│ Component       │
│ Destroyed       │ ← Client removes widget
└─────────────────┘
```

## Best Practices

### 1. Use Descriptive IDs

```json
// ❌ Bad
{"id": "c1"}
{"id": "c2"}

// ✅ Good
{"id": "user-profile-card"}
{"id": "submit-button"}
```

Descriptive IDs help with debugging and make the structure self-documenting.

### 2. Keep Component Hierarchy Shallow

```json
// ❌ Deep nesting is harder to manage
root → container → wrapper → inner-wrapper → content → item

// ✅ Prefer flatter hierarchies
root → content-card → item
```

### 3. Separate Structure from Content

```json
// ❌ Mixing literal content with structure
{
  "id": "profile",
  "Card": {
    "children": {"array": ["name-text", "email-text"]}
  }
}
{
  "id": "name-text",
  "Text": {
    "text": {"literal": "Alice Smith"}
  }
}

// ✅ Use data binding for content
{
  "id": "profile",
  "Card": {
    "children": {"array": ["name-text", "email-text"]}
  }
}
{
  "id": "name-text",
  "Text": {
    "text": {"path": "/user/name"}
  }
}
```

Then update content via `updateDataModel` without touching components.

### 4. Reuse Components with Templates

For repeating patterns, use dynamic children:

```json
// ✅ One template, many instances
{
  "id": "message-list",
  "Column": {
    "children": {
      "path": "/messages",
      "componentId": "message-card"
    }
  }
}
{
  "id": "message-card",
  "Card": {
    "children": {"array": ["message-text", "message-time"]}
  }
}
```

## Example: Building a Form

Let's build a login form step by step:

### Step 1: Create the Container

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "login-form",
        "Card": {
          "children": {"array": ["form-title", "form-fields", "submit-btn"]}
        }
      }
    ]
  }
}
```

### Step 2: Add the Title

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "form-title",
        "Text": {
          "text": {"literal": "Sign In"},
          "style": "headline"
        }
      }
    ]
  }
}
```

### Step 3: Add Form Fields

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "form-fields",
        "Column": {
          "children": {"array": ["email-field", "password-field"]}
        }
      },
      {
        "id": "email-field",
        "TextField": {
          "label": {"literal": "Email"},
          "value": {"path": "/login/email"}
        }
      },
      {
        "id": "password-field",
        "TextField": {
          "label": {"literal": "Password"},
          "type": {"literal": "password"},
          "value": {"path": "/login/password"}
        }
      }
    ]
  }
}
```

### Step 4: Add Submit Button

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "submit-btn",
        "Button": {
          "text": {"literal": "Sign In"},
          "onClick": {"actionId": "submit_login"}
        }
      }
    ]
  }
}
```

### Result

A complete login form with:

- Card container
- Title
- Email input
- Password input (masked)
- Submit button

All sent as four separate messages that can be streamed incrementally!

## Next Steps

- **[Data Binding](data-binding.md)**: Learn how to connect components to data
- **[Component Gallery](../reference/components.md)**: See all available component types
- **[Standard Catalog](../reference/catalog.md)**: Detailed component specifications
