// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { ComponentUpdateSchemaMatcher } from './component_update_schema_matcher';

export function validateSchema(
  data: any,
  expectedMessageType: string,
  matchers?: ComponentUpdateSchemaMatcher[]
): string[] {
  const errors: string[] = [];

  const topLevelKeys = Object.keys(data);
  const hasSurfaceId = topLevelKeys.includes('surfaceId');
  const messageKeys = topLevelKeys.filter(k => k !== 'surfaceId');

  if (messageKeys.length !== 1 || messageKeys[0] !== expectedMessageType) {
    errors.push(
      `Generated JSON should have exactly one message key: '${expectedMessageType}'. Found: ${messageKeys}`
    );
    return errors;
  }

  if (topLevelKeys.length > 2) {
    errors.push(
      `Generated JSON has too many properties. It should only have one message key and an optional 'surfaceId'. Found: ${topLevelKeys}`
    );
    return errors;
  }

  switch (expectedMessageType) {
    case 'surfaceUpdate':
      validateComponentUpdate(data.surfaceUpdate, errors);
      if (matchers) {
        for (const matcher of matchers) {
          const result = matcher.validate(data);
          if (!result.success) {
            errors.push(result.error!);
          }
        }
      }
      break;
    case 'dataModelUpdate':
      validateDataModelUpdate(data.dataModelUpdate, errors);
      break;
    case 'beginRendering':
      validateBeginRendering(data.beginRendering, errors);
      break;
    default:
      errors.push(
        `Unknown expected message type for validation: ${expectedMessageType}`
      );
  }

  return errors;
}

function validateComponentUpdate(data: any, errors: string[]) {
  if (!data.components || !Array.isArray(data.components)) {
    errors.push("SurfaceUpdate must have a 'components' array.");
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
  const allowed = ['path', 'contents'];
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
    errors.push(`Component '${component.id}' is missing 'componentProperties'.`);
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
    case 'Heading':
      checkRequired(['text']);
      break;
    case 'Text':
      checkRequired(['text']);
      break;
    case 'Image':
      checkRequired(['url']);
      break;
    case 'Video':
      checkRequired(['url']);
      break;
    case 'AudioPlayer':
      checkRequired(['url']);
      break;
    case 'TextField':
      checkRequired(['label']);
      break;
    case 'DateTimeInput':
      checkRequired(['value']);
      break;
    case 'MultipleChoice':
      checkRequired(['selections']);
      break;
    case 'Slider':
      checkRequired(['value']);
      break;
    case 'CheckBox':
      checkRequired(['value', 'label']);
      break;
    case 'Row':
    case 'Column':
    case 'List':
      checkRequired(['children']);
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
    case 'Card':
      checkRequired(['child']);
      checkRefs([properties.child]);
      break;
    case 'Tabs':
      checkRequired(['tabItems']);
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
    case 'Modal':
      checkRequired(['entryPointChild', 'contentChild']);
      checkRefs([properties.entryPointChild, properties.contentChild]);
      break;
    case 'Button':
      checkRequired(['label', 'action']);
      break;
    case 'Divider':
      // No required properties
      break;
    default:
      errors.push(
        `Unknown component type '${componentType}' in component '${component.id}'.`
      );
  }
}
