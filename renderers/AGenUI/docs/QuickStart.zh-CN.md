# 快速上手

[English](QuickStart.md) | 中文

## Android

### 前提条件

- Android Studio Hedgehog 或更高版本
- Android API 21 (Android 5.0) 或更高版本
- JDK 11
- Android NDK `27.3.13750724`

### 安装

**方式一：本地 AAR**

执行构建脚本生成 AAR：

```bash
./scripts/android/build.sh
```

将生成的 `dist/android/release/AGenUI-Client-Android-release.aar` 拷贝到项目的 `libs/` 目录，然后在 `build.gradle` 中添加：

```groovy
dependencies {
    implementation fileTree(dir: 'libs', include: ['*.aar'])
}
```

**方式二：本地 Maven**

```bash
./scripts/android/build.sh --publish-local
```

在 `settings.gradle` 中添加本地 Maven 仓库：

```groovy
dependencyResolutionManagement {
    repositories {
        mavenLocal()
    }
}
```

在 `build.gradle` 中添加依赖：

```groovy
dependencies {
    implementation 'com.amap.genui:agenui-sdk:0.1.0'
}
```

### 使用

**1. 初始化引擎**

在 `Application.onCreate()` 中初始化：

```java
public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        AGenUI.getInstance().initialize(this);
    }
}
```

**2. 创建 SurfaceManager 并添加监听**

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
                // 将 Surface 的根容器添加到页面布局中
                runOnUiThread(() -> container.addView(surface.getContainer()));
            }

            @Override
            public void onDeleteSurface(Surface surface) {
                // Surface 销毁，从布局中移除
            }

            @Override
            public void onReceiveActionEvent(String event) {
                // 处理组件交互事件（按钮点击等）
            }
        });
    }
}
```

**3. 移除监听**

```java
surfaceManager.removeListener(listener);
```

**4. 接收流式数据**

按顺序调用以下方法驱动 A2UI 协议解析：

```java
surfaceManager.beginTextStream();

// 每收到一个数据块时调用
surfaceManager.receiveTextChunk(chunk);

surfaceManager.endTextStream();
```

**5. 注册主题（可选）**

```java
try {
    AGenUI.getInstance().registerDefaultTheme(themeJson, designTokenJson);
} catch (ThemeException e) {
    // 主题格式错误
}

// 切换日/夜间模式
AGenUI.getInstance().setDayNightMode("dark"); // "light" 或 "dark"
```

**6. 释放资源**

在 Activity 销毁时释放：

```java
@Override
protected void onDestroy() {
    super.onDestroy();
    surfaceManager.destroy();
}
```

---

## iOS

### 前提条件

- Xcode 15 或更高版本
- iOS 13.0 或更高版本
- Swift 5.0 或更高版本
- CocoaPods

### 安装

在 `Podfile` 中添加：

```ruby
pod 'AGenUI', '0.9.8'
```

执行安装：

```bash
pod install
```

### 使用

**1. 创建 SurfaceManager 并添加监听**

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
        // 将 Surface 的视图添加到页面中
        view.addSubview(surface.view)
        surfaceViews[surface.surfaceId] = surface.view
    }

    func onDeleteSurface(_ surface: Surface) {
        surfaceViews[surface.surfaceId]?.removeFromSuperview()
        surfaceViews.removeValue(forKey: surface.surfaceId)
    }

    func onReceiveActionEvent(_ event: String) {
        // 处理组件交互事件
    }
}
```

**2. 移除监听**

```swift
surfaceManager.removeListener(self)
```

**3. 接收流式数据**

```swift
surfaceManager.beginTextStream()

// 每收到一个数据块时调用
surfaceManager.receiveTextChunk(chunk)

surfaceManager.endTextStream()
```

**4. 注册主题（可选）**

```swift
let error = AGenUISDK.registerDefaultTheme(themeJson, designToken: designTokenJson)
if !error.result {
    print("Theme registration failed: \(error.message)")
}

// 切换日/夜间模式
AGenUISDK.setDayNightMode("dark") // "light" 或 "dark"
```

**5. 调整 Surface 尺寸（可选）**

当容器尺寸确定后，调用 `updateSize` 触发布局：

```swift
// 固定宽高
surface.updateSize(width: view.bounds.width, height: view.bounds.height)

// 宽度固定、高度自适应
surface.updateSize(width: view.bounds.width, height: .infinity)
```

**6. 释放资源**

`SurfaceManager` 在 `deinit` 时自动释放，确保持有的引用置空即可：

```swift
deinit {
    surfaceManager.removeAllListeners()
}
```

---

## HarmonyOS

### 前提条件

- DevEco Studio 4.0 或更高版本
- HarmonyOS NEXT API17 或以上

### 安装

**方式一：通过 ohpm 安装**

```bash
ohpm install @agenui/agenui
```

或在 `oh-package.json5` 中手动添加依赖：

```json5
{
  "dependencies": {
    "@agenui/agenui": "<version>"
  }
}
```

**方式二：本地构建**

```bash
./scripts/harmony/build.sh          # 输出到 dist/harmony/release/
```

将生成的 `agenui.har` 复制到项目中，并用 `file:` 协议引用：

```json5
{
  "dependencies": {
    "@agenui/agenui": "file:./path/to/agenui.har"
  }
}
```

### 使用

**1. 创建 SurfaceManager 并渲染 UI**

实现 `ISurfaceManagerListener` 类以接收 Surface 生命周期回调：

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
      // 将 surfaceId 绑定到 AGenUIContainer
      this.page.surfaceId = surface.surfaceId;
    }
  }

  onDeleteSurface(surface: Surface): void {
    if (this.page) {
      this.page.surfaceId = '';
    }
  }

  onReceiveActionEvent(event: string): void {
    // 处理组件交互事件
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

**2. 接收来自 LLM 流的 A2UI 协议数据**

每收到一个数据块时调用 `receiveTextChunk()`，引擎会增量重组并解析：

```typescript
// 发送三条 A2UI 协议消息
surfaceManager.receiveTextChunk(createSurfaceJson);    // {"createSurface": {...}}
surfaceManager.receiveTextChunk(updateComponentsJson); // {"updateComponents": {...}}
surfaceManager.receiveTextChunk(updateDataModelJson);  // {"updateDataModel": {...}}
```

**3. 注册主题（可选）**

```typescript
const success: boolean = AGenUI.registerDefaultTheme(themeJson, designToken);

// 切换日/夜间模式
AGenUI.setDayNightMode('dark'); // 'light' 或 'dark'
```

**4. 释放资源**

页面销毁时释放资源：

```typescript
aboutToDisappear(): void {
  this.surfaceManager?.destroy();
  this.surfaceManager = null;
}
```
