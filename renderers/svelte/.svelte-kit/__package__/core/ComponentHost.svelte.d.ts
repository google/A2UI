import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry } from './types.js';
interface Props {
    surface: SurfaceModel<ComponentApi>;
    componentId?: string;
    dataContextPath?: string;
    registry: ComponentRegistry;
}
declare const ComponentHost: import("svelte").Component<Props, {}, "">;
type ComponentHost = ReturnType<typeof ComponentHost>;
export default ComponentHost;
//# sourceMappingURL=ComponentHost.svelte.d.ts.map