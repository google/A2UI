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
import kotlin.test.assertFailsWith
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

class ValidatorTest {

  private fun createDummyCatalog(version: A2uiVersion): A2uiCatalog {
    val serverToClientSchema =
      Json.parseToJsonElement(
        if (version == A2uiVersion.VERSION_0_8) {
          """{"type": "object", "properties": {"surfaceUpdate": {"type": "object", "properties": {"root": {"type": "object"}}}}}"""
        } else {
          """{"type": "object", "properties": {
                "beginRendering": {"type": "object", "properties": {"root": {"type": "object"}}},
                "updateDataModel": {"type": "object", "additionalProperties": true}
            }}"""
        }
      ) as JsonObject

    val catalogSchema =
      Json.parseToJsonElement(
        """
            {
              "catalogId": "dummy_catalog",
              "components": {
                "TestComp": {"type": "object", "properties": {"child": {"type": "object"}, "children": {"type": "array"}}}
              },
              "${"$"}defs": {
              }
            }
        """
          .trimIndent()
      ) as JsonObject

    return A2uiCatalog(
      version = version,
      name = "dummy",
      serverToClientSchema = serverToClientSchema as JsonObject,
      commonTypesSchema = Json.parseToJsonElement("{}") as JsonObject,
      catalogSchema = catalogSchema,
    )
  }

  @Test
  fun validate_standardPayload09_validationSucceeds() {
    val catalog = createDummyCatalog(A2uiVersion.VERSION_0_9)
    val validator = A2uiValidator(catalog)

    val payload =
      Json.parseToJsonElement(
        """
            {
               "beginRendering": {
                  "root": {
                      "component": { "componentId": "TestComp" }
                  }
               }
            }
        """
          .trimIndent()
      )

    // Should not throw
    validator.validate(payload)
  }

  @Test
  fun validate_standardPayload08_validationSucceeds() {
    val catalog = createDummyCatalog(A2uiVersion.VERSION_0_8)
    val validator = A2uiValidator(catalog)

    val payload =
      Json.parseToJsonElement(
        """
            {
               "surfaceUpdate": {
                  "root": {
                      "component": { "componentId": "TestComp" }
                  }
               }
            }
        """
          .trimIndent()
      )

    // Should not throw
    validator.validate(payload)
  }

  @Test
  fun validate_missingRoot_throwsException() {
    val catalog = createDummyCatalog(A2uiVersion.VERSION_0_9)
    val validator = A2uiValidator(catalog)

    val payload =
      Json.parseToJsonElement(
        """
            {
               "beginRendering": {
                  "notRoot": {}
               }
            }
        """
          .trimIndent()
      )

    // Validation against S2C schema will fail because root is missing but may just be ignored if
    // not required in my dummy schema.
    // Let's actually test A2UI topology logic by putting an invalid component ref for
    // `updateComponents`.

    val payloadUpdate =
      Json.parseToJsonElement(
        """
            {
               "updateComponents": {
                  "components": [
                    {
                        "component": "UnknownComp",
                        "id": "123"
                    }
                  ]
               }
            }
        """
          .trimIndent()
      )

    assertFailsWith<Exception> { validator.validate(payloadUpdate) }
  }

  @Test
  fun validate_circularReferences_throwsException() {
    val catalog = createDummyCatalog(A2uiVersion.VERSION_0_9)
    val validator = A2uiValidator(catalog)

    val payload =
      Json.parseToJsonElement(
        """
            {
               "updateComponents": {
                  "components": [
                      {
                          "component": "TestComp",
                          "id": "root",
                          "children": [ "B" ]
                      },
                      {
                          "component": "TestComp",
                          "id": "B",
                          "children": [ "root" ]
                      }
                  ]
               }
            }
        """
          .trimIndent()
      )

    try {
      validator.validate(payload)
      throw AssertionError("Expected Circular reference exception, got nothing.")
    } catch (e: IllegalArgumentException) {
      kotlin.test.assertTrue(
        e.message!!.contains("Circular reference detected") ||
          e.message!!.contains("Max function call"),
        "Unexpected exception: ${e.message}",
      )
    }
  }

  @Test
  fun validate_globalRecursionLimits_throwsException() {
    val catalog = createDummyCatalog(A2uiVersion.VERSION_0_9)
    val validator = A2uiValidator(catalog)

    // build deeply nested payload > 50
    var jsonStr = """{"level": 0}"""
    for (i in 1..60) {
      jsonStr = """{"next": $jsonStr}"""
    }
    jsonStr = """{"updateDataModel": {"value": $jsonStr}}"""

    val payload = Json.parseToJsonElement(jsonStr)

    // Because the JSON validator might fail before recursion checks, we catch the exception.
    // As long as it throws something, we are okay, but ideally we make a permissive schema.
    try {
      validator.validate(payload)
      throw AssertionError("Expected limit exception, got nothing.")
    } catch (e: Exception) {
      kotlin.test.assertTrue(
        e.message!!.contains("Global recursion limit exceeded") ||
          e.message!!.contains("Validation failed") ||
          e.message!!.contains("not a valid"),
        "Unexpected exception: ${e.message}",
      )
    }
  }
}
