/*
 * Manager for extensible ArkTS views mounted from the C API.
 */

import { hilog } from '@kit.PerformanceAnalysisKit';
import { UpdateState } from './ViewState';
import { HybridInvokeCallback, HybridBaseView, HybridViewCreator, HYBRID_VIEW_TAG } from './HybridBaseView';
import { HybridWebView } from './HybridWebView';

export function createHybridView(viewTag: string, ctxId: string, nodeId: string, viewStatePtr: bigint): ComponentContent<HybridBaseView> | null {
  hilog.debug(0, HYBRID_VIEW_TAG, "createHybridView(viewTag:%{public}s,ctxId:%{public}s,nodeId:%{public}s)", viewTag, ctxId, nodeId);
  return HybridViewManager.getInstance().createArkTsView(viewTag, ctxId, nodeId, viewStatePtr);
}

export function updateHybridView(nodeId: string, updateStates: UpdateState[]) {
  hilog.debug(0, HYBRID_VIEW_TAG, "updateHybridView(nodeId:%{public}s,updateStatesLength:%{public}d)", nodeId, updateStates.length);
  HybridViewManager.getInstance().updateArkTsView(nodeId, updateStates);
}

export function destroyHybridView(nodeId: string) {
  hilog.debug(0, HYBRID_VIEW_TAG, "destroyHybridView(nodeId:%{public}s)", nodeId);
  HybridViewManager.getInstance().destroyArkTsView(nodeId);
}

export function onInvokeHybridView(nodeId: string, key: string, params: HybridInvokeCallback) {
  hilog.debug(0, HYBRID_VIEW_TAG, "onInvokeHybridView(nodeId:%{public}s,key:%{public}s,params:%{public}s)", nodeId, key, String(params));
  HybridViewManager.getInstance().onInvokeArkTsView(nodeId, key, params);
}

export class HybridViewManager {
  private static viewManagerInstance: HybridViewManager;

  private viewCreatorRegistry = new Map<string, HybridViewCreator>();
  private hybridViews = new Map<string, HybridBaseView>();

  private constructor() {
  }

  public static getInstance(): HybridViewManager {
    if (!HybridViewManager.viewManagerInstance) {
      HybridViewManager.viewManagerInstance = new HybridViewManager();
    }
    return HybridViewManager.viewManagerInstance;
  }

  /**
   * Registers an ArkTS-side view factory.
   * @param viewTag View tag
   * @param viewCreator View factory
   */
  public registerViewCreator(viewTag: string, viewCreator: HybridViewCreator) {
    this.viewCreatorRegistry.set(viewTag, viewCreator);
  }

  public unregisterViewCreator(viewTag: string) {
    this.viewCreatorRegistry.delete(viewTag);
  }

  public hasViewCreator(viewTag: string): boolean {
    return this.viewCreatorRegistry.has(viewTag);
  }

  /**
   * Creates an ArkTS view.
   * @param viewTag View tag
   * @param ctxId Context ID
   * @param nodeId Node ID
   * @param viewStatePtr Pointer to the matching C++ ViewState
   * @return ComponentContent
   */
  public createArkTsView(viewTag: string, ctxId: string, nodeId: string, viewStatePtr: bigint): ComponentContent<HybridBaseView> | null {
    let hybridView: HybridBaseView | null = null;
    switch (viewTag) {
      case 'Web': { // Built-in Web component
        hybridView = new HybridWebView(viewTag, ctxId, nodeId, viewStatePtr);
      }
        break;
    }
    if (hybridView === null) {
      let creator: HybridViewCreator | undefined = this.viewCreatorRegistry.get(viewTag);
      if (creator) {
        hybridView = creator(ctxId, nodeId, viewTag, viewStatePtr);
      }
    }
    if (hybridView) {
      let componentContent = hybridView.toCreateArkUIView();
      if (componentContent === null) {
        hilog.error(0, HYBRID_VIEW_TAG, "createArkTsView failed: toCreateArkUIView returned null for viewTag:%{public}s,nodeId:%{public}s", viewTag, nodeId);
        return null;
      }
      this.hybridViews.set(nodeId, hybridView);
      return componentContent;
    }
    hilog.debug(0, HYBRID_VIEW_TAG, "createHybridView(viewTag:%{public}s,ctxId:%{public}d,nodeId:%{public}d) is failed!!!", viewTag.toString(), ctxId, nodeId);
    return null;
  }

  /**
   * Updates ArkTS view properties.
   * @param nodeId Node ID
   * @param updateStates Collection of property update states
   */
  public updateArkTsView(nodeId: string, updateStates: UpdateState[]) {
    let view: HybridBaseView | undefined = this.hybridViews.get(nodeId);
    if (view) {
      view.toUpdateArkTsView(updateStates);
    }
  }

  /**
   * Destroys an ArkTS view.
   * @param nodeId Node ID
   */
  public destroyArkTsView(nodeId: string) {
    let view: HybridBaseView | undefined = this.hybridViews.get(nodeId);
    if (view) {
      view.toDestroyArkTsView();
      this.hybridViews.delete(nodeId);
    }
  }

  /**
   * Invokes an ArkTS view event.
   * @param nodeId Node ID
   * @param key Event key
   * @param params Event parameters
   */
  public onInvokeArkTsView(nodeId: string, key: string, params: HybridInvokeCallback) {
    let view: HybridBaseView | undefined = this.hybridViews.get(nodeId);
    if (view) {
        view.toInvokeArkTsView(key, params);
    }
  }

}
