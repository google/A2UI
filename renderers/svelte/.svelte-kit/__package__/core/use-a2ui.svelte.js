import { MessageProcessor, } from '@a2ui/web_core/v0_9';
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
export function createA2UI(options) {
    const processor = new MessageProcessor(options.catalogs);
    const surfaceGroup = processor.model;
    const unsubs = [];
    // Subscribe to actions from all surfaces
    const actionSub = surfaceGroup.onAction.subscribe((event) => {
        options.onAction?.(event);
    });
    unsubs.push(() => actionSub.unsubscribe());
    // Subscribe to errors — SurfaceGroupModel doesn't aggregate errors,
    // so we subscribe to each surface as it's created.
    if (options.onError) {
        const surfaceCreatedSub = surfaceGroup.onSurfaceCreated.subscribe((surface) => {
            const errorSub = surface.onError.subscribe((error) => {
                options.onError(error);
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
        processMessages(messages) {
            processor.processMessages(messages);
        },
        getClientDataModel() {
            return processor.getClientDataModel();
        },
        dispose() {
            for (const unsub of unsubs)
                unsub();
            unsubs.length = 0;
            surfaceGroup.dispose();
        },
    };
}
