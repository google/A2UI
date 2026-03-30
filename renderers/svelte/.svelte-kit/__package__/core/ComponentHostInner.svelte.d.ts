import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry } from './types.js';
interface Props {
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const ComponentHostInner: import("svelte").Component<Props, {}, "">;
type ComponentHostInner = ReturnType<typeof ComponentHostInner>;
export default ComponentHostInner;
//# sourceMappingURL=ComponentHostInner.svelte.d.ts.map