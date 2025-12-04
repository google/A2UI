import Ajv from "ajv";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

import { GeneratedResult, ValidatedResult, IssueSeverity } from "./types";
import { logger } from "./logger";

export class Validator {
  private ajv: Ajv;
  private validateFn: any;

  constructor(
    private schemas: Record<string, any>,
    private outputDir?: string
  ) {
    this.ajv = new Ajv({ allErrors: true, strict: false }); // strict: false to be lenient with unknown keywords if any
    for (const [name, schema] of Object.entries(schemas)) {
      this.ajv.addSchema(schema, name);
    }
    this.validateFn = this.ajv.getSchema(
      "https://a2ui.dev/specification/0.9/server_to_client.json"
    );
  }

  async run(results: GeneratedResult[]): Promise<ValidatedResult[]> {
    logger.info(
      `Starting Phase 2: Schema Validation (${results.length} items)`
    );
    const validatedResults: ValidatedResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    // Phase 2 is fast (CPU bound), so we can just iterate.
    // If we wanted to be fancy we could chunk it, but for < 1000 items it's instant.

    for (const result of results) {
      if (result.error || !result.components) {
        validatedResults.push({ ...result, validationErrors: [] }); // Already failed generation
        continue;
      }

      const errors: string[] = [];
      const components = result.components;

      // 1. AJV Validation
      if (this.validateFn) {
        for (const component of components) {
          if (!this.validateFn(component)) {
            errors.push(
              ...(this.validateFn.errors || []).map(
                (err: any) => `${err.instancePath} ${err.message}`
              )
            );
          }
        }
      }

      // 2. Custom Validation (Referential Integrity, etc.)
      this.validateCustom(components, errors);

      if (errors.length > 0) {
        failedCount++;
        if (this.outputDir) {
          this.saveFailure(result, errors);
        }
      } else {
        passedCount++;
      }

      validatedResults.push({
        ...result,
        validationErrors: errors,
      });
    }

    logger.info(
      `Phase 2: Validation Complete. Passed: ${passedCount}, Failed: ${failedCount}`
    );
    return validatedResults;
  }

  private saveFailure(result: GeneratedResult, errors: string[]) {
    if (!this.outputDir) return;
    const modelDir = path.join(
      this.outputDir,
      `output-${result.modelName.replace(/[\/:]/g, "_")}`
    );
    const detailsDir = path.join(modelDir, "details");
    const failureData = {
      pass: false,
      reason: "Schema validation failure",
      issues: errors.map((e) => ({
        issue: e,
        severity: "criticalSchema" as IssueSeverity,
      })),
      overallSeverity: "criticalSchema" as IssueSeverity,
    };

    fs.writeFileSync(
      path.join(
        detailsDir,
        `${result.prompt.name}.${result.runNumber}.failed.yaml`
      ),
      yaml.dump(failureData)
    );
  }

  private validateCustom(messages: any[], errors: string[]) {
    let hasUpdateComponents = false;
    let hasRootComponent = false;

    for (const message of messages) {
      if (message.updateComponents) {
        hasUpdateComponents = true;
        this.validateUpdateComponents(message.updateComponents, errors);

        // Check for root component in this message
        if (message.updateComponents.components) {
          for (const comp of message.updateComponents.components) {
            if (comp.id === "root") {
              hasRootComponent = true;
            }
          }
        }
      } else if (message.updateDataModel) {
        this.validateUpdateDataModel(message.updateDataModel, errors);
      } else if (message.createSurface) {
        this.validateBeginRendering(message.createSurface, errors);
      } else if (message.deleteSurface) {
        this.validateDeleteSurface(message.deleteSurface, errors);
      } else {
        // This should be caught by AJV usually, but good to have backup
        // errors.push("Unknown message type");
      }
    }

    // Algorithmic check for root component
    if (hasUpdateComponents && !hasRootComponent) {
      errors.push(
        "Missing root component: At least one 'updateComponents' message must contain a component with id: 'root'."
      );
    }
  }

  // ... Copied helper functions ...
  private validateDeleteSurface(data: any, errors: string[]) {
    if (data.surfaceId === undefined) {
      errors.push("DeleteSurface must have a 'surfaceId' property.");
    }
    const allowed = ["surfaceId"];
    for (const key in data) {
      if (!allowed.includes(key)) {
        errors.push(`DeleteSurface has unexpected property: ${key}`);
      }
    }
  }

  private validateUpdateComponents(data: any, errors: string[]) {
    if (data.surfaceId === undefined) {
      errors.push("UpdateComponents must have a 'surfaceId' property.");
    }
    if (!data.components || !Array.isArray(data.components)) {
      errors.push("UpdateComponents must have a 'components' array.");
      return;
    }

    const componentIds = new Set<string>();
    for (const c of data.components) {
      const id = c.id;
      if (id) {
        if (componentIds.has(id)) {
          errors.push(`Duplicate component ID found: ${id}`);
        }
        componentIds.add(id);
      }
    }

    for (const component of data.components) {
      this.validateComponent(component, componentIds, errors);
    }
  }

  private validateUpdateDataModel(data: any, errors: string[]) {
    if (data.surfaceId === undefined) {
      errors.push("updateDataModel must have a 'surfaceId' property.");
    }

    const allowedTopLevel = ["surfaceId", "path", "contents"];
    for (const key in data) {
      if (!allowedTopLevel.includes(key)) {
        errors.push(`updateDataModel has unexpected property: ${key}`);
      }
    }

    if (
      typeof data.contents !== "object" ||
      data.contents === null ||
      Array.isArray(data.contents)
    ) {
      errors.push("updateDataModel 'contents' property must be an object.");
      return;
    }
  }



  private validateBoundValue(
    prop: any,
    propName: string,
    componentId: string,
    componentType: string,
    errors: string[]
  ) {
    if (
      typeof prop === "string" ||
      typeof prop === "number" ||
      typeof prop === "boolean" ||
      Array.isArray(prop)
    ) {
      return;
    }

    if (typeof prop !== "object" || prop === null) {
      errors.push(
        `Component '${componentId}' of type '${componentType}' property '${propName}' must be a primitive or an object.`
      );
      return;
    }

    const keys = Object.keys(prop);
    if (keys.length !== 1 || keys[0] !== "path") {
      errors.push(
        `Component '${componentId}' of type '${componentType}' property '${propName}' object must have exactly one key: 'path'. Found: ${keys.join(", ")}`
      );
    }
  }

  private validateComponent(
    component: any,
    allIds: Set<string>,
    errors: string[]
  ) {
    const id = component.id;
    if (!id) {
      errors.push(`Component is missing an 'id'.`);
      return;
    }

    if (!component.props || typeof component.props !== "object") {
      errors.push(`Component '${id}' is missing 'props' object.`);
      return;
    }

    const properties = component.props;
    const componentType = properties.component;
    if (!componentType || typeof componentType !== "string") {
      errors.push(
        `Component '${id}' is missing 'component' property in 'props'.`
      );
      return;
    }

    // Basic required checks that might be missed by AJV if it's lenient or if we want specific messages
    // Actually AJV covers most of this, but the custom logic for 'children' and 'refs' is key.

    const checkRefs = (ids: (string | undefined)[]) => {
      for (const id of ids) {
        if (id && !allIds.has(id)) {
          errors.push(
            `Component ${JSON.stringify(id)} references non-existent component ID.`
          );
        }
      }
    };

    switch (componentType) {
      case "Row":
      case "Column":
      case "List":
        if (properties.children) {
          if (Array.isArray(properties.children)) {
            checkRefs(properties.children);
          } else if (
            typeof properties.children === "object" &&
            properties.children !== null
          ) {
            if (properties.children.componentId) {
              checkRefs([properties.children.componentId]);
            }
          }
        }
        break;
      case "Card":
        checkRefs([properties.child]);
        break;
      case "Tabs":
        if (properties.tabItems && Array.isArray(properties.tabItems)) {
          properties.tabItems.forEach((tab: any) => {
            checkRefs([tab.child]);
          });
        }
        break;
      case "Modal":
        checkRefs([properties.entryPointChild, properties.contentChild]);
        break;
      case "Button":
        checkRefs([properties.child]);
        break;
    }
  }
}
