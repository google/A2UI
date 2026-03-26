/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LitElement, html, css, nothing } from "lit";
import { provide } from "@lit/context";
import { customElement, state } from "lit/decorators.js";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import { minimalCatalog, basicCatalog, Context } from "@a2ui/lit/v0_9";
import { renderMarkdown } from "@a2ui/markdown-it";
// Try avoiding direct deep import if A2uiMessage is not exported at the top level, using any for now as this is just a type for the array of messages
interface DemoItem {
  id: string;
  title: string;
  filename: string;
  description: string;
  messages: any[];
  isBasic?: boolean;
}

@customElement("local-gallery")
export class LocalGallery extends LitElement {
  @state() accessor mockLogs: string[] = [];
  @state() accessor demoItems: DemoItem[] = [];
  @state() accessor activeItemIndex = 0;
  @state() accessor processedMessageCount = 0;
  @state() accessor currentDataModelText = "{}";

  @provide({ context: Context.markdown })
  private accessor markdownRenderer = renderMarkdown;

  private processor = new MessageProcessor(
    [minimalCatalog, basicCatalog],
    (action: any) => {
      this.log(`Action dispatched: ${action.surfaceId}`, action);
    },
  );

  private dataModelSubscription?: { unsubscribe: () => void };

  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background: #0f172a;
        color: #f1f5f9;
        font-family: system-ui, sans-serif;
      }

      header {
        padding: 16px 24px;
        background: rgba(15, 23, 42, 0.8);
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
      }
      p.subtitle {
        color: #94a3b8;
        margin: 4px 0 0 0;
        font-size: 0.9rem;
      }

      main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .nav-pane {
        width: 250px;
        background: #1e293b;
        border-right: 1px solid rgba(148, 163, 184, 0.1);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }

      .nav-item {
        padding: 16px;
        cursor: pointer;
        border-bottom: 1px solid rgba(148, 163, 184, 0.05);
        transition: background 0.2s;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .nav-item.active {
        background: rgba(56, 189, 248, 0.1);
        border-left: 4px solid #38bdf8;
      }

      .nav-title {
        margin: 0 0 4px 0;
        font-size: 0.95rem;
        font-weight: 500;
      }
      .nav-desc {
        margin: 0;
        font-size: 0.8rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .gallery-pane {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #0f172a;
        overflow: hidden;
      }

      .preview-header {
        padding: 16px;
        background: #1e293b;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stepper-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      button {
        background: #38bdf8;
        color: #0f172a;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover {
        background: #7dd3fc;
      }
      button:disabled {
        background: #475569;
        color: #94a3b8;
        cursor: not-allowed;
      }

      .preview-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        justify-content: center;
      }

      .surface-container {
        width: 100%;
        max-width: 600px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 8px;
        padding: 24px;
      }

      .inspector-pane {
        width: 400px;
        display: flex;
        flex-direction: column;
        border-left: 1px solid rgba(148, 163, 184, 0.1);
        background: #020617;
      }

      .inspector-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        overflow: hidden;
      }

      .inspector-header {
        padding: 12px 16px;
        background: #1e293b;
        font-weight: bold;
        font-size: 0.8rem;
        text-transform: uppercase;
        color: #94a3b8;
      }

      .inspector-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8rem;
        white-space: pre-wrap;
      }

      .log-list {
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
    `,
  ];

  async connectedCallback() {
    super.connectedCallback();

    this.processor.model.onSurfaceCreated.subscribe((surface: any) => {
      surface.onError.subscribe((err: any) => {
        this.log(`Error on surface ${surface.id}: ${err.message}`, err);
      });
    });

    await this.loadExamples();
  }

  async loadExamples() {
    try {
      const items: DemoItem[] = [];
      await this.fetchExamplesFrom(
        "./specs/v0_9/minimal/examples",
        items,
        false,
      );
      await this.fetchExamplesFrom("./specs/v0_9/basic/examples", items, true);

      this.demoItems = items;
      if (items.length > 0) {
        this.selectItem(0);
      }
    } catch (err) {
      console.error(`Failed to initiate gallery:`, err);
    }
  }

  async fetchExamplesFrom(dir: string, items: DemoItem[], isBasic: boolean) {
    try {
      const indexResp = await fetch(`${dir}/index.json`);
      if (!indexResp.ok) throw new Error(`Could not load manifest from ${dir}`);
      const filenames = (await indexResp.json()) as string[];

      for (const filename of filenames) {
        try {
          const response = await fetch(`${dir}/${filename}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const messages = Array.isArray(data) ? data : data.messages || [];

          let surfaceId = filename.replace(".json", "");
          const createMsg = messages.find((m: any) => m.createSurface);
          if (createMsg) {
            surfaceId = createMsg.createSurface.surfaceId;
          } else {
            messages.unshift({
              version: "v0.9",
              createSurface: {
                surfaceId,
                catalogId: isBasic ? basicCatalog.id : minimalCatalog.id,
              },
            });
          }

          items.push({
            id: surfaceId,
            title: filename
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
              .replace(".json", ""),
            filename: filename,
            description: data.description || `Source: ${filename}`,
            messages: messages,
            isBasic,
          });
        } catch (err) {
          console.error(`Error loading ${filename}:`, err);
        }
      }
    } catch (e) {
      console.warn(`Could not load ${dir}`, e);
    }
  }

  selectItem(index: number) {
    this.activeItemIndex = index;
    this.resetSurface();
    this.advanceMessages(true);
  }

  resetSurface() {
    this.processedMessageCount = 0;
    this.mockLogs = [];
    this.currentDataModelText = "{}";

    // Clear old surface and subscriptions
    if (this.dataModelSubscription) {
      this.dataModelSubscription.unsubscribe();
      this.dataModelSubscription = undefined;
    }

    const item = this.demoItems[this.activeItemIndex];
    if (item && this.processor.model.getSurface(item.id)) {
      this.processor.processMessages([
        { version: "v0.9", deleteSurface: { surfaceId: item.id } },
      ]);
    }
  }

  advanceMessages(all = false) {
    const item = this.demoItems[this.activeItemIndex];
    if (!item) return;

    const toProcess = all
      ? item.messages.slice(this.processedMessageCount)
      : [item.messages[this.processedMessageCount]];

    if (toProcess.length === 0) return;

    this.processor.processMessages(toProcess);
    this.processedMessageCount += toProcess.length;

    // Subscribe to data model on first advance if not already subscribed
    if (!this.dataModelSubscription) {
      const surface = this.processor.model.getSurface(item.id);
      if (surface) {
        this.dataModelSubscription = surface.dataModel.subscribe("/", (val) => {
          this.currentDataModelText = JSON.stringify(val || {}, null, 2);
        });
      }
    }
  }

  log(msg: string, detail?: any) {
    const time = new Date().toLocaleTimeString();
    const entry = detail ? `${msg}\n${JSON.stringify(detail, null, 2)}` : msg;
    this.mockLogs = [...this.mockLogs, `[${time}] ${entry}`];
  }

  render() {
    const activeItem = this.demoItems[this.activeItemIndex];
    const surface = activeItem
      ? this.processor.model.getSurface(activeItem.id)
      : undefined;
    const canAdvance =
      activeItem && this.processedMessageCount < activeItem.messages.length;

    return html`
      <header>
        <div>
          <h1>A2UI Local Gallery</h1>
          <p class="subtitle">v0.9 Minimal Catalog</p>
        </div>
      </header>
      <main>
        <nav class="nav-pane">
          ${this.demoItems.map(
            (item, i) => html`
              <div
                class="nav-item ${i === this.activeItemIndex ? "active" : ""}"
                @click=${() => this.selectItem(i)}
              >
                <h3 class="nav-title">${item.title}</h3>
                <p class="nav-desc">${item.filename}</p>
              </div>
            `,
          )}
        </nav>

        <section class="gallery-pane">
          <div class="preview-header">
            <div>
              <h2 style="margin:0">${activeItem?.title || "No selection"}</h2>
              <p style="margin:4px 0 0 0; font-size:0.9rem; color:#94a3b8">
                ${activeItem?.description}
              </p>
            </div>
            <div class="stepper-controls">
              <span style="font-size:0.9rem; margin-right:8px; color:#94a3b8">
                Messages: ${this.processedMessageCount} /
                ${activeItem?.messages.length || 0}
              </span>
              <button @click=${() => this.resetSurface()}>Reset</button>
              <button
                @click=${() => this.advanceMessages(false)}
                ?disabled=${!canAdvance}
              >
                +1 Message
              </button>
              <button
                @click=${() => this.advanceMessages(true)}
                ?disabled=${!canAdvance}
              >
                All Messages
              </button>
            </div>
          </div>

          <div class="preview-content">
            <div class="surface-container">
              ${surface
                ? html`<a2ui-surface .surface=${surface}></a2ui-surface>`
                : html`<div style="color: #64748b; text-align:center;">
                    Surface not initialized. Click '+1 Message' to begin.
                  </div>`}
            </div>
          </div>
        </section>

        <aside class="inspector-pane">
          <div class="inspector-section">
            <div class="inspector-header">Data Model</div>
            <div class="inspector-body">${this.currentDataModelText}</div>
          </div>
          <div class="inspector-section">
            <div class="inspector-header">Action Logs</div>
            <div class="inspector-body log-list">
              ${this.mockLogs.length === 0
                ? html`<span style="color:#475569">No actions logged...</span>`
                : nothing}
              ${this.mockLogs.map(
                (log) => html`<div class="log-entry">${log}</div>`,
              )}
            </div>
          </div>
        </aside>
      </main>
    `;
  }
}
