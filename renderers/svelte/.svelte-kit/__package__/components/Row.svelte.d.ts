import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const Row: import("svelte").Component<Props, {}, "">;
type Row = ReturnType<typeof Row>;
export default Row;
//# sourceMappingURL=Row.svelte.d.ts.map