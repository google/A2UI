# Flutter Data Model Changes: Removing `subscribeToValue`

**Status:** Proposed
**Target:** `genui` package (Flutter Renderer)
**Related Documents:**
- [Web Renderer v0.9 Design](./web_renderers.md)
- [Data Model Consistency Analysis](./data_model_changes.md)

## Overview

This document proposes a simplification of the `DataModel` API in the Flutter renderer (`genui`) by removing the `subscribeToValue` method and consolidating subscription logic into a single `subscribe` method.

**Current State:**
The Flutter implementation currently offers two subscription methods:
1.  `subscribe(path)`: Notifies on changes to the path, its ancestors, and its descendants.
2.  `subscribeToValue(path)`: Notifies on changes to the path and its ancestors, but *ignores* descendants unless the specific value reference at `path` changes.

**Problem:**
The distinction between these two methods is subtle and rooted in object identity semantics that are often mismatched with the nature of JSON data models. In a JSON tree:
- If a leaf node (child) changes, the parent container has conceptually changed as well.
- Subscribing to a container (Map/List) usually implies an interest in its contents.
- The `subscribeToValue` optimization relies on object identity, which can be misleading if the underlying data structure is mutable or if the update mechanism replaces parent objects (which `DataModel` often does).

**Proposal:**
Remove `subscribeToValue` and standardize on the behavior of `subscribe` (notifying on ancestor, self, and descendant changes). This aligns the Flutter implementation with the proposed Web v0.9 implementation and the conceptual model of a JSON tree.

## API Changes

### 1. Remove `subscribeToValue`

The `subscribeToValue` method will be deprecated and removed.

**Before:**
```dart
// Notifies only if value at path changes identity
final valueNotifier = dataModel.subscribeToValue<String>(DataPath('/user/name'));
```

**After:**
```dart
// Notifies if value at path, or any parent/child path changes.
// Returns a ValueNotifier<T?> which acts as the Subscription object.
// Listeners are added to this returned notifier.
final valueNotifier = dataModel.subscribe<String>(DataPath('/user/name'));
```

### 2. Update `subscribe` Behavior (if needed)

Ensure `subscribe` correctly handles the "container semantics":
- **Ancestor Update:** If `/user` is replaced, listeners at `/user/name` are notified.
- **Descendant Update:** If `/user/name` is updated, listeners at `/user` are notified.
- **Self Update:** If `/user/name` is updated, listeners at `/user/name` are notified.

The current Flutter implementation of `subscribe` already supports this "bubbling up" notification for descendants.

## Rationale

1.  **Conceptual Consistency:** A JSON object is a container. Changing a property inside it changes the object's state. Listeners to the object should be notified.
2.  **API Simplicity:** Having two subscribe methods with subtle differences confuses consumers and increases the API surface area.
3.  **Platform Parity:** Aligning with the Web v0.9 design ensures that A2UI renderers behave consistently across platforms, simplifying cross-platform development and testing. The Web `subscribe` method returns a `Subscription` object with an `onChange` callback property, which is conceptually similar to Flutter's `ValueNotifier` (an object you add listeners to).
4.  **Reduced Complexity:** Removes the need for separate subscription maps (`_subscriptions` vs `_valueSubscriptions`) and the complex conditional logic in `_notifySubscribers` to handle them differently.

## Migration Guide

Existing usages of `subscribeToValue` should be replaced with `subscribe`.

**Example Migration:**

```dart
// OLD
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Only wanted updates if this specific string changed
    return ValueListenableBuilder(
      valueListenable: dataModel.subscribeToValue<String>(path), 
      builder: (context, value, child) => Text(value ?? ''),
    );
  }
}

// NEW
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Now receives updates if children change too (though strings don't have children)
    // For containers, this means more updates, but correct ones.
    return ValueListenableBuilder(
      valueListenable: dataModel.subscribe<String>(path),
      builder: (context, value, child) => Text(value ?? ''),
    );
  }
}
```

## Impact on Performance

Replacing `subscribeToValue` with `subscribe` might trigger more frequent notifications for listeners attached to container nodes (Maps/Lists). However, in typical UI patterns:
- Leaf nodes (Strings, Numbers) have no descendants, so behavior is identical.
- Container nodes are usually bound to Lists or Layouts that *need* to update when their children change.
- The `ValueNotifier` in Flutter checks for equality (`==`) before notifying listeners. If the data update results in the same value (e.g. same String), no notification occurs, preserving the optimization where it matters most.
