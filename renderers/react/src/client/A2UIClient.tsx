/**
 * A2UIClient Component
 * High-level component that combines transport, processor, and surface rendering
 */

import {
  type ReactElement,
  type CSSProperties,
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { MessageProcessor } from '../processor';
import type { ClientToServerMessage } from '../processor/types';
import { SSETransport, type SSETransportConfig, type TransportStatus } from '../transport';
import { A2UISurface, A2UIMultiSurface, useSurfaceIds } from '../surface';
import type { A2UITheme, A2UIAction } from '../types';
import { createUserActionMessage } from '../actions';

// =============================================================================
// CLIENT CONTEXT
// =============================================================================

interface A2UIClientContextValue {
  processor: MessageProcessor;
  transport: SSETransport;
  status: TransportStatus;
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: ClientToServerMessage) => Promise<void>;
  /** Convenience method to send a userAction */
  sendUserAction: (action: A2UIAction, surfaceId: string, sourceComponentId: string) => Promise<void>;
}

const A2UIClientContext = createContext<A2UIClientContextValue | null>(null);

export function useA2UIClient(): A2UIClientContextValue {
  const ctx = useContext(A2UIClientContext);
  if (!ctx) throw new Error('useA2UIClient must be used within A2UIClient');
  return ctx;
}

// =============================================================================
// CLIENT PROPS
// =============================================================================

interface A2UIClientProps {
  /** SSE endpoint URL - if provided, auto-connects */
  url?: string;
  /** Transport configuration */
  transportConfig?: SSETransportConfig;
  /** Handler for actions - if not provided, actions are sent via transport */
  onAction?: (action: A2UIAction, surfaceId: string, sourceComponentId: string) => void;
  /** Handler for connection status changes */
  onStatusChange?: (status: TransportStatus) => void;
  /** Handler for errors */
  onError?: (error: Error) => void;
  /** Theme overrides */
  theme?: Partial<A2UITheme>;
  /** Light/dark mode */
  mode?: 'light' | 'dark';
  /** Render mode: 'single' renders first surface, 'multi' renders all */
  renderMode?: 'single' | 'multi';
  /** Specific surface ID to render (only for 'single' mode) */
  surfaceId?: string;
  /** Layout direction for multi-surface mode */
  direction?: 'row' | 'column';
  /** Gap between surfaces in multi-surface mode */
  gap?: number;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Show loading indicator while connecting */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactElement;
  /** Custom error component */
  errorComponent?: (error: Error) => ReactElement;
  /** Custom disconnected component */
  disconnectedComponent?: ReactElement;
  /** Children to render (advanced: custom surface rendering) */
  children?: ReactElement;
}

// =============================================================================
// A2UI CLIENT COMPONENT
// =============================================================================

/**
 * A2UIClient is the main entry point for A2UI protocol rendering
 *
 * It manages:
 * - Transport connection (SSE)
 * - Message processing
 * - Surface rendering
 * - Action dispatching
 *
 * @example
 * ```tsx
 * <A2UIClient url="http://localhost:3000/a2ui/stream">
 *   {({ surfaceIds }) => surfaceIds.map(id => <MySurface key={id} id={id} />)}
 * </A2UIClient>
 * ```
 */
export function A2UIClient({
  url,
  transportConfig,
  onAction,
  onStatusChange,
  onError,
  theme,
  mode = 'light',
  renderMode = 'multi',
  surfaceId: targetSurfaceId,
  direction = 'column',
  gap = 16,
  className,
  style,
  showLoading = true,
  loadingComponent,
  errorComponent,
  disconnectedComponent,
  children,
}: A2UIClientProps): ReactElement | null {
  // Create processor and transport instances
  const processor = useMemo(() => new MessageProcessor(), []);
  const transport = useMemo(() => new SSETransport(transportConfig), [transportConfig]);

  const [status, setStatus] = useState<TransportStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  // Connect transport to processor
  useEffect(() => {
    const unsubMessage = transport.onMessage((msg) => {
      processor.processMessage(msg);
    });

    const unsubStatus = transport.onStatusChange((newStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    });

    const unsubError = transport.onError((err) => {
      setError(err);
      onError?.(err);
    });

    return () => {
      unsubMessage();
      unsubStatus();
      unsubError();
    };
  }, [transport, processor, onStatusChange, onError]);

  // Auto-connect if URL provided
  useEffect(() => {
    if (url) {
      transport.connect(url).catch((err) => {
        setError(err);
        onError?.(err);
      });
    }

    return () => {
      transport.disconnect();
    };
  }, [url, transport, onError]);

  // Send a raw ClientToServerMessage
  const sendMessage = useCallback(
    async (message: ClientToServerMessage) => {
      try {
        await transport.sendMessage(message);
      } catch (err) {
        setError(err as Error);
        onError?.(err as Error);
      }
    },
    [transport, onError]
  );

  // Send a user action (convenience method)
  const sendUserAction = useCallback(
    async (action: A2UIAction, surfaceId: string, sourceComponentId: string) => {
      if (onAction) {
        onAction(action, surfaceId, sourceComponentId);
      } else {
        const message = createUserActionMessage(action, surfaceId, sourceComponentId);
        await sendMessage(message);
      }
    },
    [onAction, sendMessage]
  );

  // Connect/disconnect functions for context
  const connect = useCallback(
    async (connectUrl: string) => {
      await transport.connect(connectUrl);
    },
    [transport]
  );

  const disconnect = useCallback(() => {
    transport.disconnect();
  }, [transport]);

  // Context value
  const contextValue = useMemo<A2UIClientContextValue>(
    () => ({
      processor,
      transport,
      status,
      connect,
      disconnect,
      sendMessage,
      sendUserAction,
    }),
    [processor, transport, status, connect, disconnect, sendMessage, sendUserAction]
  );

  // Handle different states
  if (status === 'connecting' && showLoading) {
    return (
      loadingComponent || (
        <div className="a2ui-client-loading" style={{ padding: 16, textAlign: 'center', color: '#666' }}>
          Connecting...
        </div>
      )
    );
  }

  if (status === 'error' && error && errorComponent) {
    return errorComponent(error);
  }

  if (status === 'disconnected' && disconnectedComponent) {
    return disconnectedComponent;
  }

  // Render with context
  return (
    <A2UIClientContext.Provider value={contextValue}>
      {children || (
        <ClientSurfaces
          processor={processor}
          onAction={sendUserAction}
          theme={theme}
          mode={mode}
          renderMode={renderMode}
          targetSurfaceId={targetSurfaceId}
          direction={direction}
          gap={gap}
          className={className}
          style={style}
        />
      )}
    </A2UIClientContext.Provider>
  );
}

// =============================================================================
// CLIENT SURFACES
// =============================================================================

interface ClientSurfacesProps {
  processor: MessageProcessor;
  onAction: (action: A2UIAction, surfaceId: string, sourceComponentId: string) => void;
  theme?: Partial<A2UITheme>;
  mode: 'light' | 'dark';
  renderMode: 'single' | 'multi';
  targetSurfaceId?: string;
  direction: 'row' | 'column';
  gap: number;
  className?: string;
  style?: CSSProperties;
}

function ClientSurfaces({
  processor,
  onAction,
  theme,
  mode,
  renderMode,
  targetSurfaceId,
  direction,
  gap,
  className,
  style,
}: ClientSurfacesProps): ReactElement | null {
  const surfaceIds = useSurfaceIds(processor);

  if (renderMode === 'single') {
    // Render specific surface or first available
    const surfaceId = targetSurfaceId || surfaceIds[0];
    if (!surfaceId) return null;

    return (
      <A2UISurface
        surfaceId={surfaceId}
        processor={processor}
        onAction={onAction}
        theme={theme}
        mode={mode}
        className={className}
        style={style}
      />
    );
  }

  // Multi-surface mode
  return (
    <A2UIMultiSurface
      processor={processor}
      onAction={onAction}
      surfaceProps={{ theme, mode }}
      direction={direction}
      gap={gap}
      className={className}
      style={style}
    />
  );
}

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

/**
 * Hook to get the current connection status
 */
export function useConnectionStatus(): TransportStatus {
  const { status } = useA2UIClient();
  return status;
}

/**
 * Hook to send a user action (spec-compliant format)
 */
export function useSendUserAction(): (action: A2UIAction, surfaceId: string, sourceComponentId: string) => Promise<void> {
  const { sendUserAction } = useA2UIClient();
  return sendUserAction;
}

/**
 * Hook to send a raw ClientToServerMessage
 */
export function useSendMessage(): (message: ClientToServerMessage) => Promise<void> {
  const { sendMessage } = useA2UIClient();
  return sendMessage;
}

/**
 * @deprecated Use useSendUserAction instead
 */
export function useSendAction(): (action: A2UIAction, surfaceId: string, sourceComponentId: string) => Promise<void> {
  return useSendUserAction();
}
