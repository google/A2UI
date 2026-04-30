# AGenUI HarmonyOS Playground

Demo app for AGenUI SDK on HarmonyOS — used for development debugging and feature showcase.

## Structure

```
playground/harmony/
├── entry/              # HAP entry module (installable app)
└── build-profile.json5 # References SDK source via srcPath
```

The SDK is referenced directly from source (`../../platforms/harmony/agenui`) via DevEco's `srcPath` mechanism — no HAR publishing needed during development.

## Features

- **component demos** — JSON-driven UI stories, browsable via two-level navigation
- **Live JSON editor** — edit Components and DataModel in real time
- **Theme switching** — light / dark mode

### Custom Components (via `CustomView` extension point)

| Component | Library | Description |
|-----------|---------|-------------|
| `CustomMarkdownComponent` | `@luvi/lv-markdown-in` | Markdown rendering |
| `CustomChartComponent` | `@ohos/mpchart` | Pie / Line / Bar charts |
| `CustomLottieComponent` | `@ohos/lottie-turbo` | Lottie animations |

### Custom Functions (via `IFunctionCall`)

- `ToastFunction` — show a toast message
- `OpenUrlFunction` — open a URL

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@agenui/agenui` | local | AGenUI SDK |
| `@ohos/lottie-turbo` | 1.0.10 | Lottie animation |
| `@luvi/lv-markdown-in` | 3.2.9 | Markdown rendering |
| `@ohos/mpchart` | 3.0.26 | Charts |

## Requirements

- DevEco Studio 4.0+
- `compatibleSdkVersion`: 5.0.5 (API 17)
- `targetSdkVersion`: 6.0.0 (API 20)

## Quick Start

1. Open `playground/harmony` in DevEco Studio
2. Wait for project sync to complete
3. Select the `entry` module and click **Run**

## App Info

- **bundleName**: `com.harmony.agenui`
- **Permission**: `ohos.permission.INTERNET`
