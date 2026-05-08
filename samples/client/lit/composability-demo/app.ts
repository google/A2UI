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

// --- COMPILE-TIME STATIC CATALOG BUNDLINGS ---
log('Statically pre-compiling and packaging catalogs...', 'info');

// 1. Basic Catalog: all standard primitives
const clientBasicCatalog = new Catalog(
  'https://a2ui.org/catalogs/v1/basic-catalog.json',
  Array.from(basicCatalog.components.values())
);

// 2. Weather Catalog: all primitives + LocalWeatherWidget
const clientWeatherCatalog = new Catalog(
  'https://a2ui.org/catalogs/v1/weather-catalog.json',
  [
    ...Array.from(basicCatalog.components.values()),
    LocalWidget as any
  ]
);

// 3. Generative MCP Catalog: all primitives + McpApp iframe sandbox
const clientMcpCatalog = new Catalog(
  'https://a2ui.org/catalogs/v1/mcp-catalog.json',
  [
    ...Array.from(basicCatalog.components.values()),
    McpApp as any
  ]
);

log('Statically pre-registered 3 distinct catalogs in Swift/iOS compile-time style.', 'success');

// --- State & Persistence Management ---
type CatalogKey = 'basic' | 'weather' | 'mcp';
let activeCatalogKey: CatalogKey = (localStorage.getItem('active_catalog_key') as CatalogKey) || 'basic';
let selectedComponentName: string | null = null;
let activeFeedbackText = '';

const catalogMap: Record<CatalogKey, Catalog<any>> = {
  basic: clientBasicCatalog,
  weather: clientWeatherCatalog,
  mcp: clientMcpCatalog
};

// --- JSON Schema Generator Helper ---
function generateCatalogJson(catalog: Catalog<any>) {
  const components: Record<string, any> = {};
  for (const name of catalog.components.keys()) {
    components[name] = {
      type: 'object',
      properties: {
        component: { const: name },
        ...(name === 'LocalWidget' ? {
          // Custom Weather Widget schema
          location: { type: 'string', default: 'San Francisco, CA' }
        } : name === 'McpApp' ? {
          // McpApp custom properties schema
          resourceUri: { type: 'string' },
          allowedTools: { type: 'array', items: { type: 'string' } },
          htmlContent: { type: 'string' }
        } : {
          // Standard primitives properties placeholder
          properties: { type: 'object' }
        })
      },
      required: ['component']
    };
  }

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: catalog.id,
    title: (catalog.id.split('/').pop()?.replace('.json', '') || '') + ' schema',
    catalogId: catalog.id,
    components
  };
}

// --- Toast Notification Helper ---
function showToast(message: string, type: 'success' | 'info' = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 14px 24px;
    background: rgba(18, 18, 24, 0.9);
    border: 1px solid ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
    border-radius: 12px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35), 0 0 15px ${type === 'success' ? 'var(--success-glow)' : 'var(--primary-glow)'};
    backdrop-filter: blur(12px);
    pointer-events: auto;
    animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), fadeOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 2.7s forwards;
  `;
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="color: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'}; font-size: 16px; font-weight: bold;">
        ${type === 'success' ? '✓' : '⚡'}
      </span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// --- Reactive UI Ingesting ---

function ingestCatalog(key: CatalogKey, isInitial = false) {
  activeCatalogKey = key;
  localStorage.setItem('active_catalog_key', key);
  const catalog = catalogMap[key];

  log(`[Ingestion] Ingesting catalog: ${catalog.id}`, 'info');

  // 1. Update Selector Button classes
  const buttons: Record<CatalogKey, HTMLElement> = {
    basic: document.getElementById('btn-basic-catalog')!,
    weather: document.getElementById('btn-weather-catalog')!,
    mcp: document.getElementById('btn-mcp-catalog')!
  };

  Object.keys(buttons).forEach((k) => {
    const btn = buttons[k as CatalogKey];
    if (k === key) {
      btn.className = 'btn btn-primary';
    } else {
      btn.className = 'btn btn-secondary';
    }
  });

  // 2. Resolve selected component default
  const components = Array.from(catalog.components.keys());
  if (!selectedComponentName || !components.includes(selectedComponentName)) {
    selectedComponentName = components[0];
  }
  activeFeedbackText = '';

  // 3. Render Component Registry sidebar list reactively
  renderRegistryList(components, catalog);

  // 4. Render Active Component card reactively
  renderActiveComponent(selectedComponentName, catalog);

  // 5. Update Catalog JSON Schema Viewer
  const catalogJson = generateCatalogJson(catalog);
  const jsonViewer = document.getElementById('catalog-json-viewer')!;
  jsonViewer.textContent = JSON.stringify(catalogJson, null, 2);

  // 6. Show success toast when hot-swapped explicitly by the user!
  if (!isInitial) {
    const catalogName = key === 'basic' ? 'Basic Primitives' : key === 'weather' ? 'Weather Forecast' : 'MCP App Sandbox';
    showToast(`${catalogName} Catalog Loaded Successfully`, 'success');
  }
}

function renderRegistryList(components: string[], catalog: Catalog<any>) {
  const registryList = document.getElementById('availability-list')!;
  
  render(
    html`
      ${components.map(name => {
        const isActive = name === selectedComponentName;
        return html`
          <div 
            class="status-item ${isActive ? 'active' : ''}" 
            @click=${() => selectComponent(name, catalog)}
          >
            <span>${name}</span>
            <span class="badge badge-loaded">Ready</span>
          </div>
        `;
      })}
    `,
    registryList
  );
}

function selectComponent(name: string, catalog: Catalog<any>) {
  selectedComponentName = name;
  activeFeedbackText = '';
  log(`[Registry Selector] Swapping preview widget to: ${name}`, 'info');
  
  // Re-render lists & previews
  const components = Array.from(catalog.components.keys());
  renderRegistryList(components, catalog);
  renderActiveComponent(name, catalog);
}

// --- Playground Renderer ---

function renderActiveComponent(name: string, catalog: Catalog<any>) {
  const container = document.getElementById('dynamic-surface-container')!;

  const surfaceModel = new SurfaceModel('showcase-surface', catalog as any);
  const compId = `showcase-${name.toLowerCase()}`;
  
  let props: Record<string, any> = {};
  let isCardFormat = false;

  // Generate custom mock properties dynamically per component type
  if (name === 'Text') {
    props = { text: 'Standard Text Primitive: Outfit typography rendering cleanly in high-contrast light gray.', variant: 'body' };
  } else if (name === 'Button') {
    props = { child: `${compId}-label`, action: { event: { name: 'standard_button_click' } } };
    surfaceModel.componentsModel.addComponent(new ComponentModel(`${compId}-label`, 'Text', { text: 'Playground Button Trigger' }));
  } else if (name === 'LocalWidget') {
    props = {}; 
    isCardFormat = true;
  } else if (name === 'McpApp') {
    isCardFormat = true;
    props = {
      allowedTools: ['calculate_sum'],
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; background: #111827; color: white; padding: 28px; text-align: center; margin: 0; box-sizing: border-box; }
            h3 { margin-top: 0; font-size: 18px; color: #a5b4fc; }
            p { font-size: 12px; color: #9ca3af; line-height: 1.5; margin-bottom: 16px; }
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
    };
  } else if (name === 'Divider') {
    props = { axis: 'horizontal' };
  } else if (name === 'Card') {
    props = { child: `${compId}-child` };
    surfaceModel.componentsModel.addComponent(new ComponentModel(`${compId}-child`, 'Text', { text: 'This is a standard Card container with border-radius and box-shadows.' }));
  } else if (name === 'Row' || name === 'Column' || name === 'List') {
    props = { children: [`${compId}-c1`, `${compId}-c2`] };
    surfaceModel.componentsModel.addComponent(new ComponentModel(`${compId}-c1`, 'Text', { text: `${name} Layout Node 1` }));
    surfaceModel.componentsModel.addComponent(new ComponentModel(`${compId}-c2`, 'Text', { text: `${name} Layout Node 2` }));
  } else {
    props = { text: `${name} Standard Component Preview Placeholder` };
  }

  surfaceModel.componentsModel.addComponent(new ComponentModel(compId, name, props));
  const ctx = new ComponentContext(surfaceModel, compId);

  // Subscribe to action dispatches reactively to render feedback panels inside the exact component card!
  surfaceModel.onAction.subscribe((action) => {
    log(`[Action Dispatch] Showcase Action received: ${JSON.stringify(action)}`, 'success');

    let feedbackText = '';
    if (action.name === 'standard_button_click') {
      feedbackText = `⚡ Standard Action click dispatched successfully!`;
    } else if (action.name === 'refresh_weather') {
      feedbackText = `⚡ Weather Ingest Simulator: Refresh complete! Forecasting indexes updated.`;
    } else if (action.name === 'calculate_sum') {
      const {x, y} = action.context || {};
      const sum = (Number(x) || 0) + (Number(y) || 0);
      feedbackText = `✓ Simulated Tool Success: calculate_sum(${x}, ${y}) = ${sum}`;
      log(`[Agent Simulator] Computing tool call: calculate_sum(${x}, ${y}) = ${sum}`, 'info');
    }

    if (feedbackText) {
      activeFeedbackText = feedbackText;
      // Re-render cleanly to update state reactively
      renderActiveComponent(name, catalog);
    }
  });

  const template = html`
    <div class="card">
      <div class="card-title">
        <span>Component Playground: ${name}</span>
        <span style="font-size: 12px; color: var(--success-color);">Active</span>
      </div>
      <div class="card-body" style="padding: ${isCardFormat ? '0' : '24px 28px'}; min-height: 60px;">
        ${renderA2uiNode(ctx, catalog as any)}
      </div>
      ${activeFeedbackText ? html`
        <div class="agent-result" style="margin: 20px 28px 28px 28px; padding: 16px; background: rgba(16, 185, 129, 0.08); border: 1px solid var(--success-color); border-radius: 12px; color: var(--success-color); font-size: 13px; font-weight: 600; text-align: center; animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(16,185,129,0.15);">
          ${activeFeedbackText}
        </div>
      ` : ''}
    </div>
  `;

  render(template, container);
}

// --- Initial Boot & Restoration ---
log(`Restoring previous session from localStorage: [${activeCatalogKey}]`, 'info');
ingestCatalog(activeCatalogKey, true);

// --- Handle Catalog Ingestion Clicks ---

const btnBasic = document.getElementById('btn-basic-catalog') as HTMLButtonElement;
const btnWeather = document.getElementById('btn-weather-catalog') as HTMLButtonElement;
const btnMcp = document.getElementById('btn-mcp-catalog') as HTMLButtonElement;

btnBasic.onclick = () => {
  log('[Ingestion] Ingesting basic primitive catalog...', 'info');
  ingestCatalog('basic', false);
};

btnWeather.onclick = () => {
  log('[Ingestion] Ingesting local custom weather catalog...', 'info');
  ingestCatalog('weather', false);
};

btnMcp.onclick = () => {
  log('[Ingestion] Ingesting generative MCP iframe catalog...', 'info');
  ingestCatalog('mcp', false);
};
