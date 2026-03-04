/**
 * Helper to render A2UI components in Storybook stories.
 * Takes v0.8 component definitions and renders via the Lit renderer.
 */
import { html, LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { provide } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";

// Import all UI components to register custom elements
import "@a2ui/lit/ui";
import { v0_8 } from "@a2ui/lit";
import * as UI from "@a2ui/lit/ui";

// Default theme — class maps for each component (empty = unstyled)
const defaultTheme: v0_8.Types.Theme = {
  components: {
    Text: {},
    Button: {},
    Card: {},
    Checkbox: {},
    Column: {},
    Row: {},
    List: {},
    Tabs: {},
    Divider: {},
    Icon: {},
    Image: {},
    Slider: {},
    TextField: {},
    DateTimeInput: {},
    MultipleChoice: {},
    Audio: {},
    Video: {},
    Modal: {},
    Surface: {},
  },
};

/**
 * Wrapper element that provides theme context for A2UI components.
 */
@customElement("storybook-a2ui-wrapper")
export class StorybookA2UIWrapper extends SignalWatcher(LitElement) {
  @provide({ context: UI.Context.themeContext })
  accessor theme: v0_8.Types.Theme = defaultTheme;

  @property({ attribute: false })
  accessor processor!: v0_8.Data.A2uiMessageProcessor;

  @property({ attribute: false })
  accessor surfaceId: string = "story_surface";

  static styles = css`
    :host {
      display: block;
      padding: 16px;
      font-family: "Roboto", system-ui, sans-serif;
    }
  `;

  render() {
    const surface = this.processor?.getSurfaces().get(this.surfaceId);
    if (!surface) return html`<p>No surface "${this.surfaceId}"</p>`;

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

export interface ComponentDef {
  id: string;
  component: Record<string, Record<string, unknown>>;
  weight?: number;
}

/**
 * Create a Storybook render function from A2UI component definitions.
 *
 * @param componentDefs - Array of v0.8 ComponentInstance objects
 *   e.g. [{id: "root", component: {Text: {text: {literalString: "Hi"}}}}]
 * @param rootId - Which component ID is the root (default: first one)
 * @param surfaceId - Surface ID (default: "story_surface")
 */
export function renderA2UI(
  componentDefs: ComponentDef[],
  rootId?: string,
  surfaceId = "story_surface"
) {
  const processor = v0_8.Data.createSignalA2uiMessageProcessor();
  const root = rootId ?? componentDefs[0]?.id ?? "root";

  const messages: v0_8.Types.ServerToClientMessage[] = [
    { beginRendering: { surfaceId, root } },
    { surfaceUpdate: { surfaceId, components: componentDefs as any } },
  ];

  processor.processMessages(messages);

  return html`
    <storybook-a2ui-wrapper
      .processor=${processor}
      .surfaceId=${surfaceId}
    ></storybook-a2ui-wrapper>
  `;
}

/**
 * Shorthand: render a single component as root.
 */
export function renderSingleComponent(
  type: string,
  props: Record<string, unknown>,
  id = "root"
) {
  return renderA2UI([{ id, component: { [type]: props } }]);
}
