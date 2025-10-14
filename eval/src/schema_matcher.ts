// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

export interface ValidationResult {
  success: boolean;
  error?: string;
}

export abstract class SchemaMatcher {
  abstract validate(schema: any): ValidationResult;
}
