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
- Difficult to stream incrementally

### A2UI Adjacency List (✅ The Right Way)

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": {
          "Column": {
            "children": {"explicitList": ["greeting", "button-row"]}
          }
        }
      },
      {
        "id": "greeting",
        "component": {
          "Text": {
            "text": {"literalString": "Hello"}
          }
        }
      },
      {
        "id": "button-row",
        "component": {
          "Row": {
            "children": {"explicitList": ["cancel-btn", "ok-btn"]}
          }
        }
      },
      {
        "id": "cancel-btn",
        "component": {
          "Button": {
            "child": "cancel-btn-text",
            "action": {"name": "cancel_action"}
          }
        }
      },
      {
        "id": "cancel-btn-text",
        "component": {
          "Text": {
            "text": {"literalString": "Cancel"}
          }
        }
      },
      {
        "id": "ok-btn",
        "component": {
          "Button": {
            "child": "ok-btn-text",
            "action": {"name": "ok_action"}
          }
        }
      },
      {
        "id": "ok-btn-text",
        "component": {
          "Text": {
            "text": {"literalString": "OK"}
          }
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
  "component": {
    "Text": {
      "text": {"literalString": "Welcome to A2UI"},
      "usageHint": "h1"
    }
  }
}
```

- **id**: `"welcome-message"` - Unique identifier
- **Type**: `Text` - This is a text component
- **Properties**: `text` and `usageHint` - Configuration

### Component Types

A2UI defines a **Standard Catalog** of component types:

#### Layout Components

- **Row**: Arranges components horizontally.
- **Column**: Arranges components vertically.
- **List**: A scrollable list of components, arranged horizontally or vertically.

#### Display Components

- **Text**: Displays a string of text.
- **Image**: Displays an image from a URL.
- **Icon**: Displays a named icon from a predefined set.
- **Video**: Displays a video player from a URL.
- **AudioPlayer**: Displays an audio player from a URL.
- **Divider**: A thin horizontal or vertical line.

#### Interactive Components

- **Button**: A clickable button that triggers an action.
- **CheckBox**: A checkbox that can be toggled on or off.
- **TextField**: A field for user text input.
- **DateTimeInput**: An input for selecting a date, time, or both.
- **MultipleChoice**: A component for selecting one or more options from a list.
- **Slider**: A slider for selecting a value from a range.

#### Container Components

- **Card**: A container with elevation and rounded corners, grouping related content.
- **Tabs**: A component that displays a set of tabs, each with its own content.
- **Modal**: A dialog that appears on top of the main content.

## Children: Static vs. Dynamic

Components can contain children in two ways:

### 1. Static Children (explicitList)

A fixed list of child component IDs:

```json
{
  "id": "toolbar",
  "component": {
    "Row": {
      "children": {"explicitList": ["back-btn", "title", "menu-btn"]}
    }
  }
}
```

**Use when:** You know exactly what children to show.

### 2. Dynamic Children (Template)

Generate children from a data array using a template:

```json
{
  "id": "item-list",
  "component": {
    "Column": {
      "children": {
        "template": {
          "dataBinding": "/items",
          "componentId": "item-template"
        }
      }
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
  "component": {
    "Card": {
      "child": "item-content" 
    }
  }
}
```
*Note: For simplicity, the template's content components like "item-content", "item-name", and "item-price" are not shown here. The key is that `item-template` is a reusable component definition.*

**Result:** Three cards are rendered, one for each item in the array.

**Use when:** You have a dynamic list from data (search results, cart items, messages, etc.).

## Component Properties

Properties can be **literal values** or **data bindings**.

### Literal Values

```json
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome"}
    }
  }
}
```

The text will always be "Welcome".

### Data Bindings

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
  "component": {
    "Row": {
      "children": {"explicitList": ["sidebar", "content"]}
    }
  }
}
```

```json
{
  "id": "sidebar",
  "weight": 1,
  "component": {
    "Card": {
      "child": "sidebar-content"
    }
  }
}
```

```json
{
  "id": "content",
  "weight": 3,
  "component": {
    "Card": {
      "child": "main-content"
    }
  }
}
```

This creates a layout where `sidebar` takes 25% of the width and `content` takes 75% (ratio of 1:3).

**Weight corresponds to CSS `flex-grow`.**

## Incremental Updates

The adjacency list model shines when updating UIs:

### Adding Components

Send a new `surfaceUpdate` message with additional components:

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "new-button-text",
        "component": {
          "Text": {"text": {"literalString": "Click Me"}}
        }
      },
      {
        "id": "new-button",
        "component": {
          "Button": {
            "child": "new-button-text",
            "action": {"name": "new_action"}
          }
        }
      }
    ]
  }
}
```

### Updating Existing Components

Send a `surfaceUpdate` message with the same ID but new properties:

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "existing-button-text",
        "component": {
          "Text": {
            "text": {"literalString": "Updated Text"}
          }
        }
      }
    ]
  }
}
```

The client merges the new properties into the existing component. *Note: In this example, we update the `Text` component that is the button's child to change its label.*

### Removing Components

Update a parent to remove a child from its `children` array:

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "container",
        "component": {
          "Column": {
            "children": {"explicitList": ["child1", "child3"]}
          }
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
  "component": {
    "Card": {
      "child": "profile-content"
    }
  }
}
{
  "id": "profile-content",
  "component": {
    "Column": {
       "children": {"explicitList": ["name-text", "email-text"]}
    }
  }
}
{
  "id": "name-text",
  "component": {
    "Text": {
      "text": {"literalString": "Alice Smith"}
    }
  }
}

// ✅ Use data binding for content
{
  "id": "profile",
  "component": {
     "Card": {
      "child": "profile-content"
    }
  }
}
{
  "id": "profile-content",
  "component": {
    "Column": {
       "children": {"explicitList": ["name-text", "email-text"]}
    }
  }
}
{
  "id": "name-text",
  "component": {
    "Text": {
      "text": {"path": "/user/name"}
    }
  }
}
```

Then update content via `dataModelUpdate` without touching components.

### 4. Reuse Components with Templates

For repeating patterns, use dynamic children:

```json
// ✅ One template, many instances
{
  "id": "message-list",
  "component": {
    "Column": {
      "children": {
        "template": {
          "dataBinding": "/messages",
          "componentId": "message-card"
        }
      }
    }
  }
}
{
  "id": "message-card",
  "component": {
    "Card": {
      "child": "message-content"
    }
  }
}
{
  "id": "message-content",
  "component": {
     "Row": {
        "children": {"explicitList": ["message-text", "message-time"]}
     }
  }
}
```

## Example: Building a Form

Let's build a login form. The following `surfaceUpdate` message contains all the components needed to render a complete login form. In a real application, these could be streamed in smaller batches.

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "login-form",
        "component": {
          "Card": {
            "child": "form-content"
          }
        }
      },
      {
        "id": "form-content",
        "component": {
          "Column": {
            "children": {"explicitList": ["form-title", "email-field", "password-field", "submit-btn"]}
          }
        }
      },
      {
        "id": "form-title",
        "component": {
          "Text": {
            "text": {"literalString": "Sign In"},
            "usageHint": "h1"
          }
        }
      },
      {
        "id": "email-field",
        "component": {
          "TextField": {
            "label": {"literalString": "Email"},
            "text": {"path": "/login/email"}
          }
        }
      },
      {
        "id": "password-field",
        "component": {
          "TextField": {
            "label": {"literalString": "Password"},
            "textFieldType": "obscured",
            "text": {"path": "/login/password"}
          }
        }
      },
      {
        "id": "submit-btn",
        "component": {
          "Button": {
            "child": "submit-btn-text",
            "action": {"name": "submit_login"}
          }
        }
      },
      {
        "id": "submit-btn-text",
        "component": {
          "Text": {
            "text": {"literalString": "Sign In"}
          }
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

All defined in a single, declarative message!

## Next Steps

- **[Data Binding](data-binding.md)**: Learn how to connect components to data
- **[Component Reference](../reference/components.md)**: See all available component types
