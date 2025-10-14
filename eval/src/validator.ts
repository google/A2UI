// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { ComponentUpdateSchemaMatcher } from "./component_update_schema_matcher";
import { SchemaMatcher } from "./schema_matcher";

export function validateSchema(
  data: any,
  schemaName: string,
  matchers?: SchemaMatcher[]
): string[] {
  const errors: string[] = [];
  if (data.surfaceUpdate) {
    validateComponentUpdate(data.surfaceUpdate, errors);
  } else if (data.dataModelUpdate) {
    validateDataModelUpdate(data.dataModelUpdate, errors);
  } else if (data.beginRendering) {
    validateBeginRendering(data.beginRendering, errors);
  } else if (data.surfaceDeletion) {
    validateSurfaceDeletion(data.surfaceDeletion, errors);
  } else {
    errors.push(
      "A2UI Protocol message must have one of: surfaceUpdate, dataModelUpdate, beginRendering, surfaceDeletion."
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

function validateSurfaceDeletion(data: any, errors: string[]) {
  if (data.delete !== true) {
    errors.push('SurfaceDeletion must have a "delete" property set to true.');
  }
  const allowed = ["delete"];
  for (const key in data) {
    if (!allowed.includes(key)) {
      errors.push(`SurfaceDeletion has unexpected property: ${key}`);
    }
  }
}

function validateComponentUpdate(data: any, errors: string[]) {
  if (!data.components || !Array.isArray(data.components)) {
    errors.push("ComponentUpdate must have a 'components' array.");
    return;
  }

  const componentIds = new Set<string>();
  for (const c of data.components) {
    if (c.id) {
      if (componentIds.has(c.id)) {
        errors.push(`Duplicate component ID found: ${c.id}`);
      }
      componentIds.add(c.id);
    }
  }

  for (const component of data.components) {
    validateComponent(component, componentIds, errors);
  }
}

function validateDataModelUpdate(data: any, errors: string[]) {
  if (data.contents === undefined) {
    errors.push("DataModelUpdate must have a 'contents' property.");
  }
  const allowed = ["path", "contents"];
  for (const key in data) {
    if (!allowed.includes(key)) {
      errors.push(`DataModelUpdate has unexpected property: ${key}`);
    }
  }
}

function validateBeginRendering(data: any, errors: string[]) {
  if (!data.root) {
    errors.push("BeginRendering message must have a 'root' property.");
  }
}

function validateComponent(
  component: any,
  allIds: Set<string>,
  errors: string[]
) {
  if (!component.id) {
    errors.push(`Component is missing an 'id'.`);
    return;
  }
  if (!component.componentProperties) {
    errors.push(
      `Component '${component.id}' is missing 'componentProperties'.`
    );
    return;
  }

  const componentTypes = Object.keys(component.componentProperties);
  if (componentTypes.length !== 1) {
    errors.push(
      `Component '${component.id}' must have exactly one property in 'componentProperties', but found ${componentTypes.length}.`
    );
    return;
  }

  const componentType = componentTypes[0];
  const properties = component.componentProperties[componentType];

  const checkRequired = (props: string[]) => {
    for (const prop of props) {
      if (properties[prop] === undefined) {
        errors.push(
          `Component '${component.id}' of type '${componentType}' is missing required property '${prop}'.`
        );
      }
    }
  };

  const checkRefs = (ids: (string | undefined)[]) => {
    for (const id of ids) {
      if (id && !allIds.has(id)) {
        errors.push(
          `Component '${component.id}' references non-existent component ID '${id}'.`
        );
      }
    }
  };

  switch (componentType) {
    case "Heading":
      checkRequired(["text"]);
      break;
    case "Text":
      checkRequired(["text"]);
      break;
    case "Image":
      checkRequired(["url"]);
      break;
    case "Video":
      checkRequired(["url"]);
      break;
    case "AudioPlayer":
      checkRequired(["url"]);
      break;
    case "TextField":
      checkRequired(["label"]);
      break;
    case "DateTimeInput":
      checkRequired(["value"]);
      break;
    case "MultipleChoice":
      checkRequired(["selections"]);
      break;
    case "Slider":
      checkRequired(["value"]);
      break;
    case "CheckBox":
      checkRequired(["value", "label"]);
      break;
    case "Row":
    case "Column":
    case "List":
      checkRequired(["children"]);
      if (properties.children) {
        const hasExplicit = !!properties.children.explicitList;
        const hasTemplate = !!properties.children.template;
        if ((hasExplicit && hasTemplate) || (!hasExplicit && !hasTemplate)) {
          errors.push(
            `Component '${component.id}' must have either 'explicitList' or 'template' in children, but not both or neither.`
          );
        }
        if (hasExplicit) {
          checkRefs(properties.children.explicitList);
        }
        if (hasTemplate) {
          checkRefs([properties.children.template?.componentId]);
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
            errors.push(
              `Tab item in component '${component.id}' is missing a 'title'.`
            );
          }
          if (!tab.child) {
            errors.push(
              `Tab item in component '${component.id}' is missing a 'child'.`
            );
          }
          checkRefs([tab.child]);
        });
      }
      break;
    case "Modal":
      checkRequired(["entryPointChild", "contentChild"]);
      checkRefs([properties.entryPointChild, properties.contentChild]);
      break;
    case "Button":
      checkRequired(["label", "action"]);
      break;
    case "Divider":
      // No required properties
      break;
    default:
      errors.push(
        `Unknown component type '${componentType}' in component '${component.id}'.`
      );
  }
}
