/**
 * Base class for extensible ArkTS views mounted from the C API.
 */

import { ComponentContent, UIContext } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { UpdateState } from './ViewState';
import { BaseProperty } from './HybridBaseProperty';

export const HYBRID_VIEW_TAG = 'HybridViewTag'

export abstract class HybridBaseView {
  private viewTag: string = '';
  private ctxId: string = '';
  private nodeId: string = '';
  private viewStatePtr: bigint = BigInt(0);
  private arkUINode: ComponentContent<HybridBaseView> | null = null;
  protected baseProperty?: BaseProperty<HybridBaseView>;

  constructor(viewTag: string, ctxId: string, nodeId: string, viewStatePtr: bigint) {
    this.viewTag = viewTag;
    this.ctxId = ctxId;
    this.nodeId = nodeId;
    this.viewStatePtr = viewStatePtr;

    this.baseProperty = this.createProperty();
  }

  /**
   * Returns the property object for the current view.
   */
  abstract createProperty(): BaseProperty<HybridBaseView>

  /**
   * Returns the wrapped builder used to construct the ArkTS UI.
   */
  abstract getWrapBuilder(): WrappedBuilder<[HybridBaseView]>

  getViewTag(): string {
    return this.viewTag;
  }

  getUIContext(): UIContext | undefined {
    let uiContext = AppStorage.get<UIContext>("context");
    return uiContext;
  }

  getNodeId(): string {
    return this.nodeId;
  }

  getContextId(): string {
    return this.ctxId;
  }

  getViewStatePtr(): bigint {
    return this.viewStatePtr;
  }

  getProperty(): BaseProperty<HybridBaseView> {
    if (!this.baseProperty) {
      this.baseProperty = this.createProperty();
    }
    return this.baseProperty;
  }

  private createCompContent(): ComponentContent<HybridBaseView> | null {
    const uiContext = this.getUIContext();
    if (uiContext === undefined) {
      hilog.error(0x0000, 'HybridView', 'createCompContent failed: UIContext is undefined, AppStorage \'context\' not initialized.');
      return null;
    }
    return new ComponentContent<HybridBaseView>(uiContext, this.getWrapBuilder(), this);
  }

  /**
   * @final Do not override.
   */
  public toCreateArkUIView(): ComponentContent<HybridBaseView> | null {
    let node: ComponentContent<HybridBaseView> | null = this.createCompContent();
    if (node === null) {
      return null;
    }
    this.arkUINode = node;
    return node;
  }

  /**
   * @final Do not override.
   * Updates view attributes, styles, and events.
   */
  public toUpdateArkTsView(updateStates: UpdateState[]): boolean {
    if (!this.viewStatePtr) {
      return false;
    }

    if (this.baseProperty) {
      this.baseProperty.updateAttrsAndStyles(this.viewStatePtr, updateStates);
    }

    this.updateArkUI();
    this.onUpdateViewFinished();
    return true;
  }

  /**
   * @final Do not override.
   */
  public toDestroyArkTsView(): void {
    this.onDestroy();
    if (this.arkUINode) {
      this.arkUINode.recycle();
      this.arkUINode = null;
    }
  }

  /**
   * Invokes an ArkTS view event.
   * @param key Event key
   * @param params Event parameters
   */
  public toInvokeArkTsView(key: string, params: HybridInvokeCallback) {
    this.onInvoke(key, params);
  }

  /**
   * Called after attributes and styles are updated.
   */
  onUpdateViewFinished() {
  }

  /**
   * Called during teardown so subclasses can release resources.
   */
  onDestroy(): void {
  }

  /**
   * Handles an ArkTS view event.
   * @param key Event key
   * @param params Event parameters
   */
  onInvoke(key: string, params: HybridInvokeCallback): void {
  }

  /**
   * Updates the ArkUI node when view data changes.
   */
  updateArkUI(): void {
    if (this.arkUINode) {
      this.arkUINode.update(this);
    }
  }
}

export type HybridViewCreator = (viewTag: string, ctxId: string, nodeId: string, viewStatePtr: bigint) => HybridBaseView;
export type HybridInvokeValue = boolean | string | number | object | [] | Object | undefined | null;
export type HybridInvokeCallback = (args: Array<HybridInvokeValue>) => HybridInvokeValue;
