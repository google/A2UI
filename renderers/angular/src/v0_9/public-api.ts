/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Core Services and Components
export * from './core/a2ui-renderer.service';
export * from './core/component-host.component';
export * from './core/component-binder.service';
export * from './core/types';
export * from './core/utils';

// Catalog Types and Implementations
export * from './catalog/types';
export * from './catalog/minimal/minimal-catalog';

// Minimal Catalog Components
export * from './catalog/minimal/text.component';
export * from './catalog/minimal/row.component';
export * from './catalog/minimal/column.component';
export * from './catalog/minimal/button.component';
export * from './catalog/minimal/text-field.component';
