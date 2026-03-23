import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
    theme?: any;
}
declare const TextField: import("svelte").Component<Props, {}, "">;
type TextField = ReturnType<typeof TextField>;
export default TextField;
//# sourceMappingURL=TextField.svelte.d.ts.map