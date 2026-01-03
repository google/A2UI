import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";

export class A2UIValidator {
  private ajv: Ajv;

  constructor(private schemas: Record<string, any>) {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    
    this.ajv.addSchema(schemas.commonTypes, "common_types.json");
    this.ajv.addSchema(schemas.standardCatalog, "standard_catalog_definition.json");
    this.ajv.addSchema(schemas.serverToClient, "server_to_client.json");
  }

  validate(messages: any[]): string[] {
    const errors: string[] = [];
    const createdSurfaces = new Set<string>();
    const componentIds = new Set<string>();
    let hasUpdateComponents = false;
    let hasRootComponent = false;

    for (const [index, message] of messages.entries()) {
      const msgPrefix = `Message[${index}]`;

      const valid = this.ajv.validate("server_to_client.json", message);
      if (!valid) {
        this.ajv.errors?.forEach(err => {
          errors.push(`${msgPrefix}: ${err.instancePath} ${err.message}`);
        });
      }

      if (message.createSurface) {
        if (!message.createSurface.surfaceId) {
            errors.push(`${msgPrefix}: createSurface missing surfaceId`);
        } else {
            createdSurfaces.add(message.createSurface.surfaceId);
        }
      } else if (message.updateComponents) {
        hasUpdateComponents = true;
        const surfaceId = message.updateComponents.surfaceId;
        
        if (surfaceId && !createdSurfaces.has(surfaceId)) {
          errors.push(`${msgPrefix}: updateComponents for unknown surface "${surfaceId}"`);
        }

        if (message.updateComponents.components) {
          this.validateComponents(message.updateComponents.components, componentIds, errors, msgPrefix);
          for (const comp of message.updateComponents.components) {
            if (comp.id === "root") hasRootComponent = true;
          }
        }
      }
    }

    if (hasUpdateComponents && !hasRootComponent) {
      errors.push("Missing \"root\" component. At least one updateComponents message must define id: \"root\".");
    }

    return errors;
  }

  private validateComponents(components: any[], allIds: Set<string>, errors: string[], prefix: string) {
    for (const comp of components) {
      if (comp.id) allIds.add(comp.id);
    }

    for (const comp of components) {
      if (!comp.id || !comp.component) continue;
      
      const checkRefs = (refs: any) => {
        const ids = Array.isArray(refs) ? refs : [refs];
        ids.forEach(id => {
            if (typeof id === "string" && !allIds.has(id)) {
                errors.push(`${prefix} Component "${comp.id}" references missing child ID: "${id}"`);
            }
            if (typeof id === "object" && id?.componentId && !allIds.has(id.componentId)) {
                errors.push(`${prefix} Component "${comp.id}" references missing child ID: "${id.componentId}"`);
            }
        });
      };

      if (["Row", "Column", "List"].includes(comp.component) && comp.children) {
        checkRefs(comp.children);
      }
      if (comp.component === "Card" && comp.child) checkRefs(comp.child);
      if (comp.component === "Button" && comp.child) checkRefs(comp.child);
      if (comp.component === "Modal") {
          if (comp.entryPointChild) checkRefs(comp.entryPointChild);
          if (comp.contentChild) checkRefs(comp.contentChild);
      }
    }
  }
}
