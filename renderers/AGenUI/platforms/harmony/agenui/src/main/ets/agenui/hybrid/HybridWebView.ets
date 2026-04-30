/*
 * HybridWebView
 * Web rendering component
 * Implemented with the declarative ArkUI Web() component and connected to C++ through the hybrid bridge.
 */

import { HybridBaseView } from './HybridBaseView';
import { HybridWebProperty } from './HybridWebProperty';
import { BaseProperty } from './HybridBaseProperty';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { webview } from '@kit.ArkWeb';
import nativeModule from 'liba2ui-capi.so';
import display from '@ohos.display';

const TAG = 'HybridWeb';

@Builder
function buildView(view: HybridBaseView): void {
  Stack() {
    if ((view as HybridWebView).isUrl) {
      Web({
        src: (view as HybridWebView).webSource,
        controller: (view as HybridWebView).controller
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .onPageEnd(() => {
          // URL mode: read scrollHeight after the page finishes loading.
          const webView = view as HybridWebView;
          try {
            webView.controller.runJavaScript('document.body.scrollHeight')
              .then((result: string) => {
                const scrollHeight = parseFloat(result);
                hilog.info(0, TAG, 'onPageEnd URL: nodeId=%{public}s, scrollHeight=%{public}f',
                  view.getNodeId(), scrollHeight);
                webView.handleRenderComplete(scrollHeight);
              })
              .catch((error: Error) => {
                hilog.error(0, TAG, 'runJavaScript failed: %{public}s', error.message);
              });
          } catch (e) {
            hilog.error(0, TAG, 'onPageEnd URL error: %{public}s', JSON.stringify(e));
          }
        })
        .onErrorReceive((event) => {
          hilog.error(0, TAG, 'onErrorReceive: %{public}s', JSON.stringify(event));
          (view as HybridWebView).handleLoadError(event?.error?.getErrorInfo() ?? 'unknown error');
        })
    } else {
      // HTML mode: load about:blank first, then inject HTML after onPageEnd.
      Web({
        src: 'about:blank',
        controller: (view as HybridWebView).controller
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .onPageEnd(() => {
          const webView = view as HybridWebView;
          if (!webView.htmlLoaded) {
            // First onPageEnd: about:blank finished loading, so inject the HTML.
            webView.htmlLoaded = true;
            try {
              webView.controller.loadData(webView.webSource, 'text/html', 'UTF-8');
            } catch (e) {
              hilog.warn(0, TAG, 'loadData failed: %{public}s', JSON.stringify(e));
            }
          } else {
            // Second onPageEnd: HTML finished loading, so read scrollHeight.
            setTimeout(() => {
              try {
                webView.controller.runJavaScript('document.body.scrollHeight')
                  .then((result: string) => {
                    const scrollHeight = parseFloat(result);
                    hilog.info(0, TAG, 'onPageEnd HTML: nodeId=%{public}s, scrollHeight=%{public}f',
                      view.getNodeId(), scrollHeight);
                    webView.handleRenderComplete(scrollHeight);
                  })
                  .catch((error: Error) => {
                    hilog.error(0, TAG, 'runJavaScript failed: %{public}s', error.message);
                  });
              } catch (e) {
                hilog.error(0, TAG, 'onPageEnd HTML error: %{public}s', JSON.stringify(e));
              }
            }, 100);
          }
        })
        .onErrorReceive((event) => {
          hilog.error(0, TAG, 'onErrorReceive: %{public}s', JSON.stringify(event));
          (view as HybridWebView).handleLoadError(event?.error?.getErrorInfo() ?? 'unknown error');
        })
    }
  }
  .width(view.getProperty().getViewWidth() <= 0 ? '100%' : view.getProperty().getViewWidth())
  .height(view.getProperty().getViewHeight() <= 0 ? 300 : view.getProperty().getViewHeight())
}

export class HybridWebView extends HybridBaseView {
  controller: webview.WebviewController = new webview.WebviewController();
  webSource: string = '';
  isUrl: boolean = false;
  htmlLoaded: boolean = false;

  createProperty(): BaseProperty<HybridBaseView> {
    return new HybridWebProperty(this);
  }

  getWrapBuilder(): WrappedBuilder<[HybridBaseView]> {
    return wrapBuilder<[HybridBaseView]>(buildView);
  }

  onUpdateViewFinished(): void {
    this.updateArkUI();
  }

  /**
   * Loads Web content.
   * @param source URL (http/https) or HTML string
   */
  public loadWebSource(source: string): void {
    if (!source || source === this.webSource) {
      return;
    }

    try {
      this.webSource = source;
      this.isUrl = source.startsWith('http://') || source.startsWith('https://');
      this.htmlLoaded = false;

      hilog.info(0, TAG, 'loadWebSource: nodeId=%{public}s, isUrl=%{public}s, source=%{public}s',
        this.getNodeId(), this.isUrl.toString(), source.substring(0, 80));

      // Reset the controller so buildView rebuilds Web with the new source.
      this.controller = new webview.WebviewController();
      this.updateArkUI();
    } catch (e) {
      hilog.error(0, TAG, 'loadWebSource error: %{public}s', JSON.stringify(e));
      this.handleLoadError(e.message);
    }
  }

  /**
   * Refreshes style settings after height, min-height, or max-height changes.
   */
  public updateStyles(): void {
    this.updateArkUI();
    hilog.debug(0, TAG, 'updateStyles: nodeId=%{public}s', this.getNodeId());
  }

  /**
   * Reports the rendered Web height to C++.
   * @param scrollHeight document.body.scrollHeight in vp
   */
  public handleRenderComplete(scrollHeight: number): void {
    const property = this.getProperty() as HybridWebProperty;

    // Read configured height constraints.
    const configuredHeight = property.height;   // Explicit height property
    const yogaHeight = property.getViewHeight(); // Height reported back by Yoga (__height__)
    const minH = property.minHeight;
    const maxH = property.maxHeight;

    let finalH = scrollHeight;

    // Apply the min-height constraint.
    if (minH > 0 && finalH < minH) {
      finalH = minH;
    }
    // Apply the max-height constraint.
    if (maxH > 0 && finalH > maxH) {
      finalH = maxH;
    }
    // Honor the explicit height if it is set, clamped by min/max.
    if (configuredHeight > 0) {
      finalH = configuredHeight;
      if (minH > 0 && finalH < minH) finalH = minH;
      if (maxH > 0 && finalH > maxH) finalH = maxH;
    }
    // Use the Yoga-reported __height__ as a fallback upper bound, matching Markdown behavior.
    if (yogaHeight > 0 && finalH > yogaHeight && configuredHeight <= 0) {
      finalH = yogaHeight;
    }

    // Fallback to the screen height as an upper bound.
    if (configuredHeight <= 0) {
      try {
        const d = display.getDefaultDisplaySync();
        const screenH = d.height / d.densityPixels;
        if (screenH > 0 && finalH > screenH) {
          finalH = screenH;
        }
      } catch (_) {}
    }

    hilog.info(0, TAG, 'handleRenderComplete: nodeId=%{public}s, scrollH=%{public}f, finalH=%{public}f',
      this.getNodeId(), scrollHeight, finalH);

    // Report rendered size to C++ through reportComponentRenderSize using the shared NAPI entry point.
    nativeModule.reportComponentRenderSize(
      this.getContextId(), this.getNodeId(), 'Web',
      finalH,
      property.getViewWidth() > 0 ? property.getViewWidth() : 0,
      this.getViewStatePtr()
    );
  }

  /**
   * Handles load failures.
   * @param error Error message
   */
  public handleLoadError(error: string): void {
    hilog.error(0, TAG, 'handleLoadError: nodeId=%{public}s, error=%{public}s', this.getNodeId(), error);
  }

  /**
   * Releases resources.
   */
  onDestroy(): void {
    this.webSource = '';
    hilog.debug(0, TAG, 'onDestroy: nodeId=%{public}s', this.getNodeId());
  }
}
