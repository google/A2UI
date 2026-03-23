import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const Column: import("svelte").Component<Props, {}, "">;
type Column = ReturnType<typeof Column>;
export default Column;
//# sourceMappingURL=Column.svelte.d.ts.map