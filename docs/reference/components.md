# Component Gallery

This page showcases all standard A2UI components with examples and usage patterns. For the complete technical specification, see the [Standard Catalog Definition](https://github.com/google/A2UI/blob/main/specification/0.9/json/standard_catalog_definition.json).

## Layout Components

### Row

Horizontal layout container. Children are arranged left-to-right.

```json
{
  "id": "toolbar",
  "Row": {
    "children": {"array": ["btn1", "btn2", "btn3"]},
    "gap": {"literal": 8},
    "alignment": {"literal": "center"}
  }
}
```

**Properties:**

- `children`: Static array or dynamic template
- `gap`: Spacing between children (number)
- `alignment`: Vertical alignment (`start`, `center`, `end`, `stretch`)

### Column

Vertical layout container. Children are arranged top-to-bottom.

```json
{
  "id": "content",
  "Column": {
    "children": {"array": ["header", "body", "footer"]},
    "gap": {"literal": 16}
  }
}
```

**Properties:**

- `children`: Static array or dynamic template
- `gap`: Spacing between children (number)
- `alignment`: Horizontal alignment (`start`, `center`, `end`, `stretch`)

### Stack

Layered layout (z-axis stacking). Children overlap.

```json
{
  "id": "card-with-badge",
  "Stack": {
    "children": {"array": ["background", "badge"]}
  }
}
```

### Spacer

Empty space for layout control.

```json
{
  "id": "spacer",
  "Spacer": {
    "size": {"literal": 24}
  }
}
```

## Display Components

### Text

Display text content with optional styling.

```json
{
  "id": "title",
  "Text": {
    "text": {"literal": "Welcome to A2UI"},
    "style": "headline"
  }
}
```

**Styles:** `headline`, `subheading`, `body`, `caption`, `overline`

### Image

Display images from URLs.

```json
{
  "id": "logo",
  "Image": {
    "src": {"literal": "https://example.com/logo.png"},
    "alt": {"literal": "Company Logo"},
    "width": {"literal": 200},
    "height": {"literal": 100}
  }
}
```

### Icon

Display icons using Material Icons or custom icon sets.

```json
{
  "id": "check-icon",
  "Icon": {
    "name": {"literal": "check_circle"},
    "color": {"literal": "green"},
    "size": {"literal": 24}
  }
}
```

### Divider

Visual separator line.

```json
{
  "id": "separator",
  "Divider": {
    "orientation": {"literal": "horizontal"}
  }
}
```

### ProgressIndicator

Loading or progress display.

```json
{
  "id": "loader",
  "ProgressIndicator": {
    "type": {"literal": "circular"},
    "value": {"path": "/uploadProgress"}
  }
}
```

**Types:** `circular`, `linear`

## Interactive Components

### Button

Clickable button with action support.

```json
{
  "id": "submit-btn",
  "Button": {
    "text": {"literal": "Submit"},
    "variant": {"literal": "primary"},
    "onClick": {"actionId": "submit_form"},
    "disabled": {"path": "/form/isSubmitting"}
  }
}
```

**Variants:** `primary`, `secondary`, `text`, `outlined`

### IconButton

Icon-based button.

```json
{
  "id": "delete-btn",
  "IconButton": {
    "icon": {"literal": "delete"},
    "onClick": {"actionId": "delete_item"}
  }
}
```

### TextField

Text input field.

```json
{
  "id": "email-input",
  "TextField": {
    "label": {"literal": "Email Address"},
    "value": {"path": "/user/email"},
    "type": {"literal": "email"},
    "placeholder": {"literal": "you@example.com"},
    "required": {"literal": true}
  }
}
```

**Types:** `text`, `email`, `password`, `url`, `tel`, `search`

### NumberInput

Numeric input field.

```json
{
  "id": "age-input",
  "NumberInput": {
    "label": {"literal": "Age"},
    "value": {"path": "/user/age"},
    "min": {"literal": 0},
    "max": {"literal": 120}
  }
}
```

### Checkbox

Boolean toggle.

```json
{
  "id": "terms-checkbox",
  "Checkbox": {
    "label": {"literal": "I agree to the terms"},
    "checked": {"path": "/form/agreedToTerms"}
  }
}
```

### RadioGroup

Multiple choice selection (single option).

```json
{
  "id": "size-selector",
  "RadioGroup": {
    "label": {"literal": "Size"},
    "value": {"path": "/product/size"},
    "options": {
      "literal": [
        {"value": "s", "label": "Small"},
        {"value": "m", "label": "Medium"},
        {"value": "l", "label": "Large"}
      ]
    }
  }
}
```

### Dropdown

Dropdown/select menu.

```json
{
  "id": "country-select",
  "Dropdown": {
    "label": {"literal": "Country"},
    "value": {"path": "/user/country"},
    "options": {
      "literal": [
        {"value": "us", "label": "United States"},
        {"value": "ca", "label": "Canada"},
        {"value": "uk", "label": "United Kingdom"}
      ]
    }
  }
}
```

### DatePicker

Date selection.

```json
{
  "id": "birthday-picker",
  "DatePicker": {
    "label": {"literal": "Birthday"},
    "value": {"path": "/user/birthday"},
    "min": {"literal": "1900-01-01"},
    "max": {"literal": "2025-12-31"}
  }
}
```

### TimePicker

Time selection.

```json
{
  "id": "appointment-time",
  "TimePicker": {
    "label": {"literal": "Appointment Time"},
    "value": {"path": "/appointment/time"}
  }
}
```

## Container Components

### Card

Container with elevation/border and padding.

```json
{
  "id": "info-card",
  "Card": {
    "children": {"array": ["card-header", "card-body"]},
    "variant": {"literal": "elevated"}
  }
}
```

**Variants:** `elevated`, `filled`, `outlined`

### Modal

Overlay dialog.

```json
{
  "id": "confirmation-modal",
  "Modal": {
    "children": {"array": ["modal-content"]},
    "open": {"path": "/ui/modalOpen"},
    "title": {"literal": "Confirm Action"}
  }
}
```

### ExpansionPanel

Collapsible section.

```json
{
  "id": "faq-item",
  "ExpansionPanel": {
    "title": {"literal": "What is A2UI?"},
    "children": {"array": ["faq-answer"]},
    "expanded": {"path": "/ui/faqExpanded"}
  }
}
```

### Tabs

Tabbed interface.

```json
{
  "id": "settings-tabs",
  "Tabs": {
    "value": {"path": "/ui/selectedTab"},
    "tabs": {
      "literal": [
        {"value": "general", "label": "General"},
        {"value": "privacy", "label": "Privacy"},
        {"value": "advanced", "label": "Advanced"}
      ]
    },
    "children": {"array": ["tab-content"]}
  }
}
```

## Specialized Components

### Timeline

Event timeline display.

```json
{
  "id": "order-timeline",
  "Timeline": {
    "items": {"path": "/order/events"},
    "itemTemplate": "timeline-item"
  }
}
```

### DataTable

Table for structured data.

```json
{
  "id": "users-table",
  "DataTable": {
    "columns": {
      "literal": [
        {"key": "name", "label": "Name"},
        {"key": "email", "label": "Email"},
        {"key": "role", "label": "Role"}
      ]
    },
    "data": {"path": "/users"}
  }
}
```

### List

Scrollable list of items.

```json
{
  "id": "message-list",
  "List": {
    "items": {"path": "/messages"},
    "itemTemplate": "message-item"
  }
}
```

### CustomComponent

For client-defined custom components.

```json
{
  "id": "google-map",
  "CustomComponent": {
    "name": "GoogleMap",
    "properties": {
      "center": {"literal": {"lat": 37.7749, "lng": -122.4194}},
      "zoom": {"literal": 12}
    }
  }
}
```

## Common Properties

Most components support these common properties:

- `id` (required): Unique identifier
- `visible`: Show/hide component (`booleanOrPath`)
- `weight`: Flex-grow value when in Row/Column (`numberOrPath`)

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
