/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { theme as uiTheme, ThemeConfig } from "./theme/default-theme.js";
import { A2UIClient, ServerToClientMessage } from "./client.js";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  a2uiMessages?: ServerToClientMessage[];
}

@customElement("a2ui-playground")
export class A2UIPlayground extends LitElement {
  @state()
  private accessor messages: ChatMessage[] = [];

  @state()
  private accessor isLoading = false;

  @state()
  private accessor error: string | null = null;

  @state()
  private accessor currentInput = "";

  @state()
  private accessor showInspector = true;

  @state()
  private accessor lastA2UIMessages: ServerToClientMessage[] = [];

  private client: A2UIClient | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background: var(--surface);
      color: var(--on-surface);
      font-family: var(--font-family);
    }

    /* Header */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--surface-container);
      border-bottom: 1px solid var(--outline-variant);
      gap: 12px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 18px;
      color: var(--p-40);
    }

    .logo .g-icon {
      font-size: 28px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--on-surface-variant);
      cursor: pointer;
      transition: background 0.2s;
    }

    .icon-btn:hover {
      background: var(--surface-container);
    }

    .icon-btn.active {
      background: var(--p-90);
      color: var(--p-40);
    }

    /* Main content */
    main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Chat panel */
    .chat-panel {
      display: flex;
      flex-direction: column;
      width: 360px;
      min-width: 280px;
      border-right: 1px solid var(--outline-variant);
      background: var(--surface);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-width: 90%;
      padding: 12px;
      border-radius: 12px;
      line-height: 1.5;
    }

    .message.user {
      align-self: flex-end;
      background: var(--p-90);
      color: var(--p-10);
    }

    .message.assistant {
      align-self: flex-start;
      background: var(--surface-container);
      color: var(--on-surface);
    }

    .message-time {
      font-size: 11px;
      opacity: 0.6;
    }

    .chat-input-container {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid var(--outline-variant);
      background: var(--surface-container);
    }

    .chat-input-container input {
      flex: 1;
      padding: 12px;
      border: 1px solid var(--outline-variant);
      border-radius: 24px;
      font-size: 14px;
      background: var(--surface);
      color: var(--on-surface);
      outline: none;
    }

    .chat-input-container input:focus {
      border-color: var(--p-60);
    }

    .send-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: var(--p-40);
      color: white;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-btn:not(:disabled):hover {
      background: var(--p-30);
    }

    /* Preview panel */
    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--surface);
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-bottom: 1px solid var(--outline-variant);
      background: var(--surface-container);
    }

    .preview-header h2 {
      font-size: 14px;
      font-weight: 500;
      color: var(--on-surface-variant);
      margin: 0;
    }

    .preview-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .preview-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--on-surface-variant);
      text-align: center;
      gap: 12px;
    }

    .preview-empty .g-icon {
      font-size: 64px;
      opacity: 0.3;
    }

    /* A2UI Preview - simple renderer */
    .a2ui-preview {
      padding: 16px;
      background: var(--surface-container);
      border-radius: 12px;
    }

    .a2ui-component {
      margin: 8px 0;
    }

    .a2ui-card {
      background: var(--surface);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }

    .a2ui-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .a2ui-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .a2ui-text {
      line-height: 1.5;
    }

    .a2ui-heading {
      font-weight: 600;
    }

    .a2ui-button {
      background: var(--p-40);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }

    .a2ui-image {
      max-width: 100%;
      border-radius: 8px;
    }

    /* Inspector panel */
    .inspector-panel {
      width: 400px;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--outline-variant);
      background: var(--surface);
    }

    .inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-bottom: 1px solid var(--outline-variant);
      background: var(--surface-container);
    }

    .inspector-header h2 {
      font-size: 14px;
      font-weight: 500;
      color: var(--on-surface-variant);
      margin: 0;
    }

    .inspector-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .json-block {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 12px;
      line-height: 1.6;
      background: #1a1a2e;
      color: #e0e0e0;
      padding: 12px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-break: break-all;
      margin-bottom: 8px;
    }

    /* Loading state */
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: var(--on-surface-variant);
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--outline-variant);
      border-top-color: var(--p-60);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error state */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fceeee;
      color: #b3261e;
      border-bottom: 1px solid #f2b8b5;
    }

    .error-banner .g-icon {
      color: #b3261e;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      this.client = new A2UIClient();
      this.error = null;
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to initialize client";
    }
  }

  private async handleSend(): Promise<void> {
    if (!this.currentInput.trim() || !this.client || this.isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: this.currentInput.trim(),
      timestamp: new Date(),
    };

    this.messages = [...this.messages, userMessage];
    this.currentInput = "";
    this.isLoading = true;
    this.error = null;

    try {
      const a2uiMessages = await this.client.send(userMessage.content);

      this.lastA2UIMessages = a2uiMessages;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "UI generated successfully",
        timestamp: new Date(),
        a2uiMessages,
      };

      this.messages = [...this.messages, assistantMessage];
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to generate response";
    } finally {
      this.isLoading = false;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  private toggleInspector(): void {
    this.showInspector = !this.showInspector;
  }

  private toggleTheme(): void {
    const { colorScheme } = window.getComputedStyle(document.body);
    if (colorScheme === "dark") {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    } else {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    }
  }

  private clearChat(): void {
    this.messages = [];
    this.lastA2UIMessages = [];
    this.client?.clearHistory();
  }

  // Simple A2UI renderer
  private renderA2UIComponent(component: any, components: Map<string, any>): any {
    if (!component || !component.component) return nothing;

    const comp = component.component;
    const type = Object.keys(comp)[0];
    const props = comp[type];

    switch (type) {
      case "Column":
        return html`
          <div class="a2ui-column a2ui-component">
            ${this.renderChildren(props.children, components)}
          </div>
        `;
      case "Row":
        return html`
          <div class="a2ui-row a2ui-component">
            ${this.renderChildren(props.children, components)}
          </div>
        `;
      case "Card":
        const cardChild = components.get(props.child);
        return html`
          <div class="a2ui-card a2ui-component">
            ${cardChild ? this.renderA2UIComponent(cardChild, components) : nothing}
          </div>
        `;
      case "Text":
        const text = props.text?.literalString || props.text?.path || "";
        return html`<p class="a2ui-text a2ui-component">${text}</p>`;
      case "Heading":
        const heading = props.text?.literalString || props.text?.path || "";
        return html`<h3 class="a2ui-heading a2ui-component">${heading}</h3>`;
      case "Button":
        const label = props.label?.literalString || "Button";
        return html`<button class="a2ui-button a2ui-component">${label}</button>`;
      case "Image":
        const url = props.url?.literalString || "";
        return html`<img class="a2ui-image a2ui-component" src="${url}" alt="Image" />`;
      default:
        return html`<div class="a2ui-component">[${type}]</div>`;
    }
  }

  private renderChildren(children: any, components: Map<string, any>): any {
    if (!children) return nothing;

    const childIds = children.explicitList || [];
    return childIds.map((id: string) => {
      const child = components.get(id);
      return child ? this.renderA2UIComponent(child, components) : nothing;
    });
  }

  private renderHeader() {
    return html`
      <header>
        <div class="logo">
          <span class="g-icon filled-heavy">widgets</span>
          A2UI Playground
        </div>
        <div class="header-actions">
          <button
            class="icon-btn ${this.showInspector ? "active" : ""}"
            @click=${this.toggleInspector}
            title="Toggle Inspector"
          >
            <span class="g-icon">code</span>
          </button>
          <button class="icon-btn" @click=${this.toggleTheme} title="Toggle Theme">
            <span class="g-icon">dark_mode</span>
          </button>
          <button class="icon-btn" @click=${this.clearChat} title="Clear Chat">
            <span class="g-icon">delete</span>
          </button>
        </div>
      </header>
    `;
  }

  private renderChatPanel() {
    return html`
      <div class="chat-panel">
        <div class="chat-messages">
          ${this.messages.length === 0
        ? html`
                <div class="preview-empty">
                  <span class="g-icon">chat</span>
                  <p>Start a conversation to generate UI</p>
                </div>
              `
        : repeat(
          this.messages,
          (msg) => msg.id,
          (msg) => html`
                  <div class="message ${msg.role}">
                    <div>${msg.content}</div>
                    <div class="message-time">
                      ${msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                `
        )}
          ${this.isLoading
        ? html`
                <div class="loading">
                  <div class="spinner"></div>
                  <span>Generating UI...</span>
                </div>
              `
        : nothing}
        </div>
        <div class="chat-input-container">
          <input
            id="chat-input"
            type="text"
            placeholder="Describe the UI you want..."
            .value=${this.currentInput}
            @input=${(e: InputEvent) => {
        this.currentInput = (e.target as HTMLInputElement).value;
      }}
            @keydown=${this.handleKeyDown}
            ?disabled=${this.isLoading}
          />
          <button
            class="send-btn"
            @click=${this.handleSend}
            ?disabled=${this.isLoading || !this.currentInput.trim()}
          >
            <span class="g-icon filled-heavy">send</span>
          </button>
        </div>
      </div>
    `;
  }

  private renderPreviewPanel() {
    // Build component map from messages
    const components = new Map<string, any>();
    let rootId: string | null = null;

    for (const msg of this.lastA2UIMessages) {
      if (msg.surfaceUpdate?.components) {
        for (const comp of msg.surfaceUpdate.components) {
          components.set(comp.id, comp);
        }
      }
      if (msg.beginRendering?.root) {
        rootId = msg.beginRendering.root;
      }
    }

    const hasContent = rootId && components.size > 0;
    const rootComponent = rootId ? components.get(rootId) : null;

    return html`
      <div class="preview-panel">
        <div class="preview-header">
          <h2>Preview</h2>
        </div>
        <div class="preview-content">
          ${!hasContent
        ? html`
                <div class="preview-empty">
                  <span class="g-icon">preview</span>
                  <p>No UI rendered yet</p>
                  <p style="font-size: 12px; opacity: 0.7;">
                    Send a message to generate A2UI
                  </p>
                </div>
              `
        : html`
                <div class="a2ui-preview">
                  ${this.renderA2UIComponent(rootComponent, components)}
                </div>
              `}
        </div>
      </div>
    `;
  }

  private renderInspectorPanel() {
    if (!this.showInspector) return nothing;

    return html`
      <div class="inspector-panel">
        <div class="inspector-header">
          <h2>A2UI Inspector</h2>
        </div>
        <div class="inspector-content">
          ${this.lastA2UIMessages.length === 0
        ? html`<p style="color: var(--on-surface-variant); text-align: center;">
                No messages yet
              </p>`
        : this.lastA2UIMessages.map(
          (msg) => html`
                  <pre class="json-block">${JSON.stringify(msg, null, 2)}</pre>
                `
        )}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      ${this.renderHeader()}
      ${this.error
        ? html`
            <div class="error-banner">
              <span class="g-icon">error</span>
              <span>${this.error}</span>
            </div>
          `
        : nothing}
      <main>
        ${this.renderChatPanel()}
        ${this.renderPreviewPanel()}
        ${this.renderInspectorPanel()}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "a2ui-playground": A2UIPlayground;
  }
}
