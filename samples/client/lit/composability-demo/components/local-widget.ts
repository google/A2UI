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
import {customElement, property} from 'lit/decorators.js';
import {ComponentContext} from '@a2ui/web_core/v0_9';

@customElement('a2ui-local-widget')
export class A2uiLocalWidget extends LitElement {
  @property({type: Object}) accessor context!: ComponentContext;

  static styles = css`
    :host {
      display: block;
      padding: 28px;
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
      color: white;
      border: none;
      border-radius: 0;
      font-family: 'Outfit', system-ui, sans-serif;
      box-sizing: border-box;
    }
    h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    p {
      margin: 0 0 16px 0;
      opacity: 0.9;
      font-size: 14px;
      line-height: 1.5;
    }
    button {
      background: white;
      color: #764ba2;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
    button:hover {
      background: #f3e8ff;
      transform: scale(1.05);
    }
  `;

  render() {
    return html`
      <h3>Local Interactive Widget</h3>
      <p>This component is statically compiled and pre-registered at compile-time. It has zero latency and persists across refreshes!</p>
      <button @click=${this.triggerAction}>Trigger Local Action</button>
    `;
  }

  triggerAction() {
    if (this.context && this.context.dispatchAction) {
      this.context.dispatchAction({
        event: {
          name: 'local_widget_click',
          context: {
            timestamp: new Date().toISOString(),
            widgetId: this.id || 'unknown'
          }
        }
      });
    }
  }
}

export const LocalWidget = {
  name: 'LocalWidget',
  tagName: 'a2ui-local-widget',
  schema: { parse: (v: any) => v }
};
