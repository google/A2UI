/**
 * AGenUI Engine Bridge (global singleton)
 *
 * Owns the global IAGenUIEngine lifecycle and engine-level configuration,
 * including theme, design tokens, day/night mode, skill and function
 * registration, the working directory, and device information.
 *
 * Use AGenUIEngineSurfaceManagerBridge for per-instance data transport.
 */

import display from '@ohos.display';
import {
  start,
  setWorkingDir as nativeSetWorkingDir,
  setDeviceInfo,
  setThemeConfig,
  setDesignTokenConfig,
  setDayNightMode,
  registerImageLoader as nativeRegisterImageLoader,
  setImagePixelMap,
  onImageLoadFailed,
  createSurfaceManager as nativeCreateSurfaceManager,
  destroySurfaceManager as nativeDestroySurfaceManager,
  registerEtsFunction,
} from 'liba2ui-capi.so';

import internal_a2ui from 'liba2ui-capi.so';

import { common, OpenLinkOptions } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

import {
  IImageLoader,
  ImageLoadResult,
  ImageLoaderError,
} from '../ImageLoader';
import {
  createHybridView,
  updateHybridView,
  destroyHybridView,
  onInvokeHybridView,
  HybridViewManager,
} from '../hybrid/HybridViewManager';

// ==================== Internal Image Loader State ====================

/** Loader wrapper contract used by the C++ bridge layer. */
interface WrappedImageLoader {
  loadImage: (url: string, options: Record<string, Object> | null, requestId: string) => string;
  cancel: (requestId: string) => void;
  clearCache: () => void;
}

/** Globally registered image loader instance. */
let g_imageLoader: IImageLoader | null = null;

// ==================== AGenUIEngineBridge ====================

/**
 * Global AGenUI engine bridge.
 *
 * - Performs one-time global initialization
 * - Applies theme, design token, and day/night configuration
 * - Registers skills, function calls, and image loaders
 * - Creates C++ ISurfaceManager instances for SurfaceManager
 */
export class AGenUIEngineBridge {
  private static _instance: AGenUIEngineBridge | null = null;
  private static _initialized: boolean = false;

  private constructor() {}

  /**
   * Returns the global singleton.
   */
  static getInstance(): AGenUIEngineBridge {
    if (AGenUIEngineBridge._instance === null) {
      AGenUIEngineBridge._instance = new AGenUIEngineBridge();
    }
    return AGenUIEngineBridge._instance;
  }

  // MARK: - Global Initialization

  /**
   * Initializes the SDK once.
   *
   * Registers HybridView ETS callbacks, URL hooks, device information, and
   * the working directory, then starts the engine.
   *
   * @param context UIAbilityContext
   */
  initialize(context: common.UIAbilityContext): void {
    if (AGenUIEngineBridge._initialized) {
      return;
    }
    AGenUIEngineBridge._initialized = true;

    // Register built-in HybridView ETS callbacks.
    registerEtsFunction('createHybridView', createHybridView);
    registerEtsFunction('updateHybridView', updateHybridView);
    registerEtsFunction('destroyHybridView', destroyHybridView);
    registerEtsFunction('onInvokeHybridView', onInvokeHybridView);
    registerEtsFunction('hasCustomComponent', (componentType: string): boolean => {
      return HybridViewManager.getInstance().hasViewCreator(componentType);
    });

    // Register the URL open callback.
    internal_a2ui.registerOpenUrlCallback((url: string) => {
      try {
        const openLinkOptions: OpenLinkOptions = { appLinkingOnly: false };
        context.openLink(url, openLinkOptions).then(() => {
        }).catch((error: BusinessError<void>) => {
          hilog.error(0x0000, 'AGenUIBridge', 'Failed to open URL: %{public}s, error: %{public}s', url, JSON.stringify(error));
        });
      } catch (error) {
        hilog.error(0x0000, 'AGenUIBridge', 'Exception in openUrl callback: %{public}s, url: %{public}s', JSON.stringify(error), url);
      }
    });

    // Device information and working directory.
    const display_ = display.getDefaultDisplaySync();
    setDeviceInfo(display_.width, display_.height, display_.densityPixels);

    // Start the engine.
    start();

    // set working dir to filesDir by default, which allows the engine to write temp files if needed.
    nativeSetWorkingDir(context.filesDir);
  }

  // MARK: - C++ ISurfaceManager Factory

  /**
   * Creates a C++ ISurfaceManager instance and returns its engineId.
   */
  createSurfaceManager(): number {
    return nativeCreateSurfaceManager();
  }

  /**
   * Destroys a C++ ISurfaceManager instance.
   */
  destroySurfaceManager(engineId: number): void {
    nativeDestroySurfaceManager(engineId);
  }

  // MARK: - Theme Configuration

  /**
   * Loads theme configuration.
   */
  loadThemeConfig(themeConfigJson: string): boolean {
    return setThemeConfig(themeConfigJson);
  }

  /**
   * Loads design token configuration.
   */
  loadDesignTokenConfig(designTokenConfigJson: string): boolean {
    return setDesignTokenConfig(designTokenConfigJson);
  }

  /**
   * Sets the day/night mode
   */
  setDayNightMode(mode: string): void {
    setDayNightMode(mode);
  }

  /**
   * Sets the working directory
   */
  setWorkingDir(dir: string): void {
    nativeSetWorkingDir(dir);
  }

  // MARK: - Image Loader

  /**
   * Registers a global image loader
   *
   * Wraps IImageLoader in the format expected by the C++ bridge layer.
   */
  registerImageLoader(loader: IImageLoader): void {
    g_imageLoader = loader;

    const wrappedLoader: WrappedImageLoader = {
      loadImage: (url: string, options: Record<string, Object> | null, requestId: string): string => {
        if (g_imageLoader === null) {
          return '';
        }
        g_imageLoader.loadImage(
          url,
          options,
          (_rid: string, result: ImageLoadResult | null, error: ImageLoaderError | null) => {
            // Defensive check: result and error must not both be null simultaneously.
            if (result === null && error === null) {
              hilog.error(0x0000, 'AGenUIBridge', 'loadImage callback received both result and error as null, requestId=%{public}s. Treating as failure.', requestId);
              onImageLoadFailed(requestId, false);
              return;
            }
            if (result !== null && result.image != null) {
              const pd = result.image;
              try {
                if (!pd.bytes || pd.bytes.byteLength === 0 || pd.width <= 0 || pd.height <= 0) {
                  hilog.error(0x0000, 'AGenUIBridge', `invalid PixelData: bytes=%{public}s %{public}d x %{public}d`, `${pd.bytes?.byteLength}`, pd.width, pd.height);
                  onImageLoadFailed(requestId, false);
                  return;
                }
                const buf = pd.bytes.buffer.slice(
                  pd.bytes.byteOffset,
                  pd.bytes.byteOffset + pd.bytes.byteLength
                ) as ArrayBuffer;
                const srcFmt: number = 4; // PIXEL_FORMAT_BGRA_8888 (OH_PixelFormat enum value 4); matches the format produced by the host's IImageLoader
                setImagePixelMap(requestId, buf, pd.width, pd.height, srcFmt, pd.alphaType as number);
              } catch (e) {
                hilog.error(0x0000, 'AGenUIBridge', 'setImagePixelMap failed: %{public}s', `${e}`);
                onImageLoadFailed(requestId, false);
              }
            } else {
              onImageLoadFailed(requestId, error ? error.isCancelled : false);
            }
          }
        );
        return requestId;
      },
      cancel: (requestId: string): void => {
        g_imageLoader?.cancel(requestId);
      },
      clearCache: (): void => {
        g_imageLoader?.clearCache();
      },
    };

    nativeRegisterImageLoader(wrappedLoader as Object);
    hilog.info(0x0000, 'AGenUIBridge', 'Image loader registered successfully');
  }
}
