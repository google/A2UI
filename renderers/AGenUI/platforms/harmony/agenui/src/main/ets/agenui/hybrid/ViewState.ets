import { Keys, FillMode } from './HybridPropertyKeyDefine';
import nativeModule from 'liba2ui-capi.so';

export enum UpdateType {
  Layout,
  Padding,
  ContentSize,
  AttributeChanged,
  AttributeRemoved,
  NormalPropertyChanged,
  HoverPropertyChanged,
  NormalPropertyRemoved,
  HoverPropertyRemoved
}

export enum PseudoClass {
  Normal,
  Hover,
};

export enum StyleItemType {
  invalid = 0,
  bool = 1,
  int = 2,
  float = 3,
  FontWeight = 4,
  FontStyle = 5,
  TextAlign = 6,
  TextOverflow = 7,
  FillMode = 8,
  Orientation = 9,
  LineHeight = 10,
  Direction4 = 11,
  Transform = 12,
  TransformOrigin = 13,
  BackdropFilter = 14,
  ColorX = 15,
  string = 16,
  Filter = 17
}

export class StyleItem {
  type: StyleItemType = StyleItemType.invalid;
  fillMode: FillMode = FillMode.FillMode_contain;
}

export interface UpdateState {
  property?: number,
  attribute?: string,
  type: UpdateType
}

export class ViewState {
  private readonly ptr: bigint;

  constructor(p: bigint) {
    this.ptr = p;
  }

  getAttribute(key: string): string {
    if (this.ptr != BigInt(0)) {
      return nativeModule.hybridFactoryGetAttribute(this.ptr, key);
    }
    return "";
  }

  getPropertiesJson(): string {
    if (this.ptr != BigInt(0)) {
      return nativeModule.hybridFactoryGetPropertiesJson(this.ptr);
    }
    return '{}';
  }

  // NOTE: Per-property style readback (e.g. fill-mode) is not yet wired to native.
  // Until the native side exposes a typed property reader, getProperty() returns
  // a default StyleItem and downstream style dispatch in HybridBaseProperty is a no-op.
  // Custom components should read styles via the JSON snapshot from getPropertiesJson() instead.
  getProperty(cls: PseudoClass, key: number): StyleItem {
    return new StyleItem();
  }

}
