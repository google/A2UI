import { resourceManager } from '@kit.LocalizationKit';
import { JSON } from '@kit.ArkTS';
import util from '@ohos.util';
import { common, ConfigurationConstant } from '@kit.AbilityKit';
import { UIContext } from '@kit.ArkUI';

import { hilog } from '@kit.PerformanceAnalysisKit';
import { AGenUIContainer, SurfaceManager, ISurfaceManagerListener, Surface, AGenUI } from '@agenui/agenui';
import { CustomMarkdownComponent } from '../components/CustomMarkdownComponent';
import { CustomChartComponent } from '../components/CustomChartComponent';
import { CustomLottieComponent } from '../components/CustomLottieComponent';
import { ToastFunction } from '../functions/ToastFunction';
import { OpenUrlFunction } from '../functions/OpenUrlFunction';

import { copyRawfileDirToSandbox } from '../utils/ResourceCopyUtil';

// Theme color constants
const COLOR_PRIMARY_LIGHT = '#6200EE';
const COLOR_PRIMARY_DARK = '#3700B3';
const COLOR_ACCENT = '#BB86FC';
const COLOR_ACCENT_SECONDARY = '#4D95E5';
const COLOR_BG_LIGHT = '#FFFFFF';
const COLOR_BG_LIGHT_SECONDARY = '#F8F8F8';
const COLOR_BG_LIGHT_TERTIARY = '#F5F5F5';
const COLOR_BG_DARK = '#121212';
const COLOR_BG_DARK_SECONDARY = '#1E1E1E';
const COLOR_BG_DARK_TERTIARY = '#2A2A2A';
const COLOR_TEXT_LIGHT = '#000000';
const COLOR_TEXT_LIGHT_SECONDARY = '#666666';
const COLOR_TEXT_LIGHT_TERTIARY = '#333333';
const COLOR_TEXT_DARK = '#E0E0E0';
const COLOR_TEXT_DARK_SECONDARY = '#AAAAAA';
const COLOR_TEXT_DARK_TERTIARY = '#BBBBBB';
const COLOR_OVERLAY = 'rgba(0, 0, 0, 0.5)';

// Protocol constants
const API_VERSION = 'v0.9';
const STANDARD_CATALOG_URL = 'https://a2ui.org/specification/v0_9/standard_catalog.json';

// UI layout constants
const TAB_WIDTH = 120;

// Logging identifiers
const TAG = 'AGenUIDemoPage';
const DOMAIN = 0x0000;

/**
 * ISurfaceManagerListener implementation that bridges C++ surface lifecycle
 * events to the ArkTS component tree.
 *
 * When the native engine creates or destroys a surface, this listener notifies
 * the host Index component so it can add or remove the corresponding
 * AGenUIContainer from the UI.
 */
class SurfaceListenerImpl implements ISurfaceManagerListener {
  private indexComponent: Index | null = null;

  /**
   * @param indexComponent - The host page component that manages the container list.
   */
  constructor(indexComponent: Index) {
    this.indexComponent = indexComponent;
  }

  /**
   * Called by the native engine after a surface has been successfully created.
   * Delegates to the host component to mount a new AGenUIContainer.
   *
   * @param surface - The newly created surface descriptor.
   */
  onCreateSurface(surface: Surface): void {
    hilog.info(DOMAIN, TAG, `Surface created: ${surface.surfaceId}`);
    if (this.indexComponent) {
      this.indexComponent.addAGenUIContainer(surface.surfaceId);
    }
  }

  /**
   * Called by the native engine after a surface has been destroyed.
   * Delegates to the host component to unmount the corresponding AGenUIContainer.
   *
   * @param surface - The destroyed surface descriptor.
   */
  onDeleteSurface(surface: Surface): void {
    hilog.info(DOMAIN, TAG, `Surface destroyed: ${surface.surfaceId}`);
    if (this.indexComponent) {
      this.indexComponent.removeAGenUIContainer(surface.surfaceId);
    }
  }

}


/** A node in the two-level story navigation menu. */
interface MenuItem {
  /** Display name shown in the menu list. */
  name: string;
  /** Rawfile path to the directory represented by this item. */
  path: string;
  /** Child items (only present on first-level entries). */
  children?: MenuItem[];
  /** Whether this first-level group is currently expanded. */
  isExpanded?: boolean;
}

/** Payload shape of the updateComponents JSON message. */
interface UpdateComponentsData {
  /** Target surface that should receive the component tree update. */
  surfaceId?: string;
  /** Array of component descriptors to be applied to the surface. */
  components?: Array<Record<string, ESObject>>;
}

/** Top-level shape of a components JSON file stored in rawfile stories. */
interface ComponentsData {
  /** Protocol version string (e.g. "v0.9"). */
  version?: string;
  /** Nested updateComponents payload. */
  updateComponents?: UpdateComponentsData;
}

@Entry
@Component
struct Index {
  /** Two-level navigation items loaded from rawfile stories directory. */
  @State menuItems: MenuItem[] = [];
  /** Raw text shown in the non-editor content area (for debugging purposes). */
  @State currentContent: string = '';
  /** Title displayed in the top navigation bar. */
  @State currentTitle: string = 'Menu';
  /** Whether the left navigation drawer is currently visible. */
  @State isDrawerOpen: boolean = false;
  /** Whether the JSON editor panel is currently visible. */
  @State isEditorOpen: boolean = false;
  /** Text content bound to the active tab's TextArea in the JSON editor. */
  @State editorContent: string = '';
  /** Active tab index in the JSON editor: 0 = Components, 1 = DataModel. */
  @State currentTabIndex: number = 0;
  /** Formatted JSON string for the updateComponents payload. */
  @State componentsJson: string = '{}';
  /** Formatted JSON string for the updateDataModel payload. */
  @State dataModelJson: string = '{}';
  /** Controls whether AGenUIContainer is shown and which surfaceId it uses. */
  @State currentSurfaceId: string = '';
  /** Monotonic counter used to force AGenUIContainer recreation via the ForEach key. */
  @State surfaceVersion: number = 0;
  /** Whether dark mode is currently active. */
  @State isDarkMode: boolean = false;

  private surfaceManager: SurfaceManager | null = null;

  /**
   * Registers the demo-specific host functions and custom components used by
   * the playground page.
   */
  private registerDemoExtensions(context: common.UIAbilityContext): void {
    // Register app-defined functions.
    AGenUI.registerFunction(new ToastFunction());
    AGenUI.registerFunction(new OpenUrlFunction(context));

    // Register the app-side Markdown component that replaces the former built-in SDK implementation.
    AGenUI.registerComponent('Markdown', (
      surfaceId: string,
      nodeId: string,
      componentType: string,
      viewStatePtr: bigint
    ) => {
      return new CustomMarkdownComponent(surfaceId, nodeId, componentType, viewStatePtr);
    });

    // Register the app-side Chart component that replaces the former built-in SDK implementation.
    AGenUI.registerComponent('Chart', (
      surfaceId: string,
      nodeId: string,
      componentType: string,
      viewStatePtr: bigint
    ) => {
      return new CustomChartComponent(surfaceId, nodeId, componentType, viewStatePtr);
    });

    // Register the app-side Lottie component that replaces the former built-in SDK implementation.
    AGenUI.registerComponent('Lottie', (
      surfaceId: string,
      nodeId: string,
      componentType: string,
      viewStatePtr: bigint
    ) => {
      return new CustomLottieComponent(surfaceId, nodeId, componentType, viewStatePtr);
    });
  }

  /**
   * Unregisters the demo-specific host functions and custom components so
   * repeated page entry does not leave stale global registrations behind.
   */
  private unregisterDemoExtensions(): void {
    AGenUI.unregisterFunction('toast');
    AGenUI.unregisterFunction('openUrl');
    AGenUI.unRegisterComponent('Markdown');
    AGenUI.unRegisterComponent('Chart');
    AGenUI.unRegisterComponent('Lottie');
  }

  /**
   * Destroys the current SurfaceManager instance and detaches all page-level
   * listeners and native resources owned by this page.
   */
  private destroySurfaceManager(): void {
    if (this.surfaceManager !== null) {
      this.surfaceManager.destroy();
      this.surfaceManager = null;
    }
  }

  /**
   * Applies the given theme mode to both the host app and the AGenUI content area.
   *
   * Updates the system-wide color mode used by native ArkUI components and
   * propagates the change to the AGenUI rendering engine.
   *
   * @param isDark - Pass `true` to activate dark mode, `false` for light mode.
   */
  private applyThemeMode(isDark: boolean) {
    const mode = isDark ? 'dark' : 'light';
    hilog.info(DOMAIN, TAG, 'Switching theme mode: %{public}s', mode);

    // Update the app-wide system color mode used by native ArkUI components.
    try {
      const colorMode = isDark
        ? ConfigurationConstant.ColorMode.COLOR_MODE_DARK
        : ConfigurationConstant.ColorMode.COLOR_MODE_LIGHT;
      getContext(this).getApplicationContext().setColorMode(colorMode);
      hilog.info(DOMAIN, TAG, 'App setColorMode called with: %{public}s', mode);
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'setColorMode failed: %{public}s', JSON.stringify(err));
    }

    // Update the AGenUI content theme mode.
    AGenUI.setDayNightMode(mode);
    hilog.info(DOMAIN, TAG, 'setThemeMode called with: %{public}s', mode);
  }

  /** Lifecycle: initializes the SurfaceManager, registers SDK functions/components, and loads the story menu. */
  aboutToAppear() {
    // Copy rawfile assets into the sandbox and initialize the SDK.
    const context = getContext(this) as common.UIAbilityContext;
    this.destroySurfaceManager();
    this.surfaceManager = new SurfaceManager(context);

    this.registerDemoExtensions(context);
    this.surfaceManager.addListener(new SurfaceListenerImpl(this));

    Promise.all([
      copyRawfileDirToSandbox(context, 'ui_templates', 'data/ui_templates'),
      copyRawfileDirToSandbox(context, 'icons', 'data/icons'),
    ])
      .then((results: string[]) => {
        const uiTemplatesPath: string = results[0];
        const iconsPath: string = results[1];
        hilog.info(DOMAIN, TAG, 'ui_templates copied to sandbox: %{public}s', uiTemplatesPath);
        hilog.info(DOMAIN, TAG, 'icons copied to sandbox: %{public}s', iconsPath);
      })
      .catch((err: Error) => {
        hilog.error(DOMAIN, TAG, 'Failed to copy resources to sandbox: %{public}s', JSON.stringify(err));
      });

    this.loadStoriesFromRawfile();
  }

  /** Lifecycle: tears down page-owned native resources and demo registrations. */
  aboutToDisappear(): void {
    this.destroySurfaceManager();
    this.unregisterDemoExtensions();
  }

  /** Lifecycle: stores the UIContext in AppStorage so child components can access it after the first build. */
  onDidBuild(): void {
    AppStorage.setOrCreate<UIContext>('context', this.getUIContext());
  }

  /**
   * Mounts a new AGenUIContainer for the given surface.
   *
   * Called by SurfaceListenerImpl when the native engine signals that a surface
   * has been created. Increments surfaceVersion to force ForEach recreation.
   *
   * @param surfaceId - The identifier of the newly created surface.
   */
  addAGenUIContainer(surfaceId: string) {
    hilog.info(DOMAIN, TAG, 'Adding AGenUIContainer, surfaceId: %{public}s', surfaceId);
    this.surfaceVersion++;
    this.currentSurfaceId = surfaceId;
  }

  /**
   * Unmounts the AGenUIContainer for the given surface.
   *
   * Called by SurfaceListenerImpl when the native engine signals that a surface
   * has been destroyed. Clears currentSurfaceId so the ForEach renders nothing.
   *
   * @param surfaceId - The identifier of the destroyed surface.
   */
  removeAGenUIContainer(surfaceId: string) {
    hilog.info(DOMAIN, TAG, 'Removing AGenUIContainer, surfaceId: %{public}s', surfaceId);
    if (this.currentSurfaceId === surfaceId) {
      this.currentSurfaceId = '';
    }
  }

  /**
   * Loads the two-level story navigation menu from the rawfile `stories` directory.
   *
   * Traverses two directory levels under `stories/`. Any second-level directory
   * that contains at least one `.json` file is added as a leaf menu item.
   * Hidden entries (prefixed with `.`) are silently skipped.
   */
  private async loadStoriesFromRawfile() {
    try {
      const resMgr = getContext(this).resourceManager;
      const storiesPath = 'stories';
      
      hilog.info(DOMAIN, TAG, 'Loading stories directory');
      
      const firstLevelDirs = await this.readDirectory(resMgr, storiesPath);
      hilog.info(DOMAIN, TAG, `Found ${firstLevelDirs.length} top-level director(y/ies)`);
      
      const menuItems: MenuItem[] = [];

      for (const firstDir of firstLevelDirs) {
        if (firstDir.startsWith('.')) {
          continue;
        }
        
        const firstLevelPath = `${storiesPath}/${firstDir}`;
        hilog.info(DOMAIN, TAG, `Reading top-level directory: ${firstDir}`);
        
        const secondLevelDirs = await this.readDirectory(resMgr, firstLevelPath);
        hilog.info(DOMAIN, TAG, `  Found ${secondLevelDirs.length} second-level director(y/ies)`);
        
        const children: MenuItem[] = [];
        
        for (const secondDir of secondLevelDirs) {
          if (secondDir.startsWith('.')) {
            continue;
          }
          
          const secondLevelPath = `${firstLevelPath}/${secondDir}`;
          hilog.info(DOMAIN, TAG, `  Reading second-level directory: ${secondDir}`);
          
          const jsonFiles = await this.readDirectory(resMgr, secondLevelPath);
          hilog.info(DOMAIN, TAG, `    Found ${jsonFiles.length} file(s)`);
          
          const hasJsonFiles = jsonFiles.some(file => file.endsWith('.json'));
          if (hasJsonFiles) {
            children.push({
              name: secondDir,
              path: secondLevelPath,
              isExpanded: false
            });
          }
        }

        if (children.length > 0) {
          menuItems.push({
            name: firstDir,
            path: firstLevelPath,
            children: children,
            isExpanded: false
          });
        }
      }

      this.menuItems = menuItems;
      hilog.info(DOMAIN, TAG, `Load complete, ${menuItems.length} top-level menu item(s)`);
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'Failed to load stories: %{public}s', JSON.stringify(error));
    }
  }

  /**
   * Lists entries under a rawfile directory path.
   *
   * Wraps `ResourceManager.getRawFileList` and returns an empty array on error
   * so callers do not need individual error handling for every directory read.
   *
   * @param resMgr - The resource manager used to access rawfile assets.
   * @param path   - Rawfile-relative directory path to list.
   * @returns A promise that resolves to the list of entry names, or `[]` on failure.
   */
  private async readDirectory(resMgr: resourceManager.ResourceManager, path: string): Promise<string[]> {
    try {
      const fileList = await resMgr.getRawFileList(path);
      return fileList;
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'Failed to read directory %{public}s: %{public}s', path, JSON.stringify(error));
      return [];
    }
  }

  /**
   * Toggles the expanded/collapsed state of a first-level menu item.
   *
   * Rebuilds the entire menuItems array to comply with ArkTS immutable-state
   * requirements; only the item at `index` has its `isExpanded` flag flipped.
   *
   * @param index - Zero-based index of the first-level item to toggle.
   */
  private toggleFirstLevel(index: number) {
    if (index < 0 || index >= this.menuItems.length) {
      return;
    }
    const newMenuItems: MenuItem[] = [];
    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      const newItem: MenuItem = {
        name: item.name,
        path: item.path,
        children: item.children,
        isExpanded: i === index ? !item.isExpanded : item.isExpanded
      };
      newMenuItems.push(newItem);
    }
    this.menuItems = newMenuItems;
  }

  /**
   * Decodes a UTF-8 byte array and re-serializes the JSON with 2-space indentation.
   *
   * @param rawData - Raw bytes of a JSON file read from rawfile assets.
   * @returns A pretty-printed JSON string.
   */
  private decodeAndFormatJson(rawData: Uint8Array): string {
    const decoder = util.TextDecoder.create('utf-8');
    const rawJson = decoder.decodeWithStream(rawData);
    const jsonObj = JSON.parse(rawJson) as object;
    return JSON.stringify(jsonObj, null, 2);
  }

  /**
   * Persists the current editor text back to the corresponding model field.
   *
   * Writes `editorContent` into `componentsJson` when the Components tab is
   * active (index 0), or into `dataModelJson` when the DataModel tab is active.
   */
  private syncEditorContentToModel() {
    if (this.currentTabIndex === 0) {
      this.componentsJson = this.editorContent;
    } else {
      this.dataModelJson = this.editorContent;
    }
  }

  /**
   * Selects a second-level story item and drives the full surface lifecycle.
   *
   * Execution order:
   *   1. Load `updateComponents.json` and `updateDataModel.json` from rawfile.
   *   2. If a surface is already active, send `deleteSurface` to tear it down.
   *   3. Send `createSurface` so the engine creates a new surface and fires
   *      `onCreateSurface`, which in turn mounts a fresh AGenUIContainer.
   *   4. Send the `updateComponents` and `updateDataModel` payloads.
   *
   * @param firstIndex  - Zero-based index of the parent first-level menu item.
   * @param secondIndex - Zero-based index of the selected second-level child item.
   */
  private async selectSecondLevel(firstIndex: number, secondIndex: number) {
    const item = this.menuItems[firstIndex].children![secondIndex];
    this.currentTitle = `${this.menuItems[firstIndex].name} / ${item.name}`;
    this.isDrawerOpen = false;

    const resMgr = getContext(this).resourceManager;

    // Load Components JSON and fall back to an empty object if the file is missing.
    try {
      const componentsRawData = await resMgr.getRawFileContent(`${item.path}/updateComponents.json`);
      this.componentsJson = this.decodeAndFormatJson(componentsRawData);
      hilog.info(DOMAIN, TAG, 'Components JSON loaded, path: %{public}s', item.path);
    } catch (e) {
      this.componentsJson = '{}';
      hilog.info(DOMAIN, TAG, 'Components file not found, falling back to empty object');
    }

    // Load DataModel JSON and fall back to an empty object if the file is missing.
    try {
      const dataModelRawData = await resMgr.getRawFileContent(`${item.path}/updateDataModel.json`);
      this.dataModelJson = this.decodeAndFormatJson(dataModelRawData);
      hilog.info(DOMAIN, TAG, 'DataModel JSON loaded, path: %{public}s', item.path);
    } catch (e) {
      this.dataModelJson = '{}';
      hilog.info(DOMAIN, TAG, 'DataModel file not found, falling back to empty object');
    }

    // Extract surfaceId from componentsJson.
    const componentsObj = JSON.parse(this.componentsJson) as ComponentsData;
    const newSurfaceId = componentsObj.updateComponents?.surfaceId ?? 'default_surface';
    hilog.info(DOMAIN, TAG, 'Extracted surfaceId: %{public}s', newSurfaceId);

    // If a surface is already active, clear the container first to trigger
    // unbindSurface, then send deleteSurface for the old surface.
    if (this.surfaceManager === null) {
      hilog.error(DOMAIN, TAG, 'surfaceManager is null, cannot process selection');
      return;
    }

    if (this.currentSurfaceId) {
      const oldSurfaceId = this.currentSurfaceId;
      const deleteSurfaceJsonStr =
        `{"version":"${API_VERSION}","deleteSurface":{"surfaceId":"${oldSurfaceId}"}}`;
      this.surfaceManager.receiveTextChunk(deleteSurfaceJsonStr);
      hilog.info(DOMAIN, TAG, '0/3 deleteSurface sent (dispose previous surface): %{public}s', oldSurfaceId);
    }

    // Send createSurface so C++ creates the surface and later triggers onCreateSurface.
    const createSurfaceJsonStr =
      `{"version":"${API_VERSION}","createSurface":{"surfaceId":"${newSurfaceId}","catalogId":"${STANDARD_CATALOG_URL}"}}`;
    this.surfaceManager.receiveTextChunk(createSurfaceJsonStr);
    hilog.info(DOMAIN, TAG, '1/3 createSurface sent: %{public}s', newSurfaceId);

    // Update the editor contents immediately without waiting for C++ rendering to finish.
    this.currentContent = `Components:\n${this.componentsJson}\n\nDataModel:\n${this.dataModelJson}`;

    // Send the updateComponents payload loaded from file.
    if (this.componentsJson !== '{}') {
      this.surfaceManager.receiveTextChunk(this.componentsJson);
      hilog.info(DOMAIN, TAG, '2/3 updateComponents sent');
    }

    // Send the updateDataModel payload loaded from file.
    if (this.dataModelJson !== '{}') {
      this.surfaceManager.receiveTextChunk(this.dataModelJson);
      hilog.info(DOMAIN, TAG, '3/3 updateDataModel sent');
    }
  }

  /** Toggles the left navigation drawer open or closed. */
  private toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  /** Opens the JSON editor panel, defaulting to the Components tab. */
  private openEditor() {
    this.currentTabIndex = 0;
    this.editorContent = this.componentsJson;
    this.isEditorOpen = true;
  }

  /** Closes the JSON editor panel without saving. */
  private closeEditor() {
    this.isEditorOpen = false;
  }

  /**
   * Switches the active tab in the JSON editor.
   *
   * Persists any pending edits for the current tab before switching, then
   * loads the content of the newly selected tab into the editor.
   *
   * @param index - Target tab index: 0 = Components, 1 = DataModel.
   */
  private switchTab(index: number) {
    this.syncEditorContentToModel();
    this.currentTabIndex = index;
    this.editorContent = index === 0 ? this.componentsJson : this.dataModelJson;
  }

  /**
   * Pretty-prints the current editor content as JSON.
   *
   * Parses and re-serializes `editorContent` with 2-space indentation.
   * Logs an error if the content is not valid JSON.
   */
  private formatJson() {
    try {
      const jsonObj = JSON.parse(this.editorContent);
      this.editorContent = JSON.stringify(jsonObj, null, 2);
      hilog.info(DOMAIN, TAG, 'JSON formatted');
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'JSON formatting failed: %{public}s', error.message);
    }
  }

  /**
   * Validates that the current editor content is well-formed JSON.
   *
   * Attempts to parse `editorContent` and logs the result. No UI feedback
   * is shown; validation outcome is observable via logs.
   */
  private validateJson() {
    try {
      JSON.parse(this.editorContent);
      hilog.info(DOMAIN, TAG, 'JSON validation passed');
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'JSON validation failed: %{public}s', error.message);
    }
  }

  /**
   * Saves the editor content to the model and closes the editor panel.
   *
   * Persists both JSON fields via syncEditorContentToModel, then dismisses
   * the editor. Preview rendering is currently triggered separately.
   */
  private saveAndPreview() {
    this.syncEditorContentToModel();
    hilog.info(DOMAIN, TAG, 'Saved successfully');
    this.closeEditor();
  }

  build() {
    Stack({ alignContent: Alignment.TopStart }) {
      Column() {
        Row() {
          Image($r('app.media.ic_menu'))
            .width(24)
            .height(24)
            .margin({ left: 16 })
            .onClick(() => {
              this.toggleDrawer();
            })

          Text(this.currentTitle)
            .fontSize(18)
            .fontWeight(FontWeight.Medium)
            .fontColor(Color.White)
            .margin({ left: 16 })
            .layoutWeight(1)

          Row() {
            Text(this.isDarkMode ? '🌙' : '☀️')
              .fontSize(14)
              .fontColor(Color.White)
              .margin({ right: 4 })
            Toggle({ type: ToggleType.Switch, isOn: this.isDarkMode })
              .width(40)
              .height(22)
              .selectedColor(COLOR_ACCENT_SECONDARY)
              .onChange((isOn: boolean) => {
                this.isDarkMode = isOn;
                this.applyThemeMode(isOn);
              })
          }
          .margin({ right: 12 })
          .alignItems(VerticalAlign.Center)

          Text('Edit')
            .fontSize(16)
            .fontColor(Color.White)
            .margin({ right: 16 })
            .onClick(() => {
              this.openEditor();
            })
        }
        .width('100%')
        .height(56)
        .backgroundColor(this.isDarkMode ? COLOR_PRIMARY_DARK : COLOR_PRIMARY_LIGHT)
        .alignItems(VerticalAlign.Center)

        // A2UI native rendering area wrapped in Scroll for overflow support.
        Scroll() {
          Column() {
            ForEach(
              this.currentSurfaceId ? [this.currentSurfaceId] : [],
              (surfaceId: string) => {
                AGenUIContainer({ surfaceId: surfaceId })
                  .backgroundColor(this.isDarkMode ? COLOR_BG_DARK : COLOR_BG_LIGHT)
                  .width('100%')
              },
              (_surfaceId: string) => `agenui_${this.surfaceVersion}`
            )
          }
          .width('100%')
        }
        .width('100%')
        .layoutWeight(1)
        .scrollBar(BarState.Off)
        .edgeEffect(EdgeEffect.None)
        .align(Alignment.Top)
        .backgroundColor(this.isDarkMode ? COLOR_BG_DARK : COLOR_BG_LIGHT)
      }
      .width('100%')
      .height('100%')

      if (this.isDrawerOpen) {
        Row() {
          Column() {
            Row() {
              Text('Menu')
                .fontSize(24)
                .fontWeight(FontWeight.Bold)
                .fontColor(Color.White)
                .margin({ left: 16 })
            }
            .width('100%')
            .height(56)
            .backgroundColor(this.isDarkMode ? COLOR_PRIMARY_DARK : COLOR_PRIMARY_LIGHT)
            .alignItems(VerticalAlign.Center)

            Scroll() {
              Column() {
                ForEach(this.menuItems, (item: MenuItem, firstIndex: number) => {
                  Column() {
                    Row() {
                      Text(item.name)
                        .fontSize(18)
                        .fontWeight(FontWeight.Medium)
                        .fontColor(this.isDarkMode ? COLOR_TEXT_DARK : COLOR_TEXT_LIGHT)
                        .layoutWeight(1)

                      Image(item.isExpanded ? $r('app.media.ic_expand_less') : $r('app.media.ic_expand_more'))
                        .width(24)
                        .height(24)
                        .fillColor(this.isDarkMode ? COLOR_TEXT_DARK_SECONDARY : COLOR_TEXT_LIGHT_SECONDARY)
                    }
                    .width('100%')
                    .padding({ left: 16, right: 16, top: 16, bottom: 16 })
                    .onClick(() => {
                      this.toggleFirstLevel(firstIndex);
                    })

                    if (item.isExpanded && item.children) {
                      Column() {
                        ForEach(item.children, (child: MenuItem, secondIndex: number) => {
                          Row() {
                            Text(child.name)
                              .fontSize(16)
                              .fontColor(this.isDarkMode ? COLOR_TEXT_DARK_TERTIARY : COLOR_TEXT_LIGHT_TERTIARY)
                              .padding({ left: 40, top: 12, bottom: 12 })
                          }
                          .width('100%')
                          .onClick(() => {
                            this.selectSecondLevel(firstIndex, secondIndex);
                          })
                        })
                      }
                      .width('100%')
                      .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_TERTIARY : COLOR_BG_LIGHT_SECONDARY)
                    }
                  }
                  .width('100%')
                })
              }
              .width('100%')
            }
            .layoutWeight(1)
            .width('100%')
            .align(Alignment.Top)
            .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)
          }
          .width('68%')
          .height('100%')
          .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)

          Column()
            .layoutWeight(1)
            .height('100%')
            .backgroundColor(COLOR_OVERLAY)
            .onClick(() => {
              this.isDrawerOpen = false;
            })
        }
        .width('100%')
        .height('100%')
        .transition(TransitionEffect.OPACITY.animation({ duration: 300 }))
      }

      if (this.isEditorOpen) {
        Row() {
          Column()
            .layoutWeight(1)
            .height('100%')
            .backgroundColor(COLOR_OVERLAY)
            .onClick(() => {
              this.closeEditor();
            })

          Column() {
            Row() {
              Image($r('app.media.ic_menu'))
                .width(24)
                .height(24)
                .margin({ left: 16 })
                .onClick(() => {
                  this.closeEditor();
                })

              Text('JSON Editor')
                .fontSize(20)
                .fontWeight(FontWeight.Bold)
                .fontColor(Color.White)
                .margin({ left: 16 })
                .layoutWeight(1)
            }
            .width('100%')
            .height(56)
            .backgroundColor(this.isDarkMode ? COLOR_PRIMARY_DARK : COLOR_PRIMARY_LIGHT)
            .alignItems(VerticalAlign.Center)

            Row() {
              Text('COMPONENTS')
                .fontSize(14)
                .fontWeight(this.currentTabIndex === 0 ? FontWeight.Bold : FontWeight.Normal)
                .fontColor(this.currentTabIndex === 0 ? COLOR_ACCENT : (this.isDarkMode ? COLOR_TEXT_DARK_SECONDARY : COLOR_TEXT_LIGHT_SECONDARY))
                .padding({ left: 24, right: 24, top: 12, bottom: 12 })
                .onClick(() => {
                  this.switchTab(0);
                })

              Text('DATAMODEL')
                .fontSize(14)
                .fontWeight(this.currentTabIndex === 1 ? FontWeight.Bold : FontWeight.Normal)
                .fontColor(this.currentTabIndex === 1 ? COLOR_ACCENT : (this.isDarkMode ? COLOR_TEXT_DARK_SECONDARY : COLOR_TEXT_LIGHT_SECONDARY))
                .padding({ left: 24, right: 24, top: 12, bottom: 12 })
                .onClick(() => {
                  this.switchTab(1);
                })
            }
            .width('100%')
            .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)

            // Active-tab indicator: TAB_WIDTH vp underline aligned to the selected tab.
            Divider()
              .height(2)
              .color(COLOR_ACCENT)
              .margin({ left: this.currentTabIndex === 0 ? 0 : TAB_WIDTH })
              .width(TAB_WIDTH)

            Scroll() {
              TextArea({ text: this.editorContent })
                .width('100%')
                .height('100%')
                .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_TERTIARY : COLOR_BG_LIGHT_TERTIARY)
                .fontSize(12)
                .fontColor(this.isDarkMode ? COLOR_TEXT_DARK : COLOR_TEXT_LIGHT)
                .fontFamily('monospace')
                .padding(16)
                .onChange((value: string) => {
                  this.editorContent = value;
                })
            }
            .layoutWeight(1)
            .width('100%')

            Column() {
              Row() {
                Button('Format')
                  .fontSize(14)
                  .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)
                  .fontColor(COLOR_ACCENT)
                  .borderWidth(1)
                  .borderColor(COLOR_ACCENT)
                  .layoutWeight(1)
                  .margin({ right: 8 })
                  .onClick(() => {
                    this.formatJson();
                  })

                Button('Validate')
                  .fontSize(14)
                  .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)
                  .fontColor(COLOR_ACCENT)
                  .borderWidth(1)
                  .borderColor(COLOR_ACCENT)
                  .layoutWeight(1)
                  .margin({ left: 8 })
                  .onClick(() => {
                    this.validateJson();
                  })
              }
              .width('100%')
              .padding({ left: 16, right: 16, top: 8 })

              Row() {
                Button('Cancel')
                  .fontSize(16)
                  .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)
                  .fontColor(this.isDarkMode ? COLOR_TEXT_DARK_SECONDARY : COLOR_TEXT_LIGHT_SECONDARY)
                  .layoutWeight(1)
                  .margin({ right: 8 })
                  .onClick(() => {
                    this.closeEditor();
                  })

                Button('Save & Preview')
                  .fontSize(14)
                  .backgroundColor(this.isDarkMode ? COLOR_PRIMARY_DARK : COLOR_PRIMARY_LIGHT)
                  .fontColor(Color.White)
                  .layoutWeight(1)
                  .margin({ left: 8 })
                  .onClick(() => {
                    this.saveAndPreview();
                  })
              }
              .width('100%')
              .padding({ left: 16, right: 16, top: 8, bottom: 16 })
            }
            .width('100%')
            .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)
          }
          .width('68%')
          .height('100%')
          .backgroundColor(this.isDarkMode ? COLOR_BG_DARK_SECONDARY : COLOR_BG_LIGHT)
        }
        .width('100%')
        .height('100%')
        .transition(TransitionEffect.OPACITY.animation({ duration: 300 }))
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(this.isDarkMode ? COLOR_BG_DARK : COLOR_BG_LIGHT)
  }
}
