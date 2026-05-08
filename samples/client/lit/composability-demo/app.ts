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

import {
  Catalog,
  ComponentContext,
  SurfaceModel,
  ComponentModel,
} from '@a2ui/web_core/v0_9';
import {renderA2uiNode, basicCatalog} from '@a2ui/lit/v0_9';
import {render, html} from 'lit';

// Import local custom elements statically
import {LocalWidget} from './components/local-widget.js';
import {McpApp} from './components/mcp-app.js';

// --- Logger helper ---
const consoleEl = document.getElementById('console') as HTMLElement;
function log(msg: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = `log-line log-${type}`;
  line.textContent = `[${time}] ${msg}`;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// --- COMPILE-TIME STATIC CATALOG INGESTION ---
log('Ingesting composed client catalog at compile-time...', 'info');

const clientCatalog = new Catalog(
  'https://a2ui.org/renderers/lit/catalogs/v1/a2ui-lit-web-catalog.json',
  [
    ...Array.from(basicCatalog.components.values()),
    LocalWidget as any,
    McpApp as any
  ],
  [
    ...Array.from(basicCatalog.functions.values())
  ]
);

log(`Composed catalog loaded. Pre-registered: [LocalWidget, McpApp] alongside ${basicCatalog.components.size} standard elements.`, 'success');

// Track registration badges
['local-status', 'mcp-status'].forEach(id => {
  const badge = document.getElementById(id);
  if (badge) {
    badge.textContent = 'Ready';
    badge.className = 'badge badge-loaded';
  }
});

// --- Setup Surfaces ---

function renderSurfaceA() {
  // Surface A: Primitives (Text and Button)
  const surfaceModel = new SurfaceModel('surface-a', clientCatalog as any);
  
  // Add Title component
  surfaceModel.componentsModel.addComponent(new ComponentModel('title-comp', 'Text', {
    text: 'Standard Catalog Elements',
    variant: 'h3'
  }));

  // Add Button component
  surfaceModel.componentsModel.addComponent(new ComponentModel('btn-comp', 'Button', {
    child: 'btn-label',
    action: { event: { name: 'standard_button_click' } }
  }));
  surfaceModel.componentsModel.addComponent(new ComponentModel('btn-label', 'Text', {
    text: 'Interactive Action Button'
  }));

  const container = document.getElementById('surface-a')!;
  
  // Render node Text
  const ctxText = new ComponentContext(surfaceModel, 'title-comp');
  const ctxBtn = new ComponentContext(surfaceModel, 'btn-comp');

  render(html`
    ${renderA2uiNode(ctxText, clientCatalog as any)}
    <div style="margin-top: 12px;">
      ${renderA2uiNode(ctxBtn, clientCatalog as any)}
    </div>
  `, container);

  surfaceModel.onAction.subscribe((action) => {
    log(`[Action Dispatch] Standard Button Action received: ${JSON.stringify(action)}`, 'success');
  });
}

async function renderSurfaceB() {
  const container = document.getElementById('surface-b')!;
  const badge = document.getElementById('surface-b-badge')!;

  try {
    const surfaceModel = new SurfaceModel('surface-b', clientCatalog as any);
    surfaceModel.componentsModel.addComponent(new ComponentModel('local-widget-comp', 'LocalWidget', {}));
    
    surfaceModel.onAction.subscribe((action) => {
      log(`[Action Dispatch] Local Widget click action: ${JSON.stringify(action)}`, 'success');
      
      if (action.name === 'local_widget_click') {
        // Render simulated agent success panel
        const prevResult = container.querySelector('.agent-result');
        if (prevResult) prevResult.remove();

        const resultEl = document.createElement('div');
        resultEl.className = 'agent-result';
        resultEl.style.cssText = 'margin: 16px 28px; padding: 16px; background: rgba(99, 102, 241, 0.08); border: 1px solid var(--primary-color); border-radius: 12px; color: #a5b4fc; font-size: 14px; font-weight: 600; text-align: center; animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(99,102,241,0.15);';
        resultEl.innerHTML = `⚡ Agent Response: local_widget_click action received successfully!`;
        container.appendChild(resultEl);
      }
    });

    const ctx = new ComponentContext(surfaceModel, 'local-widget-comp');
    
    // Attempt rendering - immediately ready since it is pre-registered!
    const template = renderA2uiNode(ctx, clientCatalog as any);
    render(template, container);

    badge.textContent = 'Active';
    badge.style.color = 'var(--success-color)';
  } catch (err: any) {
    badge.textContent = 'Blocked';
    badge.style.color = 'var(--error-color)';
    render(html`
      <div style="padding: 16px; border: 1px dashed var(--error-color); border-radius: 12px; color: var(--error-color); font-size: 14px; font-weight: 500; background: rgba(239, 68, 68, 0.05);">
        ❌ Dynamic component load blocked: ${err.message}
      </div>
    `, container);
  }
}

async function renderSurfaceC() {
  const container = document.getElementById('surface-c')!;
  const badge = document.getElementById('surface-c-badge')!;

  try {
    const surfaceModel = new SurfaceModel('surface-c', clientCatalog as any);
    
    // Statically loaded component McpApp containing a calculator app HTML
    surfaceModel.componentsModel.addComponent(new ComponentModel('mcp-app-comp', 'McpApp', {
      resourceUri: 'http://localhost:8000/components/mcp-app.js',
      allowedTools: ['calculate_sum'],
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #111827; color: white; padding: 28px; text-align: center; margin: 0; box-sizing: border-box; }
            h3 { margin-top: 0; font-size: 18px; color: #a5b4fc; }
            p { font-size: 13px; color: #9ca3af; line-height: 1.5; margin-bottom: 16px; }
            button { background: #6366f1; color: white; border: none; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(99,102,241,0.3); transition: all 0.2s; }
            button:hover { background: #4f46e5; transform: scale(1.03); }
            button:active { transform: scale(0.97); }
          </style>
        </head>
        <body>
          <h3>Interactive Sandbox Calculator</h3>
          <p>Standard double-sandboxed iframe communicating strictly via postMessage JSON-RPC.</p>
          <button onclick="window.parent.postMessage({ jsonrpc: '2.0', method: 'ui/requests/call-tool', params: { name: 'calculate_sum', arguments: { x: 10, y: 15 } }, id: 42 }, '*')">
            Run Tool: calculate_sum(10, 15)
          </button>
        </body>
        </html>
      `
    }));

    surfaceModel.onAction.subscribe((action) => {
      log(`[Action Dispatch] Sandbox tool call: ${JSON.stringify(action)}`, 'success');
      
      if (action.name === 'calculate_sum') {
        const {x, y} = action.context || {};
        const sum = (Number(x) || 0) + (Number(y) || 0);
        log(`[Agent Simulator] Computing tool call: calculate_sum(${x}, ${y}) = ${sum}`, 'info');

        // Render simulated agent success panel
        const prevResult = container.querySelector('.agent-result');
        if (prevResult) prevResult.remove();

        const resultEl = document.createElement('div');
        resultEl.className = 'agent-result';
        resultEl.style.cssText = 'margin: 16px 28px; padding: 16px; background: rgba(16, 185, 129, 0.08); border: 1px solid var(--success-color); border-radius: 12px; color: var(--success-color); font-size: 14px; font-weight: 600; text-align: center; animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(16,185,129,0.15);';
        resultEl.innerHTML = `✓ Agent Simulated Tool Success: calculate_sum(${x}, ${y}) = ${sum}`;
        container.appendChild(resultEl);
      }
    });

    const ctx = new ComponentContext(surfaceModel, 'mcp-app-comp');
    
    // Render immediately!
    const template = renderA2uiNode(ctx, clientCatalog as any);
    render(template, container);

    badge.textContent = 'Active';
    badge.style.color = 'var(--success-color)';
  } catch (err: any) {
    badge.textContent = 'Blocked';
    badge.style.color = 'var(--error-color)';
    render(html`
      <div style="padding: 16px; border: 1px dashed var(--error-color); border-radius: 12px; color: var(--error-color); font-size: 14px; font-weight: 500; background: rgba(239, 68, 68, 0.05);">
        ❌ Dynamic component load blocked: ${err.message}
      </div>
    `, container);
  }
}

// --- Initial boot rendering ---
log('Running compile-time surface instantiation...', 'info');
renderSurfaceA();
renderSurfaceB();
renderSurfaceC();

// --- Handle Controls Events ---

// Strict/Development Switch (Compile-time showcase)
const securityToggle = document.getElementById('security-toggle') as HTMLInputElement;
securityToggle.onchange = () => {
  const isChecked = securityToggle.checked;
  log(`Strict boundary check toggled ${isChecked ? 'ON' : 'OFF'}.`, 'info');
  log('Compile-time components bypass active. All pre-registered views persist instantly.', 'success');
  renderSurfaceB();
  renderSurfaceC();
};

// Simulated Bundler Trigger
const preloadBtn = document.getElementById('preload-btn') as HTMLButtonElement;
preloadBtn.onclick = async () => {
  log('[Compile-Time Bundler] Simulating compile-time dependency scan...', 'info');
  preloadBtn.disabled = true;
  preloadBtn.textContent = 'Scanning...';

  setTimeout(() => {
    log('[Compile-Time Bundler] Dependency scan success. 2 custom components statically pre-bundled!', 'success');
    preloadBtn.disabled = false;
    preloadBtn.textContent = 'Simulate Build-Time Bundling';
    
    // Refresh layout
    renderSurfaceB();
    renderSurfaceC();
  }, 800);
};
