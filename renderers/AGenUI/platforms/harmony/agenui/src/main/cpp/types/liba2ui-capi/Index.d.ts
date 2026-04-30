/**
 * Surface lifecycle listener.
 */
export interface ISurfaceListener {
  /**
   * Called when a surface is created.
   */
  onCreateSurface(surfaceId: string, messageId: string): void;

  /**
   * Called when a surface is destroyed.
   */
  onDeleteSurface(surfaceId: string): void;
  
  /**
   * Optional callback routed from component actions.
   */
  onActionEventRouted?: (content: string) => void;
}

/**
 * Async image loader callback.
 */
export interface ImageLoaderCallback {
  /**
   * Loads an image and returns a local path or base64 payload.
   */
  (url: string): Promise<string>;
}

/** Starts the AGenUI engine. */
export const start: () => void;

/** Stops the AGenUI engine and all SurfaceManager instances. */
export const stop: () => void;

/** Registers the default theme and DesignToken configuration. */
export const registerDefaultTheme: (theme: string, designToken: string) => boolean;

/** Sets the day/night mode. */
export const setDayNightMode: (mode: string) => void;

/** Registers a custom component factory. */
export const registerComponent: (type: string, creator: (nodeId: string, props: object) => object) => void;

/** Returns the AGenUI SDK version. */
export const getVersion: () => string;

/** Creates a SurfaceManager instance. */
export const createSurfaceManager: () => number;

/** Destroys a SurfaceManager instance. */
export const destroySurfaceManager: (engineId: number) => void;

/** Sends mock data to the engine. */
export const sendMockData: (mockData: string) => void;

/** Sets the working directory. */
export const setWorkingDir: (dir: string) => void;

/**
 * Removes an event listener.
 * @deprecated Use unregisterA2UISurfaceListener instead.
 */
export const removeEventListener: (listener: object) => void;

/** Requests a surface using streamed event data. */
export const requestSurface: (engineId: number, requestContent: string) => void;

/** Registers a surface listener. */
export const registerA2UISurfaceListener: (engineId: number, listener: ISurfaceListener) => void;

/** Unregisters a surface listener. */
export const unregisterA2UISurfaceListener: (engineId: number, listener: ISurfaceListener) => void;

/** Binds a surface to a NodeContent object. */
export const bindSurface: (engineId: number, surfaceId: string, nodeContent: object) => boolean;

/** Unbinds a surface. */
export const unbindSurface: (engineId: number, surfaceId: string) => boolean;

/** Clears the A2UI container. */
export const clearA2UiContainer: (engineId: number) => void;

/** Registers the open-url callback. */
export const registerOpenUrlCallback: (callback: (url: string) => void) => void;

/** Registers the skill invoker callback. */
export const registerSkillInvokerCallback: (callback: (skillName: string, argsJson: string) => string) => void;

/** Registers an ETS function. */
export const registerEtsFunction: (name: string, f: Function) => void;

/** Sets device screen metrics. */
export const setDeviceInfo: (width: number, height: number, density: number) => void;

/** Reads a single ComponentState property. */
export const hybridFactoryGetAttribute: (ptr: bigint, key: string) => string;

/** Returns the full ComponentState property snapshot as JSON. */
export const hybridFactoryGetPropertiesJson: (ptr: bigint) => string;

/** Reports the rendered size of a component to the engine. Supports Markdown, Web, and other custom components. */
export const reportComponentRenderSize: (surfaceId: string, nodeId: string, type: string, height: number, width: number, ptr: bigint) => void;

/** Notifies the native layer that the surface size changed. */
export const onSurfaceSizeChanged: (surfaceId: string, width: number, height: number) => void;

/**
 * Sets the legacy theme config.
 * @deprecated Use registerDefaultTheme instead.
 */
export const setThemeConfig: (config: string) => boolean;

/**
 * Sets the legacy DesignToken config.
 * @deprecated Use registerDefaultTheme instead.
 */
export const setDesignTokenConfig: (config: string) => boolean;

/** Registers a platform function with per-skill configuration and callback. */
export const registerFunction: (name: string, config: string, callback: (paramsJson: string) => string) => void;

/** Unregisters a platform function. */
export const unregisterFunction: (name: string) => void;

/** Sets the theme mode. */
export const setThemeMode: (mode: string) => void;

/** Forwards a UI action to the surface manager. */
export const submitUIAction: (engineId: number, surfaceId: string, sourceComponentId: string, contextJson: string) => void;

/** Forwards UI data model changes to the surface manager. */
export const submitUIDataModel: (engineId: number, surfaceId: string, componentId: string, change: string) => void;

/** Destroys the specified surface. */
export const destroySurface: (engineId: number, surfaceId: string) => void;

/** Forwards raw A2UI protocol data. */
export const receiveTextChunk: (engineId: number, data: string) => void;

/** Starts a streamed text session. */
export const beginTextStream: (engineId: number) => void;

/**
 * Ends a streamed text session and resets parser state.
 * Call this after normal close, response end, user abort, or network disconnect cleanup.
 */
export const endTextStream: (engineId: number) => void;

/** Registers the ETS image loader object. */
export const registerImageLoader: (loader: object) => void;

/** Applies raw image pixel data to the matching ArkUI image node. */
export const setImagePixelMap: (requestId: string, buffer: ArrayBuffer, width: number, height: number, pixelFormat: number, alphaType: number) => void;

/** Reports image load failure or cancellation from ETS. */
export const onImageLoadFailed: (requestId: string, isCancelled: boolean) => void;

/** Looks up the engineId corresponding to the given surfaceId. Returns 0 if not found. */
export const findEngineIdBySurfaceId: (surfaceId: string) => number;
