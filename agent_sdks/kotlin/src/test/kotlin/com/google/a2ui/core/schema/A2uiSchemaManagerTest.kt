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
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject

class A2uiSchemaManagerTest {

  private val dummyProvider =
    object : A2uiCatalogProvider {
      override fun load(): JsonObject {
        return Json.parseToJsonElement(
            """
                {
                  "catalogId": "test_cat",
                  "components": {
                     "TestComp": {
                       "type": "object"
                     }
                  }
                }
            """
          )
          .jsonObject
      }
    }

  private val catalogConfig = CatalogConfig("Test", dummyProvider)

  @Test
  fun instantiation_localCatalogSet_succeeds() {
    val manager = A2uiSchemaManager(A2uiVersion.VERSION_0_9, listOf(catalogConfig))
    assertEquals(listOf("test_cat"), manager.supportedCatalogIds)
  }

  @Test
  fun getSystemPrompt_promptRequested_returnsInstructions() {
    val manager = A2uiSchemaManager(A2uiVersion.VERSION_0_9, listOf(catalogConfig))
    val prompt =
      manager.generateSystemPrompt(
        roleDescription = "You are a helpful UI agent.",
        workflowDescription = "Render simple UI.",
        uiDescription = "Use TestComp heavily.",
        clientUiCapabilities = null,
        allowedComponents = emptyList(),
        includeSchema = true,
        includeExamples = false,
        validateExamples = false,
      )

    assertTrue(prompt.contains("You are a helpful UI agent."))
    assertTrue(prompt.contains("## Workflow Description:\n"))
    assertTrue(prompt.contains("Render simple UI."))
    assertTrue(prompt.contains("## UI Description:\nUse TestComp heavily."))
    assertTrue(prompt.contains(A2uiConstants.A2UI_SCHEMA_BLOCK_START))
    assertTrue(prompt.contains("\"test_cat\""))
  }

  @Test
  fun getSelectedCatalog_inlineCatalogsCapabilityProvided_returnsInlineCatalog() {
    // manager must have acceptsInlineCatalogs = true
    val manager =
      A2uiSchemaManager(
        version = A2uiVersion.VERSION_0_9,
        catalogs = listOf(catalogConfig),
        acceptsInlineCatalogs = true,
      )

    val inlineCaps =
      Json.parseToJsonElement(
          """
            {
              "inlineCatalogs": [
                {
                  "components": {
                    "client_comp": {"type": "object"}
                  }
                }
              ]
            }
        """
        )
        .jsonObject

    val catalog = manager.getSelectedCatalog(inlineCaps, emptyList())
    assertEquals("test_cat", catalog.catalogId) // Base catalog ID is preserved
    assertEquals("inline", catalog.name)
    assertTrue(
      "TestComp" in catalog.catalogSchema[A2uiConstants.CATALOG_COMPONENTS_KEY]!!.jsonObject
    )
    assertTrue(
      "client_comp" in catalog.catalogSchema[A2uiConstants.CATALOG_COMPONENTS_KEY]!!.jsonObject
    )
  }

  @Test
  fun getSelectedCatalog_inlineCatalogsDisabled_returnsFallback() {
    val manager =
      A2uiSchemaManager(
        version = A2uiVersion.VERSION_0_9,
        catalogs = listOf(catalogConfig),
        acceptsInlineCatalogs = false, // Disabled
      )

    val inlineCaps =
      Json.parseToJsonElement(
          """
            { "inlineCatalogs": [{"catalogId": "inline", "components": {}}] }
        """
        )
        .jsonObject

    assertFailsWith<IllegalArgumentException>("Agent does not accept inline catalogs") {
      manager.getSelectedCatalog(inlineCaps, emptyList())
    }
  }

  @Test
  fun getSelectedCatalog_unsupportedCatalogRequested_throwsException() {
    val manager = A2uiSchemaManager(A2uiVersion.VERSION_0_9, listOf(catalogConfig))

    val caps =
      Json.parseToJsonElement(
          """
            { "supportedCatalogIds": ["unknown_catalog_id"] }
        """
        )
        .jsonObject

    assertFailsWith<IllegalArgumentException>("No client-supported catalog found") {
      manager.getSelectedCatalog(caps, emptyList())
    }
  }

  @Test
  fun getSelectedCatalog_inlineAndSupportedCapabilitiesProvided_mergesOntoSpecifiedBase() {
    val manager =
      A2uiSchemaManager(
        version = A2uiVersion.VERSION_0_9,
        catalogs = listOf(catalogConfig),
        acceptsInlineCatalogs = true,
      )

    val caps =
      Json.parseToJsonElement(
          """
            {
              "supportedCatalogIds": ["test_cat"],
              "inlineCatalogs": [
                {
                  "components": {
                    "client_comp": {"type": "object"}
                  }
                }
              ]
            }
        """
        )
        .jsonObject

    val catalog = manager.getSelectedCatalog(caps, emptyList())
    assertEquals("test_cat", catalog.catalogId)
    assertTrue(
      "TestComp" in catalog.catalogSchema[A2uiConstants.CATALOG_COMPONENTS_KEY]!!.jsonObject
    )
    assertTrue(
      "client_comp" in catalog.catalogSchema[A2uiConstants.CATALOG_COMPONENTS_KEY]!!.jsonObject
    )
  }
}
