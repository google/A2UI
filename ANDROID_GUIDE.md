# A2UI Android Integration Guide (Native A2A)

This guide explains how to connect the A2UI Android client **directly** to the Contact Lookup Agent servers using a native Kotlin A2A client implementation.

## 1. Prerequisites

-   **Android Studio** installed.
-   **UV** installed (for running the Python server).
-   **A2A Contact Lookup Agent** code available in `samples/agent/adk/contact_lookup`.

## 2. Server Setup

First, run the real Contact Lookup Agent. This agent hosts the `A2A` protocol endpoint that our Android client will talk to.

1.  Open your terminal.
2.  Navigate to the contact lookup sample directory:
    ```bash
    cd samples/agent/adk/contact_lookup
    ```
3.  Create/Update `.env` file with your **Google GenAI API Key**:
    ```bash
    echo "GEMINI_API_KEY=your_actual_key_here" > .env
    ```
4.  Run the agent:
    ```bash
    uv run .
    ```
5.  Expected output: `INFO:     Uvicorn running on http://localhost:10003`

## 3. Android Client Setup

We have implemented a native `A2AClient` in Kotlin to handle the handshake and communication.

### Step 3.1: Verify Dependencies
Ensure `app/build.gradle.kts` has the following (we added them for you):
```kotlin
plugins {
    // ...
    kotlin("plugin.serialization") version "1.9.0"
}

dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
}
```

### Step 3.2: Verify Permissions
Ensure `app/src/main/AndroidManifest.xml` has:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Step 3.3: Run the App
1.  Open the project in Android Studio (`samples/client/android`).
2.  Sync Gradle if requested.
3.  Click **Run** (Green Play Button).
4.  Use an **Android Emulator** (the code uses `10.0.2.2` to access the host's localhost).

## 4. How It Works

1.  **A2AClient.kt**: Can be found in `com.google.a2ui.sample`. It constructs valid A2A messages with UUIDs and the required `client_message` wrapper.
2.  **Handshake**: It sets the `X-A2A-Extensions` header to `https://a2ui.org/a2a-extension/a2ui/v0.8`.
3.  **MainActivity.kt**: Sends an initial "Find contact info for Sarah Lee" query on startup.
4.  **Rendering**: The server responds with streaming components (Text, Layouts), which `A2UISurface` renders natively.

**Feature Parity**:
With the latest updates, the Android renderer now shares the same core feature set as the **Web (Lit)** and **Angular** renderers. All three support:
- Basic Inputs (Text, Buttons, TextFields)
- Selection Controls (Checkbox, Slider, Switch)
- Layouts (Column, Row)
- Containers (Card, Tabs, Modal)
- Media (Image, Video)

You can confidently switch between renderers and expect the same A2UI capability.
