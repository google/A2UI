/**
 * AGenUI SDK v2.0 ArkTS wrapper
 *
 * All native calls are routed through bridge layers:
 * - AGenUI (global entry) -> AGenUIEngineBridge singleton
 * - SurfaceManager instances -> AGenUIEngineSurfaceManagerBridge instances
 *
 * @version 2.0.0
 */

import { AGenUIEngineBridge } from './bridge/AGenUIEngineBridge';
import { AGenUIEngineSurfaceManagerBridge } from './bridge/AGenUIEngineSurfaceManagerBridge';
import { FunctionManager } from './function/FunctionManager';
import type { IFunctionCall } from './function/IFunctionCall';
import { FunctionResult, FunctionConfig } from './function/IFunctionCall';
import { IImageLoader } from './ImageLoader';
import { IComponentFactory } from './custom/A2UIComponent';
import { HybridViewManager } from './hybrid/HybridViewManager';
import type { ISurfaceListener } from 'liba2ui-capi.so';
import { common } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

// ==================== Internal types ====================

/** Default context used by Component.triggerAction(). */
interface DefaultActionContext {
  action: string;
}

// ==================== ISurfaceManagerListener ====================

/**
 * Surface lifecycle listener
 */
export interface ISurfaceManagerListener {
  /**
   * Called when a surface is created
   * @param surface Created surface
   */
  onCreateSurface?: (surface: Surface) => void;

  /**
   * Called when a surface is deleted
   * @param surface Deleted surface
   */
  onDeleteSurface?: (surface: Surface) => void;

  /**
   * Called when a component action event is dispatched
   * @param event Event data as a JSON string
   */
  onReceiveActionEvent?: (event: string) => void;
}

// ==================== Component ====================

/**
 * Component
 *
 * Represents a component inside a surface and forwards user actions and state updates.
 */
export class Component {
  /** Component identifier */
  public readonly componentId: string;
  /** Component type */
  public readonly componentType: string;
  /** Associated Surface (weak reference semantics)*/
  private _surface: Surface;

  constructor(surface: Surface, componentId: string, componentType: string) {
    this._surface = surface;
    this.componentId = componentId;
    this.componentType = componentType;
  }

  /**
   * Dispatches a UI action to report user interaction with the component.
   */
  triggerAction(): void {
    const ctx: DefaultActionContext = { action: 'default' };
    this._surface.triggerAction(this.componentId, ctx);
  }

  /**
   * Synchronizes the component UI state to the data model.
   * @param change State change payload
   */
  syncState(change: object): void {
    this._surface.syncState(this.componentId, change);
  }
}

// ==================== Surface ====================

/**
 * Surface
 *
 * Represents an independent UI canvas created and managed by SurfaceManager.
 */
export class Surface {
  /** Surface identifier */
  public readonly surfaceId: string;
  /** Associated engineId */
  public readonly engineId: number;
  /** Message identifier */
  public messageId: string = '';
  /**
   * Whether component enter animations are enabled
   */
  public animationEnabled: boolean = true;
  /** Associated SurfaceManager (weak reference semantics)*/
  public surfaceManager: SurfaceManager | null = null;
  /** Component tree (componentId -> Component) */
  private _componentTree: Record<string, Component> = {};

  constructor(engineId: number, surfaceId: string) {
    this.engineId = engineId;
    this.surfaceId = surfaceId;
  }

  /**
   * Gets or creates a component
   */
  getComponent(componentId: string, componentType: string = ''): Component {
    if (!this._componentTree[componentId]) {
      this._componentTree[componentId] = new Component(this, componentId, componentType);
    }
    return this._componentTree[componentId];
  }

  /**
   * Dispatches a UI action to report user interaction with the component.
   * @param componentId Component ID
   * @param context Context payload
   */
  triggerAction(componentId: string, context: object): void {
    const contextJson = JSON.stringify(context);
    this.surfaceManager?.triggerAction(this.surfaceId, componentId, contextJson);
  }

  /**
   * Synchronizes the component UI state to the data model.
   * @param componentId Component ID
   * @param change State change payload
   */
  syncState(componentId: string, change: object): void {
    const changeJson = JSON.stringify(change);
    this.surfaceManager?.syncState(this.surfaceId, componentId, changeJson);
  }
}

// ==================== NativeSurfaceListenerWrapper ====================

/**
 * Internal adapter that bridges ISurfaceManagerListener to the native ISurfaceListener interface.
 */
class NativeSurfaceListenerWrapper implements ISurfaceListener {
  onCreateSurface: (surfaceId: string, messageId: string) => void;
  onDeleteSurface: (surfaceId: string) => void;
  onActionEventRouted?: (content: string) => void;

  constructor(
    onCreate: (surfaceId: string, messageId: string) => void,
    onDelete: (surfaceId: string) => void,
    onAction?: (content: string) => void
  ) {
    this.onCreateSurface = onCreate;
    this.onDeleteSurface = onDelete;
    this.onActionEventRouted = onAction;
  }
}

// ==================== SurfaceManager ====================

/**
 * AGenUI SurfaceManager
 *
 * Creates, binds, and destroys surfaces.
 * - Global initialization is delegated to the AGenUIEngineBridge singleton on first construction.
 * - Per-instance native operations are routed through AGenUIEngineSurfaceManagerBridge.
 *
 * Typical usage:
 * 1. In aboutToAppear, create SurfaceManager(context).
 * 2. Register surface lifecycle listeners with addListener().
 * 3. Drive streaming rendering with beginTextStream(), receiveTextChunk(), and endTextStream().
 * 4. Call destroy() when the page is disposed.
 */
export class SurfaceManager {
  /**
   * Per-instance SurfaceManager bridge
   */
  private _surfaceBridge: AGenUIEngineSurfaceManagerBridge;

  /** High-level listeners */
  private _listeners: ISurfaceManagerListener[] = [];

  /** ISurfaceManagerListener -> NativeSurfaceListenerWrapper map (keyed by listener reference) */
  private _nativeListenerMap: Map<ISurfaceManagerListener, NativeSurfaceListenerWrapper> = new Map();

  /** Surface map (surfaceId -> Surface) */
  private _surfaces: Map<string, Surface> = new Map();

  /**
   * Creates a SurfaceManager instance
   *
   * Triggers one-time AGenUIEngineBridge initialization on the first instance.
   * Each constructor call creates an independent C++ ISurfaceManager instance.
   *
   * @param context UIAbilityContext
   */
  public constructor(context: common.UIAbilityContext) {
    AGenUIEngineBridge.getInstance().initialize(context);
    this._surfaceBridge = new AGenUIEngineSurfaceManagerBridge();
  }

  /**
   * Returns the native engineId
   */
  public getEngineId(): number {
    return this._surfaceBridge.engineId;
  }

  // MARK: - Listener Management

  /**
   * Adds a surface lifecycle listener
   */
  public addListener(listener: ISurfaceManagerListener): void {
    if (this._nativeListenerMap.has(listener)) {
      // Same listener registered twice; ignore to keep map in sync.
      return;
    }
    this._listeners.push(listener);

    const nativeWrapper = new NativeSurfaceListenerWrapper(
      (surfaceId: string, messageId: string) => {
        if (!this._surfaces.has(surfaceId)) {
          const surface = new Surface(this._surfaceBridge.engineId, surfaceId);
          surface.messageId = messageId;
          surface.surfaceManager = this;
          this._surfaces.set(surfaceId, surface);
        }
        const surface = this._surfaces.get(surfaceId);
        if (!surface) { return; }
        this._listeners.forEach(l => l.onCreateSurface?.(surface));
      },
      (surfaceId: string) => {
        const surface = this._surfaces.get(surfaceId);
        this._surfaces.delete(surfaceId);
        if (surface) {
          surface.surfaceManager = null;
          this._listeners.forEach(l => l.onDeleteSurface?.(surface));
        }
      },
      (event: string) => {
        this._listeners.forEach(l => l.onReceiveActionEvent?.(event));
      }
    );

    this._nativeListenerMap.set(listener, nativeWrapper);
    this._surfaceBridge.addSurfaceListener(nativeWrapper);
  }

  /**
   * Removes a surface lifecycle listener
   */
  public removeListener(listener: ISurfaceManagerListener): void {
    const idx = this._listeners.indexOf(listener);
    if (idx >= 0) {
      this._listeners.splice(idx, 1);
    }
    const nativeWrapper = this._nativeListenerMap.get(listener);
    if (nativeWrapper) {
      this._surfaceBridge.removeSurfaceListener(nativeWrapper);
      this._nativeListenerMap.delete(listener);
    }
  }

  /**
   * Removes all listeners
   */
  public removeAllListeners(): void {
    this._nativeListenerMap.forEach((nativeWrapper) => {
      this._surfaceBridge.removeSurfaceListener(nativeWrapper);
    });
    this._nativeListenerMap.clear();
    this._listeners = [];
  }

  // MARK: - Data Exchange

  /**
   * Begins a streaming data session
   */
  public beginTextStream(): void {
    this._surfaceBridge.beginTextStream();
  }

  /**
   * Ends a streaming data session
   */
  public endTextStream(): void {
    this._surfaceBridge.endTextStream();
  }

  /**
   * Receives an A2UI protocol chunk
   */
  public receiveTextChunk(dataString: string): void {
    this._surfaceBridge.receiveTextChunk(dataString);
  }

  // MARK: - Surface Lookup

  /**
   * Dispatches a UI action on behalf of a Surface.
   * Called by Surface.triggerAction(); not intended for external use.
   */
  public triggerAction(surfaceId: string, componentId: string, contextJson: string): void {
    this._surfaceBridge.triggerAction(surfaceId, componentId, contextJson);
  }

  /**
   * Synchronizes component state on behalf of a Surface.
   * Called by Surface.syncState(); not intended for external use.
   */
  public syncState(surfaceId: string, componentId: string, changeJson: string): void {
    this._surfaceBridge.syncState(surfaceId, componentId, changeJson);
  }

  /**
   * Returns the specified surface
   */
  public getSurface(surfaceId: string): Surface | null {
    return this._surfaces.get(surfaceId) ?? null;
  }

  // MARK: - Lifecycle

  /**
   * Destroys the SurfaceManager and releases all resources
   */
  public destroy(): void {
    this.removeAllListeners();
    this._surfaces.forEach(surface => { surface.surfaceManager = null; });
    this._surfaces.clear();
    this._surfaceBridge.teardown();
  }
}

// ==================== AGenUI Global Entry Point ====================

/**
 * AGenUI global entry point
 *
 * All global configuration is delegated to the AGenUIEngineBridge singleton.
 */
export class AGenUI {

  // MARK: - Theme Configuration

  /**
   * Registers the default theme and design token configuration
   */
  static registerDefaultTheme(theme: string, designToken: string): boolean {
    const themeOk = AGenUIEngineBridge.getInstance().loadThemeConfig(theme);
    const tokenOk = AGenUIEngineBridge.getInstance().loadDesignTokenConfig(designToken);
    return themeOk && tokenOk;
  }

  /**
   * Sets the day/night mode
   */
  static setDayNightMode(mode: string): void {
    if (mode !== 'light' && mode !== 'dark') {
      hilog.error(0x0000, 'AGenUI', 'setDayNightMode: invalid mode \'%{public}s\', expected \'light\' or \'dark\'', mode);
      return;
    }
    AGenUIEngineBridge.getInstance().setDayNightMode(mode);
  }

  // MARK: - Component Registration

  /**
   * Registers a custom component factory
   */
  static registerComponent(type: string, creator: IComponentFactory): void {
    HybridViewManager.getInstance().registerViewCreator(type, creator);
  }

  /**
   * Unregisters a custom component factory
   */
  static unRegisterComponent(type: string): void {
    HybridViewManager.getInstance().unregisterViewCreator(type);
  }

  // MARK: - Image Loader

  /**
   * Registers a global image loader
   */
  static registerImageLoader(loader: IImageLoader): void {
    AGenUIEngineBridge.getInstance().registerImageLoader(loader);
  }

  /**
   * Sets the working directory
   */
  static setWorkingDir(dir: string): void {
    AGenUIEngineBridge.getInstance().setWorkingDir(dir);
  }

  // MARK: - Skill / FunctionCall
  /**
   * Registers a function backed by IFunctionCall
   */
  static registerFunction(func: IFunctionCall): void {
    FunctionManager.getInstance().registerFunction(func);
  }

  /**
   * Unregisters a function
   */
  static unregisterFunction(name: string): void {
    FunctionManager.getInstance().unregisterFunction(name);
  }

  // MARK: - Version Information

  /**
   * Returns the AGenUI SDK version
   */
  static getVersion(): string {
    return '2.0.0';
  }
}

// ==================== Function Type Re-export ====================
export { FunctionResult, FunctionConfig } from './function/IFunctionCall';
export type { IFunctionCall } from './function/IFunctionCall';
