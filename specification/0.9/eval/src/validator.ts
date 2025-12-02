/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import Ajv from "ajv";
import fs from "fs";
import path from "path";
import { SurfaceUpdateSchemaMatcher } from "./surface_update_schema_matcher";
import { SchemaMatcher } from "./schema_matcher";

const ajv = new Ajv({ strict: false });

const schemaDir = path.resolve(process.cwd(), "../");
const serverToClientSchema = JSON.parse(
  fs.readFileSync(
    path.join(schemaDir, "json", "server_to_client.json"),
    "utf-8"
  )
);
const standardCatalogDefinitionSchema = JSON.parse(
  fs.readFileSync(
    path.join(schemaDir, "json", "standard_catalog_definition.json"),
    "utf-8"
  )
);
const commonTypesSchema = JSON.parse(
  fs.readFileSync(path.join(schemaDir, "json", "common_types.json"), "utf-8")
);

ajv.addSchema(commonTypesSchema, "common_types.json");
ajv.addSchema(
  standardCatalogDefinitionSchema,
  "standard_catalog_definition.json"
);
const validate = ajv.compile(serverToClientSchema);

export function validateSchema(
  data: any,
  matchers?: SchemaMatcher[]
): string[] {
  const errors: string[] = [];

  const valid = validate(data);
  if (!valid) {
    if (validate.errors) {
      validate.errors.forEach((err) => {
        errors.push(`AJV: ${err.instancePath} ${err.message}`);
      });
    }
  }

  if (data.updateComponents) {
    validateSurfaceUpdate(data.updateComponents, errors);
  } else if (data.updateDataModel) {
    validateUpdateDataModel(data.updateDataModel, errors);
  } else if (data.createSurface) {
    validateBeginRendering(data.createSurface, errors);
  } else if (data.deleteSurface) {
    validateDeleteSurface(data.deleteSurface, errors);
  } else {
    errors.push(
      "A2UI Protocol message must have one of: updateComponents, updateDataModel, createSurface, deleteSurface."
    );
  }

  if (matchers) {
    for (const matcher of matchers) {
      const result = matcher.validate(data);
      if (!result.success) {
        errors.push(result.error!);
      }
    }
  }

  return errors;
}

function validateDeleteSurface(data: any, errors: string[]) {
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

function validateSurfaceUpdate(data: any, errors: string[]) {
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
    validateComponent(component, componentIds, errors);
  }
}

function validateUpdateDataModel(data: any, errors: string[]) {
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

function validateBeginRendering(data: any, errors: string[]) {
  if (data.surfaceId === undefined) {
    errors.push("CreateSurface message must have a 'surfaceId' property.");
  }
}

function validateBoundValue(
  prop: any,
  propName: string,
  componentId: string,
  componentType: string,
  errors: string[]
) {
  // Allow primitives directly (shorthand syntax)
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
  // If it is an object, it MUST be a path binding
  if (keys.length !== 1 || keys[0] !== "path") {
    errors.push(
      `Component '${componentId}' of type '${componentType}' property '${propName}' object must have exactly one key: 'path'. Found: ${keys.join(", ")}`
    );
  }
}

function validateComponent(
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

  if (typeof properties !== "object" || properties === null) {
    errors.push(
      `Component '${id}' has invalid properties for type '${componentType}'.`
    );
    return;
  }

  const checkRequired = (props: string[]) => {
    for (const prop of props) {
      if (properties[prop] === undefined) {
        errors.push(
          `Component '${id}' of type '${componentType}' is missing required property '${prop}'.`
        );
      }
    }
  };

  const checkRefs = (ids: (string | undefined)[]) => {
    for (const id of ids) {
      if (id && !allIds.has(id)) {
        errors.push(
          `Component '${id}' references non-existent component ID '${id}'.`
        );
      }
    }
  };

  switch (componentType) {
    case "Text":
      checkRequired(["text"]);
      if (properties.text)
        validateBoundValue(properties.text, "text", id, componentType, errors);
      break;
    case "Image":
      checkRequired(["url"]);
      if (properties.url)
        validateBoundValue(properties.url, "url", id, componentType, errors);
      break;
    case "Video":
      checkRequired(["url"]);
      if (properties.url)
        validateBoundValue(properties.url, "url", id, componentType, errors);
      break;
    case "AudioPlayer":
      checkRequired(["url"]);
      if (properties.url)
        validateBoundValue(properties.url, "url", id, componentType, errors);
      if (properties.description)
        validateBoundValue(
          properties.description,
          "description",
          id,
          componentType,
          errors
        );
      break;
    case "TextField":
      checkRequired(["label"]);
      if (properties.label)
        validateBoundValue(
          properties.label,
          "label",
          id,
          componentType,
          errors
        );
      if (properties.text)
        validateBoundValue(properties.text, "text", id, componentType, errors);
      break;
    case "DateTimeInput":
      checkRequired(["value"]);
      if (properties.value)
        validateBoundValue(
          properties.value,
          "value",
          id,
          componentType,
          errors
        );
      break;
    case "MultipleChoice":
      checkRequired(["selections", "options"]);
      if (properties.selections) {
        if (
          !Array.isArray(properties.selections) &&
          (typeof properties.selections !== "object" ||
            properties.selections === null ||
            !properties.selections.path)
        ) {
          errors.push(
            `Component '${id}' of type '${componentType}' property 'selections' must be an array of strings or an object with 'path'.`
          );
        }
      }
      if (Array.isArray(properties.options)) {
        properties.options.forEach((option: any, index: number) => {
          if (!option.label)
            errors.push(
              `Component '${id}' option at index ${index} missing 'label'.`
            );
          if (option.label)
            validateBoundValue(
              option.label,
              "label",
              id,
              componentType,
              errors
            );
          if (!option.value)
            errors.push(
              `Component '${id}' option at index ${index} missing 'value'.`
            );
        });
      }
      break;
    case "Slider":
      checkRequired(["value"]);
      if (properties.value)
        validateBoundValue(
          properties.value,
          "value",
          id,
          componentType,
          errors
        );
      break;
    case "CheckBox":
      checkRequired(["value", "label"]);
      if (properties.value)
        validateBoundValue(
          properties.value,
          "value",
          id,
          componentType,
          errors
        );
      if (properties.label)
        validateBoundValue(
          properties.label,
          "label",
          id,
          componentType,
          errors
        );
      break;
    case "Row":
    case "Column":
    case "List":
      checkRequired(["children"]);
      if (properties.children) {
        if (Array.isArray(properties.children)) {
          checkRefs(properties.children);
        } else if (
          typeof properties.children === "object" &&
          properties.children !== null
        ) {
          if (
            !properties.children.componentId ||
            !properties.children.dataBinding
          ) {
            errors.push(
              `Component '${id}' children template must have 'componentId' and 'dataBinding'.`
            );
          }
          checkRefs([properties.children.componentId]);
        } else {
          errors.push(
            `Component '${id}' children must be an array of strings or a template object.`
          );
        }
      }
      break;
    case "Card":
      checkRequired(["child"]);
      checkRefs([properties.child]);
      break;
    case "Tabs":
      checkRequired(["tabItems"]);
      if (properties.tabItems && Array.isArray(properties.tabItems)) {
        properties.tabItems.forEach((tab: any) => {
          if (!tab.title) {
            errors.push(`Tab item in component '${id}' is missing a 'title'.`);
          }
          if (!tab.child) {
            errors.push(`Tab item in component '${id}' is missing a 'child'.`);
          }
          checkRefs([tab.child]);
          if (tab.title)
            validateBoundValue(tab.title, "title", id, componentType, errors);
        });
      }
      break;
    case "Modal":
      checkRequired(["entryPointChild", "contentChild"]);
      checkRefs([properties.entryPointChild, properties.contentChild]);
      break;
    case "Button":
      checkRequired(["child", "action"]);
      checkRefs([properties.child]);
      if (!properties.action || !properties.action.name) {
        errors.push(`Component '${id}' Button action is missing a 'name'.`);
      }
      break;
    case "Divider":
      // No required properties
      break;
    case "Icon":
      checkRequired(["name"]);
      if (properties.name)
        validateBoundValue(properties.name, "name", id, componentType, errors);
      break;
    default:
      errors.push(
        `Unknown component type '${componentType}' in component '${id}'.`
      );
  }
}
