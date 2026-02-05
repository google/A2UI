
import { SignalWatcher } from "@lit-labs/signals";
import { provide } from "@lit/context";
import { LitElement, html, css, nothing, unsafeCSS } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { theme as uiTheme } from "./theme/theme.js";
import { A2UIClient } from "./client.js";
import { v0_8 } from "@a2ui/lit";
import * as UI from "@a2ui/lit/ui";
import "./ui/ui.js";
import "./ui/debug-panel.js";
import { DebugPanel } from "./ui/debug-panel.js";

interface DemoItem {
  id: string;
  title: string;
  description: string;
  actionButton?: boolean; // Whether to show a manual "Log Value" button shell-side
}

const DEMO_ITEMS: DemoItem[] = [
  { id: "demo-text", title: "TextField", description: "Allows user to enter text. Supports binding to data model.", actionButton: true },
  { id: "demo-checkbox", title: "CheckBox", description: "A binary toggle.", actionButton: true },
  { id: "demo-slider", title: "Slider", description: "Select a value from a range.", actionButton: true },
  { id: "demo-date", title: "DateTimeInput", description: "Pick a date or time.", actionButton: true },
  { id: "demo-multichoice", title: "MultipleChoice", description: "Select valid options from a list.", actionButton: true },
  { id: "demo-multichoice-chips", title: "MultipleChoice (Chips)", description: "Select options using chips.", actionButton: true },
  { id: "demo-multichoice-filter", title: "MultipleChoice (Filterable)", description: "Search and filter options.", actionButton: true },
  { id: "demo-image", title: "Image", description: "Displays an image from a URL." },
  { id: "demo-button", title: "Button", description: "Triggers a client-side action." },
  { id: "demo-tabs", title: "Tabs", description: "Switch between different views." },
  { id: "demo-icon", title: "Icon", description: "Standard icons." },
  { id: "demo-divider", title: "Divider", description: "Visual separation." },
  { id: "demo-card", title: "Card", description: "A container for other components." },
  { id: "demo-video", title: "Video", description: "Video player." },
  { id: "demo-modal", title: "Modal", description: "Overlay dialog." },
  { id: "demo-list", title: "List", description: "Vertical or horizontal list." },
  { id: "demo-audio", title: "AudioPlayer", description: "Play audio content." },
];

@customElement("a2ui-component-gallery")
export class A2UIComponentGallery extends SignalWatcher(LitElement) {

  @provide({ context: UI.Context.themeContext })
  accessor theme: v0_8.Types.Theme = uiTheme;

  @state() accessor #requesting = false;
  @state() accessor #error: string | null = null;

  @query('debug-panel') accessor debugPanel!: DebugPanel;

  #processor = v0_8.Data.createSignalA2uiMessageProcessor();
  #a2uiClient = new A2UIClient();

  static styles = [
    unsafeCSS(v0_8.Styles.structuralStyles),
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background: linear-gradient(to bottom right, #0f172a, #1e293b);
        color: #f1f5f9;
        font-family: 'Roboto', sans-serif;
      }

      header {
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        padding: 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        flex-shrink: 0;
      }
      
      h1 { margin: 0; font-size: 1.2rem; font-weight: 500; letter-spacing: 0.5px; }

      main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .gallery-pane {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        border-right: 1px solid rgba(148, 163, 184, 0.1);
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 800px; /* Reasonable reading width */
        margin: 0 auto;
        width: 100%;
      }
      
      .demo-card {
        background: rgba(30, 41, 59, 0.4);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 16px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      .demo-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        padding-bottom: 12px;
      }
      
      .demo-title {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 500;
        color: #f8fafc;
      }
      
      .demo-desc {
        margin: 0;
        font-size: 0.9rem;
        color: #94a3b8;
        line-height: 1.5;
      }
      
      .demo-content {
        flex: 1;
        min-height: 80px; /* Ensure space for component */
        padding: 8px 0;
      }
      
      .action-row {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid rgba(148, 163, 184, 0.1);
        padding-top: 16px;
      }
      
      button.log-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        padding: 8px 20px;
        color: #38bdf8;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      button.log-btn:hover {
        background: var(--md-sys-color-surface-container-high);
      }
      
      .response-pane {
        flex: 0 0 320px;
        overflow-y: auto;
        padding: 24px;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(12px);
        border-left: 1px solid rgba(148, 163, 184, 0.1);
      }
      
      .footer {
        flex-shrink: 0;
      }
      
      .placeholder {
        color: var(--md-sys-color-outline);
        font-style: italic;
        text-align: center;
        margin-top: 40px;
        grid-column: 1 / -1;
      }
    `
  ];

  async connectedCallback() {
    super.connectedCallback();
    await this.#initiateSession();
  }

  async #initiateSession() {
    const message: v0_8.Types.A2UIClientEventMessage = {
      request: "START_GALLERY"
    };
    await this.#sendAndProcessMessage(message);
  }

  render() {
    return html`
      <header>
        <h1>A2UI Component Gallery</h1>
      </header>
      <main>
        <section class="gallery-pane">
           ${this.#renderGalleryItems()}
        </section>
        <section class="response-pane">
            ${this.#renderSurface('response-surface')}
        </section>
      </main>
      <div class="footer">
        <debug-panel ?isOpen=${true}></debug-panel>
      </div>
    `;
  }

  #renderGalleryItems() {
    // Check if we have at least one surface loaded to verify connection
    if (this.#processor.getSurfaces().size === 0) {
      return html`<div class="placeholder">Loading Gallery...</div>`;
    }

    return DEMO_ITEMS.map(item => html`
        <div class="demo-card">
            <div class="demo-header">
                <h3 class="demo-title">${item.title}</h3>
                <p class="demo-desc">${item.description}</p>
            </div>
            <div class="demo-content">
                ${this.#renderSurface(item.id)}
            </div>
            ${item.actionButton ? html`
                <div class="action-row">
                    <button class="log-btn" @click=${() => this.#logValue(item)}>
                        Log Value
                    </button>
                </div>
            ` : nothing}
        </div>
      `);
  }

  #renderSurface(surfaceId: string) {
    const surface = this.#processor.getSurfaces().get(surfaceId);
    if (!surface) return html`<!-- Surface ${surfaceId} not found -->`;

    // Need to spread surface to ensure reactivity?
    return html`
        <a2ui-surface
            .surface=${{ ...surface }}
            .surfaceId=${surfaceId}
            .processor=${this.#processor}
            @a2uiaction=${(evt: any) => this.#handleAction(evt, surfaceId)}
        ></a2ui-surface>
      `;
  }

  // Manual Log Action from Client shell
  #logValue(item: DemoItem) {
    // Map item IDs to data paths based on knowledge of gallery_examples.py
    const pathMap: Record<string, string> = {
      "demo-text": "galleryData/textField",
      "demo-checkbox": "galleryData/checkbox",
      "demo-slider": "galleryData/slider",
      "demo-date": "galleryData/date",
      "demo-multichoice": "galleryData/favorites",
      "demo-multichoice-chips": "galleryData/favoritesChips",
      "demo-multichoice-filter": "galleryData/favoritesFilter"
    };

    const path = pathMap[item.id];
    if (!path) return;

    // We must pass a mock node because getData expects a component to resolve paths relative to.
    const mockNode: any = { dataContextPath: "/" };

    // Resolve path. Try surface-specific first, then default.
    let value = this.#processor.getData(mockNode, path, item.id);
    if (value === null) {
      value = this.#processor.getData(mockNode, path, v0_8.Data.A2uiMessageProcessor.DEFAULT_SURFACE_ID);
    }

    // Construct context for the action
    const context = {
      path,
      value: String(value),
      component: item.title
    };

    const message: v0_8.Types.A2UIClientEventMessage = {
      userAction: {
        surfaceId: item.id,
        name: "shell_log_value",
        sourceComponentId: "shell-log-btn",
        timestamp: new Date().toISOString(),
        context
      }
    };

    this.#sendAndProcessMessage(message);
  }

  async #handleAction(evt: any, surfaceId: string) {
    const { action, dataContextPath, sourceComponent } = evt.detail;
    const target = evt.composedPath()[0] as HTMLElement;

    const context: any = {};
    if (action.context) {
      for (const item of action.context) {
        if (item.value.literalBoolean !== undefined) context[item.key] = item.value.literalBoolean;
        else if (item.value.literalNumber !== undefined) context[item.key] = item.value.literalNumber;
        else if (item.value.literalString !== undefined) context[item.key] = item.value.literalString;
        else if (item.value.path) {
          const path = this.#processor.resolvePath(item.value.path, dataContextPath);
          const value = this.#processor.getData(sourceComponent, path, surfaceId);
          context[item.key] = value;
        }
      }
    }

    // Log locally too
    this.#log('info', `Action Triggered: ${action.name}`, context);

    const message: v0_8.Types.A2UIClientEventMessage = {
      userAction: {
        surfaceId,
        name: action.name,
        sourceComponentId: target.id || 'unknown',
        timestamp: new Date().toISOString(),
        context
      }
    };

    await this.#sendAndProcessMessage(message);
  }

  async #sendAndProcessMessage(message: v0_8.Types.A2UIClientEventMessage) {
    this.#requesting = true;

    // Log Outgoing
    this.#log('outgoing', message.userAction ? `Action: ${message.userAction.name}` : `Request: ${message.request}`, message);

    try {
      const response = await this.#a2uiClient.send(message);

      // Log Incoming
      if (response.length > 0) {
        this.#log('incoming', `Received ${response.length} messages`, response);
      } else {
        this.#log('info', 'Received empty response (ACK)', {});
      }

      this.#processor.processMessages(response);
      this.requestUpdate();

    } catch (err) {
      this.#error = String(err);
      this.#log('info', `Error: ${err}`, { error: err });
    } finally {
      this.#requesting = false;
    }
  }

  #log(type: 'incoming' | 'outgoing' | 'info', summary: string, detail: any) {
    if (this.debugPanel) {
      this.debugPanel.addLog(type, summary, detail);
    }
  }
}
