/**
 * useA2UIStream Hook
 *
 * React hook for streaming A2UI updates from an agent server.
 * Handles connection, parsing, and state management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { A2UIComponent, A2UIMessage, ActionPayload } from '../types/a2ui-types';
import { createJSONLParser } from '../parser/jsonl-parser';

export interface A2UISpec {
  surfaceId: string;
  rootId: string;
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
}

export interface UseA2UIStreamOptions {
  /** URL of the A2UI server */
  url: string;
  /** Whether to automatically connect on mount */
  autoConnect?: boolean;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Headers to include in the request */
  headers?: Record<string, string>;
}

export interface UseA2UIStreamResult {
  /** The current A2UI specification */
  spec: A2UISpec | null;
  /** Whether the stream is loading */
  isLoading: boolean;
  /** Whether the stream is connected */
  isConnected: boolean;
  /** The last error that occurred */
  error: Error | null;
  /** Connect to the stream */
  connect: () => Promise<void>;
  /** Disconnect from the stream */
  disconnect: () => void;
  /** Send an action to the server */
  sendAction: (payload: ActionPayload) => Promise<void>;
  /** Reset the spec state */
  reset: () => void;
}

export function useA2UIStream(options: UseA2UIStreamOptions): UseA2UIStreamResult {
  const { url, autoConnect = false, onError, onConnectionChange, headers = {} } = options;

  const [spec, setSpec] = useState<A2UISpec | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const componentsMapRef = useRef<Map<string, A2UIComponent>>(new Map());
  const dataModelRef = useRef<Record<string, unknown>>({});

  // Handle incoming message
  const handleMessage = useCallback((message: A2UIMessage) => {
    switch (message.type) {
      case 'beginRendering':
        // Initialize new surface
        componentsMapRef.current.clear();
        dataModelRef.current = {};
        setSpec({
          surfaceId: message.surfaceId,
          rootId: message.rootId,
          components: [],
          dataModel: {},
        });
        break;

      case 'surfaceUpdate':
        // Add/update components
        for (const component of message.components) {
          componentsMapRef.current.set(component.id, component);
        }
        setSpec(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            components: Array.from(componentsMapRef.current.values()),
          };
        });
        break;

      case 'dataModelUpdate':
        // Update data model at path
        setValueAtPath(dataModelRef.current, message.path, message.value);
        setSpec(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            dataModel: { ...dataModelRef.current },
          };
        });
        break;

      case 'deleteSurface':
        // Clear the surface
        componentsMapRef.current.clear();
        dataModelRef.current = {};
        setSpec(null);
        break;

      case 'error': {
        const err = new Error(message.message);
        setError(err);
        if (onError) {
          onError(err);
        }
        break;
      }
    }
  }, [onError]);

  // Connect to the stream
  const connect = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/x-ndjson',
          ...headers,
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      setIsConnected(true);
      setIsLoading(false);
      if (onConnectionChange) {
        onConnectionChange(true);
      }

      const parser = createJSONLParser({
        onMessage: handleMessage,
        onError: (err) => {
          setError(err);
          if (onError) {
            onError(err);
          }
        },
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (!done && result.value) {
          const chunk = decoder.decode(result.value, { stream: true });
          parser.feed(chunk);
        }
      }

      // Complete any remaining data
      parser.end();

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Intentional abort, ignore
        return;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
      setIsConnected(false);
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    }
  }, [url, headers, handleMessage, onError, onConnectionChange]);

  // Disconnect from the stream
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
    if (onConnectionChange) {
      onConnectionChange(false);
    }
  }, [onConnectionChange]);

  // Send an action to the server
  const sendAction = useCallback(async (payload: ActionPayload) => {
    try {
      // Extract base URL without query params
      const baseUrl = url.split('?')[0];
      const actionUrl = `${baseUrl}/action`;

      await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [url, headers, onError]);

  // Reset the spec state
  const reset = useCallback(() => {
    componentsMapRef.current.clear();
    dataModelRef.current = {};
    setSpec(null);
    setError(null);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    spec,
    isLoading,
    isConnected,
    error,
    connect,
    disconnect,
    sendAction,
    reset,
  };
}

// Helper function to set value at a path in an object
function setValueAtPath(obj: Record<string, unknown>, path: string[], value: unknown): void {
  if (path.length === 0) return;

  let current: Record<string, unknown> = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

export default useA2UIStream;
