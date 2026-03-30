import {
  MessageProcessor,
  type Catalog,
  type ComponentApi,
  type SurfaceGroupModel,
} from '@a2ui/web_core/v0_9';

/**
 * Options for creating an A2UI renderer instance.
 */
export interface A2UIOptions {
  /** The component catalogs defining available components and functions. */
  catalogs: Catalog<ComponentApi>[];
  /** Called when a component dispatches an action (receives A2uiClientAction). */
  onAction?: (action: any) => void;
  /** Called when any surface dispatches an error. */
  onError?: (error: any) => void;
}

/**
 * The return value of `createA2UI()` — provides the API for managing A2UI surfaces.
 */
export interface A2UIInstance {
  /** The surface group model containing all active surfaces. */
  readonly surfaceGroup: SurfaceGroupModel<ComponentApi>;
  /** The message processor for sending messages. */
  readonly processor: MessageProcessor<ComponentApi>;
  /** Process one or more A2UI server messages (createSurface, updateComponents, etc.). */
  processMessages: (messages: any[]) => void;
  /** Get the client data model for surfaces with sendDataModel=true. */
  getClientDataModel: () => any;
  /** Tear down all subscriptions and models. Call on component unmount. */
  dispose: () => void;
}

/**
 * Creates an A2UI renderer instance for managing surfaces and processing messages.
 *
 * This is the main entry point for using A2UI in a Svelte application.
 * Call this in a component's `<script>` block, and use `$effect` for cleanup.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createA2UI } from '@a2ui/svelte';
 *   import { createDefaultRegistry } from '@a2ui/svelte/components';
 *
 *   const a2ui = createA2UI({
 *     catalogs: [catalog],
 *     onAction: (action) => console.log('Action:', action),
 *   });
 *
 *   $effect(() => () => a2ui.dispose());
 * </script>
 *
 * <Surface surfaceGroup={a2ui.surfaceGroup} surfaceId="main" {registry} />
 * ```
 */
export function createA2UI(options: A2UIOptions): A2UIInstance {
  const processor = new MessageProcessor(options.catalogs);
  const surfaceGroup = processor.model;
  const unsubs: (() => void)[] = [];

  // Subscribe to actions from all surfaces
  const actionSub = surfaceGroup.onAction.subscribe((event) => {
    options.onAction?.(event);
  });
  unsubs.push(() => actionSub.unsubscribe());

  // Subscribe to errors — SurfaceGroupModel doesn't aggregate errors,
  // so we subscribe to each surface as it's created.
  if (options.onError) {
    const surfaceCreatedSub = surfaceGroup.onSurfaceCreated.subscribe((surface) => {
      const errorSub = surface.onError.subscribe((error: any) => {
        options.onError!(error);
      });
      // Clean up error sub when surface is deleted
      const deletedSub = surfaceGroup.onSurfaceDeleted.subscribe((deletedId) => {
        if (deletedId === surface.id) {
          errorSub.unsubscribe();
          deletedSub.unsubscribe();
        }
      });
      unsubs.push(() => {
        errorSub.unsubscribe();
        deletedSub.unsubscribe();
      });
    });
    unsubs.push(() => surfaceCreatedSub.unsubscribe());
  }

  return {
    surfaceGroup,
    processor,

    processMessages(messages: any[]) {
      processor.processMessages(messages);
    },

    getClientDataModel() {
      return processor.getClientDataModel();
    },

    dispose() {
      for (const unsub of unsubs) unsub();
      unsubs.length = 0;
      surfaceGroup.dispose();
    },
  };
}
