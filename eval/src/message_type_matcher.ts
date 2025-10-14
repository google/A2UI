// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { SchemaMatcher, ValidationResult } from './schema_matcher';

/**
 * A concrete matcher that verifies the top-level message type.
 */
export class MessageTypeMatcher extends SchemaMatcher {
  constructor(private messageType: string) {
    super();
  }

  validate(response: object): ValidationResult {
    if (!response || typeof response !== 'object') {
      return {
        success: false,
        error: 'Response is not a valid object.',
      };
    }
    const keys = Object.keys(response);
    if (keys.length === 1 && keys[0] === this.messageType) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `Expected top-level message type to be '${
          this.messageType
        }', but found '${keys.join(', ')}'`,
      };
    }
  }

  get description(): string {
    return `Expected top-level message type to be '${this.messageType}'`;
  }
}
