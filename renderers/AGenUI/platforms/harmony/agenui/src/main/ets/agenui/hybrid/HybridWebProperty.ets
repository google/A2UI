/*
 * HybridWebProperty
 * Property manager for the Web component.
 */

import { BaseProperty } from './HybridBaseProperty';
import { HybridWebView } from './HybridWebView';
import { hilog } from '@kit.PerformanceAnalysisKit';

export class HybridWebProperty extends BaseProperty<HybridWebView> {
  // Attribute constants
  static readonly ATTRIBUTE_SOURCE = 'source';
  static readonly ATTRIBUTE_WEB_HEIGHT = 'height';
  static readonly ATTRIBUTE_MIN_HEIGHT = 'min-height';
  static readonly ATTRIBUTE_MAX_HEIGHT = 'max-height';

  // Event constants
  static readonly EVENT_LOAD_FINISH = 'loadfinish';
  static readonly EVENT_LOAD_ERROR = 'loaderror';
  static readonly EVENT_PAGE_START = 'pagestart';

  // Attribute fields
  source: string = '';
  height: number = 0;
  minHeight: number = 0;
  maxHeight: number = 0;

  constructor(view: HybridWebView) {
    super(view);
  }

  updateAttribute(attrMap: Map<string, string>): void {
    attrMap.forEach((value: string, key: string) => {
      this.handleAttribute(key, value);
    });
  }

  private handleAttribute(key: string, value: string): void {
    switch (key) {
      case HybridWebProperty.ATTRIBUTE_SOURCE:
        this.handleNormal_source(value);
        break;
      case HybridWebProperty.ATTRIBUTE_WEB_HEIGHT:
        this.handleNormal_height(value);
        break;
      case HybridWebProperty.ATTRIBUTE_MIN_HEIGHT:
        this.handleNormal_minHeight(value);
        break;
      case HybridWebProperty.ATTRIBUTE_MAX_HEIGHT:
        this.handleNormal_maxHeight(value);
        break;
      case HybridWebProperty.EVENT_LOAD_FINISH:
        this.handleEvent_loadfinish(value);
        break;
      case HybridWebProperty.EVENT_LOAD_ERROR:
        this.handleEvent_loaderror(value);
        break;
      case HybridWebProperty.EVENT_PAGE_START:
        this.handleEvent_pagestart(value);
        break;
      default:
        break;
    }
  }

  handleNormal_source(source: string): void {
    this.source = source;
    (this.myView as HybridWebView).loadWebSource(source);
  }

  handleNormal_height(height: string): void {
    try {
      this.height = parseFloat(height);
      (this.myView as HybridWebView).updateStyles();
    } catch (e) {
      hilog.error(0, 'HybridWeb', 'handleNormal_height error: %{public}s', e.message);
    }
  }

  handleNormal_minHeight(minHeight: string): void {
    try {
      this.minHeight = parseFloat(minHeight);
      (this.myView as HybridWebView).updateStyles();
    } catch (e) {
      hilog.error(0, 'HybridWeb', 'handleNormal_minHeight error: %{public}s', e.message);
    }
  }

  handleNormal_maxHeight(maxHeight: string): void {
    try {
      this.maxHeight = parseFloat(maxHeight);
      (this.myView as HybridWebView).updateStyles();
    } catch (e) {
      hilog.error(0, 'HybridWeb', 'handleNormal_maxHeight error: %{public}s', e.message);
    }
  }

  handleEvent_loadfinish(value: string): void {
    hilog.debug(0, 'HybridWeb', 'handleEvent_loadfinish: %{public}s', value);
  }

  handleEvent_loaderror(value: string): void {
    hilog.error(0, 'HybridWeb', 'handleEvent_loaderror: %{public}s', value);
  }

  handleEvent_pagestart(value: string): void {
    hilog.debug(0, 'HybridWeb', 'handleEvent_pagestart: %{public}s', value);
  }
}
