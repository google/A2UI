# **Design Proposal: Flat Adjacency Map**

This proposal outlines a JSON data structure designed to represent graph data (such as nested objects and lists) in a way that is optimized for Large Language Model (LLM) generation and manipulation.

## **Current solution**

The current `updateDataModel` (for v0.9) looks like this:

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "path": "/",
    "value": {
      "user": {
        "name": "Jane Doe",
        "roles": ["Admin", "Editor"]
      }
    }
  }
}
```

Where the "path" is the path to be replaced, in JSON pointer format, which can include indices. For instance to replace the "Editor" item with "Owner", the path would be "/user/roles/1":

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "path": "/user/roles/1",
    "value": "Owner"
  }
}
```

But if we had already removed the "Admin" item, the index would actually be "0", and the LLM would have to track that.

## **The Problem**

LLMs struggle with manipulating standard JSON arrays because they rely on numeric indices.

1. **Hallucination:** Models often lose count in long lists, e.g. modifying index `5` instead of `4`.
2. **Volatility:** Removing an item at an index shifts the indices of all subsequent items, requiring the model to mentally re-index the entire list to perform further updates.

## **The Solution**

The robust solution is to treat the data as a graph (Adjacency List) where every item has a unique, stable String ID. This removes the concept of "index" entirely. However, standard adjacency lists are verbose.

This proposal introduces the **Flat Adjacency Map**, a format that retains the stability of explicit IDs while minimizing token overhead.

## **The Logical Data**

Consider this simple nested data structure that we wish to represent and update:

```json
{
  "user": {
    "name": "Jane Doe",
    "roles": ["Admin", "Editor"]
  }
}
```

## **The Flat Adjacency Map Format**

The data is flattened into a single map of ID-to-Value.

1. **Container:** A single JSON Object.
2. **Keys:** The Node IDs (e.g., `"user_data"`, `"role_admin"`).
3. **Values:** The Node Content.

   - **Top-Level Primitive (String, Number, Boolean, Null):** ALWAYS a Literal Value. `null` is a valid value.
   - **List/Map:** A structure that defines relationships.

4. **Deletion:** To delete a node `foo`, you must send the node ID prefixed with `!` and any value (e.g., `"!user_data": null`). Node IDs cannot start with a “!”.
5. **Pointers:** References to other nodes are allowed _only_ inside Lists or Maps. They are prefixed with a sigil (default: `*`).
6. **No Escaping (Hoisting Rule):** There is no escape character. If a literal string inside a list or map happens to start with `*`, it **MUST** be hoisted to a top-level node and referenced via pointer.

## **Comparison**

### **Option A: Standard Adjacency List (Verbose)**

_A traditional graph representation using an array of node objects. High structural overhead due to repeated keys (`"id"`, `"value"`)._

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": [
      { "id": "root", "value": { "user": "user_data" } },
      {
        "id": "user_data",
        "value": { "name": "user_name", "roles": "user_roles" }
      },
      { "id": "user_name", "value": "Jane Doe" },
      { "id": "user_roles", "value": ["role_admin", "role_editor"] },
      { "id": "role_admin", "value": "Admin" },
      { "id": "role_editor", "value": "Editor" }
    ]
  }
}
```

### **Option B: Flat Adjacency Map (Optimized)**

_Minimal overhead. Keys act as definitions. Type is inferred from context._

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": {
      "root": { "user": "*user_data" },
      "user_data": { "name": "*user_name", "roles": "*user_roles" },
      "user_name": "Jane Doe",
      "user_roles": ["*role_admin", "*role_editor", "*note_ref"],
      "role_admin": "Admin",
      "role_editor": "Editor",
      "note_ref": "* This is a literal comment starting with a star"
    }
  }
}
```

## **Key Benefits**

1. **Safety:** Leaf nodes (the bulk of the data) are treated as raw values. The parser never scans root nodes for pointers, so no accidental "broken link" errors occur if the text content happens to start with `*`.
2. **Zero Ambiguity:** A string starting with `*` inside a list or map is _always_ a pointer. A string starting with `*` at the root is _always_ a literal.
3. **Atomic Updates:** Updates are atomic and require no path or index calculation. The LLM simply provides the ID and the new value.

## **Handling Updates**

**Scenario: Reorder Roles** The LLM defines the list node with a new order of pointers.

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": {
      "user_roles": ["*role_editor", "*role_admin"]
    }
  }
}
```

**Scenario: Deleting a Node** To delete a node (e.g., `role_editor`), the LLM provides the key prefixed with `-` and sets the value to `null`.

- This removes the ID `role_editor` from the registry.

```javascript
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": {
      "!role_editor": null,
      "user_roles": ["*role_admin"]
    }
  }
}
```

**Scenario: Literal Null** To store a literal `null` at the top level (e.g. to signify "Unset but present"), simply set the value to `null`.

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": {
      "user_name": null
    }
  }
}
```

## **Parsing Logic (Dart)**

The parser logic handles the special `-` prefix for deletion.

```dart
// A registry of all active nodes
Map<String, dynamic> nodeRegistry = {};

/// Resolves a pointer to its value.
/// If the ID is missing (deleted), it returns NULL.
dynamic resolve(String id) {
  return nodeRegistry[id];
}

/// Parses values inside a collection (List/Map) where pointers are allowed.
dynamic parseInnerValue(dynamic value) {
  if (value is String) {
    if (value.startsWith('*')) {
      // It's a pointer: Resolve it immediately
      return resolve(value.substring(1));
    }
    return value; // Literal string
  }

  if (value is List) return value.map(parseInnerValue).toList();
  if (value is Map) return value.map((k, v) => MapEntry(k, parseInnerValue(v)));

  return value;
}

void applyUpdate(Map<String, dynamic> updates) {
  updates.forEach((key, rawValue) {
    // 1. DELETE CHECK
    // If key starts with "!" it is a deletion command.
    if (key.startsWith('!')) {
      String targetId = key.substring(1);
      nodeRegistry.remove(targetId);
      return;
    }

    // 2. UPSERT LITERAL (Primitives + Null)
    // Top-level values (Strings, Nulls, Numbers) are literals.
    if (rawValue is! Map && rawValue is! List) {
      nodeRegistry[key] = rawValue;
    }
    // 3. UPSERT STRUCTURE (List / Map)
    // Collections require parsing to find pointers.
    else {
      nodeRegistry[key] = parseInnerValue(rawValue);
    }
  });
}
```
