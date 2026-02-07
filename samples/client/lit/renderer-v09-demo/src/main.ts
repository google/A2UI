
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as v0_9_Lit from '@a2ui/lit/v0_9';
import * as v0_9_Core from '@a2ui/web_core/v0_9';
// Import examples
import examples from './examples.json';

// Register the example viewer component
@customElement('example-viewer')
export class ExampleViewer extends LitElement {
  @property({ type: Object }) example: any;

  static styles = css`
    :host {
      display: block;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 16px 0;
      overflow: hidden;
      background: #fff;
    }
    header {
      background: #f5f5f5;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      font-weight: bold;
    }
    .content {
      padding: 16px;
    }
    .json-preview {
      background: #f8f9fa;
      padding: 8px;
      margin-top: 16px;
      border-top: 1px solid #eee;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow: auto;
      white-space: pre-wrap;
    }
    details {
      padding: 0 16px 16px;
    }
    summary {
      cursor: pointer;
      color: #666;
      font-size: 12px;
      margin-bottom: 8px;
    }
  `;

  #processor: v0_9_Core.A2uiMessageProcessor;

  @state()
  private _activeSurfaces: string[] = [];

  constructor() {
    super();
    const litCatalog = v0_9_Lit.createLitStandardCatalog();
    this.#processor = new v0_9_Core.A2uiMessageProcessor(
      [litCatalog],
      async (action) => {
        console.log('Action received:', action);
        alert(`Action received: ${JSON.stringify(action, null, 2)}`);
      }
    );
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.example && this.example.messages) {
      this.#processor.processMessages(this.example.messages);

      // Track surfaces
      const surfaces = new Set<string>(this._activeSurfaces);
      for (const msg of this.example.messages) {
        if (msg.createSurface) {
          surfaces.add(msg.createSurface.surfaceId);
        }
        if (msg.deleteSurface) {
          surfaces.delete(msg.deleteSurface.surfaceId);
        }
      }
      this._activeSurfaces = Array.from(surfaces);
    }
  }

  render() {
    return html`
      <header>${this.example.title}</header>
      <div class="content">
        ${this._activeSurfaces.map(surfaceId => {
      const context = this.#processor.getSurfaceContext(surfaceId);
      if (!context) return nothing;
      return html`<a2ui-surface-v0-9 .context=${context}></a2ui-surface-v0-9>`;
    })}
      </div>
      <details>
        <summary>View JSON Messages</summary>
        <div class="json-preview">${JSON.stringify(this.example.messages, null, 2)}</div>
      </details>
    `;
  }
}

// Main App Component
@customElement('demo-app')
export class DemoApp extends LitElement {
  render() {
    return html`
      ${examples.map(example => html`
        <example-viewer .example=${example}></example-viewer>
      `)}
    `;
  }
}

// mount
const container = document.getElementById('examples-container');
if (container) {
  const app = document.createElement('demo-app');
  container.appendChild(app);
}
