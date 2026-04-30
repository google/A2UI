import { BaseProperty } from '../hybrid/HybridBaseProperty';
import { HybridBaseView } from '../hybrid/HybridBaseView';
import { UpdateState, ViewState } from '../hybrid/ViewState';
import nativeModule from 'liba2ui-capi.so';

/**
 * Type alias for user-defined @Builder parameters that hides the internal
 * HybridBaseView implementation.
 */
export type CustomView = HybridBaseView;

export type A2UIComponentProps =
  Record<string, Object | string | number | boolean | Array<Object>>;

export type IComponentFactory = (
  surfaceId: string,
  nodeId: string,
  componentType: string,
  viewStatePtr: bigint
) => A2UIComponent;

class A2UIComponentProperty extends BaseProperty<A2UIComponent> {
  updateAttribute(_attrMap: Map<string, string>) {
  }
}

export abstract class A2UIComponent extends HybridBaseView {
  private _builder: WrappedBuilder<[HybridBaseView]>;
  protected customSurfaceId: string;
  protected customNodeId: string;
  protected customComponentType: string;
  protected properties: A2UIComponentProps = {};
  protected childIds: string[] = [];

  /**
   * @param surfaceId Surface ID
   * @param nodeId Node ID
   * @param componentType Component type name
   * @param viewStatePtr C++ ViewState pointer
   * @param builder Builder wrapped by wrapBuilder() that defines the visual template
   */
  constructor(surfaceId: string, nodeId: string, componentType: string,
              viewStatePtr: bigint, builder: WrappedBuilder<[CustomView]>) {
    super(componentType, surfaceId, nodeId, viewStatePtr);
    this._builder = builder;
    this.customSurfaceId = surfaceId;
    this.customNodeId = nodeId;
    this.customComponentType = componentType;
  }

  createProperty(): BaseProperty<HybridBaseView> {
    return new A2UIComponentProperty(this);
  }

  /**
   * Implemented by the base class. Subclasses should not override it.
   */
  getWrapBuilder(): WrappedBuilder<[HybridBaseView]> {
    return this._builder;
  }

  public getSurfaceId(): string {
    return this.customSurfaceId;
  }

  public getNodeId(): string {
    return this.customNodeId;
  }

  public getComponentType(): string {
    return this.customComponentType;
  }

  public getProperties(): A2UIComponentProps {
    return this.properties;
  }

  public getProp<T>(key: string): T | undefined {
    return this.properties[key] as T | undefined;
  }

  public getLayoutWidth(): number {
    return this.getProperty().getViewWidth();
  }

  public getLayoutHeight(): number {
    return this.getProperty().getViewHeight();
  }

  public updateProperties(properties: A2UIComponentProps): void {
    this.properties = properties;
    this.onUpdateProperties(properties);
  }

  public addChild(childId: string): void {
    if (!this.childIds.includes(childId)) {
      this.childIds.push(childId);
    }
  }

  public removeChild(childId: string): void {
    this.childIds = this.childIds.filter((id: string) => id !== childId);
  }

  public shouldAutoAddChildView(): boolean {
    return false;
  }

  public toUpdateArkTsView(updateStates: UpdateState[]): boolean {
    if (!this.getViewStatePtr()) {
      return false;
    }

    this.getProperty().updateAttrsAndStyles(this.getViewStatePtr(), updateStates);
    this.refreshPropertiesFromNative();
    this.onUpdateProperties(this.properties);
    this.updateArkUI();
    this.onUpdateViewFinished();
    return true;
  }

  protected refreshPropertiesFromNative(): void {
    const state = new ViewState(this.getViewStatePtr());
    const raw = state.getPropertiesJson();
    if (!raw || raw.length === 0) {
      this.properties = {};
      return;
    }
    try {
      this.properties = JSON.parse(raw) as A2UIComponentProps;
    } catch (_error) {
      this.properties = {};
    }
  }

  protected abstract onUpdateProperties(properties: A2UIComponentProps): void;

  /**
   * Reports the actual rendered content height to C++.
   * Useful for custom components such as Markdown and Web whose height
   * depends on rendered content.
   * @param height Content height in vp
   * @param width Content width in vp
   */
  public reportContentHeight(height: number, width: number): void {
    if (!this.getViewStatePtr()) {
      return;
    }
    nativeModule.reportComponentRenderSize(
      this.getContextId(), this.getNodeId(), this.customComponentType,
      height, width, this.getViewStatePtr()
    );
  }
}
