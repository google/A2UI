/**
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

export * from './A2uiSurface';
export * from './adapter';
export * from './catalog/minimal';
export * from './catalog/basic';
// Minimal catalog components are exported from here for backwards compatibility or specific use.
export {Button as MinimalButton} from './catalog/minimal/components/Button';
export {Column as MinimalColumn} from './catalog/minimal/components/Column';
export {Row as MinimalRow} from './catalog/minimal/components/Row';
export {Text as MinimalText} from './catalog/minimal/components/Text';
export {TextField as MinimalTextField} from './catalog/minimal/components/TextField';
export * from './catalog/minimal/components/ChildList';
