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

/**
 * A2UI Exporter - Export designed UIs as standalone apps
 */

import type { ServerToClientMessage } from "./client.js";

// ============================================================================
// Types
// ============================================================================

export type ExportPlatform = 'web' | 'windows' | 'android' | 'github';

export interface ExportOptions {
    appName: string;
    platform: ExportPlatform;
    a2uiMessages: ServerToClientMessage[];
    description?: string;
}

// ============================================================================
// Web Export (HTML/CSS/JS)
// ============================================================================

/**
 * Generate a self-contained HTML file from A2UI messages
 */
export function generateWebExport(options: ExportOptions): string {
    const { appName, a2uiMessages } = options;

    // Convert A2UI messages to JSON for embedding
    const a2uiJson = JSON.stringify(a2uiMessages, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(appName)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
    <style>
        ${getEmbeddedStyles()}
    </style>
</head>
<body>
    <div id="app"></div>
    <script type="module">
        ${getEmbeddedRenderer()}
        
        // A2UI Data
        const a2uiMessages = ${a2uiJson};
        
        // Initialize and render
        const app = document.getElementById('app');
        renderA2UI(app, a2uiMessages);
    </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Get embedded CSS styles for the exported app
 */
function getEmbeddedStyles(): string {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f8f9fa;
    color: #202124;
    line-height: 1.6;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* A2UI Component Styles */
.a2ui-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.a2ui-row {
    display: flex;
    flex-direction: row;
    gap: 12px;
    flex-wrap: wrap;
}

.a2ui-row.center { justify-content: center; }
.a2ui-row.space-between { justify-content: space-between; }

.a2ui-heading {
    font-weight: 600;
    color: #202124;
}

.a2ui-heading.h1 { font-size: 2.5rem; }
.a2ui-heading.h2 { font-size: 2rem; }
.a2ui-heading.h3 { font-size: 1.5rem; }

.a2ui-text {
    color: #5f6368;
}

.a2ui-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: #1a73e8;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.a2ui-button:hover {
    background: #1557b0;
}

.a2ui-button.secondary {
    background: white;
    color: #1a73e8;
    border: 1px solid #dadce0;
}

.a2ui-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e8eaed;
    overflow: hidden;
}

.a2ui-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}

.a2ui-textfield {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #dadce0;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
}

.a2ui-textfield:focus {
    border-color: #1a73e8;
}

.a2ui-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
}

.a2ui-divider {
    height: 1px;
    background: #e8eaed;
    margin: 16px 0;
}

.g-icon {
    font-family: 'Material Symbols Outlined';
    font-size: 24px;
}

/* SVG Canvas */
.a2ui-canvas svg {
    max-width: 100%;
    height: auto;
}
    `;
}

/**
 * Get embedded A2UI renderer JavaScript
 */
function getEmbeddedRenderer(): string {
    return `
// Minimal A2UI Renderer
function renderA2UI(container, messages) {
    const components = new Map();
    let rootId = null;
    
    // Parse messages
    for (const msg of messages) {
        if (msg.surfaceUpdate?.components) {
            for (const comp of msg.surfaceUpdate.components) {
                components.set(comp.id, comp);
            }
        }
        if (msg.beginRendering?.root) {
            rootId = msg.beginRendering.root;
        }
    }
    
    if (!rootId) return;
    
    const rootComp = components.get(rootId);
    if (rootComp) {
        container.innerHTML = renderComponent(rootComp, components);
    }
}

function renderComponent(comp, components) {
    const props = comp.component || comp.componentProperties;
    if (!props) return '';
    
    const type = Object.keys(props)[0];
    const p = props[type];
    
    switch (type) {
        case 'Column':
            return \`<div class="a2ui-column" style="\${styleToString(p.style)}">\${renderChildren(p.children, components)}</div>\`;
        case 'Row':
            const rowClass = p.distribution === 'center' ? 'center' : 
                           p.distribution === 'spaceBetween' ? 'space-between' : '';
            return \`<div class="a2ui-row \${rowClass}" style="\${styleToString(p.style)}">\${renderChildren(p.children, components)}</div>\`;
        case 'Heading':
            const level = p.usageHint || 'h2';
            return \`<\${level} class="a2ui-heading \${level}">\${getText(p.text)}</\${level}>\`;
        case 'Text':
            return \`<p class="a2ui-text">\${getText(p.text)}</p>\`;
        case 'Button':
            return \`<button class="a2ui-button">\${getText(p.label)}</button>\`;
        case 'Image':
            return \`<img class="a2ui-image" src="\${getText(p.url)}" alt="Image">\`;
        case 'Card':
            const cardChild = components.get(p.child);
            return \`<div class="a2ui-card">\${cardChild ? renderComponent(cardChild, components) : ''}</div>\`;
        case 'TextField':
            return \`<input class="a2ui-textfield" placeholder="\${getText(p.placeholder) || ''}" />\`;
        case 'CheckBox':
            return \`<label class="a2ui-checkbox"><input type="checkbox" \${p.value ? 'checked' : ''}/>\${getText(p.label)}</label>\`;
        case 'Divider':
            return '<hr class="a2ui-divider">';
        case 'Canvas':
            return \`<div class="a2ui-canvas"><svg width="\${p.width || 400}" height="\${p.height || 300}">\${renderChildren(p.children, components)}</svg></div>\`;
        case 'Rectangle':
            return \`<rect x="\${p.x || 0}" y="\${p.y || 0}" width="\${p.width}" height="\${p.height}" fill="\${p.fill || 'gray'}" rx="\${p.rx || 0}"/>\`;
        case 'Circle':
            return \`<circle cx="\${p.cx}" cy="\${p.cy}" r="\${p.r}" fill="\${p.fill || 'gray'}"/>\`;
        case 'Line':
            return \`<line x1="\${p.x1}" y1="\${p.y1}" x2="\${p.x2}" y2="\${p.y2}" stroke="\${p.stroke || 'black'}" stroke-width="\${p.strokeWidth || 1}"/>\`;
        case 'Path':
            return \`<path d="\${p.d}" fill="\${p.fill || 'none'}" stroke="\${p.stroke || ''}" stroke-width="\${p.strokeWidth || 1}"/>\`;
        default:
            return '';
    }
}

function renderChildren(children, components) {
    if (!children?.explicitList) return '';
    return children.explicitList.map(id => {
        const child = components.get(id);
        return child ? renderComponent(child, components) : '';
    }).join('');
}

function getText(textObj) {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj.literalString || textObj.path || '';
}

function styleToString(style) {
    if (!style) return '';
    return Object.entries(style).map(([k, v]) => {
        const prop = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        return \`\${prop}: \${v}\`;
    }).join('; ');
}
    `;
}

// ============================================================================
// Download Utility
// ============================================================================

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/html'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export and download as web app
 */
export function exportAsWebApp(options: ExportOptions): void {
    const html = generateWebExport(options);
    const filename = `${options.appName.toLowerCase().replace(/\s+/g, '-')}.html`;
    downloadFile(html, filename);
}
