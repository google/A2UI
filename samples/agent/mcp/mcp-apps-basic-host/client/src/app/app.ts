import { Component, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements AfterViewInit {
  @ViewChild('appIframe') appIframe!: ElementRef<HTMLIFrameElement>;

  protected readonly status = signal<string>('Not connected');
  protected readonly mcpAppHtmlUrl = signal<string | null>(null);
  protected readonly isAppLoading = signal<boolean>(false);

  private mcpClient: Client | null = null;
  
  ngAfterViewInit() {
     // Iframe is available
  }

  async connectAndLoadApp() {
    this.status.set('Connecting to MCP Server...');
    this.isAppLoading.set(true);

    try {
      // 1. Connect to SSE
      const transport = new SSEClientTransport(new URL('http://127.0.0.1:8000/sse'));
      const client = new Client({
        name: "basic-host",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      this.status.set('Initializing MCP Client...');
      await client.connect(transport);
      this.mcpClient = client;

      this.status.set('Calling get_basic_app tool...');
      // 2. Call the tool to get the app
      const result = await client.callTool({
        name: "get_basic_app",
        arguments: {}
      });

      // 3. Extract resource URI
      const resourceContent = (result.content as any[]).find((c: any) => c.type === 'resource');
      if (!resourceContent || !resourceContent.resource?.uri) {
        throw new Error('Tool did not return a resource URI');
      }

      const resourceUri = resourceContent.resource.uri;
      this.status.set(`Reading resource: ${resourceUri}`);

      // 4. Read the resource
      const appResource = await client.readResource({ uri: resourceUri });
      const htmlContentObj = appResource.contents.find((c: any) => c.mimeType === 'text/html;profile=mcp-app' || 'text' in c) as any;
      
      if (!htmlContentObj || typeof htmlContentObj.text !== 'string') {
        throw new Error('Resource did not return valid HTML content');
      }

      const htmlContent = htmlContentObj.text as string;
      this.status.set('App loaded successfully!');

      // Set HTML content to iframe (Self-contained app pattern)
      if (this.appIframe && this.appIframe.nativeElement) {
         // Create Blob URL for src, which acts similarly to srcdoc but is sometimes easier for sandboxing
         // In a real double-iframe this would go to sandbox proxy. 
         // Here we inject an inline self-contained app.
         this.appIframe.nativeElement.srcdoc = htmlContent;

         // Pass ping requests (simple simulated proxy for liveness)
         window.addEventListener('message', (event) => {
            if (event.source === this.appIframe.nativeElement.contentWindow) {
                const target = event.source as Window;
                if (event.data?.method === 'ui/ping') {
                    // host replies to ping
                    if (event.data.id && target) {
                         target.postMessage({
                             jsonrpc: "2.0",
                             id: event.data.id,
                             result: {}
                         }, '*');
                    }
                } else if (event.data?.method === 'ui/initialize') {
                    if (event.data.id && target) {
                        target.postMessage({
                            jsonrpc: "2.0",
                            id: event.data.id,
                            result: {
                                hostCapabilities: {
                                    displayModes: ["inline"]
                                }
                            }
                        }, '*');
                    }
                }
            }
         });
      }

    } catch (e: any) {
      this.status.set(`Error: ${e.message}`);
    } finally {
      this.isAppLoading.set(false);
    }
  }
}
