# Web Renderer Google Import Requirements

This document outlines the requirements that web renderer code (specifically Lit and Angular implementations) must conform to so that it can be imported into Google's internal monorepo (Google3). These requirements are derived from issues in [Milestone 5](https://github.com/google/A2UI/milestone/5).

## 1. No Private Field Syntax (`#property`)

*   **Bad Behavior:** Using the ECMAScript private field syntax (e.g., `#myPrivateField`).
*   **Alternatives:** Use TypeScript's `private` access modifier (e.g., `private myPrivateField`).
*   **Rationale:** Private identifiers are not supported by some optimizer toolchains, cause substantial emit size and performance regressions when down-leveled, and are unsupported before ES2015. Static type checking is sufficient for enforcing visibility.

## 2. Explicit `override` Keyword

*   **Bad Behavior:** Overriding methods or properties from a parent class without the `override` keyword (e.g., `render() { ... }` in a Lit component).
*   **Alternatives:** Explicitly add the `override` keyword (e.g., `override render() { ... }`).
*   **Rationale:** Required by Google's internal build system and linters to ensure code correctness and maintainability.

## 3. No Cyclic Dependencies

*   **Bad Behavior:** Two or more files importing each other, directly or indirectly (e.g., `component-registry.ts` imports `ui.ts` which imports `component-registry.ts`).
*   **Alternatives:** Refactor code to extract shared types or logic into a separate file that both depend on, or restructure the hierarchy to be strictly unidirectional.
*   **Rationale:** Cyclic dependencies cause build failures in Google's internal build system and generally indicate architectural issues.

## 4. Remove `markdown-it` Dependency

*   **Bad Behavior:** Depending on the `markdown-it` library.
*   **Alternatives:** Modularize the system to allow injecting a markdown renderer. In the Google repo, this allows for the use of the internal `g3markdown` library, while the OSS repo can continue to use `markdown-it` or another open-source alternative.
*   **Rationale:** `markdown-it` is not available or approved for use within the Google internal repository.

## 5. Remove `signal-utils` and `@lit-labs/signals` Dependencies

*   **Bad Behavior:** Depending on libraries like `signal-utils`, `signal-utils/subtle/microtask-effect`, or `@lit-labs/signals` (specifically `SignalWatcher`).
*   **Alternatives:**
    *   Use `Mobx` (specifically `MobxLitElement`) for state management in Lit components.
    *   Use `RxJS` if applicable (especially for Angular).
*   **Rationale:** These specific signal libraries are not available or supported in Google's internal environment (`G3`).

## 6. No `unsafeCSS` or `unsafeHTML`

*   **Bad Behavior:** Using `unsafeCSS` or `unsafeHTML` Lit directives.
*   **Alternatives:**
    *   For CSS: Use standard Lit `css` tagged templates or safe internal alternatives.
    *   For HTML: Use the provided safe HTML rendering mechanisms or specific internal sanitizers.
*   **Rationale:** These APIs are banned in the Google internal repository due to security risks (XSS) and policy compliance.

## 7. No `iframe` Usage

*   **Bad Behavior:** Embedding content using `<iframe>` tags.
*   **Alternatives:** Use native rendering or other component composition techniques supported by the framework.
*   **Rationale:** `iframe` usage is generally discouraged or restricted due to security and performance concerns in the internal environment.

## 8. No `accessor` Keyword

*   **Bad Behavior:** Using the `accessor` keyword for class members.
*   **Alternatives:** Use standard property definitions with decorators if necessary, or simple class fields.
*   **Rationale:** Likely unsupported by the specific version of the TypeScript compiler or build tools used internally.

## 9. Correct Type Imports

*   **Bad Behavior:** Importing values when only types are needed, or vice-versa, causing issues in some build modes.
*   **Alternatives:** Use `import type { ... }` explicitly when importing types.
*   **Rationale:** Ensures proper tree-shaking and avoids runtime errors or circular value dependency issues in strict build environments.

## 10. Separation of Shared and Renderer-Specific Code

*   **Bad Behavior:** Mixing Lit-specific code (e.g., specific directives, lifecycle methods) in core libraries intended to be shared with other renderers (like Angular).
*   **Alternatives:**
    *   Move Lit-specific code to `renderers/lit`.
    *   Keep truly agnostic logic in `renderers/web_core`.
    *   Ensure `renderers/angular` only depends on `renderers/web_core`.
*   **Rationale:** Essential for modularity and allowing different renderers (Angular, React, Vue) to coexist and share core logic without pulling in unnecessary dependencies that might break the build.
