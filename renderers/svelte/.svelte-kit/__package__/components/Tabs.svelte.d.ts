import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const Tabs: import("svelte").Component<Props, {}, "">;
type Tabs = ReturnType<typeof Tabs>;
export default Tabs;
//# sourceMappingURL=Tabs.svelte.d.ts.map