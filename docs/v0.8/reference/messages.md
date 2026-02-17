# Message Types

This reference provides detailed documentation for all A2UI message types.

## Message Format

All A2UI messages are JSON objects sent as JSON Lines (JSONL). Each line contains exactly one message, and each message contains exactly one of these four keys:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

## beginRendering

Signals the client that it has enough information to perform the initial render of a surface.

### Schema

```typescript
{
  beginRendering: {
    surfaceId: string;      // Required: Unique surface identifier
    root: string;           // Required: The ID of the root component to render
    catalogId?: string;     // Optional: URL of component catalog
    styles?: object;        // Optional: Styling information
  }
}
```

### Properties

| Property    | Type   | Required | Description                                                                             |
| ----------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| `surfaceId` | string | ✅        | Unique identifier for this surface.                                                     |
| `root`      | string | ✅        | The `id` of the component that should be the root of the UI tree for this surface.      |
| `catalogId` | string | ❌        | Identifier for the component catalog. Defaults to the v0.8 standard catalog if omitted. |
| `styles`    | object | ❌        | Styling information for the UI, as defined by the catalog.                              |

### Examples

**Basic render signal:**

```json
{
  "beginRendering": {
    "surfaceId": "main",
    "root": "root-component"
  }
}
```

**With a custom catalog:**

```json
{
  "beginRendering": {
    "surfaceId": "custom-ui",
    "root": "root-custom",
    "catalogId": "https://my-company.com/a2ui/v0.8/my_custom_catalog.json"
  }
}
```

### Usage Notes

- Must be sent after the client has received the component definitions for the root component and its initial children.
- The client should buffer `surfaceUpdate` and `dataModelUpdate` messages and only render the UI for a surface after receiving its corresponding `beginRendering` message.

---

## surfaceUpdate

Add or update components within a surface.

### Schema

```typescript
{
  surfaceUpdate: {
    surfaceId: string;        // Required: Target surface
    components: Array<{       // Required: List of components
      id: string;             // Required: Component ID
      component: {            // Required: Wrapper for component data
        [ComponentType]: {    // Required: Exactly one component type
          ...properties       // Component-specific properties
        }
      }
    }>
  }
}
```

### Properties

| Property     | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| `surfaceId`  | string | ✅        | ID of the surface to update    |
| `components` | array  | ✅        | Array of component definitions |

### Component Object

Each object in the `components` array must have:

- `id` (string, required): Unique identifier within the surface
- `component` (object, required): A wrapper object that contains exactly one key, which is the component type (e.g., `Text`, `Button`).

### Examples

**Single component:**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "component": {
          "Text": {
            "text": {"literalString": "Hello, World!"},
            "usageHint": "h1"
          }
        }
      }
    ]
  }
}
```

**Multiple components (adjacency list):**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": {
          "Column": {
            "children": {"explicitList": ["header", "body"]}
          }
        }
      },
      {
        "id": "header",
        "component": {
          "Text": {
            "text": {"literalString": "Welcome"}
          }
        }
      },
      {
        "id": "body",
        "component": {
          "Card": {
            "child": "content"
          }
        }
      },
      {
        "id": "content",
        "component": {
          "Text": {
            "text": {"path": "/message"}
          }
        }
      }
    ]
  }
}
```

**Updating existing component:**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "component": {
          "Text": {
            "text": {"literalString": "Hello, Alice!"},
            "usageHint": "h1"
          }
        }
      }
    ]
  }
}
```

The component with `id: "greeting"` is updated (not duplicated).

### Usage Notes

- One component must be designated as the `root` in the `beginRendering` message to serve as the tree root.
- Components form an adjacency list (flat structure with ID references).
- Sending a component with an existing ID updates that component.
- Children are referenced by ID.
- Components can be added incrementally (streaming).

### Errors

| Error                  | Cause                                  | Solution                                                                                                               |
| ---------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Surface not found      | `surfaceId` does not exist             | Ensure a unique `surfaceId` is used consistently for a given surface. Surfaces are implicitly created on first update. |
| Invalid component type | Unknown component type                 | Check component type exists in the negotiated catalog.                                                                 |
| Invalid property       | Property doesn't exist for this type   | Verify against catalog schema.                                                                                         |
| Circular reference     | Component references itself as a child | Fix component hierarchy.                                                                                               |

---

## dataModelUpdate

Update the data model that components bind to.

### Schema

```typescript
{
  dataModelUpdate: {
    surfaceId: string;      // Required: Target surface
    path?: string;          // Optional: Path to a location in the model
    contents: Array<{       // Required: Data entries
      key: string;
      valueString?: string;
      valueNumber?: number;
      valueBoolean?: boolean;
      valueMap?: Array<{...}>;
    }>
  }
}
```

### Properties

| Property    | Type   | Required | Description                                                                                          |
| ----------- | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `surfaceId` | string | ✅        | ID of the surface to update.                                                                         |
| `path`      | string | ❌        | Path to a location within the data model (e.g., 'user'). If omitted, the update applies to the root. |
| `contents`  | array  | ✅        | An array of data entries as an adjacency list. Each entry has a `key` and a typed `value*` property. |

### The `contents` Adjacency List

The `contents` array is a list of key-value pairs. Each object in the array must have a `key` and exactly one `value*` property (`valueString`, `valueNumber`, `valueBoolean`, or `valueMap`). This structure is LLM-friendly and avoids issues with inferring types from a generic `value` field.

### Examples

**Initialize entire model:**

If `path` is omitted, `contents` replaces the entire data model for the surface.

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "contents": [
      {
        "key": "user",
        "valueMap": [
          { "key": "name", "valueString": "Alice" },
          { "key": "email", "valueString": "alice@example.com" }
        ]
      },
      { "key": "items", "valueMap": [] }
    ]
  }
}
```

**Update nested property:**

If `path` is provided, `contents` updates the data at that location.

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "user",
    "contents": [
      { "key": "email", "valueString": "alice@newdomain.com" }
    ]
  }
}
```

This will change `/user/email` without affecting `/user/name`.

### Usage Notes

- Data model is per-surface.
- Components automatically re-render when their bound data changes.
- Prefer granular updates to specific paths over replacing the entire model.
- Data model is a plain JSON object.
- Any data transformation (e.g., formatting a date) must be done by the server before sending the `dataModelUpdate` message.

---

## deleteSurface

Remove a surface and all its components and data.

### Schema

```typescript
{
  deleteSurface: {
    surfaceId: string;        // Required: Surface to delete
  }
}
```

### Properties

| Property    | Type   | Required | Description                 |
| ----------- | ------ | -------- | --------------------------- |
| `surfaceId` | string | ✅        | ID of the surface to delete |

### Examples

**Delete a surface:**

```json
{
  "deleteSurface": {
    "surfaceId": "modal"
  }
}
```

**Delete multiple surfaces:**

```json
{"deleteSurface": {"surfaceId": "sidebar"}}
{"deleteSurface": {"surfaceId": "content"}}
```

### Usage Notes

- Removes all components associated with the surface
- Clears the data model for the surface
- Client should remove the surface from the UI
- Safe to delete non-existent surface (no-op)
- Use when closing modals, dialogs, or navigating away

### Errors

| Error                           | Cause | Solution |
| ------------------------------- | ----- | -------- |
| (None - deletes are idempotent) |       |          |

---

## Message Ordering

### Requirements

1. `beginRendering` must come after the initial `surfaceUpdate` messages for that surface.
2. `surfaceUpdate` can come before or after `dataModelUpdate`.
3. Messages for different surfaces are independent.
4. Multiple messages can update the same surface incrementally.

### Recommended Order

```jsonl
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}
{"dataModelUpdate": {"surfaceId": "main", "contents": {...}}}
{"beginRendering": {"surfaceId": "main", "root": "root-id"}}
```

### Progressive Building

```jsonl
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}  // Header
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}  // Body
{"beginRendering": {"surfaceId": "main", "root": "root-id"}} // Initial render
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}  // Footer (after initial render)
{"dataModelUpdate": {"surfaceId": "main", "contents": {...}}}   // Populate data
```

## Validation

All messages should be validated against:

- **[server_to_client.json](https://github.com/google/A2UI/blob/main/specification/0.8/json/server_to_client.json)**: Message envelope schema
- **[standard_catalog_definition.json](https://github.com/google/A2UI/blob/main/specification/0.8/json/standard_catalog_definition.json)**: Component schemas

## Further Reading

- **[Component Gallery](components.md)**: All available component types
- **[Data Binding Guide](../concepts/data-binding.md)**: How data binding works
- **[Agent Development Guide](../guides/agent-development.md)**: Generate valid messages
