// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { SchemaMatcher, ValidationResult } from "./schema_matcher";

export class BasicSchemaMatcher extends SchemaMatcher {
  constructor(
    public propertyName: string,
    public propertyValue?: any,
  ) {
    super();
  }

  validate(schema: any): ValidationResult {
    if (!schema) {
      const result: ValidationResult = {
        success: false,
        error: "Schema is undefined.",
      };
      return result;
    }

    const actualValue = schema[this.propertyName];

    if (actualValue === undefined) {
      const error = `Failed to find property '${this.propertyName}'.`;
      return { success: false, error };
    }

    if (this.propertyValue !== undefined) {
      if (JSON.stringify(actualValue) !== JSON.stringify(this.propertyValue)) {
        const error = `Property '${
          this.propertyName
        }' has value '${JSON.stringify(
          actualValue,
        )}', but expected '${JSON.stringify(this.propertyValue)}'.`;
        return { success: false, error };
      }
    }

    return { success: true };
  }
}
