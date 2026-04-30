# AGenUI SDK
## Introduction
Today, as AI LLM sweep across the globe, human-computer interaction is undergoing a profound revolution from "Q&A" to "service". The traditional "dialog box + pure text" mode can no longer carry users' increasingly complex operational needs and experience expectations. When AI can not only "think" but also "act", we need a new interactive language.

Based on Google's open-source [Generative UI Protocol (A2UI)](https://github.com/google/A2UI), we have successfully developed and launched **the world's first A2UI native rendering engine covering iOS, Android, and HarmonyOS platforms**. This is not only a positive response to open standards, but also enables AI to evolve from "directly giving answers" to "providing interactive, operable, and evolvable immersive interface experiences" through high-performance native rendering, rich component ecosystem, and ultimate aesthetic specifications.

AGenUI SDK - A2UI Dynamic UI Rendering Engine, providing powerful dynamic UI rendering capabilities for HarmonyOS NEXT applications.

👉 **Experience Now:** [https://genui.amap.com](https://genui.amap.com)

## System Requirements
- HarmonyOS NEXT API17 or above
- Stage mode regular applications

## Quick Start

**1. Add the dependency**

**Option A: Install via ohpm**

```bash
ohpm install @agenui/agenui
```

```json
{
  "dependencies": {
    "@agenui/agenui": "<version>"
  }
}
```

**Option B: Build locally**

```bash
./scripts/harmony/build.sh          # outputs to dist/harmony/release/
```

Copy the resulting `agenui.har` into your project:

```json
{
  "dependencies": {
    "@agenui/agenui": "file:./path/to/agenui.har"
  }
}
```

**2. Create a SurfaceManager and render UI**

```typescript
import { AGenUIContainer, SurfaceManager, ISurfaceManagerListener, Surface } from '@agenui/agenui';
import { common } from '@kit.AbilityKit';

class SurfaceListenerImpl implements ISurfaceManagerListener {
  private page: Index | null = null;

  constructor(page: Index) {
    this.page = page;
  }

  onCreateSurface(surface: Surface): void {
    if (this.page) {
      this.page.surfaceId = surface.surfaceId;
    }
  }

  onDeleteSurface(surface: Surface): void {
    if (this.page) {
      this.page.surfaceId = '';
    }
  }
}

@Entry
@Component
struct Index {
  @State surfaceId: string = '';
  private surfaceManager: SurfaceManager | null = null;

  aboutToAppear() {
    const context = getContext(this) as common.UIAbilityContext;
    this.surfaceManager = new SurfaceManager(context);
    this.surfaceManager.addListener(new SurfaceListenerImpl(this));
  }

  build() {
    Column() {
      if (this.surfaceId) {
        AGenUIContainer({ surfaceId: this.surfaceId })
          .width('100%').height('100%')
      }
    }
  }
}
```

**3. Feed A2UI protocol data from your LLM stream**

```typescript
// Send the three A2UI protocol messages
surfaceManager.receiveTextChunk(createSurfaceJson);    // {"createSurface": {...}}
surfaceManager.receiveTextChunk(updateComponentsJson); // {"updateComponents": {...}}
surfaceManager.receiveTextChunk(updateDataModelJson);  // {"updateDataModel": {...}}
```

For a real LLM SSE stream, call `receiveTextChunk()` for each chunk as it arrives — the engine reassembles and parses incrementally.

## Supported Components
### 1. Basic Components

| Component | Description |
|-----------|-------------|
| **Text** | Text display component with style hints. Supports text variants (h1-h5, caption, body) and styles (color, font size, font weight, alignment, line height). |
| **Button** | Clickable button that triggers action events. |
| **Image** | Image display component with URL loading. Supports scaling modes (contain/cover/fill/none/scale-down) and rounded corners. |
| **Icon** | Icon display component, implemented via text nodes and Unicode mapping. |
| **Divider** | Divider component, supports horizontal/vertical orientation. |
| **Video** | Video playback component. Based on Surface XComponent + AVPlayer, supports touch control bar toggle, auto-hide, and drag-to-seek. |
| **AudioPlayer** | Audio playback component. Pure audio AVPlayer with play/pause/stop, progress bar and time display. |
| **Modal** | Modal dialog component. Based on native dialog API, triggered by entry component, supports semi-transparent overlay and cancellable configuration. |

### 2. Layout Components

| Component | Description |
|-----------|-------------|
| **Column** | Vertical layout container, child components arranged from top to bottom. |
| **Row** | Horizontal layout container, child components arranged from left to right. |
| **Card** | Card container component, supports shadow/border and padding. |
| **Tabs** | Tab component for organizing content into switchable panels. Built-in tab bar and content container, supports click switching and indicator styling. |
| **List** | Scrollable list component. Supports static child components and dynamic template rendering. |

---

### 3. Interactive Components

| Component | Description |
|-----------|-------------|
| **TextField** | Text input field with optional validation. Supports multiple input types. |
| **CheckBox** | Boolean switch component with label. |
| **Slider** | Numeric range slider input component. |
| **ChoicePicker** | Option selector, supports single or multiple selection (called MultipleChoice in v0.8). |
| **DateTimeInput** | Date and/or time picker. |

---

### 4. Extended Components

| Component | Description |
|-----------|-------------|
| **RichText** | Rich text component, supports HTML rendering. |
| **Web** | WebView component for embedding web content. Dynamically creates/updates ArkTS Web nodes via placeholder nodes and registry notifications. |
| **Table** | Table component, creates Yoga subtree internally for layout. |
| **Carousel** | Carousel component for image or content sliding. |

### 5. Custom Components (provided in playground, not part of the SDK)
| Component | Description |
|-----------|-------------|
| **Lottie** | Lottie animation component. Based on lottie-turbo engine and XComponent rendering, supports lazy loading, looping and playback control. |
| **Markdown** | Markdown content rendering component, implemented via hybrid view bridging. Supports text/rawfile/filesystem loading modes. |
| **Chart** | Data visualization chart component, implemented via hybrid view bridging. Supports 10+ chart types including bar, line, pie, area charts, etc. |
---

## Demo
![Gallery one](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_1.jpg?raw=true)
![Gallery two](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_2.jpg?raw=true)
![Gallery three](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_3.jpg?raw=true)
![Gallery four](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_4.jpg?raw=true)
![Gallery five](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_5.jpg?raw=true)
![Gallery six](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_6.jpg?raw=true)
![Gallery seven](https://github.com/acoder-ai-infra/AGenUI/blob/main/preview/harmony_display_7.jpg?raw=true)

## Documentation
For detailed usage documentation, please refer to the [project documentation](https://github.com/acoder-ai-infra/AGenUI/tree/main).

## License
This project follows **MIT**.