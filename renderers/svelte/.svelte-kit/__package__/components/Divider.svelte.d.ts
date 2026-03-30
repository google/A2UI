import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const Divider: import("svelte").Component<Props, {}, "">;
type Divider = ReturnType<typeof Divider>;
export default Divider;
//# sourceMappingURL=Divider.svelte.d.ts.map