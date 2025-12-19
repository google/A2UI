/**
 * A2UI Transport Layer Types
 */

import type { A2UIServerMessage, ClientToServerMessage } from '../processor/types';

/**
 * Transport connection status
 */
export type TransportStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Transport event types
 */
export interface TransportEvents {
  message: (msg: A2UIServerMessage) => void;
  statusChange: (status: TransportStatus) => void;
  error: (error: Error) => void;
}

/**
 * Transport interface - implement this for different transports
 */
export interface A2UITransport {
  /** Current connection status */
  readonly status: TransportStatus;

  /** Connect to the server */
  connect(url: string): Promise<void>;

  /** Disconnect from the server */
  disconnect(): void;

  /** Send a message to the server (spec-compliant format) */
  sendMessage(message: ClientToServerMessage): Promise<void>;

  /** Subscribe to messages */
  onMessage(handler: (msg: A2UIServerMessage) => void): () => void;

  /** Subscribe to status changes */
  onStatusChange(handler: (status: TransportStatus) => void): () => void;

  /** Subscribe to errors */
  onError(handler: (error: Error) => void): () => void;
}

/**
 * Transport configuration options
 */
export interface TransportConfig {
  /** Reconnect on disconnect */
  reconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
  /** Action endpoint (for REST-based action sending) */
  actionEndpoint?: string;
}
