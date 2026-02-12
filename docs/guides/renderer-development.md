# A2UI Renderer Implementation Guide

This document outlines the required features for a new renderer implementation of the A2UI protocol, based on the version 0.8 specification. It is intended for developers building new renderers (e.g., for React, Flutter, iOS, etc.).

## I. Core Protocol Implementation Checklist

This section details the fundamental mechanics of the A2UI protocol. A compliant renderer must implement these systems to successfully parse the server stream, manage state, and handle user interactions.

### Message Processing & State Management

- **JSONL Stream Parsing**: Implement a parser that can read a streaming response line by line, decoding each line as a distinct JSON object.
- **Message Dispatcher**: Create a dispatcher to identify the message type (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`) and route it to the correct handler.
- **Surface Management**:
  - Implement a data structure to manage multiple UI surfaces, each keyed by its `surfaceId`.
  - Handle `createSurface`: Initialize the surface state and catalog.
  - Handle `updateComponents`: Add or update components in the specified surface's component buffer. Flattened components should be stored by ID.
  - Handle `deleteSurface`: Remove the specified surface and all its associated data and components.
- **Component Buffering**:
  - For each surface, maintain a component buffer to store all component definitions by their `id`.
  - Be able to reconstruct the UI tree at render time by resolving `id` references in container components (`children`).
- **Data Model Store**:
  - For each surface, maintain a separate data model store (e.g., a JSON object).
  - Handle `updateDataModel`: Update the data model at the specified `path`. If `value` is an object, merge it; otherwise replace.

### Rendering Logic

- **Progressive Rendering Control**:
  - Buffer all incoming messages.
  - Handle `createSurface`: This message acts as the explicit signal to create the surface.
    - If a `catalogId` is provided, ensure the corresponding component catalog is used.
    - Apply any global `theme` provided in this message.
- **Data Binding Resolution**:
  - Implement a resolver for properties found in component definitions.
  - If the value is a direct primitive/object, use it directly.
  - If the value is a {path: ...} object, resolve it against the surface's data model.
- **Dynamic List Rendering**:
  - For containers with a `children.template`, iterate over the data list found at `template.path` (which resolves to a list in the data model).
  - For each item in the data list, render the component specified by `template.componentId`, making the item's data available for relative data binding within the template.

### Client-to-Server Communication

- **Event Handling**:
  - When a user interacts with a component that has an `action` defined, construct an `action` payload.
  - Resolve all data bindings within the `action.context` against the data model.
  - Send the complete `action` object to the server's event handling endpoint.
- **Client Capabilities Reporting**:
  - In **every** A2A message sent to the server (as part of the metadata), include an `a2uiClientCapabilities` object.
  - This object should declare the component catalog your client supports via `supportedCatalogIds` (e.g., including the URI for the standard 0.9 catalog).
  - Optionally, if the server supports it, provide `inlineCatalogs` for custom, on-the-fly component definitions.
- **Error Reporting**: Implement a mechanism to send an `error` message to the server to report any client-side errors (e.g., failed data binding, unknown component type).

## II. Standard Component Catalog Checklist

To ensure a consistent user experience across platforms, A2UI defines a standard set of components. Your client should map these abstract definitions to their corresponding native UI widgets.

### Basic Content

- **Text**: Render text content. Must support data binding on `text` and a `variant` for styling (h1-h5, body, caption).
- **Image**: Render an image from a URL. Must support `fit` (cover, contain, etc.) and `variant` (avatar, hero, etc.) properties.
- **Icon**: Render a predefined icon from the standard set specified in the catalog.
- **Video**: Render a video player for a given URL.
- **AudioPlayer**: Render an audio player for a given URL, optionally with a description.
- **Divider**: Render a visual separator, supporting both `horizontal` and `vertical` axes.

### Layout & Containers

- **Row**: Arrange children horizontally. Must support `justify` (justify-content) and `align` (align-items). Children can have a `weight` property to control flex-grow behavior.
- **Column**: Arrange children vertically. Must support `justify` and `align`. Children can have a `weight` property to control flex-grow behavior.
- **List**: Render a scrollable list of items. Must support `direction` (`horizontal`/`vertical`) and `align`.
- **Card**: A container that visually groups its child content, typically with a border, rounded corners, and/or shadow. Has a single `child`.
- **Tabs**: A container that displays a set of tabs. Includes `tabs`, where each item has a `title` and a `child`.
- **Modal**: A dialog that appears on top of the main content. It is triggered by a `trigger` (e.g. a button) and displays the `content` when activated.

### Interactive & Input Components

- **Button**: A clickable element that triggers an `action`. Must be able to contain a `child` component (typically Text or Icon) and may vary in style based on the `variant` (primary, borderless).
- **CheckBox**: A checkbox that can be toggled, reflecting a boolean value.
- **TextField**: An input field for text. Must support a `label`, `value`, `variant` (`shortText`, `longText`, `number`, `obscured`), and `validationRegexp`.
- **DateTimeInput**: A dedicated input for selecting a date and/or time. Must support `enableDate` and `enableTime`.
- **ChoicePicker**: A component for selecting one or more options from a list (`options`). Must support `variant` (`multipleSelection`, `mutuallyExclusive`) and bind `value` to a list (even for single selection).
- **Slider**: A slider for selecting a numeric value (`value`) from a defined range (`min`, `max`).
