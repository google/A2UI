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

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject

class CatalogPruningTest {

  @Test
  fun omitsEmptyCommonTypesFromLlmInstructions() {
    val catalogEmpty =
      A2uiCatalog(
        version = A2uiVersion.VERSION_0_9,
        name = "test",
        serverToClientSchema = JsonObject(emptyMap()),
        commonTypesSchema = JsonObject(emptyMap()),
        catalogSchema = JsonObject(mapOf(A2uiConstants.CATALOG_ID_KEY to JsonPrimitive("test_id"))),
      )
    assertFalse(catalogEmpty.renderAsLlmInstructions().contains("### Common Types Schema:"))

    val catalogNoDefs =
      A2uiCatalog(
        version = A2uiVersion.VERSION_0_9,
        name = "test",
        serverToClientSchema = JsonObject(emptyMap()),
        commonTypesSchema = JsonObject(mapOf("something" to JsonPrimitive("else"))),
        catalogSchema = JsonObject(mapOf(A2uiConstants.CATALOG_ID_KEY to JsonPrimitive("test_id"))),
      )
    assertFalse(catalogNoDefs.renderAsLlmInstructions().contains("### Common Types Schema:"))

    val catalogEmptyDefs =
      A2uiCatalog(
        version = A2uiVersion.VERSION_0_9,
        name = "test",
        serverToClientSchema = JsonObject(emptyMap()),
        commonTypesSchema = JsonObject(mapOf("\$defs" to JsonObject(emptyMap()))),
        catalogSchema = JsonObject(mapOf(A2uiConstants.CATALOG_ID_KEY to JsonPrimitive("test_id"))),
      )
    assertFalse(catalogEmptyDefs.renderAsLlmInstructions().contains("### Common Types Schema:"))
  }

  @Test
  fun prunesUnusedCommonTypesCorrectly() {
    val commonTypes =
      JsonObject(
        mapOf(
          "\$defs" to
            JsonObject(
              mapOf(
                "TypeForCompA" to
                  JsonObject(
                    mapOf(
                      "type" to JsonPrimitive("string"),
                      "\$ref" to JsonPrimitive("#/\$defs/SubtypeForA"),
                    )
                  ),
                "TypeForCompB" to JsonObject(mapOf("type" to JsonPrimitive("number"))),
                "SubtypeForA" to JsonObject(mapOf("type" to JsonPrimitive("boolean"))),
              )
            )
        )
      )

    val catalogSchema =
      JsonObject(
        mapOf(
          A2uiConstants.CATALOG_ID_KEY to JsonPrimitive("basic"),
          A2uiConstants.CATALOG_COMPONENTS_KEY to
            JsonObject(
              mapOf(
                "CompA" to
                  JsonObject(
                    mapOf("\$ref" to JsonPrimitive("common_types.json#/\$defs/TypeForCompA"))
                  ),
                "CompB" to
                  JsonObject(
                    mapOf("\$ref" to JsonPrimitive("common_types.json#/\$defs/TypeForCompB"))
                  ),
              )
            ),
        )
      )

    val catalog =
      A2uiCatalog(
        version = A2uiVersion.VERSION_0_9,
        name = "test",
        serverToClientSchema = JsonObject(emptyMap()),
        commonTypesSchema = commonTypes,
        catalogSchema = catalogSchema,
      )

    val prunedCatalog = catalog.withPrunedComponents(listOf("CompA"))
    val prunedDefs = prunedCatalog.commonTypesSchema["\$defs"]?.jsonObject

    assertTrue(prunedDefs != null)
    assertTrue(prunedDefs.containsKey("TypeForCompA"))
    assertTrue(prunedDefs.containsKey("SubtypeForA"))
    assertFalse(prunedDefs.containsKey("TypeForCompB"))
  }
}
