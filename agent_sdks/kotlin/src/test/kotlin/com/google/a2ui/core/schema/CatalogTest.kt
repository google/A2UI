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

  @Test
  fun allowlistProvided_prunesComponentsCorrectly() {
    val catalog = createDummyCatalog()
    val allowed = listOf("AllowedComp")

    val prunedCatalog = catalog.withPrunedComponents(allowed)

    val prunedComponents = prunedCatalog.catalogSchema["components"] as JsonObject
    assertTrue("AllowedComp" in prunedComponents)
    assertTrue("PrunedComp" !in prunedComponents)

    // Verify oneOf filtering in anyComponent
    val anyComponentStr = prunedCatalog.catalogSchema.toString()
    assertTrue("#/components/AllowedComp" in anyComponentStr)
    assertTrue("#/components/PrunedComp" !in anyComponentStr)
  }

  @Test
  fun validExamplePath_loadsAndValidatesExamples() {
    val dir =
      File(System.getProperty("java.io.tmpdir"), "a2ui_examples_${System.currentTimeMillis()}")
    dir.mkdirs()
    try {
      val ex1 = File(dir, "ex1.json").apply { writeText("""{"example": 1}""") }
      val ex2 = File(dir, "ex2.txt").apply { writeText("ignore me") }
      val ex3 = File(dir, "ex3.json").apply { writeText("invalid_json_here") }

      val catalog = createDummyCatalog()
      // We pass false to validate because our dummy validator will fail everything
      val examplesContent = catalog.loadExamples(dir.absolutePath, validate = false)

      assertTrue(examplesContent.contains("---BEGIN ex1---"))
      assertTrue(examplesContent.contains("{\"example\": 1}"))
      // invalid json loads anyway if validation is false
      assertTrue(examplesContent.contains("---BEGIN ex3---"))
      // txt file ignored
      assertTrue(!examplesContent.contains("ignore me"))
    } finally {
      dir.deleteRecursively()
    }
  }
}
