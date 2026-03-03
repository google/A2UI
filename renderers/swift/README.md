# A2UI SwiftUI Renderer

This directory contains the source code for the A2UI Swift Renderer.

It is a native Swift package that provides the necessary components to parse and render A2UI protocol messages within a SwiftUI application.

## Architecture Overview

The Swift renderer follows a reactive, data-driven UI paradigm tailored for SwiftUI:

1.  **Parsing (`A2UIParser`)**: Raw A2UI JSON messages from the server are decoded into strongly-typed Swift models.
2.  **State Management (`A2UIDataStore`)**: The `A2UIDataStore` acts as the single source of truth for a given surface. It holds the parsed component hierarchy and current data model state. It evaluates bindings, function calls, and data updates triggered by user interactions.
3.  **Rendering (`A2UISurfaceView` & `A2UIComponentRenderer`)**: The `A2UISurfaceView` observes the `A2UIDataStore`. It traverses the component tree starting from the root, recursively calling `A2UIComponentRenderer` for each node. The component renderer acts as a factory, translating A2UI component definitions (e.g., a `Text` or `Row` node) into their corresponding native SwiftUI equivalents.
4.  **Interaction & Data Flow**: User inputs (like typing in a text field or tapping a button) are captured by the specific SwiftUI views. These views update the `A2UIDataStore`, which automatically propagates changes to bound variables, re-evaluates rules, and potentially dispatches `UserAction` messages back to the server.

## Key Components

-   **A2UIParser**: Deserializes A2UI JSON messages into Swift data models.
-   **A2UIDataStore**: Manages the state of the UI surface, data models, and component state.
-   **A2UISurfaceView**: A SwiftUI view that orchestrates the rendering of the entire A2UI surface.
-   **A2UIComponentRenderer**: A view responsible for dynamically rendering individual A2UI components as native SwiftUI views.

## Data Store Injection and Precedence

`A2UISurfaceView` supports two dependency injection styles for `A2UIDataStore`:

1.  Pass a store directly in the initializer (`A2UISurfaceView(surfaceId:dataStore:)`).
2.  Provide a store through SwiftUI environment (`.environment(dataStore)`).

When both are present, initializer injection takes precedence. The effective store is resolved as:

```swift
dataStore ?? dataStoreEnv
```

This is intentional and not a second source of truth. `A2UIDataStore` remains the single source of truth for surface state; the two properties represent two wiring paths so the view can be used ergonomically in different contexts (for example, explicit injection in previews/tests and environment injection in app-level composition).

### Implemented UI Components
- **Layout**: `Column`, `Row`, `List`, `Card`
- **Content**: `Text`, `Image`, `Icon`, `Video`, `AudioPlayer`
- **Input**: `TextField`, `CheckBox`, `ChoicePicker`, `Slider`, `DateTimeInput`
- **Navigation & Interaction**: `Button`, `Tabs`, `Modal`
- **Decoration**: `Divider`

### Implemented Functions
- **Formatting**: `FormatString`, `FormatDate`, `FormatCurrency`, `FormatNumber`, `Pluralize`, `OpenUrl`
- **Validation**: `IsRequired`, `IsEmail`, `MatchesRegex`, `CheckLength`, `CheckNumeric`
- **Logical**: `PerformAnd`, `PerformOr`, `PerformNot`

For an example of how to use this renderer, please see the sample application in `samples/client/swift`.

## Usage

To use this package in your Xcode project:

1.  Go to **File > Add Packages...**
2.  In the "Add Package" dialog, click **Add Local...**
3.  Navigate to this directory (`renderers/swift`) and click **Add Package**.
4.  Select the `A2UI` library to be added to your application target.

## Running Tests

You can run the included unit tests using either Xcode or the command line.

### Xcode

1.  Open the `Package.swift` file in this directory with Xcode.
2.  Go to the **Test Navigator** (Cmd+6).
3.  Click the play button to run all tests.

### Command Line

Navigate to this directory in your terminal and run:

```bash
swift test
```
