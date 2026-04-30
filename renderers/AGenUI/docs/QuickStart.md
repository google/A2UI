# QuickStart

English | [中文](QuickStart.zh-CN.md)

## Android

### Prerequisites

- Android Studio Hedgehog or later
- Android API 21 (Android 5.0) or later
- JDK 11
- Android NDK `27.3.13750724`

### Installation

**Option A: Local AAR**

Run the build script to generate the AAR:

```bash
./scripts/android/build.sh
```

Copy the generated `dist/android/release/AGenUI-Client-Android-release.aar` into your project's `libs/` directory, then add it to `build.gradle`:

```groovy
dependencies {
    implementation fileTree(dir: 'libs', include: ['*.aar'])
}
```

**Option B: Local Maven**

```bash
./scripts/android/build.sh --publish-local
```

Add the local Maven repository in `settings.gradle`:

```groovy
dependencyResolutionManagement {
    repositories {
        mavenLocal()
    }
}
```

Add the dependency in `build.gradle`:

```groovy
dependencies {
    implementation 'com.amap.genui:agenui-sdk:0.1.0'
}
```

### Usage

**1. Initialize the engine**

Initialize in `Application.onCreate()`:

```java
public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        AGenUI.getInstance().initialize(this);
    }
}
```

**2. Create a SurfaceManager and add a listener**

```java
public class MyActivity extends AppCompatActivity {
    private SurfaceManager surfaceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        surfaceManager = new SurfaceManager(this);

        surfaceManager.addListener(new ISurfaceManagerListener() {
            @Override
            public void onCreateSurface(Surface surface) {
                // Add the Surface's root container to the layout
                runOnUiThread(() -> container.addView(surface.getContainer()));
            }

            @Override
            public void onDeleteSurface(Surface surface) {
                // Surface destroyed — remove from layout
            }

            @Override
            public void onReceiveActionEvent(String event) {
                // Handle component interaction events (button clicks, etc.)
            }
        });
    }
}
```

**3. Remove a listener**

```java
surfaceManager.removeListener(listener);
```

**4. Feed streaming data**

Call the following methods in order to drive A2UI protocol parsing:

```java
surfaceManager.beginTextStream();

// Call for each incoming chunk
surfaceManager.receiveTextChunk(chunk);

surfaceManager.endTextStream();
```

**5. Register a theme (optional)**

```java
try {
    AGenUI.getInstance().registerDefaultTheme(themeJson, designTokenJson);
} catch (ThemeException e) {
    // Theme format error
}

// Switch day/night mode
AGenUI.getInstance().setDayNightMode("dark"); // "light" or "dark"
```

**6. Release resources**

Release in `onDestroy()`:

```java
@Override
protected void onDestroy() {
    super.onDestroy();
    surfaceManager.destroy();
}
```

---

## iOS

### Prerequisites

- Xcode 15 or later
- iOS 13.0 or later
- Swift 5.0 or later
- CocoaPods

### Installation

Add to your `Podfile`:

```ruby
pod 'AGenUI', '0.9.8'
```

Run:

```bash
pod install
```

### Usage

**1. Create a SurfaceManager and add a listener**

```swift
import AGenUI

class MyViewController: UIViewController {
    private let surfaceManager = SurfaceManager()
    private var surfaceViews: [String: UIView] = [:]

    override func viewDidLoad() {
        super.viewDidLoad()
        surfaceManager.addListener(self)
    }
}

extension MyViewController: SurfaceManagerListener {
    func onCreateSurface(_ surface: Surface) {
        // Add the Surface's view to the page
        view.addSubview(surface.view)
        surfaceViews[surface.surfaceId] = surface.view
    }

    func onDeleteSurface(_ surface: Surface) {
        surfaceViews[surface.surfaceId]?.removeFromSuperview()
        surfaceViews.removeValue(forKey: surface.surfaceId)
    }

    func onReceiveActionEvent(_ event: String) {
        // Handle component interaction events
    }
}
```

**2. Remove a listener**

```swift
surfaceManager.removeListener(self)
```

**3. Feed streaming data**

```swift
surfaceManager.beginTextStream()

// Call for each incoming chunk
surfaceManager.receiveTextChunk(chunk)

surfaceManager.endTextStream()
```

**4. Register a theme (optional)**

```swift
let error = AGenUISDK.registerDefaultTheme(themeJson, designToken: designTokenJson)
if !error.result {
    print("Theme registration failed: \(error.message)")
}

// Switch day/night mode
AGenUISDK.setDayNightMode("dark") // "light" or "dark"
```

**5. Resize a Surface (optional)**

Once the container size is known, call `updateSize` to trigger layout:

```swift
// Fixed width and height
surface.updateSize(width: view.bounds.width, height: view.bounds.height)

// Fixed width, adaptive height
surface.updateSize(width: view.bounds.width, height: .infinity)
```

**6. Release resources**

`SurfaceManager` is released automatically on `deinit` — just nil out your reference:

```swift
deinit {
    surfaceManager.removeAllListeners()
}
```

---

## HarmonyOS

### Prerequisites

- DevEco Studio 4.0 or higher
- HarmonyOS NEXT API17 or above

### Installation

**Option A: Install via ohpm**

```bash
ohpm install @agenui/agenui
```

Or add the dependency manually in `oh-package.json5`:

```json5
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

Copy the resulting `agenui.har` into your project and reference it with the `file:` protocol:

```json5
{
  "dependencies": {
    "@agenui/agenui": "file:./path/to/agenui.har"
  }
}
```

### Usage

**Step 1: Create a SurfaceManager and render UI**

Implement `ISurfaceManagerListener` as a class to receive surface lifecycle callbacks:

```typescript
import { AGenUI, AGenUIContainer, SurfaceManager, ISurfaceManagerListener, Surface } from '@agenui/agenui';
import { common } from '@kit.AbilityKit';

class SurfaceListenerImpl implements ISurfaceManagerListener {
  private page: MyPage | null = null;

  constructor(page: MyPage) {
    this.page = page;
  }

  onCreateSurface(surface: Surface): void {
    if (this.page) {
      // Bind the surface ID to AGenUIContainer
      this.page.surfaceId = surface.surfaceId;
    }
  }

  onDeleteSurface(surface: Surface): void {
    if (this.page) {
      this.page.surfaceId = '';
    }
  }

  onReceiveActionEvent(event: string): void {
    // Handle component interaction events
  }
}

@Entry
@Component
struct MyPage {
  @State surfaceId: string = '';
  private surfaceManager: SurfaceManager | null = null;

  aboutToAppear(): void {
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

**Step 2: Feed A2UI protocol data from your LLM stream**

Call `receiveTextChunk()` for each chunk as it arrives — the engine reassembles and parses incrementally:

```typescript
// Send the three A2UI protocol messages
surfaceManager.receiveTextChunk(createSurfaceJson);    // {"createSurface": {...}}
surfaceManager.receiveTextChunk(updateComponentsJson); // {"updateComponents": {...}}
surfaceManager.receiveTextChunk(updateDataModelJson);  // {"updateDataModel": {...}}
```

**Step 3: Register a theme (optional)**

```typescript
const success: boolean = AGenUI.registerDefaultTheme(themeJson, designToken);

// Switch between light and dark mode
AGenUI.setDayNightMode('dark'); // 'light' or 'dark'
```

**Step 4: Clean up**

Release resources when the page is destroyed:

```typescript
aboutToDisappear(): void {
  this.surfaceManager?.destroy();
  this.surfaceManager = null;
}
```
