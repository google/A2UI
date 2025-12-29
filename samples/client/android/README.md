# A2A Android Client Samples

This directory contains sample Android applications demonstrating the A2UI native renderer receiving streaming UI updates from an AI agent.

## Project Structure

This sample uses a **Composite Build** to include the renderer source code directly from `../../../../renderers/android`.

- `projects/contact/`: **Contact Lookup Sample**. A client that connects to the `contact_lookup` agent to display a dynamic contact card.
- `projects/orchestrator/`: (Placeholder) Orchestrator module.
- `projects/restaurant/`: (Placeholder) Restaurant reservation module.

## Prerequisites

- **Android Studio**: Koala Feature Drop or newer (recommended).
- **JDK**: Java 17+.
- **Python**: 3.10+ (for running the agent).

## Setup & Running

### 1. Start the AI Agent
The Android client needs a backend agent to talk to.

1.  Open a terminal.
2.  Navigate to the contact lookup agent directory:
    ```bash
    cd samples/agent/adk/contact_lookup
    ```
3.  Install dependencies and run:
    ```bash
    uv run .
    ```
    The agent will start at `http://localhost:10003`.

### 2. Run the Android App

1.  **Open in Android Studio**:
    -   Select **File > Open**.
    -   Navigate to `samples/client/android` and select `settings.gradle.kts`.
    -   Wait for Gradle Sync to complete.

2.  **Run**:
    -   Select the **`projects.contact`** (or `contact`) configuration in the run toolbar.
    -   Select an **Android Emulator** (Physical devices require reverse port forwarding).
    -   Click **Run** (Green Play button).

### 3. Usage
- The app will launch and send a default query: "Find contact info for Alex Jordan".
- The agent will respond with a stream of UI components.
- The app renders the profile image, text, and icons dynamically.

## Troubleshooting

-   **Blank Screen?** Check Logcat for `A2AClient` logs. Ensure the agent is running.
-   **Connection Refused?** Ensure you are on an Emulator. If using a physical device, run:
    ```bash
    adb reverse tcp:10003 tcp:10003
    ```
-   **Build Errors?** Ensure you have JDK 17 selected in Android Studio (Settings > Build, Execution, Deployment > Build Tools > Gradle).

