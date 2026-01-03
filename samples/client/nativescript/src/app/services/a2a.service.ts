import { Injectable, signal, computed } from "@angular/core";
import { Http, HttpResponse } from "@nativescript/core";
import { Types } from "../../a2ui-lit-types";

export interface AgentCard {
  name: string;
  description?: string;
  icon?: string;
  capabilities?: string[];
  version?: string;
  provider?: string;
}

export interface MessagePart {
  type: "text" | "file" | "data";
  text?: string;
  mimeType?: string;
  data?: unknown;
}

export interface A2aMessage {
  role: "user" | "agent";
  parts: MessagePart[];
  timestamp?: number;
  taskId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  surfaces?: Types.A2uiMessage[];
  status?: "sending" | "sent" | "error";
}

@Injectable({ providedIn: "root" })
export class A2aService {
  // Configure your A2A server endpoint here
  private readonly serverUrl = "http://localhost:10002";
  // A2A SDK uses root endpoint for JSON-RPC
  private readonly endpoint = "/";

  private readonly _connected = signal(false);
  private readonly _agentCard = signal<AgentCard | null>(null);
  private readonly _loading = signal(false);
  private abortController: AbortController | null = null;

  readonly connected = this._connected.asReadonly();
  readonly agentCard = this._agentCard.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly agentName = computed(() => {
    return this._agentCard()?.name ?? "A2UI Agent";
  });
  readonly agentDescription = computed(
    () => this._agentCard()?.description ?? "Powered by Google AI"
  );

  async connect(): Promise<boolean> {
    try {
      const card = await this.getAgentCard();
      if (card) {
        this._agentCard.set(card);
        this._connected.set(true);
        return true;
      }
    } catch (error) {
      console.error("Failed to connect to A2A server:", error);
      this._connected.set(false);
    }
    return false;
  }

  async getAgentCard(): Promise<AgentCard | null> {
    try {
      const response = await Http.request({
        url: `${this.serverUrl}/.well-known/agent-card.json`,
        method: "GET",
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });

      if (response.statusCode === 200) {
        const content = response.content;
        if (typeof content === "string") {
          return JSON.parse(content) as AgentCard;
        }
        // Handle HttpContent object
        const contentObj = content as any;
        if (contentObj && typeof contentObj.toJSON === "function") {
          return contentObj.toJSON() as AgentCard;
        }
        return contentObj as AgentCard;
      }
    } catch (error) {
      console.log("Agent card not available, using defaults");
    }
    return null;
  }

  // Supported A2UI catalog URIs - tells the agent we support A2UI rendering
  private readonly supportedCatalogIds = [
    "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/0.8/json/standard_catalog_definition.json",
  ];

  async sendMessage(
    parts: MessagePart[],
    onUpdate?: (data: any) => void
  ): Promise<any> {
    this._loading.set(true);

    try {
      const messageId = this.generateTaskId();
      const requestId = this.generateTaskId();
      const requestBody = {
        jsonrpc: "2.0",
        id: requestId,
        method: "message/send",
        params: {
          message: {
            messageId: messageId,
            role: "user",
            parts: parts.map((p) => ({
              kind: p.type, // A2A uses 'kind' not 'type'
              text: p.text,
              mimeType: p.mimeType,
              data: p.data,
            })),
          },
          // Tell the agent we support A2UI - this activates the A2UI extension
          metadata: {
            a2uiClientCapabilities: {
              supportedCatalogIds: this.supportedCatalogIds,
            },
          },
        },
      };

      console.log("Sending A2A request with A2UI capabilities");

      const response = await Http.request({
        url: `${this.serverUrl}${this.endpoint}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // This header tells the A2A server to activate the A2UI extension
          "X-A2A-Extensions": "https://a2ui.org/a2a-extension/a2ui/v0.8",
        },
        content: JSON.stringify(requestBody),
        timeout: 60000,
      });

      if (response.statusCode === 200) {
        // NativeScript Http returns HttpContent object, not raw string
        // We need to use toJSON() or toString() to get the actual content
        let data: any;
        const content = response.content;

        if (typeof content === "string") {
          data = JSON.parse(content);
        } else if (content && typeof content.toJSON === "function") {
          // HttpContent object - use toJSON() to parse directly
          data = content.toJSON();
        } else if (content && typeof content.toString === "function") {
          // Fallback: try toString then parse
          const str = content.toString();
          data = JSON.parse(str);
        } else {
          // Last resort: assume it's already parsed
          data = content;
        }

        if (onUpdate) {
          onUpdate(data);
        }

        return data;
      } else {
        throw new Error(`Server returned ${response.statusCode}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this._loading.set(false);
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
