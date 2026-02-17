# Components & Structure

A2UI uses an **adjacency list model** for component hierarchies. Instead of nested JSON trees, components are a flat list with ID references.

## Why Flat Lists?

**Traditional nested approach:**

- LLM must generate perfect nesting in one pass
- Hard to update deeply nested components
- Difficult to stream incrementally

**A2UI adjacency list:**

- ✅ Flat structure, easy for LLMs to generate
- ✅ Send components incrementally
- ✅ Update any component by ID
- ✅ Clear separation of structure and data

## The Adjacency List Model

```json
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {"id": "root", "component": "Column", "children": ["greeting", "buttons"]},
      {"id": "greeting", "component": "Text", "text": "Hello"},
      {"id": "buttons", "component": "Row", "children": ["cancel-btn", "ok-btn"]},
      {"id": "cancel-btn", "component": "Button", "child": "cancel-text", "action": {"name": "cancel"}},
      {"id": "cancel-text", "component": "Text", "text": "Cancel"},
      {"id": "ok-btn", "component": "Button", "child": "ok-text", "action": {"name": "ok"}},
      {"id": "ok-text", "component": "Text", "text": "OK"}
    ]
  }
}
```

Components reference children by ID, not by nesting.

## Component Basics

Every component has:

1. **ID**: Unique identifier (`"welcome"`)
2. **Type**: Component type (`Text`, `Button`, `Card`)
3. **Properties**: Configuration specific to that type

```json
{"id": "welcome", "component": "Text", "text": "Hello", "variant": "h1"}
```

## The Standard Catalog

A2UI defines a standard catalog of components organized by purpose:

- **Layout**: Row, Column, List - arrange other components
- **Display**: Text, Image, Icon, Video, Divider - show information
- **Interactive**: Button, TextField, CheckBox, DateTimeInput, Slider - user input
- **Container**: Card, Tabs, Modal - group and organize content

For the complete component gallery with examples, see [Component Reference](../reference/components.md).

## Static vs. Dynamic Children

**Static (`children` array)** - Fixed list of child IDs:
```json
{"children": ["back-btn", "title", "menu-btn"]}
```

**Dynamic (`children` template)** - Generate children from data array:
```json
{"children": {"template": {"path": "/items", "componentId": "item-template"}}}
```

For each item in `/items`, render the `item-template`. See [Data Binding](data-binding.md) for details.

## Hydrating with Values

Components get their values two ways:

81: - **Literal** - Fixed value: `{"text": "Welcome"}`
82: - **Data-bound** - From data model: `{"text": {"path": "/user/name"}}`
83:
84: LLMs can generate components with literal values or bind them to data paths.
85:
86: ## Composing Surfaces
87:
88: Components compose into **surfaces** (widgets):
89:
90: 1. LLM generates component definitions via `updateComponents`
91: 2. LLM populates data via `updateDataModel`
92: 3. LLM signals render via `createSurface`
93: 4. Client renders all components as native widgets
94:
95: A surface is a complete, cohesive UI (form, dashboard, chat, etc.).
96:
97: ## Incremental Updates
98:
99: - **Add** - Send new `updateComponents` with new component IDs
100: - **Update** - Send `updateComponents` with existing ID and new properties
- **Remove** - Update parent's `children` list to exclude removed IDs

The flat structure makes all updates simple ID-based operations.

## Custom Components

Beyond the standard catalog, clients can define custom components for domain-specific needs:

- **How**: Register custom component types in your renderer
- **What**: Charts, maps, custom visualizations, specialized widgets
- **Security**: Custom components still part of the client's trusted catalog

Custom components are _advertised_ from the client's renderer to the LLM. The LLM can then use them in addition to the standard catalog.

See [Custom Components Guide](../guides/custom-components.md) for implementation details.

## Best Practices

1. **Descriptive IDs**: Use `"user-profile-card"` not `"c1"`
2. **Shallow hierarchies**: Avoid deep nesting
3. **Separate structure from content**: Use data bindings, not literals
4. **Reuse with templates**: One template, many instances via dynamic children
