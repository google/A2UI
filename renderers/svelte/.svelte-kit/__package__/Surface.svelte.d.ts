import type { SurfaceGroupModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry } from './core/types.js';
interface Props {
    /** The surface group model containing all surfaces. */
    surfaceGroup: SurfaceGroupModel<ComponentApi>;
    /** The ID of the surface to render. */
    surfaceId: string;
    /** The component registry mapping type names to Svelte components. */
    registry: ComponentRegistry;
}
declare const Surface: import("svelte").Component<Props, {}, "">;
type Surface = ReturnType<typeof Surface>;
export default Surface;
//# sourceMappingURL=Surface.svelte.d.ts.map