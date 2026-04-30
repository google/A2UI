import { A2UIComponent, A2UIComponentProps, CustomView } from '@agenui/agenui';
import { LottieController, LottieListener, LottieView } from '@ohos/lottie-turbo';
import { common } from '@kit.AbilityKit';
import { fileIo } from '@kit.CoreFileKit';
import { http } from '@kit.NetworkKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import fs from '@ohos.file.fs';

interface AnimationRange {
  startPos: number;
  endPos: number;
}

@Builder
function buildCustomLottie(view: CustomView): void {
  Stack() {
    if ((view as CustomLottieComponent).isSourceReady()) {
      LottieView({
        lottieId: (view as CustomLottieComponent).lottieId,
        loop: (view as CustomLottieComponent).loopValue,
        autoplay: (view as CustomLottieComponent).shouldAutoplay(),
        autoSkip: true,
        path: (view as CustomLottieComponent).sourcePath,
        contentMode: (view as CustomLottieComponent).contentMode,
        controller: (view as CustomLottieComponent).controller,
        listener: (view as CustomLottieComponent).listener,
        useCache: true,
        imagePath: (view as CustomLottieComponent).imagePath
      })
        .width('100%')
        .height('100%')
    } else {
      Column()
        .width('100%')
        .height('100%')
    }
  }
  .width(view.getProperty().getViewWidth() <= 0 ? 200 : view.getProperty().getViewWidth())
  .height(view.getProperty().getViewHeight() <= 0 ? 200 : view.getProperty().getViewHeight())
  .onAppear(() => {
    (view as CustomLottieComponent).onHostAppear();
  })
}

export class CustomLottieComponent extends A2UIComponent {
  public readonly controller: LottieController = new LottieController();
  public readonly listener: LottieListener;
  public readonly lottieId: string;

  public sourcePath: string = '';
  public imagePath: string = '';
  public contentMode: string = 'Contain';
  public loopValue: boolean | number = true;

  private currentStatus: string = '';
  private range: AnimationRange = { startPos: -1, endPos: -1 };
  private progressValue: number = -1;
  private loaded: boolean = false;
  private hasMountedSource: boolean = false;
  private viewAppeared: boolean = false;
  private sourceVersion: number = 0;
  private requestedSource: string = '';

  constructor(surfaceId: string, nodeId: string, componentType: string, viewStatePtr: bigint) {
    super(surfaceId, nodeId, componentType, viewStatePtr, wrapBuilder<[CustomView]>(buildCustomLottie));
    this.lottieId = `a2ui_lottie_${surfaceId}_${nodeId}`;
    this.controller.lottieId = this.lottieId;
    this.listener = new LottieListener({
      onDOMLoaded: () => {
        this.loaded = true;
        this.applyPendingPlayback();
      },
      onDataReady: () => {
        this.loaded = true;
        this.applyPendingPlayback();
      },
      onDestroy: () => {
        this.loaded = false;
      },
      onDataFailed: () => {
        this.loaded = false;
        hilog.error(0, 'CustomLottie', 'lottie data failed, source=%{public}s', this.sourcePath);
      }
    });
  }

  protected onUpdateProperties(properties: A2UIComponentProps): void {
    const nextContentMode = this.getProperty().fillMode;
    if (nextContentMode) {
      this.contentMode = nextContentMode;
    }

    const nextSourcePath = this.resolveSourcePath(properties);
    if (nextSourcePath !== this.requestedSource) {
      this.prepareSource(nextSourcePath);
    }

    const loopValue = this.parseLoopValue(properties['loop']);
    if (loopValue !== undefined) {
      this.loopValue = loopValue;
    }

    const status = this.getStringProperty(properties['status']);
    if (status !== undefined) {
      this.currentStatus = status;
    }

    const play = this.getStringProperty(properties['play']);
    if (play !== undefined) {
      try {
        this.range = JSON.parse(play) as AnimationRange;
      } catch (e) {
        hilog.error(0, 'CustomLottie', 'parse play error: %{public}s', this.getErrorMessage(e));
        this.range = { startPos: -1, endPos: -1 };
      }
    }

    const progress = this.parseNumberProperty(properties['progress']);
    if (progress !== undefined) {
      this.progressValue = progress;
    }

    if (properties['__destroy__'] !== undefined || this.currentStatus === 'destroy') {
      this.destroyAnimationResource();
      return;
    }

    if (!this.hasMountedSource && this.sourcePath.length > 0) {
      this.hasMountedSource = true;
    }

    if (this.loaded) {
      this.applyPendingPlayback();
    }
  }

  public onHostAppear(): void {
    this.viewAppeared = true;
    if (this.requestedSource.length === 0) {
      const initialSource = this.resolveSourcePath(this.getProperties());
      if (initialSource.length > 0) {
        this.prepareSource(initialSource);
        return;
      }
    }
    if (this.sourcePath.length > 0) {
      this.reloadAnimation();
    }
  }

  public isSourceReady(): boolean {
    return this.sourcePath.length > 0;
  }

  public shouldAutoplay(): boolean {
    const autoPlay = this.getBooleanProperty(this.getProp<boolean | string | number>('autoPlay'));
    if (autoPlay !== undefined) {
      return autoPlay;
    }

    const autoplay = this.getBooleanProperty(this.getProp<boolean | string | number>('autoplay'));
    if (autoplay !== undefined) {
      return autoplay;
    }

    if (this.progressValue >= 0 || this.hasValidRange()) {
      return false;
    }

    return this.currentStatus.length === 0 || this.currentStatus === 'play' || this.currentStatus === 'resume';
  }

  private reloadAnimation(): void {
    if (this.sourcePath.length === 0) {
      return;
    }
    try {
      hilog.info(0, 'CustomLottie', 'reloadAnimation source=%{public}s', this.sourcePath);
      this.controller.reload({
        path: this.sourcePath,
        loop: this.loopValue,
        autoplay: this.shouldAutoplay(),
        contentMode: this.contentMode,
        imagePath: this.imagePath
      });
    } catch (e) {
      hilog.error(0, 'CustomLottie', 'reloadAnimation error: %{public}s', this.getErrorMessage(e));
    }
  }

  private applyPendingPlayback(): void {
    if (!this.loaded) {
      return;
    }

    try {
      if (this.progressValue >= 0) {
        this.goToProgress(this.progressValue);
      }

      if (this.hasValidRange()) {
        this.playRange();
      }

      switch (this.currentStatus) {
        case 'play':
        case 'resume':
          if (!this.hasValidRange() && this.progressValue < 0) {
            this.controller.play();
          }
          break;
        case 'pause':
          this.controller.pause();
          break;
        case 'stop':
          this.controller.stop();
          break;
        case 'cancel':
          this.controller.goToAndStop(0, true);
          break;
      }
    } catch (e) {
      hilog.error(0, 'CustomLottie', 'applyPendingPlayback error: %{public}s', this.getErrorMessage(e));
    }
  }

  private playRange(): void {
    const totalFrames = this.controller.totalFrames;
    if (totalFrames <= 0) {
      return;
    }

    const startFrame = this.clampFrame(this.range.startPos, totalFrames);
    const endFrame = this.range.endPos >= 0 ? this.clampFrame(this.range.endPos, totalFrames) : totalFrames;
    this.controller.resetSegments(true);
    this.controller.playSegments([startFrame, endFrame], true);
  }

  private goToProgress(progress: number): void {
    const totalFrames = this.controller.totalFrames;
    if (totalFrames <= 0) {
      return;
    }
    this.controller.goToAndStop(this.clampFrame(progress, totalFrames), true);
  }

  private clampFrame(progress: number, totalFrames: number): number {
    const normalized = Math.max(0, Math.min(progress, 1));
    return normalized * totalFrames;
  }

  private hasValidRange(): boolean {
    return this.range.startPos >= 0;
  }

  private prepareSource(source: string): void {
    const currentVersion = ++this.sourceVersion;
    this.requestedSource = source;
    if (source.length === 0) {
      this.sourcePath = '';
      this.imagePath = '';
      this.loaded = false;
      this.hasMountedSource = false;
      this.updateArkUI();
      return;
    }

    if (this.isRemoteSource(source)) {
      void this.prepareRemoteSource(source, currentVersion);
      return;
    }

    this.applyResolvedSource(source, currentVersion);
  }

  private async prepareRemoteSource(source: string, version: number): Promise<void> {
    const cachePath = this.getRemoteCachePath(source);
    if (cachePath.length === 0) {
      this.applyResolvedSource(source, version);
      return;
    }

    try {
      if (!this.fileExists(cachePath)) {
        await this.downloadRemoteSource(source, cachePath);
      }
      this.applyResolvedSource(cachePath, version);
    } catch (e) {
      hilog.error(0, 'CustomLottie', 'prepareRemoteSource error: %{public}s', this.getErrorMessage(e));
      this.applyResolvedSource(source, version);
    }
  }

  private applyResolvedSource(source: string, version: number): void {
    if (version !== this.sourceVersion) {
      return;
    }

    this.sourcePath = source;
    this.imagePath = this.isRemoteSource(source) ? '' : this.getImagesPath(source);
    this.loaded = false;
    this.hasMountedSource = this.sourcePath.length > 0;
    this.updateArkUI();

    if (this.viewAppeared && this.sourcePath.length > 0) {
      this.reloadAnimation();
    }
  }

  private resolveSourcePath(properties: A2UIComponentProps): string {
    const localSource = this.getStringProperty(properties['__src_local_path__']);
    if (localSource !== undefined && localSource.length > 0) {
      return localSource;
    }

    const loadingSource = this.getStringProperty(properties['__loading_path__']);
    if (loadingSource !== undefined && loadingSource.length > 0) {
      return loadingSource;
    }

    const src = this.getStringProperty(properties['src']);
    if (src !== undefined && src.length > 0) {
      return src;
    }

    const url = this.getStringProperty(properties['url']);
    if (url !== undefined && url.length > 0) {
      return url;
    }

    return this.sourcePath;
  }

  private isRemoteSource(source: string): boolean {
    return source.startsWith('https://') || source.startsWith('http://');
  }

  private getRemoteCachePath(source: string): string {
    const context = this.getHostContext();
    if (!context) {
      return '';
    }

    const cacheDir = `${context.filesDir}/a2ui_lottie_cache`;
    this.ensureDirectory(cacheDir);
    const extension = this.getRemoteExtension(source);
    return `${cacheDir}/${this.lottieId}_${this.hashString(source)}.${extension}`;
  }

  private getRemoteExtension(source: string): string {
    const normalizedSource = source.split('?')[0];
    if (normalizedSource.endsWith('.zip')) {
      return 'zip';
    }
    return 'json';
  }

  private hashString(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    return `${Math.abs(hash)}`;
  }

  private getHostContext(): common.UIAbilityContext | undefined {
    return this.getUIContext()?.getHostContext() as common.UIAbilityContext | undefined;
  }

  private ensureDirectory(directory: string): void {
    const parts = directory.split('/');
    let buildPath = '';
    for (const part of parts) {
      if (part.length === 0) {
        continue;
      }
      buildPath = buildPath.length === 0 ? `/${part}` : `${buildPath}/${part}`;
      if (!fileIo.accessSync(buildPath)) {
        fileIo.mkdirSync(buildPath);
      }
    }
  }

  private fileExists(filePath: string): boolean {
    try {
      return fileIo.accessSync(filePath);
    } catch (_e) {
      return false;
    }
  }

  private async downloadRemoteSource(source: string, targetPath: string): Promise<void> {
    const httpRequest = http.createHttp();
    try {
      hilog.info(0, 'CustomLottie', 'download remote lottie: %{public}s', source);
      const response = await httpRequest.request(source, {
        method: http.RequestMethod.GET,
        expectDataType: http.HttpDataType.ARRAY_BUFFER,
        readTimeout: 15000,
        connectTimeout: 15000
      });
      if (response.responseCode < 200 || response.responseCode >= 300) {
        throw new Error(`responseCode=${response.responseCode}`);
      }

      const payload = response.result as ArrayBuffer;
      const file = fileIo.openSync(targetPath, fileIo.OpenMode.CREATE | fileIo.OpenMode.TRUNC | fileIo.OpenMode.WRITE_ONLY);
      fileIo.writeSync(file.fd, payload);
      fileIo.closeSync(file);
      hilog.info(0, 'CustomLottie', 'downloaded remote lottie to %{public}s', targetPath);
    } finally {
      httpRequest.destroy();
    }
  }

  private getStringProperty(value: Object | string | number | boolean | Array<Object> | undefined): string | undefined {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return `${value}`;
    }
    return undefined;
  }

  private parseNumberProperty(value: Object | string | number | boolean | Array<Object> | undefined): number | undefined {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private parseLoopValue(value: Object | string | number | boolean | Array<Object> | undefined): boolean | number | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private getBooleanProperty(value: boolean | string | number | undefined): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      if (value === 'true' || value === '1') {
        return true;
      }
      if (value === 'false' || value === '0') {
        return false;
      }
    }
    return undefined;
  }

  private getImagesPath(src: string): string {
    try {
      const lastSlashIndex = src.lastIndexOf('/');
      if (lastSlashIndex === -1) {
        return '';
      }
      const dirPath = src.substring(0, lastSlashIndex);
      const imagesPath = `${dirPath}/images`;
      const stat = fs.statSync(imagesPath);
      if (stat.isDirectory()) {
        return `${imagesPath}/`;
      }
    } catch (_e) {
      hilog.debug(0, 'CustomLottie', 'getImagesPath: images directory not found for src: %{public}s', src);
    }
    return '';
  }

  private getErrorMessage(error: Object): string {
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error);
      } catch (_e) {
        return `${error}`;
      }
    }
    return `${error}`;
  }

  public destroyAnimationResource(): void {
    try {
      this.controller.destroy();
    } catch (e) {
      hilog.error(0, 'CustomLottie', 'destroyAnimationResource error: %{public}s', this.getErrorMessage(e));
    } finally {
      this.loaded = false;
      this.viewAppeared = false;
      this.requestedSource = '';
    }
  }

  onDestroy(): void {
    this.destroyAnimationResource();
  }
}
