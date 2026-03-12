# Friction Log: Adding Custom Components to A2UI

> **Author**: @zeroasterisk | **Date**: 2026-03-12 | **Goal**: Document friction points encountered while building custom A2UI components (YouTube, Maps, Charts) and integrating A2UI into an existing Material Angular app.

## Summary

Overall: the custom component pattern **works well** once understood. The main friction is in **discovery and documentation** — knowing what to extend, how bindings work, and how the agent learns about custom components.

## Friction Points

### 🟡 F1: No clear "Getting Started" for custom components

**What happened**: The `custom-components.md` guide was a skeleton with TODOs. A developer wanting to add a custom component had to reverse-engineer the rizzcharts sample.

**Expected**: A step-by-step guide with a simple example (like adding a YouTube embed).

**Severity**: P2 — Blocks community adoption of custom components

**Recommendation**: The updated `custom-components.md` guide (this PR) addresses this. Keep it maintained as the pattern evolves.

---

### 🟡 F2: Catalog registration pattern is non-obvious

**What happened**: The `inputBinding()` pattern for mapping A2UI JSON properties to Angular `@Input()` values requires specific knowledge of `@angular/core` internals. The `bindings` function receives `{ properties }` but the type is `Types.AnyComponentNode`, which doesn't self-document which properties are available.

**Expected**: A typed helper or code-gen tool that creates catalog entries from component metadata.

**Severity**: P2

**Recommendation**: Consider a decorator-based approach:
```typescript
@A2UIComponent({ name: 'YouTube' })
export class YouTube extends DynamicComponent<Types.CustomNode> {
  @A2UIInput() videoId: string;
  @A2UIInput() title?: string;
}
```
This would auto-generate catalog entries and reduce boilerplate.

---

### 🟡 F3: Agent-side catalog configuration is manual

**What happened**: For agents to use custom components, you must manually describe each component and its properties in the agent's prompt or catalog config. There's no way to auto-generate this from the client-side catalog definition.

**Expected**: A shared schema that both client and agent can consume — define once, use on both sides.

**Severity**: P2

**Recommendation**: Consider a `catalog.json` schema file that describes components, properties, and types. The client uses it for registration, the agent uses it for prompt construction. This aligns with the v0.9 catalog concept but needs tooling.

---

### 🟢 F4: `resolvePrimitive()` works well but isn't well-documented

**What happened**: The `resolvePrimitive()` method on `DynamicComponent` correctly handles both literal values and data-bound paths (`{ path: "/foo" }`). However, its behavior and return types aren't documented — I had to read the source to understand what it does.

**Expected**: JSDoc on `resolvePrimitive()` explaining: input types, return types, null handling, and when to use it vs. direct input access.

**Severity**: P3

---

### 🟢 F5: No validation that agent-generated JSON matches catalog

**What happened**: If the agent generates `{ "component": "YouTub" }` (typo), the renderer silently fails to render anything. No error in console, no fallback.

**Expected**: A warning or error when a component name isn't found in the registered catalog, and ideally a fallback component showing "Unknown component: YouTub".

**Severity**: P2 — Debugging agent output is painful without this

---

### 🟢 F6: DomSanitizer injection in DynamicComponent subclass

**What happened**: The YouTube component needs `DomSanitizer` for iframe URLs. Injecting it via constructor works but feels wrong in the `DynamicComponent` pattern where the base class handles DI differently.

**Expected**: A pattern or utility for safe URL handling in custom components.

**Severity**: P3

---

### 🟡 F7: No guide for "upgrade existing app to A2UI"

**What happened**: There's no documentation for the most common use case — adding A2UI to an app that already exists. The existing guides assume you're building from scratch.

**Expected**: A guide that starts with "you have a Material Angular app" and walks through adding A2UI.

**Severity**: P2 — This is the primary onboarding path for most teams

**Recommendation**: The new `design-system-integration.md` guide (this PR) addresses this.

---

### 🟢 F8: Theming custom components

**What happened**: Custom components need to use CSS custom properties from the A2UI theme (e.g., `var(--mat-sys-surface-container)`). The theming guide doesn't cover how custom components should consume theme tokens.

**Expected**: Documentation on which CSS custom properties are available and how to use them in custom components.

**Severity**: P3

---

## What Worked Well

- **`DynamicComponent` base class** is well-designed — clean inheritance, reactive signals, data binding just works
- **Lazy-loaded catalog entries** are smart — no bundle size impact for unused components
- **Data binding via paths** is powerful — agents can update data independently of the component tree
- **`DEFAULT_CATALOG` spread** makes it trivial to add custom components alongside standard ones
- **Angular Material integration** was seamless — A2UI components live alongside Material components without conflict

## Recommendations

1. **P2**: Add unknown component warnings/fallback in renderer (#F5)
2. **P2**: Explore decorator-based catalog registration (#F2)
3. **P2**: Define a shared catalog schema for client + agent (#F3)
4. **P3**: Document `resolvePrimitive()` and theme tokens (#F4, #F8)
5. **P3**: Add DI patterns guide for custom components (#F6)
