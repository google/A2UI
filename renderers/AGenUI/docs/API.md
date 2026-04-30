# API Reference

English | [中文](API.zh-CN.md)

## Core API

### AGenUI (Global Entry Point)

The global entry point, responsible for engine initialization, theme registration, and custom extension registration. On Android it is accessed as a singleton; on iOS via `AGenUISDK` static methods; on HarmonyOS via `AGenUI` static methods.

#### Initialization

| Platform | Method signature | Notes |
|---|---|---|
| Android | `AGenUI.getInstance().initialize(Context applicationContext)` | Must be called before creating any `SurfaceManager` |
| iOS | No explicit initialization needed | Triggered automatically on first `SurfaceManager` creation |
| HarmonyOS | No explicit initialization needed | Triggered automatically on first `SurfaceManager` creation |

```java
// Android — call in Application.onCreate()
AGenUI.getInstance().initialize(this);
```

#### setDayNightMode

Sets the global day/night mode. After switching, already-rendered Surfaces automatically refresh their colors according to the registered theme tokens.

| Platform | Method signature |
|---|---|
| Android | `void setDayNightMode(String mode)` |
| iOS | `static func setDayNightMode(_ mode: String)` |
| HarmonyOS | `static setDayNightMode(mode: string): void` |

`mode` accepted values: `"light"` / `"dark"`

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

Registers the default theme configuration and design tokens. Should be called before creating any `SurfaceManager`. Both `theme` and `designToken` are JSON strings.

| Platform | Method signature |
|---|---|
| Android | `void registerDefaultTheme(String theme, String designToken) throws ThemeException` |
| iOS | `static func registerDefaultTheme(_ theme: String, designToken: String) -> AGenUIError` |
| HarmonyOS | `static registerDefaultTheme(theme: string, designToken: string): boolean` |

**Error handling**

| Platform | Error type | Notes |
|---|---|---|
| Android | `ThemeException` (checked exception) | Thrown when theme JSON is malformed |
| iOS | `AGenUIError` (return value) | Failure when `result == false`; see the `message` field |
| HarmonyOS | `boolean` (return value) | Returns `false` on failure |

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

Each `SurfaceManager` instance corresponds to an independent streaming session; multiple instances may coexist.

#### Initialization

| Platform | Constructor |
|---|---|
| Android | `new SurfaceManager(Activity activity)` |
| iOS | `SurfaceManager()` |
| HarmonyOS | `new SurfaceManager(context: UIAbilityContext)` |

- Android requires `AGenUI.getInstance().initialize(context)` to be completed first; otherwise an `IllegalStateException` is thrown.
- iOS / HarmonyOS trigger engine initialization automatically during construction.

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

#### Streaming data reception

Full call order: `beginTextStream()` → `receiveTextChunk(chunk)` × N → `endTextStream()`

| Platform | `beginTextStream` | `receiveTextChunk` | `endTextStream` |
|---|---|---|---|
| Android | `void beginTextStream()` | `void receiveTextChunk(String dataString)` | `void endTextStream()` |
| iOS | `func beginTextStream()` | `func receiveTextChunk(_ dataString: String)` | `func endTextStream()` |
| HarmonyOS | `beginTextStream(): void` | `receiveTextChunk(dataString: string): void` | `endTextStream(): void` |

- `beginTextStream()` starts a new streaming session and clears the internal buffer.
- `receiveTextChunk()` supports fragmented delivery or a single complete JSON payload.
- `endTextStream()` ends the current streaming session. Call this when the SSE stream closes, the HTTP response ends, the user cancels, or a network disconnect occurs.

#### addListener / removeListener

Add or remove Surface lifecycle listeners. All platforms support registering multiple listeners simultaneously.

| Platform | Method signatures |
|---|---|
| Android | `void addListener(ISurfaceManagerListener listener)` / `void removeListener(ISurfaceManagerListener listener)` |
| iOS | `func addListener(_ listener: SurfaceManagerListener)` / `func removeListener(_ listener: SurfaceManagerListener)` / `func removeAllListeners()` |
| HarmonyOS | `addListener(listener: ISurfaceManagerListener): void` / `removeListener(listener: ISurfaceManagerListener): void` / `removeAllListeners(): void` |

> iOS stores listeners as weak references, so there is no risk of retain cycles.

#### getSurface

Retrieves an existing Surface instance by `surfaceId`.

| Platform | Method signature |
|---|---|
| Android | `Surface getSurface(String surfaceId)` |
| iOS | — |
| HarmonyOS | `getSurface(surfaceId: string): Surface \| null` |

#### destroy

| Platform | Method signature | Notes |
|---|---|---|
| Android | `void destroy()` | Destroys all Surfaces, removes all listeners, releases NativeEventBridge resources |
| iOS | Executed automatically on `deinit` | Call `removeAllListeners()` to ensure no retain cycles |
| HarmonyOS | `destroy(): void` | Destroys all Surfaces and releases native resources |

---

### ISurfaceManagerListener (Listener Interface)

#### Interface definition

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
    @objc optional func onDeleteSurface(_ surface: Surface)
    @objc optional func onReceiveActionEvent(_ event: String)
}
```

**HarmonyOS — `ISurfaceManagerListener`**

```typescript
export interface ISurfaceManagerListener {
    onCreateSurface?: (surface: Surface) => void;
    onDeleteSurface?: (surface: Surface) => void;
    onReceiveActionEvent?: (event: string) => void;
}
```

#### Usage examples

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
        // Remove the corresponding view
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
        this.surfaceId = surface.surfaceId; // Save surfaceId for use with AGenUIContainer
    },
    onDeleteSurface: (surface: Surface) => {
        this.surfaceId = '';
    }
};
surfaceManager.addListener(listener);
```

---

### Surface

`Surface` represents a complete rendering unit. It is created by `SurfaceManager` via listener callbacks and should not be constructed directly.

#### Surface properties

| Property | Android | iOS | HarmonyOS |
|---|---|---|---|
| Surface ID | `getSurfaceId(): String` | `surfaceId: String` | `surfaceId: string` |
| Root container | `getContainer(): ViewGroup` | `view: UIView` | Rendered via `AGenUIContainer`; no view property |
| Animation toggle | `setAnimationEnabled(boolean)` / `isAnimationEnabled(): boolean` | `animationEnabled: Bool` (default `true`) | `animationEnabled: boolean` (default `true`) |

**HarmonyOS — rendering container**

```typescript
// Use in build()
AGenUIContainer({ surfaceId: this.surfaceId })
    .width('100%')
```

---

## Custom Components

Registering a custom component requires: defining the component class, registering a component factory, and unregistering when no longer needed.

### Register a custom component

| Platform | Registration method |
|---|---|
| Android | `AGenUI.getInstance().registerComponent(String type, IComponentFactory creator)` |
| iOS | `AGenUISDK.registerComponent(_ type: String, creator: (String, [String: Any]) -> Component)` |
| HarmonyOS | `AGenUI.registerComponent(type: string, creator: IComponentFactory)` |

#### IComponentFactory interface definition

**Android — `IComponentFactory`**

```java
public interface IComponentFactory {
    A2UIComponent createComponent(Context context, String id, Map<String, Object> properties);
    String getComponentType();
}
```

**iOS — factory closure**

```swift
// creator closure signature: (componentId: String, properties: [String: Any]) -> Component
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

#### Best Practices for Registering Custom Components

**Lottie Component Example**

- **Android**: 
  - Factory: `playground/android/app/src/main/java/com/amap/agenuiplayground/component/factory/LottieComponentFactory.java`
  - Component: `playground/android/app/src/main/java/com/amap/agenuiplayground/component/impl/LottieComponent.java`
- **iOS**: `playground/ios/Playground/Playground for AGenUI/CustomComponent/LottieComponent.swift`
- **HarmonyOS**: `playground/harmony/entry/src/main/ets/components/CustomLottieComponent.ets`

### Unregistering Custom Components

| Platform | Method signature |
|---|---|
| Android | `AGenUI.getInstance().unregisterComponent(String type)` |
| iOS | `AGenUISDK.unRegisterComponent(_ type: String)` |
| HarmonyOS | `AGenUI.unRegisterComponent(type: string)` |

### A2UIComponent abstract base class

Custom components on Android and HarmonyOS must inherit from `A2UIComponent`. iOS custom components must inherit from `Component`.

**Android — `A2UIComponent`**

```java
public abstract class A2UIComponent {
    public A2UIComponent(String id, String componentType)

    // Must be implemented by subclasses
    protected abstract View onCreateView(Context context);
    protected abstract void onUpdateProperties(Map<String, Object> properties);

    // Helper methods
    public final void triggerAction()                        // Trigger a component Action event
    public final void syncState(String jsonData)             // Sync UI state to the data model
    public String getId()
    public String getComponentType()
    public View getView()
    public Map<String, Object> getProperties()
    public String getSurfaceId()
    public boolean shouldAutoAddChildView()                  // Default true; child views are added to the container automatically
    public void addChild(A2UIComponent child)
    public void removeChild(A2UIComponent child)
}
```

**HarmonyOS — `A2UIComponent`**

```typescript
export abstract class A2UIComponent {
    constructor(surfaceId: string, nodeId: string, componentType: string,
                viewStatePtr: bigint, builder: WrappedBuilder<[CustomView]>)

    // Must be implemented by subclasses
    protected abstract onUpdateProperties(properties: A2UIComponentProps): void;

    // Helper methods
    public getProp<T>(key: string): T | undefined
    public getLayoutWidth(): number
    public getLayoutHeight(): number
    public getSurfaceId(): string
    public getNodeId(): string
    public shouldAutoAddChildView(): boolean                 // Default false
}
```

**iOS — `Component`**

```swift
@objc open class Component: UIView {
    // Initialization
    public init(componentId: String, componentType: String, properties: [String: Any] = [:])
    
    // Core properties
    public let componentId: String                           // Unique component identifier
    public let componentType: String                         // Component type
    public var properties: [String: Any]                     // Component properties
    
    // Tree structure management
    public private(set) var children: [Component]            // Child components list
    public weak var parent: Component?                       // Parent component
    public weak var surface: Surface?                        // Owning Surface
    
    // Lifecycle methods (subclasses can override)
    open func updateProperties(_ properties: [String: Any])  // Called when properties update
    
    // Helper methods
    public final func triggerAction()                        // Trigger component Action event
    public final func syncState(_ jsonData: String)          // Sync UI state to data model
    public func getChildrenIdsFromProperties() -> [String]   // Get child component IDs from properties
    public func addChild(_ child: Component)                 // Add child component
    public func removeChild(_ child: Component)              // Remove child component
    public func getChild(_ id: String) -> Component?         // Get specific child component
    public func destroy()                                    // Destroy component
}
```

---

## Custom Functions

Custom functions allow UI components to invoke host application capabilities (e.g., navigation, data queries).

### Register a function

| Platform | Registration method |
|---|---|
| Android | `AGenUI.getInstance().registerFunction(IFunction function)` |
| iOS | `AGenUISDK.registerFunction(_ function: Function)` |
| HarmonyOS | `AGenUI.registerFunction(func: IFunctionCall)` |

#### Interface definition

**Android — `IFunction`**

```java
public interface IFunction {
    FunctionResult execute(String jsonString);
    FunctionConfig getConfig();
}

public class FunctionConfig {
    public FunctionConfig(String name)
    public String getName()
    public String toJSON()  // Serializes to {"name": "..."}
}

public class FunctionResult {
    public static FunctionResult createSuccess(Object value)
    public static FunctionResult createError(Object value)
    public JSONObject toJson()       // {"result": true/false, "value": ...}
    public String toJsonString()
}
```

**iOS — `Function` protocol**

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

#### Registration examples

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

#### Best Practices for Registering Custom Functions

**Toast Function Example**

- **Android**: `playground/android/app/src/main/java/com/amap/agenuiplayground/function/ToastFunction.java`
- **iOS**: `playground/ios/Playground/Playground for AGenUI/Function/ToastFunction.swift`
- **HarmonyOS**: `playground/harmony/entry/src/main/ets/functions/ToastFunction.ets`

### Unregistering Functions

| Platform | Method signature |
|---|---|
| Android | `AGenUI.getInstance().unregisterFunction(String name)` |
| iOS | `AGenUISDK.unregisterFunction(_ name: String)` |
| HarmonyOS | `AGenUI.unregisterFunction(name: string)` |

---

## Image Loader

The SDK does not include built-in image loading — the host application must provide an implementation.

### Register an image loader

| Platform | Registration method |
|---|---|
| Android | `AGenUI.getInstance().registerImageLoader(ImageLoader loader)` |
| iOS | `AGenUISDK.registerImageLoader(_ loader: ImageLoader)` |
| HarmonyOS | `AGenUI.registerImageLoader(loader: IImageLoader)` |

### Interface definition

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

> **Platform differences**: Callback signatures differ across platforms. Android uses an `ImageCallback` interface (called on the main thread); iOS uses `(UIImage?, Bool, Error?) -> Void`; HarmonyOS uses `(requestId, result?, error?)` with image data as `PixelData` (a `Uint8Array` byte array).

### ImageLoadResult

| Platform | Image field | Cache field | Format field |
|---|---|---|---|
| Android | `drawable: Drawable` | `isFromCache: boolean` | `format: Format` (BITMAP/GIF/SVG/LOTTIE) |
| iOS | `image: UIImage` | `isFromCache: Bool` | — |
| HarmonyOS | `image: PixelData` (contains bytes/width/height) | `isFromCache: boolean` | `format: ImageFormat` (JPEG/PNG/WEBP/GIF) |

### ImageLoaderError

**Android**

```java
public enum Type {
    INVALID_URL, NETWORK_ERROR, INVALID_DATA, DECOMPRESSION_FAILED,
    CANCELLED, PATH_RESOURCE_ERROR
}

// Factory methods
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

### Image load option keys

The following keys may be used in the `options` parameter (consistent across all platforms):

| Key | Constant value | Description |
|---|---|---|
| `ImageLoadOptionsKey.width` | `"width"` | Target width (px) |
| `ImageLoadOptionsKey.height` | `"height"` | Target height (px) |
| `ImageLoadOptionsKey.componentId` | `"componentId"` | ID of the component making the request |
| `ImageLoadOptionsKey.surfaceId` | `"surfaceId"` | ID of the Surface making the request |

---

## Error Handling

### Exception type summary

| Scenario | Android | iOS | HarmonyOS |
|---|---|---|---|
| Theme registration failure | `ThemeException` (checked exception) | `AGenUIError` (return value, `result == false`) | `boolean` (returns `false`) |
| Creating SurfaceManager before engine initialization | `IllegalStateException` | — | — |
| Engine `initialize()` failure | `RuntimeException` | — | — |

**Android**

```java
try {
    AGenUI.getInstance().registerDefaultTheme(themeJson, designToken);
} catch (ThemeException e) {
    // Theme JSON parsing failed
}

try {
    SurfaceManager sm = new SurfaceManager(activity);
} catch (IllegalStateException e) {
    // Engine not initialized — call AGenUI.getInstance().initialize(context) first
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
// registerDefaultTheme returns boolean
const success = AGenUI.registerDefaultTheme(themeJson, designTokenJson);
if (!success) {
    console.error('Theme registration failed');
}
```

---

## Platform Differences

| Feature | Android | iOS | HarmonyOS |
|---|---|---|---|
| Global entry class | `AGenUI` (singleton) | `AGenUISDK` (static methods) | `AGenUI` (static methods) |
| Engine initialization | Manual — `AGenUI.getInstance().initialize(context)` | Automatic | Automatic |
| SurfaceManager constructor | `new SurfaceManager(activity)` | `SurfaceManager()` | `new SurfaceManager(context)` |
| Surface root container | `surface.getContainer()` → `ViewGroup` | `surface.view` → `UIView` | `AGenUIContainer({ surfaceId })` → ArkUI component |
| Listener interface | `ISurfaceManagerListener` (abstract methods, all must be implemented) | `SurfaceManagerListener` (`@objc optional`, all methods optional) | `ISurfaceManagerListener` (all properties optional) |
| `onDeleteSurface` parameter | `Surface surface` | `Surface surface` | `Surface surface` |
| Function interface name | `IFunction` | `Function` (Swift protocol) | `IFunctionCall` |
| FunctionResult factory | `createSuccess(Object)` / `createError(Object)` | `success(value: [String: Any])` / `failure(value: [String: Any])` | `createSuccess(object)` / `createError(string)` |
| Image loader interface name | `ImageLoader` | `ImageLoader` (`@objc protocol`) | `IImageLoader` |
| Image callback | `ImageCallback` interface (main-thread callback) | `(UIImage?, Bool, Error?) -> Void` | `(requestId, result?, error?) -> void` |
| Image data type | `Drawable` | `UIImage` | `PixelData` (Uint8Array byte array) |
| Resource release | `surfaceManager.destroy()` | Automatic on `deinit` | `surfaceManager.destroy()` |
| Error handling | `ThemeException` / `IllegalStateException` | `AGenUIError` (return value) | `boolean` return value |

---

## FAQ

**Q1: How do I get the native container for a Surface?**

- **Android**: Call `surface.getContainer()` in the `onCreateSurface` callback. It returns a `FrameLayout` (MATCH_PARENT × WRAP_CONTENT) that you can `addView` directly to your layout.
- **iOS**: Use `surface.view` in the `onCreateSurface` callback. Call `addSubview` on the target view and set layout constraints.
- **HarmonyOS**: Save `surface.surfaceId` in the `onCreateSurface` callback, then render with `AGenUIContainer({ surfaceId: this.surfaceId })` in `build()`.

**Q2: How do I make a Surface height auto-size to its content?**

- **Android**: Set the `height` of `surface.getContainer()` to `WRAP_CONTENT` (this is the default):
  ```java
  parentLayout.addView(surface.getContainer(), new LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
  ));
  ```
- **iOS**: Do not set a fixed height constraint — the Surface will size to fit its content automatically.
- **HarmonyOS**: `AGenUIContainer` defaults to wrap-content height; no extra handling is needed.

**Q3: How do I get a Surface's unique ID in `onDeleteSurface`?**

All three platforms pass a `Surface` object to `onDeleteSurface`. Call `surface.getSurfaceId()` on Android or access `surface.surfaceId` on iOS / HarmonyOS to get the ID. You can also call `surface.getContainer()` (Android) or `surface.view` (iOS) directly to remove the view.

**Q4: How do I switch day/night mode?**

Make sure a theme configuration is registered first. After switching, already-rendered Surfaces refresh their colors automatically.

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

## Related Links

- [QuickStart](./QuickStart.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
