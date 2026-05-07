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

class A2uiLocalWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._context = null;
  }

  set context(value) {
    this._context = value;
    this.render();
  }

  get context() {
    return this._context;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          font-family: 'Outfit', system-ui, sans-serif;
          transition: transform 0.3s ease;
          margin: 16px 0;
          box-sizing: border-box;
        }
        :host(:hover) {
          transform: translateY(-4px);
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
        button:active {
          transform: scale(0.95);
        }
      </style>
      <h3>Local Interactive Widget</h3>
      <p>This component was dynamically loaded from the local public directory. It has zero dependencies, modern visual style, and triggers native A2UI events.</p>
      <button id="action-btn">Trigger Local Action</button>
    `;

    const btn = this.shadowRoot.getElementById('action-btn');
    if (btn) {
      btn.onclick = () => {
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
      };
    }
  }
}

customElements.define('a2ui-local-widget', A2uiLocalWidget);

if (window.A2UI && window.A2UI.registerComponent) {
  window.A2UI.registerComponent('LocalWidget', {
    name: 'LocalWidget',
    tagName: 'a2ui-local-widget',
    schema: { parse: (v) => v }
  });
}
