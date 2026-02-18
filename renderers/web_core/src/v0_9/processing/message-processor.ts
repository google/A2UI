
import { SurfaceModel, ActionHandler } from '../state/surface-model.js';
import { CatalogApi } from '../catalog/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SurfaceGroupModel, SurfaceLifecycleListener } from '../state/surface-group-model.js';

export type { SurfaceLifecycleListener };

export interface ClientCapabilitiesOptions<T extends CatalogApi> {
  /**
   * A list of Catalog instances that should be serialized 
   * and sent as 'inlineCatalogs'.
   */
  inlineCatalogs?: T[];
}

/**
 * The central processor for A2UI messages.
 * @template T The concrete type of the Catalog, which extends CatalogApi.
 */
export class A2uiMessageProcessor<T extends CatalogApi> {
  readonly model: SurfaceGroupModel<T> = new SurfaceGroupModel<T>();

  /**
   * @param catalogs A list of available catalogs.
   * @param actionHandler A global handler for actions from all surfaces.
   */
  constructor(
    private catalogs: T[],
    private actionHandler: ActionHandler
  ) { }

  /**
   * Adds a listener for surface lifecycle events.
   * @returns A function to unsubscribe the listener.
   */
  addLifecycleListener(listener: SurfaceLifecycleListener<T>): () => void {
    return this.model.addLifecycleListener(listener);
  }

  /**
   * Removes a lifecycle listener.
   */
  removeLifecycleListener(listener: SurfaceLifecycleListener<T>): void {
    this.model.removeLifecycleListener(listener);
  }

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

  getSurfaceModel(surfaceId: string): SurfaceModel<T> | undefined {
    return this.model.getSurface(surfaceId);
  }

  getClientCapabilities(options: ClientCapabilitiesOptions<T> = {}): any {
    const inlineCatalogsDef = (options.inlineCatalogs || []).map(catalog => {
      const componentsSchema: Record<string, any> = {};
      
      for (const [name, comp] of catalog.components) {
        // 1. Convert Zod -> JSON Schema
        const rawJsonSchema = zodToJsonSchema(comp.schema, { 
            // Strategy to map tagged Zod types to "$ref": "common_types.json..."
            target: 'jsonSchema2019-09',
        });
        
        // Post-process to resolve references
        const resolvedSchema = this.resolveCommonTypeRefs(rawJsonSchema);

        // 2. Wrap in A2UI Component Envelope
        componentsSchema[name] = this.wrapComponentSchema(name, resolvedSchema);
      }

      return {
        catalogId: catalog.id,
        components: componentsSchema,
        // functions: ... (if applicable)
        // theme: ... (if applicable)
      };
    });

    return {
      supportedCatalogIds: this.catalogs.map(c => c.id),
      inlineCatalogs: inlineCatalogsDef.length > 0 ? inlineCatalogsDef : undefined
    };
  }

  private resolveCommonTypeRefs(schema: any): any {
    // Recursively traverse the schema object.
    // If a node has `description` starting with `REF:`, replace the entire node with { $ref: ... }
    if (typeof schema !== 'object' || schema === null) return schema;

    if (typeof schema.description === 'string' && schema.description.startsWith('REF:')) {
      const parts = schema.description.split('__SEP__');
      const ref = parts[0].substring(4); // Remove 'REF:'
      const result: any = { $ref: ref };
      
      // If there was a real description after the REF tag, preserve it
      if (parts.length > 1) {
        result.description = parts[1];
      }
      
      return result;
    }

    if (Array.isArray(schema)) {
      return schema.map((item: any) => this.resolveCommonTypeRefs(item));
    }

    const result: any = {};
    for (const key in schema) {
      result[key] = this.resolveCommonTypeRefs(schema[key]);
    }
    return result;
  }

  private wrapComponentSchema(name: string, propsSchema: any): any {
    // Logic to construct the { allOf: [ComponentCommon, ...], properties: { component: {const: name} } } structure
    // merging properties from propsSchema
    return {
       type: "object",
       allOf: [
         { "$ref": "common_types.json#/$defs/ComponentCommon" },
         // Note: Catalog-specific common properties (like weight) should be included in propsSchema.
         {
           type: "object",
           properties: {
             component: { const: name },
             ...propsSchema.properties
           },
           required: ["component", ...(propsSchema.required || [])]
         }
       ],
       unevaluatedProperties: false
    };
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

    this.model.createSurface(surfaceId, catalog, theme, this.actionHandler);
  }

  private routeMessage(msg: any) {
    // Extract surfaceId from payload
    const payload = msg.updateComponents || msg.updateDataModel || msg.deleteSurface;
    if (!payload?.surfaceId) return;

    if (msg.deleteSurface) {
      this.model.deleteSurface(payload.surfaceId);
      return;
    }

    const surface = this.model.getSurface(payload.surfaceId);
    if (surface) {
      if (msg.updateComponents) {
        const payload = msg.updateComponents;
        for (const comp of payload.components) {
          const { id, component, ...properties } = comp;
          
          const existing = surface.componentsModel.get(id);
          if (existing) {
            if (component && component !== existing.type) {
                console.warn(`Attempting to change type of component ${id} from ${existing.type} to ${component}. Ignoring new type.`);
            }
            existing.update(properties);
          } else {
            if (!component) {
                console.warn(`Cannot create component ${id} without a type.`);
                continue;
            }
            surface.componentsModel.createComponent(id, component, properties);
          }
        }
      } else if (msg.updateDataModel) {
        const payload = msg.updateDataModel;
        const path = payload.path || '/';
        const value = payload.value;
        surface.dataModel.set(path, value);
      }
    } else {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
    }
  }
}
