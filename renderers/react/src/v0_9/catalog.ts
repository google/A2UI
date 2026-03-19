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

import { Catalog, createFunctionImplementation } from "@a2ui/web_core/v0_9";
import { ReactText } from "./components/ReactText";
import { ReactButton } from "./components/ReactButton";
import { ReactRow } from "./components/ReactRow";
import { ReactColumn } from "./components/ReactColumn";
import { ReactTextField } from "./components/ReactTextField";
import type { ReactComponentImplementation } from "./adapter";
import { z } from "zod";

const minimalComponents: ReactComponentImplementation[] = [
  ReactText,
  ReactButton,
  ReactRow,
  ReactColumn,
  ReactTextField
];

export const minimalCatalog = new Catalog<ReactComponentImplementation>(
  "https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json",
  minimalComponents,
  [
    createFunctionImplementation(
      {
        name: "capitalize",
        returnType: "string",
        schema: z.object({
          value: z.any()
        })
      },
      (args) => {
        const val = args.value;
        if (typeof val === "string") {
          return val.toUpperCase();
        }
        return val as string;
      }
    )
  ]
);