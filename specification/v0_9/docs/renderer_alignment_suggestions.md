# Renderer Alignment Suggestions: Web vs. Flutter

This document outlines opportunities to align the A2UI Web (v0.9) and Flutter renderer architectures. Each suggestion evaluates the differences and recommends a "winner" to be used as the standard pattern across platforms.

## 1. Unified Component Naming
*   **Suggestion:** Rename Flutter's `CatalogItem` to `Component` and `CatalogItemContext` to `ComponentContext`.
*   **Winner:** **Web Design**
*   **Reasoning:** `Component` is the standard terminology in modern UI development. It makes the concept of composition (e.g., `ButtonComponent`) more intuitive.

## 2. Surface State Object
*   **Suggestion:** Rename Flutter's `GenUiContext` to `SurfaceState`.
*   **Winner:** **Web Design**
*   **Reasoning:** `Context` is heavily overloaded (especially in Flutter). `SurfaceState` explicitly describes the object: a repository for the DataModel, Component Tree, Theme, and Catalog of a specific surface.

## 3. Surface Widget Naming
*   **Suggestion:** Rename Flutter's `GenUiSurface` widget to `Surface`.
*   **Winner:** **Web Design**
*   **Reasoning:** The `GenUi` prefix is redundant if namespaced by the package. `Surface` is concise and directly maps to the protocol terminology.

## 4. Message Typing
*   **Suggestion:** Adopt Flutter's sealed class/union pattern for messages in the Web implementation.
*   **Winner:** **Flutter Design**
*   **Reasoning:** Flutter's typed classes (`CreateSurface`, `UpdateComponents`) provide better type safety and internal dispatch logic compared to raw JSON objects. The Web `A2uiMessageProcessor` should accept these typed objects.

## 5. Input Property Naming
*   **Suggestion:** Rename Flutter's `CatalogItemContext.data` to `ComponentContext.properties`.
*   **Winner:** **Web Design**
*   **Reasoning:** `properties` (or `props`) clearly distinguishes configuration attributes from the `DataModel` application data.

## 6. Message Handling Method
*   **Suggestion:** Rename Web's `processMessages(messages: [])` to `handleMessage(message)` (singular) to support streaming patterns.
*   **Winner:** **Flutter Design**
*   **Reasoning:** `handleMessage` is standard for sink/actor patterns and handles individual stream events more naturally.

## 7. Surface Cleanup Policy
*   **Suggestion:** Add `SurfaceCleanupPolicy` to the Web `A2uiMessageProcessor`.
*   **Winner:** **Flutter Design**
*   **Reasoning:** Flutter explicitly handles memory management (e.g., `keepLatest` vs `manual`). As Web apps grow in complexity, explicit policies will prevent memory leaks in the surface registry.

## 8. Transport/Controller Abstraction
*   **Suggestion:** Introduce a `Controller` layer to the Web design (like Flutter's `GenUiController`).
*   **Winner:** **Flutter Design**
*   **Reasoning:** The Web design lacks a standardized layer to handle raw LLM text streams (Markdown + JSON). Shared logic for extracting A2UI JSON from a stream should be standardized.

## 9. High-Level Facade
*   **Suggestion:** Introduce a `Conversation` or `Session` class to the Web design.
*   **Winner:** **Flutter Design**
*   **Reasoning:** Providing a standard class to bind the Controller, Processor, and Transport together simplifies the developer experience.

## 10. Data Binding Helpers
*   **Suggestion:** Centralize helpers like `resolveString` on `ComponentContext`.
*   **Winner:** **Web Design**
*   **Reasoning:** Web's `context.resolve<T>(val)` pattern is cleaner for component authors than requiring direct interaction with the `DataContext`.

---

## Summary Table

| Concept | Recommended Name/Design | Source |
| :--- | :--- | :--- |
| **Component Definition** | `Component` | Web |
| **Component Props** | `context.properties` | Web |
| **Surface State** | `SurfaceState` | Web |
| **Surface Widget** | `Surface` | Web |
| **Protocol Messages** | Sealed Classes / Typed Interfaces | Flutter |
| **Stream Parsing** | `GenUiController` | Flutter |
| **Conversation Mgmt** | `GenUiConversation` | Flutter |
| **Cleanup Logic** | `SurfaceCleanupPolicy` | Flutter |
