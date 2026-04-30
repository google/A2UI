# API 参考

[English](API.md) | 中文

## 核心 API

### AGenUI（全局入口）

全局入口，负责引擎初始化、主题注册与自定义扩展注册。Android 以单例访问，iOS 使用 `AGenUISDK` 静态方法，HarmonyOS 使用 `AGenUI` 静态方法。

#### 初始化

| 平台 | 方法签名 | 说明 |
|---|---|---|
| Android | `AGenUI.getInstance().initialize(Context applicationContext)` | 必须在创建 `SurfaceManager` 之前调用 |
| iOS | 无需显式初始化 | 首次创建 `SurfaceManager` 时自动完成 |
| HarmonyOS | 无需显式初始化 | 首次创建 `SurfaceManager` 时自动完成 |

```java
// Android — 在 Application.onCreate() 中调用
AGenUI.getInstance().initialize(this);
```

#### setDayNightMode

设置全局日/夜间模式，切换后已渲染的 Surface 会根据注册的主题 token 自动刷新颜色。

| 平台 | 方法签名 |
|---|---|
| Android | `void setDayNightMode(String mode)` |
| iOS | `static func setDayNightMode(_ mode: String)` |
| HarmonyOS | `static setDayNightMode(mode: string): void` |

`mode` 可选值：`"light"` / `"dark"`

```java
// Android
AGenUI.getInstance().setDayNightMode("dark");
```

```swift
// iOS
AGenUISDK.setDayNightMode("dark")
```

```typescript
// HarmonyOS
AGenUI.setDayNightMode('dark');
```

#### registerDefaultTheme

注册默认主题配置和设计 Token，应在创建任何 `SurfaceManager` 之前调用。`theme` 和 `designToken` 均为 JSON 字符串。

| 平台 | 方法签名 |
|---|---|
| Android | `void registerDefaultTheme(String theme, String designToken) throws ThemeException` |
| iOS | `static func registerDefaultTheme(_ theme: String, designToken: String) -> AGenUIError` |
| HarmonyOS | `static registerDefaultTheme(theme: string, designToken: string): boolean` |

**错误处理**

| 平台 | 错误类型 | 说明 |
|---|---|---|
| Android | `ThemeException`（受检异常） | 主题 JSON 格式错误时抛出 |
| iOS | `AGenUIError`（返回值） | `result == false` 时表示失败，见 `message` 字段 |
| HarmonyOS | `boolean`（返回值） | 返回 `false` 表示注册失败 |

```java
// Android
try {
    AGenUI.getInstance().registerDefaultTheme(themeJson, designTokenJson);
} catch (ThemeException e) {
    Log.e("AGenUI", "Theme error: " + e.getMessage());
}
```

```swift
// iOS
let error = AGenUISDK.registerDefaultTheme(themeJson, designToken: designTokenJson)
if !error.result {
    print("Theme error: \(error.message)")
}
```

```typescript
// HarmonyOS
const success = AGenUI.registerDefaultTheme(themeJson, designTokenJson);
if (!success) {
    console.error('Theme registration failed');
}
```

---

### SurfaceManager

每个 `SurfaceManager` 实例对应一路独立的流式会话，可同时存在多个实例。

#### 初始化

| 平台 | 构造方法 |
|---|---|
| Android | `new SurfaceManager(Activity activity)` |
| iOS | `SurfaceManager()` |
| HarmonyOS | `new SurfaceManager(context: UIAbilityContext)` |

- Android 需先完成 `AGenUI.getInstance().initialize(context)` 才可构造，否则抛出 `IllegalStateException`
- iOS / HarmonyOS 构造时自动触发引擎初始化

```java
// Android
SurfaceManager surfaceManager = new SurfaceManager(activity);
```

```swift
// iOS
let surfaceManager = SurfaceManager()
```

```typescript
// HarmonyOS
const surfaceManager = new SurfaceManager(context);
```

#### 流式数据接收

完整调用顺序：`beginTextStream()` → `receiveTextChunk(chunk)` × N → `endTextStream()`

| 平台 | `beginTextStream` | `receiveTextChunk` | `endTextStream` |
|---|---|---|---|
| Android | `void beginTextStream()` | `void receiveTextChunk(String dataString)` | `void endTextStream()` |
| iOS | `func beginTextStream()` | `func receiveTextChunk(_ dataString: String)` | `func endTextStream()` |
| HarmonyOS | `beginTextStream(): void` | `receiveTextChunk(dataString: string): void` | `endTextStream(): void` |

- `beginTextStream()` 开始新的流式会话，清空内部缓冲区
- `receiveTextChunk()` 支持分片传输，也可一次性传入完整 JSON
- `endTextStream()` 结束本轮流式会话。SSE 流关闭、HTTP 响应结束、用户取消或网络断开时均需调用

#### addListener / removeListener

添加/移除 Surface 生命周期监听器，所有平台均支持同时注册多个监听器。

| 平台 | 方法签名 |
|---|---|
| Android | `void addListener(ISurfaceManagerListener listener)` / `void removeListener(ISurfaceManagerListener listener)` |
| iOS | `func addListener(_ listener: SurfaceManagerListener)` / `func removeListener(_ listener: SurfaceManagerListener)` / `func removeAllListeners()` |
| HarmonyOS | `addListener(listener: ISurfaceManagerListener): void` / `removeListener(listener: ISurfaceManagerListener): void` / `removeAllListeners(): void` |

> iOS 的监听器以弱引用方式存储，无需担心循环引用。

#### getSurface

按 `surfaceId` 查询已创建的 Surface 实例。

| 平台 | 方法签名 |
|---|---|
| Android | `Surface getSurface(String surfaceId)` |
| iOS | — |
| HarmonyOS | `getSurface(surfaceId: string): Surface \| null` |

#### destroy

| 平台 | 方法签名 | 说明 |
|---|---|---|
| Android | `void destroy()` | 销毁所有 Surface，移除所有监听器，释放 NativeEventBridge 资源 |
| iOS | 随对象 `deinit` 自动执行 | 调用 `removeAllListeners()` 可确保无循环引用 |
| HarmonyOS | `destroy(): void` | 销毁所有 Surface，释放 Native 资源 |

---

### ISurfaceManagerListener（监听器接口）

#### 接口定义

**Android — `ISurfaceManagerListener`**

```java
public interface ISurfaceManagerListener {
    void onCreateSurface(Surface surface);
    void onDeleteSurface(Surface surface);
    default void onReceiveActionEvent(String event) {}
}
```

**iOS — `SurfaceManagerListener`**

```swift
@objc public protocol SurfaceManagerListener: AnyObject {
    @objc optional func onCreateSurface(_ surface: Surface)
    @objc optional func onDeleteSurface(_ surface: Surface)  // iOS 传 Surface 对象
    @objc optional func onReceiveActionEvent(_ event: String)
}
```

**HarmonyOS — `ISurfaceManagerListener`**

```typescript
export interface ISurfaceManagerListener {
    onCreateSurface?: (surface: Surface) => void;
    onDeleteSurface?: (surface: Surface) => void;    // HarmonyOS 传 Surface 对象
    onReceiveActionEvent?: (event: string) => void;
}
```

#### 使用示例

**Android**

```java
surfaceManager.addListener(new ISurfaceManagerListener() {
    @Override
    public void onCreateSurface(Surface surface) {
        ViewGroup container = surface.getContainer();
        parentLayout.addView(container, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ));
    }

    @Override
    public void onDeleteSurface(Surface surface) {
        // 移除对应的 View
    }
});
```

**iOS**

```swift
class MyViewController: UIViewController, SurfaceManagerListener {
    func onCreateSurface(_ surface: Surface) {
        view.addSubview(surface.view)
        surface.updateSize(width: self.view.bounds.width, height: .infinity)
    }

    func onDeleteSurface(_ surface: Surface) {
        surface.view.removeFromSuperview()
    }
}

surfaceManager.addListener(self)
```

**HarmonyOS**

```typescript
const listener: ISurfaceManagerListener = {
    onCreateSurface: (surface: Surface) => {
        this.surfaceId = surface.surfaceId; // 保存 surfaceId 供 AGenUIContainer 使用
    },
    onDeleteSurface: (surface: Surface) => {
        this.surfaceId = '';
    }
};
surfaceManager.addListener(listener);
```

---

### Surface

`Surface` 表示一个完整的渲染单元，由 `SurfaceManager` 通过监听器回调创建，不应直接构造。

#### Surface 属性

| 属性 | Android | iOS | HarmonyOS |
|---|---|---|---|
| Surface ID | `getSurfaceId(): String` | `surfaceId: String` | `surfaceId: string` |
| 根容器 | `getContainer(): ViewGroup` | `view: UIView` | 通过 `AGenUIContainer` 渲染，无 View 属性 |
| 动画开关 | `setAnimationEnabled(boolean)` / `isAnimationEnabled(): boolean` | `animationEnabled: Bool`（默认 `true`） | `animationEnabled: boolean`（默认 `true`） |

**HarmonyOS — 渲染容器**

```typescript
// 在 build() 中使用
AGenUIContainer({ surfaceId: this.surfaceId })
    .width('100%')
```

---

## 自定义组件

实现自定义组件需要：定义组件类、注册组件工厂，不再使用时卸载。

### 注册自定义组件

| 平台 | 注册方法 |
|---|---|
| Android | `AGenUI.getInstance().registerComponent(String type, IComponentFactory creator)` |
| iOS | `AGenUISDK.registerComponent(_ type: String, creator: (String, [String: Any]) -> Component)` |
| HarmonyOS | `AGenUI.registerComponent(type: string, creator: IComponentFactory)` |

#### IComponentFactory 接口定义

**Android — `IComponentFactory`**

```java
public interface IComponentFactory {
    A2UIComponent createComponent(Context context, String id, Map<String, Object> properties);
    String getComponentType();
}
```

**iOS — 工厂闭包**

```swift
// creator 闭包签名：(componentId: String, properties: [String: Any]) -> Component
AGenUISDK.registerComponent("MyButton") { id, properties in
    return MyButtonComponent(id: id, properties: properties)
}
```

**HarmonyOS — `IComponentFactory`**

```typescript
export type IComponentFactory = (
    surfaceId: string,
    nodeId: string,
    componentType: string,
    viewStatePtr: bigint
) => A2UIComponent;
```

#### 注册自定义组件最佳实践

**Lottie 组件示例**

- **Android**: 
  - Factory: `playground/android/app/src/main/java/com/amap/agenuiplayground/component/factory/LottieComponentFactory.java`
  - Component: `playground/android/app/src/main/java/com/amap/agenuiplayground/component/impl/LottieComponent.java`
- **iOS**: `playground/ios/Playground/Playground for AGenUI/CustomComponent/LottieComponent.swift`
- **HarmonyOS**: `playground/harmony/entry/src/main/ets/components/CustomLottieComponent.ets`

### 卸载自定义组件

| 平台 | 方法签名 |
|---|---|
| Android | `AGenUI.getInstance().unregisterComponent(String type)` |
| iOS | `AGenUISDK.unRegisterComponent(_ type: String)` |
| HarmonyOS | `AGenUI.unRegisterComponent(type: string)` |

### A2UIComponent 抽象基类

Android 和 HarmonyOS 的自定义组件需继承 `A2UIComponent`。iOS 自定义组件需继承 `Component`。

**Android — `A2UIComponent`**

```java
public abstract class A2UIComponent {
    public A2UIComponent(String id, String componentType)

    // 子类必须实现
    protected abstract View onCreateView(Context context);
    protected abstract void onUpdateProperties(Map<String, Object> properties);

    // 辅助方法
    public final void triggerAction()                        // 触发组件 Action 事件
    public final void syncState(String jsonData)             // 同步 UI 状态到数据模型
    public String getId()
    public String getComponentType()
    public View getView()
    public Map<String, Object> getProperties()
    public String getSurfaceId()
    public boolean shouldAutoAddChildView()                  // 默认 true，子 View 自动加入容器
    public void addChild(A2UIComponent child)
    public void removeChild(A2UIComponent child)
}
```

**HarmonyOS — `A2UIComponent`**

```typescript
export abstract class A2UIComponent {
    constructor(surfaceId: string, nodeId: string, componentType: string,
                viewStatePtr: bigint, builder: WrappedBuilder<[CustomView]>)

    // 子类必须实现
    protected abstract onUpdateProperties(properties: A2UIComponentProps): void;

    // 辅助方法
    public getProp<T>(key: string): T | undefined
    public getLayoutWidth(): number
    public getLayoutHeight(): number
    public getSurfaceId(): string
    public getNodeId(): string
    public shouldAutoAddChildView(): boolean                 // 默认 false
}
```

**iOS — `Component`**

```swift
@objc open class Component: UIView {
    // 初始化方法
    public init(componentId: String, componentType: String, properties: [String: Any] = [:])
    
    // 核心属性
    public let componentId: String                           // 组件唯一标识
    public let componentType: String                         // 组件类型
    public var properties: [String: Any]                     // 组件属性
    
    // 树结构管理
    public private(set) var children: [Component]            // 子组件列表
    public weak var parent: Component?                       // 父组件
    public weak var surface: Surface?                        // 所属 Surface
    
    // 生命周期方法（子类可选覆写）
    open func updateProperties(_ properties: [String: Any])  // 属性更新时调用
    
    // 辅助方法
    public final func triggerAction()                        // 触发组件 Action 事件
    public final func syncState(_ jsonData: String)          // 同步 UI 状态到数据模型
    public func getChildrenIdsFromProperties() -> [String]   // 从属性中获取子组件 ID
    public func addChild(_ child: Component)                 // 添加子组件
    public func removeChild(_ child: Component)              // 移除子组件
    public func getChild(_ id: String) -> Component?         // 获取指定子组件
    public func destroy()                                    // 销毁组件
}
```

---

## 自定义函数

自定义函数允许 UI 组件调用宿主应用的能力（如导航跳转、数据查询等）。

### 注册函数

| 平台 | 注册方法 |
|---|---|
| Android | `AGenUI.getInstance().registerFunction(IFunction function)` |
| iOS | `AGenUISDK.registerFunction(_ function: Function)` |
| HarmonyOS | `AGenUI.registerFunction(func: IFunctionCall)` |

#### 接口定义

**Android — `IFunction`**

```java
public interface IFunction {
    FunctionResult execute(String jsonString);
    FunctionConfig getConfig();
}

public class FunctionConfig {
    public FunctionConfig(String name)
    public String getName()
    public String toJSON()  // 序列化为 {"name": "..."}
}

public class FunctionResult {
    public static FunctionResult createSuccess(Object value)
    public static FunctionResult createError(Object value)
    public JSONObject toJson()       // {"result": true/false, "value": ...}
    public String toJsonString()
}
```

**iOS — `Function` 协议**

```swift
@objc public protocol Function: AnyObject {
    @objc var functionConfig: FunctionConfig { get }
    @objc func execute(_ params: String) -> FunctionResult
}

@objc public class FunctionConfig: NSObject {
    @objc public let name: String
    @objc public init(name: String)
    @objc public func toJSON() -> String
}

@objc public class FunctionResult: NSObject {
    @objc public let result: Bool
    @objc public let value: [String: Any]
    @objc public static func success(value: [String: Any]) -> FunctionResult
    @objc public static func failure(value: [String: Any]) -> FunctionResult
}
```

**HarmonyOS — `IFunctionCall`**

```typescript
export interface IFunctionCall {
    execute(paramsJson: string): FunctionResult;
    getConfig(): FunctionConfig;
}

export class FunctionConfig {
    name: string = '';
}

export class FunctionResult {
    result: boolean = false;
    value: object | string | undefined = undefined;

    static createSuccess(value: object): FunctionResult
    static createError(error: string): FunctionResult
}
```

#### 注册示例

**Android**

```java
AGenUI.getInstance().registerFunction(new IFunction() {
    @Override
    public FunctionResult execute(String jsonString) {
        return FunctionResult.createSuccess("success");
    }

    @Override
    public FunctionConfig getConfig() {
        return new FunctionConfig("openPage");
    }
});
```

**iOS**

```swift
class OpenPageFunction: NSObject, Function {
    let functionConfig = FunctionConfig(name: "openPage")

    func execute(_ params: String) -> FunctionResult {
        return FunctionResult.success(value: [:])
    }
}

AGenUISDK.registerFunction(OpenPageFunction())
```

**HarmonyOS**

```typescript
const openPageFunc: IFunctionCall = {
    execute(paramsJson: string): FunctionResult {
        return FunctionResult.createSuccess({ status: 'ok' });
    },
    getConfig(): FunctionConfig {
        return { name: 'openPage' };
    }
};
AGenUI.registerFunction(openPageFunc);
```

#### 注册自定义函数最佳实践

**Toast 函数示例**

- **Android**: `playground/android/app/src/main/java/com/amap/agenuiplayground/function/ToastFunction.java`
- **iOS**: `playground/ios/Playground/Playground for AGenUI/Function/ToastFunction.swift`
- **HarmonyOS**: `playground/harmony/entry/src/main/ets/functions/ToastFunction.ets`

### 注销函数

| 平台 | 方法签名 |
|---|---|
| Android | `AGenUI.getInstance().unregisterFunction(String name)` |
| iOS | `AGenUISDK.unregisterFunction(_ name: String)` |
| HarmonyOS | `AGenUI.unregisterFunction(name: string)` |

---

## 图片加载器

SDK 不内置图片加载能力，需宿主应用提供实现。

### 注册图片加载器

| 平台 | 注册方法 |
|---|---|
| Android | `AGenUI.getInstance().registerImageLoader(ImageLoader loader)` |
| iOS | `AGenUISDK.registerImageLoader(_ loader: ImageLoader)` |
| HarmonyOS | `AGenUI.registerImageLoader(loader: IImageLoader)` |

### 接口定义

**Android — `ImageLoader`**

```java
public interface ImageLoader {
    String loadImage(@NonNull String url, @Nullable Map<String, Object> options,
                     @NonNull ImageCallback callback);
    default String loadImage(@NonNull String url, @NonNull ImageCallback callback);
    void cancel(@NonNull String requestId);
    default void clearCache();
}

public interface ImageCallback {
    @MainThread void onSuccess(@NonNull ImageLoadResult result);
    @MainThread void onFailure(@NonNull ImageLoaderError error);
}
```

**iOS — `ImageLoader`**

```swift
@objc public protocol ImageLoader: AnyObject {
    @objc func loadImage(
        from url: URL,
        options: [String: Any]?,
        completion: @escaping (UIImage?, Bool, Error?) -> Void
    ) -> String

    @objc func cancel(for taskId: String)
    @objc func clearMemory()
    @objc func clearDisk()
}
```

**HarmonyOS — `IImageLoader`**

```typescript
export interface IImageLoader {
    loadImage(
        url: string,
        options: ImageLoadOptions | null,
        onComplete: (requestId: string, result: ImageLoadResult | null, error: ImageLoaderError | null) => void
    ): string;

    cancel(requestId: string): void;
    clearCache(): void;
}
```

> **平台差异**：三端图片回调参数不同。Android 使用 `ImageCallback` 接口（主线程回调）；iOS 回调参数为 `(UIImage?, Bool, Error?)`；HarmonyOS 回调参数为 `(requestId, result?, error?)`，图片数据为 `PixelData`（Uint8Array 字节数组）。

### ImageLoadResult

| 平台 | 图片字段 | 缓存字段 | 格式字段 |
|---|---|---|---|
| Android | `drawable: Drawable` | `isFromCache: boolean` | `format: Format`（BITMAP/GIF/SVG/LOTTIE） |
| iOS | `image: UIImage` | `isFromCache: Bool` | — |
| HarmonyOS | `image: PixelData`（含 bytes/width/height） | `isFromCache: boolean` | `format: ImageFormat`（JPEG/PNG/WEBP/GIF） |

### ImageLoaderError

**Android**

```java
public enum Type {
    INVALID_URL, NETWORK_ERROR, INVALID_DATA, DECOMPRESSION_FAILED,
    CANCELLED, PATH_RESOURCE_ERROR
}

// 工厂方法
ImageLoaderError.invalidUrl(String url)
ImageLoaderError.networkError(String url, Throwable cause)
ImageLoaderError.invalidData(String url)
ImageLoaderError.cancelled()
ImageLoaderError.pathResourceError(String url)
boolean isCancelled()
```

**iOS**

```swift
public enum ImageLoaderError: Error, Equatable {
    case invalidURL(String)
    case networkError(Error)
    case invalidData
    case decompressionFailed
    case cancelled
    var isCancelled: Bool { get }
}
```

**HarmonyOS**

```typescript
export enum ImageLoaderErrorType {
    INVALID_URL        = 'invalidURL',
    NETWORK_ERROR      = 'networkError',
    INVALID_DATA       = 'invalidData',
    DECOMPRESSION_FAILED = 'decompressionFailed',
    CANCELLED          = 'cancelled',
}

export interface ImageLoaderError {
    type: ImageLoaderErrorType;
    message?: string;
    isCancelled: boolean;
}
```

### 图片加载选项 Key

以下 Key 可在 `options` 参数中使用（三端一致）：

| Key | 常量值 | 说明 |
|---|---|---|
| `ImageLoadOptionsKey.width` | `"width"` | 目标宽度（px） |
| `ImageLoadOptionsKey.height` | `"height"` | 目标高度（px） |
| `ImageLoadOptionsKey.componentId` | `"componentId"` | 请求来源的组件 ID |
| `ImageLoadOptionsKey.surfaceId` | `"surfaceId"` | 请求来源的 Surface ID |

---

## 错误处理

### 异常类型汇总

| 场景 | Android | iOS | HarmonyOS |
|---|---|---|---|
| 主题注册失败 | `ThemeException`（受检异常） | `AGenUIError`（返回值，`result == false`） | `boolean`（返回 `false`） |
| 引擎未初始化时创建 SurfaceManager | `IllegalStateException` | — | — |
| 引擎 initialize() 失败 | `RuntimeException` | — | — |

**Android**

```java
try {
    AGenUI.getInstance().registerDefaultTheme(themeJson, designToken);
} catch (ThemeException e) {
    // 主题 JSON 解析失败
}

try {
    SurfaceManager sm = new SurfaceManager(activity);
} catch (IllegalStateException e) {
    // 引擎未初始化，需先调用 AGenUI.getInstance().initialize(context)
}
```

**iOS — `AGenUIError`**

```swift
@objc public class AGenUIError: NSObject {
    @objc public let result: Bool
    @objc public let message: String
    @objc public init(result: Bool, message: String)
}

let error = AGenUISDK.registerDefaultTheme(theme, designToken: token)
if !error.result {
    print(error.message)
}
```

**HarmonyOS**

```typescript
// registerDefaultTheme 返回 boolean
const success = AGenUI.registerDefaultTheme(themeJson, designTokenJson);
if (!success) {
    console.error('Theme registration failed');
}
```

---

## 平台差异对比

| 功能 | Android | iOS | HarmonyOS |
|---|---|---|---|
| 全局入口类名 | `AGenUI`（单例） | `AGenUISDK`（静态方法） | `AGenUI`（静态方法） |
| 引擎初始化 | 手动调用 `AGenUI.getInstance().initialize(context)` | 自动 | 自动 |
| SurfaceManager 构造 | `new SurfaceManager(activity)` | `SurfaceManager()` | `new SurfaceManager(context)` |
| Surface 根容器 | `surface.getContainer()` → `ViewGroup` | `surface.view` → `UIView` | `AGenUIContainer({ surfaceId })` → ArkUI 组件 |
| 监听器接口 | `ISurfaceManagerListener`（抽象方法，需全部实现） | `SurfaceManagerListener`（`@objc optional`，可选实现） | `ISurfaceManagerListener`（属性均可选） |
| `onDeleteSurface` 参数 | `Surface surface` | `Surface surface` | `Surface surface` |
| Function 接口名 | `IFunction` | `Function`（Swift protocol） | `IFunctionCall` |
| FunctionResult 工厂 | `createSuccess(Object)` / `createError(Object)` | `success(value: [String: Any])` / `failure(value: [String: Any])` | `createSuccess(object)` / `createError(string)` |
| 图片加载器接口名 | `ImageLoader` | `ImageLoader`（`@objc protocol`） | `IImageLoader` |
| 图片回调方式 | `ImageCallback` 接口（主线程回调） | `(UIImage?, Bool, Error?) -> Void` | `(requestId, result?, error?) -> void` |
| 图片数据类型 | `Drawable` | `UIImage` | `PixelData`（Uint8Array 字节数组） |
| 资源释放 | `surfaceManager.destroy()` | `deinit` 自动执行 | `surfaceManager.destroy()` |
| 错误处理 | `ThemeException` / `IllegalStateException` | `AGenUIError`（返回值） | `boolean` 返回值 |

---

## FAQ

**Q1：如何获取 Surface 对应的原生容器？**

- **Android**：在 `onCreateSurface` 回调中调用 `surface.getContainer()`，返回一个 `FrameLayout`（MATCH_PARENT × WRAP_CONTENT），直接 `addView` 到布局中。
- **iOS**：在 `onCreateSurface` 回调中使用 `surface.view`，将其 `addSubview` 到目标视图并设置布局约束。
- **HarmonyOS**：在 `onCreateSurface` 回调中保存 `surface.surfaceId`，在 `build()` 中使用 `AGenUIContainer({ surfaceId: this.surfaceId })` 渲染。

**Q2：如何实现 Surface 高度自适应内容？**

- **Android**：将 `surface.getContainer()` 的 `height` 设置为 `WRAP_CONTENT`（默认已是此值）：
  ```java
  parentLayout.addView(surface.getContainer(), new LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
  ));
  ```
- **iOS**：将高度约束设为自动（不设固定高度），Surface 会根据内容自适应。
- **HarmonyOS**：`AGenUIContainer` 默认高度为 wrap-content，无需额外处理。

**Q3：如何在 `onDeleteSurface` 中获取 Surface 的唯一标识？**

三端的 `onDeleteSurface` 参数均为 `Surface` 对象，可通过 `surface.getSurfaceId()`（Android）或 `surface.surfaceId`（iOS/HarmonyOS）获取 ID，也可直接访问 `surface.view`（iOS）/ `surface.getContainer()`（Android）进行视图移除操作。

**Q4：如何切换日/夜间模式？**

切换前需确保已注册主题配置，切换后已渲染的 Surface 会自动刷新颜色。

```java
// Android
AGenUI.getInstance().registerDefaultTheme(themeJson, designTokenJson);
AGenUI.getInstance().setDayNightMode("dark");
```

```swift
// iOS
AGenUISDK.registerDefaultTheme(themeJson, designToken: designTokenJson)
AGenUISDK.setDayNightMode("dark")
```

```typescript
// HarmonyOS
AGenUI.registerDefaultTheme(themeJson, designTokenJson);
AGenUI.setDayNightMode('dark');
```

---

## 相关链接

- [快速上手](./QuickStart.zh-CN.md)
- [项目结构说明](./PROJECT_STRUCTURE.zh-CN.md)
