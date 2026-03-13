/**
 * A2UI Story Wrapper — renders A2UI components via the Lit renderer.
 * 
 * Based on the repo's own renderers/lit/stories/helpers/render-a2ui.ts
 * but adapted for our conformance storybook.
 */
import { html, LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { provide } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";

// Import all UI components to register custom elements
import "@a2ui/lit/ui";
import { v0_8 } from "@a2ui/lit";
import * as UI from "@a2ui/lit/ui";

// Default theme — must match Theme type with nested keys
const e = {}; // empty class map
const defaultTheme: v0_8.Types.Theme = {
  components: {
    Text: { all: e, h1: e, h2: e, h3: e, h4: e, h5: e, body: e, bodySmall: e, label: e, labelSmall: e, caption: e },
    Button: e,
    Card: e,
    Checkbox: { container: e, element: e, label: e },
    Column: e,
    Row: e,
    List: { container: e, item: e },
    Tabs: { container: e, element: e, controls: { all: e, selected: e } },
    Divider: e,
    Icon: e,
    Image: { all: e, icon: e, avatar: e, image: e },
    Slider: { container: e, element: e, label: e },
    TextField: { container: e, element: e, label: e },
    DateTimeInput: { container: e, element: e, label: e },
    MultipleChoice: { container: e, option: e, selectedOption: e },
    Audio: e,
    AudioPlayer: e,
    Video: e,
    Modal: { backdrop: e, element: e },
    Surface: e,
  } as any,
};

/**
 * Wrapper element that provides theme context for A2UI components.
 */
@customElement("conformance-a2ui-wrapper")
export class ConformanceA2UIWrapper extends SignalWatcher(LitElement) {
  @provide({ context: UI.Context.themeContext })
  accessor theme: v0_8.Types.Theme = defaultTheme;

  @property({ attribute: false })
  accessor processor!: v0_8.Data.A2uiMessageProcessor;

  @property({ attribute: false })
  accessor surfaceId: string = "test_surface";

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      font-family: "Roboto", system-ui, sans-serif;
    }
  `;

  render() {
    const surface = this.processor?.getSurfaces().get(this.surfaceId);
    if (!surface) {
      const available = this.processor ? Array.from(this.processor.getSurfaces().keys()).join(", ") : "none";
      return html`<p style="color: red;">Surface "${this.surfaceId}" not found. Available: ${available}</p>`;
    }

    return html`
      <a2ui-surface
        .surface=${{ ...surface }}
        .surfaceId=${this.surfaceId}
        .processor=${this.processor}
        .enableCustomElements=${false}
      ></a2ui-surface>
    `;
  }
}

export interface A2UIMessage {
  version?: string;
  beginRendering?: any;
  surfaceUpdate?: any;
  createSurface?: any;
  updateComponents?: any;
  updateDataModel?: any;
  dataModelUpdate?: any;
  deleteSurface?: any;
}

/**
 * Translate a single v0.10 message to v0.8 format inline.
 */
function translateMessage(msg: A2UIMessage): any {
  const { version, ...rest } = msg;
  
  // v0.10 createSurface → v0.8 beginRendering
  if (rest.createSurface) {
    // Need to find root from a later updateComponents — defer, handled below
    return { _createSurface: rest.createSurface };
  }
  
  // v0.10 updateComponents → v0.8 surfaceUpdate (with component translation)
  if (rest.updateComponents) {
    const comps = translateComponentArray(rest.updateComponents.components || []);
    return { surfaceUpdate: { surfaceId: rest.updateComponents.surfaceId, components: comps } };
  }
  
  // v0.10 updateDataModel → v0.8 dataModelUpdate
  if (rest.updateDataModel) {
    return { dataModelUpdate: rest.updateDataModel };
  }
  
  return rest;
}

/**
 * Translate an array of v0.10 flat components to v0.8 nested format.
 */
function translateComponentArray(components: any[]): any[] {
  return components.map(c => {
    if (typeof c.component === "object") return c; // already nested
    const { id, component, weight, ...props } = c;
    const type = component === "ChoicePicker" ? "MultipleChoice" : component;
    const compRenames: Record<string, Record<string, string>> = { Text: { variant: "usageHint" } };
    const renames = compRenames[type] || {};
    const STRING_PROPS = new Set(["text", "label", "hint", "name", "url", "src", "title", "placeholder", "description"]);
    const p: any = {};
    for (const [k, v] of Object.entries(props)) {
      const key = renames[k] || k;
      if (STRING_PROPS.has(key) && typeof v === "string") {
        p[key] = { literalString: v };
      } else {
        p[key] = v;
      }
    }
    // Tabs: v0.10 tabs → v0.8 tabItems
    if (type === "Tabs" && p.tabs && Array.isArray(p.tabs)) {
      p.tabItems = p.tabs.map((t: any) => ({
        title: typeof t.label === "string" ? { literalString: t.label } : (typeof t.title === "string" ? { literalString: t.title } : t.title || t.label),
        child: t.child,
      }));
      delete p.tabs;
    }
    // MultipleChoice: options labels + selections
    if (type === "MultipleChoice") {
      if (p.options) {
        p.options = p.options.map((o: any) => ({
          ...o,
          label: typeof o.label === "string" ? { literalString: o.label } : o.label,
        }));
      }
      if (p.value && !p.selections) { p.selections = p.value; delete p.value; }
      if (!p.selections) { p.selections = []; }
    }
    const result: any = { id, component: { [type]: p } };
    if (weight !== undefined) result.weight = weight;
    return result;
  });
}

/**
 * Render A2UI messages using the proper wrapper with theme context.
 * Accepts both v0.8 and v0.10 message formats — auto-translates.
 */
export function renderA2UI(messages: A2UIMessage[], surfaceId?: string) {
  const processor = v0_8.Data.createSignalA2uiMessageProcessor();
  
  // Detect and translate v0.10 messages
  const hasV010 = messages.some(m => m.createSurface || m.updateComponents);
  
  let serverMessages: any[];
  if (hasV010) {
    // Two-pass: first translate, then resolve createSurface → beginRendering
    const translated = messages.map(translateMessage);
    serverMessages = [];
    for (const msg of translated) {
      if (msg._createSurface) {
        // Find root from the next surfaceUpdate for this surface
        const sid = msg._createSurface.surfaceId;
        const nextUpdate = translated.find((m: any) => m.surfaceUpdate?.surfaceId === sid);
        const comps = nextUpdate?.surfaceUpdate?.components || [];
        const rootId = comps[0]?.id || "root";
        serverMessages.push({ beginRendering: { surfaceId: sid, root: rootId } });
      } else {
        serverMessages.push(msg);
      }
    }
  } else {
    serverMessages = messages.map(({ version, ...rest }) => rest);
  }
  
  processor.processMessages(serverMessages as v0_8.Types.ServerToClientMessage[]);
  
  const surfaces = processor.getSurfaces();
  const targetSurfaceId = surfaceId || Array.from(surfaces.keys())[0] || "test_surface";
  
  return html`
    <conformance-a2ui-wrapper
      .processor=${processor}
      .surfaceId=${targetSurfaceId}
    ></conformance-a2ui-wrapper>
  `;
}

/**
 * Helper to create v0.8 renderer messages for a simple component.
 * Accepts EITHER format:
 * - v0.8 nested: {id, component: {Type: {props}}}
 * - v0.10 flat: {id, component: "Type", prop1: val1, ...}
 * Auto-translates v0.10 → v0.8 if needed.
 */
export function simpleComponent(
  surfaceId: string,
  components: any[]
): A2UIMessage[] {
  const translated = components.map(c => {
    // Already v0.8 nested format
    if (typeof c.component === "object") return c;
    // v0.10 flat → v0.8 nested
    const { id, component, weight, ...props } = c;
    const type = component === "ChoicePicker" ? "MultipleChoice" : component;
    // Property renames: v0.10 → v0.8 (component-specific)
    const RENAMES: Record<string, Record<string, string>> = {
      Text: { variant: "usageHint" },
    };
    const renames = RENAMES[type] || {};
    const p: any = {};
    for (const [k, v] of Object.entries(props)) {
      const key = renames[k] || k;
      // StringValue properties that need {literalString: ...} wrapping
      const STRING_PROPS = new Set(["text", "label", "hint", "name", "url", "src", "title", "placeholder", "description"]);
      if (STRING_PROPS.has(key) && typeof v === "string") {
        p[key] = { literalString: v };
      } else {
        p[key] = v;
      }
    }
    // Component-specific translations
    if (type === "Tabs" && p.tabs && Array.isArray(p.tabs)) {
      // v0.10: tabs: [{label, child}] → v0.8: titles: [StringValue], children: [id]
      p.titles = p.tabs.map((t: any) => typeof t.label === "string" ? { literalString: t.label } : t.label);
      p.children = p.tabs.map((t: any) => t.child);
      delete p.tabs;
    }
    if (type === "MultipleChoice" && p.options && Array.isArray(p.options)) {
      p.options = p.options.map((o: any) => ({
        ...o,
        label: typeof o.label === "string" ? { literalString: o.label } : o.label,
      }));
    }
    const result: any = { id, component: { [type]: p } };
    if (weight !== undefined) result.weight = weight;
    return result;
  });
  const rootId = translated[0]?.id || "root";
  return [
    { beginRendering: { surfaceId, root: rootId } },
    { surfaceUpdate: { surfaceId, components: translated } },
  ];
}

/**
 * Helper for components with data model values.
 */
export function componentWithData(
  surfaceId: string,
  components: any[],
  dataPath: string,
  dataValue: any
): A2UIMessage[] {
  return [
    ...simpleComponent(surfaceId, components),
    { dataModelUpdate: { surfaceId, path: dataPath, value: dataValue } },
  ];
}
