# Component Gallery

This page showcases all A2UI components with examples and usage patterns.

=== "v0.8"

    For the complete technical specification, see the [Standard Catalog Definition](https://a2ui.org/specification/v0_8/standard_catalog_definition.json).

=== "v0.9"

    For the complete technical specification, see the [Basic Catalog Definition](https://a2ui.org/specification/v0_9/basic_catalog.json).

---

## Layout Components

### Row

Horizontal layout container. Children are arranged left-to-right.

**Properties:** `children`, `justify` / `distribution`, `align` / `alignment`

=== "v0.8"

    ```json
    {
      "id": "toolbar",
      "component": {
        "Row": {
          "children": { "explicitList": ["btn1", "btn2", "btn3"] },
          "alignment": "center"
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "toolbar",
      "component": "Row",
      "children": ["btn1", "btn2", "btn3"],
      "align": "center"
    }
    ```

### Column

Vertical layout container. Children are arranged top-to-bottom.

**Properties:** `children`, `justify` / `distribution`, `align` / `alignment`

=== "v0.8"

    ```json
    {
      "id": "content",
      "component": {
        "Column": {
          "children": { "explicitList": ["header", "body", "footer"] }
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "content",
      "component": "Column",
      "children": ["header", "body", "footer"]
    }
    ```

### List

Scrollable list of items. Supports both static children and dynamic templates.

**Properties:** `children`, `direction` (`horizontal` / `vertical`), `alignment`

=== "v0.8"

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

=== "v0.9"

    ```json
    {
      "id": "message-list",
      "component": "List",
      "children": {
        "componentId": "message-item",
        "path": "/messages"
      }
    }
    ```

---

## Display Components

### Text

Display text content with styling hints.

**Properties:** `text`, `variant` (v0.9) / `usageHint` (v0.8) — values: `h1`–`h5`, `caption`, `body`

=== "v0.8"

    ```json
    {
      "id": "title",
      "component": {
        "Text": {
          "text": { "literalString": "Welcome to A2UI" },
          "usageHint": "h1"
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "title",
      "component": "Text",
      "text": "Welcome to A2UI",
      "variant": "h1"
    }
    ```

### Image

Display images from URLs.

**Properties:** `url`, `fit` (`cover`, `contain`, etc.), `variant` (`avatar`, `hero`, etc.)

=== "v0.8"

    ```json
    {
      "id": "logo",
      "component": {
        "Image": {
          "url": { "literalString": "https://example.com/logo.png" }
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "logo",
      "component": "Image",
      "url": "https://example.com/logo.png"
    }
    ```

### Icon

Display icons from the standard set defined in the catalog.

**Properties:** `name`

=== "v0.8"

    ```json
    {
      "id": "check-icon",
      "component": {
        "Icon": {
          "name": { "literalString": "check" }
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "check-icon",
      "component": "Icon",
      "name": "check"
    }
    ```

### Divider

Visual separator line.

**Properties:** `axis` (`horizontal`, `vertical`)

=== "v0.8"

    ```json
    {
      "id": "separator",
      "component": {
        "Divider": { "axis": "horizontal" }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "separator",
      "component": "Divider",
      "axis": "horizontal"
    }
    ```

---

## Interactive Components

### Button

Clickable button that triggers an action.

**Properties:** `child` (component ID to display), `variant` (v0.9) / `primary` (v0.8), `action`

=== "v0.8"

    ```json
    {
      "id": "submit-btn",
      "component": {
        "Button": {
          "child": "submit-text",
          "primary": true,
          "action": { "name": "submit_form" }
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "submit-btn",
      "component": "Button",
      "child": "submit-text",
      "variant": "primary",
      "action": {
        "event": { "name": "submit_form" }
      }
    }
    ```

### TextField

Text input field with optional validation.

**Properties:** `label`, `text` / `value` (data-bound), `textFieldType` (`shortText`, `longText`, `number`, `obscured`, `date`), `validationRegexp`

=== "v0.8"

    ```json
    {
      "id": "email-input",
      "component": {
        "TextField": {
          "label": { "literalString": "Email Address" },
          "text": { "path": "/user/email" },
          "textFieldType": "shortText"
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "email-input",
      "component": "TextField",
      "label": "Email Address",
      "value": { "path": "/user/email" },
      "textFieldType": "shortText"
    }
    ```

### CheckBox

Boolean toggle.

**Properties:** `label`, `value` (data-bound boolean)

=== "v0.8"

    ```json
    {
      "id": "terms-checkbox",
      "component": {
        "CheckBox": {
          "label": { "literalString": "I agree to the terms" },
          "value": { "path": "/form/agreedToTerms" }
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "terms-checkbox",
      "component": "CheckBox",
      "label": "I agree to the terms",
      "value": { "path": "/form/agreedToTerms" }
    }
    ```

### Slider

Numeric range input.

**Properties:** `value` (data-bound), `minValue`, `maxValue`

=== "v0.8"

    ```json
    {
      "id": "volume",
      "component": {
        "Slider": {
          "value": { "path": "/settings/volume" },
          "minValue": 0,
          "maxValue": 100
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "volume",
      "component": "Slider",
      "value": { "path": "/settings/volume" },
      "minValue": 0,
      "maxValue": 100
    }
    ```

### DateTimeInput

Date and/or time picker.

**Properties:** `value` (data-bound), `enableDate`, `enableTime`

=== "v0.8"

    ```json
    {
      "id": "date-picker",
      "component": {
        "DateTimeInput": {
          "value": { "path": "/booking/date" },
          "enableDate": true,
          "enableTime": false
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "date-picker",
      "component": "DateTimeInput",
      "value": { "path": "/booking/date" },
      "enableDate": true,
      "enableTime": false
    }
    ```

### ChoicePicker / MultipleChoice

Select one or more options from a list.

!!! note "Renamed in v0.9"
    `MultipleChoice` in v0.8 → `ChoicePicker` in v0.9

**Properties:** `options` (array of label/value pairs), `selections` (data-bound), `maxAllowedSelections`

=== "v0.8"

    ```json
    {
      "id": "country-select",
      "component": {
        "MultipleChoice": {
          "options": [
            { "label": { "literalString": "USA" }, "value": "us" },
            { "label": { "literalString": "Canada" }, "value": "ca" }
          ],
          "selections": { "path": "/form/country" },
          "maxAllowedSelections": 1
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "country-select",
      "component": "ChoicePicker",
      "options": [
        { "label": "USA", "value": "us" },
        { "label": "Canada", "value": "ca" }
      ],
      "selections": { "path": "/form/country" },
      "maxAllowedSelections": 1
    }
    ```

---

## Container Components

### Card

Container with elevation/border and padding.

**Properties:** `child` (component ID)

=== "v0.8"

    ```json
    {
      "id": "info-card",
      "component": {
        "Card": { "child": "card-content" }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "info-card",
      "component": "Card",
      "child": "card-content"
    }
    ```

### Modal

Overlay dialog triggered by an entry point component.

**Properties:** `entryPointChild` (trigger component ID), `contentChild` (dialog content ID)

=== "v0.8"

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

=== "v0.9"

    ```json
    {
      "id": "confirmation-modal",
      "component": "Modal",
      "entryPointChild": "open-modal-btn",
      "contentChild": "modal-content"
    }
    ```

### Tabs

Tabbed interface for organizing content into switchable panels.

**Properties:** `tabItems` (array of `{ title, child }`)

=== "v0.8"

    ```json
    {
      "id": "settings-tabs",
      "component": {
        "Tabs": {
          "tabItems": [
            { "title": { "literalString": "General" }, "child": "general-tab" },
            { "title": { "literalString": "Privacy" }, "child": "privacy-tab" }
          ]
        }
      }
    }
    ```

=== "v0.9"

    ```json
    {
      "id": "settings-tabs",
      "component": "Tabs",
      "tabItems": [
        { "title": "General", "child": "general-tab" },
        { "title": "Privacy", "child": "privacy-tab" }
      ]
    }
    ```

---

## Common Properties

All components share:

- `id` (required): Unique identifier within the surface
- `accessibility`: Accessibility attributes (label, role)
- `weight`: Flex-grow value when inside a Row or Column

## Version Differences Summary

The component *names* and *properties* are largely the same across versions. The structural differences are:

| Aspect | v0.8 | v0.9 |
|--------|------|------|
| Component wrapper | `"component": { "Text": { ... } }` | `"component": "Text", ...props` |
| String values | `{ "literalString": "Hello" }` | `"Hello"` |
| Children | `{ "explicitList": ["a", "b"] }` | `["a", "b"]` |
| Data binding | `{ "path": "/data" }` | `{ "path": "/data" }` (same) |
| Text styling | `usageHint` | `variant` |
| Button styling | `primary: true` | `variant: "primary"` |
| Choice component | `MultipleChoice` | `ChoicePicker` |

## Live Examples

To see all components in action:

```bash
cd samples/client/angular
npm start -- gallery
```

## Further Reading

=== "v0.8"

    - **[Standard Catalog Definition](https://a2ui.org/specification/v0_8/standard_catalog_definition.json)**: Complete v0.8 component schemas

=== "v0.9"

    - **[Basic Catalog Definition](https://a2ui.org/specification/v0_9/basic_catalog.json)**: Complete v0.9 component schemas

- **[Custom Components Guide](../guides/custom-components.md)**: Build your own components
- **[Theming Guide](../guides/theming.md)**: Style components to match your brand
