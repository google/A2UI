# **Design Proposal: Hybrid Adjacency Map**

This proposal outlines a JSON data structure designed to represent graph data (such as nested objects and lists) in a way that is optimized for Large Language Model (LLM) generation and manipulation.

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

When we want to update this object, we send the path to the object, and the value to be updated. The "path" is the path to be replaced, in JSON pointer format, which can include indices. For instance to replace the "Editor" item with "Owner", the path would be "/user/roles/1":

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "path": "/user/roles/1",
    "value": "Owner"
  }
}
```

But if we had already removed the "Admin" item, the index would actually be "0", and the LLM would have to track that, and be informed of any external mutations to the list.

## **The Problem**

LLMs struggle with manipulating standard JSON arrays because they rely on numeric indices.

1. **Hallucination:** Even without mutations, LLMs often lose count in long lists, e.g. modifying index `5` instead of `4`.
2. **Non-Local Scope:** Indices are not local to the item in the list, but rather a property of the list. If we add or remove an item in the list, the indices of all subsequent items change, and the LLM needs to be informed of this mutation if it isn't responsible for the mutation.
3. **Volatility:** Even if it is responsible for the mutation, adding or removing an item shifts the indices of all subsequent items, requiring the model to mentally re-index the entire list to perform further updates.

## **The Solution**

A robust solution is to treat the data as a graph (Adjacency List) where every item has a unique, stable ID. This removes the concept of "index" entirely.  Standard adjacency lists are verbose, however.

This proposal introduces the **Hybrid Adjacency Map**, a format that retains the stability of explicit IDs while minimizing token overhead.

## **The Hybrid Adjacency Map Format**

The data is flattened into a single map of ID-to-Value.

1. **Container:** A single JSON Object.
2. **Keys:** The Node IDs (e.g., `"user_data"`, `"role_admin"`).
3. **Values:** The Node Content.

   - **Top-Level Primitive (String, Number, Boolean, Null):** ALWAYS a Literal Value. `null` is a valid value.
   - **List/Map:** A structure that defines relationships.

4. **Deletion:** To delete a node `foo`, you must send the node ID prefixed with `!` and any value (e.g., `"!user_data": null`). Node IDs cannot start with a “!”. The value is ignored, and is typically sent as `null`.
5. **Pointers:** References to other nodes are allowed _only_ inside Lists or Maps. They are prefixed with a sigil (default: `*`).
6. **No Escaping (Hoisting Rule):** There is no escape character (LLMs are not good at escaping). If a literal string inside a list or map happens to start with `*`, it **MUST** be hoisted to a top-level node and referenced via pointer.

## **Comparison**

### **Option A: Standard Adjacency List (Verbose)**

_A traditional graph representation using an array of node objects. High structural overhead due to repeated keys (`"id"`, `"value"`), and no hybrid representation that allows for literals in lists and maps._

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": [
      { "id": "root", "value": { "user": "user_data" } },
      {
        "id": "user_data",
        "value": {
          "name": "user_name",
          "roles": "user_roles",
          "tags": "user_tags",
          "settings": "user_settings"
        }
      },
      { "id": "user_name", "value": "Jane Doe" },
      { "id": "user_roles", "value": ["role_admin", "role_editor"] },
      { "id": "user_tags", "value": ["tag_active", "tag_premium"] },
      { "id": "role_admin", "value": { "title": "val_admin", "access": "access_all" } },
      { "id": "role_editor", "value": { "title": "val_editor", "access": "access_rw" } },
      { "id": "val_admin", "value": "Admin" },
      { "id": "val_editor", "value": "Editor" },
      { "id": "access_all", "value": ["val_all"] },
      { "id": "access_rw", "value": ["val_read", "val_write"] },
      { "id": "val_all", "value": "all" },
      { "id": "val_read", "value": "read" },
      { "id": "val_write", "value": "write" },
      { "id": "tag_active", "value": "Active" },
      { "id": "tag_premium", "value": "Premium" },
      { "id": "user_settings", "value": null },
      { "id": "note_ref", "value": "* This is a literal string starting with an asterisk" }
    ]
  }
}
```

### **Option B: Hybrid Adjacency Map (HAM) (Recommended)**

_Minimal overhead. Keys act as definitions. Type is inferred from context. Literals can be inlined or referenced via pointers._

```json
{
  "updateDataModel": {
    "surfaceId": "user_profile_card",
    "nodes": {
      "root": { "user": "*user_data" },
      "user_data": {
        "name": "*user_name",
        "roles": "*user_roles",
        "tags": ["Active", "Premium"],
        "settings": "*user_settings"
      },
      "user_roles": ["*role_admin", "*role_editor"],
      "user_name": "Jane Doe",
      "role_admin": { "title": "Admin", "access": ["all"] },
      "role_editor": { "title": "Editor", "access": ["read", "write"] },
      // Example of a null node
      "user_settings": null,
      // Example of the hoisting rule for a restricted character
      "note_ref": "* This is a literal string starting with an asterisk"
    }
  }
}
```

## **Hybrid Approach: Efficiency vs. Atomicity**

The Hybrid Adjacency Map format encourages a mixed strategy that balances token efficiency with update granularity:

1.  **Use Literals for Static/Simple Data:** Primitives (strings, numbers) and simple lists (like tags or enums) should remain as literals. This avoids the overhead of creating definitions for every distinct string.
2.  **Use Pointers (`*`) for Complex/Mutable Data:** Entities that are shared, frequently updated, or complex (like `user_roles`) should be extracted to nodes. This allows you to update a single role (e.g. changing permissions) without re-sending the entire user object or list of roles.
3.  **LLM Resilience:** LLMs heavily favor standard JSON patterns and may accidentally output literals (e.g. `["Admin"]`) even when instructed to use IDs. A strict "IDs-only" system would break on these "lazy" generations. This hybrid format allows them, so long as they follow the hoisting rule.

## **Key Benefits**

1. **No Indexing:** The LLM never needs to calculate an index or path to update a node. It simply provides the ID and the new value. To update list order, it rewrites the list node, reordering the IDs. Mutations are localized.
2. **Safety:** Leaf nodes (the bulk of the data) are treated as raw values. The parser never scans root nodes for pointers, so no accidental "broken link" errors occur if the text content happens to start with `*`.
3. **Zero Ambiguity:** A string starting with `*` not at the top level (i.e. inside a list or map) is _always_ a pointer. A string starting with `*` at the root is _always_ a literal.

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

**Scenario: Deleting a Node** To delete a node (e.g., `role_editor`), the LLM provides the key prefixed with `!` and sets the value to `null`.

- This removes the ID `role_editor` from the registry.

```json
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
      "user_settings": null
    }
  }
}
```

## **Data Binding**

Data binding in the Hybrid Adjacency Map system replaces JSON Pointers with a graph-based lookup strategy called **Node Binding**. This system is designed to completely eliminate the need for list indices in binding definitions.

### **The `binding` Object**

Instead of a string path, components use a `binding` object to resolve values:

```json
"text": {
  "binding": {
    "node": "user_data",
    "key": "name"
  }
}
```

- **`node` (Optional):** The absolute ID of the node to bind to. If omitted, the binding applies to the current **Data Context**.
- **`key` (Optional):** The property name to lookup on the target node.
  - If the target node is a Map/Object, `key` is required to access a property.
  - If the target node is a Primitive (String/Number) or if you want the object itself, `key` is omitted.

### **Rule: No Implicit Deep Traversal**

To prevent "index shifting" issues, the `key` property **MUST NOT** be a path. It can only reference a direct property of the node.

- **Valid:** `"key": "address"` (returns the value of address, which might be a pointer `*addr_1`).
- **Valid:** `"key": "tags"` (returns the list of tags).
- **Prohibited:** `"key": "address/city"` (Deep traversals must be done by following pointers or binding to the specific node `addr_1`).
- **Prohibited:** `"key": "tags/0"` (Indices are strictly forbidden).

### **Handling Lists (ChildList)**

Since we cannot use indices (e.g. `users/0`), iterating over lists is handled exclusively by the `ChildList` component type.

1. **Bind to List:** The `ChildList` binds to a property that contains a list (e.g. `user_list`).
2. **Iterate:** The client iterates over the list.
3. **Set Context:** For each item, the client sets the **Data Context** for the child template.
   - If the item is a pointer (`*u1`), the context becomes the node `u1`.
   - If the item is a literal (e.g. `{"name": "Alice"}`), the context becomes that literal map.

**Example: Templated List**

```json
// Data
"nodes": {
  "root": { "users": ["*u1", "*u2"] },
  "u1": { "name": "Alice" },
  "u2": { "name": "Bob" }
}

// UI
{
  "component": "List",
  "children": {
    "binding": { "node": "root", "key": "users" },
    "template": "user_card"
  }
},
{
  "id": "user_card",
  "component": "Text",
  "text": {
    // Omitting "node" binds to the current item (u1 or u2)
    "binding": { "key": "name" }
  }
}
```

## **Example Parsing Logic (Dart)**

The parser logic handles the special `!` prefix for deletion.

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
