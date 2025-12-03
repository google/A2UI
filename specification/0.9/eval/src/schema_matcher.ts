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

export interface ValidationResult {
  success: boolean;
  error?: string;
}

export abstract class SchemaMatcher {
  /**
   * A human-readable description of what this matcher is looking for.
   */
  abstract get description(): string;

  /**
   * Validates that the given schema satisfies the matcher's criteria.
   * @param schema The schema to validate (e.g. a message object).
   */
  abstract validate(schema: any): ValidationResult;
}
