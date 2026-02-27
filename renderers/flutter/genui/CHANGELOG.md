# `genui` Changelog

## 0.7.1 (in progress)

## 0.7.0

- **Fix**: Improved error handling for catalog example loading to include context about the invalid item (#653).
- **BREAKING**: Renamed `ChatMessageWidget` to `ChatMessageView` and `InternalMessageWidget` to `InternalMessageView` (#661).
- **Fix**: Pass the correct `catalogId` in `DebugCatalogView` widget (#676).
- **BREAKING**: Renamed most classes with `GenUi` prefix to remove the prefix or use `Surface`.
  - `GenUiConversation` -> `Conversation`
  - `GenUiController` -> `SurfaceController`
  - `GenUiSurface` -> `Surface`
  - `GenUiHost` -> `SurfaceHost`
  - `GenUiContext` -> `SurfaceContext`
  - `GenUiTransport` -> `Transport`
  - `GenUiPromptFragments` -> `PromptFragments`
  - `GenUiFunctionDeclaration` -> `ClientFunction`
  - `GenUiFallback` -> `FallbackWidget`
  - `configureGenUiLogging` -> `configureLogging`
- Added some dart documentation and an `example` directory to improve `package:genui` pub score.
- **Fix**: Make `ContentGeneratorError` be an `Exception` (#660).
- **Feature**: Define genui parts as extensions of `genai_primitives` (#675).
- **Internal**: Enable stricter dynamic-related analysis (#652).

## 0.6.1

- **Fix**: Corrected `DateTimeInput` catalog item JSON key mapping (#622).
- **Fix**: Added missing `weight` property to `Component` constructor (#603).
- **Fix**: Defaulted `TextField` `width` to 1 when nested in a `Row` (#603).

## 0.6.0

- **BREAKING**: Renamed `GenUiManager` to `A2uiMessageProcessor` to better reflect its role.
- **BREAKING**: `A2uiMessageProcessor` now accepts an `Iterable<Catalog>` via `catalogs` instead of a single `catalog`.
- **BREAKING**: Removed `GenUiConfiguration` and `ActionsConfig`.
- **BREAKING**: Removed `GenUiHost.catalog` in favor of `GenUiHost.catalogs`.
- Improved surface rendering logic to cache components before rendering.
- Updated README sample code to reflect current `FirebaseAiContentGenerator` API (added `catalog` parameter and replaced `tools` with `additionalTools`).
- **Feature**: `GenUiManager` now supports multiple catalogs by accepting an `Iterable<Catalog>` in its constructor.
- **Feature**: `A2uiMessageProcessor` now supports multiple catalogs by accepting an `Iterable<Catalog>` in its constructor.
- **Feature**: `catalogId` property added to `UiDefinition` to specify which catalog a UI surface should use.
- **Refactor**: Moved `standardCatalogId` constant from `basic_catalog.dart` to `primitives/constants.dart` for better organization and accessibility.
- **Fix**: `MultipleChoice` widget now correctly handles `maxAllowedSelections` when provided as a `double` in JSON, preventing type cast errors.
- **Fix**: The `Text` catalog item now respects the ambient `DefaultTextStyle`, resolving contrast issues where, for example, text inside a dark purple primary `Button` would be black instead of white.

## 0.5.1

- Homepage URL was updated.
- Deprecated `flutter_markdown` package was replaced with `flutter_markdown_plus`.

## 0.5.0

- Initial published release.

## 0.4.0

- **BREAKING**: Replaced `AiClient` interface with `ContentGenerator`. `ContentGenerator` uses a stream-based API (`a2uiMessageStream`, `textResponseStream`, `errorStream`) for asynchronous communication of AI-generated UI commands, text, and errors.
- **BREAKING**: `GenUiConversation` now requires a `ContentGenerator` instance instead of an `AiClient`.
- **Feature**: Introduced `A2uiMessage` sealed class (`BeginRendering`, `SurfaceUpdate`, `DataModelUpdate`, `SurfaceDeletion`) to represent AI-to-UI commands, emitted from `ContentGenerator.a2uiMessageStream`.
- **Feature**: Added `FakeContentGenerator` for testing purposes, replacing `FakeAiClient`.
- **Feature**: Added `configureGenUiLogging` function and `genUiLogger` instance for configurable package logging.
- **Feature**: Added `JsonMap` type alias in `primitives/simple_items.dart`.
- **Feature**: Added `DirectCallHost` and related utilities in `facade/direct_call_integration` for more direct AI model interactions.
- **Refactor**: `GenUiConversation` now internally subscribes to `ContentGenerator` streams and uses callbacks (`onSurfaceAdded`, `onSurfaceUpdated`, `onSurfaceDeleted`, `onTextResponse`, `onError`) to notify the application of events.
- **Fix**: Improved error handling and reporting through the `ContentGenerator.errorStream` and `ContentGeneratorError` class.

## 0.2.0

- **BREAKING**: Replaced `ElevatedButton` with a more generic `Button` component.
- **BREAKING**: Removed `CheckboxGroup` and `RadioGroup` from the basic catalog. The `MultipleChoice` or `CheckBox` widgets can be used as replacements.
- **Feature**: Added an `obscured` property to `TextInputChip` to allow for password style inputs.
- **Feature**: Added many new components to the basic catalog: `AudioPlayer` (placeholder), `Button`, `Card`, `CheckBox`, `DateTimeInput`, `Divider`, `Heading`, `List`, `Modal`, `MultipleChoice`, `Row`, `Slider`, `Tabs`, and `Video` (placeholder).
- **Fix**: Corrected the action key from `actionName` to `name` in `Trailhead` and `TravelCarousel`.
- **Fix**: Corrected the image property from `location` to `url` in `TravelCarousel`.

## 0.1.0

- Initial commit
