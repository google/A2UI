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

import { z } from "zod";
import { createFunctionImplementation } from "@a2ui/web_core/v0_9";

export const CapitalizeApi = {
  name: "capitalize" as const,
  returnType: "string" as const,
  schema: z.object({
    value: z.preprocess(v => v === undefined ? undefined : String(v), z.string()).optional()
  }) as z.ZodType<any, any, any>
};

export const CapitalizeImplementation = createFunctionImplementation(
  CapitalizeApi as any,
  (args) => {
    if (!args.value) return "";
    return args.value.charAt(0).toUpperCase() + args.value.slice(1);
  }
);