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

import { SchemaMatcher, ValidationResult } from "./schema_matcher";

/**
 * A schema matcher that validates the presence of a component type within a
 * `updateComponents` message, and optionally validates the presence and value of
 * a property on that component.
 */
export class SurfaceUpdateSchemaMatcher extends SchemaMatcher {
  constructor(
    public componentType: string,
    public propertyName?: string,
    public propertyValue?: any,
    public caseInsensitive: boolean = false
  ) {
    super();
  }

  private getComponentById(components: any[], id: string): any | undefined {
    return components.find((c: any) => c.id === id);
  }

  validate(schema: any): ValidationResult {
    if (!schema.updateComponents) {
      return {
        success: false,
        error: `Expected a 'updateComponents' message but found none.`,
      };
    }
    if (!Array.isArray(schema.updateComponents.components)) {
      return {
        success: false,
        error: `'updateComponents' message does not contain a 'components' array.`,
      };
    }

    const components = schema.updateComponents.components;

    const matchingComponents = components.filter((c: any) => {
      return c.props && c.props.component === this.componentType;
    });

    if (matchingComponents.length === 0) {
      return {
        success: false,
        error: `Failed to find component of type '${this.componentType}'.`,
      };
    }

    if (!this.propertyName) {
      return { success: true };
    }

    for (const component of matchingComponents) {
      const properties = component.props;
      if (properties) {
        // Check for property directly on the component
        if (properties[this.propertyName] !== undefined) {
          if (this.propertyValue === undefined) {
            return { success: true };
          }
          const actualValue = properties[this.propertyName];
          if (this.valueMatches(actualValue, this.propertyValue)) {
            return { success: true };
          }
        }

        // Specifically for Buttons, check for label in a child Text component
        if (
          this.componentType === "Button" &&
          this.propertyName === "label" &&
          properties.child
        ) {
          const childComponent = this.getComponentById(
            components,
            properties.child
          );
          if (
            childComponent &&
            childComponent.props &&
            childComponent.props.component === "Text"
          ) {
            const textValue = childComponent.props.text;
            if (this.valueMatches(textValue, this.propertyValue)) {
              return { success: true };
            }
          }
        }
      }
    }

    if (this.propertyValue !== undefined) {
      return {
        success: false,
        error: `Failed to find component of type '${this.componentType}' with property '${this.propertyName}' containing value ${JSON.stringify(this.propertyValue)}.`,
      };
    } else {
      return {
        success: false,
        error: `Failed to find component of type '${this.componentType}' with property '${this.propertyName}'.`,
      };
    }
  }

  private valueMatches(actualValue: any, expectedValue: any): boolean {
    if (actualValue === null || actualValue === undefined) {
      return false;
    }

    const compareStrings = (s1: string, s2: string) => {
      return this.caseInsensitive
        ? s1.toLowerCase() === s2.toLowerCase()
        : s1 === s2;
    };

    // 1. Direct Primitive Match (Shorthand)
    if (typeof actualValue === "string" && typeof expectedValue === "string") {
      return compareStrings(actualValue, expectedValue);
    }
    if (typeof actualValue === "number" && typeof expectedValue === "number") {
      return actualValue === expectedValue;
    }
    if (
      typeof actualValue === "boolean" &&
      typeof expectedValue === "boolean"
    ) {
      return actualValue === expectedValue;
    }

    // 2. Object with Path (Should not match a literal expected value usually, unless expectedValue is the path object)
    if (
      typeof actualValue === "object" &&
      !Array.isArray(actualValue) &&
      actualValue.path
    ) {
      // If we are expecting a literal, a path binding is NOT a match.
      return false;
    }

    // 3. Array Match (e.g. MultipleChoice options)
    if (Array.isArray(actualValue)) {
      for (const item of actualValue) {
        // Direct match in array
        if (this.valueMatches(item, expectedValue)) {
          return true;
        }

        // Check for structures like MultipleChoice options {label: "...", value: ...}
        if (typeof item === "object" && item !== null) {
          if (item.label && this.valueMatches(item.label, expectedValue)) {
            return true;
          }
          if (item.value && this.valueMatches(item.value, expectedValue)) {
            return true;
          }
        }
      }
    }

    // Fallback to direct comparison (e.g. for objects)
    return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
  }
}
