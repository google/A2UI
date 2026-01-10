# A2UI Android Renderer

A native Android renderer for the A2UI protocol, built with Kotlin and Jetpack Compose.

## Architecture Overview

This project implements the A2UI protocol using a clean, modular architecture:

1.  **`a2ui-core`**: A pure Kotlin module containing the protocol data models (`ServerMessage`, `ComponentWrapper`), state management (`SurfaceState`), and action definitions. It uses `kotlinx.serialization` for robust JSON parsing.
2.  **`a2ui-compose`**: The Android library module containing the renderer logic.
    *   **`A2UISurface`**: The entry point composable. It holds the `SurfaceState` and renders the root component.
    *   **`ComponentRegistry`**: Maps protocol component names (e.g., "Text", "Button") to Composables.
    *   **`A2UIComponent`**: A recursive composable that looks up components by ID and delegates to the registered renderer.
    *   **`components/`**: Individual Material 3 implementations of A2UI components.

### Comparison with Lit & Angular Renderers

| Feature | Lit / Angular | Android (Compose) |
| :--- | :--- | :--- |
| **Node Mapping** | DOM Elements / Directives | Composables |
| **Updates** | Reactive Properties / Signals | Recomposition (`key`, `State`) |
| **Registry** | String Map to Classes | String Map to Composable Functions |
| **Styling** | CSS / SCSS | Compose Modifiers |
| **Data Binding** | Framework Binding | `A2UIContext.resolve()` helper |

This renderer follows the **Adjacency List** model used by the web renderers, where components are stored in a flat map and the tree is built recursively at render time.

## Usage Guide

### 1. Project Setup (Composite Build)

The recommended way to work with the renderer is using a Gradle Composite Build, as demonstrated in `samples/client/android`.

In your app's `settings.gradle.kts`:
```kotlin
includeBuild("path/to/A2UI/renderers/android") {
    dependencySubstitution {
        substitute(module("com.google.a2ui.compose:a2ui-compose")).using(project(":a2ui-compose"))
        substitute(module("com.google.a2ui.core:a2ui-core")).using(project(":a2ui-core"))
    }
}
```

Then in your `build.gradle.kts`:
```kotlin
implementation("com.google.a2ui.compose:a2ui-compose")
implementation("com.google.a2ui.core:a2ui-core")
```

### 2. Initialize State

Create a `SurfaceState` to hold the document:
```kotlin
val surfaceState = remember { SurfaceState() }
```

### 3. Process Messages

Feed JSON messages from your stream into the state:
```kotlin
// Example: Parsing a JSON string
val message = Json.decodeFromString<ServerMessage>(jsonString)
surfaceState.applyUpdate(message)
```

### 4. Render Surface

Use the `A2UISurface` composable:
```kotlin
A2UISurface(
    surfaceId = "chat_response_1",
    state = surfaceState,
    onUserAction = { action, sourceId ->
        // Handle action (e.g., send back to server)
        Log.d("A2UI", "Action: ${action.name} from $sourceId")
    }
)
```

## Supported Components (MVP)

*   `Column`, `Row`, `Box` (Basic Layouts)
*   `Text` (with Typography mapping)
*   `Button` (Material 3 Button)
*   `TextField` (Material 3 OutlinedTextField)
*   `Image` (Placeholder/Basic text)

## Extensibility

To add a new component:

1.  Define properties in `Component.kt` (Core).
2.  Create a Composable renderer (e.g., `MyCustomWidget_Renderer`).
3.  Register it in `ComponentRegistry`:
    ```kotlin
    ComponentRegistry.register("MyCustomWidget") { wrapper, ctx -> 
        MyCustomWidget_Renderer(wrapper.Custom!!, ctx) 
    }
    ```
