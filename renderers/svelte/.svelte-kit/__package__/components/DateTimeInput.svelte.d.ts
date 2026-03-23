import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const DateTimeInput: import("svelte").Component<Props, {}, "">;
type DateTimeInput = ReturnType<typeof DateTimeInput>;
export default DateTimeInput;
//# sourceMappingURL=DateTimeInput.svelte.d.ts.map