import type { Types } from '@a2ui/lit/0.8';

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

/**
 * Create a dataModelUpdate message.
 * Per A2UI spec: Updates application state independently of UI structure.
 */
export function createDataModelUpdate(
  contents: Array<{ key: string; value: unknown }>,
  surfaceId = '@default',
  path?: string
): Types.ServerToClientMessage {
  return {
    dataModelUpdate: {
      surfaceId,
      path,
      contents,
    },
  } as Types.ServerToClientMessage;
}

/**
 * Create a deleteSurface message.
 * Per A2UI spec: Removes a UI surface and associated content.
 */
export function createDeleteSurface(surfaceId: string): Types.ServerToClientMessage {
  return {
    deleteSurface: {
      surfaceId,
    },
  } as Types.ServerToClientMessage;
}

/**
 * Create a dataModelUpdate message with proper A2UI spec format.
 * Uses valueString for JSON-serializable values.
 */
export function createDataModelUpdateSpec(
  contents: Array<{ key: string; valueString?: string; valueMap?: unknown[] }>,
  surfaceId = '@default',
  path = '/'
): Types.ServerToClientMessage {
  return {
    dataModelUpdate: {
      surfaceId,
      path,
      contents,
    },
  } as Types.ServerToClientMessage;
}
