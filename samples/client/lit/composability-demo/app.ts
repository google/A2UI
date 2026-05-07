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
  DynamicCatalog,
  ComponentContext,
  SurfaceModel,
  ComponentModel,
  Catalog
} from '@a2ui/web_core/v0_9';
import {renderA2uiNode, basicCatalog} from '@a2ui/lit/v0_9';
import {render, html} from 'lit';

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

// --- Initialize Dynamic Catalog ---
let catalog: DynamicCatalog<any>;

function initCatalog(strict: boolean) {
  const mode = strict ? 'Strict' : 'Development';
  log(`Re-initializing DynamicCatalog in [${mode}] mode`, 'info');

  // Catalog JSON file we created v1
  catalog = new DynamicCatalog('http://localhost:8000/catalogs/v1/a2ui-lit-web-catalog.json', {
    securityMode: mode,
    approvedDomains: ['http://localhost:8000', 'https://cdn.a2ui.org'],
    preRegisteredComponents: [] // No pre-registered, we show dynamic loader!
  });

  // Hook dynamic loading events for log output
  const originalLoad = catalog.loadComponent.bind(catalog);
  catalog.loadComponent = async (name: string) => {
    log(`[Loader] Start dynamic loading for component '${name}'`, 'info');
    try {
      const comp = await originalLoad(name);
      if (comp) {
        log(`[Loader] Component '${name}' successfully downloaded and verified!`, 'success');
        // Update badge
        const badge = document.getElementById(`${name.toLowerCase()}-status`);
        if (badge) {
          badge.textContent = 'Ready';
          badge.className = 'badge badge-loaded';
        }
      }
      return comp;
    } catch (err: any) {
      log(`[Security/Loader] Error: ${err.message}`, 'error');
      throw err;
    }
  };
}

// Initial setup
const securityToggle = document.getElementById('security-toggle') as HTMLInputElement;
initCatalog(securityToggle.checked);

// --- Setup Surfaces ---

function renderSurfaceA() {
  // Surface A: Primitives (Text and Button)
  const surfaceModel = new SurfaceModel('surface-a', basicCatalog as any);
  
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
    ${renderA2uiNode(ctxText, basicCatalog as any)}
    <div style="margin-top: 12px;">
      ${renderA2uiNode(ctxBtn, basicCatalog as any)}
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
    const surfaceModel = new SurfaceModel('surface-b', catalog as any);
    surfaceModel.componentsModel.addComponent(new ComponentModel('local-widget-comp', 'LocalWidget', {}));
    
    surfaceModel.onAction.subscribe((action) => {
      log(`[Action Dispatch] Local Widget click action: ${JSON.stringify(action)}`, 'success');
    });

    const ctx = new ComponentContext(surfaceModel, 'local-widget-comp');
    
    // Attempt rendering
    const template = renderA2uiNode(ctx, catalog as any);
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
    const surfaceModel = new SurfaceModel('surface-c', catalog as any);
    
    // Dynamic remote component McpApp containing a mock calculator app HTML
    surfaceModel.componentsModel.addComponent(new ComponentModel('mcp-app-comp', 'McpApp', {
      resourceUri: 'http://localhost:8000/components/mcp-app.js',
      allowedTools: ['calculate_sum'],
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #1f2937; color: white; padding: 16px; border-radius: 8px; text-align: center; }
            button { background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h3>Interactive Sandbox Calculator</h3>
          <p>Standard double-sandboxed iframe communicating strictly via postMessage JSON-RPC.</p>
          <button onclick="window.parent.postMessage({ jsonrpc: '2.0', method: 'ui/requests/call-tool', params: { name: 'calculate_sum', arguments: { x: 10, y: 15 } }, id: 42 }, '*')">
            Run: calculate_sum(10, 15)
          </button>
        </body>
        </html>
      `
    }));

    surfaceModel.onAction.subscribe((action) => {
      log(`[Action Dispatch] Sandbox tool call: ${JSON.stringify(action)}`, 'success');
    });

    const ctx = new ComponentContext(surfaceModel, 'mcp-app-comp');
    
    const template = renderA2uiNode(ctx, catalog as any);
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

// --- Trigger initial rendering ---
renderSurfaceA();
renderSurfaceB();
renderSurfaceC();

// --- Handle Controls Events ---

// Strict/Development Switch
securityToggle.onchange = () => {
  initCatalog(securityToggle.checked);
  
  // Reset Registry badges status
  ['local-status', 'mcp-status'].forEach(id => {
    const b = document.getElementById(id)!;
    b.textContent = 'Pending';
    b.className = 'badge badge-pending';
  });

  // Re-trigger rendering under the new catalog security constraints
  log('Re-evaluating live surfaces...', 'info');
  renderSurfaceB();
  renderSurfaceC();
};

// Parallel Preload Button
const preloadBtn = document.getElementById('preload-btn') as HTMLButtonElement;
preloadBtn.onclick = async () => {
  log('Triggering parallel catalog component preload...', 'info');
  preloadBtn.disabled = true;
  preloadBtn.textContent = 'Preloading...';

  try {
    await catalog.preload();
    log('Parallel preloading of catalog components completed successfully!', 'success');
  } catch (err: any) {
    log(`Preloading error: ${err.message}`, 'error');
  } finally {
    preloadBtn.disabled = false;
    preloadBtn.textContent = 'Pre-Download Catalog Components';
    // Refresh surfaces
    renderSurfaceB();
    renderSurfaceC();
  }
};
