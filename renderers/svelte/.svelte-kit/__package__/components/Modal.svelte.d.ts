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
declare const Modal: import("svelte").Component<Props, {}, "">;
type Modal = ReturnType<typeof Modal>;
export default Modal;
//# sourceMappingURL=Modal.svelte.d.ts.map