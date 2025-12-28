# A2UI Android Sample App

This is a sample Android application demonstrating the A2UI native renderer.

## Project Structure

This sample uses a **Composite Build** to include the renderer source code directly from `../../../../renderers/android`.

- `app/`: The Android application module.
- `sample_data.jsonl`: Example A2UI data (currently the app uses hardcoded data in `MainActivity.kt` for simplicity, but this file is provided for reference).

## How to Run

1.  **Open in Android Studio**:
    -   Select **File > Open**.
    -   Navigate to `samples/client/android` and select `settings.gradle.kts` (or the folder).
    -   Click **OK**.

2.  **Sync Gradle**:
    -   Android Studio should detect the project. Wait for Gradle Sync to complete.
    -   It will automatically include the `a2ui-core` and `a2ui-compose` modules from the `renderers/android` directory.

3.  **Run the App**:
    -   Select the `app` configuration in the toolbar.
    -   Select a target device (Emulator or Physical Device).
    -   Click **Run** (Green Play button).

## What to Expect

The application will launch and render a simple UI defined by A2UI messages (Header, Text, Layouts) using native Jetpack Compose components.
