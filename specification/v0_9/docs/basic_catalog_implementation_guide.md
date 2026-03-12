# A2UI Basic Catalog Implementation Guide

This guide is designed for renderer and client developers implementing the A2UI Basic Catalog (v0.9). It details how to visually present and functionally implement each component and client-side function defined in the catalog.

When building your framework-specific adapters (Layer 3) over the generic A2UI bindings, refer to this document for the expected visual behaviors, suggested layouts, and interaction patterns. This guide uses generic terminology applicable to Web, Mobile (iOS/Android), and Desktop platforms.

---

## 1. Components

### Text
Displays text content.

**Rendering Guidelines:** Text should be rendered using a Markdown parser when possible. If markdown rendering is unavailable or fails, gracefully fallback to rendering the raw text using the framework's default text primitive (e.g., `<span>` in HTML, `Text` in Compose/SwiftUI).
**Property Mapping:**
- `variant="h1"` through `h5"`: Apply heading styling. Suggested relative font sizes: `h1` (2.5x base), `h2` (2x base), `h3` (1.75x base), `h4` (1.5x base), `h5` (1.25x base).
- `variant="caption"`: Render as smaller text, typically italicized or in a lighter/muted color. Suggested font size: 0.8x base.
- `variant="body"` (default): Standard body text. Uses the base font size (e.g., 16dp/16px).

### Image
Displays an image from a URL.

**Rendering Guidelines:** Ensure the component defaults to a flexible width so it fills its container.
**Property Mapping:**
- `fit`: Map the property to the platform's equivalent content scaling mode (e.g., CSS `object-fit`, iOS `contentMode`, Android `ScaleType`).
- `variant="icon"`: Render very small and square (e.g., 24x24dp).
- `variant="avatar"`: Render small and rounded/circular (e.g., 40x40dp, fully rounded corners).
- `variant="smallFeature"`: Render as a small rectangle (e.g., 100x100dp).
- `variant="mediumFeature"` (default): Render as a medium rectangle (e.g., 100% width up to 300dp, or 200x200dp).
- `variant="largeFeature"`: Render as a large prominent image (e.g., 100% width, max height 400dp).
- `variant="header"`: Render as a full-width banner image, usually at the top of a surface (e.g., 100% width, height 200dp, scaling mode set to cover/crop).

### Icon
Displays a standard system icon.

**Rendering Guidelines:** Map the icon `name` to a system or bundled icon set (e.g., Material Symbols, SF Symbols). The string `name` from the data model (e.g., `accountCircle`) should be converted to the required format (like snake_case `account_circle`) if required by the icon engine. Suggested styling: 24dp size and inherit the current text color.

### Video
A video player.

**Rendering Guidelines:** Render using a native video player component with user controls enabled. Ensure the video container spans the full width of the parent's container for responsiveness.

### AudioPlayer
An audio player.

**Rendering Guidelines:** Render using a native audio player component with user controls enabled. Like video, its container should span the full width of its parent.

### Row
A horizontal layout container.

**Rendering Guidelines:** Implemented using a horizontal layout container (e.g., CSS Flexbox row, Compose `Row`, SwiftUI `HStack`). Ensure it fills the available width.
**Property Mapping:**
- `justify`: Maps to main-axis alignment (e.g., `justify-content` in CSS, `horizontalArrangement` in Compose). Use equivalents for pushing items to edges (`spaceBetween`) or packing them together (`start`, `center`, `end`).
- `align`: Maps to cross-axis alignment (e.g., `align-items` in CSS, `verticalAlignment` in Compose). Use equivalents for top (`start`), center, or bottom (`end`).

### Column
A vertical layout container.

**Rendering Guidelines:** Implemented using a vertical layout container (e.g., CSS Flexbox column, Compose `Column`, SwiftUI `VStack`).
**Property Mapping:**
- `justify`: Maps to main-axis alignment on the vertical axis.
- `align`: Maps to cross-axis alignment on the horizontal axis.

### List
A scrollable list of components.

**Rendering Guidelines:** Children of a horizontal list should typically have a constrained max-width so they do not stretch indefinitely.
**Property Mapping:**
- `direction="vertical"` (default): Implement as a vertically scrollable view (e.g., CSS `overflow-y: auto`, Compose `LazyColumn`, SwiftUI `ScrollView` vertical).
- `direction="horizontal"`: Implement as a horizontally scrollable view. Hide the scrollbar for a cleaner look if supported by the platform.

### Card
A container with card-like styling that visually groups its child.

**Rendering Guidelines:** Applies a background color distinct from the main surface, rounded corners (e.g., 8dp or 12dp), a subtle shadow or elevation, and inner padding (e.g., 16dp). Note that the card accepts exactly **one** child. If the user wants multiple elements inside a card, they must provide a container (like `Column`) as the single child.

### Tabs
A set of tabs, each with a title and a corresponding child component.

**Rendering Guidelines:** Render a horizontal row of interactive tab headers for the `titles`. Visually indicate the active tab (e.g., bold text, colored bottom border).
**Behavior & State:** Maintain a local `selectedIndex` state (defaulting to 0). When a tab header is tapped, update `selectedIndex` and render *only* the `child` component that corresponds to that index.

### Divider
A dividing line to separate content.

**Property Mapping:**
- `axis="horizontal"` (default): Render a 1dp tall line spanning 100% width with a subtle border/outline color.
- `axis="vertical"`: Render a 1dp wide line with a set height, spanning the height of the container.

### Modal
A dialog window.

**Rendering Guidelines:**
- **Desktop UIs**: Render as a centered popup or native dialog window over the main content, typically with a dimmed backdrop.
- **Mobile UIs**: Render as a bottom sheet or full-screen dialog over the main content.
- You must provide a mechanism to close the modal (e.g., an "X" button, clicking/tapping the backdrop overlay, or a swipe-to-dismiss gesture).

**Behavior & State:** This component behaves differently than a standard container. It acts as a **Modal Entry Point**. When instantiated, the user only sees the `trigger` child component on the screen (which usually acts and looks like a Button). The modal logic intercepts interactions (taps/clicks) on the `trigger`. When the `trigger` is tapped, the modal opens and displays the `content` child component.

### Button
An interactive button that dispatches a protocol action.

**Rendering Guidelines:** Render as a native interactive button component. It must render its `child` component inside the button (usually a `Text` or `Icon`).
**Behavior & State:** When tapped, it dispatches the `action` back to the server, dynamically resolving the context variables at the moment of the interaction.
**Property Mapping:**
- `variant="default"`: Standard button with a subtle background and border.
- `variant="primary"`: Prominent call-to-action button using the theme's `primaryColor` for its background, and contrasting text.
- `variant="borderless"`: Button with no background or border, appearing like a clickable text link.

### TextField
A field for user text input.

**Rendering Guidelines:** Render using the platform's native text input control.
**Behavior & State:** Establishes **Two-Way Binding**. As the user types, immediately write the new string back to the local data model path bound to `value`.
**Property Mapping:**
- `variant="shortText"` (default): Standard single-line input field.
- `variant="longText"`: Render as a multi-line text area.
- `variant="number"`: Render as a numeric input field, typically showing a numeric keyboard on mobile.
- `variant="obscured"`: Render as an obscured password/secure field.

### CheckBox
A toggleable control with a label.

**Rendering Guidelines:** Render a native checkbox or toggle switch component alongside a text label.
**Behavior & State:** Triggers two-way binding on the `value` path, setting it to boolean `true` or `false` when interacted with.

### ChoicePicker
A component for selecting one or more options from a list.

**Rendering Guidelines:**
- `displayStyle="checkbox"` (default): Render as a dropdown menu, picker wheel, or an expanding vertical list of selectable options. A dropdown wrapper is preferred to save space.
- `displayStyle="chips"`: Render as a horizontal, wrapping row of selectable chips/pills. Selected chips should have a distinct background/border.
- If `filterable` is true, render a text input above the list of options. As the user types, filter the visible options using a case-insensitive substring match on the option labels.

**Behavior & State:** Binds to an array of strings in the data model representing the active selections. Toggle selections in the data model upon user interaction.

### Slider
A control for selecting a numeric value within a range.

**Rendering Guidelines:** Render using the platform's native slider or seek bar component. Optionally display the current numeric value next to the slider track.
**Behavior & State:** Set `min` and `max` limits. Perform two-way binding, updating the numeric `value` path as the user drags the slider.

### DateTimeInput
An input for date and/or time.

**Rendering Guidelines:** Render using native date and time picker controls.
- If `enableDate` and `enableTime` are both true, show both date and time selection UI.
- If only `enableDate` is true, show only a date picker.
- If only `enableTime` is true, show only a time picker.

**Behavior & State:** The component must convert the platform's native date/time format into a standard ISO 8601 string before writing it to the A2UI data model, and correctly parse ISO 8601 strings coming from the model into the input field.

---

## 2. Client-Side Functions

Functions provide client-side logic for validation, interpolation, and operations.

### Validation Functions (Return Boolean)

*   `required`: Return `true` if the argument `value` is strictly not `null`, not `undefined`, not an empty string `""`, and not an empty array `[]`. Otherwise `false`.
*   `regex`: Instantiate a regular expression using `args.pattern`. Test the `args.value` string against it. Return the boolean result.
*   `length`: Ensure the `args.value` string length is `>= args.min` (if `min` is provided) and `<= args.max` (if `max` is provided).
*   `numeric`: Parse `args.value` as a number. Ensure it is `>= args.min` (if provided) and `<= args.max` (if provided).
*   `email`: Test `args.value` against a standard email regex pattern.

### Formatting & Interpolation Functions (Return String)

*   `formatString`: The core interpolation engine. Parses the `args.value` string for `${expression}` blocks.
    *   If the expression is a data path (starts with `/` or is relative), resolve it from the `DataContext`.
    *   If it is a function call (e.g., `now()`), execute the registered function.
    *   Escape sequences (`\${`) must be replaced with a literal `${`.
    *   Convert all resolved values to strings before substitution (following type coercion standards).
*   `formatNumber`: Format `args.value` as a number. Use native locale formatting (e.g., `Intl.NumberFormat` on the web or `NumberFormatter` natively). If `args.decimals` is provided, force the minimum and maximum fraction digits to that value. Enable grouping (e.g., thousands separators) unless `args.grouping` is explicitly `false`.
*   `formatCurrency`: Similar to `formatNumber`, but use the currency style formatting and apply `args.currency` (e.g., 'USD').
*   `formatDate`: Parse `args.value` into a Date/Time object. Interpret the Unicode TR35 `args.format` string (e.g., `yyyy-MM-dd`, `HH:mm`) and construct the formatted date string using platform-specific date formatting libraries.
*   `pluralize`: Resolve the plural category for the numeric `args.value` based on the current locale. Map the resulting category (`zero`, `one`, `two`, `few`, `many`, `other`) to the corresponding string provided in `args`. If a specific category string is missing, fallback to `args.other`.

### Operational Functions

*   `openUrl`: Open the `args.url` using the native platform's URL handler (e.g., opening in the system browser or deep-linking to an app). Returns `void`.

### Logical Operations (Return Boolean)

*   `and`: Iterate through the boolean array `args.values`. Return `true` only if all values are true. Short-circuit evaluation is encouraged.
*   `or`: Iterate through the boolean array `args.values`. Return `true` if at least one value is true.
*   `not`: Return the strict boolean negation of `args.value`.
