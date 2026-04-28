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

package com.google.a2ui.core.schema

import java.io.File
import kotlin.test.Test
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

class CatalogTest {

  private fun createDummyCatalog(): A2uiCatalog {
    val serverToClientSchema = Json.parseToJsonElement("""{"s2c": true}""") as JsonObject
    val common = Json.parseToJsonElement("""{"common": true}""") as JsonObject
    val catalogSchema =
      Json.parseToJsonElement(
        """
            {
              "catalogId": "dummy_catalog",
              "components": {
                "AllowedComp": {"type": "object"},
                "PrunedComp": {"type": "object"}
              },
              "${"$"}defs": {
                "anyComponent": {
                  "oneOf": [
                    {"${"$"}ref": "#/components/AllowedComp"},
                    {"${"$"}ref": "#/components/PrunedComp"},
                    {"${"$"}ref": "https://a2ui.org/other"}
                  ]
                }
              }
            }
        """
          .trimIndent()
      ) as JsonObject

    return A2uiCatalog(
      version = A2uiVersion.VERSION_0_9,
      name = "dummy",
      serverToClientSchema = serverToClientSchema,
      commonTypesSchema = common,
      catalogSchema = catalogSchema,
    )
  }

  @Test
  fun catalog_rendersAsLlmInstructions() {
    val catalog = createDummyCatalog()
    val instructions = catalog.renderAsLlmInstructions()

    assertTrue(instructions.startsWith(A2uiConstants.A2UI_SCHEMA_BLOCK_START))
    assertTrue(instructions.endsWith(A2uiConstants.A2UI_SCHEMA_BLOCK_END))
    assertTrue(instructions.contains("### Server To Client Schema:\n{\"s2c\":true}"))
    assertTrue(instructions.contains("### Common Types Schema:\n{\"common\":true}"))
    assertTrue(instructions.contains("### Catalog Schema:\n{"))
  }

}
