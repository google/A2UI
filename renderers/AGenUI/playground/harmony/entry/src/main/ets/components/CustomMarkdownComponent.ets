/*
 * CustomMarkdownComponent
 * Custom Markdown rendering component
 * Implemented with @luvi/lv-markdown-in.
 */

import { A2UIComponent, A2UIComponentProps, CustomView } from '@agenui/agenui';
import { Markdown, MarkdownController } from '@luvi/lv-markdown-in';
import { hilog } from '@kit.PerformanceAnalysisKit';
import fs from '@ohos.file.fs';
import display from '@ohos.display';

@Builder
function buildCustomMarkdown(view: CustomView): void {
  Scroll() {
    Column() {
      Markdown({
        controller: (view as CustomMarkdownComponent).controller,
        context: (view as CustomMarkdownComponent).mdContext,
        mode: (view as CustomMarkdownComponent).loadMode,
        text: (view as CustomMarkdownComponent).markdownContent,
        rawfilePath: (view as CustomMarkdownComponent).rawfilePath
      })
    }
    .width('100%')
    .height(undefined)
    .onSizeChange((_oldValue: SizeOptions, newValue: SizeOptions) => {
      const newH: number = newValue.height as number;
      if (newH < 0) {
        return;
      }
      const mdView = view as CustomMarkdownComponent;
      if (mdView.sizeReported) {
        return;
      }
      mdView.sizeReported = true;

      const yogaHeight: number = view.getProperty().getViewHeight();
      let capHeight: number;
      if (yogaHeight > 0) {
        capHeight = yogaHeight;
      } else {
        try {
          const d: display.Display = display.getDefaultDisplaySync();
          capHeight = d.height / d.densityPixels;
        } catch (_e) {
          capHeight = 0;
        }
      }
      const reportH: number = (capHeight > 0 && newH > capHeight) ? capHeight : newH;
      const reportW: number = newValue.width as number;
      (mdView as A2UIComponent).reportContentHeight(reportH, reportW);
    })
  }
  .width(view.getProperty().getViewWidth() <= 0 ? '100%' : view.getProperty().getViewWidth())
  .height(view.getProperty().getViewHeight() <= 0 ? undefined : view.getProperty().getViewHeight())
  .scrollBar(BarState.Off)
  .edgeEffect(EdgeEffect.None)
}

export class CustomMarkdownComponent extends A2UIComponent {
  controller: MarkdownController = new MarkdownController();
  markdownContent: string = '';
  rawfilePath: string = '';
  loadMode: "text" | "rawfile" | "sandbox" = 'text';
  sizeReported: boolean = false;
  public mdContext: Context | undefined = undefined;
  private isLoading: boolean = false;

  // Style state
  private textColor: string = '#000000';
  private fontSize: number = 16;
  private lineHeight: number = 24;
  private linkColor: string = '#0066CC';
  private codeBgColor: string = '#F5F5F5';
  private codeTextColor: string = '#333333';
  private quoteBgColor: string = '#F9F9F9';
  private quoteBorderColor: string = '#DDDDDD';

  // Previously applied content/src values used for change detection
  private lastContent: string = '';
  private lastSrc: string = '';

  constructor(surfaceId: string, nodeId: string, componentType: string, viewStatePtr: bigint) {
    super(surfaceId, nodeId, componentType, viewStatePtr, wrapBuilder<[CustomView]>(buildCustomMarkdown));
    this.mdContext = this.getUIContext()?.getHostContext() as Context;
  }

  onUpdateViewFinished(): void {
    this.updateArkUI();
  }

  protected onUpdateProperties(properties: A2UIComponentProps): void {
    let stylesChanged = false;

    const textColor = properties['textColor'] as string | undefined;
    if (textColor !== undefined && textColor !== this.textColor) {
      this.textColor = textColor;
      stylesChanged = true;
    }

    const fontSize = properties['fontSize'];
    if (fontSize !== undefined) {
      const val = typeof fontSize === 'number' ? fontSize : parseFloat(fontSize as string);
      if (!isNaN(val) && val !== this.fontSize) {
        this.fontSize = val;
        stylesChanged = true;
      }
    }

    const lineHeight = properties['lineHeight'];
    if (lineHeight !== undefined) {
      const val = typeof lineHeight === 'number' ? lineHeight : parseFloat(lineHeight as string);
      if (!isNaN(val) && val !== this.lineHeight) {
        this.lineHeight = val;
        stylesChanged = true;
      }
    }

    const linkColor = properties['linkColor'] as string | undefined;
    if (linkColor !== undefined && linkColor !== this.linkColor) {
      this.linkColor = linkColor;
      stylesChanged = true;
    }

    const codeBgColor = properties['codeBgColor'] as string | undefined;
    if (codeBgColor !== undefined && codeBgColor !== this.codeBgColor) {
      this.codeBgColor = codeBgColor;
      stylesChanged = true;
    }

    const codeTextColor = properties['codeTextColor'] as string | undefined;
    if (codeTextColor !== undefined && codeTextColor !== this.codeTextColor) {
      this.codeTextColor = codeTextColor;
      stylesChanged = true;
    }

    const quoteBgColor = properties['quoteBgColor'] as string | undefined;
    if (quoteBgColor !== undefined && quoteBgColor !== this.quoteBgColor) {
      this.quoteBgColor = quoteBgColor;
      stylesChanged = true;
    }

    const quoteBorderColor = properties['quoteBorderColor'] as string | undefined;
    if (quoteBorderColor !== undefined && quoteBorderColor !== this.quoteBorderColor) {
      this.quoteBorderColor = quoteBorderColor;
      stylesChanged = true;
    }

    if (stylesChanged) {
      this.initController();
    }

    // Extract content properties, preferring `content` over `src`.
    const content = properties['content'] as string | undefined;
    if (content !== undefined && content !== this.lastContent) {
      this.lastContent = content;
      this.loadMarkdownContent(content);
      return;
    }

    const src = properties['src'] as string | undefined;
    if (src !== undefined && src !== this.lastSrc) {
      this.lastSrc = src;
      if (src.startsWith('rawfile/') || !src.startsWith('/')) {
        const rawfilePath: string = src.startsWith('rawfile/') ? src.substring(8) : src;
        this.loadMarkdownFromRawfile(rawfilePath);
      } else {
        this.loadMarkdownFromFile(src);
      }
    }
  }

  private initController(): void {
    if (this.textColor) {
      this.controller.setTextColor(this.textColor);
    }
    if (this.fontSize > 0) {
      this.controller.setTextSize(this.fontSize);
    }
    if (this.lineHeight > 0) {
      this.controller.setTextLineHeight(this.lineHeight);
    }
    if (this.linkColor) {
      this.controller.setHyperlinkTextColor(this.linkColor);
    }
    if (this.codeBgColor || this.codeTextColor) {
      this.controller.setCodeBlockTheme('light');
    }
    if (this.quoteBgColor) {
      this.controller.setQuoteBackgroundColor(this.quoteBgColor);
    }
    if (this.quoteBorderColor) {
      this.controller.setQuoteBorderColor(this.quoteBorderColor);
    }
    this.controller.setHyperlinkClickListener((_title: string, _url: string) => {
      hilog.debug(0, 'CustomMarkdown', 'linkClick: %{public}s', _url);
      return true;
    });
  }

  public loadMarkdownContent(content: string): void {
    if (this.isLoading) {
      return;
    }
    try {
      this.isLoading = true;
      this.loadMode = 'text';
      this.markdownContent = content;
      this.sizeReported = false;
      this.rawfilePath = '';
      this.initController();
      this.updateArkUI();
    } catch (e) {
      hilog.error(0, 'CustomMarkdown', 'loadMarkdownContent error: %{public}s', (e as Error).message);
    } finally {
      this.isLoading = false;
    }
  }

  public loadMarkdownFromRawfile(rawfilePath: string): void {
    if (this.isLoading) {
      return;
    }
    try {
      this.isLoading = true;
      this.loadMode = 'rawfile';
      this.rawfilePath = rawfilePath;
      this.markdownContent = '';
      this.sizeReported = false;
      this.initController();
      this.updateArkUI();
    } catch (e) {
      hilog.error(0, 'CustomMarkdown', 'loadMarkdownFromRawfile error: %{public}s', (e as Error).message);
    } finally {
      this.isLoading = false;
    }
  }

  public loadMarkdownFromFile(filePath: string): void {
    if (this.isLoading) {
      return;
    }
    try {
      this.isLoading = true;
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }
      const content: string = fs.readTextSync(filePath);
      this.loadMode = 'text';
      this.markdownContent = content;
      this.rawfilePath = '';
      this.sizeReported = false;
      this.initController();
      this.updateArkUI();
    } catch (e) {
      hilog.error(0, 'CustomMarkdown', 'loadMarkdownFromFile error: %{public}s', (e as Error).message);
    } finally {
      this.isLoading = false;
    }
  }

  onDestroy(): void {
    this.markdownContent = '';
    this.rawfilePath = '';
    this.loadMode = 'text';
  }
}
