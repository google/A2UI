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

import { DynamicComponent } from '@a2ui/angular';
import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Types from '@a2ui/web_core/types/types';
import {
  AppBridge,
  PostMessageTransport,
  SANDBOX_PROXY_READY_METHOD,
} from '@modelcontextprotocol/ext-apps/app-bridge';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  Signal,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'a2ui-mcp-app',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 450px; /* Minimum height to ensure visibility */
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }

    iframe {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      background-color: white; /* Ensure content is readable */
    }
  `,
  template: `
    @if (resolvedContent(); as content) {
      <iframe #iframe [src]="iframeSrc()" [title]="resolvedTitle() || 'MCP App'"></iframe>
    }
  `,
})
export class McpApp
  extends DynamicComponent<Types.CustomNode>
  implements OnDestroy, AfterViewInit
{
  private readonly sanitizer = inject(DomSanitizer);

  readonly content = input.required<Primitives.StringValue | null>();
  protected readonly resolvedContent: Signal<SafeHtml | null> = computed(() => {
    const rawContent = super.resolvePrimitive(this.content() ?? null);
    return rawContent
      ? this.sanitizer.bypassSecurityTrustHtml(rawContent)
      : null;
  });

  readonly allowedTools = input<string[]>([]);
  readonly title = input<Primitives.StringValue | null>();
  protected readonly resolvedTitle: Signal<string | null> = computed(() =>
    super.resolvePrimitive(this.title() ?? null),
  );

  protected readonly iframeSrc = signal<SafeResourceUrl | null>(
    this.sanitizer.bypassSecurityTrustResourceUrl('about:blank')
  );

  @ViewChild('iframe') iframeElement!: ElementRef<HTMLIFrameElement>;
  private appBridge: AppBridge | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  ngAfterViewInit() {
    this.setupSandbox();
  }

  ngOnDestroy() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
  }

  private setupSandbox() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }

    this.messageHandler = (event: MessageEvent) => {
      // Check if the message is from our iframe
      if (
        this.iframeElement?.nativeElement &&
        event.source === this.iframeElement.nativeElement.contentWindow &&
        event.data?.method === SANDBOX_PROXY_READY_METHOD
      ) {
        // Init bridge
        this.initializeBridge();
      }
    };

    window.addEventListener('message', this.messageHandler);

    // Set src to trigger load AFTER listener is ready
    // TODO: Make the sandbox URL configurable. To ensure CORS encapsulation, the sandbox
    // should be served from a different origin than the orchestrator.
    const sandboxUrl = 'sandbox_iframe/sandbox.html';
    this.iframeSrc.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(sandboxUrl),
    );
  }

  private async initializeBridge() {
    if (!this.iframeElement?.nativeElement?.contentWindow) {
      return;
    }

    const iframe = this.iframeElement.nativeElement;

    // The app bridge is initialized without a direct connection to MCP server.
    // Communication with MCP server is expected to be handled by the sandbox iframe.
    const emptyMcpClient = null;
    this.appBridge = new AppBridge(
      emptyMcpClient,
      { name: 'A2UI Orchestrator', version: '1.0.0' },
      {
        openLinks: {},
        logging: {},
        serverTools: {}, // Advertise support if we had a client
      },
    );

    this.appBridge.onloggingmessage = (params) => {
      console.log(`[MCP App Log] ${params.level}:`, params.data);
    };

    this.appBridge.oninitialized = () => {
      console.log('MCP App Initialized');
    };

    this.appBridge.onsizechange = ({ width, height }) => {
      // TODO: Implement dynamic resizing
      // Reference implementation in mcp-apps-custom-component.ts:
      // - Listen for size changes from the embedded app
      // - Update the iframe's width/height styles (with animation if desired)
      // - This prevents scrollbars and ensures the app fits its content
      //
      // Example logic:
      // if (height !== undefined) {
      //   this.iframeElement.nativeElement.style.height = `${height}px`;
      // }
      console.log(`[MCP App] Resize requested: ${width}x${height}`);
    };

    this.appBridge.oncalltool = async (params) => {
      // TODO: Implement tool execution security and dispatch
      // Reference implementation in mcp-apps-custom-component.ts:
      // 1. Check if params.name is in this.allowedTools()
      // 2. If allowed, dispatch an event (e.g. 'a2ui.action') to the host
      // 3. If not allowed, throw an error or warn
      //
      // Current implementation is read-only/logging only.
      //
      // Pseudo-code for dispatch:
      // const actionName = params.name;
      // if (this.allowedTools().includes(actionName)) {
      //   // Dispatch action to A2UI orchestrator/store
      //   // events.dispatch('a2ui.action', { name: actionName, ... });
      //   return { content: [{ type: "text", text: "Action dispatched" }] };
      // } else {
      //   console.warn(`Tool '${actionName}' blocked.`);
      //   throw new Error("Tool not allowed");
      // }
      console.log(`[MCP App] Tool call requested: ${params.name}`, params);
      throw new Error('Tool execution not yet implemented');
    };

    // Connect the bridge
    // We must pass the iframe's contentWindow as the target
    const transport = new PostMessageTransport(
      // The first argument is the target window to send messages TO (the iframe).
      // The second argument is the source window to validate messages FROM (also the iframe).
      iframe.contentWindow!,
      iframe.contentWindow!,
    );
    await this.appBridge.connect(transport);

    // Send the resource ready message to the sandbox iframe.
    const rawContent = super.resolvePrimitive(this.content() ?? null);
    if (rawContent) {
      await this.appBridge.sendSandboxResourceReady({
        html: rawContent,
        sandbox: 'allow-scripts allow-forms allow-popups',
      });
    }
  }
}
