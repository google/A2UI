/**
 * A2UI SSE Transport
 * Server-Sent Events transport implementation for A2UI protocol
 */

import type { A2UITransport, TransportStatus, TransportConfig } from './types';
import type { A2UIServerMessage, ClientToServerMessage } from '../processor/types';
import { JSONLStreamParser } from './jsonl-parser';

type MessageHandler = (msg: A2UIServerMessage) => void;
type StatusHandler = (status: TransportStatus) => void;
type ErrorHandler = (error: Error) => void;

/**
 * SSE Transport Configuration
 */
export interface SSETransportConfig extends TransportConfig {
  /** Custom headers for the SSE connection */
  headers?: Record<string, string>;
  /** Fetch options for action requests */
  actionFetchOptions?: RequestInit;
}

/**
 * SSE-based transport for A2UI protocol
 */
export class SSETransport implements A2UITransport {
  private _status: TransportStatus = 'disconnected';
  private eventSource: EventSource | null = null;
  private parser: JSONLStreamParser;
  private url = '';
  private config: SSETransportConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private errorHandlers = new Set<ErrorHandler>();

  constructor(config: SSETransportConfig = {}) {
    this.config = {
      reconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      ...config,
    };

    this.parser = new JSONLStreamParser((msg) => {
      this.notifyMessage(msg);
    });
  }

  get status(): TransportStatus {
    return this._status;
  }

  private setStatus(status: TransportStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.notifyStatus(status);
    }
  }

  async connect(url: string): Promise<void> {
    if (this.eventSource) {
      this.disconnect();
    }

    this.url = url;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
          this.reconnectAttempts = 0;
          this.setStatus('connected');
          resolve();
        };

        this.eventSource.onmessage = (event) => {
          // SSE data can be multi-line, but EventSource handles that
          this.parser.feed(event.data + '\n');
        };

        this.eventSource.onerror = () => {
          const error = new Error('SSE connection error');
          this.notifyError(error);

          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.setStatus('disconnected');
            this.handleDisconnect();

            // Only reject the promise if we haven't connected yet
            if (this._status === 'connecting') {
              reject(error);
            }
          } else {
            this.setStatus('error');
          }
        };
      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.parser.reset();
    this.setStatus('disconnected');
  }

  async sendMessage(message: ClientToServerMessage): Promise<void> {
    const endpoint = this.config.actionEndpoint || this.deriveActionEndpoint();

    if (!endpoint) {
      throw new Error('No action endpoint configured');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(message),
      ...this.config.actionFetchOptions,
    });

    if (!response.ok) {
      throw new Error(`Action failed: ${response.status} ${response.statusText}`);
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private deriveActionEndpoint(): string | null {
    if (!this.url) return null;
    // Convention: replace /stream or /sse suffix with /action
    return this.url.replace(/\/(stream|sse)$/, '/action');
  }

  private handleDisconnect(): void {
    if (!this.config.reconnect) return;
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      this.notifyError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = (this.config.reconnectDelay || 1000) * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.url).catch((error) => {
        console.warn('[A2UI] Reconnection failed:', error);
      });
    }, delay);
  }

  private notifyMessage(msg: A2UIServerMessage): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(msg);
      } catch (error) {
        console.error('[A2UI] Message handler error:', error);
      }
    }
  }

  private notifyStatus(status: TransportStatus): void {
    for (const handler of this.statusHandlers) {
      try {
        handler(status);
      } catch (error) {
        console.error('[A2UI] Status handler error:', error);
      }
    }
  }

  private notifyError(error: Error): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (err) {
        console.error('[A2UI] Error handler error:', err);
      }
    }
  }
}
