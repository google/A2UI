/*
 * Copyright 2026 Google LLC
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

import { describe, it } from "node:test";
import * as assert from "node:assert";
import { readFileSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { BASIC_COMPONENTS } from "./basic_components.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// `__dirname` will be `dist/src/v0_9/basic_catalog/components` when run via `node --test dist/**/*.test.js`
const SPEC_DIR_V0_9 = resolve(
  __dirname,
  "../../../../../../../specification/v0_9/json",
);

/**
 * In Zod 4, `.describe()` sets metadata that does not propagate through
 * `.optional()` / `.default()`. This helper unwraps wrappers to find the
 * description on the innermost schema that carries it.
 */
function getZodDescription(zodObj: any): string | undefined {
  if (!zodObj) return undefined;
  if (zodObj.description !== undefined) return zodObj.description;
  let current = zodObj;
  while (current?._def?.innerType) {
    current = current._def.innerType;
    if (current.description !== undefined) return current.description;
  }
  return undefined;
}

function getZodShape(zodObj: any): any {
  let current = zodObj;
  while (current?._def) {
    if (current._def.type === "object") return current.shape ?? current._def.shape;
    current = current._def.innerType ?? current._def.schema;
  }
  return undefined;
}

function getZodArrayElement(zodObj: any): any {
  let current = zodObj;
  while (current?._def) {
    if (current._def.type === "array") return current._def.element;
    current = current._def.innerType ?? current._def.schema;
  }
  return undefined;
}

describe("Basic Components Schema Verification", () => {
  it("verifies all basic components exist in the catalog and their required properties and descriptions align", () => {
    const jsonSpecPath = join(SPEC_DIR_V0_9, "basic_catalog.json");
    const officialSchema = JSON.parse(readFileSync(jsonSpecPath, "utf-8"));

    const componentsMap = officialSchema.components;

    for (const api of BASIC_COMPONENTS) {
      const componentName = api.name;
      const jsonComponentDef = componentsMap[componentName];
      assert.ok(
        jsonComponentDef,
        `Component ${componentName} not found in basic_catalog.json`
      );

      const specificPropsDef = jsonComponentDef.allOf.find(
        (item: any) => item.properties && item.properties.component
      );

      assert.ok(
        specificPropsDef,
        `Could not find specific properties definition for ${componentName} in basic_catalog.json`
      );
      
      if (specificPropsDef.description) {
        assert.strictEqual(
           getZodDescription(api.schema),
           specificPropsDef.description,
           `Component description mismatch for ${componentName}`
        );
      }

      const jsonProperties = specificPropsDef.properties;
      const jsonRequired = specificPropsDef.required || [];

      const zodShape = getZodShape(api.schema);
      
      // Check CatalogComponentCommon properties which are not in specificPropsDef but in allOf
      const catalogCommonDef = officialSchema.$defs.CatalogComponentCommon;
      if (catalogCommonDef?.properties) {
        for (const propName in catalogCommonDef.properties) {
          const jsonProp = catalogCommonDef.properties[propName];
          if (zodShape[propName] && jsonProp.description) {
            assert.strictEqual(
              getZodDescription(zodShape[propName]),
              jsonProp.description,
              `Description mismatch for common property '${propName}' of component '${componentName}'`
            );
          }
        }
      }

      for (const propName of Object.keys(jsonProperties)) {
        if (propName === "component") continue; // Handled by envelope
        const jsonProp = jsonProperties[propName];
        const zodPropSchema = zodShape[propName];

        assert.ok(
          zodPropSchema,
          `Property '${propName}' is missing in Zod schema for component '${componentName}'`
        );
        
        if (jsonProp.description) {
          assert.strictEqual(
            getZodDescription(zodPropSchema),
            jsonProp.description,
            `Description mismatch for property '${propName}' of component '${componentName}'`
          );
        }

        // Check array items
        if (jsonProp.type === "array" && jsonProp.items && jsonProp.items.properties) {
          const itemProps = jsonProp.items.properties;
          const zodItemShape = getZodShape(getZodArrayElement(zodPropSchema));
          for (const itemProp of Object.keys(itemProps)) {
            if (itemProps[itemProp].description) {
               assert.strictEqual(
                 getZodDescription(zodItemShape[itemProp]),
                 itemProps[itemProp].description,
                 `Description mismatch for array item property '${propName}.${itemProp}' of component '${componentName}'`
               );
            }
          }
        }
      }

      for (const reqProp of jsonRequired) {
        if (reqProp === "component") continue;
        assert.ok(
          zodShape[reqProp],
          `Required property '${reqProp}' from JSON schema is missing in Zod schema for component '${componentName}'`
        );
        
        const propSchema = zodShape[reqProp];
        let isOptional = false;
        let current = propSchema;
        while (current && current._def) {
          if (current._def.type === "optional" || current._def.type === "default") {
            isOptional = true;
            break;
          }
          current = current._def.innerType;
        }

        if (isOptional) {
           assert.fail(`Property '${reqProp}' is required in JSON but optional/default in Zod for '${componentName}'`);
        }
      }
    }
  });
});
