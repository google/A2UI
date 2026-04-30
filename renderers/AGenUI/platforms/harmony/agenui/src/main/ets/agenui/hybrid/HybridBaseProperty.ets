import { PseudoClass, StyleItem, UpdateState, UpdateType, ViewState } from './ViewState';
import { HybridBaseView, HYBRID_VIEW_TAG } from './HybridBaseView';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { Keys, FillMode } from './HybridPropertyKeyDefine';

export abstract class BaseProperty<T extends HybridBaseView> {
  protected myView: T;
  private viewWidth: number = 0; // Unit: vp
  private viewHeight: number = 0; // Unit: vp

  public fillMode: string = 'Contain';
  static readonly ATTRIBUTE_WIDTH = '__width__';
  static readonly ATTRIBUTE_HEIGHT = '__height__';

  constructor(view: T) {
    this.myView = view;
  }

  /**
   * Updates attributes. Subclasses provide the business-specific handling.
   */
  abstract updateAttribute(attrMap: Map<string, string>);

  /**
   * Sets the view size.
   */
  setViewSize(width: number, height: number): void {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  setViewWidth(width: number): void {
    this.viewWidth = width;
  }

  setViewHeight(height: number): void {
    this.viewHeight = height;
  }

  getViewWidth(): number {
    return this.viewWidth;
  }

  getViewHeight(): number {
    return this.viewHeight;
  }

  public updateAttrsAndStyles(viewStatePtr: bigint, updateStates: UpdateState[]) {
    // Convert updates into attribute and style maps.
    const result = this.convertStatesToMap(viewStatePtr, updateStates);
    let attrMap = result[0]; // Attributes
    let styleMap = result[1]; // Styles

    // Apply attribute updates.
    this.updateViewSize(attrMap);
    this.updateAttribute(attrMap);

    // Apply style updates.
    this.updateStyle(styleMap);
  }

  /**
   * Updates styles.
   */
  protected updateStyle(styleMap: Map<number, StyleItem>) {
    styleMap.forEach((value, key) => {
      switch (key) {
        case Keys.NODE_PROPERTY_BACKGROUND_COLOR:
          this.handleStyle_background_color(value.toString());
          break;
        case Keys.NODE_PROPERTY_BORDER_COLOR:
          this.handleStyle_border_color(value.toString());
          break;
        case Keys.NODE_PROPERTY_BORDER_WIDTH:
          this.handleStyle_border_width(value.toString());
          break;
        case Keys.NODE_PROPERTY_BORDER_STYLE:
          this.handleStyle_border_style(value.toString());
          break;
        case Keys.NODE_PROPERTY_BORDER_RADIUS:
          this.handleStyle_border_radius(value.toString());
          break;
        case Keys.NODE_PROPERTY_OPACITY:
          this.handleStyle_opacity(value.toString());
          break;
        case Keys.NODE_PROPERTY_VISIBILITY:
          this.handleStyle_visibility(value.toString());
          break;
        case Keys.NODE_PROPERTY_DISPLAY:
          this.handleStyle_display(value.toString());
          break;
        case Keys.NODE_PROPERTY_LEFT:
          this.handleStyle_left(value.toString());
          break;
        case Keys.NODE_PROPERTY_TOP:
          this.handleStyle_top(value.toString());
          break;
        case Keys.NODE_PROPERTY_RIGHT:
          this.handleStyle_right(value.toString());
          break;
        case Keys.NODE_PROPERTY_BOTTOM:
          this.handleStyle_bottom(value.toString());
          break;
        case Keys.NODE_PROPERTY_WIDTH:
          this.handleStyle_width(value.toString());
          break;
        case Keys.NODE_PROPERTY_HEIGHT:
          this.handleStyle_height(value.toString());
          break;
        case Keys.NODE_PROPERTY_FILL_MODE:
          this.handleStyle_fill_mode(value.fillMode);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Updates the view size.
   */
  private updateViewSize(attrMap: Map<string, string>) {
    attrMap.forEach((value, key) => {
      switch (key) {
        case BaseProperty.ATTRIBUTE_WIDTH:
          this.setViewWidth(parseFloat(value));
          break;
        case BaseProperty.ATTRIBUTE_HEIGHT:
          this.setViewHeight(parseFloat(value));
          break;
      }
    });
  }

  private convertStatesToMap(viewStatePtr: bigint,
    updateStates: UpdateState[]): [Map<string, string>, Map<number, StyleItem>] {
    hilog.debug(1, HYBRID_VIEW_TAG, "updateArkTsProperty viewTag:%{public}s,nodeId:%{public}d start=========>",
      this.myView.getViewTag(), this.myView.getNodeId());
    let attributeMap: Map<string, string> = new Map();
    let styleMap: Map<number, StyleItem> = new Map();
    let vstate = new ViewState(viewStatePtr);
    for (const stateValue of updateStates) {
      switch (stateValue.type) {
        case UpdateType.Layout:
          this.myView.updateArkUI();
          break;
        case UpdateType.AttributeChanged:
        case UpdateType.AttributeRemoved: { // Attribute change or removal
          let propKey = stateValue.attribute;
          if (propKey) {
            let propValue = vstate.getAttribute(propKey);
            hilog.debug(1, HYBRID_VIEW_TAG, "attribute[%{public}s]", "key:" + propKey + ",value:" + propValue);
            attributeMap.set(propKey, propValue);
          }
        }
          break;
        case UpdateType.NormalPropertyChanged:
        case UpdateType.NormalPropertyRemoved: { // Normal style change or removal
          let styleKey = stateValue.property ?? 0;
          if (styleKey !== 0) {
            let styleValue = vstate.getProperty(PseudoClass.Normal, styleKey);
            hilog.debug(1, HYBRID_VIEW_TAG, "style[%{public}s]",
              "normal_key:" + styleKey + ",value:" + styleValue.type);
            if (styleValue != null) {
              styleMap.set(styleKey, styleValue);
            }
          }
        }
          break;
        case UpdateType.HoverPropertyChanged:
        case UpdateType.HoverPropertyRemoved: { // Hover style change or removal
          let styleKey = stateValue.property ?? 0;
          if (styleKey !== 0) {
            let styleValue = vstate.getProperty(PseudoClass.Hover, styleKey);
            hilog.debug(1, HYBRID_VIEW_TAG, "style[%{public}s]", "hover_key:" + styleKey + " value:" + styleValue.type);
            if (styleValue != null) {
              styleMap.set(styleKey, styleValue);
            }
          }
        }
          break;
      }
    }
    hilog.debug(1, HYBRID_VIEW_TAG, "updateArkTsProperty viewTag:%{public}s,nodeId:%{public}d end=========>",
      this.myView.getViewTag(), this.myView.getNodeId());
    return [attributeMap, styleMap];
  }

  handleStyle_background_color(background_color: string): void {
    // Handle background color styles.
  }

  handleStyle_background_image(background_image: string): void {
    // Handle background image styles.
  }

  handleStyle_background_stretch(background_stretch: string): void {
    // Handle background stretch styles.
  }

  handleStyle_border_color(border_color: string): void {
    // Handle border color styles.
  }

  handleStyle_border_width(border_width: string): void {
    // Handle border width styles.
  }

  handleStyle_border_style(border_style: string): void {
    // Handle border styles.
  }

  handleStyle_border_radius(border_radius: string): void {
    // Handle border radius styles.
  }

  handleStyle_transform(transform: string): void {
    // Handle transform styles.
  }

  handleStyle_transform_origin(transform_origin: string): void {
    // Handle transform-origin styles.
  }

  handleStyle_opacity(opacity: string): void {
    // Handle opacity styles.
  }

  handleStyle_visibility(visibility: string): void {
    // Handle visibility styles.
  }

  handleStyle_display(display: string): void {
    // Handle display styles.
  }

  handleStyle_left(left: string): void {
    // Handle left position styles.
  }

  handleStyle_top(top: string): void {
    // Handle top position styles.
  }

  handleStyle_right(right: string): void {
    // Handle right position styles.
  }

  handleStyle_bottom(bottom: string): void {
    // Handle bottom position styles.
  }

  handleStyle_width(width: string): void {
    // Handle width styles.
  }

  handleStyle_height(height: string): void {
    // Handle height styles.
  }

  handleStyle_fill_mode(fill_mode: number): void {
    // Handle fill-mode styles.
    switch (fill_mode) {
      case FillMode.FillMode_cover: {
        this.fillMode = 'Cover';
        break;
      }
      case FillMode.FillMode_adapt: {
        this.fillMode = 'Top'; // Adapt mode preserves the original aspect ratio and aligns to the top-left; no centering is applied.
        break;
      }
      case FillMode.FillMode_hundred_percent: {
        this.fillMode = 'Fill';
        break;
      }
      case FillMode.FillMode_contain: {
        this.fillMode = 'Contain';
        break;
      }
      default: {
        this.fillMode = 'Contain';
        break;
      }
    }
  }

}
