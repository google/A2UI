// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { SchemaMatcher, ValidationResult } from "./schema_matcher";

/**
 * A schema matcher that validates the presence of a component type within a
 * `surfaceUpdate` message, and optionally validates the presence and value of
 * a property on that component.
 */
export class SurfaceUpdateSchemaMatcher extends SchemaMatcher {
  constructor(
    public componentType: string,
    public propertyName?: string,
    public propertyValue?: any,
  ) {
    super();
  }

  validate(schema: any): ValidationResult {
    if (!schema.surfaceUpdate) {
      return { success: false, error: `Expected a 'surfaceUpdate' message but found none.` };
    }
    if (!Array.isArray(schema.surfaceUpdate.components)) {
      return { success: false, error: `'surfaceUpdate' message does not contain a 'components' array.` };
    }

    const components = schema.surfaceUpdate.components;
    const matchingComponents = components.filter(c => c.component && c.component[this.componentType]);

    if (matchingComponents.length === 0) {
      return { success: false, error: `Failed to find component of type '${this.componentType}'.` };
    }

    if (!this.propertyName) {
      return { success: true };
    }

    for (const component of matchingComponents) {
      const properties = component.component[this.componentType];
      if (properties && properties[this.propertyName] !== undefined) {
        if (this.propertyValue === undefined) {
          return { success: true };
        }

        const actualValue = properties[this.propertyName];
        if (this.valueMatches(actualValue, this.propertyValue)) {
          return { success: true };
        }
      }
    }

    if (this.propertyValue !== undefined) {
      return { success: false, error: `Failed to find component of type '${this.componentType}' with property '${this.propertyName}' containing value '${JSON.stringify(this.propertyValue)}'.` };
    } else {
      return { success: false, error: `Failed to find component of type '${this.componentType}' with property '${this.propertyName}'.` };
    }
  }

  private valueMatches(propertyValue: any, expectedValue: any): boolean {
    if (propertyValue === null || propertyValue === undefined) {
      return false;
    }

    if (typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
      if (propertyValue.literalString !== undefined && propertyValue.literalString === expectedValue) {
        return true;
      }
      if (propertyValue.literalNumber !== undefined && propertyValue.literalNumber === expectedValue) {
        return true;
      }
      if (propertyValue.literalBoolean !== undefined && propertyValue.literalBoolean === expectedValue) {
        return true;
      }
    }

    if (Array.isArray(propertyValue)) {
      for (const item of propertyValue) {
        if (typeof item === 'object' && item !== null) {
          if (item.value === expectedValue) {
            return true;
          }
          if (item.label && typeof item.label === 'object' && (item.label.literalString === expectedValue)) {
            return true;
          }
        } else if (item === expectedValue) {
          return true;
        }
      }
    }

    if (JSON.stringify(propertyValue) === JSON.stringify(expectedValue)) {
      return true;
    }
    
    return false;
  }
}
