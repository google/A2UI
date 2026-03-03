import { SignalWatcher } from "@lit-labs/signals";
import { provide } from "@lit/context";
import { LitElement, html, css, unsafeCSS } from "lit";
import { customElement, state } from "lit/decorators.js";
import { theme as uiTheme } from "./theme.js";
import { v0_8 } from "@a2ui/lit";
import * as UI from "@a2ui/lit/ui";
import { renderMarkdown } from "@a2ui/markdown-it";

interface DemoItem {
  id: string;
  title: string;
  filename: string;
  description: string;
}

@customElement("local-gallery")
export class LocalGallery extends SignalWatcher(LitElement) {

  @provide({ context: UI.Context.theme })
  accessor theme: v0_8.Types.Theme = uiTheme;

  @provide({ context: UI.Context.markdown })
  accessor markdownRenderer: v0_8.Types.MarkdownRenderer = renderMarkdown;

  @state() accessor #mockLogs: string[] = [];
  @state() accessor #demoItems: DemoItem[] = [];

  #processor = v0_8.Data.createSignalA2uiMessageProcessor();

  static styles = [
    unsafeCSS(v0_8.Styles.structuralStyles),
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background: #0f172a;
        color: #f1f5f9;
      }

      header {
        padding: 24px;
        background: rgba(15, 23, 42, 0.8);
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        text-align: center;
        flex-shrink: 0;
      }

      h1 { margin: 0; font-size: 1.5rem; }
      p.subtitle { color: #94a3b8; margin: 8px 0 0 0; font-size: 0.9rem; }

      main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .gallery-pane {
        flex: 1;
        overflow-y: auto;
        padding: 40px 20px;
        display: flex;
        flex-direction: column;
        gap: 40px;
        align-items: center;
      }

      .demo-card {
        width: 100%;
        max-width: 600px;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0; /* Ensure it takes full height needed */
      }

      .demo-header {
        padding: 16px 20px;
        background: rgba(15, 23, 42, 0.3);
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      }

      .demo-title { margin: 0; font-size: 1.1rem; color: #38bdf8; }
      .demo-desc { margin: 4px 0 0 0; font-size: 0.85rem; color: #94a3b8; }

      .demo-content {
        padding: 24px;
        min-height: 100px;
        height: auto; /* Allow content to expand */
        overflow: visible;
      }

      .log-pane {
        width: 350px;
        background: #020617;
        border-left: 1px solid rgba(148, 163, 184, 0.1);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }

      .log-header {
        padding: 16px;
        font-weight: bold;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      }

      .log-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        display: flex;
        flex-direction: column-reverse;
        gap: 8px;
      }

      .log-entry {
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        border-left: 2px solid #38bdf8;
      }

      .log-time { color: #475569; margin-right: 8px; }
    `
  ];

  async connectedCallback() {
    super.connectedCallback();
    await this.#loadExamples();
  }

  async #loadExamples() {
    try {
      const indexResp = await fetch('./specs/v0_8/minimal/examples/index.json');
      if (!indexResp.ok) throw new Error(`Could not load manifest (HTTP ${indexResp.status})`);
      const filenames = await indexResp.json() as string[];

      this.#demoItems = filenames.map(filename => ({
        id: filename.replace('.json', ''),
        title: filename.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace('.json', ''),
        filename: filename,
        description: `Source: ${filename}`
      }));

      for (const item of this.#demoItems) {
        try {
          const response = await fetch(`./specs/v0_8/minimal/examples/${item.filename}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const messages = await response.json();
          
          // Detect actual surfaceId used in the file
          const firstMessage = messages.find((m: any) => 
            m.surfaceUpdate?.surfaceId || 
            m.beginRendering?.surfaceId || 
            m.dataModelUpdate?.surfaceId
          );
          const actualId = firstMessage?.surfaceUpdate?.surfaceId || 
                           firstMessage?.beginRendering?.surfaceId || 
                           firstMessage?.dataModelUpdate?.surfaceId;
          
          if (actualId && actualId !== item.id) {
            item.id = actualId;
          }

          this.#processor.processMessages(messages);
          this.#log(`Loaded ${item.filename} (Surface: ${item.id})`);
        } catch (err) {
          this.#log(`Error loading ${item.filename}: ${err}`);
        }
      }
    } catch (err) {
      this.#log(`Failed to initiate gallery: ${err}`);
    }
    this.requestUpdate();
  }

  #log(msg: string, detail?: any) {
    const time = new Date().toLocaleTimeString();
    const entry = detail ? `${msg} ${JSON.stringify(detail)}` : msg;
    this.#mockLogs = [...this.#mockLogs, `[${time}] ${entry}`];
  }

  #handleAction(evt: any, surfaceId: string) {
    const { action } = evt.detail;
    this.#log(`Action from ${surfaceId}: ${action.name}`, action.context);
    
    // Simple mock response for Example 4
    if (action.name === 'login_submitted') {
      setTimeout(() => {
        const user = action.context.find((c: any) => c.key === 'user')?.value.literalString || 'Unknown';
        this.#log(`Mock Server: Authenticating ${user}...`);
        
        // Push a mock update back to the UI
        this.#processor.processMessages([{
            surfaceUpdate: {
                surfaceId: surfaceId, // Target the actual surface that triggered it
                components: [{
                    id: 'status_msg',
                    component: { Text: { text: { literalString: `Welcome back, ${user}! (Mock Auth Success)` }, usageHint: 'caption' } }
                }]
            }
        }, {
            surfaceUpdate: {
                surfaceId: surfaceId,
                components: [{
                    id: 'root',
                    component: {
                        Column: {
                            children: { explicitList: ['form_title', 'status_msg'] }
                        }
                    }
                }]
            }
        }]);
        this.requestUpdate();
      }, 1000);
    }
  }

  render() {
    return html`
      <header>
        <h1>A2UI Local Gallery</h1>
        <p class="subtitle">v0.8 Minimal Catalog Subset - Agentless Static Testing</p>
      </header>
      <main>
        <section class="gallery-pane">
           ${this.#demoItems.length === 0 
              ? html`<div style="color: #64748b">Loading examples from manifest...</div>`
              : this.#demoItems.map(item => this.#renderDemoCard(item))}
        </section>
        <aside class="log-pane">
          <div class="log-header">Mock Agent Console</div>
          <div class="log-list">
            ${this.#mockLogs.map(log => html`<div class="log-entry">${log}</div>`)}
          </div>
        </aside>
      </main>
    `;
  }

  #renderDemoCard(item: DemoItem) {
    const surface = this.#processor.getSurfaces().get(item.id);
    
    return html`
      <div class="demo-card">
        <div class="demo-header">
          <h3 class="demo-title">${item.title}</h3>
          <p class="demo-desc">${item.description}</p>
        </div>
        <div class="demo-content">
          ${surface ? html`
            <a2ui-surface
              .surface=${{ ...surface }}
              .surfaceId=${item.id}
              .processor=${this.#processor}
              @a2uiaction=${(evt: any) => this.#handleAction(evt, item.id)}
            ></a2ui-surface>
          ` : html`<div style="color: #64748b">Surface ${item.id} not initialized...</div>`}
        </div>
      </div>
    `;
  }
}
