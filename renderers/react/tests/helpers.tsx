import React, { useEffect, type ReactNode } from 'react';
import { A2UIProvider, A2UIRenderer, useA2UI } from '../src';
import type { Types } from '@a2ui/lit/0.8';

/**
 * Helper component that processes messages and renders a surface.
 */
export function TestRenderer({
  messages,
  surfaceId = '@default',
}: {
  messages: Types.ServerToClientMessage[];
  surfaceId?: string;
}) {
  const { processMessages } = useA2UI();

  useEffect(() => {
    processMessages(messages);
  }, [messages, processMessages]);

  return <A2UIRenderer surfaceId={surfaceId} />;
}

/**
 * Full test wrapper with A2UIProvider.
 */
export function TestWrapper({
  children,
  onAction,
  theme,
}: {
  children: ReactNode;
  onAction?: (action: Types.A2UIClientEventMessage) => void;
  theme?: Types.Theme;
}) {
  return (
    <A2UIProvider onAction={onAction} theme={theme}>
      {children}
    </A2UIProvider>
  );
}

/**
 * Create a surface update message with components.
 */
export function createSurfaceUpdate(
  components: Array<{ id: string; component: Record<string, unknown> }>,
  surfaceId = '@default'
): Types.ServerToClientMessage {
  return {
    surfaceUpdate: {
      surfaceId,
      components: components.map((c) => ({
        id: c.id,
        component: c.component,
      })),
    },
  } as Types.ServerToClientMessage;
}

/**
 * Create a begin rendering message.
 */
export function createBeginRendering(
  rootId: string,
  surfaceId = '@default'
): Types.ServerToClientMessage {
  return {
    beginRendering: {
      root: rootId,
      surfaceId,
    },
  } as Types.ServerToClientMessage;
}

/**
 * Create messages for a simple component render.
 */
export function createSimpleMessages(
  id: string,
  componentType: string,
  props: Record<string, unknown>,
  surfaceId = '@default'
): Types.ServerToClientMessage[] {
  return [
    createSurfaceUpdate(
      [{ id, component: { [componentType]: props } }],
      surfaceId
    ),
    createBeginRendering(id, surfaceId),
  ];
}
