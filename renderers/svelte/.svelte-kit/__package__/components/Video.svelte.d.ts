import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentRegistry, BoundProperty } from '../core/types.js';
interface Props {
    props: Record<string, BoundProperty>;
    surface: SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
}
declare const Video: import("svelte").Component<Props, {}, "">;
type Video = ReturnType<typeof Video>;
export default Video;
//# sourceMappingURL=Video.svelte.d.ts.map