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

import {
    AppBridge,
    PostMessageTransport,
    SANDBOX_PROXY_READY_METHOD,
    SANDBOX_RESOURCE_READY_METHOD
} from '@modelcontextprotocol/ext-apps/app-bridge';

/**
 * Note on "sandbox" terminology:
 * The primary functionality of this unit (sandbox.html/ts) is to serve a sandboxed
 * environment for the McpApp component. 
 *
 * The sandbox.html is simply a webpage that contains a sandboxed inner iframe.
 * The `sandbox` property is an iframe attribute that acts as an allow-list rather than a
 * block-list. By default (when it is ''), the iframe will not allow anything, ensuring
 * the environment is as vacuum-sealed as possible. Individual features can be enabled
 * by setting the `sandbox` property when the host (McpApp component) triggers the
 * SANDBOX_RESOURCE_READY_METHOD
 */

// Initialize AppBridge
const bridge = new AppBridge(
    null, // No client in sandbox
    { name: 'MCP Sandbox', version: '1.0.0' },
    {
        serverTools: {},
        logging: {}
    }
);

// By default no features will be allowed for the sandbox iframe.
const DEFAULT_SANDBOX_ALLOWED_FEATURES = '';

bridge.oncalltool = async (params: any) => {
    // Forward tool calls to parent if needed, or handle locally
    // For now, we just log
    console.log('[Sandbox] Tool call:', params);
    // We can also postMessage back to parent manually if bridge doesn't handle it.
    // The implementation of forwarding logic would go here
    // For now, throw to indicate not implemented in sandbox
    throw new Error('Tool execution not supported in sandbox directly');
};

// Notify parent we are ready (standard)
window.parent.postMessage({ method: SANDBOX_PROXY_READY_METHOD }, window.location.origin);

// Listen for resource ready message
window.addEventListener('message', async (event) => {
    // Validate the origin of incoming messages
    if (event.origin !== window.location.origin) {
        return;
    }

    const data = event.data;
    if (data && data.method === SANDBOX_RESOURCE_READY_METHOD) {
        const { html, sandbox } = data.params;
        const content = document.getElementById('content');
        if (html && content) {
            // Create an inner iframe with srcdoc to enable Javascript execution if any.
            const innerFrame = document.createElement('iframe');
            innerFrame.srcdoc = html;
            innerFrame.style.width = '100%';
            innerFrame.style.height = '100%';
            innerFrame.style.border = 'none';
            innerFrame.sandbox = sandbox || DEFAULT_SANDBOX_ALLOWED_FEATURES;

            // Clear any existing content and inject the new iframe
            content.innerHTML = '';
            content.appendChild(innerFrame);
        }
    }
});

// Initialize transport with parent
const transport = new PostMessageTransport(window.parent, window.parent);
await bridge.connect(transport);
