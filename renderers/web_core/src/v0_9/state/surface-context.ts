
import { DataModel } from './data-model.js';
import { Catalog } from '../catalog/types.js';
import { Theme } from '../types/theme.js';
import { defaultTheme } from '../themes/default.js';

export type ActionHandler = (action: any) => Promise<void>;

export interface ComponentInstance {
  id: string;
  type: string;
  properties?: Record<string, any>;
}

export class SurfaceContext {
  readonly dataModel: DataModel;

  // We store component definitions. 
  // In v0.9, `UpdateComponents` message provides a list of components.
  // We assume a flat map of ID -> Definition.
  private components: Map<string, ComponentInstance> = new Map();

  constructor(
    readonly id: string,
    readonly catalog: Catalog<any>,
    readonly theme: any = defaultTheme,
    private readonly actionHandler: ActionHandler
  ) {
    this.dataModel = new DataModel({});
  }

  get rootComponentId(): string | null {
    // The spec says one component with id 'root' must exist.
    return this.components.has('root') ? 'root' : null;
  }

  getComponentDefinition(componentId: string): ComponentInstance | undefined {
    return this.components.get(componentId);
  }

  handleMessage(message: any): void {
    if (message.updateComponents) {
      const payload = message.updateComponents;
      if (payload.surfaceId !== this.id) return;

      for (const comp of payload.components) {
        // Each comp is a ComponentNode or similar. 
        // JSON schema says items are "$ref": "catalog.json#/$defs/anyComponent"
        // which has "id" and "componentProperties" (which has "type" as key).
        // Wait, schema says "componentProperties" object with ONE key (the type).
        // e.g. { id: 'btn1', componentProperties: { Button: { label: 'Click' } } }

        const id = comp.id;
        const propsObj = comp.componentProperties || {};
        const type = Object.keys(propsObj)[0];

        if (type) {
          const properties = propsObj[type];
          this.components.set(id, {
            id,
            type,
            properties
          });
        }
      }
    } else if (message.updateDataModel) {
      const payload = message.updateDataModel;
      if (payload.surfaceId !== this.id) return;

      const path = payload.path || '/';
      const value = payload.value;

      // Spec: If value omitted, key is removed. DataModel handles undefined as removal.
      this.dataModel.set(path, value);
    }
  }

  dispatchAction(action: any): Promise<void> {
    return this.actionHandler(action);
  }
}
