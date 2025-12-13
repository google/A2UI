# Message Types

This reference provides detailed documentation for all A2UI message types. For a higher-level overview, see the [Protocol Specification](protocol.md).

## Message Format

All A2UI messages are JSON objects sent as JSON Lines (JSONL). Each line contains exactly one message, and each message contains exactly one of these four keys:

- `createSurface`
- `updateComponents`
- `updateDataModel`
- `deleteSurface`

## createSurface

Initialize a new UI surface (canvas for components).

### Schema

```typescript
{
  createSurface: {
    surfaceId: string;      // Required: Unique surface identifier
    catalogId: string;      // Required: URL of component catalog
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `surfaceId` | string | ✅ | Unique identifier for this surface within the session |
| `catalogId` | string | ✅ | URL identifying the component catalog to use |

### Examples

**Basic surface:**

```json
{
  "createSurface": {
    "surfaceId": "main",
    "catalogId": "https://a2ui.dev/specification/0.9/standard_catalog_definition.json"
  }
}
```

**Multiple surfaces:**

```json
{"createSurface": {"surfaceId": "sidebar", "catalogId": "..."}}
{"createSurface": {"surfaceId": "content", "catalogId": "..."}}
{"createSurface": {"surfaceId": "modal", "catalogId": "..."}}
```

### Usage Notes

- Must be sent before any `updateComponents` for this surface
- Surface IDs must be unique within the session
- Use descriptive IDs (`user-profile`, `checkout-form`) not generic ones (`surface1`)
- Custom catalogs can be specified via custom catalogId URLs

### Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Surface already exists | Duplicate surfaceId | Use unique surface IDs or delete old surface first |
| Invalid catalogId | Malformed URL | Ensure catalogId is a valid URL string |

---

## updateComponents

Add or update components within a surface.

### Schema

```typescript
{
  updateComponents: {
    surfaceId: string;        // Required: Target surface
    components: Array<{       // Required: List of components
      id: string;             // Required: Component ID
      [ComponentType]: {      // Required: Exactly one component type
        ...properties         // Component-specific properties
      }
    }>
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `surfaceId` | string | ✅ | ID of the surface to update |
| `components` | array | ✅ | Array of component definitions |

### Component Object

Each component must have:

- `id` (string, required): Unique identifier within the surface
- Exactly one component type key (`Text`, `Button`, `Card`, etc.)
- Properties specific to that component type

### Examples

**Single component:**

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "Text": {
          "text": {"literal": "Hello, World!"},
          "style": "headline"
        }
      }
    ]
  }
}
```

**Multiple components (adjacency list):**

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "Column": {
          "children": {"array": ["header", "body"]}
        }
      },
      {
        "id": "header",
        "Text": {
          "text": {"literal": "Welcome"}
        }
      },
      {
        "id": "body",
        "Card": {
          "children": {"array": ["content"]}
        }
      },
      {
        "id": "content",
        "Text": {
          "text": {"path": "/message"}
        }
      }
    ]
  }
}
```

**Updating existing component:**

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "Text": {
          "text": {"literal": "Hello, Alice!"},
          "style": "headline"
        }
      }
    ]
  }
}
```

The component with `id: "greeting"` is updated (not duplicated).

### Usage Notes

- One component must have `id: "root"` to serve as the tree root
- Components form an adjacency list (flat structure with ID references)
- Sending a component with an existing ID updates that component
- Children are referenced by ID in the `children` property
- Components can be added incrementally (streaming)

### Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Surface not found | Surface doesn't exist | Send createSurface first |
| Missing root component | No component with `id: "root"` | Ensure one component has `id: "root"` |
| Invalid component type | Unknown component type | Check component type exists in catalog |
| Invalid property | Property doesn't exist for this type | Verify against catalog schema |
| Circular reference | Component references itself in children | Fix component hierarchy |

---

## updateDataModel

Update the data model that components bind to.

### Schema

```typescript
{
  updateDataModel: {
    surfaceId: string;        // Required: Target surface
    path?: string;            // Optional: JSON Pointer path (default: "/")
    op?: "replace" | "add" | "remove";  // Optional: Operation (default: "replace")
    value?: any;              // Required for add/replace, forbidden for remove
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `surfaceId` | string | ✅ | ID of the surface to update |
| `path` | string | ❌ | JSON Pointer path (default: `"/"`) |
| `op` | string | ❌ | Operation: `"replace"`, `"add"`, or `"remove"` (default: `"replace"`) |
| `value` | any | Conditional | Data to set (required for `replace`/`add`, forbidden for `remove`) |

### Operations

#### replace

Replace value at path (default operation).

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/user/name",
    "value": "Alice"
  }
}
```

#### add

Add new property or append to array.

**Add property:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "add",
    "path": "/user/age",
    "value": 30
  }
}
```

**Append to array:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "add",
    "path": "/items/-",
    "value": {"id": 4, "name": "New Item"}
  }
}
```

The `-` means "append to end of array".

#### remove

Remove value at path.

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "remove",
    "path": "/user/age"
  }
}
```

### Examples

**Initialize entire model:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/",
    "value": {
      "user": {
        "name": "Alice",
        "email": "alice@example.com"
      },
      "items": []
    }
  }
}
```

**Update nested property:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "replace",
    "path": "/user/email",
    "value": "alice@newdomain.com"
  }
}
```

**Add array elements:**

```json
{"updateDataModel": {"surfaceId": "main", "op": "add", "path": "/items/-", "value": {"id": 1, "name": "Item 1"}}}
{"updateDataModel": {"surfaceId": "main", "op": "add", "path": "/items/-", "value": {"id": 2, "name": "Item 2"}}}
```

**Remove array element:**

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "op": "remove",
    "path": "/items/0"
  }
}
```

### Usage Notes

- Data model is per-surface (each surface has its own data)
- Use JSON Pointer syntax for paths ([RFC 6901](https://tools.ietf.org/html/rfc6901))
- Components automatically re-render when bound data changes
- Prefer granular updates over replacing the entire model
- Data model is a plain JSON object (no functions or special types)

### JSON Pointer Reference

- `/` - Root
- `/user` - Property "user"
- `/user/name` - Nested property
- `/items/0` - First array element
- `/items/-` - Append to array (add operation only)

### Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Surface not found | Surface doesn't exist | Send createSurface first |
| Invalid path | Malformed JSON Pointer | Check path syntax |
| Path not found | Path doesn't exist (for replace) | Use `add` to create, or check path |
| Type mismatch | Operation incompatible with value type | Ensure operation matches data type |

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

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `surfaceId` | string | ✅ | ID of the surface to delete |

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

| Error | Cause | Solution |
|-------|-------|----------|
| (None - deletes are idempotent) | | |

---

## Message Ordering

### Requirements

1. `createSurface` must come before `updateComponents` for that surface
2. `updateComponents` can come before or after `updateDataModel`
3. Messages for different surfaces are independent
4. Multiple messages can update the same surface incrementally

### Recommended Order

```jsonl
{"createSurface": {"surfaceId": "main", "catalogId": "..."}}
{"updateComponents": {"surfaceId": "main", "components": [...]}}
{"updateDataModel": {"surfaceId": "main", "op": "replace", "path": "/", "value": {...}}}
```

### Progressive Building

```jsonl
{"createSurface": {...}}
{"updateComponents": {...}}  // Header
{"updateComponents": {...}}  // Body
{"updateComponents": {...}}  // Footer
{"updateDataModel": {...}}   // Populate data
```

## Validation

All messages should be validated against:

- **[server_to_client.json](https://github.com/google/A2UI/blob/main/specification/0.9/json/server_to_client.json)**: Message envelope schema
- **[standard_catalog_definition.json](https://github.com/google/A2UI/blob/main/specification/0.9/json/standard_catalog_definition.json)**: Component schemas

## Further Reading

- **[Protocol Specification](protocol.md)**: High-level protocol overview
- **[Component Gallery](components.md)**: All available component types
- **[Data Binding Guide](../concepts/data-binding.md)**: How data binding works
- **[Agent Development Guide](../guides/agent-development.md)**: Generate valid messages
