# Message Types

This reference provides detailed documentation for all A2UI message types in the v0.9 specification.

## Message Format

All A2UI messages are JSON objects sent as JSON Lines (JSONL). Each line contains exactly one message envelope, which must contain a `version` (set to "v0.9") and exactly one of the following message keys:

- `createSurface`
- `updateComponents`
- `updateDataModel`
- `deleteSurface`

## createSurface

Signals the client to create a new surface and prepare it for rendering.

### Schema

```typescript
{
  version: "v0.9",        // Required: Protocol version
  createSurface: {
    surfaceId: string;    // Required: Unique surface identifier
    catalogId: string;    // Required: URI of the component catalog
    theme?: object;       // Optional: Theme overrides
    sendDataModel?: boolean; // Optional: If true, client sends data model in A2A metadata
  }
}
```

### Properties

| Property        | Type    | Required | Description                                                                 |
| --------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `surfaceId`     | string  | ✅        | Unique identifier for this surface.                                         |
| `catalogId`     | string  | ✅        | URI for the component catalog (e.g., `https://a2ui.org/specification/v0_9/standard_catalog.json`). |
| `theme`         | object  | ❌        | Theme values (e.g., `primaryColor`) to apply to this surface.               |
| `sendDataModel` | boolean | ❌        | If true, the client acts as the source of truth for data and syncs it back. |

### Examples

**Basic surface creation:**

```json
{
  "version": "v0.9",
  "createSurface": {
    "surfaceId": "main",
    "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json"
  }
}
```

**With styling:**

```json
{
  "version": "v0.9",
  "createSurface": {
    "surfaceId": "custom-ui",
    "catalogId": "https://example.com/catalogs/v1.json",
    "theme": {
      "primaryColor": "#007bff",
      "fontFamily": "Inter, sans-serif"
    }
  }
}
```

### Usage Notes

- Must be sent before any `updateComponents` or `updateDataModel` messages for this surface are processed.

---

## updateComponents

Add or update components within a surface.

### Schema

```typescript
{
  version: "v0.9",        // Required: Protocol version
  updateComponents: {
    surfaceId: string;        // Required: Target surface
    components: Array<{       // Required: List of components
      id: string;             // Required: Component ID
      component: string;      // Required: Component type name (e.g., "Text")
      [key: string]: any;     // Component-specific properties
    }>
  }
}
```

### Properties

| Property     | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| `surfaceId`  | string | ✅        | ID of the surface to update    |
| `components` | array  | ✅        | Array of flattened component definitions |

### Component Object

Each object in the `components` array is a **flattened** definition:

- `id` (string, required): Unique identifier within the surface.
- `component` (string, required): The type of component (e.g., `Button`, `Column`).
- Other properties are direct keys (e.g., `text`, `children`, `variant`).

### Examples

**Single component:**

```json
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "component": "Text",
        "text": "Hello, World!",
        "variant": "h1"
      }
    ]
  }
}
```

**Multiple components (adjacency list):**

```json
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": "Column",
        "children": ["header", "body"]
      },
      {
        "id": "header",
        "component": "Text",
        "text": "Welcome"
      },
      {
        "id": "body",
        "component": "Card",
        "child": "content"
      },
      {
        "id": "content",
        "component": "Text",
        "text": { "path": "/message" }
      }
    ]
  }
}
```

### Usage Notes

- The structure is **flat**: `component: "Type"` instead of nested `component: { "Type": ... }`.
- Properties use native JSON types.

---

## updateDataModel

Update the data model that components bind to.

### Schema

```typescript
{
  version: "v0.9",        // Required: Protocol version
  updateDataModel: {
    surfaceId: string;      // Required: Target surface
    path?: string;          // Optional: Path to update (defaults to root)
    value?: any;            // Optional: Data to upsert (omission implies removal)
  }
}
```

### Properties

| Property    | Type   | Required | Description                                                                                          |
| ----------- | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `surfaceId` | string | ✅        | ID of the surface to update.                                                                         |
| `path`      | string | ❌        | The JSON Pointer path to update (e.g., `/user/name`). Defaults to root `/` if omitted.               |
| `value`     | any    | ❌        | The value to set. If omitted, the key at `path` is removed.                                          |

### Examples

**Update multiple fields (root merge):**

```json
{
  "version": "v0.9",
  "updateDataModel": {
    "surfaceId": "main",
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

**Update specific path:**

```json
{
  "version": "v0.9",
  "updateDataModel": {
    "surfaceId": "main",
    "path": "/user/email",
    "value": "new@example.com"
  }
}
```

**Remove a field:**

```json
{
  "version": "v0.9",
  "updateDataModel": {
    "surfaceId": "main",
    "path": "/user/tempData"
  }
}
```

### Usage Notes

- `value` is a standard JSON object/value, not an adjacency list.
- Updates are generally deep merged (if value is object) or replaced.

---

## deleteSurface

Remove a surface and all its components and data.

### Schema

```typescript
{
  version: "v0.9",        // Required: Protocol version
  deleteSurface: {
    surfaceId: string;        // Required: Surface to delete
  }
}
```

### Examples

```json
{
  "version": "v0.9",
  "deleteSurface": {
    "surfaceId": "modal"
  }
}
```

---

## Message Ordering

### Recommended Sequence

```jsonl
{"version": "v0.9", "createSurface": {"surfaceId": "main", "catalogId": "..."}}
{"version": "v0.9", "updateDataModel": {"surfaceId": "main", "value": {"user": "Alice"}}}
{"version": "v0.9", "updateComponents": {"surfaceId": "main", "components": [{"id": "root", "component": "Text", "text": "Hi"}]}}
```

## Validation

All messages should be validated against:

- **[server_to_client.json](../specification/v0_9/server_to_client.json)**: Message envelope schema.
- **[standard_catalog.json](../specification/v0_9/standard_catalog.json)**: Component schemas.
