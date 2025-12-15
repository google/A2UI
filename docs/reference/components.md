# Component Gallery

This page showcases all standard A2UI components with examples and usage patterns. For the complete technical specification, see the [Standard Catalog Definition](https://github.com/google/A2UI/blob/main/specification/0.8/json/standard_catalog_definition.json).

## Layout Components

### Row

Horizontal layout container. Children are arranged left-to-right.

```json
{
  "id": "toolbar",
  "component": {
    "Row": {
      "children": {"explicitList": ["btn1", "btn2", "btn3"]},
      "alignment": "center"
    }
  }
}
```

**Properties:**

- `children`: Static array (`explicitList`) or dynamic `template`
- `distribution`: Horizontal distribution of children (`start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`)
- `alignment`: Vertical alignment (`start`, `center`, `end`, `stretch`)

### Column

Vertical layout container. Children are arranged top-to-bottom.

```json
{
  "id": "content",
  "component": {
    "Column": {
      "children": {"explicitList": ["header", "body", "footer"]}
    }
  }
}
```

**Properties:**

- `children`: Static array (`explicitList`) or dynamic `template`
- `distribution`: Vertical distribution of children (`start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`)
- `alignment`: Horizontal alignment (`start`, `center`, `end`, `stretch`)

## Display Components

### Text

Display text content with optional styling.

```json
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome to A2UI"},
      "usageHint": "h1"
    }
  }
}
```

**`usageHint` values:** `h1`, `h2`, `h3`, `h4`, `h5`, `caption`, `body`

### Image

Display images from URLs.

```json
{
  "id": "logo",
  "component": {
    "Image": {
      "url": {"literalString": "https://example.com/logo.png"}
    }
  }
}
```

### Icon

Display icons using Material Icons or custom icon sets.

```json
{
  "id": "check-icon",
  "component": {
    "Icon": {
      "name": {"literalString": "check_circle"}
    }
  }
}
```

### Divider

Visual separator line.

```json
{
  "id": "separator",
  "component": {
    "Divider": {
      "axis": "horizontal"
    }
  }
}
```

## Interactive Components

### Button

Clickable button with action support.

```json
{
  "id": "submit-btn-text",
  "component": {
    "Text": {
      "text": { "literalString": "Submit" }
    }
  }
}
{
  "id": "submit-btn",
  "component": {
    "Button": {
      "child": "submit-btn-text",
      "primary": true,
      "action": {"name": "submit_form"}
    }
  }
}
```

**Properties:**
- `child`: The ID of the component to display in the button (e.g., a Text or Icon).
- `primary`: Boolean indicating if this is a primary action.
- `action`: The action to perform on click.

### TextField

Text input field.

```json
{
  "id": "email-input",
  "component": {
    "TextField": {
      "label": {"literalString": "Email Address"},
      "text": {"path": "/user/email"},
      "textFieldType": "shortText"
    }
  }
}
```

**`textFieldType` values:** `date`, `longText`, `number`, `shortText`, `obscured`

Boolean toggle.

```json
{
  "id": "terms-checkbox",
  "component": {
    "Checkbox": {
      "label": {"literalString": "I agree to the terms"},
      "value": {"path": "/form/agreedToTerms"}
    }
  }
}
```

## Container Components

### Card

Container with elevation/border and padding.

```json
{
  "id": "info-card",
  "component": {
    "Card": {
      "child": "card-content"
    }
  }
}
```

### Modal

Overlay dialog.

```json
{
  "id": "confirmation-modal",
  "component": {
    "Modal": {
      "entryPointChild": "open-modal-btn",
      "contentChild": "modal-content"
    }
  }
}
```

### Tabs

Tabbed interface.

```json
{
  "id": "settings-tabs",
  "component": {
    "Tabs": {
      "tabItems": [
        {"title": {"literalString": "General"}, "child": "general-settings"},
        {"title": {"literalString": "Privacy"}, "child": "privacy-settings"},
        {"title": {"literalString": "Advanced"}, "child": "advanced-settings"}
      ]
    }
  }
}
```

Scrollable list of items.

```json
{
  "id": "message-list",
  "component": {
    "List": {
      "children": {
        "template": {
          "dataBinding": "/messages",
          "componentId": "message-item"
        }
      }
    }
  }
}
```

## Common Properties

Most components support these common properties:

- `id` (required): Unique identifier for the component instance.
- `weight`: Flex-grow value when the component is a direct child of a Row or Column. This property is specified alongside `id` and `component`.

## Live Examples

To see all components in action, run the component gallery demo:

```bash
cd samples/client/angular
npm start -- gallery
```

This launches a live gallery with all components, their variations, and interactive examples.

## Further Reading

- **[Standard Catalog Definition](../../specification/0.9/json/standard_catalog_definition.json)**: Complete technical specification
- **[Custom Components Guide](../guides/custom-components.md)**: Build your own components
- **[Theming Guide](../guides/theming.md)**: Style components to match your brand
