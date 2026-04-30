/**
 * AGenUI SDK - A2UI Dynamic UI Rendering Engine
 * Module Export Entry
 *
 * Architecture layers:
 * - The Bridge layer (AGenUIEngineBridge / AGenUIEngineSurfaceManagerBridge) is internal and not part of the public API.
 * - The public SDK exposes AGenUI (global entry), SurfaceManager instances, Surface, Component, and ISurfaceManagerListener.
 */

// ============ SDK Entry ============
export {
  AGenUI,
  SurfaceManager,
  Surface,
  Component,
  ISurfaceManagerListener,
  FunctionResult,
  FunctionConfig,
} from './agenui/AGenEngineUI';
export type { IFunctionCall } from './agenui/AGenEngineUI';

// ============ SDK Interfaces ============
export type { ISurfaceListener } from 'liba2ui-capi.so';

// ============ Image Loader Interfaces ============
export type { IImageLoader, ImageLoadOptions, ImageLoadResult, ImageLoaderError } from './agenui/ImageLoader';
export { ImageLoadOptionsKey, ImageFormat, ImageLoaderErrorType, ImageLoaderConfiguration } from './agenui/ImageLoader';

// ============ UI Rendering Container ============
export { AGenUIContainer } from './agenui/AGenUIContainer';

// ============ Custom Component Interfaces ============
export { A2UIComponent } from './agenui/custom/A2UIComponent';
export type { A2UIComponentProps, CustomView, IComponentFactory } from './agenui/custom/A2UIComponent';
export { StyleHelper } from './agenui/custom/StyleHelper';
