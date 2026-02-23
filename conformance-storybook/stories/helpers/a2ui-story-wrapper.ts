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
    Tabs: { container: e, tab: e, activeTab: e },
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
    Modal: e,
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
  dataModelUpdate?: any;
  deleteSurface?: any;
}

/**
 * Render A2UI messages using the proper wrapper with theme context.
 */
export function renderA2UI(messages: A2UIMessage[], surfaceId?: string) {
  const processor = v0_8.Data.createSignalA2uiMessageProcessor();
  
  // Strip version field and pass as ServerToClientMessage[]
  const serverMessages = messages.map(({ version, ...rest }) => rest);
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
    // Property renames: v0.10 → v0.8
    const RENAMES: Record<string, string> = {
      variant: "usageHint",  // Text variant → usageHint
    };
    const p: any = {};
    for (const [k, v] of Object.entries(props)) {
      const key = RENAMES[k] || k;
      if ((key === "text" || key === "label" || key === "hint") && typeof v === "string") {
        p[key] = { literalString: v };
      } else {
        p[key] = v;
      }
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
