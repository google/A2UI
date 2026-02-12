# Component Gallery

This page showcases all standard A2UI components with examples and usage patterns. For the complete technical specification, see the [Standard Catalog Definition](../specification/v0_9/standard_catalog.json).

## Layout Components

### Row

Horizontal layout container. Children are arranged left-to-right.

```json
{
  "id": "toolbar",
  "component": "Row",
  "children": ["btn1", "btn2", "btn3"],
  "align": "center"
}
```

**Properties:**

- `children`: Static array of IDs or dynamic `template`
- `justify`: Horizontal distribution (`start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`)
- `align`: Vertical alignment (`start`, `center`, `end`, `stretch`)

### Column

Vertical layout container. Children are arranged top-to-bottom.

```json
{
  "id": "content",
  "component": "Column",
  "children": ["header", "body", "footer"]
}
```

**Properties:**

- `children`: Static array of IDs or dynamic `template`
- `justify`: Vertical distribution (`start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`)
- `align`: Horizontal alignment (`start`, `center`, `end`, `stretch`)

## Display Components

### Text

Display text content with optional styling.

```json
{
  "id": "title",
  "component": "Text",
  "text": "Welcome to A2UI",
  "variant": "h1"
}
```

**`variant` values:** `h1`, `h2`, `h3`, `h4`, `h5`, `caption`, `body`

### Image

Display images from URLs.

```json
{
  "id": "logo",
  "component": "Image",
  "url": "https://example.com/logo.png",
  "fit": "contain",
  "variant": "mediumFeature"
}
```

**Properties:**

- `url`: The URL of the image.
- `fit`: CSS-like object-fit (`contain`, `cover`, `fill`, `none`, `scale-down`).
- `variant`: Image style nuance (`icon`, `avatar`, `smallFeature`, `mediumFeature`, `largeFeature`, `header`).

### Icon

Display icons using Material Icons or custom icon sets.

```json
{
  "id": "check-icon",
  "component": "Icon",
  "name": "check"
}
```

### Video

Display video content.

```json
{
  "id": "promo-video",
  "component": "Video",
  "url": "https://example.com/video.mp4"
}
```

### AudioPlayer

Play audio files.

```json
{
  "id": "podcast-player",
  "component": "AudioPlayer",
  "url": "https://example.com/podcast.mp3",
  "description": "Episode 1: Introduction"
}
```

### Divider

Visual separator line.

```json
{
  "id": "separator",
  "component": "Divider",
  "axis": "horizontal"
}
```

## Interactive Components

### Button

Clickable button with action support.

```json
{
  "id": "submit-btn-text",
  "component": "Text",
  "text": "Submit"
}
{
  "id": "submit-btn",
  "component": "Button",
  "child": "submit-btn-text",
  "variant": "primary",
  "action": {"name": "submit_form"}
}
```

**Properties:**
- `child`: The ID of the component to display in the button.
- `variant`: Button style (`primary`, `borderless`).
- `action`: The action to perform on click.

### TextField

Text input field.

```json
{
  "id": "email-input",
  "component": "TextField",
  "label": "Email Address",
  "value": {"path": "/user/email"},
  "variant": "shortText"
}
```

**`variant` values:** `longText`, `number`, `shortText`, `obscured`



### CheckBox

Boolean toggle.

```json
{
  "id": "terms-checkbox",
  "component": "CheckBox",
  "label": "I agree to the terms",
  "value": {"path": "/form/agreedToTerms"}
}
```

### ChoicePicker

Select from a list of options.

```json
{
  "id": "toppings-picker",
  "component": "ChoicePicker",
  "label": "Choose toppings",
  "options": [
    {"label": "Cheese", "value": "cheese"},
    {"label": "Pepperoni", "value": "pepperoni"},
    {"label": "Mushrooms", "value": "mushrooms"}
  ],
  "value": {"path": "/order/toppings"},
  "variant": "multipleSelection"
}
```

**`variant` values:** `multipleSelection` (checkboxes/chips), `mutuallyExclusive` (radio buttons)

### Slider

Select a numeric value from a range.

```json
{
  "id": "volume-slider",
  "component": "Slider",
  "label": "Volume",
  "min": 0,
  "max": 100,
  "value": {"path": "/settings/volume"}
}
```

### DateTimeInput

Date and time selection.

```json
{
  "id": "appointment-date",
  "component": "DateTimeInput",
  "label": "Appointment Date",
  "enableDate": true,
  "enableTime": true,
  "value": {"path": "/booking/date"}
}
```

## Container Components

### Card

Container with elevation/border and padding.

```json
{
  "id": "info-card",
  "component": "Card",
  "child": "card-content"
}
```

### Modal

Overlay dialog.

```json
{
  "id": "confirmation-modal",
  "component": "Modal",
  "trigger": "open-modal-btn",
  "content": "modal-content"
}
```

### Tabs

Tabbed interface.

```json
{
  "id": "settings-tabs",
  "component": "Tabs",
  "tabs": [
    {"title": "General", "child": "general-settings"},
    {"title": "Privacy", "child": "privacy-settings"},
    {"title": "Advanced", "child": "advanced-settings"}
  ]
}
```

### List

Scrollable list of items.

```json
{
  "id": "message-list",
  "component": "List",
  "children": {
    "template": {
      "path": "/messages",
      "componentId": "message-item"
    }
  }
}
```

## Common Properties

Most components support these common properties:

- `id` (required): Unique identifier for the component instance.
- `weight`: Flex-grow value when the component is a direct child of a Row or Column.

## Live Examples

To see all components in action, run the component gallery demo:

```bash
cd samples/client/angular
npm start -- gallery
```

This launches a live gallery with all components, their variations, and interactive examples.

## Further Reading

- **[Standard Catalog Definition](../specification/v0_9/standard_catalog.json)**: Complete technical specification
- **[Client-Side Functions](functions.md)**: Standard catalog functions for validation and formatting
- **[Custom Components Guide](../guides/custom-components.md)**: Build your own components
- **[Theming Guide](../guides/theming.md)**: Style components to match your brand
