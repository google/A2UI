/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Catalog } from "@a2ui/web_core/v0_9";
import { A2uiText } from "./components/Text.js";
import { A2uiButton } from "./components/Button.js";
import { A2uiTextField } from "./components/TextField.js";
import { A2uiRow } from "./components/Row.js";
import { A2uiColumn } from "./components/Column.js";
import { CapitalizeImplementation } from "./functions/capitalize.js";
import { LitComponentApi } from "@a2ui/lit/v0_9";

/**
 * The minimal catalog for A2UI components in Lit.
 *
 * This catalog includes basic components like text, button, text field, row, and column,
 * as well as the capitalize function.
 */
export const minimalCatalog = new Catalog<LitComponentApi>(
  "https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json",
  [A2uiText, A2uiButton, A2uiTextField, A2uiRow, A2uiColumn],
  [CapitalizeImplementation],
);
