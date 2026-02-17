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
  "surfaceUpdate": {
    "components": [
      {"id": "root", "component": {"Column": {"children": {"explicitList": ["greeting", "buttons"]}}}},
      {"id": "greeting", "component": {"Text": {"text": {"literalString": "Hello"}}}},
      {"id": "buttons", "component": {"Row": {"children": {"explicitList": ["cancel-btn", "ok-btn"]}}}},
      {"id": "cancel-btn", "component": {"Button": {"child": "cancel-text", "action": {"name": "cancel"}}}},
      {"id": "cancel-text", "component": {"Text": {"text": {"literalString": "Cancel"}}}},
      {"id": "ok-btn", "component": {"Button": {"child": "ok-text", "action": {"name": "ok"}}}},
      {"id": "ok-text", "component": {"Text": {"text": {"literalString": "OK"}}}}
    ]
  }
}
```

Components reference children by ID, not by nesting.

## Component Basics

Every component has:

1. **ID**: Unique identifier (`"welcome-message"`)
2. **Type**: Component type (`Text`, `Button`, `Card`)
3. **Properties**: Configuration specific to that type

```json
{"id": "welcome", "component": {"Text": {"text": {"literalString": "Hello"}, "usageHint": "h1"}}}
```

## The Standard Catalog

A2UI defines a standard catalog of components organized by purpose:

- **Layout**: Row, Column, List - arrange other components
- **Display**: Text, Image, Icon, Video, Divider - show information
- **Interactive**: Button, TextField, CheckBox, DateTimeInput, Slider - user input
- **Container**: Card, Tabs, Modal - group and organize content

For the complete component gallery with examples, see [Component Reference](../reference/components.md).

## Static vs. Dynamic Children

**Static (`explicitList`)** - Fixed list of child IDs:
```json
{"children": {"explicitList": ["back-btn", "title", "menu-btn"]}}
```

**Dynamic (`template`)** - Generate children from data array:
```json
{"children": {"template": {"dataBinding": "/items", "componentId": "item-template"}}}
```

For each item in `/items`, render the `item-template`. See [Data Binding](data-binding.md) for details.

## Hydrating with Values

Components get their values two ways:

**Literal** - Fixed value: `{"text": {"literalString": "Welcome"}}`
**Data-bound** - From data model: `{"text": {"path": "/user/name"}}`

LLMs can generate components with literal values or bind them to data paths for dynamic content.

## Composing Surfaces

Components compose into **surfaces** (widgets):

1. LLM generates component definitions via `surfaceUpdate`
2. LLM populates data via `dataModelUpdate`
3. LLM signals render via `beginRendering`
4. Client renders all components as native widgets

A surface is a complete, cohesive UI (form, dashboard, chat, etc.).

## Incremental Updates

**Add** - Send new `surfaceUpdate` with new component IDs
**Update** - Send `surfaceUpdate` with existing ID and new properties
**Remove** - Update parent's `children` list to exclude removed IDs

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
