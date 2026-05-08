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

import {LitElement, html, css, nothing} from 'lit';
import {provide} from '@lit/context';
import {customElement, state} from 'lit/decorators.js';
import {MessageProcessor} from '@a2ui/web_core/v0_9';
import {basicCatalog, Context} from '@a2ui/lit/v0_9';
import {renderMarkdown} from '@a2ui/markdown-it';
import {getDemoItems, DemoItem} from './examples';
import {appStyles} from './local-gallery.css';

@customElement('local-gallery')
export class LocalGallery extends LitElement {
  @state() accessor mockLogs: string[] = [];
  @state() accessor demoItems: DemoItem[] = [];
  @state() accessor activeItemIndex = 0;
  @state() accessor processedMessageCount = 0;
  @state() accessor currentDataModelText = '{}';

  @provide({context: Context.markdown})
  private accessor markdownRenderer = renderMarkdown;

  private processor = new MessageProcessor([basicCatalog], (action: any) => {
    this.log(`Action dispatched: ${action.surfaceId}`, action);
  });

  private dataModelSubscription?: {unsubscribe: () => void};

  static styles = [appStyles];

  async connectedCallback() {
    super.connectedCallback();

    this.processor.model.onSurfaceCreated.subscribe((surface: any) => {
      surface.onError.subscribe((err: any) => {
        this.log(`Error on surface ${surface.id}: ${err.message}`, err);
      });
    });

    this.loadExamples();
  }

  loadExamples() {
    try {
      this.demoItems = getDemoItems();
      if (this.demoItems.length > 0) {
        this.selectItem(0);
      }
    } catch (err) {
      console.error(`Failed to initiate gallery:`, err);
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
    this.currentDataModelText = '{}';

    // Clear old surface and subscriptions
    if (this.dataModelSubscription) {
      this.dataModelSubscription.unsubscribe();
      this.dataModelSubscription = undefined;
    }

    const item = this.demoItems[this.activeItemIndex];
    if (item && this.processor.model.getSurface(item.id)) {
      this.processor.processMessages([{version: 'v0.9', deleteSurface: {surfaceId: item.id}}]);
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
        this.dataModelSubscription = surface.dataModel.subscribe('/', val => {
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
    const surface = activeItem ? this.processor.model.getSurface(activeItem.id) : undefined;
    const canAdvance = activeItem && this.processedMessageCount < activeItem.messages.length;

    return html`
      <header>
        <div>
          <h1>A2UI Explorer</h1>
          <p class="subtitle">v0.9 Basic Catalog</p>
        </div>
      </header>
      <main>
        <nav class="nav-pane">
          ${this.demoItems.map(
            (item, i) => html`
              <div
                class="nav-item ${i === this.activeItemIndex ? 'active' : ''}"
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
              <h2 style="margin:0">${activeItem?.title || 'No selection'}</h2>
              <p style="margin:4px 0 0 0; font-size:0.9rem; color:#94a3b8">
                ${activeItem?.description}
              </p>
            </div>
            <div class="stepper-controls">
              <span style="font-size:0.9rem; margin-right:8px; color:#94a3b8">
                Messages: ${this.processedMessageCount} / ${activeItem?.messages.length || 0}
              </span>
              <button @click=${() => this.resetSurface()}>Reset</button>
              <button @click=${() => this.advanceMessages(false)} ?disabled=${!canAdvance}>
                +1 Message
              </button>
              <button @click=${() => this.advanceMessages(true)} ?disabled=${!canAdvance}>
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
              ${this.mockLogs.map(log => html`<div class="log-entry">${log}</div>`)}
            </div>
          </div>
        </aside>
      </main>
    `;
  }
}
