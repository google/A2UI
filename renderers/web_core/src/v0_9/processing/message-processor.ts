
import { SurfaceContext, ActionHandler } from '../state/surface-context.js';
import { Catalog } from '../catalog/types.js';

export class A2uiMessageProcessor {
  private surfaces: Map<string, SurfaceContext> = new Map();

  /**
   * @param catalogs A list of available catalogs.
   * @param actionHandler A global handler for actions from all surfaces.
   */
  constructor(
    private catalogs: Catalog<any>[],
    private actionHandler: ActionHandler
  ) { }

  processMessages(messages: any[]): void {
    for (const msg of messages) {
      if (msg.createSurface) {
        this.handleCreateSurface(msg.createSurface);
      } else if (msg.blockInput) {
        // TODO: Handle blockInput
      } else if (msg.updateComponents || msg.updateDataModel || msg.deleteSurface) {
        this.routeMessage(msg);
      }
    }
  }

  getSurfaceContext(surfaceId: string): SurfaceContext | undefined {
    return this.surfaces.get(surfaceId);
  }

  private handleCreateSurface(payload: any) {
    const { surfaceId, catalogId, theme } = payload;

    // Find catalog
    const catalog = this.catalogs.find(c => c.id === catalogId);
    if (!catalog) {
      console.warn(`Catalog not found: ${catalogId}`);
      // Using first catalog as fallback or erroring? 
      // For now, let's create a surface with no catalog or throw?
      // Better to ignore or error.
      return;
    }

    const surface = new SurfaceContext(surfaceId, catalog, theme, this.actionHandler);
    this.surfaces.set(surfaceId, surface);
  }

  private routeMessage(msg: any) {
    // Extract surfaceId from payload
    const payload = msg.updateComponents || msg.updateDataModel || msg.deleteSurface;
    if (!payload?.surfaceId) return;

    if (msg.deleteSurface) {
      this.surfaces.delete(payload.surfaceId);
      return;
    }

    const surface = this.surfaces.get(payload.surfaceId);
    if (surface) {
      surface.handleMessage(msg);
    } else {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
    }
  }
}
