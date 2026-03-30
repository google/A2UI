import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const List: import("svelte").Component<Props, {}, "">;
type List = ReturnType<typeof List>;
export default List;
//# sourceMappingURL=List.svelte.d.ts.map