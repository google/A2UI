# Data Model Consistency Analysis & Design (Web vs. Flutter)

**Status:** Draft
**Target Version:** 0.9
**Related Documents:**
- [Web Renderer v0.9 Design](./web_renderers.md)
- [A2UI Protocol v0.9](./a2ui_protocol.md)
- [Flutter Data Model Changes](./flutter_data_model_changes.md)

## Overview

This document outlines the required changes to the Web Core v0.9 Data Model implementation to ensure feature parity and behavioral consistency with the Flutter implementation (`genui`), while also proposing a modernization of the subscription API.

**Reference Implementations:**
- **Flutter:** `renderers/flutter/genui/packages/genui/lib/src/model/data_model.dart`
- **Web (Current):** `renderers/web_core/src/v0_9/state/data-model.ts`

## 1. API Changes

The following changes to the public API of `DataModel` (and `DataContext`) are required.

### 1.1 Single `subscribe` method with "Container Semantics"

**Purpose:**
To simplify the API and align with the conceptual model of JSON data, we will implement only *one* subscribe method.

**Behavior:**
The data model is a tree of JSON values. If a leaf node changes (e.g., `/foo/bar`), its parent container (`/foo`) has conceptually also changed, because the parent is the map/list containing that value. Therefore, a subscription to a path must notify if:
1.  The value at the exact path changes.
2.  Any *descendant* path changes (because the container's content changed).
3.  Any *ancestor* path changes (because the container itself might have been replaced).

This aligns with the `subscribe` behavior in Flutter but removes the need for `subscribeToValue` (which attempted to isolate value changes but is semantically ambiguous in a mutable JSON tree).

**Requirement:**
*   Implement `subscribe(path)` to notify on exact, ancestor, and descendant updates.
*   Do *not* implement `subscribeToValue`.

### 1.2 `Subscription` Object Return Type

**Purpose:**
Instead of returning a simple `Unsubscribe` function, `subscribe` should return a rich `Subscription` object. This provides a more ergonomic API for consumers (like `DataContext` or external frameworks) to manage their connection to the data.

**Requirement:**
Redesign the `subscribe` return type to match this interface:

```typescript
export interface Subscription<T> {
  /**
   * The current value at the subscribed path.
   */
  readonly value: T;

  /**
   * A callback function to be invoked when the value changes.
   * The consumer sets this property to listen for updates.
   */
  onChange?: (value: T) => void;

  /**
   * Unsubscribes from the data model.
   */
  unsubscribe(): void;
}
```

The `subscribe` method signature becomes:
```typescript
subscribe<T>(path: string): Subscription<T>
```

### 1.3 `dispose(): void`

**Purpose:**
Cleans up all internal subscriptions.

**Requirement:**
Add a `dispose` method to prevent memory leaks.

### 1.4 `DataContext.resolve(value: any): any`

**Purpose:**
In Flutter, `DataContext` is responsible for parsing expressions (e.g., `${/user/name}`) and executing function calls found within data values. In the Web v0.9 design, this was delegated to `ComponentContext`.

**Requirement:**
Move `resolve` logic to `DataContext` or expose it via `DataContext` to allow data resolution outside of components (e.g., in Action handlers or other services). This ensures consistent evaluation logic across the application.

## 2. Implementation Changes (Web Core)

The following files in `@renderers/web_core/src/v0_9/**` need updates:

### 2.1 `state/data-model.ts`

*   **Update `subscribe`**:
    *   Change return type to `Subscription<T>`.
    *   Remove callback parameter.
    *   Ensure notification logic walks up the tree (ancestors) and checks for descendants, invoking `onChange` if set on the returned Subscription object.
*   **Add `dispose`**.
*   **Fix `set`**: Update logic to create arrays for numeric segments (smart intermediate node creation).
*   **Fix `parsePath`**: Ensure consistency with Flutter's `DataPath` (handle leading/trailing slashes correctly).

### 2.2 `state/data-context.ts`

*   **Update `subscribe`**: Forward the `Subscription<T>` from `DataModel`.
*   **Add `resolve`**: Move or copy resolution logic (handling paths, literals, and potentially expressions/function calls) from `ComponentContext`.

### 2.3 `rendering/component-context.ts`

*   **Update `resolve`**: Delegate to `this.dataContext.resolve()` where possible, or align logic.
*   **Refactor**: Use the new `Subscription` object if direct subscription is needed (though typically `resolve` handles this).

### 2.4 `processing/message-processor.ts` & `state/surface-context.ts`

*   Ensure they use the updated `DataModel` API correctly (e.g., calling `.unsubscribe()` on the returned object instead of calling the function directly).

## 3. Test Cases to Add

Update `renderers/web_core/src/v0_9/state/data-model.test.ts` to verify:

### 3.1 Subscription Object
```typescript
it('returns a subscription object', () => {
  model.set('/a', 1);
  const sub = model.subscribe<number>('/a');
  assert.strictEqual(sub.value, 1);
  
  let updatedValue: number | undefined;
  sub.onChange = (val) => updatedValue = val;

  model.set('/a', 2);
  assert.strictEqual(sub.value, 2);
  assert.strictEqual(updatedValue, 2);
  
  sub.unsubscribe();
  // Verify listener removed
});
```

### 3.2 Container Notification Semantics
```typescript
it('notifies parent when child updates', () => {
  model.set('/parent', { child: 'initial' });
  
  const sub = model.subscribe('/parent');
  let parentValue: any;
  sub.onChange = (val) => parentValue = val;
  
  model.set('/parent/child', 'updated');
  assert.deepStrictEqual(parentValue, { child: 'updated' });
});
```

### 3.3 Intermediate Array Creation
```typescript
it('creates intermediate arrays for numeric segments', () => {
  model.set('/users/0/name', 'Alice');
  assert.ok(Array.isArray(model.get('/users')));
  assert.strictEqual(model.get('/users/0/name'), 'Alice');
});
```

### 3.4 Dispose
```typescript
it('stops notifying after dispose', () => {
  let count = 0;
  const sub = model.subscribe('/');
  sub.onChange = () => count++;
  
  model.dispose();
  model.set('/foo', 'bar');
  assert.strictEqual(count, 0);
});
```

### 3.5 DataModel Root Update
Verify behavior when `path` is `/`. Flutter implements replacement (via `Map.from`).
```typescript
it('replaces root object on root update', () => {
   model.set('/', { newRoot: true });
   assert.deepStrictEqual(model.get('/'), { newRoot: true });
});
```
