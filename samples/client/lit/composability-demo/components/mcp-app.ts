/*
 * Copyright 2026 Google LLC
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

import {html, css, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ComponentContext} from '@a2ui/web_core/v0_9';

@customElement('a2ui-mcp-app')
export class A2uiMcpApp extends LitElement {
  @property({type: Object}) accessor context!: ComponentContext;

  @property({type: String}) accessor htmlContent = '';
  @property({type: Number}) accessor height: number | undefined = undefined;
  @property({type: Array}) accessor allowedTools: string[] = [];

  @query('iframe') accessor iframe!: HTMLIFrameElement;

  private messageHandler: any = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      border: 1px solid var(--a2ui-color-border, #eee);
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background: #fff;
      box-sizing: border-box;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #f5f5f5;
      transition: height 0.3s ease-out, min-width 0.3s ease-out;
    }
  `;

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);
    
    // Bind properties dynamically from A2UI context if available
    if (this.context && this.context.componentModel) {
      const props = this.context.componentModel.properties || {};
      this.htmlContent = props.htmlContent || '';
      this.height = props.height;
      this.allowedTools = props.allowedTools || [];
    }

    if (this.iframe && this.htmlContent && !this.messageHandler) {
      this.initializeSandbox();
    }
  }

  disconnectedCallback() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    super.disconnectedCallback();
  }

  render() {
    const style = this.height ? `height: ${this.height}px;` : 'aspect-ratio: 4/3;';
    return html`
      <div style="position: relative; width: 100%; ${style}">
        <iframe
          id="mcp-sandbox"
          referrerpolicy="origin"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
    `;
  }

  async initializeSandbox() {
    const iframe = this.iframe;
    const allowedTools = this.allowedTools;
    const htmlContent = this.htmlContent;

    const sandboxUrl = `${window.location.origin}/shared/mcp_apps_inner_iframe/sandbox.html?disable_security_self_test=true`;
    const readyNotification = 'ui/notifications/sandbox-proxy-ready';

    const proxyReady = new Promise(resolve => {
      const listener = ({source, data, origin}: MessageEvent) => {
        if (
          source === iframe.contentWindow &&
          origin === window.location.origin &&
          data?.method === readyNotification
        ) {
          window.removeEventListener('message', listener);
          resolve(true);
        }
      };
      window.addEventListener('message', listener);
    });

    iframe.src = sandboxUrl;
    await proxyReady;

    // Connect via postMessage JSON-RPC
    const msgId = 1;
    iframe.contentWindow!.postMessage({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        clientInfo: { name: 'A2UI Client Host', version: '1.0.0' },
        capabilities: { serverTools: {}, updateModelContext: { text: {} } },
        configuration: { hostContext: { theme: 'light', platform: 'web', displayMode: 'inline' } }
      },
      id: msgId
    }, window.location.origin);

    this.messageHandler = async ({source, data, origin}: MessageEvent) => {
      if (source !== iframe.contentWindow || origin !== window.location.origin) return;

      // Handle auto-resize size changes
      if (data.method === 'ui/notifications/size-changed' || data.method === 'size-changed') {
        const {width, height} = data.params || {};
        if (width !== undefined) {
          iframe.style.minWidth = `min(${width}px, 100%)`;
        }
        if (height !== undefined) {
          iframe.style.height = `${height}px`;
        }
      }

      // Forward whitelisted tool calls to the A2UI action system
      if (data.method === 'ui/requests/call-tool' || data.method === 'call-tool') {
        const {name, arguments: args} = data.params || {};
        const requestId = data.id;

        if (allowedTools.includes(name)) {
          if (this.context && this.context.dispatchAction) {
            this.context.dispatchAction({
              event: {
                name: name,
                context: args || {}
              }
            });
          }

          iframe.contentWindow!.postMessage({
            jsonrpc: '2.0',
            result: { content: [{ type: 'text', text: 'Action dispatched to A2UI Agent' }] },
            id: requestId
          }, window.location.origin);
        } else {
          console.warn(`[McpApp] Tool '${name}' rejected.`);
          iframe.contentWindow!.postMessage({
            jsonrpc: '2.0',
            error: { code: -32601, message: 'Tool not allowed' },
            id: requestId
          }, window.location.origin);
        }
      }
    };

    window.addEventListener('message', this.messageHandler);

    // Trigger sandbox inner loading
    iframe.contentWindow!.postMessage({
      jsonrpc: '2.0',
      method: 'ui/notifications/sandbox-resource-ready',
      params: {
        html: htmlContent,
        sandbox: 'allow-scripts allow-forms allow-popups allow-modals'
      }
    }, window.location.origin);
  }
}

export const McpApp = {
  name: 'McpApp',
  tagName: 'a2ui-mcp-app',
  schema: { parse: (v: any) => v }
};
